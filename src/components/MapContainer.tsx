import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Search, Navigation, Plus, Minus, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

interface MapContainerProps {
  mapboxToken?: string;
}

export const MapContainer = ({ mapboxToken }: MapContainerProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSpinning, setIsSpinning] = useState(true);
  const [mapError, setMapError] = useState<string>('');
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) return;

    // Validate token format
    if (!mapboxToken.startsWith('pk.')) {
      setMapError('Invalid Mapbox token format. Token should start with "pk."');
      return;
    }

    // Initialize map
    mapboxgl.accessToken = mapboxToken;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      projection: 'globe' as any,
      zoom: 1.5,
      center: [30, 15],
      pitch: 45,
    });

    
    // Error handling
    map.current.on('error', (e) => {
      console.error('Mapbox error:', e);
      if (e.error?.message?.includes('Unauthorized') || e.error?.message?.includes('Invalid Token')) {
        setMapError('Invalid Mapbox token. Please check your token and try again.');
      } else {
        setMapError('Failed to load map. Please check your internet connection.');
      }
    });

    // Success handling
    map.current.on('load', () => {
      setIsMapLoaded(true);
      setMapError('');
      toast.success("Mav Map initialized! 🌍");
    });

    // Add navigation controls
    map.current.addControl(
      new mapboxgl.NavigationControl({
        visualizePitch: true,
      }),
      'top-right'
    );

    // Add atmosphere and fog effects
    map.current.on('style.load', () => {
      map.current?.setFog({
        color: 'rgb(15, 23, 42)',
        'high-color': 'rgb(30, 41, 59)',
        'horizon-blend': 0.2,
      });
    });

    // Rotation animation settings
    const secondsPerRevolution = 240;
    const maxSpinZoom = 5;
    const slowSpinZoom = 3;
    let userInteracting = false;

    // Spin globe function
    function spinGlobe() {
      if (!map.current) return;
      
      const zoom = map.current.getZoom();
      if (isSpinning && !userInteracting && zoom < maxSpinZoom) {
        let distancePerSecond = 360 / secondsPerRevolution;
        if (zoom > slowSpinZoom) {
          const zoomDif = (maxSpinZoom - zoom) / (maxSpinZoom - slowSpinZoom);
          distancePerSecond *= zoomDif;
        }
        const center = map.current.getCenter();
        center.lng -= distancePerSecond;
        map.current.easeTo({ center, duration: 1000, easing: (n) => n });
      }
    }

    // Event listeners for interaction
    map.current.on('mousedown', () => {
      userInteracting = true;
    });
    
    map.current.on('dragstart', () => {
      userInteracting = true;
    });
    
    map.current.on('mouseup', () => {
      userInteracting = false;
      spinGlobe();
    });
    
    map.current.on('touchend', () => {
      userInteracting = false;
      spinGlobe();
    });

    map.current.on('moveend', () => {
      spinGlobe();
    });

    // Start the globe spinning
    spinGlobe();

    // Cleanup
    return () => {
      map.current?.remove();
    };
  }, [mapboxToken, isSpinning, mapError]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || !mapboxToken) return;

    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          searchQuery
        )}.json?access_token=${mapboxToken}&limit=1`
      );
      
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        const [lng, lat] = data.features[0].center;
        
        map.current?.flyTo({
          center: [lng, lat],
          zoom: 12,
          duration: 2000,
        });

        // Add marker
        new mapboxgl.Marker({
          color: '#0ea5e9',
        })
          .setLngLat([lng, lat])
          .setPopup(
            new mapboxgl.Popup().setHTML(
              `<div class="p-2 text-sm font-medium">${data.features[0].place_name}</div>`
            )
          )
          .addTo(map.current!);

        toast.success(`Found: ${data.features[0].place_name}`);
      } else {
        toast.error('Location not found');
      }
    } catch (error) {
      toast.error('Search failed');
    }
  };

  const zoomIn = () => {
    map.current?.zoomIn();
  };

  const zoomOut = () => {
    map.current?.zoomOut();
  };

  const resetView = () => {
    setIsSpinning(true);
    map.current?.flyTo({
      center: [30, 15],
      zoom: 1.5,
      pitch: 45,
      duration: 2000,
    });
  };

  const toggleSpin = () => {
    setIsSpinning(!isSpinning);
    toast.info(isSpinning ? 'Globe rotation paused' : 'Globe rotation resumed');
  };

  if (!mapboxToken) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-background to-background/80">
        <div className="text-center space-y-4 p-8 bg-card/30 backdrop-blur-md rounded-xl border border-border/50">
          <h2 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Mapbox Token Required
          </h2>
          <p className="text-muted-foreground">
            Please enter your Mapbox public token to use Mav Map
          </p>
          <Button variant="glass" asChild>
            <a href="https://mapbox.com/" target="_blank" rel="noopener noreferrer">
              Get Mapbox Token
            </a>
          </Button>
        </div>
      </div>
    );
  }

  if (mapError) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-background to-background/80">
        <div className="text-center space-y-4 p-8 bg-card/30 backdrop-blur-md rounded-xl border border-destructive/20 max-w-md">
          <div className="w-12 h-12 bg-destructive/20 rounded-full flex items-center justify-center mx-auto">
            <span className="text-destructive text-xl">⚠️</span>
          </div>
          <h2 className="text-xl font-bold text-destructive">
            Map Error
          </h2>
          <p className="text-muted-foreground text-sm">
            {mapError}
          </p>
          <div className="space-y-2">
            <Button 
              variant="outline" 
              onClick={() => {
                localStorage.removeItem('mavmap-mapbox-token');
                window.location.reload();
              }}
            >
              Enter New Token
            </Button>
            <Button variant="glass" asChild>
              <a href="https://account.mapbox.com/access-tokens/" target="_blank" rel="noopener noreferrer">
                Get Valid Token
              </a>
            </Button>
          </div>
          <div className="mt-4 p-3 bg-muted/20 rounded-lg border border-border/20 text-left">
            <p className="text-xs text-muted-foreground">
              <strong>How to get a token:</strong><br />
              1. Go to mapbox.com<br />
              2. Create a free account<br />
              3. Find your token in Account → Access tokens<br />
              4. Copy the token that starts with "pk."
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* Map Container */}
      <div ref={mapContainer} className="absolute inset-0" />
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-overlay" />

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Mav Map
            </h1>
            <div className="text-sm text-muted-foreground px-3 py-1 bg-card/20 backdrop-blur-sm rounded-full border border-border/30">
              Interactive Globe
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="absolute top-20 left-6 right-6 z-10">
        <form onSubmit={handleSearch} className="max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              type="text"
              placeholder="Search places..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-card/30 backdrop-blur-md border-border/50 focus:bg-card/50"
            />
          </div>
        </form>
      </div>

      {/* Controls */}
      <div className="absolute bottom-6 right-6 z-10 flex flex-col space-y-3">
        <Button variant="floating" size="icon" onClick={zoomIn}>
          <Plus className="w-4 h-4" />
        </Button>
        <Button variant="floating" size="icon" onClick={zoomOut}>
          <Minus className="w-4 h-4" />
        </Button>
        <Button variant="floating" size="icon" onClick={resetView}>
          <Navigation className="w-4 h-4" />
        </Button>
        <Button variant="floating" size="icon" onClick={toggleSpin}>
          <RotateCcw className={`w-4 h-4 ${isSpinning ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Info Panel */}
      <div className="absolute bottom-6 left-6 z-10">
        <div className="bg-card/30 backdrop-blur-md rounded-lg border border-border/50 p-4 space-y-2 max-w-sm">
          <h3 className="font-semibold text-foreground">Welcome to Mav Map</h3>
          <p className="text-sm text-muted-foreground">
            Search for places, explore the interactive globe, and discover the world.
          </p>
          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
            <span>Globe {isSpinning ? 'rotating' : 'paused'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};