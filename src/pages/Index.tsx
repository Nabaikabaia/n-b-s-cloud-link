import { useState, useEffect } from "react";
import { Link2, Upload, Zap, Shield, History, Sparkles, Check, ArrowUp, HardDrive, AlertTriangle, Loader2, Copy, CheckCheck } from 'lucide-react';
import ParticleBackground from '@/components/ParticleBackground';
import UploadZone from '@/components/UploadZone';
import UploadProgress from '@/components/UploadProgress';
import URLCard from '@/components/URLCard';
import ExpirationSelector from '@/components/ExpirationSelector';
import ThemeToggle from '@/components/ThemeToggle';
import HamburgerMenu from '@/components/HamburgerMenu';
import FilePreview from '@/components/FilePreview';
import UploadHistory from '@/components/UploadHistory';
import SnowfallEffect from '@/components/SnowfallEffect';
import ChristmasModal from '@/components/ChristmasModal';
import { Button } from '@/components/ui/button';
import { useUploads } from '@/hooks/useUploads';
import { useChristmasTheme } from '@/hooks/useChristmasTheme';

const Index = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [currentUpload, setCurrentUpload] = useState<any>(null);
  const [expiration, setExpiration] = useState('24h');
  const [showHistory, setShowHistory] = useState(false);
  const [customName, setCustomName] = useState('');
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [uploadMode, setUploadMode] = useState<'file' | 'url'>('file');
  const [urlInput, setUrlInput] = useState('');
  const [urlFileInfo, setUrlFileInfo] = useState<{ fileSize: number | null; contentType: string; fileName: string } | null>(null);
  const [isCheckingUrl, setIsCheckingUrl] = useState(false);
  const [copiedBaseUrl, setCopiedBaseUrl] = useState(false);

  const { uploads, uploadFile, uploadFromUrl, deleteUpload, getPublicUrl, isLoading } = useUploads();
  const { isChristmasDay } = useChristmasTheme();

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 300);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setUrlFileInfo(null);
    if (!urlInput.trim() || uploadMode !== 'url') return;
    try { new URL(urlInput.trim()); } catch { return; }
    setIsCheckingUrl(true);
    const timer = setTimeout(async () => {
      try {
        const { supabase } = await import('@/integrations/supabase/client');
        const { data, error } = await supabase.functions.invoke('check-url-file', { body: { url: urlInput.trim() } });
        if (!error && data) setUrlFileInfo(data);
      } catch { /* ignore */ }
      setIsCheckingUrl(false);
    }, 600);
    return () => { clearTimeout(timer); setIsCheckingUrl(false); };
  }, [urlInput, uploadMode]);

  const formatFileSize = (bytes: number) => {
    if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${bytes} B`;
  };

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setCurrentUpload(null);
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => setFilePreviewUrl(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setFilePreviewUrl('');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setIsUploading(true);
    try {
      const upload = await uploadFile(selectedFile, expiration, customName.trim() || undefined);
      setCurrentUpload(upload);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleUrlUpload = async () => {
    if (!urlInput.trim()) return;
    setIsUploading(true);
    try {
      const upload = await uploadFromUrl(urlInput.trim(), expiration, customName.trim() || undefined);
      setCurrentUpload(upload);
    } catch (error) {
      console.error('URL upload failed:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setCurrentUpload(null);
    setIsUploading(false);
    setFilePreviewUrl('');
    setCustomName('');
    setUrlInput('');
    setUrlFileInfo(null);
    setUploadMode('file');
    setCopiedBaseUrl(false);
  };

  return (
    <div className="min-h-screen relative">
      {isChristmasDay && <SnowfallEffect />}
      {isChristmasDay && <ChristmasModal />}
      <ParticleBackground />

      {/* Top bar */}
      <div className="fixed top-4 left-4 z-[100]"><HamburgerMenu /></div>
      <div className="fixed top-4 right-4 z-[100]"><ThemeToggle /></div>

      {/* Scroll to top */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className={`fixed bottom-6 right-6 z-[100] p-2.5 rounded-full bg-card border border-border hover:border-primary/50 transition-all duration-300 ${
          showScrollTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
      >
        <ArrowUp className="h-4 w-4 text-foreground" />
      </button>

      {/* Main */}
      <div className="relative z-10 container mx-auto px-4 py-16 sm:py-24 max-w-2xl">
        {/* Header */}
        <header className="text-center mb-12 sm:mb-16 space-y-4 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-medium text-primary">
            <Zap className="w-3 h-3" />
            Instant File Sharing
          </div>

          <h1 className={`text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-foreground ${isChristmasDay ? 'christmas-glow' : ''}`}>
            {isChristmasDay ? '🎄 Nãbēēs' : 'Nãbēēs'}
            <span className="block gradient-text">Uploader</span>
          </h1>

          <p className="text-base sm:text-lg text-muted-foreground max-w-md mx-auto">
            {isChristmasDay ? '🎁 Your File, One Link, Zero Stress 🎅' : 'Your file, one link, zero stress.'}
          </p>

          <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground pt-2">
            <div className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-success" />
              <span>Encrypted</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-border" />
            <div className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-primary" />
              <span>Fast</span>
            </div>
            {uploads.length > 0 && (
              <>
                <div className="w-1 h-1 rounded-full bg-border" />
                <button onClick={() => setShowHistory(!showHistory)} className="flex items-center gap-1.5 hover:text-primary transition-colors">
                  <History className="w-3.5 h-3.5" />
                  <span>History ({uploads.length})</span>
                </button>
              </>
            )}
          </div>
        </header>

        {/* Upload Area */}
        <div className="space-y-5">
          {!selectedFile && !currentUpload && !isUploading && (
            <div className="space-y-5 animate-fade-in">
              {/* Mode toggle */}
              <div className="flex items-center justify-center">
                <div className="inline-flex rounded-xl bg-muted/50 p-1 border border-border">
                  <button
                    onClick={() => setUploadMode('file')}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      uploadMode === 'file' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Upload className="w-3.5 h-3.5" />
                    File
                  </button>
                  <button
                    onClick={() => setUploadMode('url')}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      uploadMode === 'url' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Link2 className="w-3.5 h-3.5" />
                    URL
                  </button>
                </div>
              </div>

              {uploadMode === 'file' ? (
                <UploadZone onFileSelect={handleFileSelect} isUploading={false} />
              ) : (
                <div className="rounded-2xl bg-card border border-border p-6 sm:p-8 space-y-5">
                  <div className="text-center space-y-2">
                    <div className="inline-flex p-4 rounded-2xl bg-muted/60">
                      <Link2 size={32} className="text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground">Upload from URL</h3>
                    <p className="text-sm text-muted-foreground">Paste a direct link to any file</p>
                  </div>

                  <input
                    type="url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://example.com/file.pdf"
                    className="w-full px-4 py-3 rounded-xl bg-muted/30 border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-foreground placeholder:text-muted-foreground text-sm"
                  />

                  {/* Base URL copy */}
                  {urlInput.trim() && (
                    <div className="flex items-center gap-2 rounded-xl bg-muted/30 border border-border px-4 py-2.5 animate-fade-in">
                      <span className="text-xs text-muted-foreground shrink-0">Link preview:</span>
                      <code className="text-xs font-mono text-primary truncate flex-1">
                        {`${window.location.origin}/${customName || '<id>'}${urlFileInfo?.fileName ? '.' + urlFileInfo.fileName.split('.').pop()?.toLowerCase() : ''}`}
                      </code>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(`${window.location.origin}/`);
                          setCopiedBaseUrl(true);
                          setTimeout(() => setCopiedBaseUrl(false), 2000);
                        }}
                        className="shrink-0 p-1 rounded-md hover:bg-primary/10 transition-colors"
                        title="Copy base URL"
                      >
                        {copiedBaseUrl ? <CheckCheck className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5 text-muted-foreground" />}
                      </button>
                    </div>
                  )}

                  {/* File info */}
                  {isCheckingUrl && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      Checking file...
                    </div>
                  )}
                  {urlFileInfo && !isCheckingUrl && (
                    <div className="rounded-xl bg-muted/30 border border-border p-4 space-y-2 animate-fade-in">
                      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                        <HardDrive className="h-4 w-4 text-primary" />
                        File Details
                      </div>
                      <div className="grid grid-cols-2 gap-1.5 text-xs">
                        <span className="text-muted-foreground">Name</span>
                        <span className="text-foreground truncate font-medium">{urlFileInfo.fileName}</span>
                        <span className="text-muted-foreground">Size</span>
                        <span className="text-foreground font-medium">{urlFileInfo.fileSize ? formatFileSize(urlFileInfo.fileSize) : 'Unknown'}</span>
                        <span className="text-muted-foreground">Type</span>
                        <span className="text-foreground font-medium">{urlFileInfo.contentType}</span>
                      </div>
                      {urlFileInfo.fileSize && urlFileInfo.fileSize > 50 * 1024 * 1024 && (
                        <div className="flex items-center gap-1.5 text-xs text-destructive mt-1">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          Large file — will auto-expire after 1 hour
                        </div>
                      )}
                    </div>
                  )}

                  {/* Custom name */}
                  <div className="space-y-2">
                    <label htmlFor="url-custom-name" className="text-sm font-medium text-foreground flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-primary" />
                      Custom name <span className="text-muted-foreground font-normal">(optional)</span>
                    </label>
                    <input
                      id="url-custom-name"
                      type="text"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      placeholder="e.g., my-document"
                      className="w-full px-4 py-3 rounded-xl bg-muted/30 border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-foreground placeholder:text-muted-foreground text-sm"
                      maxLength={100}
                    />
                    {customName && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Check className="h-3 w-3 text-success" />
                        Link: <span className="font-medium text-primary">{window.location.origin}/{customName}{urlFileInfo?.fileName ? '.' + urlFileInfo.fileName.split('.').pop()?.toLowerCase() : ''}</span>
                      </p>
                    )}
                  </div>

                  <ExpirationSelector selected={expiration} onChange={setExpiration} />

                  <Button
                    onClick={handleUrlUpload}
                    disabled={!urlInput.trim()}
                    className="w-full py-5 text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 rounded-xl"
                  >
                    <Link2 className="w-4 h-4 mr-2" />
                    Fetch & Upload
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* File selected */}
          {selectedFile && !isUploading && !currentUpload && (
            <div className="space-y-5 animate-fade-in">
              <FilePreview file={selectedFile} previewUrl={filePreviewUrl} />

              <div className="flex justify-end">
                <Button variant="ghost" onClick={handleReset} size="sm" className="text-xs text-muted-foreground hover:text-destructive">
                  Change file
                </Button>
              </div>

              <div className="space-y-2">
                <label htmlFor="custom-name" className="text-sm font-medium text-foreground flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  Custom name <span className="text-muted-foreground font-normal">(optional)</span>
                </label>
                <input
                  id="custom-name"
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="e.g., my-document"
                  className="w-full px-4 py-3 rounded-xl bg-muted/30 border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-foreground placeholder:text-muted-foreground text-sm"
                  maxLength={100}
                />
                {customName && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Check className="h-3 w-3 text-success" />
                    Link: <span className="font-medium text-primary">{window.location.origin}/{customName}</span>
                  </p>
                )}
              </div>

              <ExpirationSelector selected={expiration} onChange={setExpiration} />

              <Button
                onClick={handleUpload}
                className="w-full py-5 text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl"
              >
                <Zap className="w-4 h-4 mr-2" />
                Upload & Get Link
              </Button>
            </div>
          )}

          {/* Uploading */}
          {isUploading && (selectedFile || uploadMode === 'url') && (
            <div className="animate-fade-in">
              <UploadProgress fileName={selectedFile?.name || urlInput.split('/').pop() || 'Remote file'} fileSize={selectedFile?.size || 0} />
            </div>
          )}

          {/* Result */}
          {currentUpload && (
            <div className="space-y-4 animate-fade-in">
              <URLCard
                url={getPublicUrl(currentUpload.short_id, currentUpload.custom_name, currentUpload.file_name)}
                fileName={currentUpload.file_name}
                customName={currentUpload.custom_name}
              />
              <Button onClick={handleReset} variant="outline" className="w-full rounded-xl">
                Upload Another
              </Button>
            </div>
          )}

          {/* History */}
          {showHistory && uploads.length > 0 && (
            <div className="animate-fade-in">
              <UploadHistory uploads={uploads} onDelete={deleteUpload} getPublicUrl={getPublicUrl} />
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="mt-20 text-center">
          <p className="text-xs text-muted-foreground">Nãbēēs Uploader • Fast & Secure File Sharing</p>
        </footer>
      </div>
    </div>
  );
};

export default Index;
