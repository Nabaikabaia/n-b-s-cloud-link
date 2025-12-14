import { useState } from 'react';
import { Trash2, Copy, ExternalLink, Clock, Download, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Upload } from '@/hooks/useUploads';
import { formatDistanceToNow } from 'date-fns';

interface UploadHistoryProps {
  uploads: Upload[];
  onDelete: (upload: Upload) => void;
  getPublicUrl: (shortId: string, customName?: string | null) => string;
}

const UploadHistory = ({ uploads, onDelete, getPublicUrl }: UploadHistoryProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { toast } = useToast();

  if (uploads.length === 0) return null;

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const getExpiryStatus = (expireAt: string | null) => {
    if (!expireAt) return { text: 'Never', expired: false, className: 'text-success' };
    
    const expiry = new Date(expireAt);
    const now = new Date();
    
    if (expiry < now) {
      return { text: 'Expired', expired: true, className: 'text-destructive' };
    }
    
    return { 
      text: `Expires ${formatDistanceToNow(expiry, { addSuffix: true })}`, 
      expired: false,
      className: 'text-warning'
    };
  };

  const handleCopy = (upload: Upload) => {
    const url = getPublicUrl(upload.short_id, upload.custom_name);
    navigator.clipboard.writeText(url);
    toast({
      title: "✨ Copied!",
      description: "Link copied to clipboard",
    });
  };

  const displayedUploads = isExpanded ? uploads : uploads.slice(0, 3);

  return (
    <div className="glass-strong rounded-3xl p-4 sm:p-6 border border-border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg sm:text-xl font-bold gradient-text">Upload History</h3>
        {uploads.length > 3 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-muted-foreground hover:text-primary transition-all text-xs sm:text-sm"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-4 h-4 mr-1" />
                Show Less
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4 mr-1" />
                Show All ({uploads.length})
              </>
            )}
          </Button>
        )}
      </div>

      <div className="space-y-2 sm:space-y-3">
        {displayedUploads.map((upload, index) => {
          const expiryStatus = getExpiryStatus(upload.expire_at);
          const url = getPublicUrl(upload.short_id, upload.custom_name);

          return (
            <div
              key={upload.id}
              className={`glass rounded-xl p-3 sm:p-4 border transition-all duration-300 hover:scale-[1.01] ${
                expiryStatus.expired 
                  ? 'border-destructive/30 opacity-60' 
                  : 'border-primary/20 hover:border-primary/50'
              }`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-start justify-between gap-2 sm:gap-3">
                <div className="flex-1 min-w-0">
                  {upload.custom_name && (
                    <p className="text-xs sm:text-sm font-bold text-primary truncate">{upload.custom_name}</p>
                  )}
                  <p className={`${upload.custom_name ? 'text-xs sm:text-sm text-muted-foreground' : 'text-sm font-semibold'} truncate`}>
                    {upload.file_name}
                  </p>
                  <div className="flex items-center gap-2 sm:gap-3 mt-1 text-[10px] sm:text-xs text-muted-foreground flex-wrap">
                    <span>{formatFileSize(upload.file_size)}</span>
                    <span className="hidden sm:inline">•</span>
                    <span className="hidden sm:inline">{formatDistanceToNow(new Date(upload.created_at), { addSuffix: true })}</span>
                    {upload.download_count > 0 && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Download className="w-3 h-3" />
                          {upload.download_count}
                        </span>
                      </>
                    )}
                  </div>
                  <div className={`flex items-center gap-1 mt-1.5 sm:mt-2 text-[10px] sm:text-xs ${expiryStatus.className}`}>
                    <Clock className="w-3 h-3" />
                    {expiryStatus.text}
                  </div>
                  <code className="text-[10px] sm:text-xs text-primary font-mono mt-1.5 sm:mt-2 block truncate">
                    {url}
                  </code>
                </div>

                <div className="flex gap-1 sm:gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleCopy(upload)}
                    className="hover:bg-primary/20 h-8 w-8 p-0 transition-all hover:scale-110"
                    disabled={expiryStatus.expired}
                  >
                    <Copy className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => window.open(url, '_blank')}
                    className="hover:bg-primary/20 h-8 w-8 p-0 transition-all hover:scale-110"
                    disabled={expiryStatus.expired}
                  >
                    <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onDelete(upload)}
                    className="hover:bg-destructive/20 hover:text-destructive h-8 w-8 p-0 transition-all hover:scale-110"
                  >
                    <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default UploadHistory;
