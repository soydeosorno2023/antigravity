import React from 'react';
import { UserAlgorithmSection } from '../components/UserAlgorithmSection';
import { SEO } from '../components/SEO';

export function ForYou() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pt-20 pb-10">
      <SEO 
        title="Para Ti"
        description="Descubre contenido personalizado, tus favoritos y tus me gusta."
        canonical="/for-you"
      />
      <div className="max-w-7xl mx-auto px-6">
        <UserAlgorithmSection />
      </div>
    </div>
  );
}
