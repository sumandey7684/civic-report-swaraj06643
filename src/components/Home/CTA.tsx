import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const CTA = () => {
  const navigate = useNavigate();

  return (
    <section className="py-24 bg-background border-t border-border">
      <div className="container max-w-5xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="bg-foreground text-background p-12 md:p-24 text-center space-y-12"
        >
          <h2 className="text-4xl md:text-7xl font-black uppercase tracking-tighter leading-none">
            Scale your<br />Civic Impact
          </h2>
          
          <p className="max-w-xl mx-auto text-lg md:text-xl font-light opacity-60 tracking-tight">
            Join the national framework for digitized community management. 
            Secure, anonymous, and exceptionally fast.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Button
              variant="secondary"
              size="lg"
              className="w-full sm:w-auto text-xs uppercase tracking-[0.2em] font-black"
              onClick={() => navigate("/login")}
            >
              Initialize Account
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="w-full sm:w-auto text-xs uppercase tracking-[0.2em] font-black border-background hover:bg-background hover:text-foreground"
              onClick={() => navigate("/about")}
            >
              Documentation
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
