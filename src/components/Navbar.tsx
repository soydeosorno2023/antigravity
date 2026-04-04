import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Compass, Heart, User, Search, Map as MapIcon, Utensils, MessageSquare, Image, Info, Calendar, Gift } from 'lucide-react';
import { motion } from 'framer-motion';
import { api } from '../services/api';
import { Place, Category } from '../types';
import './Navbar.css';

export function Navbar() {
  console.log("Navbar component is rendering");
  const location = useLocation();
  const isPlaceDetail = location.pathname.startsWith('/lugar/');
  const [place, setPlace] = React.useState<Place | null>(null);
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [tours, setTours] = React.useState<any[]>([]);

  const [loading, setLoading] = React.useState(isPlaceDetail);

  React.useEffect(() => {
    if (isPlaceDetail) {
      setLoading(true);
      const slug = location.pathname.split('/')[2];
      
      let unsubTours: (() => void) | undefined;

      // Fetch place and categories
      Promise.all([
        api.getPlaceBySlug(slug),
        api.getCategories()
      ]).then(([p, cats]) => {
        if (!p) {
          console.warn('Place not found for slug:', slug);
          setLoading(false);
          return;
        }
        setPlace(p);
        setCategories(cats);
        
        // Subscribe to tours
        unsubTours = api.subscribeToTours(p.id, (toursData) => {
          setTours(toursData);
        });
        
        setLoading(false);
      }).catch(err => {
        console.error('Error in Navbar Promise.all:', err);
        setLoading(false);
      });

      return () => {
        if (unsubTours) unsubTours();
      };
    } else {
      setPlace(null);
      setTours([]);
      setLoading(false);
    }
  }, [isPlaceDetail, location.pathname]);
  
  const mainNavItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: Gift, label: 'Rewards', path: '/precios' },
    { icon: Heart, label: 'Favorites', path: '/para-ti' },
    { icon: User, label: 'Profile', path: '/perfil' },
  ];

  const categoryName = place?.category_name || categories.find(c => c.id === place?.category_id)?.name;
  const category = categoryName?.trim().toLowerCase();
  const isPark = !loading && (category === 'parques');
  const hasMenu = !loading && place?.has_menu;
  const hasTours = !loading && tours.length > 0;

  const placeNavItems = [
    { icon: Home, label: 'Inicio', path: '/' },
    { icon: Info, label: 'Info', path: '#info' },
    ...(hasMenu ? [{ icon: Utensils, label: 'Menú', path: '#menu' }] : []),
    ...(isPark && hasTours ? [{ icon: Calendar, label: 'Tours', path: '#tours' }] : []),
    { icon: MessageSquare, label: 'Reseñas', path: '#reseñas' },
    { icon: Image, label: 'Galería', path: '#galeria' },
  ];

  const navItems = isPlaceDetail ? placeNavItems : mainNavItems;

  return (
    <div className="navbar-wrapper">
      <nav className="navbar-container">
        {navItems.map((item) => {
          const Icon = item.icon;
          const decodedHash = decodeURIComponent(location.hash);
          const isActive = isPlaceDetail 
            ? (item.path === '/' ? false : (decodedHash === item.path || (location.hash === '' && item.path === '#info')))
            : location.pathname === item.path;
          
          const handleClick = (e: React.MouseEvent) => {
            if (isPlaceDetail && item.path.startsWith('#')) {
              // For place detail, we just want to update the hash without full navigation if possible
            }
          };

          return (
            <Link
              key={item.path}
              to={isPlaceDetail && item.path.startsWith('#') ? `${location.pathname}${item.path}` : item.path}
              onClick={handleClick}
              className={`nav-item ${isActive ? 'nav-item-active' : ''}`}
            >
              <Icon className="nav-icon" />
              {isActive && (
                <motion.span 
                  initial={{ opacity: 0, width: 0, marginLeft: 0 }}
                  animate={{ opacity: 1, width: 'auto', marginLeft: 8 }}
                  className="nav-label"
                >
                  {item.label}
                </motion.span>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
