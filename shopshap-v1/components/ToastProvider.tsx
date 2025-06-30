'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextType {
  success: (title: string, message?: string, duration?: number) => void;
  error: (title: string, message?: string, duration?: number) => void;
  warning: (title: string, message?: string, duration?: number) => void;
  info: (title: string, message?: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Styles pour les toasts
const toastStyles = {
  success: 'bg-green-900/90 border-green-700 text-green-100',
  error: 'bg-red-900/90 border-red-700 text-red-100',
  warning: 'bg-yellow-900/90 border-yellow-700 text-yellow-100',
  info: 'bg-blue-900/90 border-blue-700 text-blue-100',
};

const toastIcons = {
  success: '✅',
  error: '❌',
  warning: '⚠️',
  info: 'ℹ️',
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const addToast = useCallback((type: ToastType, title: string, message?: string, duration = 5000) => {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newToast: Toast = { id, type, title, message, duration };
    
    // ✅ Éviter les doublons en vérifiant le titre et message
    setToasts(prev => {
      const existing = prev.find(t => t.title === title && t.message === message && t.type === type);
      if (existing) {
        return prev; // Ne pas ajouter de doublon
      }
      return [...prev, newToast];
    });
    
    // Auto-suppression
    setTimeout(() => {
      removeToast(id);
    }, duration);
  }, [removeToast]);

  const contextValue = {
    success: useCallback((title: string, message?: string, duration?: number) => 
      addToast('success', title, message, duration), [addToast]),
    error: useCallback((title: string, message?: string, duration?: number) => 
      addToast('error', title, message, duration), [addToast]),
    warning: useCallback((title: string, message?: string, duration?: number) => 
      addToast('warning', title, message, duration), [addToast]),
    info: useCallback((title: string, message?: string, duration?: number) => 
      addToast('info', title, message, duration), [addToast]),
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      
      {/* ✅ Affichage des toasts avec limite de 5 maximum */}
      <div className="fixed top-4 right-4 z-[9999] space-y-2 max-w-sm">
        {toasts.slice(0, 5).map((toast) => (
          <div
            key={toast.id}
            className={`
              ${toastStyles[toast.type]}
              border rounded-lg p-4 shadow-lg backdrop-blur-sm
              transform transition-all duration-300 ease-in-out
              animate-in slide-in-from-right-4
              hover:scale-105 cursor-pointer
              relative overflow-hidden
            `}
            onClick={() => removeToast(toast.id)}
          >
            {/* Barre de progression */}
            <div 
              className="absolute bottom-0 left-0 h-1 bg-current opacity-30 animate-pulse"
              style={{
                animation: `shrink ${toast.duration || 5000}ms linear forwards`
              }}
            />
            
            <div className="flex items-start gap-3">
              <span className="text-xl flex-shrink-0">
                {toastIcons[toast.type]}
              </span>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm leading-tight">
                  {toast.title}
                </div>
                {toast.message && (
                  <div className="text-xs mt-1 opacity-90 leading-relaxed">
                    {toast.message}
                  </div>
                )}
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeToast(toast.id);
                }}
                className="text-current opacity-70 hover:opacity-100 transition-opacity ml-2 flex-shrink-0"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Styles pour l'animation de la barre de progression */}
      <style jsx>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </ToastContext.Provider>
  );
}

export function useToastContext() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToastContext must be used within a ToastProvider');
  }
  return context;
}