import { useState } from "react";
import { Menu, X, FileText, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const HamburgerMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const menuItems = [
    {
      label: "API Docs",
      icon: FileText,
      onClick: () => {
        navigate("/api-docs");
        setIsOpen(false);
      },
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
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="glass-panel relative z-50"
        aria-label="Menu"
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Menu Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Menu Panel */}
      <div
        className={`fixed top-16 right-4 glass-strong rounded-2xl border border-primary/20 shadow-2xl z-50 transition-all duration-300 ${
          isOpen
            ? "opacity-100 translate-y-0"
            : "opacity-0 -translate-y-4 pointer-events-none"
        }`}
      >
        <nav className="p-2 space-y-1 min-w-[200px]">
          {menuItems.map((item) => {
            if (item.external) {
              return (
                <a
                  key={item.label}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-muted/50 transition-colors group"
                  onClick={() => setIsOpen(false)}
                >
                  <item.icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  <span className="font-medium">{item.label}</span>
                </a>
              );
            }

            return (
              <button
                key={item.label}
                onClick={item.onClick}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-muted/50 transition-colors group"
              >
                <item.icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </>
  );
};

export default HamburgerMenu;
