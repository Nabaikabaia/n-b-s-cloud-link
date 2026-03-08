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
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const getExpiryStatus = (expireAt: string | null) => {
    if (!expireAt) return { text: 'Never', expired: false, className: 'text-success' };
    const expiry = new Date(expireAt);
    if (expiry < new Date()) return { text: 'Expired', expired: true, className: 'text-destructive' };
    return { text: `${formatDistanceToNow(expiry, { addSuffix: true })}`, expired: false, className: 'text-muted-foreground' };
  };

  const handleCopy = (upload: Upload) => {
    const url = getPublicUrl(upload.short_id, upload.custom_name);
    navigator.clipboard.writeText(url);
    toast({ title: "Copied!", description: "Link copied to clipboard" });
  };

  const displayedUploads = isExpanded ? uploads : uploads.slice(0, 3);

  return (
    <div className="rounded-2xl bg-card border border-border p-5 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-foreground">Recent Uploads</h3>
        {uploads.length > 3 && (
          <Button variant="ghost" size="sm" onClick={() => setIsExpanded(!isExpanded)} className="text-xs text-muted-foreground">
            {isExpanded ? <><ChevronUp className="w-3.5 h-3.5 mr-1" /> Less</> : <><ChevronDown className="w-3.5 h-3.5 mr-1" /> All ({uploads.length})</>}
          </Button>
        )}
      </div>

      <div className="space-y-2">
        {displayedUploads.map((upload) => {
          const expiryStatus = getExpiryStatus(upload.expire_at);
          const url = getPublicUrl(upload.short_id, upload.custom_name);

          return (
            <div key={upload.id} className={`rounded-xl p-3 sm:p-4 border transition-colors ${
              expiryStatus.expired ? 'border-destructive/20 opacity-50' : 'border-border hover:border-primary/30'
            }`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  {upload.custom_name && (
                    <p className="text-sm font-medium text-primary truncate">{upload.custom_name}</p>
                  )}
                  <p className={`text-sm truncate ${upload.custom_name ? 'text-muted-foreground text-xs' : 'font-medium text-foreground'}`}>
                    {upload.file_name}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground flex-wrap">
                    <span>{formatFileSize(upload.file_size)}</span>
                    <span className="w-1 h-1 rounded-full bg-border" />
                    <span>{formatDistanceToNow(new Date(upload.created_at), { addSuffix: true })}</span>
                    {upload.download_count > 0 && (
                      <>
                        <span className="w-1 h-1 rounded-full bg-border" />
                        <span className="flex items-center gap-0.5"><Download className="w-3 h-3" />{upload.download_count}</span>
                      </>
                    )}
                  </div>
                  <div className={`flex items-center gap-1 mt-1 text-xs ${expiryStatus.className}`}>
                    <Clock className="w-3 h-3" />
                    {expiryStatus.text}
                  </div>
                </div>

                <div className="flex gap-1 shrink-0">
                  <Button size="sm" variant="ghost" onClick={() => handleCopy(upload)} className="h-8 w-8 p-0" disabled={expiryStatus.expired}>
                    <Copy className="w-3.5 h-3.5" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => window.open(url, '_blank')} className="h-8 w-8 p-0" disabled={expiryStatus.expired}>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => onDelete(upload)} className="h-8 w-8 p-0 hover:text-destructive">
                    <Trash2 className="w-3.5 h-3.5" />
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
