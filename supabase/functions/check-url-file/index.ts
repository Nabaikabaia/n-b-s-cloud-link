const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    if (!url) {
      return new Response(JSON.stringify({ error: 'url is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Try HEAD first, fall back to GET with range
    let contentLength: number | null = null;
    let contentType = 'application/octet-stream';
    let fileName = 'file';

    const headRes = await fetch(url, { method: 'HEAD' }).catch(() => null);
    if (headRes?.ok) {
      const cl = headRes.headers.get('content-length');
      if (cl) contentLength = parseInt(cl, 10);
      contentType = headRes.headers.get('content-type') || contentType;

      const cd = headRes.headers.get('content-disposition');
      if (cd) {
        const match = cd.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (match) fileName = match[1].replace(/['"]/g, '');
      }
    }

    // Try to extract filename from URL path
    if (fileName === 'file') {
      try {
        const urlPath = new URL(url).pathname;
        const segments = urlPath.split('/').filter(Boolean);
        if (segments.length > 0) {
          const last = decodeURIComponent(segments[segments.length - 1]);
          if (last.includes('.')) fileName = last;
        }
      } catch { /* keep default */ }
    }

    return new Response(JSON.stringify({
      fileSize: contentLength,
      contentType,
      fileName,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
