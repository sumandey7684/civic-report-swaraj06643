import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, MapPin, Bell, BarChart3, Users, Shield } from "lucide-react";
import { motion } from "framer-motion";

const features = [
  {
    icon: Camera,
    title: "Precision Reporting",
    description: "Capture civic issues with AI verification and instant geolocation tagging."
  },
  {
    icon: MapPin,
    title: "Live Synchronization",
    description: "Real-time updates across the national portal for immediate awareness."
  },
  {
    icon: Bell,
    title: "Direct Channels",
    description: "Instant notification pipeline between citizens and active resolution units."
  },
  {
    icon: BarChart3,
    title: "Data Intelligence",
    description: "Deep analytics to predict and prevent infrastructure degradation."
  },
  {
    icon: Users,
    title: "Social Synergy",
    description: "Reward-based engagement system for proactive community participation."
  },
  {
    icon: Shield,
    title: "Encrypted Trust",
    description: "Sovereign data protection with military-grade encryption protocols."
  }
];

export const FeatureCards = () => {
  return (
    <section className="py-24 bg-background">
      <div className="container max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 border-t border-l border-border mt-12">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="group p-12 border-b border-r border-border hover:bg-muted/50 transition-colors"
            >
              <div className="space-y-6">
                <div className="w-12 h-12 flex items-center justify-center bg-foreground/5 dark:bg-white/5 border border-border group-hover:scale-110 transition-transform">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="text-sm font-black uppercase tracking-[0.2em]">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed tracking-tight font-light">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};