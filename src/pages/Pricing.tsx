import React from 'react';
import { Check, Zap, Shield, Star, ChevronLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { SEO } from '../components/SEO';

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
    <div className="min-h-screen bg-white dark:bg-gray-950 py-24 px-6 transition-colors duration-300">
      <SEO 
        title="Planes y Precios"
        description="Conoce nuestros planes para exploradores y comercios en Osorno. Únete a la comunidad de Mira Osorno."
        canonical="/pricing"
      />
      <div className="max-w-7xl mx-auto">
        <div className="mb-12">
          <button 
            onClick={() => navigate(-1)}
            className="p-3 bg-gray-100 dark:bg-gray-800 rounded-2xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center justify-center text-gray-900 dark:text-white"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        </div>

        <div className="text-center mb-20">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-7xl font-black text-gray-900 dark:text-white mb-6 tracking-tight"
          >
            Planes de <span className="text-sky-500 text-glow-sky">miraosorno</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto"
          >
            Elige el plan que mejor se adapte a tus necesidades y comienza a descubrir Osorno como nunca antes.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 + 0.2 }}
              className={`relative p-10 rounded-[3rem] border ${
                plan.highlight 
                  ? 'border-sky-500 shadow-2xl shadow-sky-100 dark:shadow-none bg-white dark:bg-gray-900 scale-105 z-10' 
                  : 'border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50'
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-sky-500 text-white px-6 py-2 rounded-full text-sm font-bold flex items-center gap-2">
                  <Star className="w-4 h-4 fill-white" />
                  Más Popular
                </div>
              )}

              <div className="mb-8">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{plan.name}</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm">{plan.description}</p>
              </div>

              <div className="mb-8">
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-black text-gray-900 dark:text-white">{plan.price}</span>
                  {plan.period && <span className="text-gray-500 dark:text-gray-400 font-bold">{plan.period}</span>}
                </div>
              </div>

              <ul className="space-y-4 mb-10">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-gray-600 dark:text-gray-300">
                    <div className={`mt-1 p-0.5 rounded-full ${plan.highlight ? 'bg-sky-100 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400' : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}>
                      <Check className="w-3 h-3" />
                    </div>
                    <span className="text-sm font-medium">{feature}</span>
                  </li>
                ))}
              </ul>

              <button 
                className={`w-full py-5 rounded-2xl font-bold transition-all ${
                  plan.highlight
                    ? 'bg-sky-500 text-white hover:bg-sky-600 shadow-lg shadow-sky-200 dark:shadow-none'
                    : 'bg-gray-900 dark:bg-gray-800 text-white hover:bg-gray-800 dark:hover:bg-gray-700'
                }`}
              >
                {plan.buttonText}
              </button>
            </motion.div>
          ))}
        </div>

        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-12 border-t border-gray-100 dark:border-gray-800 pt-24 text-center">
          <div>
            <div className="w-16 h-16 bg-sky-50 dark:bg-sky-500/10 rounded-2xl flex items-center justify-center text-sky-500 dark:text-sky-400 mx-auto mb-6">
              <Zap className="w-8 h-8" />
            </div>
            <h4 className="font-bold text-xl mb-2 dark:text-white">Activación Instantánea</h4>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Obtén acceso a todas las funciones Pro inmediatamente después del pago.</p>
          </div>
          <div>
            <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500 dark:text-emerald-400 mx-auto mb-6">
              <Shield className="w-8 h-8" />
            </div>
            <h4 className="font-bold text-xl mb-2 dark:text-white">Pago Seguro</h4>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Utilizamos tecnología de encriptación de grado bancario para procesar tus pagos.</p>
          </div>
          <div>
            <div className="w-16 h-16 bg-orange-50 dark:bg-orange-500/10 rounded-2xl flex items-center justify-center text-orange-500 dark:text-orange-400 mx-auto mb-6">
              <Star className="w-8 h-8" />
            </div>
            <h4 className="font-bold text-xl mb-2 dark:text-white">Garantía de Satisfacción</h4>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Si no estás satisfecho, te devolvemos tu dinero en los primeros 7 días.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
