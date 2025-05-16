"use client";
import { Loader } from "@googlemaps/js-api-loader";
import { useEffect, useRef, useState } from "react";

const StreetViewPano = ({
  location,
}: {
  location: { lat: number; lng: number };
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [heading, setHeading] = useState(0);

  useEffect(() => {
    const loader = new Loader({
      apiKey: process.env.NEXT_PUBLIC_MAPS_KEY!,
      version: "weekly",
    });

    loader.load().then(() => {
      const panorama = new google.maps.StreetViewPanorama(
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
          clickToGo: false,
          motionTrackingControl: false,
          motionTracking: false,
        }
      );

      panorama.addListener("pov_changed", () => {
        const pov = panorama.getPov();
        setHeading(pov.heading);
      });
    });
  }, [location]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      {/* Panorama container */}
      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />

      {/* Compass overlay */}
      <div
        style={{
          position: "absolute",
          top: 20,
          right: 20,
          width: 40,
          height: 40,
          borderRadius: "50%",
          border: "2px solid #fff",
          backgroundColor: "rgba(0,0,0,0.5)",
          transform: `rotate(${-heading}deg)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#fff",
          fontSize: "12px",
          fontWeight: "bold",
          zIndex: 20,
        }}
      >
        ↑
      </div>
    </div>
  );
};

export default StreetViewPano;
