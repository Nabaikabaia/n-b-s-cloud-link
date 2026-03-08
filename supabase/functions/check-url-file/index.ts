const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const buildHeaders = (url: string, withReferer = false, withRange = false) => {
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
    ...(withRange ? { Range: 'bytes=0-0' } : {}),
  };
};

const fetchWithFallback = async (url: string) => {
  const first = await fetch(url, {
    method: 'GET',
    headers: buildHeaders(url, false, true),
    redirect: 'follow',
  });

  if (first.status !== 403) return first;

  first.body?.cancel();

  return fetch(url, {
    method: 'GET',
    headers: buildHeaders(url, true, true),
    redirect: 'follow',
  });
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

    let contentLength: number | null = null;
    let contentType = 'application/octet-stream';
    let fileName = 'file';

    const response = await fetchWithFallback(url);

    if (!response.ok) {
      const remoteError = await response.text().catch(() => '');
      return new Response(
        JSON.stringify({
          error: `Failed to fetch URL metadata: ${response.status} ${response.statusText}${remoteError ? ` - ${remoteError.slice(0, 200)}` : ''}`,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }

    const contentRange = response.headers.get('content-range');
    const cl = response.headers.get('content-length');
    if (contentRange && contentRange.includes('/')) {
      const totalSize = Number(contentRange.split('/').pop());
      if (Number.isFinite(totalSize) && totalSize > 0) contentLength = totalSize;
    } else if (cl) {
      contentLength = parseInt(cl, 10);
    }
    contentType = response.headers.get('content-type') || contentType;

    const cd = response.headers.get('content-disposition');
    if (cd) {
      const match = cd.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      if (match) fileName = match[1].replace(/['"]/g, '');
    }

    if (fileName === 'file') {
      try {
        const urlPath = new URL(url).pathname;
        const segments = urlPath.split('/').filter(Boolean);
        if (segments.length > 0) {
          const last = decodeURIComponent(segments[segments.length - 1]);
          if (last.includes('.')) fileName = last;
        }
      } catch {
        // ignore
      }
    }

    response.body?.cancel();

    return new Response(
      JSON.stringify({
        fileSize: contentLength,
        contentType,
        fileName,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
