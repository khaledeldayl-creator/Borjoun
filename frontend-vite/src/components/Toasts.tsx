"use client";

import { useAppStore } from "@/store/store";
import { AnimatePresence, motion } from "framer-motion";

export default function Toasts() {
  const { toasts, removeToast } = useAppStore();

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-3 max-w-sm w-full">
      <AnimatePresence>
        {toasts.map((toast) => {
          let bgIcon = "info";
          let colorClass = "border-primary text-primary";

          if (toast.type === "success") {
            bgIcon = "check_circle";
            colorClass = "border-green-500 text-green-600";
          } else if (toast.type === "error") {
            bgIcon = "error";
            colorClass = "border-red-500 text-red-600";
          } else if (toast.type === "earnings") {
            bgIcon = "monetization_on";
            colorClass = "border-secondary-container text-secondary-container";
          }

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={`glass-card p-4 rounded-xl border-l-4 flex items-start gap-3 shadow-lg ${colorClass}`}
            >
              <span className="material-symbols-outlined text-2xl mt-0.5">{bgIcon}</span>
              <div className="flex-1">
                <h4 className="font-display font-bold text-sm text-on-surface">{toast.title}</h4>
                <p className="font-body text-xs text-on-surface-variant mt-0.5">{toast.message}</p>
              </div>
              <button 
                onClick={() => removeToast(toast.id)}
                className="text-on-surface-variant hover:text-on-surface text-lg cursor-pointer"
              >
                ×
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
