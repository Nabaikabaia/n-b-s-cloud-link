import { Clock } from 'lucide-react';

interface ExpirationSelectorProps {
  selected: string;
  onChange: (value: string) => void;
}

const ExpirationSelector = ({ selected, onChange }: ExpirationSelectorProps) => {
  const options = [
    { value: '1h', label: '1 Hour' },
    { value: '24h', label: '24 Hours' },
    { value: '7d', label: '7 Days' },
    { value: 'never', label: 'Forever' },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Clock className="w-3.5 h-3.5" />
        <span>Expiration</span>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {options.map((option) => (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={`
              rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200
              ${selected === option.value
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground border border-transparent hover:border-border'
              }
            `}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ExpirationSelector;
