"use client";

import { motion, AnimatePresence } from "framer-motion";

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
}

export function LoadingOverlay({ visible, message }: LoadingOverlayProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="loading-overlay"
        >
          <div className="flex flex-col items-center gap-4">
            <div className="spinner" />
            {message && (
              <p style={{ color: '#64748B', fontSize: '0.875rem', fontWeight: 500 }}>
                {message}
              </p>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
