"use client";

import { createImageMarker } from "@/lib/maputil";
import { handleMapsError, installMapsAuthFailureHandler } from "@/lib/maps";
import { Coords } from "@/types/geo";
import { Loader } from "@googlemaps/js-api-loader";
import React, { useEffect, useRef } from "react";

interface FullTripMapProps {
  allTargets: Coords[];
  allGuesses: { [username: string]: Coords | null }[];
  username: string;
}

/** Shows every round's target and every player's guess for the whole session on one map. */
const FullTripMap: React.FC<FullTripMapProps> = ({ allTargets, allGuesses, username }) => {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;

    const initMap = async () => {
      installMapsAuthFailureHandler();

      const loader = new Loader({
        apiKey: process.env.NEXT_PUBLIC_MAPS_KEY!,
        version: "weekly",
      });

      const { Map } = await loader.importLibrary("maps");
      const { AdvancedMarkerElement } = (await loader.importLibrary(
        "marker"
      )) as google.maps.MarkerLibrary;

      if (cancelled) return;

      const map = new Map(mapRef.current as HTMLDivElement, {
        mapId: "geo.riek.me MAP",
        disableDefaultUI: true,
        gestureHandling: "greedy",
        clickableIcons: false,
      });

      const bounds = new google.maps.LatLngBounds();

      allTargets.forEach((target, roundIndex) => {
        bounds.extend(target);
        new AdvancedMarkerElement({
          map,
          position: target,
          content: createImageMarker("/icons/marker-target.png", `Round ${roundIndex + 1} location`),
        });

        const guesses = allGuesses[roundIndex] ?? {};
        Object.entries(guesses).forEach(([player, guess]) => {
          if (!guess) return;
          bounds.extend(guess);

          new AdvancedMarkerElement({
            map,
            position: guess,
            content: createImageMarker(
              player === username ? "/icons/marker-guess.png" : "/icons/marker-opponent.png",
              `${player}'s guess`
            ),
          });

          new google.maps.Polyline({
            path: [guess, target],
            strokeColor: "#121212",
            strokeOpacity: 0.35,
            strokeWeight: 2,
            map,
            clickable: false,
          });
        });
      });

      if (!bounds.isEmpty()) {
        map.fitBounds(bounds, 40);
      }
    };

    initMap().catch(() => {
      if (!cancelled) handleMapsError();
    });

    return () => {
      cancelled = true;
    };
    // allTargets/allGuesses are stable for the lifetime of a finished game's
    // summary (no more broadcasts arrive once GAME_RESULTS is reached), so
    // reference identity here is safe to depend on directly.
  }, [allTargets, allGuesses, username]);

  return <div ref={mapRef} style={{ width: "100%", height: "100%" }} />;
};

export default FullTripMap;
