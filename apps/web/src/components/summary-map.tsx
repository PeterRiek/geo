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
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const guessMarkerRef =
    useRef<google.maps.marker.AdvancedMarkerElement | null>(null);
  const targetMarkerRef =
    useRef<google.maps.marker.AdvancedMarkerElement | null>(null);
  const markerLibraryRef = useRef<google.maps.MarkerLibrary | null>(null);
  const lineRef = useRef<google.maps.Polyline | null>(null);

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

      // Target Marker with Custom Icon
      targetMarkerRef.current = new AdvancedMarkerElement({
        map,
        position: targetLocation,
        // content: createImageMarker(
        //   "/icons/dest.png",
        //   "target_marker"
        // ),
        // content: createCustomMarker("🎯"), // Custom emoji/icon
      });

      // Guess Marker with Custom Icon
      guessMarkerRef.current = new AdvancedMarkerElement({
        map,
        position: guessLocation,
        // content: createCustomMarker("📍"),
      });

      // Draw a line between guess and target
      lineRef.current = new google.maps.Polyline({
        path: [guessLocation, targetLocation],
        strokeColor: "#121212",
        strokeOpacity: 0.5,
        strokeWeight: 4,
        map,
        clickable: false,
      });
    };

    initMap();
  }, [center, zoom, guessLocation, targetLocation]);

  // const createCustomMarker = (icon: string): HTMLElement => {
  //   const markerDiv = document.createElement("div");
  //   markerDiv.style.fontSize = "24px";
  //   markerDiv.style.lineHeight = "1";
  //   markerDiv.textContent = icon;
  //   return markerDiv;
  // };

  // const createImageMarker = (src: string, alt: string): HTMLElement => {
  //   const img = document.createElement("img");
  //   img.src = src;
  //   img.alt = alt;
  //   img.style.width = "32px";
  //   img.style.height = "32px";
  //   // img.style.transform = "translate(-50%, -100%)"; // Center bottom point
  //   return img;
  // };

  return <div ref={mapRef} style={{ width: "100%", height: "100%" }} />;
};

export default SummaryMap;
