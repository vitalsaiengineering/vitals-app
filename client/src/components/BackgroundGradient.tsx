import React from "react";
import { motion } from "framer-motion";

const BackgroundGradient = () => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-3xl" />

      <motion.div
        className="absolute -top-1/4 -right-1/4 w-1/2 h-1/2 bg-[#0EA5E9]/20 rounded-full blur-3xl"
        animate={{
          x: [0, 10, 0],
          y: [0, -10, 0],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          repeatType: "reverse",
        }}
      />

      <motion.div
        className="absolute -bottom-1/4 -left-1/4 w-1/2 h-1/2 bg-[#0c4a6e]/20 rounded-full blur-3xl"
        animate={{
          x: [0, -10, 0],
          y: [0, 10, 0],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          repeatType: "reverse",
          delay: 1,
        }}
      />

      <motion.div
        className="absolute top-1/3 left-1/3 w-1/3 h-1/3 bg-[#0EA5E9]/10 rounded-full blur-3xl"
        animate={{
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          repeatType: "reverse",
          delay: 2,
        }}
      />
    </div>
  );
};

export default BackgroundGradient;
