import { useState, useEffect } from "react";
import { FileText, Briefcase, Home, ExternalLink, Menu, X } from "lucide-react";
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
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative z-50 w-10 h-10 rounded-full bg-card/80 backdrop-blur-sm border border-border hover:border-primary/50 flex items-center justify-center transition-all"
        aria-label="Menu"
        aria-expanded={isOpen}
      >
        {isOpen ? <X className="w-4 h-4 text-foreground" /> : <Menu className="w-4 h-4 text-foreground" />}
      </button>

      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-background/95 backdrop-blur-xl z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsOpen(false)}
      />

      {/* Menu */}
      <div className={`fixed inset-0 z-40 flex items-center justify-center transition-all duration-300 ${
        isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      }`}>
        <nav className="flex flex-col items-center gap-1">
          {menuItems.map((item, index) => {
            const delay = index * 60;
            const classes = `group flex items-center gap-4 px-8 py-4 rounded-2xl transition-all duration-200 hover:bg-primary/5 ${
              isOpen ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
            } ${'isActive' in item && item.isActive ? 'bg-primary/5' : ''}`;

            if (item.external) {
              return (
                <a key={item.label} href={item.href} target="_blank" rel="noopener noreferrer"
                  className={classes} style={{ transitionDelay: isOpen ? `${delay}ms` : '0ms' }}
                  onClick={() => setIsOpen(false)}>
                  <div className="w-10 h-10 rounded-xl bg-muted/60 border border-border flex items-center justify-center group-hover:border-primary/30 transition-colors">
                    <item.icon className="h-4 w-4 text-foreground" />
                  </div>
                  <span className="text-xl font-light text-foreground group-hover:text-primary transition-colors">{item.label}</span>
                  <ExternalLink className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
              );
            }

            return (
              <button key={item.label} onClick={item.onClick}
                className={classes} style={{ transitionDelay: isOpen ? `${delay}ms` : '0ms' }}>
                <div className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-colors ${
                  item.isActive ? 'border-primary/40 bg-primary/10' : 'border-border bg-muted/60 group-hover:border-primary/30'
                }`}>
                  <item.icon className="h-4 w-4 text-foreground" />
                </div>
                <span className={`text-xl font-light transition-colors ${
                  item.isActive ? 'text-primary' : 'text-foreground group-hover:text-primary'
                }`}>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </>
  );
};

export default HamburgerMenu;
