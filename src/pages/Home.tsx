import React, { useEffect, useState, useMemo, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { Search, MapPin, Bell, Globe, Hotel, Utensils, Palmtree, Map as MapIcon, ChevronRight, Loader2 } from 'lucide-react';
import { api } from '../services/api';
import { Category, Place } from '../types';
import { useData } from '../context/DataContext';
import { useFavorites } from '../context/FavoritesContext';
import { PlaceCard } from '../components/PlaceCard';
import { SEO } from '../components/SEO';
import './Home.css';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

export function Home() {
  const { 
    categories, 
    featured, 
    loading: dataLoading,
  } = useData();
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<Place[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');

  const filteredPlaces = useMemo(() => {
    if (activeCategory === 'all') return featured;
    return featured.filter(p => {
      const cat = categories.find(c => c.id === p.category_id);
      return cat?.slug === activeCategory;
    });
  }, [featured, activeCategory, categories]);

  useEffect(() => {
    if (search.trim().length > 1) {
      const timer = setTimeout(async () => {
        try {
          const results = await api.searchPlaces(search);
          setSearchResults(results);
          setShowResults(true);
        } catch (err) {
          console.error("Search error:", err);
          setSearchResults([]);
        }
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setSearchResults([]);
      setShowResults(false);
    }
  }, [search]);

  return (
    <motion.div 
      className="home-modern"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <SEO 
        title="Explore"
        description="Find a place for yourself. Discover the best destinations, hotels, and restaurants."
      />

      <header className="home-header px-1-5">
        <div className="header-top flex-between">
          <div className="header-text">
            <h1 className="title-large">Explore</h1>
            <p className="subtitle-muted">Find a place for yourself</p>
          </div>
          <button className="notification-btn">
            <Bell size={24} />
            <span className="notification-dot" />
          </button>
        </div>

        <div className="search-container-modern">
          <div className="search-bar-modern">
            <Search className="search-icon-modern" size={20} />
            <input 
              type="text" 
              placeholder="Search" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input-modern"
            />
          </div>
        </div>

        <nav className="category-filter-modern">
          <button 
            className={`filter-pill ${activeCategory === 'all' ? 'active' : ''}`}
            onClick={() => setActiveCategory('all')}
          >
            All
          </button>
          {categories.map((cat) => (
            <button 
              key={cat.id} 
              className={`filter-pill ${activeCategory === cat.slug ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat.slug || 'all')}
            >
              {cat.name}
            </button>
          ))}
        </nav>
      </header>

      <main className="home-content-modern px-1-5">
        <div className="staggered-grid">
          {dataLoading ? (
            <div className="loader-container">
              <Loader2 className="animate-spin" />
            </div>
          ) : (
            filteredPlaces.map((place, index) => (
              <PlaceCard key={place.id} place={place} index={index} />
            ))
          )}
        </div>

        <section className="categories-section-modern">
          <div className="section-header flex-between">
            <h2 className="section-title">Categories</h2>
            <Link to="/explorar" className="see-more">See more</Link>
          </div>
          
          <div className="categories-icons-grid">
            {categories.slice(0, 4).map((cat) => (
              <Link key={cat.id} to={`/categoria/${cat.slug}`} className="category-icon-item">
                <div className="category-icon-circle">
                  {cat.slug === 'hoteles' ? <Hotel size={24} /> : 
                   cat.slug === 'restaurantes' ? <Utensils size={24} /> :
                   cat.slug === 'destinos' ? <Palmtree size={24} /> :
                   <MapIcon size={24} />}
                </div>
                <span className="category-icon-label">{cat.name}</span>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </motion.div>
  );
}
