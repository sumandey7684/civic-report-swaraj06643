import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, Shield, LogOut, User as UserIcon } from "lucide-react";
import { ThemeToggle } from "@/components/Theme/ThemeToggle";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";
import { useTranslation } from "react-i18next";
import { getCurrentUser, logoutUser } from "@/lib/authApi";

export const Header = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const user = getCurrentUser();

  return (
    <header className="fixed top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <div className="container mx-auto px-4 h-20 flex items-center justify-between">
        {/* Brand */}
        <div 
          className="flex items-center space-x-3 cursor-pointer group" 
          onClick={() => navigate("/")}
        >
          <div className="w-8 h-8 bg-black dark:bg-white flex items-center justify-center transition-transform group-hover:rotate-12">
            <Shield className="h-5 w-5 text-white dark:text-black" />
          </div>
          <span className="text-sm font-black uppercase tracking-tighter">CivicReport</span>
        </div>

        {/* Navigation */}
        <nav className="hidden md:flex items-center space-x-12">
          {["report", "map", "about", "contact"].map((item) => (
            <a
              key={item}
              href={`/${item}`}
              className="text-[10px] uppercase tracking-[0.2em] font-black text-muted-foreground hover:text-foreground transition-colors"
            >
              {t(`navigation.${item}`)}
            </a>
          ))}
        </nav>

        {/* System Actions */}
        <div className="flex items-center space-x-4">
          <div className="hidden sm:flex items-center space-x-2 border-r border-border pr-4 mr-2">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>

          {user ? (
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                className="h-8 px-2 text-[10px] uppercase tracking-widest font-black"
                onClick={() => navigate("/account")}
              >
                <UserIcon className="h-3 w-3 mr-2" />
                {user.name || 'SESSION'}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => {
                  logoutUser();
                  window.location.href = "/";
                }}
              >
                <LogOut className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <Button
              className="h-10 px-6 rounded-none text-[10px] uppercase tracking-[0.2em] font-black"
              onClick={() => navigate("/login")}
            >
              Initialize Access
            </Button>
          )}

          {/* Mobile Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-background border-b border-border p-6 space-y-6 animate-in slide-in-from-top duration-300">
          <nav className="flex flex-col space-y-4">
            {["report", "map", "about", "contact"].map((item) => (
              <a
                key={item}
                href={`/${item}`}
                className="text-xs uppercase tracking-widest font-black text-muted-foreground"
              >
                {t(`navigation.${item}`)}
              </a>
            ))}
          </nav>
          <div className="pt-6 border-t border-border flex items-center justify-between">
            <ThemeToggle />
            <LanguageSwitcher />
          </div>
        </div>
      )}
    </header>
  );
};
