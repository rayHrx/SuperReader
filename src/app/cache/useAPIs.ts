// app/hooks/useAPIs.ts

import { useState, useEffect } from 'react';
import { APIs } from './APIs';
import { Capacitor } from '@capacitor/core';
import { defineCustomElements as jeepSqlite } from 'jeep-sqlite/loader';

let apis: APIs | null = null;

export function useAPIs() {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initAPIs = async () => {
      if (!apis) {
        apis = new APIs();
        console.log('Initializing APIs');

        if (Capacitor.getPlatform() === 'web') {
          // Define the custom element for web platform
          jeepSqlite(window);

          // Create and append the jeep-sqlite element
          const jeepEl = document.createElement("jeep-sqlite");
          document.body.appendChild(jeepEl);

          // Wait for the custom element to be defined
          await customElements.whenDefined("jeep-sqlite");
        }

        await apis.initialize();
        console.log('APIs initialized');
      }
      setIsInitialized(true);
    };

    initAPIs();
  }, []);

  return { apis, isInitialized };
}