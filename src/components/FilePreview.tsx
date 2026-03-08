import { FileText, FileArchive, FileAudio, FileVideo, File as FileIcon, Image as ImageIcon } from 'lucide-react';

interface FilePreviewProps {
  file: File;
  previewUrl?: string;
}

const FilePreview = ({ file, previewUrl }: FilePreviewProps) => {
  const fileType = file.type.split('/')[0];

  const getFileIcon = () => {
    const iconClass = "w-7 h-7";
    if (fileType === 'image') return <ImageIcon className={`${iconClass} text-primary`} />;
    if (fileType === 'video') return <FileVideo className={`${iconClass} text-secondary`} />;
    if (fileType === 'audio') return <FileAudio className={`${iconClass} text-accent`} />;
    if (file.type.includes('pdf')) return <FileText className={`${iconClass} text-success`} />;
    if (file.type.includes('zip') || file.type.includes('rar')) return <FileArchive className={`${iconClass} text-accent`} />;
    return <FileIcon className={`${iconClass} text-muted-foreground`} />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  return (
    <div className="rounded-2xl bg-card border border-border p-4 sm:p-5 transition-colors hover:border-primary/30">
      <div className="flex items-center gap-4">
        {fileType === 'image' && previewUrl ? (
          <div className="w-14 h-14 rounded-xl overflow-hidden border border-border shrink-0">
            <img src={previewUrl} alt={file.name} className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="w-14 h-14 rounded-xl bg-muted/60 border border-border flex items-center justify-center shrink-0">
            {getFileIcon()}
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
            <span>{formatFileSize(file.size)}</span>
            <span className="w-1 h-1 rounded-full bg-border" />
            <span className="truncate">{file.type || 'Unknown'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilePreview;
