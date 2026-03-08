import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
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
      if (currentStep >= steps) clearInterval(interval);
    }, stepTime);
    return () => clearInterval(interval);
  }, []);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  return (
    <div className="rounded-2xl bg-card border border-border p-6 sm:p-8 space-y-5">
      <div className="flex items-center justify-center gap-3">
        <Loader2 className="w-5 h-5 text-primary animate-spin" />
        <span className="text-base font-medium text-foreground">Uploading...</span>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-foreground truncate max-w-[200px]">{fileName}</span>
          <span className="text-muted-foreground">{formatFileSize(fileSize)}</span>
        </div>
        <Progress value={progress} className="h-1.5" />
        <p className="text-xs text-muted-foreground text-right">{progress}%</p>
      </div>
    </div>
  );
};

export default UploadProgress;
