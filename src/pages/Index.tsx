import { useState } from 'react';
import ParticleBackground from '@/components/ParticleBackground';
import UploadZone from '@/components/UploadZone';
import UploadProgress from '@/components/UploadProgress';
import URLCard from '@/components/URLCard';
import ExpirationSelector from '@/components/ExpirationSelector';
import { Button } from '@/components/ui/button';
import { Zap, Shield } from 'lucide-react';
import crystalOrb from '@/assets/crystal-orb.png';

const Index = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [generatedURL, setGeneratedURL] = useState<string>('');
  const [expiration, setExpiration] = useState('24h');

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setGeneratedURL('');
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);

    // Simulate upload with progress
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Generate mock short URL
    const shortId = Math.random().toString(36).substring(2, 8).toUpperCase();
    const mockURL = `https://nabees.io/${shortId}`;
    
    setGeneratedURL(mockURL);
    setIsUploading(false);
  };

  const handleReset = () => {
    setSelectedFile(null);
    setGeneratedURL('');
    setIsUploading(false);
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <ParticleBackground />

      {/* Main content */}
      <div className="relative z-10 container mx-auto px-4 py-12">
        {/* Header */}
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
          
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
            Your File, One Link, Zero Stress
          </p>
          
          <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              <span>Instant Upload</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-success" />
              <span>Secure Cloud</span>
            </div>
          </div>
        </header>

        {/* Main upload area */}
        <div className="max-w-4xl mx-auto space-y-8">
          {!selectedFile && !generatedURL && (
            <UploadZone onFileSelect={handleFileSelect} isUploading={false} />
          )}

          {selectedFile && !isUploading && !generatedURL && (
            <div className="space-y-6">
              <div className="glass-strong rounded-2xl p-6 border border-primary/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Selected file</p>
                    <p className="text-lg font-semibold">{selectedFile.name}</p>
                  </div>
                  <Button variant="ghost" onClick={handleReset}>
                    Change
                  </Button>
                </div>
              </div>

              <ExpirationSelector selected={expiration} onChange={setExpiration} />

              <Button
                onClick={handleUpload}
                className="w-full py-6 text-lg glass-strong border-2 border-primary hover:glow-cyan group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-secondary/20 to-accent/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                <Zap className="w-5 h-5 mr-2" />
                Upload & Generate URL
              </Button>
            </div>
          )}

          {isUploading && selectedFile && (
            <UploadProgress fileName={selectedFile.name} fileSize={selectedFile.size} />
          )}

          {generatedURL && selectedFile && (
            <div className="space-y-6">
              <URLCard url={generatedURL} fileName={selectedFile.name} />
              
              <Button
                onClick={handleReset}
                variant="outline"
                className="w-full glass border-border hover:border-primary/50"
              >
                Upload Another File
              </Button>
            </div>
          )}
        </div>

        {/* Footer tagline */}
        <footer className="mt-20 text-center">
          <p className="text-sm text-muted-foreground">
            Powered by Quantum Upload Engine v2.0
          </p>
        </footer>
      </div>

      {/* Ambient glow effects */}
      <div className="fixed top-0 left-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-96 h-96 bg-secondary/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 pointer-events-none" />
    </div>
  );
};

export default Index;
