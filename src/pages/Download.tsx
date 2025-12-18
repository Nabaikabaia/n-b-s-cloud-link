import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Download as DownloadIcon, AlertCircle, Sparkles, FileText, FileArchive, FileAudio, FileVideo, File as FileIcon, Image as ImageIcon, X, Maximize2 } from 'lucide-react';
import ParticleBackground from '@/components/ParticleBackground';
import ThemeToggle from '@/components/ThemeToggle';
import HamburgerMenu from '@/components/HamburgerMenu';
import crystalOrb from '@/assets/crystal-orb.png';

const Download = () => {
  const { identifier } = useParams<{ identifier: string }>();
  const navigate = useNavigate();
  const [upload, setUpload] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);

  const fetchUpload = useCallback(async () => {
    if (!identifier) return;
    
    setLoading(true);
    setError('');
    
    try {
      // Try to find by short_id first
      let { data, error: fetchError } = await supabase
        .from('uploads')
        .select('*')
        .eq('short_id', identifier)
        .maybeSingle();

      // If not found by short_id, try custom_name
      if (!data) {
        const result = await supabase
          .from('uploads')
          .select('*')
          .eq('custom_name', identifier)
          .maybeSingle();
        
        data = result.data;
        fetchError = result.error;
      }

      if (fetchError) throw fetchError;
      
      if (!data) {
        setError('File not found or no longer available.');
        setLoading(false);
        return;
      }

      // Check if expired
      if (data.expire_at && new Date(data.expire_at) < new Date()) {
        setError('This file has expired and is no longer available.');
        setLoading(false);
        return;
      }

      setUpload(data);
    } catch (err: any) {
      console.error('Error fetching upload:', err);
      setError('File not found or no longer available.');
    } finally {
      setLoading(false);
    }
  }, [identifier, navigate]);

  useEffect(() => {
    if (!identifier) {
      navigate('/');
      return;
    }
    fetchUpload();
  }, [identifier, navigate, fetchUpload]);

  const handleDownload = async () => {
    if (!upload) return;

    setDownloading(true);
    try {
      // Get the public URL
      const { data } = supabase.storage
        .from('uploads')
        .getPublicUrl(upload.storage_path);

      // Increment download count
      await supabase
        .from('uploads')
        .update({ download_count: (upload.download_count || 0) + 1 })
        .eq('id', upload.id);

      // Fetch the file and force download
      const response = await fetch(data.publicUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = upload.custom_name || upload.file_name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);

      setUpload({ ...upload, download_count: (upload.download_count || 0) + 1 });
    } catch (error) {
      console.error('Download error:', error);
    } finally {
      setDownloading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const getFileType = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'];
    const videoExts = ['mp4', 'webm', 'mov', 'avi', 'mkv'];
    const audioExts = ['mp3', 'wav', 'ogg', 'flac', 'm4a'];
    const archiveExts = ['zip', 'rar', '7z', 'tar', 'gz'];
    const docExts = ['pdf', 'doc', 'docx', 'txt', 'rtf'];

    if (imageExts.includes(ext)) return 'image';
    if (videoExts.includes(ext)) return 'video';
    if (audioExts.includes(ext)) return 'audio';
    if (archiveExts.includes(ext)) return 'archive';
    if (docExts.includes(ext)) return 'document';
    return 'other';
  };

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case 'image': return <ImageIcon className="w-12 h-12 text-primary" />;
      case 'video': return <FileVideo className="w-12 h-12 text-secondary" />;
      case 'audio': return <FileAudio className="w-12 h-12 text-accent" />;
      case 'archive': return <FileArchive className="w-12 h-12 text-warning" />;
      case 'document': return <FileText className="w-12 h-12 text-success" />;
      default: return <FileIcon className="w-12 h-12 text-muted-foreground" />;
    }
  };

  const previewUrl = useMemo(() => {
    if (!upload) return null;
    const fileType = getFileType(upload.file_name);
    if (fileType === 'image' || fileType === 'video') {
      const { data } = supabase.storage.from('uploads').getPublicUrl(upload.storage_path);
      return data.publicUrl;
    }
    return null;
  }, [upload]);

  const fileType = upload ? getFileType(upload.file_name) : null;

  return (
    <div className="min-h-screen relative overflow-hidden">
      <ParticleBackground />
      
      <div className="fixed top-4 left-4 z-[100] pointer-events-auto">
        <HamburgerMenu />
      </div>
      <div className="fixed top-4 right-4 z-[100] pointer-events-auto">
        <ThemeToggle />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-12">
        <header className="text-center mb-16 space-y-6">
          <div className="flex items-center justify-center gap-4 mb-6">
            <img 
              src={crystalOrb} 
              alt="Nãbēēs Crystal Orb" 
              className="w-16 h-16 animate-spin-slow float"
            />
          </div>
          
          <h1 className="text-6xl md:text-7xl font-bold gradient-text mb-4">
            Nãbēēs Uploader
          </h1>
        </header>

        <div className="max-w-2xl mx-auto">
          {loading && (
            <div className="glass-strong rounded-3xl p-12 text-center border border-primary/30">
              <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-muted-foreground">Loading file information...</p>
            </div>
          )}

          {error && (
            <div className="glass-strong rounded-3xl p-12 text-center border border-destructive/30">
              <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">File Not Available</h2>
              <p className="text-muted-foreground mb-6">{error}</p>
              <Button onClick={() => navigate('/')} variant="outline">
                Go to Home
              </Button>
            </div>
          )}

          {upload && !error && (
            <div className="glass-strong rounded-3xl p-8 border border-primary/30 space-y-6 float">
              <div className="flex items-center justify-center gap-2 mb-6">
                <Sparkles className="w-5 h-5 text-accent animate-pulse" />
                <h2 className="text-2xl font-bold gradient-text">File Ready!</h2>
                <Sparkles className="w-5 h-5 text-accent animate-pulse" />
              </div>

              {/* File Preview */}
              <div className="glass rounded-xl p-4 flex items-center justify-center">
                {previewUrl && fileType === 'image' ? (
                  <div 
                    className="relative w-full max-w-md overflow-hidden rounded-lg border border-primary/50 glow-cyan cursor-pointer group"
                    onClick={() => setShowImageModal(true)}
                  >
                    <img 
                      src={previewUrl} 
                      alt={upload.file_name} 
                      className="w-full h-auto max-h-64 object-contain bg-background/50"
                    />
                    <div className="absolute inset-0 bg-background/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Maximize2 className="w-8 h-8 text-primary" />
                    </div>
                  </div>
                ) : previewUrl && fileType === 'video' ? (
                  <div className="relative w-full max-w-md overflow-hidden rounded-lg border border-secondary/50">
                    <video 
                      src={previewUrl}
                      controls
                      className="w-full h-auto max-h-80 bg-background/50"
                      preload="metadata"
                    >
                      Your browser does not support video playback.
                    </video>
                  </div>
                ) : (
                  <div className="w-24 h-24 rounded-xl glass border border-primary/50 flex items-center justify-center">
                    {getFileIcon(fileType || 'other')}
                  </div>
                )}
              </div>

              <div className="glass rounded-xl p-6 space-y-4">
                {upload.custom_name && (
                  <div className="pb-4 border-b border-border/30">
                    <p className="text-sm text-muted-foreground mb-1">Custom Name</p>
                    <p className="text-2xl font-bold text-primary animate-gradient bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">{upload.custom_name}</p>
                  </div>
                )}
                
                <div>
                  <p className="text-sm text-muted-foreground">File Name</p>
                  <p className="text-lg font-semibold">{upload.file_name}</p>
                </div>
                
                <div className="flex gap-6">
                  <div>
                    <p className="text-sm text-muted-foreground">Size</p>
                    <p className="font-semibold">{formatFileSize(upload.file_size)}</p>
                  </div>
                  
                  {upload.download_count > 0 && (
                    <div>
                      <p className="text-sm text-muted-foreground">Downloads</p>
                      <p className="font-semibold">{upload.download_count}</p>
                    </div>
                  )}
                </div>

                {upload.expire_at && (
                  <div>
                    <p className="text-sm text-muted-foreground">Expires</p>
                    <p className="font-semibold text-warning">
                      {new Date(upload.expire_at).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>

              <Button
                onClick={handleDownload}
                disabled={downloading}
                className="w-full py-6 text-lg glass-strong border-2 border-success hover:glow-cyan group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-success/20 via-primary/20 to-accent/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                {downloading ? (
                  <>
                    <div className="animate-spin w-5 h-5 border-2 border-foreground border-t-transparent rounded-full mr-2" />
                    Downloading...
                  </>
                ) : (
                  <>
                    <DownloadIcon className="w-5 h-5 mr-2" />
                    Download File
                  </>
                )}
              </Button>

              <Button
                onClick={() => navigate('/')}
                variant="outline"
                className="w-full glass border-border hover:border-primary/50"
              >
                Upload Your Own File
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Ambient glow effects */}
      <div className="fixed top-0 left-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-96 h-96 bg-secondary/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 pointer-events-none" />

      {/* Full-size Image Modal */}
      {showImageModal && previewUrl && (
        <div 
          className="fixed inset-0 z-[200] bg-background/90 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowImageModal(false)}
        >
          <button 
            className="absolute top-4 right-4 p-2 glass rounded-full border border-primary/50 hover:border-primary transition-colors"
            onClick={() => setShowImageModal(false)}
          >
            <X className="w-6 h-6" />
          </button>
          <img 
            src={previewUrl} 
            alt={upload?.file_name} 
            className="max-w-full max-h-[90vh] object-contain rounded-lg border border-primary/30 glow-cyan"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};

export default Download;
