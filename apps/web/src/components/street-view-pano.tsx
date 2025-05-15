"use client";
import { Loader } from "@googlemaps/js-api-loader";
import { useEffect, useRef } from "react";

const StreetViewPano = ({
  location,
}: {
  location: { lat: number; lng: number };
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loader = new Loader({
      apiKey: process.env.NEXT_PUBLIC_MAPS_KEY!,
      version: "weekly",
    });

    loader.load().then(() => {
      new google.maps.StreetViewPanorama(
        containerRef.current as HTMLDivElement,
        {
          position: location,
          pov: {
            heading: 34,
            pitch: 10,
          },
          zoom: 1,
          disableDefaultUI: true,
          showRoadLabels: false,
          panControl: false,
          clickToGo: false
        }
      );
    });
  }, [location]);

  return <div ref={containerRef} style={{ width: "100%", height: "100%" }} />;
};

export default StreetViewPano;
