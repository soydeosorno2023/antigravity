import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Lock, Briefcase, LogIn, Camera, Loader2, Facebook, ChevronLeft, Phone } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { SEO } from '../components/SEO';
import { ElegantImage } from '../components/ElegantImage';
import { optimizeImageUrl } from '../utils/image';
import { RecaptchaVerifier } from 'firebase/auth';
import { auth } from '../firebase';
import './Register.css';

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
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState('');
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
  }, []);

  const handlePhoneLogin = async () => {
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

    // Use a preview instead of immediate upload
    setAvatarFile(file);
    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview(previewUrl);
    
    // Clean up previous preview if exists
    if (avatarPreview && avatarPreview.startsWith('blob:')) {
      URL.revokeObjectURL(avatarPreview);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      // 1. Register user
      const { token, role } = await api.register(formData);
      localStorage.setItem('auth_token', token);
      localStorage.setItem('user_role', role);
      
      // 2. Upload avatar if selected, now that we ARE authenticated
      if (avatarFile) {
        setIsUploading(true);
        try {
          const { url } = await api.uploadImage(token, avatarFile);
          // 3. Update user profile with the new avatar URL
          await api.updateProfile(token, {
            ...formData,
            avatar_url: url
          });
        } catch (uploadErr) {
          console.error("Delayed avatar upload failed:", uploadErr);
          // We don't block the whole registration if only the avatar fails
        } finally {
          setIsUploading(false);
        }
      }

      if (role === 'owner') navigate('/admin/dashboard');
      else navigate('/perfil');
    } catch (err) {
      setError('Error al registrar. El usuario o email ya existe.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="register-wrapper">
      <SEO 
        title="Crear Cuenta"
        description="Regístrate en Mira Osorno para guardar tus lugares favoritos y recibir recomendaciones personalizadas."
        canonical="/register"
      />
      <div className="register-card">
        <div className="register-header">
          <h1 className="register-title">Crear Cuenta</h1>
          <p className="register-subtitle">Únete a nuestra comunidad turística</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="avatar-upload-box">
            <div className="avatar-preview-container">
              <div className="avatar-circle">
                {avatarPreview || formData.avatar_url ? (
                  <ElegantImage 
                    src={avatarPreview || optimizeImageUrl(formData.avatar_url, 200)} 
                    alt="Avatar" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User size={48} />
                )}
                {isUploading && (
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Loader2 size={24} className="text-white animate-spin" />
                  </div>
                )}
              </div>
              <label className="avatar-upload-btn">
                <Camera size={18} />
                <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} disabled={isUploading} />
              </label>
            </div>
          </div>

          <div className="form-field">
            <label className="form-label">Nombre Completo</label>
            <div className="input-with-icon">
              <User className="input-icon" size={20} />
              <input
                type="text"
                required
                className="register-input"
                placeholder="Tu nombre"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              />
            </div>
          </div>

          <div className="form-field">
            <label className="form-label">Email</label>
            <div className="input-with-icon">
              <Mail className="input-icon" size={20} />
              <input
                type="email"
                required
                className="register-input"
                placeholder="email@ejemplo.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>

          <div className="form-field">
            <label className="form-label">Nombre de Usuario</label>
            <div className="input-with-icon">
              <User className="input-icon" size={20} />
              <input
                type="text"
                required
                className="register-input"
                placeholder="usuario123"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              />
            </div>
          </div>

          <div className="form-field">
            <label className="form-label">Contraseña</label>
            <div className="input-with-icon">
              <Lock className="input-icon" size={20} />
              <input
                type="password"
                required
                className="register-input"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
          </div>

          <div className="form-field">
            <label className="form-label">Tipo de Cuenta</label>
            <div className="role-selector-grid">
              <button
                type="button"
                className={`role-btn ${formData.role === 'user' ? 'active' : ''}`}
                onClick={() => setFormData({ ...formData, role: 'user' })}
              >
                Viajero
              </button>
              <button
                type="button"
                className={`role-btn ${formData.role === 'owner' ? 'active' : ''}`}
                onClick={() => setFormData({ ...formData, role: 'owner' })}
              >
                Dueño de Local
              </button>
            </div>
          </div>

          {error && <p className="error-message">{error}</p>}

          <button
            type="submit"
            disabled={isLoading}
            className="submit-register-btn"
          >
            {isLoading ? <Loader2 size={24} className="animate-spin" /> : 'Registrarse'}
          </button>

          <p className="register-footer">
            ¿Ya tienes cuenta? <Link to="/admin" className="register-link">Inicia sesión</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
