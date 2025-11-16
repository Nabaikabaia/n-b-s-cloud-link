import { useEffect, useState } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface UploadProgressProps {
  fileName: string;
  fileSize: number;
}

const UploadProgress = ({ fileName, fileSize }: UploadProgressProps) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const duration = 2000;
    const steps = 100;
    const stepTime = duration / steps;

    let currentStep = 0;
    const interval = setInterval(() => {
      currentStep++;
      setProgress(currentStep);
      
      if (currentStep >= steps) {
        clearInterval(interval);
      }
    }, stepTime);

    return () => clearInterval(interval);
  }, []);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  return (
    <div className="glass-strong rounded-2xl p-8 border border-primary/30">
      <div className="flex items-center justify-center gap-3 mb-6">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
        <span className="text-lg font-semibold gradient-text">Processing Upload...</span>
        <Sparkles className="w-5 h-5 text-accent animate-pulse" />
      </div>

      <div className="space-y-4">
        <div className="flex justify-between text-sm">
          <span className="text-foreground truncate max-w-[200px]">{fileName}</span>
          <span className="text-muted-foreground">{formatFileSize(fileSize)}</span>
        </div>

        <Progress value={progress} className="h-2" />

        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Encrypting & Uploading</span>
          <span>{progress}%</span>
        </div>
      </div>
    </div>
  );
};

export default UploadProgress;
