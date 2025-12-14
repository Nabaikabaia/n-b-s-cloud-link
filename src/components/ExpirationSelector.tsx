import { Clock } from 'lucide-react';

interface ExpirationSelectorProps {
  selected: string;
  onChange: (value: string) => void;
}

const ExpirationSelector = ({ selected, onChange }: ExpirationSelectorProps) => {
  const options = [
    { value: '1h', label: '1 Hour', icon: '⚡' },
    { value: '24h', label: '24 Hours', icon: '☀️' },
    { value: '7d', label: '7 Days', icon: '📅' },
    { value: 'never', label: 'Never', icon: '∞' },
  ];

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="flex items-center justify-center gap-2 text-muted-foreground">
        <Clock className="w-4 h-4" />
        <span className="text-xs sm:text-sm">Link Expiration</span>
      </div>

      <div className="grid grid-cols-4 gap-2 sm:gap-3">
        {options.map((option) => (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={`
              relative overflow-hidden rounded-xl p-2.5 sm:p-4 transition-all duration-300
              ${selected === option.value
                ? 'glass-strong border-2 border-primary glow-cyan scale-105'
                : 'glass border border-border hover:border-primary/50 hover:scale-[1.02]'
              }
            `}
          >
            <div className="flex flex-col items-center gap-1 sm:gap-2">
              <span className="text-lg sm:text-2xl">{option.icon}</span>
              <span className="text-[10px] sm:text-sm font-medium">{option.label}</span>
            </div>
            {selected === option.value && (
              <div className="absolute inset-0 bg-primary/5 animate-pulse" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ExpirationSelector;
