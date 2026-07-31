import { createImageMarker } from "@/lib/maputil";
import { handleMapsError, installMapsAuthFailureHandler } from "@/lib/maps";
import { Coords } from "@/types/geo";
import { Loader } from "@googlemaps/js-api-loader";
import React, { useEffect, useRef } from "react";

interface SummaryMapProps {
  guessLocation?: Coords;
  otherGuesses?: Coords[];
  targetLocation: Coords;
  center?: Coords;
  zoom?: number;
}

const SummaryMap: React.FC<SummaryMapProps> = ({
  guessLocation,
  otherGuesses,
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
  const otherMarkerRefs = useRef<google.maps.marker.AdvancedMarkerElement[]>(
    []
  );

  const markerLibraryRef = useRef<google.maps.MarkerLibrary | null>(null);
  const lineRef = useRef<google.maps.Polyline[]>([]);

  useEffect(() => {
    const initMap = async () => {
      installMapsAuthFailureHandler();

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

      targetMarkerRef.current = new AdvancedMarkerElement({
        map,
        position: targetLocation,
        content: createImageMarker("/icons/marker-target.png", "Actual location"),
      });

      if (guessLocation) {
        guessMarkerRef.current = new AdvancedMarkerElement({
          map,
          position: guessLocation,
          content: createImageMarker("/icons/marker-guess.png", "Your guess"),
        });

        lineRef.current = [];
        lineRef.current.push(
          new google.maps.Polyline({
            path: [guessLocation, targetLocation],
            strokeColor: "#121212",
            strokeOpacity: 0.5,
            strokeWeight: 4,
            map,
            clickable: false,
          })
        );
      }

      otherMarkerRefs.current = [];
      otherGuesses?.forEach((position) => {
        otherMarkerRefs.current?.push(
          new AdvancedMarkerElement({
            map,
            position,
            content: createImageMarker(
              "/icons/marker-opponent.png",
              "Opponent's guess"
            ),
          })
        );
        lineRef.current.push(
          new google.maps.Polyline({
            path: [position, targetLocation],
            strokeColor: "#121212",
            strokeOpacity: 0.5,
            strokeWeight: 4,
            map,
            clickable: false,
          })
        );
      });
    };

    initMap().catch(() => handleMapsError());
  }, [center, zoom, guessLocation, targetLocation]);

  return <div ref={mapRef} style={{ width: "100%", height: "100%" }} />;
};

export default SummaryMap;
