import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, User, LogIn, Loader2, ChevronLeft, Eye, EyeOff, Facebook, Check } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { SEO } from '../components/SEO';
import { ElegantImage } from '../components/ElegantImage';
import { optimizeImageUrl } from '../utils/image';
import './AdminLogin.css';

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
    <div className="admin-login-wrapper">
      <Loader2 className="loader-icon animate-spin" style={{ width: '40px', height: '40px', color: 'var(--primary)' }} />
    </div>
  );

  return (
    <div className="admin-login-wrapper">
      <SEO title="Acceso Admin" noindex />
      
      <div className="login-card">
        <button onClick={() => navigate(-1)} className="login-back-btn">
          <ChevronLeft size={24} />
        </button>

        <div className="login-header">
          <div className="login-icon-box">
            <Lock size={32} />
          </div>
          <h1 className="login-title">Bienvenido</h1>
          <p className="login-subtitle">Ingresa tus credenciales para continuar</p>
        </div>

        <form onSubmit={handleLogin} className="login-form">
          <div className="form-group">
            <label className="form-label">Usuario</label>
            <div className="input-wrapper">
              <User className="input-icon" size={20} />
              <input
                type="text"
                required
                className="login-input"
                placeholder="Email o usuario"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Contraseña</label>
            <div className="input-wrapper">
              <Lock className="input-icon" size={20} />
              <input
                type={showPassword ? "text" : "password"}
                required
                className="login-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="password-toggle"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div className="form-options">
            <label className="remember-me">
              <input
                type="checkbox"
                hidden
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <div className="checkbox-custom">
                <Check className="check-icon" size={14} />
              </div>
              <span className="remember-text">Recordarme</span>
            </label>
            <Link to="/recuperar" className="forgot-link">¿Olvidaste tu contraseña?</Link>
          </div>

          {error && <div className="error-message">{error}</div>}

          <button
            type="submit"
            disabled={isLoading}
            className="login-submit-btn"
          >
            {isLoading ? <Loader2 size={24} className="animate-spin" /> : <LogIn size={24} />}
            {isLoading ? 'Cargando...' : 'Iniciar Sesión'}
          </button>

          <div className="divider">
            <span className="divider-text">O usa tu celular</span>
          </div>

          <div className="social-buttons">
            <button
              type="button"
              disabled={isLoggingIn}
              onClick={async () => {
                if (isLoggingIn) return;
                setError('');
                try {
                  await loginWithGoogle(rememberMe);
                } catch (err: any) {
                  if (err.code === 'auth/cancelled-popup-request') return;
                  console.error("Google login error:", err);
                  let message = 'Error al iniciar sesión con Google';
                  if (err.code === 'auth/unauthorized-domain') {
                    message = 'Error: Dominio no autorizado. Debes añadir "miraosorno.cl" en la consola de Firebase.';
                  } else if (err.code === 'auth/popup-closed-by-user') {
                    message = 'La ventana de inicio de sesión se cerró antes de completar.';
                  } else if (err.message) {
                    message = `Error: ${err.message}`;
                  }
                  setError(message);
                }
              }}
              className="social-btn google"
            >
              {isLoggingIn ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <ElegantImage 
                  src={optimizeImageUrl("https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg", 48)} 
                  className="w-5 h-5" 
                  alt="Google" 
                  containerClassName="w-5 h-5"
                  sizes="20px"
                />
              )}
              {isLoggingIn ? 'Iniciando...' : 'Continuar con Google'}
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
                  if (err.code === 'auth/cancelled-popup-request' || err.code === 'auth/popup-closed-by-user') return;
                  console.error("Facebook login error:", err);
                  let message = 'Error al iniciar sesión con Facebook';
                  if (err.code === 'auth/unauthorized-domain') {
                    message = 'Error: Dominio no autorizado. Debes añadir "miraosorno.cl" en la consola de Firebase.';
                  } else if (err.message) {
                    message = `Error: ${err.message}`;
                  }
                  setError(message);
                }
              }}
              className="social-btn facebook"
            >
              {isLoggingIn ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <Facebook size={20} fill="currentColor" />
              )}
              {isLoggingIn ? 'Iniciando...' : 'Continuar con Facebook'}
            </button>
          </div>

          <div className="login-footer">
            <p>
              ¿No tienes cuenta? <Link to="/registro" className="register-link">Regístrate aquí</Link>
            </p>
            <p style={{ marginTop: '1rem' }}>
              <Link to="/admin" className="forgot-link" style={{ fontSize: '0.8rem', opacity: 0.7 }}>Acceso Dueños de Local</Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
