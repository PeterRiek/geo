import { createImageMarker } from "@/lib/maputil";
import { handleMapsError, installMapsAuthFailureHandler } from "@/lib/maps";
import { Coords } from "@/types/geo";
import { Loader } from "@googlemaps/js-api-loader";
import React, { useEffect, useRef } from "react";

interface SummaryMapProps {
  guessLocation?: Coords;
  // A timed-out player's guess comes through as null (server-side "no
  // guess" marker), so callers may pass that straight through un-filtered.
  otherGuesses?: (Coords | null | undefined)[];
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
    // Guards a superseded run's rejection from firing handleMapsError() after
    // a newer effect run (e.g. rapid round changes) already succeeded.
    let cancelled = false;

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
        mapId: "geo.riek.me MAP",
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
        if (!position) return;
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

    initMap().catch(() => {
      if (!cancelled) handleMapsError();
    });

    return () => {
      cancelled = true;
    };
    // Depend on primitive lat/lng values, not the center/guessLocation/targetLocation
    // objects themselves — callers (e.g. round-result-view) recompute those as new
    // object literals on every render, which would otherwise tear down and rebuild
    // the whole map on any unrelated parent re-render.
    // otherGuesses is excluded for the same reason (new array literal every render).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [center?.lat, center?.lng, zoom, guessLocation?.lat, guessLocation?.lng, targetLocation.lat, targetLocation.lng]);

  return <div ref={mapRef} style={{ width: "100%", height: "100%" }} />;
};

export default SummaryMap;
