import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  ogImage?: string;
  url?: string;
  canonical?: string;
  type?: string;
  ogType?: string;
  schema?: object;
  noindex?: boolean;
}

export const SEO: React.FC<SEOProps> = ({
  title,
  description,
  keywords,
  image,
  ogImage,
  url,
  canonical,
  type,
  ogType,
  schema,
  noindex
}) => {
  const siteTitle = 'Mira Osorno';
  const fullTitle = title ? `${title} | ${siteTitle}` : siteTitle;
  const siteDescription = 'Descubre los mejores lugares, comercios y servicios en Osorno, Chile. Tu guía definitiva para explorar la ciudad.';
  const metaDescription = description || siteDescription;
  const siteUrl = 'https://miraosorno.cl';
  const fullCanonical = canonical ? `${siteUrl}${canonical}` : siteUrl;
  const finalImage = ogImage || image || '/og-image.jpg';
  const finalType = ogType || type || 'website';

  return (
    <Helmet>
      {/* Standard metadata */}
      <title>{fullTitle}</title>
      <meta name="description" content={metaDescription} />
      {keywords && <meta name="keywords" content={keywords} />}
      {noindex && <meta name="robots" content="noindex, nofollow" />}
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={finalType} />
      <meta property="og:url" content={fullCanonical} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:image" content={finalImage} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={fullCanonical} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={metaDescription} />
      {finalImage && <meta name="twitter:image" content={finalImage} />}

      {/* Canonical URL */}
      <link rel="canonical" href={fullCanonical} />

      {/* Structured Data */}
      {schema && (
        <script type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      )}
    </Helmet>
  );
};
