import { Shield, Github, Twitter, Linkedin, Mail } from "lucide-react";
import { motion } from "framer-motion";

export const Footer = () => {
  return (
    <footer className="py-20 bg-background border-t border-border">
      <div className="container max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-20">
          <div className="col-span-1 md:col-span-2 space-y-6">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-black dark:bg-white flex items-center justify-center">
                <Shield className="h-5 w-5 text-white dark:text-black" />
              </div>
              <span className="text-lg font-black uppercase tracking-tighter">CivicReport</span>
            </div>
            <p className="max-w-xs text-sm text-muted-foreground font-light leading-relaxed uppercase tracking-tight">
              A national initiative for digitized communal synergy and proactive governance.
            </p>
          </div>

          <div className="space-y-6">
            <h4 className="text-[10px] uppercase tracking-[0.3em] font-black">Portal</h4>
            <ul className="space-y-3 text-xs uppercase tracking-widest font-bold text-muted-foreground">
              <li><a href="/report" className="hover:text-foreground transition-colors">Reports</a></li>
              <li><a href="/map" className="hover:text-foreground transition-colors">Explorer</a></li>
              <li><a href="/about" className="hover:text-foreground transition-colors">About</a></li>
              <li><a href="/contact" className="hover:text-foreground transition-colors">Contact</a></li>
            </ul>
          </div>

          <div className="space-y-6">
            <h4 className="text-[10px] uppercase tracking-[0.3em] font-black">Legal</h4>
            <ul className="space-y-3 text-xs uppercase tracking-widest font-bold text-muted-foreground">
              <li><a href="/privacy" className="hover:text-foreground transition-colors">Privacy</a></li>
              <li><a href="/terms" className="hover:text-foreground transition-colors">Terms</a></li>
              <li><a href="/data" className="hover:text-foreground transition-colors">Data</a></li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-border gap-8">
          <div className="text-[10px] uppercase tracking-[0.2em] font-black text-muted-foreground">
            © 2025 CivicReport. SIH Precision Framework.
          </div>
          
          <div className="flex items-center space-x-6 text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors"><Github className="h-4 w-4" /></a>
            <a href="#" className="hover:text-foreground transition-colors"><Twitter className="h-4 w-4" /></a>
            <a href="#" className="hover:text-foreground transition-colors"><Linkedin className="h-4 w-4" /></a>
            <a href="#" className="hover:text-foreground transition-colors"><Mail className="h-4 w-4" /></a>
          </div>
        </div>
      </div>
    </footer>
  );
};
