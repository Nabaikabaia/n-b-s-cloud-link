import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-admin-password',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const password = req.headers.get('x-admin-password');
    const adminPassword = Deno.env.get('ADMIN_PASSWORD');

    if (!password || password !== adminPassword) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    let body: any = {};
    try { body = await req.json(); } catch {}

    // If body has id, it's a delete request
    if (body?.id) {
      const { id, storagePath } = body;

      if (storagePath) {
        await supabase.storage.from('uploads').remove([storagePath]);
      }
      const { error } = await supabase.from('uploads').delete().eq('id', id);
      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Otherwise return stats
    {
      // Get all uploads for stats
      const { data: uploads, error } = await supabase
        .from('uploads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const now = new Date();
      const totalUploads = uploads?.length || 0;
      const totalSize = uploads?.reduce((sum, u) => sum + (u.file_size || 0), 0) || 0;
      const totalDownloads = uploads?.reduce((sum, u) => sum + (u.download_count || 0), 0) || 0;
      const activeFiles = uploads?.filter(u => !u.expire_at || new Date(u.expire_at) > now).length || 0;
      const expiredFiles = totalUploads - activeFiles;

      // Uploads per day (last 30 days)
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const dailyUploads: Record<string, number> = {};
      for (let d = new Date(thirtyDaysAgo); d <= now; d.setDate(d.getDate() + 1)) {
        dailyUploads[d.toISOString().split('T')[0]] = 0;
      }
      uploads?.forEach(u => {
        const day = u.created_at.split('T')[0];
        if (dailyUploads[day] !== undefined) dailyUploads[day]++;
      });

      // Top downloaded files
      const topDownloads = [...(uploads || [])]
        .filter(u => u.download_count > 0)
        .sort((a, b) => b.download_count - a.download_count)
        .slice(0, 10);

      // File type distribution
      const typeDistribution: Record<string, number> = {};
      uploads?.forEach(u => {
        const type = u.file_type?.split('/')[0] || 'other';
        typeDistribution[type] = (typeDistribution[type] || 0) + 1;
      });

      // Upcoming expirations (next 24h)
      const next24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const expiringSoon = uploads?.filter(u =>
        u.expire_at && new Date(u.expire_at) > now && new Date(u.expire_at) <= next24h
      ) || [];

      return new Response(JSON.stringify({
        totalUploads,
        totalSize,
        totalDownloads,
        activeFiles,
        expiredFiles,
        dailyUploads,
        topDownloads,
        typeDistribution,
        expiringSoon,
        uploads,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    }
  } catch (error) {
    console.error('Admin error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
