import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import './Landing.css';

export function Landing() {
  const navigate = useNavigate();

  return (
    <div className="landing-container">
      <div className="landing-bg">
        <img 
          src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=2000" 
          alt="Tropical Beach" 
          className="landing-bg-img"
        />
        <div className="landing-overlay" />
      </div>

      <div className="landing-content">
        <motion.div 
          className="landing-text-section"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <h1 className="landing-title">
            Explore and <br />
            discover new places
          </h1>
          <p className="landing-subtitle">
            Browse a lot of interesting tourist offers and choose something for yourself. The world is waiting!
          </p>
        </motion.div>

        <motion.div 
          className="landing-actions"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          <button 
            className="btn-primary landing-btn"
            onClick={() => navigate('/explorar')}
          >
            Sign in
          </button>
          
          <button 
            className="landing-link-btn"
            onClick={() => navigate('/registro')}
          >
            Create an account
          </button>
        </motion.div>
      </div>
    </div>
  );
}
