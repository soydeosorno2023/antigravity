import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Bell, Info, AlertTriangle, CheckCircle, AlertCircle, Maximize2, ExternalLink, Loader2 } from 'lucide-react';
import { AppNotification } from '../types';
import { useAuth } from '../context/AuthContext';
import { ElegantImage } from './ElegantImage';
import { optimizeImageUrl } from '../utils/image';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AppNotification[];
}

export const NotificationModal: React.FC<NotificationModalProps> = ({ isOpen, onClose, notifications }) => {
  const { user, loginWithGoogle, isLoggingIn } = useAuth();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'error': return <AlertCircle className="w-5 h-5 text-red-500" />;
      default: return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full shadow-2xl relative max-h-[80vh] flex flex-col"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Bell className="w-6 h-6 text-[#F5B027]" />
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">Notificaciones</h3>
                </div>
                <button 
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                {!user ? (
                  <div className="text-center space-y-6 py-4">
                    <div className="bg-[#F5B027]/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto">
                      <Bell className="w-10 h-10 text-[#F5B027]" />
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                        ¡Atención!
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 text-lg">
                        Regístrate y no te pierdas esta tremenda oferta
                      </p>
                    </div>

                    <button
                      onClick={async () => {
                        if (isLoggingIn) return;
                        try {
                          await loginWithGoogle();
                          onClose();
                        } catch (err) {
                          console.error("Login error from notification modal:", err);
                        }
                      }}
                      disabled={isLoggingIn}
                      className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 py-3 px-4 rounded-xl font-semibold text-sm sm:text-base hover:bg-gray-50 dark:hover:bg-gray-700 transition-all flex items-center justify-center gap-3 shadow-sm disabled:opacity-50"
                    >
                      {isLoggingIn ? (
                        <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
                      ) : (
                        <ElegantImage 
                          src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
                          alt="Google" 
                          className="w-5 h-5" 
                          sizes="20px"
                        />
                      )}
                      {isLoggingIn ? 'Iniciando sesión...' : 'Continuar con Google'}
                    </button>
                  </div>
                ) : notifications.length > 0 ? (
                  notifications.map((notification) => (
                    <div 
                      key={notification.id}
                      className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600"
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-1">{getIcon(notification.type)}</div>
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-900 dark:text-white mb-1">{notification.title}</h4>
                          {notification.image_url && (
                            <div 
                              className="group relative mb-3 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600 cursor-zoom-in"
                              onClick={() => setSelectedImage(notification.image_url || null)}
                            >
                              <ElegantImage 
                                src={optimizeImageUrl(notification.image_url, 600)} 
                                alt={notification.title} 
                                className="w-full h-auto max-h-48 object-cover transition-transform duration-300 group-hover:scale-105"
                                containerClassName="w-full h-auto"
                                sizes="(max-width: 448px) 100vw, 400px"
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                <Maximize2 className="w-6 h-6 text-white drop-shadow-lg" />
                              </div>
                            </div>
                          )}
                          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-3">
                            {notification.message}
                          </p>
                          {notification.link_url && (
                            <a 
                              href={notification.link_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 px-4 py-2 bg-[#F5B027] hover:bg-[#e09f22] text-white text-sm font-bold rounded-lg transition-colors shadow-sm"
                            >
                              <ExternalLink className="w-4 h-4" />
                              Ver Oferta
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <Bell className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4 opacity-50" />
                    <p className="text-gray-500 dark:text-gray-400">No tienes notificaciones por ahora</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Lightbox */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 p-4 md:p-8"
            onClick={() => setSelectedImage(null)}
          >
            <motion.button
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="absolute top-4 right-4 md:top-8 md:right-8 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-10"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedImage(null);
              }}
            >
              <X className="w-6 h-6" />
            </motion.button>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-full max-h-full"
              onClick={(e) => e.stopPropagation()}
            >
              <ElegantImage
                src={selectedImage}
                alt="Lightbox"
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                sizes="100vw"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
