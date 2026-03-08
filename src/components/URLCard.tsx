import { useState } from 'react';
import { Copy, Check, ExternalLink, Sparkles } from 'lucide-react';
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
    toast({ title: "Link copied!", description: "Ready to share" });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative rounded-2xl bg-card border border-border p-6 sm:p-8 space-y-5">
      <div className="flex items-center justify-center gap-2">
        <Sparkles className="w-4 h-4 text-primary" />
        <h3 className="text-lg font-semibold text-foreground">Your link is ready</h3>
      </div>

      {customName && (
        <div className="text-center">
          <p className="text-base font-semibold text-primary">{customName}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{fileName}</p>
        </div>
      )}
      {!customName && (
        <p className="text-sm text-muted-foreground text-center">{fileName}</p>
      )}

      <div className="flex items-center gap-2 bg-muted/50 rounded-xl p-3 border border-primary/20">
        <code className="text-sm text-primary font-mono truncate flex-1">{url}</code>
        <Button size="sm" variant="ghost" onClick={handleCopy} className="shrink-0 hover:bg-primary/10">
          {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
        </Button>
      </div>

      <div className="flex gap-2 justify-center">
        <Button variant="outline" size="sm" onClick={() => window.open(url, '_blank')} className="text-sm">
          <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
          Open
        </Button>
        <Button size="sm" onClick={handleCopy} className="text-sm bg-primary text-primary-foreground hover:bg-primary/90">
          <Copy className="w-3.5 h-3.5 mr-1.5" />
          Copy Link
        </Button>
      </div>
    </div>
  );
};

export default URLCard;
