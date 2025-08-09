'use client';

import { useState, useEffect, useRef } from 'react';
import { MapPinIcon, XIcon, AlertCircleIcon } from 'lucide-react';

interface LocationSuggestion {
  place_id: string;
  display_name: string;
  lat: string;
  lon: string;
}

interface LocationSuggestionProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export default function LocationSuggestion({ 
  value, 
  onChange, 
  placeholder = "Enter your location",
  className = ""
}: LocationSuggestionProps) {
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manualMode, setManualMode] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Debounced search function
  const searchLocations = async (query: string) => {
    if (!query.trim() || query.length < 3 || manualMode) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `https://us1.locationiq.com/v1/search.php?key=${process.env.NEXT_PUBLIC_LOCATIONIQ_API_KEY}&q=${encodeURIComponent(query)}&format=json&limit=5`
      );

      if (!response.ok) {
        throw new Error(`LocationIQ API error: ${response.status}`);
      }

      const data = await response.json();
      setSuggestions(data || []);
      setShowSuggestions(true);
    } catch (err) {
      console.error('Location search error:', err);
      setError('Unable to load location suggestions. You can enter your location manually.');
      setSuggestions([]);
      setShowSuggestions(false);
      // Auto-enable manual mode on API error
      setManualMode(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle input change with debouncing
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);

    // Clear previous timeout
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Set new timeout for debounced search
    debounceRef.current = setTimeout(() => {
      searchLocations(newValue);
    }, 300);
  };

  // Handle suggestion selection
  const handleSuggestionClick = (suggestion: LocationSuggestion) => {
    onChange(suggestion.display_name);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const enableManualMode = () => {
    setManualMode(true);
    setError(null);
    setShowSuggestions(false);
    setSuggestions([]);
    inputRef.current?.focus();
  };

  const disableManualMode = () => {
    setManualMode(false);
    setError(null);
    if (value.length >= 3) {
      searchLocations(value);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          placeholder={placeholder}
          className="flex-1 border border-gray-300 rounded px-3 py-1 pr-8 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          onFocus={() => {
            if (suggestions.length > 0 && !manualMode) {
              setShowSuggestions(true);
            }
          }}
        />
        
        {/* Loading indicator */}
        {isLoading && (
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
          </div>
        )}
      </div>

      {/* Error message with manual mode option */}
      {error && !manualMode && (
        <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
          <div className="flex items-start">
            <AlertCircleIcon className="h-4 w-4 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-yellow-800">{error}</p>
              <button
                onClick={enableManualMode}
                className="text-sm text-yellow-900 underline hover:no-underline mt-1"
              >
                Enter manually instead
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual mode indicator */}
      {manualMode && (
        <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <MapPinIcon className="h-4 w-4 text-blue-600 mr-2" />
              <span className="text-sm text-blue-800">Manual entry mode</span>
            </div>
            <button
              onClick={disableManualMode}
              className="text-sm text-blue-900 underline hover:no-underline"
            >
              Try suggestions again
            </button>
          </div>
        </div>
      )}

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && !manualMode && (
        <div
          ref={suggestionsRef}
          className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto"
        >
          {suggestions.map((suggestion) => (
            <button
              key={suggestion.place_id}
              onClick={() => handleSuggestionClick(suggestion)}
              className="w-full px-3 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-100 last:border-b-0"
            >
              <div className="flex items-start">
                <MapPinIcon className="h-4 w-4 text-gray-400 mt-0.5 mr-2 flex-shrink-0" />
                <span className="text-sm text-gray-900 truncate">
                  {suggestion.display_name}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
