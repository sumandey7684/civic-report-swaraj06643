import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export const AnimatedBackground = () => {
  const [scrollY, setScrollY] = useState(0);

  // Track scroll position for parallax effects
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Generate floating shapes data
  const floatingShapes = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    size: Math.random() * 60 + 20, // 20-80px
    x: Math.random() * 100, // 0-100%
    y: Math.random() * 100, // 0-100%
    delay: Math.random() * 5,
    duration: Math.random() * 10 + 15, // 15-25s
    shape: Math.floor(Math.random() * 3), // 0: circle, 1: square, 2: triangle
  }));

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Primary animated gradient background */}
      <motion.div
        className="absolute inset-0"
        animate={{
          background: [
            "radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.1) 0%, transparent 50%)",
            "radial-gradient(circle at 80% 20%, rgba(34, 197, 94, 0.1) 0%, transparent 50%)",
            "radial-gradient(circle at 40% 80%, rgba(168, 85, 247, 0.1) 0%, transparent 50%)",
            "radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.1) 0%, transparent 50%)",
          ],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear",
        }}
      />

      {/* Secondary gradient overlay */}
      <motion.div
        className="absolute inset-0"
        animate={{
          background: [
            "linear-gradient(45deg, rgba(59, 130, 246, 0.05) 0%, transparent 50%)",
            "linear-gradient(135deg, rgba(34, 197, 94, 0.05) 0%, transparent 50%)",
            "linear-gradient(225deg, rgba(168, 85, 247, 0.05) 0%, transparent 50%)",
            "linear-gradient(315deg, rgba(59, 130, 246, 0.05) 0%, transparent 50%)",
          ],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Floating geometric shapes */}
      {floatingShapes.map(({ id, size, x, y, delay, duration, shape }) => (
        <motion.div
          key={id}
          className="absolute opacity-20"
          style={{
            width: size,
            height: size,
            left: `${x}%`,
            top: `${y}%`,
            transform: `translate(-50%, -50%) translateY(${scrollY * 0.1}px)`, // Subtle parallax
          }}
          animate={{
            x: [0, Math.random() * 200 - 100, 0],
            y: [0, Math.random() * 200 - 100, 0],
            rotate: [0, 360],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration,
            repeat: Infinity,
            delay,
            ease: "easeInOut",
          }}
        >
          {shape === 0 && (
            <div
              className="w-full h-full rounded-full bg-gradient-to-br from-primary/30 to-secondary/30 blur-sm"
            />
          )}
          {shape === 1 && (
            <div
              className="w-full h-full bg-gradient-to-br from-secondary/30 to-accent/30 blur-sm"
              style={{ borderRadius: "20%" }}
            />
          )}
          {shape === 2 && (
            <div
              className="w-full h-full bg-gradient-to-br from-accent/30 to-primary/30 blur-sm"
              style={{
                clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)",
              }}
            />
          )}
        </motion.div>
      ))}

      {/* Subtle wave pattern */}
      <motion.div
        className="absolute bottom-0 left-0 w-full h-32 opacity-10"
        animate={{
          backgroundPosition: ["0% 0%", "100% 0%"],
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: "linear",
        }}
        style={{
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Overlay for subtle depth */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/5" />
    </div>
  );
};
