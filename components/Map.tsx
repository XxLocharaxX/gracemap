"use client";

import React, { useMemo, useState, useEffect, useRef } from 'react';
import Map, { Marker, NavigationControl, GeolocateControl, MapRef } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useMapStore } from '../store/useMapStore';
import { useAddRequestStore } from '../store/useAddRequestStore';
import { useI18nStore } from '../store/useI18nStore';
import useSupercluster from 'use-supercluster';

import { UrgentIcon, ProjectIcon, PrayerIcon } from './Icons';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Church } from 'lucide-react';

// По умолчанию центрируем между Европой и РФ
const INITIAL_VIEW_STATE = {
  longitude: 37.6156, // Долгота Москвы (сдвинул ближе к РФ)
  latitude: 55.7522,  // Широта Москвы
  zoom: 4,
  pitch: 0,
  bearing: 0
};

export const MapComponent = () => {
  const { requests, activeFilters, setSelectedRequest, fetchRequests } = useMapStore();
  const { isAdding, step, tempLocation, setTempLocation } = useAddRequestStore();
  const { t } = useI18nStore();
  const [isLoaded, setIsLoaded] = useState(false);
  const [clusterState, setClusterState] = useState<{bounds: [number, number, number, number] | undefined, zoom: number}>({
    bounds: undefined,
    zoom: INITIAL_VIEW_STATE.zoom
  });
  const mapRef = useRef<MapRef>(null);

  useEffect(() => {
    fetchRequests();
    const timer = setTimeout(() => setIsLoaded(true), 1200);
    return () => clearTimeout(timer);
  }, [fetchRequests]);

  const throttleTimeout = useRef<NodeJS.Timeout | null>(null);

  const handleMove = () => {
    if (throttleTimeout.current) return;
    throttleTimeout.current = setTimeout(() => {
      if (mapRef.current) {
        const map = mapRef.current.getMap();
        const bounds = map.getBounds();
        setClusterState({
          bounds: bounds.toArray().flat() as [number, number, number, number],
          zoom: map.getZoom()
        });
      }
      throttleTimeout.current = null;
    }, 100); // 10fps for cluster recalculations
  };

  const handleMoveEnd = () => {
    if (mapRef.current) {
      const map = mapRef.current.getMap();
      const bounds = map.getBounds();
      setClusterState({
        bounds: bounds.toArray().flat() as [number, number, number, number],
        zoom: map.getZoom()
      });
      fetchRequests({
        minLng: bounds.getWest(),
        maxLng: bounds.getEast(),
        minLat: bounds.getSouth(),
        maxLat: bounds.getNorth()
      });
    }
  };

  const handleMapLoad = () => {
    if (mapRef.current) {
      const map = mapRef.current.getMap();
      const bounds = map.getBounds();
      setClusterState({
        bounds: bounds.toArray().flat() as [number, number, number, number],
        zoom: map.getZoom()
      });
    }
  };

  useEffect(() => {
    if (isAdding && step === 3 && !tempLocation && mapRef.current) {
      const center = mapRef.current.getMap().getCenter();
      setTempLocation([center.lng, center.lat]);
    }
  }, [isAdding, step, tempLocation, setTempLocation]);

  const filteredRequests = useMemo(() => {
    return requests.filter(req => activeFilters[req.type]);
  }, [activeFilters, requests]);

  const points = useMemo(() => {
    return filteredRequests.map(req => ({
      type: "Feature" as const,
      properties: { cluster: false, request: req },
      geometry: { type: "Point" as const, coordinates: req.location }
    }));
  }, [filteredRequests]);

  const { clusters, supercluster } = useSupercluster({
    points,
    bounds: clusterState.bounds ? [-180, -85, 180, 85] : undefined,
    zoom: clusterState.zoom,
    options: { radius: 75, maxZoom: 14 }
  });

  const getMarkerColor = (type: string) => {
    switch(type) {
      case 'urgent': return 'var(--urgent)';
      case 'project': return 'var(--project)';
      case 'prayer': return 'var(--prayer)';
      default: return 'var(--grace-ink)';
    }
  };

  const getMarkerIcon = (type: string) => {
    switch(type) {
      case 'urgent': return <UrgentIcon className="w-5 h-5 text-white" />;
      case 'project': return <Church className="w-5 h-5 text-white" strokeWidth={2.5} />;
      case 'prayer': return <PrayerIcon className="w-5 h-5 text-white" />;
      default: return null;
    }
  };

  return (
    <main className="relative w-full h-screen overflow-hidden bg-[var(--grace-ivory)]">
      <Map
        ref={mapRef}
        initialViewState={INITIAL_VIEW_STATE}
        onLoad={handleMapLoad}
        onMove={handleMove}
        onMoveEnd={handleMoveEnd}
        mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
        style={{ width: '100%', height: '100%' }}
        minZoom={1.5}
        maxZoom={18}
        renderWorldCopies={false}
      >
        <NavigationControl position="bottom-right" showCompass={false} />
        <GeolocateControl 
          position="bottom-right" 
          positionOptions={{ enableHighAccuracy: true }}
          trackUserLocation={true}
        />
        
        <AnimatePresence>
          {isLoaded && !(isAdding && step === 3) && clusters.map((cluster) => {
            const [longitude, latitude] = cluster.geometry.coordinates;
            const { cluster: isCluster, request } = cluster.properties;
            const pointCount = (cluster.properties as any).point_count;

            if (isCluster) {
              return (
                <Marker
                  key={`cluster-${cluster.id}`}
                  longitude={longitude}
                  latitude={latitude}
                  onClick={e => {
                    e.originalEvent.stopPropagation();
                    if (!supercluster) return;
                    const expansionZoom = Math.min(supercluster.getClusterExpansionZoom(cluster.id as number), 18);
                    mapRef.current?.flyTo({
                      center: [longitude, latitude],
                      zoom: expansionZoom,
                      duration: 500
                    });
                  }}
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-[var(--grace-ink)] font-bold shadow-lg border-2 border-[var(--grace-stone)] cursor-pointer drop-shadow-md transition-transform hover:scale-110"
                  >
                    {pointCount}
                  </motion.div>
                </Marker>
              );
            }

            return (
              <Marker
                key={request.id}
                longitude={longitude}
                latitude={latitude}
                anchor="bottom"
                onClick={e => {
                  e.originalEvent.stopPropagation();
                  setSelectedRequest(request);
                }}
              >
                <motion.div
                  initial={{ scale: 0, opacity: 0, y: 10 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.9 }}
                  className="cursor-pointer group flex flex-col items-center drop-shadow-md"
                >
                  <div className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg relative z-10" style={{ backgroundColor: getMarkerColor(request.type) }}>
                    {getMarkerIcon(request.type)}
                  </div>
                  <div className="w-3 h-3 rotate-45 -mt-2 z-0" style={{ backgroundColor: getMarkerColor(request.type) }} />
                </motion.div>
              </Marker>
            );
          })}
        </AnimatePresence>

        {/* Драгабельный маркер для нового запроса */}
        {isAdding && step === 3 && tempLocation && (
          <Marker
            longitude={tempLocation[0]}
            latitude={tempLocation[1]}
            anchor="bottom"
            draggable
            onDragStart={() => {
              if (document.activeElement instanceof HTMLElement) {
                document.activeElement.blur();
              }
            }}
            onDragEnd={e => setTempLocation([e.lngLat.lng, e.lngLat.lat])}
          >
            <motion.div
              initial={{ scale: 0, y: -20 }}
              animate={{ scale: 1, y: 0 }}
              className="cursor-grab active:cursor-grabbing group flex flex-col items-center drop-shadow-2xl"
            >
              <div className="w-12 h-12 rounded-full flex items-center justify-center shadow-xl relative z-10 bg-[var(--grace-ink)]">
                <div className="w-4 h-4 bg-white rounded-full animate-pulse" />
              </div>
              <div className="w-4 h-4 rotate-45 -mt-2 z-0 bg-[var(--grace-ink)]" />
            </motion.div>
          </Marker>
        )}
      </Map>
    </main>
  );
};

