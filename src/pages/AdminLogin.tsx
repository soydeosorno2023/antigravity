import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, User, LogIn, Loader2, ChevronLeft, Eye, EyeOff, AlertCircle, Facebook } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { SEO } from '../components/SEO';
import { ElegantImage } from '../components/ElegantImage';
import { optimizeImageUrl } from '../utils/image';

export function AdminLogin() {
  const { user, loading, isAdmin, isOwner, loginWithGoogle, loginWithFacebook, isLoggingIn } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      if (isAdmin || isOwner) {
        navigate('/admin/dashboard');
      } else {
        navigate('/perfil');
      }
    }
  }, [user, loading, isAdmin, isOwner, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const { token, role } = await api.login(username, password);
      
      const storage = rememberMe ? localStorage : sessionStorage;
      storage.setItem('auth_token', token);
      storage.setItem('user_role', role);
      
      if (role === 'admin' || role === 'owner') {
        navigate('/admin/dashboard');
      } else {
        navigate('/perfil');
      }
    } catch (err: any) {
      console.error("Login component error:", err);
      if (err.code === 'auth/user-not-found') {
        setError('El usuario o correo electrónico no existe. Verifica tus datos.');
      } else if (err.code === 'auth/invalid-email') {
        setError('El formato del correo electrónico no es válido.');
      } else if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('Contraseña incorrecta. Si eres dueño de un local, contacta al administrador para restablecerla.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Demasiados intentos fallidos. Por favor, intenta más tarde.');
      } else if (err.code === 'auth/user-disabled') {
        setError('Esta cuenta ha sido deshabilitada. Contacta al administrador.');
      } else {
        setError('Error al iniciar sesión. Verifica tus credenciales.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
      <Loader2 className="w-10 h-10 text-sky-500 animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-6 transition-colors duration-300">
      <SEO title="Acceso Admin" noindex />
      <div className="w-full max-w-md bg-white dark:bg-gray-900 p-10 rounded-[3rem] shadow-2xl border border-gray-100 dark:border-gray-800 relative">
        <button 
          onClick={() => navigate(-1)}
          className="absolute top-6 left-6 p-3 bg-gray-50 dark:bg-gray-800 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-center text-gray-900 dark:text-white"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-sky-50 dark:bg-sky-900/20 rounded-3xl flex items-center justify-center text-sky-600 dark:text-sky-400 mx-auto mb-6">
            <Lock className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Acceso Dueño de Local</h1>
          <p className="text-gray-500 dark:text-gray-400">Ingresa tus credenciales para continuar</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Usuario</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                required
                className="w-full bg-gray-50 dark:bg-gray-800 border-none py-4 pl-12 pr-4 rounded-2xl focus:ring-2 focus:ring-sky-500 transition-all text-gray-900 dark:text-white"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Contraseña</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type={showPassword ? "text" : "password"}
                required
                className="w-full bg-gray-50 dark:bg-gray-800 border-none py-4 pl-12 pr-12 rounded-2xl focus:ring-2 focus:ring-sky-500 transition-all text-gray-900 dark:text-white"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer group">
              <div className="relative">
                <input
                  type="checkbox"
                  className="peer sr-only"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <div className="w-5 h-5 border-2 border-gray-200 dark:border-gray-700 rounded-lg peer-checked:bg-sky-600 peer-checked:border-sky-600 transition-all"></div>
                <div className="absolute inset-0 flex items-center justify-center text-white opacity-0 peer-checked:opacity-100 transition-all">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <span className="text-sm font-bold text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">Recordarme</span>
            </label>
            <Link to="/recuperar" className="text-sm font-bold text-sky-600 hover:text-sky-700">¿Olvidaste tu contraseña?</Link>
          </div>

          {error && <p className="text-red-500 text-sm font-medium text-center">{error}</p>}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-sky-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-sky-700 transition-all shadow-xl shadow-sky-200 dark:shadow-none flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogIn className="w-5 h-5" />}
            Iniciar Sesión
          </button>

          <div className="relative my-8">
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
                await loginWithGoogle(rememberMe);
              } catch (err: any) {
                if (err.code === 'auth/cancelled-popup-request') {
                  // Silent ignore as it's handled by guard
                  return;
                }
                console.error("Google login error:", err);
                let message = 'Error al iniciar sesión con Google';
                if (err.code === 'auth/unauthorized-domain') {
                  message = 'Error: Dominio no autorizado. Debes añadir "miraosorno.cl" en la consola de Firebase (Authentication > Settings > Authorized domains).';
                } else if (err.code === 'auth/popup-closed-by-user') {
                  message = 'La ventana de inicio de sesión se cerró antes de completar.';
                } else if (err.message) {
                  message = `Error: ${err.message}`;
                }
                setError(message);
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
                await loginWithFacebook(rememberMe);
              } catch (err: any) {
                if (err.code === 'auth/cancelled-popup-request' || err.code === 'auth/popup-closed-by-user') {
                  return;
                }
                console.error("Facebook login error:", err);
                let message = 'Error al iniciar sesión con Facebook';
                if (err.code === 'auth/unauthorized-domain') {
                  message = 'Error: Dominio no autorizado. Debes añadir "miraosorno.cl" en la consola de Firebase (Authentication > Settings > Authorized domains).';
                } else if (err.message) {
                  message = `Error: ${err.message}`;
                }
                setError(message);
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

          <p className="text-center text-gray-500 dark:text-gray-400 text-sm">
            ¿No tienes cuenta? <Link to="/registro" className="text-sky-600 font-bold">Regístrate aquí</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
