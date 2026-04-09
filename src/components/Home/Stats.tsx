import { motion } from "framer-motion";

const stats = [
  { value: "4.2M+", label: "Verified Citizens" },
  { value: "98.4%", label: "Resolution Rate" },
  { value: "1.5s", label: "Latency Phase" },
  { value: "0.0", label: "Corruption Tolerance" }
];

export const Stats = () => {
  return (
    <section className="py-32 bg-black text-white">
      <div className="container max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-16">
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: i * 0.1 }}
              viewport={{ once: true }}
              className="text-center lg:text-left"
            >
              <div className="text-5xl lg:text-7xl font-black tracking-tighter uppercase whitespace-nowrap">
                {stat.value}
              </div>
              <div className="text-[10px] uppercase tracking-[0.4em] font-black text-white/40 mt-4">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};