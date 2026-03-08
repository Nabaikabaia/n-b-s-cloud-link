import { useState, useEffect } from "react";
import { FileText, Briefcase, Home, ExternalLink } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

const HamburgerMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => { setIsOpen(false); }, [location.pathname]);
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsOpen(false); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const menuItems = [
    { label: "Home", icon: Home, onClick: () => navigate("/"), isActive: location.pathname === "/" },
    { label: "API Docs", icon: FileText, onClick: () => navigate("/api-docs"), isActive: location.pathname === "/api-docs" },
    { label: "My Projects", icon: Briefcase, href: "https://nabees-projects.vercel.app", external: true },
  ];

  return (
    <>
      {/* Stacked lines hamburger button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative z-50 w-11 h-11 rounded-2xl bg-card/70 backdrop-blur-md border border-border/60 hover:border-primary/40 flex flex-col items-center justify-center gap-[5px] transition-all duration-300 group"
        aria-label="Menu"
        aria-expanded={isOpen}
      >
        <span className={`block h-[2px] w-5 rounded-full bg-foreground transition-all duration-300 origin-center ${isOpen ? 'rotate-45 translate-y-[7px]' : 'group-hover:w-4'}`} />
        <span className={`block h-[2px] w-5 rounded-full bg-foreground transition-all duration-300 ${isOpen ? 'opacity-0 scale-x-0' : 'group-hover:w-3'}`} />
        <span className={`block h-[2px] w-5 rounded-full bg-foreground transition-all duration-300 origin-center ${isOpen ? '-rotate-45 -translate-y-[7px]' : 'group-hover:w-4'}`} />
      </button>

      {/* Fullscreen overlay */}
      <div
        className={`fixed inset-0 z-40 transition-all duration-500 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        style={{
          background: 'radial-gradient(ellipse at top left, hsl(var(--primary) / 0.08), transparent 50%), hsl(var(--background) / 0.97)',
          backdropFilter: 'blur(24px)',
        }}
        onClick={() => setIsOpen(false)}
      />

      {/* Menu content */}
      <div className={`fixed inset-0 z-40 flex items-center justify-center transition-all duration-500 ${
        isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      }`}>
        <nav className="flex flex-col items-start gap-2 px-8">
          <p className={`text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground mb-4 transition-all duration-500 ${isOpen ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'}`}>
            Navigation
          </p>
          {menuItems.map((item, index) => {
            const delay = 80 + index * 60;
            const isActive = 'isActive' in item && item.isActive;

            const content = (
              <>
                <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center transition-all duration-300 ${
                  isActive
                    ? 'border-primary/50 bg-primary/15 shadow-[0_0_20px_hsl(var(--primary)/0.15)]'
                    : 'border-border/60 bg-muted/40 group-hover:border-primary/30 group-hover:bg-primary/5'
                }`}>
                  <item.icon className={`h-5 w-5 transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'}`} />
                </div>
                <div className="flex flex-col">
                  <span className={`text-2xl font-light tracking-tight transition-colors ${
                    isActive ? 'text-primary' : 'text-foreground group-hover:text-primary'
                  }`}>{item.label}</span>
                  {isActive && (
                    <span className="text-[10px] text-primary/60 font-medium">Current page</span>
                  )}
                </div>
                {item.external && (
                  <ExternalLink className="h-4 w-4 text-muted-foreground/40 ml-2 group-hover:text-muted-foreground transition-colors" />
                )}
              </>
            );

            const classes = `group flex items-center gap-5 px-6 py-3 rounded-2xl transition-all duration-300 hover:bg-primary/[0.04] ${
              isOpen ? 'translate-x-0 opacity-100' : '-translate-x-8 opacity-0'
            }`;

            if (item.external) {
              return (
                <a key={item.label} href={item.href} target="_blank" rel="noopener noreferrer"
                  className={classes} style={{ transitionDelay: isOpen ? `${delay}ms` : '0ms' }}
                  onClick={() => setIsOpen(false)}>
                  {content}
                </a>
              );
            }

            return (
              <button key={item.label} onClick={item.onClick}
                className={classes} style={{ transitionDelay: isOpen ? `${delay}ms` : '0ms' }}>
                {content}
              </button>
            );
          })}

          {/* Decorative line */}
          <div className={`w-16 h-px bg-border/60 mt-6 ml-6 transition-all duration-500 ${isOpen ? 'scale-x-100 opacity-100' : 'scale-x-0 opacity-0'}`} style={{ transitionDelay: isOpen ? '320ms' : '0ms' }} />
          <p className={`text-[10px] text-muted-foreground/50 ml-6 mt-2 transition-all duration-500 ${isOpen ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`} style={{ transitionDelay: isOpen ? '380ms' : '0ms' }}>
            Press <kbd className="px-1.5 py-0.5 rounded bg-muted/60 border border-border/60 text-foreground/60 font-mono text-[9px]">ESC</kbd> to close
          </p>
        </nav>
      </div>
    </>
  );
};

export default HamburgerMenu;
