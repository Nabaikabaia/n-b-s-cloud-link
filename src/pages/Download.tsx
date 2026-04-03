import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

const Download = () => {
  const { identifier } = useParams<{ identifier: string }>();
  const [error, setError] = useState('');

  useEffect(() => {
    if (!identifier) {
      window.location.replace('/');
      return;
    }

    // Redirect immediately to the edge function which handles resolution and serves the file directly
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const serveUrl = `${supabaseUrl}/functions/v1/serve-file/${encodeURIComponent(identifier)}`;
    
    // Use fetch to check for errors first, then redirect for media or let download happen
    fetch(serveUrl, { method: 'HEAD', redirect: 'manual' }).then(res => {
      if (res.status === 302) {
        // Media file - redirect to the Location header
        // Since we can't read Location from opaque redirects, just navigate directly
        window.location.replace(serveUrl);
      } else if (res.status === 200) {
        // Download file - navigate to trigger download
        window.location.replace(serveUrl);
      } else if (res.status === 404) {
        setError('File not found.');
      } else if (res.status === 410) {
        setError('This file has expired.');
      } else {
        // Just try navigating anyway
        window.location.replace(serveUrl);
      }
    }).catch(() => {
      // On any network error, just try direct navigation
      window.location.replace(serveUrl);
    });
  }, [identifier]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="text-center space-y-4">
          <p className="text-xl">{error}</p>
          <a href="/" className="text-primary underline">Go Home</a>
        </div>
      </div>
    );
  }

  // Minimal loading - this shows very briefly before redirect
  return null;
};

export default Download;
