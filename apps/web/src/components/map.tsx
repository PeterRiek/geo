import { Loader } from "@googlemaps/js-api-loader";
import React, { useEffect, useRef } from "react";

interface MapProps {
  onMapClick?: ({ lat, lng }: { lat: number; lng: number }) => void;
  allowClicks?: boolean;
  targetPosition?: { lat: number; lng: number };
  showTarget?: boolean;
}

const Map: React.FC<MapProps> = ({
  onMapClick,
  allowClicks,
  targetPosition,
  showTarget,
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map>(null);
  const clickMarkerRef = useRef<google.maps.marker.AdvancedMarkerElement>(null);
  const targetMarkerRef =
    useRef<google.maps.marker.AdvancedMarkerElement>(null);
  const markerLibraryRef = useRef<google.maps.MarkerLibrary>(null);

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
      const { AdvancedMarkerElement } = markerLibraryRef.current;

      const mapCenter = { lat: 0, lng: 0 };

      const mapOptions: google.maps.MapOptions = {
        center: mapCenter,
        zoom: 2,
        mapId: "GeoGuessr-Clone MAP",
        disableDefaultUI: true,
        gestureHandling: "greedy",
      };

      const map = new Map(mapRef.current as HTMLDivElement, mapOptions);
      mapInstanceRef.current = map;

      map.addListener("click", (e: google.maps.MapMouseEvent) => {
        if (!allowClicks) return;
        if (e.latLng) {
          const position = {
            lat: e.latLng.lat(),
            lng: e.latLng.lng(),
          };

          onMapClick?.(position);

          if (clickMarkerRef.current) {
            clickMarkerRef.current.position = position;
          } else {
            clickMarkerRef.current = new AdvancedMarkerElement({
              map,
              position,
            });
          }
        }
      });
    };

    initMap();
  }, []);

  // Handle showTarget updates
  useEffect(() => {
    if (!mapInstanceRef.current || !markerLibraryRef.current) return;

    const { AdvancedMarkerElement } = markerLibraryRef.current;

    if (showTarget && targetPosition) {
      console.log("show target")
      if (targetMarkerRef.current) {
        targetMarkerRef.current.position = targetPosition;
        targetMarkerRef.current.map = mapInstanceRef.current;
      } else {
        targetMarkerRef.current = new AdvancedMarkerElement({
          map: mapInstanceRef.current,
          position: targetPosition,
          content:null
        });
      }
    } else if (targetMarkerRef.current) {
      // Remove marker from map
      targetMarkerRef.current.map = null;
    }
  }, [showTarget, targetPosition]);

  return <div ref={mapRef} style={{ width: "100%", height: "100%" }} />;
};

export default Map;
