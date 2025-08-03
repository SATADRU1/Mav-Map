import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Eye, EyeOff, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

interface MapboxTokenInputProps {
  onTokenSubmit: (token: string) => void;
}

export const MapboxTokenInput = ({ onTokenSubmit }: MapboxTokenInputProps) => {
  const [token, setToken] = useState('');
  const [showToken, setShowToken] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) {
      toast.error('Please enter a valid Mapbox token');
      return;
    }
    
    // Store in localStorage for persistence
    localStorage.setItem('mavmap-mapbox-token', token);
    onTokenSubmit(token);
    toast.success('Mapbox token saved! Initializing Mav Map...');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-background/80 p-6">
      <Card className="w-full max-w-md bg-card/30 backdrop-blur-md border-border/50 shadow-elevated">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl bg-gradient-primary bg-clip-text text-transparent">
            Welcome to Mav Map
          </CardTitle>
          <CardDescription>
            Enter your Mapbox public token to start exploring the world
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="token">Mapbox Public Token</Label>
              <div className="relative">
                <Input
                  id="token"
                  type={showToken ? 'text' : 'password'}
                  placeholder="pk.eyJ1IjoieW91cnVzZXJuYW1lIi..."
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  className="pr-10 bg-background/50 border-border/50 focus:bg-background/80"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowToken(!showToken)}
                >
                  {showToken ? (
                    <EyeOff className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <Eye className="w-4 h-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>
            
            <Button type="submit" className="w-full" variant="default">
              Initialize Mav Map
            </Button>
          </form>

          <div className="border-t border-border/30 pt-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Need a token?</span>
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="text-primary hover:text-primary-glow"
              >
                <a
                  href="https://mapbox.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-1"
                >
                  <span>Get Mapbox Token</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </Button>
            </div>
            
            <div className="mt-4 p-3 bg-muted/20 rounded-lg border border-border/20">
              <p className="text-xs text-muted-foreground">
                <strong>Tip:</strong> Create a free account at Mapbox.com and find your public token in the Tokens section of your dashboard.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};