import { lazy } from 'react';
import { safeLocalStorage } from './storage';

/**
 * Helper for robust lazy loading with retry logic.
 * If a chunk fails to load (e.g., due to a new deployment), it attempts a force refresh once.
 */
export const lazyWithRetry = (componentImport: () => Promise<any>) => 
  lazy(async () => {
    const pageHasAlreadyBeenForceRefreshed = JSON.parse(
      safeLocalStorage.getItem('page-has-been-force-refreshed') || 'false'
    );

    try {
      const component = await componentImport();
      safeLocalStorage.setItem('page-has-been-force-refreshed', 'false');
      return component;
    } catch (error) {
      if (!pageHasAlreadyBeenForceRefreshed) {
        safeLocalStorage.setItem('page-has-been-force-refreshed', 'true');
        window.location.reload();
        // Return a promise that never resolves to prevent unhandled promise rejections
        return new Promise(() => {});
      }
      throw error;
    }
  });
