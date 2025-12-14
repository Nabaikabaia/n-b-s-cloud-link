import { useState, useEffect } from "react";
import { Menu, X, FileText, Briefcase, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
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
      {/* Hamburger Button */}
      <Button
        variant="outline"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="glass-strong border border-primary/20 relative z-50 transition-all hover:scale-105 hover:border-primary/50 active:scale-95"
        aria-label="Menu"
        aria-expanded={isOpen}
      >
        <div className="relative w-5 h-5">
          <Menu className={`h-5 w-5 absolute inset-0 transition-all duration-300 ${isOpen ? 'opacity-0 rotate-90' : 'opacity-100 rotate-0'}`} />
          <X className={`h-5 w-5 absolute inset-0 transition-all duration-300 ${isOpen ? 'opacity-100 rotate-0' : 'opacity-0 -rotate-90'}`} />
        </div>
      </Button>

      {/* Menu Overlay */}
      <div
        className={`fixed inset-0 bg-background/80 backdrop-blur-sm z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsOpen(false)}
      />

      {/* Menu Panel */}
      <div
        className={`fixed top-16 left-4 glass-strong rounded-2xl border border-primary/20 shadow-2xl z-50 transition-all duration-300 ${
          isOpen
            ? "opacity-100 translate-y-0 scale-100"
            : "opacity-0 -translate-y-4 scale-95 pointer-events-none"
        }`}
      >
        <nav className="p-2 space-y-1 min-w-[200px]">
          {menuItems.map((item, index) => {
            const baseClasses = "flex items-center gap-3 px-4 py-3 rounded-xl transition-all group";
            const activeClasses = item.isActive ? "bg-primary/10 text-primary" : "hover:bg-muted/50";
            
            if (item.external) {
              return (
                <a
                  key={item.label}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${baseClasses} ${activeClasses}`}
                  onClick={() => setIsOpen(false)}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <item.icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  <span className="font-medium text-sm">{item.label}</span>
                </a>
              );
            }

            return (
              <button
                key={item.label}
                onClick={item.onClick}
                className={`w-full ${baseClasses} ${activeClasses}`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <item.icon className={`h-4 w-4 transition-colors ${item.isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'}`} />
                <span className="font-medium text-sm">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </>
  );
};

export default HamburgerMenu;
