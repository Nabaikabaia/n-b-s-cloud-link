import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "*",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    // identifier is the last path segment
    const segments = url.pathname.split("/").filter(Boolean);
    const identifier = segments[segments.length - 1];

    if (!identifier) {
      return new Response("Not found", { status: 404, headers: corsHeaders });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const cleanId = identifier.replace(/\.[^.]+$/, "");

    // Try to find the file by short_id or custom_name
    let data: any = null;
    for (const [col, val] of [
      ["short_id", cleanId],
      ["short_id", identifier],
      ["custom_name", cleanId],
      ["custom_name", identifier],
    ] as const) {
      if (data) break;
      const res = await supabase.from("uploads").select("*").eq(col, val).maybeSingle();
      if (res.data) data = res.data;
    }

    if (!data) {
      return new Response("File not found", { status: 404, headers: corsHeaders });
    }

    if (data.expire_at && new Date(data.expire_at) < new Date()) {
      return new Response("This file has expired", { status: 410, headers: corsHeaders });
    }

    // Increment download count (fire and forget)
    supabase.from("uploads").update({ download_count: (data.download_count || 0) + 1 }).eq("id", data.id).then();

    const { data: urlData } = supabase.storage.from("uploads").getPublicUrl(data.storage_path);
    const publicUrl = urlData.publicUrl;

    const ext = data.file_name.split(".").pop()?.toLowerCase() || "";
    const imageExts = ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "ico"];
    const videoExts = ["mp4", "webm", "mov", "ogg"];
    const audioExts = ["mp3", "wav", "ogg", "flac", "m4a", "aac"];

    if (imageExts.includes(ext) || videoExts.includes(ext) || audioExts.includes(ext)) {
      // Redirect to raw file for browser to render natively
      return new Response(null, {
        status: 302,
        headers: { ...corsHeaders, Location: publicUrl },
      });
    } else {
      // Redirect with content-disposition to force download
      // We proxy the file to set the download header
      const fileRes = await fetch(publicUrl);
      const fileName = data.custom_name || data.file_name;
      return new Response(fileRes.body, {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": fileRes.headers.get("Content-Type") || "application/octet-stream",
          "Content-Disposition": `attachment; filename="${fileName}"`,
          "Content-Length": fileRes.headers.get("Content-Length") || "",
        },
      });
    }
  } catch (err) {
    console.error(err);
    return new Response("Server error", { status: 500, headers: corsHeaders });
  }
});
