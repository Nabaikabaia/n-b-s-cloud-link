import { useState, useCallback } from 'react';
import { Upload, File, Image, FileArchive, FileText, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface UploadZoneProps {
  onFileSelect: (file: File) => void;
  isUploading: boolean;
}

const UploadZone = ({ onFileSelect, isUploading }: UploadZoneProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const { toast } = useToast();

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      if (file.size > 100 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Maximum file size is 100MB",
          variant: "destructive",
        });
        return;
      }
      onFileSelect(file);
    }
  }, [onFileSelect, toast]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 100 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Maximum file size is 100MB",
          variant: "destructive",
        });
        return;
      }
      onFileSelect(file);
    }
  }, [onFileSelect, toast]);

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        relative overflow-hidden rounded-3xl p-12 transition-all duration-300
        glass-strong border-2
        ${isDragging 
          ? 'border-primary glow-cyan scale-[1.02]' 
          : 'border-border hover:border-primary/50'
        }
        ${isUploading ? 'opacity-50 pointer-events-none' : ''}
      `}
    >
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 opacity-50" />
      
      {/* Floating icons */}
      <div className="absolute top-8 left-8 text-primary/30 animate-float">
        <File size={32} />
      </div>
      <div className="absolute top-12 right-12 text-secondary/30 animate-float" style={{ animationDelay: '1s' }}>
        <Image size={28} />
      </div>
      <div className="absolute bottom-12 left-16 text-accent/30 animate-float" style={{ animationDelay: '2s' }}>
        <FileArchive size={24} />
      </div>
      <div className="absolute bottom-16 right-8 text-success/30 animate-float" style={{ animationDelay: '1.5s' }}>
        <FileText size={26} />
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center space-y-6">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-primary/20 blur-2xl animate-pulse-glow" />
          <div className="relative p-8 rounded-full glass border border-primary/50 glow-cyan">
            <Upload size={48} className="text-primary" />
          </div>
        </div>

        <div className="text-center space-y-2">
          <h3 className="text-2xl font-bold gradient-text">
            Drop Your File Here
          </h3>
          <p className="text-muted-foreground">
            or click to browse
          </p>
          <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
            <Zap size={12} className="text-primary" />
            Quantum Upload Engine v2.0 • Max 100MB
          </p>
        </div>

        <input
          type="file"
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={isUploading}
        />
      </div>
    </div>
  );
};

export default UploadZone;
