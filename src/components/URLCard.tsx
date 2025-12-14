import { useState } from 'react';
import { Copy, Check, ExternalLink, QrCode, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface URLCardProps {
  url: string;
  fileName: string;
  customName?: string | null;
}

const URLCard = ({ url, fileName, customName }: URLCardProps) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast({
      title: "✨ Link Copied!",
      description: "Your file link is ready to share",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative overflow-hidden rounded-3xl glass-strong border border-primary/30 p-6 sm:p-8" style={{ animationDelay: '0.5s' }}>
      {/* Holographic shimmer effect */}
      <div className="absolute inset-0 shimmer" />
      
      {/* Glow effect */}
      <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-primary/30 blur-3xl" />
      <div className="absolute -bottom-20 -left-20 w-40 h-40 rounded-full bg-secondary/30 blur-3xl" />

      <div className="relative z-10 space-y-4 sm:space-y-6">
        <div className="flex items-center justify-center gap-2">
          <Sparkles className="w-5 h-5 text-accent animate-pulse" />
          <h3 className="text-lg sm:text-xl font-bold gradient-text">URL Generated!</h3>
          <Sparkles className="w-5 h-5 text-accent animate-pulse" />
        </div>

        <div className="space-y-3">
          {customName && (
            <div className="text-center">
              <p className="text-base sm:text-lg font-bold text-primary mb-1">{customName}</p>
              <p className="text-xs sm:text-sm text-muted-foreground">({fileName})</p>
            </div>
          )}
          {!customName && (
            <p className="text-xs sm:text-sm text-muted-foreground text-center">File: {fileName}</p>
          )}
          
          <div className="glass rounded-xl p-3 sm:p-4 border border-primary/50 glow-cyan">
            <div className="flex items-center justify-between gap-2 sm:gap-3">
              <code className="text-xs sm:text-sm text-primary font-mono truncate flex-1">
                {url}
              </code>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleCopy}
                className="shrink-0 hover:bg-primary/20 transition-all hover:scale-110 active:scale-95"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-success" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </div>

        <div className="flex gap-2 sm:gap-3 justify-center flex-wrap">
          <Button
            variant="outline"
            size="sm"
            className="glass border-primary/50 hover:bg-primary/20 hover:glow-cyan transition-all hover:scale-105 active:scale-95 text-xs sm:text-sm"
            onClick={() => window.open(url, '_blank')}
          >
            <ExternalLink className="w-4 h-4 mr-1 sm:mr-2" />
            Open Link
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            className="glass border-secondary/50 hover:bg-secondary/20 hover:glow-purple transition-all hover:scale-105 active:scale-95 text-xs sm:text-sm"
          >
            <QrCode className="w-4 h-4 mr-1 sm:mr-2" />
            QR Code
          </Button>
        </div>
      </div>
    </div>
  );
};

export default URLCard;
