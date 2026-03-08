import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, shortId, expireAt, customName } = await req.json();

    if (!url || !shortId) {
      return new Response(JSON.stringify({ error: 'url and shortId are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch the remote file
    const response = await fetch(url);
    if (!response.ok) {
      return new Response(JSON.stringify({ error: `Failed to fetch URL: ${response.status} ${response.statusText}` }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    const contentLength = response.headers.get('content-length');
    const fileSize = contentLength ? parseInt(contentLength, 10) : 0;

    // Extract filename from URL or content-disposition
    const contentDisposition = response.headers.get('content-disposition');
    let fileName = 'downloaded-file';
    if (contentDisposition) {
      const match = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      if (match) fileName = match[1].replace(/['"]/g, '');
    } else {
      try {
        const urlPath = new URL(url).pathname;
        const segments = urlPath.split('/').filter(Boolean);
        if (segments.length > 0) {
          fileName = decodeURIComponent(segments[segments.length - 1]);
        }
      } catch { /* keep default */ }
    }

    // Get file extension
    const ext = fileName.includes('.') ? fileName.split('.').pop() : 'bin';
    const storagePath = `${shortId}.${ext}`;

    const fileData = await response.arrayBuffer();
    const actualSize = fileData.byteLength;

    // Check size limit (100MB)
    if (actualSize > 100 * 1024 * 1024) {
      return new Response(JSON.stringify({ error: 'File exceeds 100MB limit' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from('uploads')
      .upload(storagePath, fileData, {
        contentType,
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) throw uploadError;

    // Create database record
    const { data: uploadRecord, error: dbError } = await supabase
      .from('uploads')
      .insert({
        short_id: shortId,
        file_name: fileName,
        file_size: actualSize,
        file_type: contentType,
        storage_path: storagePath,
        expire_at: expireAt,
        custom_name: customName || null,
      })
      .select()
      .single();

    if (dbError) throw dbError;

    return new Response(JSON.stringify(uploadRecord), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Upload from URL error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
