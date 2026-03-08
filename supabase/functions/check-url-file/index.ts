const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const browserHeaders = (url: string, withReferer = false) => {
  const parsed = new URL(url);
  return {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Accept': '*/*',
    'Accept-Language': 'en-US,en;q=0.9',
    ...(withReferer
      ? {
          'Origin': `${parsed.protocol}//${parsed.host}`,
          'Referer': `${parsed.protocol}//${parsed.host}/`,
        }
      : {}),
  };
};

// Try multiple strategies to get file metadata without downloading the whole file
async function getFileInfo(url: string) {
  const errors: string[] = [];

  // Strategy 1: HEAD request (cheapest)
  for (const withReferer of [false, true]) {
    const res = await fetch(url, {
      method: 'HEAD',
      headers: browserHeaders(url, withReferer),
      redirect: 'follow',
    }).catch((e) => { errors.push(`HEAD(ref=${withReferer}): ${e.message}`); return null; });
    if (res && res.ok) return { response: res, errors };
    if (res) { errors.push(`HEAD(ref=${withReferer}): ${res.status} ${res.statusText}`); }
    res?.body?.cancel();
  }

  // Strategy 2: GET request with referer (most compatible)
  for (const withReferer of [true, false]) {
    const res = await fetch(url, {
      method: 'GET',
      headers: browserHeaders(url, withReferer),
      redirect: 'follow',
    }).catch((e) => { errors.push(`GET(ref=${withReferer}): ${e.message}`); return null; });
    if (res && res.ok) return { response: res, errors };
    if (res) { errors.push(`GET(ref=${withReferer}): ${res.status} ${res.statusText}`); }
    res?.body?.cancel();
  }

  return { response: null, errors };
}

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

    const response = await getFileInfo(url);

    if (!response || !response.ok) {
      const status = response?.status || 'unknown';
      const statusText = response?.statusText || 'Could not reach URL';
      return new Response(
        JSON.stringify({ error: `Failed to fetch URL metadata: ${status} ${statusText}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    let contentLength: number | null = null;
    let contentType = 'application/octet-stream';
    let fileName = 'file';

    const cl = response.headers.get('content-length');
    if (cl) contentLength = parseInt(cl, 10);
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
      } catch { /* ignore */ }
    }

    response.body?.cancel();

    return new Response(
      JSON.stringify({ fileSize: contentLength, contentType, fileName }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
