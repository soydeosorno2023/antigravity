/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Suspense } from 'react';
import { Routes, Route, useLocation as useRouterLocation } from 'react-router-dom';
import './App.css';
import { Navbar } from './components/Navbar';
import { Home } from './pages/Home';
import { FavoritesProvider } from './context/FavoritesContext';
import { LikesProvider } from './context/LikesContext';
import { LocationProvider } from './context/LocationContext';
import { DataProvider } from './context/DataContext';
import { ThemeProvider } from './context/ThemeContext';
import { CartProvider } from './context/CartContext';
import { Header } from './components/Header';
import { CartDrawer } from './components/CartDrawer';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Loader2 } from 'lucide-react';
import { lazyWithRetry } from './utils/lazy';

// Lazy load pages with retry logic
const CategoryView = lazyWithRetry(() => import('./pages/CategoryView').then(m => ({ default: m.CategoryView })));
const PlaceDetail = lazyWithRetry(() => import('./pages/PlaceDetail').then(m => ({ default: m.PlaceDetail })));
const AdminLogin = lazyWithRetry(() => import('./pages/AdminLogin').then(m => ({ default: m.AdminLogin })));
const AdminDashboard = lazyWithRetry(() => import('./pages/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const Register = lazyWithRetry(() => import('./pages/Register').then(m => ({ default: m.Register })));
const UserProfile = lazyWithRetry(() => import('./pages/UserProfile').then(m => ({ default: m.UserProfile })));
const Pricing = lazyWithRetry(() => import('./pages/Pricing').then(m => ({ default: m.Pricing })));
const ForYou = lazyWithRetry(() => import('./pages/ForYou').then(m => ({ default: m.ForYou })));
const Landing = lazyWithRetry(() => import('./pages/Landing').then(m => ({ default: m.Landing })));

const PageLoader = () => (
  <div className="page-loader">
    <div className="loader-icon-wrapper">
      <Loader2 className="loader-icon" />
      <div className="loader-glow" />
    </div>
    <p className="loader-text">
      Cargando...
    </p>
  </div>
);

export default function App() {
  const routerLocation = useRouterLocation();
  const isAdmin = routerLocation.pathname.startsWith('/admin');

  React.useEffect(() => {
    // Global error handler for unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason);
      console.error('Full event:', event);
      // If it's a chunk loading error, we might want to reload
      if (event.reason?.name === 'ChunkLoadError' || 
          event.reason?.message?.includes('Loading chunk') ||
          event.reason?.message?.includes('dynamically imported module')) {
        window.location.reload();
      }
    };

    const handleGlobalError = (message: string | Event, source?: string, lineno?: number, colno?: number, error?: Error) => {
      console.error('Global error caught:', { message, source, lineno, colno, error });
      if (message === 'Script error.') {
        console.warn('A "Script error." occurred. This is usually due to a cross-origin script error being hidden by the browser.');
      }
      return false; // Let the default handler run
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', (event) => {
      handleGlobalError(event.message, event.filename, event.lineno, event.colno, event.error);
    });
    
    // Remove splash screen when app is mounted
    const timer = setTimeout(() => {
      // @ts-ignore
      if (window.removeSplashScreen) {
        // @ts-ignore
        window.removeSplashScreen();
      }
    }, 0);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      // @ts-ignore
      window.removeEventListener('error', handleGlobalError);
      clearTimeout(timer);
    };
  }, []);

  return (
    <ThemeProvider>
      <LocationProvider>
        <DataProvider>
          <CartProvider>
            <FavoritesProvider>
              <LikesProvider>
                <div className="app-wrapper">
                  <Header />
                  <CartDrawer />
                  <main className="app-main">
                    <ErrorBoundary>
                      <Suspense fallback={<PageLoader />}>
                        <Routes>
                          <Route path="/" element={<Home />} />
                          <Route path="/categoria/:slug" element={<CategoryView />} />
                          <Route path="/lugar/:slug" element={<PlaceDetail />} />
                          <Route path="/admin" element={<AdminLogin />} />
                          <Route path="/admin/dashboard" element={<AdminDashboard />} />
                          <Route path="/registro" element={<Register />} />
                          <Route path="/perfil" element={<UserProfile />} />
                          <Route path="/precios" element={<Pricing />} />
                          <Route path="/explorar" element={<CategoryView />} />
                          <Route path="/para-ti" element={<ForYou />} />
                          <Route path="/bienvenido" element={<Landing />} />
                          {/* Catch all route to prevent blank screens on invalid paths */}
                          <Route path="*" element={<Home />} />
                        </Routes>
                      </Suspense>
                    </ErrorBoundary>
                  </main>
                  <Navbar />
                </div>
              </LikesProvider>
            </FavoritesProvider>
          </CartProvider>
        </DataProvider>
      </LocationProvider>
    </ThemeProvider>
  );
}
