"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

export function PageTransitionLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, [pathname, searchParams]);

  return (
    <AnimatePresence>
      {loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.3)",
            backdropFilter: "blur(2px)",
            zIndex: 99999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          <div style={{
            width: "48px",
            height: "48px",
            border: "4px solid rgba(255, 255, 255, 0.3)",
            borderTopColor: "#FFFFFF",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite"
          }} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
