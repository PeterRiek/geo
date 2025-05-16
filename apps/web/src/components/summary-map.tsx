import { Coords } from "@/types/geo";
import { Loader } from "@googlemaps/js-api-loader";
import React, { useEffect, useRef } from "react";

interface SummaryMapProps {
  guessLocation: Coords;
  targetLocation: Coords;
  center?: Coords;
  zoom?: number;
}

const SummaryMap: React.FC<SummaryMapProps> = ({
  guessLocation,
  targetLocation,
  center,
  zoom,
}) => {
  console.log(center, zoom);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map>(null);
  const guessMartkerRef =
    useRef<google.maps.marker.AdvancedMarkerElement>(null);
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

      const { AdvancedMarkerElement } = markerLibraryRef.current;

      // Show Target
      targetMarkerRef.current = new AdvancedMarkerElement({
        map: mapInstanceRef.current,
        position: targetLocation,
        content: null,
      });

      // Show Guess
      guessMartkerRef.current = new AdvancedMarkerElement({
        map: mapInstanceRef.current,
        position: guessLocation,
        content: null,
      });
    };

    initMap();
  }, [center, zoom, guessLocation, targetLocation]);

  return <div ref={mapRef} style={{ width: "100%", height: "100%" }} />;
};

export default SummaryMap;
