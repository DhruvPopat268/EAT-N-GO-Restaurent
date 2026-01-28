"use client";
import { useCallback, useEffect, useState } from 'react';
import { GoogleMap, LoadScript, Marker, Autocomplete } from '@react-google-maps/api';

interface LocationData {
  address: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  latitude: string;
  longitude: string;
}

interface MapLocationSelectorProps {
  initialLocation?: LocationData;
  onLocationChange: (location: LocationData) => void;
  isEditing: boolean;
}

const libraries: ("places")[] = ['places'];

const mapContainerStyle = {
  width: '100%',
  height: '256px'
};

export default function MapLocationSelector({ 
  initialLocation, 
  onLocationChange, 
  isEditing 
}: MapLocationSelectorProps) {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
  const [searchValue, setSearchValue] = useState('');
  const [currentLocation, setCurrentLocation] = useState<LocationData>(
    initialLocation || {
      address: '',
      city: '',
      state: '',
      country: '',
      pincode: '',
      latitude: '21.1702',
      longitude: '72.8311'
    }
  );

  const center = {
    lat: parseFloat(currentLocation.latitude),
    lng: parseFloat(currentLocation.longitude)
  };

  useEffect(() => {
    if (initialLocation) {
      setCurrentLocation(initialLocation);
    }
  }, [initialLocation]);

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  const onAutocompleteLoad = (autocomplete: google.maps.places.Autocomplete) => {
    setAutocomplete(autocomplete);
  };

  const onPlaceChanged = () => {
    if (autocomplete) {
      const place = autocomplete.getPlace();
      if (place.geometry && place.geometry.location) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        reverseGeocode(lat, lng);
        if (map) {
          map.setCenter({ lat, lng });
        }
      }
    }
  };

  const onMapClick = (event: google.maps.MapMouseEvent) => {
    if (isEditing && event.latLng) {
      const lat = event.latLng.lat();
      const lng = event.latLng.lng();
      reverseGeocode(lat, lng);
    }
  };

  const onMarkerDragEnd = (event: google.maps.MapMouseEvent) => {
    if (event.latLng) {
      const lat = event.latLng.lat();
      const lng = event.latLng.lng();
      reverseGeocode(lat, lng);
    }
  };

  const reverseGeocode = (lat: number, lng: number) => {
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === 'OK' && results && results[0]) {
        const result = results[0];
        const addressComponents = result.address_components;
        
        let city = '';
        let state = '';
        let country = '';
        let pincode = '';

        addressComponents?.forEach((component) => {
          const types = component.types;
          if (types.includes('locality') || types.includes('administrative_area_level_2')) {
            city = component.long_name;
          } else if (types.includes('administrative_area_level_1')) {
            state = component.long_name;
          } else if (types.includes('country')) {
            country = component.long_name;
          } else if (types.includes('postal_code')) {
            pincode = component.long_name;
          }
        });

        const locationData: LocationData = {
          address: result.formatted_address || '',
          city,
          state,
          country,
          pincode,
          latitude: lat.toString(),
          longitude: lng.toString()
        };

        setCurrentLocation(locationData);
        onLocationChange(locationData);
      }
    });
  };

  return (
    <LoadScript
      googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}
      libraries={libraries}
    >
      <div className="space-y-4">
        {isEditing && (
          <div>
            <label className="block text-sm font-medium mb-2">Search Location</label>
            <Autocomplete
              onLoad={onAutocompleteLoad}
              onPlaceChanged={onPlaceChanged}
              restrictions={{ country: 'IN' }}
            >
              <input
                type="text"
                placeholder="Search for a location..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="w-full p-2 border rounded-lg"
              />
            </Autocomplete>
          </div>
        )}
        
        <div>
          <label className="block text-sm font-medium mb-2">
            Location on Map {isEditing && <span className="text-xs text-gray-500">(Click or drag marker to update)</span>}
          </label>
          <div className="border rounded-lg overflow-hidden">
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              center={center}
              zoom={15}
              onLoad={onLoad}
              onUnmount={onUnmount}
              onClick={onMapClick}
              options={{
                mapTypeControl: false,
                streetViewControl: false,
                fullscreenControl: false,
              }}
            >
              <Marker
                position={center}
                draggable={isEditing}
                onDragEnd={onMarkerDragEnd}
                title="Restaurant Location"
              />
            </GoogleMap>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Address</label>
            {isEditing ? (
              <textarea
                value={currentLocation.address}
                onChange={(e) => {
                  const updated = { ...currentLocation, address: e.target.value };
                  setCurrentLocation(updated);
                  onLocationChange(updated);
                }}
                className="w-full p-2 border rounded"
                rows={2}
              />
            ) : (
              <p className="p-2 bg-gray-50 rounded">{currentLocation.address}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">City</label>
            <p className="p-2 bg-gray-50 rounded">{currentLocation.city}</p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">State</label>
            <p className="p-2 bg-gray-50 rounded">{currentLocation.state}</p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Country</label>
            <p className="p-2 bg-gray-50 rounded">{currentLocation.country}</p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Pincode</label>
            <p className="p-2 bg-gray-50 rounded">{currentLocation.pincode}</p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Coordinates</label>
            <p className="p-2 bg-gray-50 rounded text-xs">
              {currentLocation.latitude}, {currentLocation.longitude}
            </p>
          </div>
        </div>
      </div>
    </LoadScript>
  );
}