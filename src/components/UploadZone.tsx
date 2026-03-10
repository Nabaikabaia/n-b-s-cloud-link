import { useState, useCallback } from 'react';
import { Upload, CloudUpload } from 'lucide-react';
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
        toast({ title: "File too large", description: "Maximum file size is 100MB", variant: "destructive" });
        return;
      }
      onFileSelect(file);
    }
  }, [onFileSelect, toast]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 100 * 1024 * 1024) {
        toast({ title: "File too large", description: "Maximum file size is 100MB", variant: "destructive" });
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
        relative overflow-hidden rounded-2xl p-10 sm:p-16 transition-all duration-300
        border-2 border-dashed
        ${isDragging
          ? 'border-primary bg-primary/5 scale-[1.01]'
          : 'border-border bg-card/30'
        }
        ${isUploading ? 'opacity-50 pointer-events-none' : ''}
      `}
    >
      <div className="relative z-10 flex flex-col items-center justify-center space-y-5">
        <div className={`p-5 rounded-2xl transition-all duration-300 ${
          isDragging ? 'bg-primary/10 scale-110' : 'bg-muted/60'
        }`}>
          <CloudUpload size={44} className="text-primary" />
        </div>

        <div className="text-center space-y-2">
          <h3 className="text-xl sm:text-2xl font-semibold text-foreground">
            {isDragging ? 'Drop it here' : 'Drop your file here'}
          </h3>
          <p className="text-muted-foreground text-sm">
            or tap the button below
          </p>
        </div>

        <label
          htmlFor="file-upload-input"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm sm:text-base cursor-pointer hover:bg-primary/90 active:scale-95 transition-all shadow-md select-none touch-manipulation"
        >
          <Upload size={18} />
          Browse Files
        </label>

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="px-2.5 py-1 rounded-full bg-muted/80">Max 100MB</span>
          <span className="px-2.5 py-1 rounded-full bg-muted/80">Any file type</span>
        </div>
      </div>

      <input
        id="file-upload-input"
        type="file"
        onChange={handleFileInput}
        className="sr-only"
        disabled={isUploading}
      />
    </div>
  );
};

export default UploadZone;
