import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { optimizeImageUrl } from '../utils/image';

interface ElegantImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  containerClassName?: string;
  skeletonClassName?: string;
  priority?: boolean;
}

export function ElegantImage({ 
  src, 
  alt, 
  className, 
  containerClassName = "", 
  skeletonClassName = "bg-gray-100 dark:bg-gray-900",
  priority = false,
  ...props 
}: ElegantImageProps) {
  // If priority is true, we start as "loaded" to avoid skeleton flash
  const [isLoaded, setIsLoaded] = useState(priority);
  const [error, setError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Check if image is already loaded (from cache)
  useEffect(() => {
    if (imgRef.current && imgRef.current.complete) {
      setIsLoaded(true);
    }
  }, [src]);

  // Generate srcset for better responsive loading if it's an Unsplash or proxied URL
  const generateSrcSet = (url: string) => {
    if (!url) return undefined;
    
    // If it's already a proxied URL or Unsplash, we can generate multiple widths
    if (url.includes('images.unsplash.com') || url.includes('wsrv.nl')) {
      const widths = [320, 640, 800, 1024, 1200];
      return widths
        .map(w => {
          const optimized = optimizeImageUrl(url, w);
          return `${optimized} ${w}w`;
        })
        .join(', ');
    }
    return undefined;
  };

  const srcSet = useMemo(() => generateSrcSet(src || ""), [src]);

  // Destructure to avoid passing incompatible props to motion.img
  const { 
    onLoad, 
    referrerPolicy,
    onAnimationStart,
    onAnimationEnd,
    onAnimationIteration,
    loading,
    decoding,
    ...imgProps 
  } = props;

  return (
    <div className={`relative overflow-hidden ${containerClassName}`}>
      {/* Skeleton / Placeholder */}
      <AnimatePresence>
        {!isLoaded && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`absolute inset-0 animate-pulse z-10 ${skeletonClassName}`}
          />
        )}
      </AnimatePresence>

      <motion.img
        ref={imgRef}
        src={src}
        srcSet={srcSet}
        alt={alt}
        initial={{ opacity: priority ? 1 : 0 }}
        animate={{ 
          opacity: isLoaded ? 1 : (priority ? 1 : 0)
        }}
        transition={{ 
          duration: 0.2, // Faster transition for snappier feel
          ease: "linear"
        }}
        onLoad={(e) => {
          setIsLoaded(true);
          setError(false);
          if (onLoad) onLoad(e);
        }}
        onError={(e) => {
          setIsLoaded(true);
          setError(true);
        }}
        className={`w-full h-full ${className} ${error ? 'opacity-50 grayscale' : ''}`}
        referrerPolicy={referrerPolicy || "no-referrer"}
        loading={priority ? "eager" : (loading || "lazy")}
        decoding="async"
        // @ts-ignore - fetchPriority is a valid attribute in modern browsers
        fetchPriority={priority ? "high" : "auto"}
        {...imgProps as any}
      />
    </div>
  );
}
