import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ParticleBackground from '@/components/ParticleBackground';
import UploadZone from '@/components/UploadZone';
import UploadProgress from '@/components/UploadProgress';
import URLCard from '@/components/URLCard';
import ExpirationSelector from '@/components/ExpirationSelector';
import ThemeToggle from '@/components/ThemeToggle';
import HamburgerMenu from '@/components/HamburgerMenu';
import FilePreview from '@/components/FilePreview';
import UploadHistory from '@/components/UploadHistory';
import { Button } from '@/components/ui/button';
import { Zap, Shield, History, Sparkles, Check, ArrowUp } from 'lucide-react';
import crystalOrb from '@/assets/crystal-orb.png';
import { useUploads } from '@/hooks/useUploads';

const Index = () => {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [currentUpload, setCurrentUpload] = useState<any>(null);
  const [expiration, setExpiration] = useState('24h');
  const [showHistory, setShowHistory] = useState(false);
  const [customName, setCustomName] = useState('');
  const [showScrollTop, setShowScrollTop] = useState(false);
  
  const { uploads, uploadFile, deleteUpload, getPublicUrl, isLoading } = useUploads();

  // Scroll to top button visibility
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setCurrentUpload(null);
    
    // Generate preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreviewUrl(reader.result as string);
      };
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

  const handleReset = () => {
    setSelectedFile(null);
    setCurrentUpload(null);
    setIsUploading(false);
    setFilePreviewUrl('');
    setCustomName('');
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <ParticleBackground />
      
      <div className="fixed top-4 left-4 z-[100] pointer-events-auto">
        <HamburgerMenu />
      </div>
      <div className="fixed top-4 right-4 z-[100] pointer-events-auto">
        <ThemeToggle />
      </div>

      {/* Scroll to top button */}
      <button
        onClick={scrollToTop}
        className={`fixed bottom-6 right-6 z-[100] p-3 rounded-full glass-strong border border-primary/30 hover:border-primary hover:glow-cyan transition-all duration-300 ${
          showScrollTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
        aria-label="Scroll to top"
      >
        <ArrowUp className="h-5 w-5 text-primary" />
      </button>

      {/* Main content */}
      <div className="relative z-10 container mx-auto px-4 py-8 sm:py-12">
        {/* Header */}
        <header className="text-center mb-10 sm:mb-16 space-y-4 sm:space-y-6 animate-fade-in">
          <div className="flex items-center justify-center gap-4 mb-4 sm:mb-6">
            <img 
              src={crystalOrb} 
              alt="Nãbēēs Crystal Orb" 
              className="w-12 h-12 sm:w-16 sm:h-16 animate-spin-slow float"
            />
          </div>
          
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold gradient-text mb-2 sm:mb-4 tracking-tight">
            Nãbēēs Uploader
          </h1>
          
          <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto px-4">
            Your File, One Link, Zero Stress
          </p>
          
          <div className="flex items-center justify-center gap-4 sm:gap-6 text-sm text-muted-foreground flex-wrap px-4">
            <div className="flex items-center gap-2 transition-transform hover:scale-105">
              <Zap className="w-4 h-4 text-primary" />
              <span>Instant Upload</span>
            </div>
            <div className="flex items-center gap-2 transition-transform hover:scale-105">
              <Shield className="w-4 h-4 text-success" />
              <span>Secure Cloud</span>
            </div>
            {uploads.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowHistory(!showHistory)}
                className="text-muted-foreground hover:text-primary transition-all hover:scale-105"
              >
                <History className="w-4 h-4 mr-2" />
                History ({uploads.length})
              </Button>
            )}
          </div>
        </header>

        {/* Main upload area */}
        <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
          {!selectedFile && !currentUpload && (
            <div className="animate-fade-in">
              <UploadZone onFileSelect={handleFileSelect} isUploading={false} />
            </div>
          )}

          {selectedFile && !isUploading && !currentUpload && (
            <div className="space-y-4 sm:space-y-6 animate-fade-in">
              <FilePreview file={selectedFile} previewUrl={filePreviewUrl} />

              <div className="flex items-center justify-end">
                <Button 
                  variant="ghost" 
                  onClick={handleReset} 
                  size="sm"
                  className="hover:text-destructive transition-colors"
                >
                  Change File
                </Button>
              </div>

              <div className="glass-strong rounded-xl p-4 sm:p-6 space-y-3 border border-primary/20 transition-all hover:border-primary/40">
                <label htmlFor="custom-name" className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-accent" />
                  Custom Link Name (Optional)
                </label>
                <input
                  id="custom-name"
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="e.g., My Awesome Document"
                  className="w-full px-4 py-3 rounded-lg glass border border-primary/30 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all text-foreground placeholder:text-muted-foreground"
                  maxLength={100}
                />
                {customName && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1 animate-fade-in">
                    <Check className="h-3 w-3 text-success" />
                    Your link will display: <span className="font-semibold text-primary">"{customName}"</span>
                  </p>
                )}
              </div>

              <ExpirationSelector selected={expiration} onChange={setExpiration} />

              <Button
                onClick={handleUpload}
                className="w-full py-5 sm:py-6 text-base sm:text-lg glass-strong border-2 border-primary hover:glow-cyan group relative overflow-hidden transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-secondary/20 to-accent/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                <Zap className="w-5 h-5 mr-2" />
                Upload & Generate URL
              </Button>
            </div>
          )}

          {isUploading && selectedFile && (
            <div className="animate-fade-in">
              <UploadProgress fileName={selectedFile.name} fileSize={selectedFile.size} />
            </div>
          )}

          {currentUpload && (
            <div className="space-y-4 sm:space-y-6 animate-fade-in">
              <URLCard 
                url={getPublicUrl(currentUpload.short_id, currentUpload.custom_name)} 
                fileName={currentUpload.file_name}
                customName={currentUpload.custom_name}
              />
              
              <Button
                onClick={handleReset}
                variant="outline"
                className="w-full glass border-border hover:border-primary/50 transition-all hover:scale-[1.01] active:scale-[0.99]"
              >
                Upload Another File
              </Button>
            </div>
          )}

          {showHistory && uploads.length > 0 && (
            <div className="animate-fade-in">
              <UploadHistory 
                uploads={uploads}
                onDelete={deleteUpload}
                getPublicUrl={getPublicUrl}
              />
            </div>
          )}
        </div>

        {/* Footer tagline */}
        <footer className="mt-16 sm:mt-20 text-center animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <p className="text-sm text-muted-foreground">
            Powered by Quantum Upload Engine v2.0
          </p>
        </footer>
      </div>

      {/* Ambient glow effects */}
      <div className="fixed top-0 left-0 w-64 sm:w-96 h-64 sm:h-96 bg-primary/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-64 sm:w-96 h-64 sm:h-96 bg-secondary/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 pointer-events-none" />
    </div>
  );
};

export default Index;
