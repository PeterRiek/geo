import { createImageMarker } from "@/lib/maputil";
import { Coords } from "@/types/geo";
import { Loader } from "@googlemaps/js-api-loader";
import React, { useEffect, useRef, useState } from "react";

interface MapProps {
  onMapClick?: (c: Coords) => void;
  guessLocation?: Coords;
  mapClicksDisabled?: boolean;
  targetLocation?: Coords;
  targetVisible?: boolean;
  zoom?: number;
  onZoomChange?: (zoom: number) => void;
  center?: Coords;
  onCenterChange?: (center: Coords) => void;
}

const Map: React.FC<MapProps> = ({
  onMapClick,
  guessLocation,
  mapClicksDisabled,
  targetLocation,
  targetVisible,
  zoom,
  onZoomChange,
  center,
  onCenterChange,
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const clickMarkerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);
  const targetMarkerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);
  const markerLibraryRef = useRef<google.maps.MarkerLibrary | null>(null);

  const [mapReady, setMapReady] = useState(false);

  const setClickMarker = (position: Coords) => {
    if (!mapInstanceRef.current || !markerLibraryRef.current) return;

    const { AdvancedMarkerElement } = markerLibraryRef.current;

    if (clickMarkerRef.current) {
      clickMarkerRef.current.position = position;
      clickMarkerRef.current.map = mapInstanceRef.current;
    } else {
      clickMarkerRef.current = new AdvancedMarkerElement({
        map: mapInstanceRef.current,
        position,
        content: createImageMarker("/icons/marker-guess.png", "marker-guess"),
      });
    }
  };

  useEffect(() => {
    const initMap = async () => {
      const loader = new Loader({
        apiKey: process.env.NEXT_PUBLIC_MAPS_KEY!,
        version: "weekly",
      });

      const { Map } = await loader.importLibrary("maps");
      markerLibraryRef.current = await loader.importLibrary("marker") as google.maps.MarkerLibrary;

      const mapOptions: google.maps.MapOptions = {
        center: center ?? { lat: 0, lng: 0 },
        zoom: zoom ?? 1,
        mapId: "GeoGuessr-Clone MAP",
        disableDefaultUI: true,
        gestureHandling: "greedy",
        clickableIcons: false,
        draggableCursor: "crosshair",
      };

      const map = new Map(mapRef.current as HTMLDivElement, mapOptions);
      mapInstanceRef.current = map;
      setMapReady(true);
    };

    initMap();
  }, []);

  // Dynamic map click listener
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current) return;

    const map = mapInstanceRef.current;

    const handleClick = (e: google.maps.MapMouseEvent) => {
      if (mapClicksDisabled) return;
      if (e.latLng) {
        const position = {
          lat: e.latLng.lat(),
          lng: e.latLng.lng(),
        };
        onMapClick?.(position);
        setClickMarker(position);
      }
    };

    const listener = map.addListener("click", handleClick);
    return () => {
      google.maps.event.removeListener(listener);
    };
  }, [mapClicksDisabled, onMapClick, mapReady]);

  // Set click marker if guessLocation changes
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current || !guessLocation) return;
    setClickMarker(guessLocation);
  }, [guessLocation, mapReady]);

  // Show or hide target marker
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current || !markerLibraryRef.current) return;

    const { AdvancedMarkerElement } = markerLibraryRef.current;

    if (targetVisible && targetLocation) {
      if (targetMarkerRef.current) {
        targetMarkerRef.current.position = targetLocation;
        targetMarkerRef.current.map = mapInstanceRef.current;
      } else {
        targetMarkerRef.current = new AdvancedMarkerElement({
          map: mapInstanceRef.current,
          position: targetLocation,
          content: createImageMarker("/icons/marker-target.png", "marker-target"),
        });
      }
    } else if (targetMarkerRef.current) {
      targetMarkerRef.current.map = null;
    }
  }, [targetVisible, targetLocation, mapReady]);

  // Zoom change listener
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current) return;

    const map = mapInstanceRef.current;

    const listener = map.addListener("zoom_changed", () => {
      const currentZoom = map.getZoom();
      if (typeof currentZoom === "number") {
        onZoomChange?.(currentZoom);
      }
    });

    return () => {
      google.maps.event.removeListener(listener);
    };
  }, [onZoomChange, mapReady]);

  // Center change listener
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current) return;

    const map = mapInstanceRef.current;

    const listener = map.addListener("center_changed", () => {
      const center = map.getCenter();
      if (center) {
        onCenterChange?.({ lat: center.lat(), lng: center.lng() });
      }
    });

    return () => {
      google.maps.event.removeListener(listener);
    };
  }, [onCenterChange, mapReady]);

  return <div ref={mapRef} style={{ width: "100%", height: "100%" }} />;
};

export default Map;
