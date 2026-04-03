import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Cloud, CloudDrizzle, CloudFog, CloudLightning, CloudRain, CloudSnow, Sun, Wind, X, Thermometer, Calendar } from 'lucide-react';
import { useLocation } from '../context/LocationContext';
import { motion, AnimatePresence } from 'motion/react';

interface WeatherData {
  temperature: number;
  weathercode: number;
  windspeed: number;
}

interface DailyForecast {
  time: string[];
  weathercode: number[];
  temperature_2m_max: number[];
  temperature_2m_min: number[];
}

const getWeatherIcon = (code: number, className: string = "w-6 h-6") => {
  if (code === 0) return <Sun className={`${className} text-yellow-400`} />;
  if (code >= 1 && code <= 3) return <Cloud className={`${className} text-gray-300`} />;
  if (code >= 45 && code <= 48) return <CloudFog className={`${className} text-gray-400`} />;
  if (code >= 51 && code <= 55) return <CloudDrizzle className={`${className} text-blue-300`} />;
  if (code >= 61 && code <= 67) return <CloudRain className={`${className} text-blue-400`} />;
  if (code >= 71 && code <= 77) return <CloudSnow className={`${className} text-white`} />;
  if (code >= 80 && code <= 82) return <CloudRain className={`${className} text-blue-500`} />;
  if (code >= 85 && code <= 86) return <CloudSnow className={`${className} text-blue-100`} />;
  if (code >= 95 && code <= 99) return <CloudLightning className={`${className} text-yellow-500`} />;
  return <Sun className={`${className} text-yellow-400`} />;
};

const getWeatherDescription = (code: number) => {
  if (code === 0) return 'Despejado';
  if (code >= 1 && code <= 3) return 'Parcialmente nublado';
  if (code >= 45 && code <= 48) return 'Niebla';
  if (code >= 51 && code <= 55) return 'Llovizna';
  if (code >= 61 && code <= 67) return 'Lluvia';
  if (code >= 71 && code <= 77) return 'Nieve';
  if (code >= 80 && code <= 82) return 'Chubascos';
  if (code >= 85 && code <= 86) return 'Chubascos de nieve';
  if (code >= 95 && code <= 99) return 'Tormenta eléctrica';
  return 'Despejado';
};

const getDayName = (dateStr: string) => {
  const date = new Date(dateStr + 'T12:00:00');
  return new Intl.DateTimeFormat('es-ES', { weekday: 'long' }).format(date);
};

export function WeatherWidget() {
  const { location, city } = useLocation();
  const [weather, setWeather] = useState<WeatherData | null>(() => {
    const cached = localStorage.getItem('cached_weather');
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < 1800000) return data;
    }
    return null;
  });
  const [forecast, setForecast] = useState<DailyForecast | null>(() => {
    const cached = localStorage.getItem('cached_forecast');
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < 1800000) return data;
    }
    return null;
  });
  const [loading, setLoading] = useState(() => {
    const cached = localStorage.getItem('cached_weather');
    if (cached) {
      const { timestamp } = JSON.parse(cached);
      return Date.now() - timestamp > 1800000;
    }
    return true;
  });
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const fetchWeather = async () => {
      // If we have fresh cache, don't fetch
      const cached = localStorage.getItem('cached_weather');
      if (cached) {
        const { timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < 1800000) {
          setLoading(false);
          return;
        }
      }

      try {
        const url = `/api/weather?latitude=${location.lat}&longitude=${location.lng}`;
        console.log('Fetching weather from:', url);
        const response = await fetch(url);
        
        if (!response.ok) throw new Error(`Weather fetch failed with status: ${response.status}`);

        const data = await response.json();
        if (data.error) throw new Error(data.error);
        
        setWeather(data.current_weather);
        setForecast(data.daily);
        
        try {
          localStorage.setItem('cached_weather', JSON.stringify({
            data: data.current_weather,
            timestamp: Date.now()
          }));
          localStorage.setItem('cached_forecast', JSON.stringify({
            data: data.daily,
            timestamp: Date.now()
          }));
        } catch (e) {
          console.error('Error caching weather data:', e);
        }
      } catch (error: any) {
        console.error('Error fetching weather:', error.message || error);
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
  }, [location.lat, location.lng]);

  // Prevent scrolling when modal is open
  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showModal]);

  if (loading || !weather) return null;

  const modalContent = (
    <AnimatePresence>
      {showModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-auto">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowModal(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-lg bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl overflow-hidden shadow-2xl"
          >
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#F5B027]/10 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-[#F5B027]" />
                </div>
                <div>
                  <h3 className="text-gray-900 dark:text-white font-black uppercase tracking-widest text-sm">Pronóstico Semanal</h3>
                  <p className="text-gray-500 dark:text-gray-400 text-[10px] uppercase tracking-widest font-bold">{city || 'OSORNO'}, CHILE</p>
                </div>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-3 max-h-[60vh] overflow-y-auto no-scrollbar bg-gray-50/50 dark:bg-gray-950/50">
              {forecast?.time.map((time, index) => (
                <div 
                  key={time}
                  className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                    index === 0 
                      ? 'bg-[#F5B027]/10 border-[#F5B027]/20' 
                      : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 hover:border-[#F5B027]/30'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 flex justify-center">
                      {getWeatherIcon(forecast.weathercode[index], "w-7 h-7")}
                    </div>
                    <div className="flex flex-col">
                      <span className={`text-sm font-black uppercase tracking-wider ${index === 0 ? 'text-[#F5B027]' : 'text-gray-900 dark:text-white'}`}>
                        {index === 0 ? 'Hoy' : getDayName(time)}
                      </span>
                      <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-bold tracking-widest">
                        {getWeatherDescription(forecast.weathercode[index])}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="flex flex-col items-end">
                      <div className="flex items-center gap-1.5">
                        <Thermometer className="w-3 h-3 text-red-500/50" />
                        <span className="text-sm font-black text-gray-900 dark:text-white">{Math.round(forecast.temperature_2m_max[index])}°</span>
                      </div>
                      <span className="text-[9px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-tighter">Máx</span>
                    </div>
                    
                    <div className="flex flex-col items-end">
                      <div className="flex items-center gap-1.5">
                        <Thermometer className="w-3 h-3 text-sky-500/50" />
                        <span className="text-sm font-black text-gray-500 dark:text-gray-400">{Math.round(forecast.temperature_2m_min[index])}°</span>
                      </div>
                      <span className="text-[9px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-tighter">Mín</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-6 bg-gray-50 dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 flex items-center justify-center">
              <p className="text-[9px] text-gray-400 dark:text-gray-500 uppercase font-black tracking-[0.3em]">Datos proporcionados por Open-Meteo</p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return (
    <>
      <button 
        onClick={() => setShowModal(true)}
        className="inline-flex items-center justify-center bg-white/20 backdrop-blur-md rounded-full px-4 py-2 transition-all hover:bg-white/30 shadow-lg border border-white/30 group"
      >
        <div className="flex items-center gap-3">
          <div className="text-white drop-shadow-sm">
            {getWeatherIcon(weather.weathercode, "w-5 h-5")}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-black text-white drop-shadow-md">{Math.round(weather.temperature)}°C</span>
            <div className="w-px h-3 bg-white/30" />
            <span className="text-[10px] uppercase font-black tracking-widest text-white/90 drop-shadow-sm">{city || 'OSORNO'}</span>
          </div>
        </div>
      </button>

      {createPortal(modalContent, document.body)}
    </>
  );
}
