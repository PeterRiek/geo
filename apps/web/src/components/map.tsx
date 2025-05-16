import { Coords } from "@/types/geo";
import { Loader } from "@googlemaps/js-api-loader";
import React, { useEffect, useRef } from "react";

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
  const mapInstanceRef = useRef<google.maps.Map>(null);
  const clickMarkerRef = useRef<google.maps.marker.AdvancedMarkerElement>(null);
  const targetMarkerRef =
    useRef<google.maps.marker.AdvancedMarkerElement>(null);
  const markerLibraryRef = useRef<google.maps.MarkerLibrary>(null);

  const setMarker = (position: Coords) => {
    if (!mapInstanceRef.current || !markerLibraryRef.current) return;

    const { AdvancedMarkerElement } = markerLibraryRef.current;

    if (clickMarkerRef.current) {
      clickMarkerRef.current.position = position;
      clickMarkerRef.current.map = mapInstanceRef.current;
    } else {
      clickMarkerRef.current = new AdvancedMarkerElement({
        map: mapInstanceRef.current,
        position: position,
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
      markerLibraryRef.current = (await loader.importLibrary(
        "marker"
      )) as google.maps.MarkerLibrary;

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

      if (guessLocation) setMarker(guessLocation);

      map.addListener("click", (e: google.maps.MapMouseEvent) => {
        if (mapClicksDisabled) return;
        if (e.latLng) {
          const position = {
            lat: e.latLng.lat(),
            lng: e.latLng.lng(),
          };
          onMapClick?.(position);
          setMarker(position);
        }
      });

      map.addListener("zoom_changed", () => {
        const currentZoom = map.getZoom();
        if (typeof currentZoom === "number") {
          onZoomChange?.(currentZoom);
        }
      });

      map.addListener("center_changed", () => {
        const currentCenter = map.getCenter();
        if (currentCenter) {
          onCenterChange?.({
            lat: currentCenter.lat(),
            lng: currentCenter.lng(),
          });
        }
      });
    };

    initMap();
  }, []);

  useEffect(() => {
    if (!mapInstanceRef.current || !markerLibraryRef.current || !guessLocation)
      return;
    setMarker(guessLocation);
  }, [guessLocation]);

  // Handle showTarget updates
  useEffect(() => {
    if (!mapInstanceRef.current || !markerLibraryRef.current) return;

    const { AdvancedMarkerElement } = markerLibraryRef.current;

    if (targetVisible && targetLocation) {
      if (targetMarkerRef.current) {
        targetMarkerRef.current.position = targetLocation;
        targetMarkerRef.current.map = mapInstanceRef.current;
      } else {
        targetMarkerRef.current = new AdvancedMarkerElement({
          map: mapInstanceRef.current,
          position: targetLocation,
          content: null,
        });
      }
    } else if (targetMarkerRef.current) {
      // Remove marker from map
      targetMarkerRef.current.map = null;
    }
  }, [targetVisible, targetLocation]);

  return <div ref={mapRef} style={{ width: "100%", height: "100%" }} />;
};

export default Map;
