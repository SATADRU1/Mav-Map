import React, { useState, useEffect } from 'react';
import { MapContainer } from '../components/MapContainer';
import { MapboxTokenInput } from '../components/MapboxTokenInput';

const Index = () => {
  const [mapboxToken, setMapboxToken] = useState<string>('');

  useEffect(() => {
    // Check for stored token
    const storedToken = localStorage.getItem('mavmap-mapbox-token');
    if (storedToken) {
      setMapboxToken(storedToken);
    }
  }, []);

  const handleTokenSubmit = (token: string) => {
    setMapboxToken(token);
  };

  if (!mapboxToken) {
    return <MapboxTokenInput onTokenSubmit={handleTokenSubmit} />;
  }

  return <MapContainer mapboxToken={mapboxToken} />;
};

export default Index;
