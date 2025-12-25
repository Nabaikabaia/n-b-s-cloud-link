import { useState, useEffect } from 'react';
import { X, Gift, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import christmasVideo from '@/assets/christmas-greeting.mp4';

const ChristmasModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [hasShown, setHasShown] = useState(false);

  useEffect(() => {
    // Check if already shown this session
    const shown = sessionStorage.getItem('christmas-modal-shown');
    if (!shown && !hasShown) {
      // Small delay for better UX
      const timer = setTimeout(() => {
        setIsOpen(true);
        setHasShown(true);
        sessionStorage.setItem('christmas-modal-shown', 'true');
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [hasShown]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={() => setIsOpen(false)}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-2xl animate-scale-in">
        {/* Close button */}
        <button
          onClick={() => setIsOpen(false)}
          className="absolute -top-3 -right-3 z-10 p-2 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors shadow-lg"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Card */}
        <div className="relative overflow-hidden rounded-2xl border-2 border-[hsl(0,70%,50%)] bg-gradient-to-br from-[hsl(0,70%,25%)] via-[hsl(140,60%,25%)] to-[hsl(0,70%,25%)] p-1">
          <div className="rounded-xl bg-gradient-to-br from-background/95 to-background/90 backdrop-blur-xl p-6 sm:p-8">
            {/* Decorative elements */}
            <div className="absolute top-4 left-4 text-[hsl(45,100%,50%)] animate-pulse">
              <Sparkles className="h-6 w-6" />
            </div>
            <div className="absolute top-4 right-4 text-[hsl(0,70%,50%)] animate-pulse" style={{ animationDelay: '0.5s' }}>
              <Gift className="h-6 w-6" />
            </div>

            {/* Header */}
            <div className="text-center mb-6">
              <h2 className="text-3xl sm:text-4xl font-bold mb-2">
                <span className="text-[hsl(0,70%,50%)]">Merry</span>{' '}
                <span className="text-[hsl(140,60%,45%)]">Christmas!</span>
              </h2>
              <p className="text-lg text-muted-foreground">
                🎄 From Nãbēēs Tech Family 🎄
              </p>
            </div>

            {/* Video Container */}
            <div className="relative aspect-video rounded-xl overflow-hidden border border-border/50 shadow-2xl mb-6">
              <video
                src={christmasVideo}
                autoPlay
                loop
                muted={false}
                controls
                className="w-full h-full object-cover"
              />
            </div>

            {/* Message */}
            <div className="text-center space-y-4">
              <p className="text-muted-foreground">
                Wishing you joy, peace, and happiness this holiday season! 🎁✨
              </p>
              <Button
                onClick={() => setIsOpen(false)}
                className="bg-gradient-to-r from-[hsl(0,70%,45%)] to-[hsl(140,60%,35%)] hover:from-[hsl(0,70%,40%)] hover:to-[hsl(140,60%,30%)] text-white border-0 px-8"
              >
                <Gift className="h-4 w-4 mr-2" />
                Continue to Nãbēēs Uploader
              </Button>
            </div>

            {/* Floating decorations */}
            <div className="absolute -bottom-2 -left-2 text-4xl animate-bounce" style={{ animationDuration: '2s' }}>
              🎅
            </div>
            <div className="absolute -bottom-2 -right-2 text-4xl animate-bounce" style={{ animationDuration: '2.5s' }}>
              🎄
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChristmasModal;
