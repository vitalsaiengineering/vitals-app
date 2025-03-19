import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface VitalsLogoProps {
  className?: string;
  textClassName?: string;
  showText?: boolean;
  showSubtitle?: boolean;
  variant?: "default" | "large" | "small" | "header" | "extra-large";
}

const VitalsLogo: React.FC<VitalsLogoProps> = ({
  className,
  textClassName,
  showText = true,
  showSubtitle = false,
  variant = "default",
}) => {
  const logoSizes = {
    small: "h-10",
    default: "h-14",
    large: "h-20 md:h-24",
    header: "h-20 md:h-24",
    "extra-large": "h-28 md:h-32", // Increased the size for extra-large
  };

  return (
    <motion.div
      className={cn("flex flex-col items-center", className)}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center">
        <img
          src="/lovable-uploads/7b71aa46-b1c6-4928-a142-af7aad7b1906.png"
          alt="Vitals AI Logo"
          className={cn(logoSizes[variant])}
        />

        {showText && (
          <motion.span
            className={cn(
              "font-medium text-foreground ml-2 text-xl",
              variant === "large" && "text-2xl md:text-3xl",
              variant === "small" && "text-lg",
              textClassName,
            )}
            initial={{ opacity: 0, x: -5 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            Vitals AI
          </motion.span>
        )}
      </div>

      {showSubtitle && (
        <motion.span
          className={cn(
            "text-xs uppercase tracking-wider mt-1 text-muted-foreground",
            variant === "large" && "text-sm",
          )}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          ADVISOR INTELLIGENCE
        </motion.span>
      )}
    </motion.div>
  );
};

export default VitalsLogo;
