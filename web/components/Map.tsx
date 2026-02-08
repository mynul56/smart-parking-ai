'use client';

import { GoogleMap, LoadScript, Marker, InfoWindow } from '@react-google-maps/api';
import { useState, useMemo } from 'react';

const containerStyle = {
  width: '100%',
  height: '500px'
};

const center = {
  lat: 37.7749,
  lng: -122.4194
};

interface MapProps {
  lots: any[];
}

export default function Map({ lots }: MapProps) {
  const [selectedLot, setSelectedLot] = useState<any>(null);

  const mapOptions = useMemo(() => ({
    disableDefaultUI: false,
    clickableIcons: false,
    scrollwheel: true,
  }), []);


  return (
    <div className="w-full h-[50vh] min-h-[400px] rounded-lg overflow-hidden border border-gray-200">
      <LoadScript googleMapsApiKey="AIzaSyBd4GdRQa_1iflQwfQex6BGzZL6MRxShVU">
        <GoogleMap
          mapContainerStyle={{ width: '100%', height: '100%' }}
          center={center}
          zoom={12}
          options={mapOptions}
        >
          {lots.map((lot) => (
            <Marker
              key={lot._id}
              position={{
                lat: lot.location.coordinates[1],
                lng: lot.location.coordinates[0]
              }}
              onClick={() => setSelectedLot(lot)}
              icon={{
                url: lot.availableSlots > 0
                  ? 'http://maps.google.com/mapfiles/ms/icons/green-dot.png'
                  : 'http://maps.google.com/mapfiles/ms/icons/red-dot.png'
              }}
            />
          ))}

          {selectedLot && (
            <InfoWindow
              position={{
                lat: selectedLot.location.coordinates[1],
                lng: selectedLot.location.coordinates[0]
              }}
              onCloseClick={() => setSelectedLot(null)}
            >
              <div className="p-2 min-w-[200px]">
                <h3 className="font-bold text-lg mb-1">{selectedLot.name}</h3>
                <p className="text-sm text-gray-600 mb-2">{selectedLot.address}</p>
                <div className="flex justify-between items-center bg-gray-50 p-2 rounded">
                  <span className="text-sm font-medium">Available:</span>
                  <span className={`font-bold ${selectedLot.availableSlots > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                    {selectedLot.availableSlots} / {selectedLot.totalSlots}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Rate: ${selectedLot.pricing?.hourlyRate}/hr
                </p>
              </div>
            </InfoWindow>
          )}
        </GoogleMap>
      </LoadScript>
    </div>
  );
}
