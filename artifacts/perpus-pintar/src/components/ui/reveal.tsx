import { motion, useInView } from "framer-motion";
import { useRef } from "react";

interface RevealProps {
  children: React.ReactNode;
  delay?: number;
  blur?: boolean;
  className?: string;
}

/**
 * Wraps children in a viewport-triggered fade + slide + (optional) blur reveal.
 * Animation fires once when the element enters the viewport.
 */
export function Reveal({ children, delay = 0, blur = true, className }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-30px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 16, filter: blur ? "blur(5px)" : "none" }}
      animate={inView ? { opacity: 1, y: 0, filter: "blur(0px)" } : {}}
      transition={{ duration: 0.48, delay, ease: [0.23, 1, 0.32, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
