import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Menu, X, MapPin, Users, Shield, Bell, Phone, User } from "lucide-react";
import { motion } from "framer-motion";
import { NotificationDropdown } from "@/components/Notifications/NotificationDropdown";
import { ThemeToggle } from "@/components/Theme/ThemeToggle";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";
import { getToken, authApi } from "@/lib/api";

// Knowledge base from chatbot for answering queries
const FAQs = [
  { q: /hello|hi|hey/i, a: "Hi! I'm Civic. I can help you report issues, find the map, and answer questions about this app." },
  { q: /report|issue|complaint/i, a: "To report an issue, go to Report Issue, fill details, attach a photo, and submit. You'll get updates in your dashboard." },
  { q: /map|explore/i, a: "Open Map Explorer to view reported issues on the map and filter by category or status." },
  { q: /login|sign ?in/i, a: "Use Login to access your account. New users can sign up from the Signup page." },
  { q: /privacy|data/i, a: "We respect your privacy. Read our Privacy Policy page for details on data usage and storage." },
  { q: /contact|support|help/i, a: "You can reach the team via the Contact page. Provide a brief description and your email." },
  { q: /categories|types|what can i report/i, a: "You can report roads, streetlights, garbage, drainage, buildings, and other civic infrastructure issues." },
  { q: /photo|image|picture|upload/i, a: "Please upload clear images (JPEG/PNG/WebP). Avoid photos with faces for privacy. Max size is shown on the form." },
  { q: /admin|dashboard/i, a: "Admins can track and manage all incoming reports in the Admin Dashboard." },
];

function answerFromKnowledgeBase(message: string): string {
  for (const item of FAQs) {
    if (item.q.test(message)) return item.a;
  }
  return "I'm Civic. Tell me what you need help with: reporting an issue, using the map, logging in, or privacy/contact info.";
}

export const Header = () => {
  const { t } = useTranslation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);

  // Check auth state
  useEffect(() => {
    const checkAuth = async () => {
      const token = getToken();
      if (!token) {
        setIsLoggedIn(false);
        setUserName(null);
        return;
      }
      const { data, error } = await authApi.me();
      if (!error && data?.user) {
        setIsLoggedIn(true);
        setUserName(data.profile?.name || data.user.email?.split("@")[0] || "User");
      } else {
        setIsLoggedIn(false);
        setUserName(null);
      }
    };
    checkAuth();

    // Re-check on storage changes (login/logout in other tabs)
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "civic_auth_token") checkAuth();
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  // Speech recognition setup
  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  const recognition = SpeechRecognition ? new SpeechRecognition() : null;

  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Please use a modern browser like Google Chrome.");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = window.navigator.language || "en-US";
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setIsListening(false);
        const answer = answerFromKnowledgeBase(transcript);
        
        // Use a more modern way to show results if possible, but keeping alert for consistency as requested
        alert(`You said: "${transcript}"\n\nAnswer: ${answer}`);

        // Speech synthesis to read answer aloud
        if ("speechSynthesis" in window) {
          const utterance = new SpeechSynthesisUtterance(answer);
          window.speechSynthesis.speak(utterance);
        }
      };

      recognition.onerror = (event: any) => {
        setIsListening(false);
        console.error("Speech Recognition Error:", event.error);
        
        let message = "Error occurred in speech recognition: " + event.error;
        if (event.error === 'network') {
          message = "Network error. The speech service is unreachable. Please check your internet connection and try again.";
        } else if (event.error === 'not-allowed') {
          message = "Microphone access denied. Please allow microphone permissions in your browser.";
        } else if (event.error === 'no-speech') {
          return; // Ignore silence
        }
        
        alert(message);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err) {
      console.error("Error starting speech recognition:", err);
      setIsListening(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg gradient-civic">
              <Shield className="h-6 w-6 text-green-400" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold text-foreground">{t("header.brand")}</h1>
              <p className="text-xs text-muted-foreground">
                {t("header.tagline")}
              </p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <a
              href="/report"
              className="text-foreground hover:text-primary transition-colors font-medium"
            >
              {t("header.reportIssue")}
            </a>
            <a
              href="/map"
              className="text-foreground hover:text-primary transition-colors font-medium"
            >
              {t("header.mapExplorer")}
            </a>
            <a
              href="/about"
              className="text-foreground hover:text-primary transition-colors font-medium"
            >
              {t("header.about")}
            </a>
            <a
              href="/contact"
              className="text-foreground hover:text-primary transition-colors font-medium"
            >
              {t("header.contact")}
            </a>
          </nav>

          {/* Actions */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <NotificationDropdown />

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Language Switcher */}
            <LanguageSwitcher />

            {/* Call Button */}
            <Button
              variant={isListening ? "destructive" : "outline"}
              onClick={startListening}
              title={isListening ? "Listening..." : t("header.askCivic")}
              aria-label={t("header.askCivic")}
              className="hidden sm:flex"
            >
              <Phone className="h-5 w-5" />
            </Button>

            {/* Login / Account Button */}
            {isLoggedIn ? (
              <Button
                className="hidden sm:flex btn-civic-primary gap-2"
                onClick={() => (window.location.href = "/account")}
              >
                <User className="h-4 w-4" />
                {userName || t("header.myAccount")}
              </Button>
            ) : (
              <Button
                className="hidden sm:flex btn-civic-primary"
                onClick={() => (window.location.href = "/login")}
              >
                {t("header.login")}
              </Button>
            )}

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={toggleMobileMenu}
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-border mt-2 pt-4 pb-4"
          >
            <nav className="flex flex-col space-y-3">
              <a
                href="/report"
                className="text-foreground hover:text-primary transition-colors font-medium py-2"
              >
                {t("header.reportIssue")}
              </a>
              <a
                href="/map"
                className="text-foreground hover:text-primary transition-colors font-medium py-2"
              >
                {t("header.mapExplorer")}
              </a>
              <a
                href="/about"
                className="text-foreground hover:text-primary transition-colors font-medium py-2"
              >
                {t("header.about")}
              </a>
              <a
                href="/contact"
                className="text-foreground hover:text-primary transition-colors font-medium py-2"
              >
                {t("header.contact")}
              </a>
              <div className="flex flex-col space-y-2 pt-4">
                {isLoggedIn ? (
                  <Button
                    className="btn-civic-primary w-full gap-2"
                    onClick={() => (window.location.href = "/account")}
                  >
                    <User className="h-4 w-4" />
                    {userName || t("header.myAccount")}
                  </Button>
                ) : (
                  <Button
                    className="btn-civic-primary w-full"
                    onClick={() => (window.location.href = "/login")}
                  >
                    {t("header.login")}
                  </Button>
                )}
              </div>
            </nav>
          </motion.div>
        )}
      </div>
    </header>
  );
};
