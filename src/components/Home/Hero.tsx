import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Shield, Users } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export const Hero = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <section className="relative min-h-[90vh] flex flex-col items-center justify-center text-center px-4 overflow-hidden bg-background">
      {/* Abstract Background Element */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-foreground/5 dark:bg-foreground/10 rounded-full blur-3xl opacity-50" />
      </div>

      <div className="container relative z-10 max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="space-y-8"
        >
          <div className="inline-flex items-center px-3 py-1 bg-muted text-[10px] uppercase tracking-[0.3em] font-black border border-border">
            Smart India Hackathon 2025
          </div>
          
          <h1 className="text-6xl md:text-8xl lg:text-9xl font-black tracking-tighter leading-[0.9] uppercase">
            Civic<br />Digital<br />Sync
          </h1>

          <p className="max-w-2xl mx-auto text-lg md:text-xl text-muted-foreground font-light leading-relaxed tracking-tight">
            A monochromatic revolution in community governance. Streamlined reporting. 
            Instant resolution. Power to the people, precisely.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
            <Button
              size="lg"
              className="w-full sm:w-auto text-xs uppercase tracking-widest font-black h-14 px-10 rounded-none"
              onClick={() => navigate(user ? "/report" : "/login")}
            >
              Start Reporting
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="w-full sm:w-auto text-xs uppercase tracking-widest font-black h-14 px-10 rounded-none shadow-none"
              onClick={() => navigate("/map")}
            >
              Explore Map
            </Button>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-24 border-t border-border pt-12"
        >
          {[
            { label: "Active Nodes", value: "1.2k+" },
            { label: "Resolved Rate", value: "98.4%" },
            { label: "Response Time", value: "< 2h" },
            { label: "Secured Data", value: "100%" }
          ].map((stat, i) => (
            <div key={i} className="text-center">
              <div className="text-2xl font-black tracking-tighter uppercase">{stat.value}</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mt-1">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
