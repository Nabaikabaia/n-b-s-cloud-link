import { useState, useEffect } from "react";
import { FileText, Briefcase, Home, ExternalLink } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

const HamburgerMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Close menu on route change
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, []);

  // Prevent scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const menuItems = [
    {
      label: "Home",
      icon: Home,
      onClick: () => {
        navigate("/");
        setIsOpen(false);
      },
      isActive: location.pathname === "/",
    },
    {
      label: "API Docs",
      icon: FileText,
      onClick: () => {
        navigate("/api-docs");
        setIsOpen(false);
      },
      isActive: location.pathname === "/api-docs",
    },
    {
      label: "My Projects",
      icon: Briefcase,
      href: "https://nabees-projects.vercel.app",
      external: true,
    },
  ];

  return (
    <>
      {/* Hamburger Button - Circular with glow effect */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative z-50 w-12 h-12 rounded-full border-2 border-primary/60 bg-background/80 backdrop-blur-md flex items-center justify-center transition-all duration-300 hover:border-primary hover:shadow-[0_0_20px_hsl(var(--primary)/0.5)] group"
        aria-label="Menu"
        aria-expanded={isOpen}
      >
        {/* Animated hamburger lines */}
        <div className="w-5 h-4 flex flex-col justify-between items-center">
          <span 
            className={`block h-0.5 bg-primary rounded-full transition-all duration-300 ease-out ${
              isOpen ? 'w-5 rotate-45 translate-y-[7px]' : 'w-5 group-hover:w-4'
            }`} 
          />
          <span 
            className={`block h-0.5 bg-primary rounded-full transition-all duration-300 ease-out ${
              isOpen ? 'w-0 opacity-0' : 'w-4 group-hover:w-5'
            }`} 
          />
          <span 
            className={`block h-0.5 bg-primary rounded-full transition-all duration-300 ease-out ${
              isOpen ? 'w-5 -rotate-45 -translate-y-[7px]' : 'w-5 group-hover:w-4'
            }`} 
          />
        </div>
        
        {/* Glow ring */}
        <div className={`absolute inset-0 rounded-full border border-primary/30 transition-all duration-300 ${isOpen ? 'scale-110 opacity-100' : 'scale-100 opacity-0 group-hover:opacity-100 group-hover:scale-105'}`} />
      </button>

      {/* Menu Overlay */}
      <div
        className={`fixed inset-0 bg-background/90 backdrop-blur-xl z-40 transition-all duration-500 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsOpen(false)}
      />

      {/* Full-screen Menu Panel */}
      <div
        className={`fixed inset-0 z-40 flex items-center justify-center transition-all duration-500 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        <nav className="flex flex-col items-center gap-2">
          {menuItems.map((item, index) => {
            const delay = index * 100;
            
            if (item.external) {
              return (
                <a
                  key={item.label}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`group flex items-center gap-4 px-8 py-4 rounded-2xl transition-all duration-300 hover:bg-primary/10 ${
                    isOpen ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
                  }`}
                  style={{ transitionDelay: isOpen ? `${delay}ms` : '0ms' }}
                  onClick={() => setIsOpen(false)}
                >
                  <div className="w-12 h-12 rounded-full border border-primary/30 bg-primary/5 flex items-center justify-center group-hover:border-primary/60 group-hover:bg-primary/10 transition-all duration-300 group-hover:shadow-[0_0_15px_hsl(var(--primary)/0.3)]">
                    <item.icon className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-2xl font-light text-foreground group-hover:text-primary transition-colors duration-300">{item.label}</span>
                  <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </a>
              );
            }

            return (
              <button
                key={item.label}
                onClick={item.onClick}
                className={`group flex items-center gap-4 px-8 py-4 rounded-2xl transition-all duration-300 hover:bg-primary/10 ${
                  isOpen ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
                } ${item.isActive ? 'bg-primary/10' : ''}`}
                style={{ transitionDelay: isOpen ? `${delay}ms` : '0ms' }}
              >
                <div className={`w-12 h-12 rounded-full border flex items-center justify-center transition-all duration-300 group-hover:shadow-[0_0_15px_hsl(var(--primary)/0.3)] ${
                  item.isActive 
                    ? 'border-primary bg-primary/20 shadow-[0_0_15px_hsl(var(--primary)/0.3)]' 
                    : 'border-primary/30 bg-primary/5 group-hover:border-primary/60 group-hover:bg-primary/10'
                }`}>
                  <item.icon className={`h-5 w-5 ${item.isActive ? 'text-primary' : 'text-primary'}`} />
                </div>
                <span className={`text-2xl font-light transition-colors duration-300 ${
                  item.isActive ? 'text-primary' : 'text-foreground group-hover:text-primary'
                }`}>{item.label}</span>
              </button>
            );
          })}
        </nav>
        
        {/* Decorative elements */}
        <div className={`absolute top-1/4 left-1/4 w-32 h-32 rounded-full bg-primary/5 blur-3xl transition-all duration-700 ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`} />
        <div className={`absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full bg-primary/5 blur-3xl transition-all duration-700 delay-100 ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`} />
      </div>
    </>
  );
};

export default HamburgerMenu;
