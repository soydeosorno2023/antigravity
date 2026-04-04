import React from 'react';
import { Check, Zap, Shield, Star, ChevronLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { SEO } from '../components/SEO';
import './Pricing.css';

const plans = [
  {
    name: 'Básico',
    price: 'Gratis',
    description: 'Para exploradores ocasionales',
    features: [
      'Acceso a todos los lugares públicos',
      'Guardar hasta 5 favoritos',
      'Reseñas básicas',
      'Soporte por comunidad'
    ],
    buttonText: 'Empezar Gratis',
    highlight: false
  },
  {
    name: 'Pro',
    price: '$4.990',
    period: '/mes',
    description: 'La mejor experiencia para viajeros',
    features: [
      'Todo lo del plan Básico',
      'Favoritos ilimitados',
      'Contenido exclusivo y guías premium',
      'Sin anuncios',
      'Descuentos en locales asociados',
      'Soporte prioritario'
    ],
    buttonText: 'Suscribirse Pro',
    highlight: true
  },
  {
    name: 'Negocio',
    price: '$19.990',
    period: '/mes',
    description: 'Para dueños de locales en Osorno',
    features: [
      'Aparecer en destacados',
      'Panel de analíticas avanzado',
      'Gestión de banners publicitarios',
      'Verificación de local (Check azul)',
      'Soporte 24/7 dedicado'
    ],
    buttonText: 'Contactar Ventas',
    highlight: false
  }
];

export function Pricing() {
  const navigate = useNavigate();

  return (
    <div className="pricing-wrapper">
      <SEO 
        title="Planes y Precios"
        description="Conoce nuestros planes para exploradores y comercios en Osorno. Únete a la comunidad de Mira Osorno."
        canonical="/pricing"
      />
      <div className="pricing-container">
        <button 
          onClick={() => navigate(-1)}
          className="pricing-back-btn"
        >
          <ChevronLeft size={24} />
        </button>

        <div className="pricing-header">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="pricing-title"
          >
            Planes de <span>miraosorno</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="pricing-subtitle"
          >
            Elige el plan que mejor se adapte a tus necesidades y comienza a descubrir Osorno como nunca antes.
          </motion.p>
        </div>

        <div className="pricing-grid">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 + 0.2 }}
              className={`pricing-card ${plan.highlight ? 'featured' : ''}`}
            >
              {plan.highlight && (
                <div className="featured-badge">
                  <Star size={16} fill="white" />
                  Más Popular
                </div>
              )}

              <div className="plan-info">
                <h3 className="plan-name">{plan.name}</h3>
                <p className="plan-desc">{plan.description}</p>
              </div>

              <div className="plan-price-box">
                <span className="plan-price">{plan.price}</span>
                {plan.period && <span className="plan-period">{plan.period}</span>}
              </div>

              <ul className="plan-features">
                {plan.features.map((feature) => (
                  <li key={feature} className="feature-item">
                    <Check className="feature-icon" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <button 
                className={`pricing-btn ${
                  plan.highlight ? 'pricing-btn-primary' : 'pricing-btn-secondary'
                }`}
              >
                {plan.buttonText}
              </button>
            </motion.div>
          ))}
        </div>

        <div className="pricing-trust-badges">
          <div className="trust-card">
            <div className="trust-icon">
              <Zap size={32} />
            </div>
            <h4>Activación Instantánea</h4>
            <p>Obtén acceso a todas las funciones Pro inmediatamente después del pago.</p>
          </div>
          <div className="trust-card">
            <div className="trust-icon" style={{ color: '#10b981', background: 'rgba(16, 185, 129, 0.1)' }}>
              <Shield size={32} />
            </div>
            <h4>Pago Seguro</h4>
            <p>Utilizamos tecnología de encriptación de grado bancario para procesar tus pagos.</p>
          </div>
          <div className="trust-card">
            <div className="trust-icon" style={{ color: '#f59e0b', background: 'rgba(245, 158, 11, 0.1)' }}>
              <Star size={32} />
            </div>
            <h4>Garantía</h4>
            <p>Si no estás satisfecho, te devolvemos tu dinero en los primeros 7 días.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
