import React from 'react';
import { useAppStore } from '@/store/store';
import { X, CheckCircle, AlertCircle, Info, DollarSign } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

export default function Toasts() {
  const { toasts, removeToast } = useAppStore();

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-emerald-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-rose-500" />;
      case 'earnings':
        return <DollarSign className="w-5 h-5 text-amber-500" />;
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getBgColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-emerald-50/95 border-emerald-100 dark:bg-emerald-950/90 dark:border-emerald-900';
      case 'error':
        return 'bg-rose-50/95 border-rose-100 dark:bg-rose-950/90 dark:border-rose-900';
      case 'earnings':
        return 'bg-amber-50/95 border-amber-100 dark:bg-amber-950/90 dark:border-amber-900';
      default:
        return 'bg-blue-50/95 border-blue-100 dark:bg-blue-950/90 dark:border-blue-900';
    }
  };

  return (
    <div className="fixed top-5 right-5 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-lg backdrop-blur-md ${getBgColor(
              toast.type
            )}`}
          >
            <div className="flex-shrink-0 mt-0.5">{getIcon(toast.type)}</div>
            <div className="flex-grow">
              <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                {toast.title}
              </h4>
              <p className="text-xs mt-1 text-slate-600 dark:text-slate-300 leading-relaxed">
                {toast.message}
              </p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="flex-shrink-0 p-0.5 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 rounded-lg transition-colors text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
