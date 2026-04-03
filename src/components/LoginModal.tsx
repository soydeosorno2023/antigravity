import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, LogIn, Heart, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ElegantImage } from './ElegantImage';
import { RecaptchaVerifier } from 'firebase/auth';
import { auth } from '../firebase';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const { loginWithGoogle, sendPhoneCode, verifyPhoneCode, isLoggingIn } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  const [code, setCode] = useState('');
  const [recaptchaVerifier, setRecaptchaVerifier] = useState<RecaptchaVerifier | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const container = document.getElementById('recaptcha-container');
    if (!container) return;

    const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
      size: 'normal',
      'isolated': true,
    });
    setRecaptchaVerifier(verifier);
    return () => {
      verifier.clear();
      setRecaptchaVerifier(null);
    };
  }, [isOpen]);

  const handleGoogleLogin = async () => {
    if (isLoggingIn) return;
    try {
      await loginWithGoogle();
      onClose();
    } catch (err) {
      console.error("Login error:", err);
    }
  };

  const handlePhoneLogin = async () => {
    if (!recaptchaVerifier) return;
    if (!phoneNumber.startsWith('+')) {
      console.error("Phone number must start with +");
      return;
    }
    try {
      const result = await sendPhoneCode(phoneNumber, recaptchaVerifier);
      setConfirmationResult(result);
    } catch (err) {
      console.error("Phone login error:", err);
    }
  };

  const handleVerifyCode = async () => {
    try {
      await verifyPhoneCode(confirmationResult, code);
      onClose();
    } catch (err) {
      console.error("Verify code error:", err);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[300]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-md bg-white dark:bg-gray-900 rounded-[2.5rem] p-8 shadow-2xl z-[310] border border-gray-100 dark:border-gray-800"
          >
            <button
              onClick={onClose}
              className="absolute top-6 right-6 p-2 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center">
              <div className="w-20 h-20 bg-red-50 dark:bg-red-900/20 rounded-3xl flex items-center justify-center text-red-500 mx-auto mb-6">
                <Heart className="w-10 h-10 fill-current" />
              </div>
              
              <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">
                ¡Guarda tus favoritos!
              </h2>
              <p className="text-gray-500 dark:text-gray-400 mb-8">
                Inicia sesión para guardar tus lugares preferidos y acceder a ellos desde cualquier dispositivo.
              </p>

              <button
                onClick={handleGoogleLogin}
                disabled={isLoggingIn}
                className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 py-3 px-4 rounded-xl font-semibold text-sm sm:text-base hover:bg-gray-50 dark:hover:bg-gray-700 transition-all flex items-center justify-center gap-3 shadow-sm disabled:opacity-50 mb-4"
              >
                {isLoggingIn ? (
                  <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
                ) : (
                  <ElegantImage 
                    src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
                    className="w-5 h-5" 
                    alt="Google"
                    sizes="20px"
                  />
                )}
                <span className="truncate">{isLoggingIn ? 'Iniciando...' : 'Ingresar con Google'}</span>
              </button>
              
              <div className="mt-4">
                <input
                  type="tel"
                  placeholder="Número de teléfono (ej. +56912345678)"
                  className="w-full p-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
                <div id="recaptcha-container"></div>
                {!confirmationResult ? (
                  <button
                    onClick={handlePhoneLogin}
                    className="w-full mt-2 py-3 bg-sky-600 text-white rounded-xl font-semibold hover:bg-sky-700 transition-colors"
                  >
                    Enviar código
                  </button>
                ) : (
                  <div className="mt-2">
                    <input
                      type="text"
                      placeholder="Código de verificación"
                      className="w-full p-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      onChange={(e) => setCode(e.target.value)}
                    />
                    <button
                      onClick={handleVerifyCode}
                      className="w-full mt-2 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors"
                    >
                      Verificar código
                    </button>
                  </div>
                )}
              </div>

              <button
                onClick={onClose}
                className="text-gray-400 dark:text-gray-500 font-bold text-sm hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                Quizás más tarde
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
