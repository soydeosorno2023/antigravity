import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Globe, Play, User, MapPin, Utensils, MessageSquare, Image, Info, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import { api } from '../services/api';
import { Place, Category } from '../types';

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
    { icon: Home, label: 'Inicio', path: '/' },
    { icon: Globe, label: 'Explorar', path: '/explorar' },
    { icon: Play, label: 'Para Ti', path: '/para-ti' },
    { icon: User, label: 'Perfil', path: '/perfil' },
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
    <div className="fixed bottom-6 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
      <nav className="bg-[#F5B027] rounded-full px-2 py-2 flex items-center gap-2 sm:gap-4 shadow-xl pointer-events-auto border-2 border-white/30">
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
              className={`relative flex items-center justify-center h-12 rounded-full transition-all duration-300 ${
                isActive ? 'bg-[#1A1A1A] text-white px-5' : 'text-[#1A1A1A] w-12 sm:w-14 hover:bg-black/10'
              }`}
            >
              <Icon className="w-5 h-5 relative z-10" />
              {isActive && (
                <motion.span 
                  initial={{ opacity: 0, width: 0, marginLeft: 0 }}
                  animate={{ opacity: 1, width: 'auto', marginLeft: 8 }}
                  className="text-sm font-bold relative z-10 whitespace-nowrap"
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
