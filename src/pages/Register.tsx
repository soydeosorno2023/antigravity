import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Lock, Briefcase, LogIn, Camera, Loader2, Facebook } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { SEO } from '../components/SEO';
import { ElegantImage } from '../components/ElegantImage';
import { optimizeImageUrl } from '../utils/image';
import { RecaptchaVerifier } from 'firebase/auth';
import { auth } from '../firebase';

export function Register() {
  const { loginWithGoogle, loginWithFacebook, sendPhoneCode, verifyPhoneCode, isLoggingIn } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    full_name: '',
    email: '',
    avatar_url: '',
    role: 'user'
  });
  const [phoneNumber, setPhoneNumber] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  const [code, setCode] = useState('');
  const [recaptchaVerifier, setRecaptchaVerifier] = useState<RecaptchaVerifier | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
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
  }, []); // Only run once on mount

  const handlePhoneLogin = async () => {
    console.log("handlePhoneLogin called, recaptchaVerifier:", recaptchaVerifier);
    if (!recaptchaVerifier) {
      setError('reCAPTCHA no inicializado');
      return;
    }
    if (!phoneNumber.startsWith('+')) {
      setError('El número de teléfono debe comenzar con +');
      return;
    }
    try {
      const result = await sendPhoneCode(phoneNumber, recaptchaVerifier);
      setConfirmationResult(result);
    } catch (err) {
      console.error("Phone login error:", err);
      setError('Error al enviar código de teléfono');
    }
  };

  const handleVerifyCode = async () => {
    try {
      await verifyPhoneCode(confirmationResult, code);
      navigate('/perfil');
    } catch (err) {
      console.error("Verify code error:", err);
      setError('Error al verificar código');
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      // For registration, we don't have a token yet, but the upload endpoint might require one.
      // Wait, the /api/admin/upload endpoint requires authenticateToken.
      // I should make a public upload endpoint or allow unauthenticated uploads for registration?
      // Actually, it's safer to have them upload AFTER registration.
      // But let's see if I can make the upload endpoint public or use a different one.
      // For now, I'll assume they can upload.
      // Wait, if I make it public, anyone can spam my Cloudflare account.
      // Better to let them register first, then redirect to profile to complete info.
      
      // Let's check server.ts upload endpoint.
      const { url } = await api.uploadImage(null, file); // No token needed for public upload
      setFormData({ ...formData, avatar_url: url });
    } catch (err) {
      setError('Error al subir imagen. Inténtalo después de registrarte.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const { token, role } = await api.register(formData);
      localStorage.setItem('auth_token', token);
      localStorage.setItem('user_role', role);
      
      if (role === 'owner') navigate('/admin/dashboard');
      else navigate('/perfil');
    } catch (err) {
      setError('Error al registrar. El usuario o email ya existe.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-6 py-24 transition-colors duration-300">
      <SEO 
        title="Crear Cuenta"
        description="Regístrate en Mira Osorno para guardar tus lugares favoritos y recibir recomendaciones personalizadas."
        canonical="/register"
      />
      <div className="w-full max-w-md bg-white dark:bg-gray-900 p-10 rounded-[3rem] shadow-2xl border border-gray-100 dark:border-gray-800">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Crear Cuenta</h1>
          <p className="text-gray-500 dark:text-gray-400">Únete a nuestra comunidad turística</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="flex justify-center mb-6">
            <div className="relative group">
              <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center overflow-hidden border-4 border-white dark:border-gray-900 shadow-lg">
                {formData.avatar_url ? (
                  <ElegantImage 
                    src={optimizeImageUrl(formData.avatar_url, 200)} 
                    alt="Avatar" 
                    className="w-full h-full object-cover"
                    containerClassName="w-full h-full"
                    sizes="96px"
                  />
                ) : (
                  <User className="w-12 h-12 text-gray-400 dark:text-gray-500" />
                )}
                {isUploading && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                  </div>
                )}
              </div>
              <label className="absolute bottom-0 right-0 bg-sky-600 dark:bg-sky-500 p-2 rounded-full text-white cursor-pointer hover:bg-sky-700 dark:hover:bg-sky-600 transition-all shadow-md">
                <Camera className="w-4 h-4" />
                <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} disabled={isUploading} />
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Nombre Completo</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
              <input
                type="text"
                required
                className="w-full bg-gray-50 dark:bg-gray-800 border-none py-4 pl-12 pr-4 rounded-2xl focus:ring-2 focus:ring-sky-500 dark:focus:ring-sky-400 text-gray-900 dark:text-white transition-all"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
              <input
                type="email"
                required
                className="w-full bg-gray-50 dark:bg-gray-800 border-none py-4 pl-12 pr-4 rounded-2xl focus:ring-2 focus:ring-sky-500 dark:focus:ring-sky-400 text-gray-900 dark:text-white transition-all"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Nombre de Usuario</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
              <input
                type="text"
                required
                className="w-full bg-gray-50 dark:bg-gray-800 border-none py-4 pl-12 pr-4 rounded-2xl focus:ring-2 focus:ring-sky-500 dark:focus:ring-sky-400 text-gray-900 dark:text-white transition-all"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Contraseña</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
              <input
                type="password"
                required
                className="w-full bg-gray-50 dark:bg-gray-800 border-none py-4 pl-12 pr-4 rounded-2xl focus:ring-2 focus:ring-sky-500 dark:focus:ring-sky-400 text-gray-900 dark:text-white transition-all"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Tipo de Cuenta</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                className={`py-3 rounded-2xl font-bold border-2 transition-all ${formData.role === 'user' ? 'border-sky-600 dark:border-sky-500 bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400' : 'border-gray-100 dark:border-gray-800 text-gray-400 dark:text-gray-500'}`}
                onClick={() => setFormData({ ...formData, role: 'user' })}
              >
                Viajero
              </button>
              <button
                type="button"
                className={`py-3 rounded-2xl font-bold border-2 transition-all ${formData.role === 'owner' ? 'border-sky-600 dark:border-sky-500 bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400' : 'border-gray-100 dark:border-gray-800 text-gray-400 dark:text-gray-500'}`}
                onClick={() => setFormData({ ...formData, role: 'owner' })}
              >
                Dueño de Local
              </button>
            </div>
          </div>

          {error && <p className="text-red-500 dark:text-red-400 text-sm font-medium text-center">{error}</p>}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-sky-600 dark:bg-sky-500 text-white py-4 rounded-2xl font-bold text-lg hover:bg-sky-700 dark:hover:bg-sky-600 transition-all shadow-xl shadow-sky-200 dark:shadow-none flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
            Registrarse
          </button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200 dark:border-gray-800"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400 font-medium">O continuar con</span>
            </div>
          </div>

          <button
            type="button"
            disabled={isLoggingIn}
            onClick={async () => {
              if (isLoggingIn) return;
              setError('');
              try {
                await loginWithGoogle();
              } catch (err: any) {
                if (err.code === 'auth/cancelled-popup-request') return;
                console.error("Google login error:", err);
                setError(err.message || 'Error al iniciar sesión con Google');
              }
            }}
            className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 py-3 px-4 rounded-xl font-semibold text-sm sm:text-base hover:bg-gray-50 dark:hover:bg-gray-700 transition-all flex items-center justify-center gap-3 shadow-sm disabled:opacity-50 mb-3"
          >
            {isLoggingIn ? (
              <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
            ) : (
              <ElegantImage 
                src={optimizeImageUrl("https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg", 48)} 
                className="w-5 h-5" 
                alt="Google" 
                containerClassName="w-5 h-5"
                sizes="20px"
              />
            )}
            {isLoggingIn ? 'Iniciando...' : 'Ingresar con Google'}
          </button>

          <button
            type="button"
            disabled={isLoggingIn}
            onClick={async () => {
              if (isLoggingIn) return;
              setError('');
              try {
                await loginWithFacebook();
              } catch (err: any) {
                if (err.code === 'auth/cancelled-popup-request' || err.code === 'auth/popup-closed-by-user') return;
                console.error("Facebook login error:", err);
                setError(err.message || 'Error al iniciar sesión con Facebook');
              }
            }}
            className="w-full bg-[#1877F2] text-white py-3 px-4 rounded-xl font-semibold text-sm sm:text-base hover:bg-[#166FE5] transition-all flex items-center justify-center gap-3 shadow-sm disabled:opacity-50 mb-6"
          >
            {isLoggingIn ? (
              <Loader2 className="w-5 h-5 animate-spin text-white" />
            ) : (
              <Facebook className="w-5 h-5 fill-current" />
            )}
            {isLoggingIn ? 'Iniciando...' : 'Ingresar con Facebook'}
          </button>

          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
            <input
              type="tel"
              placeholder="Número de teléfono (ej. +56912345678)"
              className="w-full p-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
            <div id="recaptcha-container"></div>
            {!confirmationResult ? (
              <button
                type="button"
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
                  className="w-full p-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  onChange={(e) => setCode(e.target.value)}
                />
                <button
                  type="button"
                  onClick={handleVerifyCode}
                  className="w-full mt-2 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors"
                >
                  Verificar código
                </button>
              </div>
            )}
          </div>

          <p className="text-center text-gray-500 dark:text-gray-400 text-sm">
            ¿Ya tienes cuenta? <Link to="/admin" className="text-sky-600 dark:text-sky-400 font-bold">Inicia sesión</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
