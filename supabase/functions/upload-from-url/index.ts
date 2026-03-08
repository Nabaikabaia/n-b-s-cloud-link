import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MAX_URL_UPLOAD_BYTES = 1024 * 1024 * 1024; // 1GB hard cap

const buildHeaders = (url: string, withReferer = false) => {
  const parsed = new URL(url);
  return {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Accept': '*/*',
    'Accept-Language': 'en-US,en;q=0.9',
    'x-supabase-client-platform': 'deno',
    ...(withReferer
      ? {
          'Origin': `${parsed.protocol}//${parsed.host}`,
          'Referer': `${parsed.protocol}//${parsed.host}/`,
        }
      : {}),
  };
};

const fetchRemoteFile = async (url: string) => {
  const first = await fetch(url, {
    method: 'GET',
    headers: buildHeaders(url, false),
    redirect: 'follow',
  });

  if (first.status !== 403) return first;

  first.body?.cancel();

  return fetch(url, {
    method: 'GET',
    headers: buildHeaders(url, true),
    redirect: 'follow',
  });
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let url: string | undefined;
    let shortId: string | undefined;
    let expireAt: string | undefined;
    let customName: string | undefined;

    if (req.method === 'GET') {
      const params = new URL(req.url).searchParams;
      url = params.get('url') || undefined;
      shortId = params.get('shortId') || undefined;
      expireAt = params.get('expireAt') || undefined;
      customName = params.get('customName') || undefined;
    } else {
      const body = await req.json();
      url = body.url;
      shortId = body.shortId;
      expireAt = body.expireAt;
      customName = body.customName;
    }

    if (!url) {
      return new Response(JSON.stringify({ error: 'url is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Auto-generate shortId if not provided
    if (!shortId) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const sb = createClient(supabaseUrl, serviceRoleKey);
      const { data: generatedId, error: idError } = await sb.rpc('generate_short_id');
      if (idError) throw idError;
      shortId = generatedId;
    }

    const response = await fetchRemoteFile(url);

    if (!response.ok) {
      const remoteError = await response.text().catch(() => '');
      return new Response(
        JSON.stringify({
          error: `Failed to fetch URL: ${response.status} ${response.statusText}${remoteError ? ` - ${remoteError.slice(0, 200)}` : ''}`,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }

    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    const actualLength = response.headers.get('content-length');
    const fileSizeFromHeader = actualLength ? parseInt(actualLength, 10) : null;

    if (fileSizeFromHeader && fileSizeFromHeader > MAX_URL_UPLOAD_BYTES) {
      response.body?.cancel();
      return new Response(JSON.stringify({ error: 'File exceeds 1GB upload limit' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

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
      } catch {
        // ignore
      }
    }

    if (!fileName.includes('.')) {
      const extMap: Record<string, string> = {
        'video/mp4': 'mp4',
        'video/webm': 'webm',
        'video/quicktime': 'mov',
        'image/png': 'png',
        'image/jpeg': 'jpg',
        'image/gif': 'gif',
        'image/webp': 'webp',
        'application/pdf': 'pdf',
        'application/zip': 'zip',
        'audio/mpeg': 'mp3',
        'audio/wav': 'wav',
        'application/octet-stream': 'bin',
      };
      const ext = extMap[contentType.split(';')[0].trim()] || 'bin';
      fileName = `${fileName}.${ext}`;
    }

    const ext = fileName.split('.').pop() || 'bin';
    const storagePath = `${shortId}.${ext}`;

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const storageUploadUrl = `${supabaseUrl}/storage/v1/object/uploads/${storagePath}`;

    if (!response.body) {
      throw new Error('Remote response has no body');
    }

    const uploadRes = await fetch(storageUploadUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${serviceRoleKey}`,
        'Content-Type': contentType,
        'Cache-Control': 'max-age=3600',
        'x-upsert': 'false',
      },
      body: response.body,
    });

    if (!uploadRes.ok) {
      const errText = await uploadRes.text();
      throw new Error(`Storage upload failed: ${uploadRes.status} ${errText}`);
    }

    const fileSize = fileSizeFromHeader ?? 0;

    let finalExpireAt = expireAt;
    if (fileSize > 50 * 1024 * 1024) {
      const oneHourFromNow = new Date(Date.now() + 60 * 60 * 1000).toISOString();
      if (!finalExpireAt || new Date(finalExpireAt) > new Date(oneHourFromNow)) {
        finalExpireAt = oneHourFromNow;
      }
    }

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

    // Build the download URL
    const rawOrigin = req.headers.get('origin');
    const referer = req.headers.get('referer');
    const origin = rawOrigin || (referer ? new URL(referer).origin : '');
    const identifier = uploadRecord.custom_name || uploadRecord.short_id;
    const downloadUrl = origin ? `${origin}/${identifier}` : `/${identifier}`;

    return new Response(JSON.stringify({
      ...uploadRecord,
      download_url: downloadUrl,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Upload from URL error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
