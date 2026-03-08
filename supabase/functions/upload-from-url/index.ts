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

    // Fetch the remote file - HEAD first to check size
    const headRes = await fetch(url, { method: 'HEAD' }).catch(() => null);
    const contentLengthHeader = headRes?.headers.get('content-length');
    
    if (contentLengthHeader && parseInt(contentLengthHeader, 10) > 200 * 1024 * 1024) {
      return new Response(JSON.stringify({ error: 'File exceeds 200MB limit for URL uploads' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch the file
    const response = await fetch(url);
    if (!response.ok) {
      return new Response(JSON.stringify({ error: `Failed to fetch URL: ${response.status} ${response.statusText}` }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    const actualLength = response.headers.get('content-length');

    // Extract filename
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
          const lastSegment = decodeURIComponent(segments[segments.length - 1]);
          if (lastSegment.includes('.')) fileName = lastSegment;
        }
      } catch { /* keep default */ }
    }

    // Add extension from content-type if missing
    if (!fileName.includes('.')) {
      const extMap: Record<string, string> = {
        'video/mp4': 'mp4', 'video/webm': 'webm', 'video/quicktime': 'mov',
        'image/png': 'png', 'image/jpeg': 'jpg', 'image/gif': 'gif', 'image/webp': 'webp',
        'application/pdf': 'pdf', 'application/zip': 'zip',
        'audio/mpeg': 'mp3', 'audio/wav': 'wav',
        'application/octet-stream': 'bin',
      };
      const ext = extMap[contentType.split(';')[0].trim()] || 'bin';
      fileName = `${fileName}.${ext}`;
    }

    const ext = fileName.split('.').pop() || 'bin';
    const storagePath = `${shortId}.${ext}`;

    // Stream upload directly to Supabase Storage using REST API
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const storageUploadUrl = `${supabaseUrl}/storage/v1/object/uploads/${storagePath}`;

    const uploadRes = await fetch(storageUploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': contentType,
        'Cache-Control': 'max-age=3600',
        'x-upsert': 'false',
      },
      body: response.body, // Stream directly - no buffering!
    });

    if (!uploadRes.ok) {
      const errText = await uploadRes.text();
      throw new Error(`Storage upload failed: ${uploadRes.status} ${errText}`);
    }

    // Determine file size
    const fileSize = actualLength ? parseInt(actualLength, 10) : 0;

    // Force 1-hour expiry for files >50MB
    let finalExpireAt = expireAt;
    if (fileSize > 50 * 1024 * 1024) {
      const oneHourFromNow = new Date(Date.now() + 60 * 60 * 1000).toISOString();
      if (!finalExpireAt || new Date(finalExpireAt) > new Date(oneHourFromNow)) {
        finalExpireAt = oneHourFromNow;
      }
    }

    // Create database record
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: uploadRecord, error: dbError } = await supabase
      .from('uploads')
      .insert({
        short_id: shortId,
        file_name: fileName,
        file_size: fileSize,
        file_type: contentType,
        storage_path: storagePath,
        expire_at: finalExpireAt,
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
