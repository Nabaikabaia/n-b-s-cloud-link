import { FileText, FileArchive, FileAudio, FileVideo, File as FileIcon, Image as ImageIcon } from 'lucide-react';

interface FilePreviewProps {
  file: File;
  previewUrl?: string;
}

const FilePreview = ({ file, previewUrl }: FilePreviewProps) => {
  const fileType = file.type.split('/')[0];

  const getFileIcon = () => {
    if (fileType === 'image') {
      return <ImageIcon className="w-8 h-8 text-primary" />;
    } else if (fileType === 'video') {
      return <FileVideo className="w-8 h-8 text-secondary" />;
    } else if (fileType === 'audio') {
      return <FileAudio className="w-8 h-8 text-accent" />;
    } else if (file.type.includes('pdf')) {
      return <FileText className="w-8 h-8 text-success" />;
    } else if (file.type.includes('zip') || file.type.includes('rar')) {
      return <FileArchive className="w-8 h-8 text-warning" />;
    } else {
      return <FileIcon className="w-8 h-8 text-muted-foreground" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  return (
    <div className="glass-strong rounded-2xl p-4 sm:p-6 border border-primary/30 transition-all hover:border-primary/50">
      <div className="flex items-start gap-3 sm:gap-4">
        {fileType === 'image' && previewUrl ? (
          <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden border border-primary/50 glow-cyan shrink-0">
            <img src={previewUrl} alt={file.name} className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg glass border border-primary/50 flex items-center justify-center shrink-0">
            {getFileIcon()}
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm text-muted-foreground">Selected file</p>
          <p className="text-base sm:text-lg font-semibold truncate">{file.name}</p>
          <div className="flex items-center gap-2 sm:gap-3 mt-1 sm:mt-2 text-xs sm:text-sm text-muted-foreground">
            <span>{formatFileSize(file.size)}</span>
            <span>•</span>
            <span className="truncate">{file.type || 'Unknown type'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilePreview;
