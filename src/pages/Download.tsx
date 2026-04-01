import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const Download = () => {
  const { identifier } = useParams<{ identifier: string }>();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  useEffect(() => {
    if (!identifier) {
      navigate('/');
      return;
    }

    const resolve = async () => {
      try {
        const cleanId = identifier.replace(/\.[^.]+$/, '');

        // Try short_id (cleaned), short_id (original), custom_name (cleaned), custom_name (original)
        let data: any = null;
        for (const [col, val] of [
          ['short_id', cleanId],
          ['short_id', identifier],
          ['custom_name', cleanId],
          ['custom_name', identifier],
        ] as const) {
          if (data) break;
          const res = await supabase.from('uploads').select('*').eq(col, val).maybeSingle();
          if (res.data) data = res.data;
        }

        if (!data) {
          setError('File not found.');
          return;
        }

        if (data.expire_at && new Date(data.expire_at) < new Date()) {
          setError('This file has expired.');
          return;
        }

        // Increment download count (fire and forget)
        supabase.from('uploads').update({ download_count: (data.download_count || 0) + 1 }).eq('id', data.id).then();

        const { data: urlData } = supabase.storage.from('uploads').getPublicUrl(data.storage_path);
        const publicUrl = urlData.publicUrl;

        const ext = data.file_name.split('.').pop()?.toLowerCase() || '';
        const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico'];
        const videoExts = ['mp4', 'webm', 'mov', 'ogg'];
        const audioExts = ['mp3', 'wav', 'ogg', 'flac', 'm4a', 'aac'];

        if (imageExts.includes(ext) || videoExts.includes(ext) || audioExts.includes(ext)) {
          // Redirect to the raw file – browser will render/play it natively
          window.location.replace(publicUrl);
        } else {
          // Force download for other file types
          const response = await fetch(publicUrl);
          const blob = await response.blob();
          const blobUrl = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = blobUrl;
          link.download = data.custom_name || data.file_name;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(blobUrl);
          setError('Download started. You can close this page.');
        }
      } catch (err) {
        console.error(err);
        setError('File not found.');
      }
    };

    resolve();
  }, [identifier, navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="text-center space-y-4">
          <p className="text-xl">{error}</p>
          <button onClick={() => navigate('/')} className="text-primary underline">Go Home</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
      <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
    </div>
  );
};

export default Download;
