import { useState, useRef } from "react";
import {
  Shield,
  Github,
  Twitter,
  Linkedin,
  Mail,
  Facebook,
  Send,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, useInView, useMotionValue, useTransform } from "framer-motion";

const footerLinks = {
  navigation: [
    { href: "/", label: "Home" },
    { href: "/about", label: "About" },
    { href: "/report", label: "Report Issue" },
    { href: "/map", label: "Map Explorer" },
    { href: "/contact", label: "Contact" },
  ],
  support: [
    { href: "tel:+917735248493", label: "Help Center" },
    { href: "#", label: "API Documentation" },
    { href: "#", label: "Admin Portal" },
    { href: "tel:+917735248493", label: "Contact Support" },
  ],
  legal: [
    { href: "/privacy-policy", label: "Privacy Policy" },
    { href: "#", label: "Terms of Service" },
    { href: "#", label: "Data Protection" },
    { href: "#", label: "Accessibility" },
  ],
};

const socialLinks = [
  { Icon: Facebook, color: "blue", href: "#" },
  { Icon: Twitter, color: "sky", href: "https://www.x.com/sumxnnn" },
  {
    Icon: Linkedin,
    color: "blue",
    href: "https://www.linkedin.com/in/subhasish-rath-926b902a4",
  },
  { Icon: Github, color: "slate", href: "https://www.github.com/sumandey7684" },
  { Icon: Mail, color: "red", href: "#" },
];

export const Footer = () => {
  const [email, setEmail] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const footerRef = useRef(null);
  const isInView = useInView(footerRef, { once: true, margin: "-100px" });

  // Parallax
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const parallaxX = useTransform(mouseX, [0, 1000], [-20, 20]);
  const parallaxY = useTransform(mouseY, [0, 1000], [-20, 20]);
  const handleMouseMove = (event: React.MouseEvent) => {
    const rect = event.currentTarget.getBoundingClientRect();
    mouseX.set(event.clientX - rect.left);
    mouseY.set(event.clientY - rect.top);
  };

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setIsSubscribed(true);
      setEmail("");
      setTimeout(() => setIsSubscribed(false), 3000);
    }
  };

  const itemVariants = {
    hidden: { y: 50, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring" as const, stiffness: 150, damping: 25 },
    },
  };

  const linkVariants = {
    rest: { x: 0, color: "hsl(var(--muted-foreground))" },
    hover: {
      x: 8,
      color: "hsl(var(--primary))",
      textShadow: "0 0 8px hsl(var(--primary)/0.6)",
      transition: { type: "spring" as const, stiffness: 400, damping: 17 },
    },
  };

  const socialIconVariants = {
    rest: { scale: 1, rotate: 0 },
    hover: {
      scale: 1.2,
      rotate: [0, -10, 10, -5, 0],
      y: -4,
      transition: {
        type: "spring" as const,
        stiffness: 300,
        damping: 15,
        rotate: { duration: 0.4, ease: "easeInOut" as const },
      },
    },
  };

  return (
    <motion.footer
      ref={footerRef}
      onMouseMove={handleMouseMove}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={itemVariants}
      className="relative bg-gradient-to-br from-background via-muted/20 to-background border-t border-border overflow-hidden"
    >
      {/* Parallax Animated Background */}
      <motion.div className="absolute inset-0 pointer-events-none">
        <motion.div
          style={{ x: parallaxX, y: parallaxY }}
          className="absolute inset-0 bg-gradient-to-t from-primary/5 via-transparent to-secondary/3"
        />
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-primary/20 rounded-full blur-sm"
            style={{ left: `${10 + i * 15}%`, top: `${20 + i * 10}%` }}
            animate={{
              x: [0, 100, 0],
              y: [0, -50, 0],
              opacity: [0.3, 0.8, 0.3],
            }}
            transition={{
              duration: 8 + i * 2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 1.5,
            }}
          />
        ))}
      </motion.div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10">
        <div className="grid lg:grid-cols-5 md:grid-cols-3 gap-12">
          {/* Brand & Newsletter */}
          <motion.div
            className="lg:col-span-2 space-y-8"
            variants={itemVariants}
          >
            <motion.div className="space-y-6">
              <div className="flex items-center space-x-3">
                <motion.div
                  className="flex h-12 w-12 items-center justify-center rounded-xl gradient-civic shadow-lg"
                  whileHover={{ scale: 1.1, rotate: [0, -5, 5, 0] }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <Shield className="h-7 w-7 text-white" />
                </motion.div>
                <div>
                  <h3 className="text-2xl font-bold text-foreground">
                    Civic Report
                  </h3>
                  <p className="text-sm text-primary font-medium">
                    Building Smarter Communities Together
                  </p>
                </div>
              </div>
              <p className="text-base text-muted-foreground leading-relaxed max-w-md">
                Empowering citizens and government to collaborate for better
                communities through innovative technology solutions.
              </p>
            </motion.div>

            {/* Newsletter */}
            <motion.div className="space-y-4">
              <h4 className="text-lg font-semibold text-foreground mb-2">
                Stay Updated
              </h4>
              <p className="text-sm text-muted-foreground">
                Get the latest updates on civic improvements and community
                initiatives.
              </p>
              <form onSubmit={handleNewsletterSubmit} className="flex gap-2">
                <motion.div className="flex-1 relative">
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="glass-effect border-border/50 focus:border-primary focus:shadow-[0_0_20px_hsl(var(--primary)/0.3)] transition-all duration-300 bg-background/80 backdrop-blur-sm"
                    required
                    onFocus={() => setIsHovered(true)}
                    onBlur={() => setIsHovered(false)}
                  />
                  {!email && !isHovered && (
                    <motion.span className="absolute inset-0 flex items-center px-3 text-muted-foreground/60 animate-pulse">
                      ✨ Enter your email...
                    </motion.span>
                  )}
                </motion.div>
                <Button
                  type="submit"
                  size="sm"
                  className="btn-civic-primary"
                  disabled={isSubscribed}
                >
                  {isSubscribed ? "Subscribed!" : "Subscribe"}{" "}
                  <Send className="h-4 w-4 ml-1" />
                </Button>
              </form>
            </motion.div>
          </motion.div>

          {/* Quick Navigation, Support, Legal */}
          {Object.entries(footerLinks).map(([section, links], idx) => (
            <motion.div
              className="space-y-6"
              key={section}
              variants={itemVariants}
            >
              <h4 className="text-lg font-bold text-foreground tracking-tight">
                {section.charAt(0).toUpperCase() + section.slice(1)}
              </h4>
              <div className="w-8 h-0.5 bg-gradient-to-r from-primary to-transparent"></div>
              <ul className="space-y-4">
                {links.map((link, index) => (
                  <motion.li key={index}>
                    <motion.a
                      href={link.href}
                      className="text-muted-foreground font-medium flex items-center group relative overflow-hidden rounded-lg px-3 py-2 -mx-3"
                      variants={linkVariants}
                      initial="rest"
                      whileHover="hover"
                    >
                      <ArrowRight className="h-3 w-3 mr-3 opacity-0 group-hover:opacity-100 transition-all duration-300" />
                      {link.label}
                    </motion.a>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Bottom Section */}
        <motion.div
          className="border-t border-border/50 mt-16 pt-8 flex flex-col lg:flex-row justify-between items-center gap-6"
          variants={itemVariants}
        >
          <div className="text-center lg:text-left">
            <p className="text-sm text-muted-foreground">
              © 2025 CivicReport. Built for Academic PPD lab. All
              rights reserved.
            </p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              Developed by Team Technophiles with ❤️ for better governance
            </p>
          </div>

          {/* Social Media */}
          <div className="flex items-center space-x-2">
            <p className="text-sm text-muted-foreground mr-4 hidden sm:block">
              Follow us:
            </p>
            <div className="flex items-center space-x-1">
              {socialLinks.map(({ Icon, href }, i) => (
                <motion.a
                  key={i}
                  href={href}
                  className="p-2 rounded-lg text-muted-foreground"
                  variants={socialIconVariants}
                  initial="rest"
                  whileHover="hover"
                >
                  <Icon className="h-5 w-5" />
                </motion.a>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </motion.footer>
  );
};
