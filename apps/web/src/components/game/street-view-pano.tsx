"use client";
import { Coords } from "@/types/geo";
import { handleMapsError, installMapsAuthFailureHandler } from "@/lib/maps";
import { Loader } from "@googlemaps/js-api-loader";
import React, { useEffect, useRef, useState } from "react";

interface StreetViewPanoProps {
  location: Coords;
  moveEnabled?: boolean;
  zoomEnabled?: boolean;
  panEnabled?: boolean;
}

const StreetViewPano: React.FC<StreetViewPanoProps> = ({
  location,
  moveEnabled,
  zoomEnabled,
  panEnabled,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState(0);
  const prevHeadingRef = useRef(34);
  const rotationRef = useRef(0);

  useEffect(() => {
    installMapsAuthFailureHandler();

    const loader = new Loader({
      apiKey: process.env.NEXT_PUBLIC_MAPS_KEY!,
      version: "weekly",
    });

    loader
      .load()
      .then(() => {
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
            clickToGo: moveEnabled ?? true,
            scrollwheel: zoomEnabled ?? true,
            disableDoubleClickZoom: zoomEnabled === false,
            motionTrackingControl: false,
            motionTracking: false,
          }
        );

        panorama.addListener("pov_changed", () => {
          const pov = panorama.getPov();
          let delta = pov.heading - prevHeadingRef.current;
          delta = ((delta + 180) % 360 + 360) % 360 - 180;
          rotationRef.current += delta;
          prevHeadingRef.current = pov.heading;
          setRotation(rotationRef.current);
        });

        panorama.addListener("status_changed", () => {
          if (panorama.getStatus() !== google.maps.StreetViewStatus.OK) {
            handleMapsError();
          }
        });
      })
      .catch(() => {
        handleMapsError();
      });
  }, [location, moveEnabled, zoomEnabled]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", pointerEvents: panEnabled ? "auto":"none" }}>
      {/* {!panEnabled && <div style={{position:"absolute", width:"100%", height:"100%"}}/>} */}
      {/* Panorama container */}
      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />

      {/* Compass overlay */}
      <div
        style={{
          position: "absolute",
          top: 20,
          right: 20,
          width: 56,
          height: 56,
          zIndex: 20,
          filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.45))",
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            borderRadius: "50%",
            border: "1px solid rgba(255,255,255,0.35)",
            background:
              "radial-gradient(circle at 35% 30%, rgba(60,60,65,0.75), rgba(15,15,20,0.65) 70%)",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
            transform: `rotate(${-rotation}deg)`,
            transition: "transform 0.12s linear",
            position: "relative",
          }}
        >
          <svg
            viewBox="0 0 100 100"
            style={{ width: "100%", height: "100%", position: "absolute", inset: 0 }}
          >
            {/* tick marks */}
            {Array.from({ length: 16 }).map((_, i) => {
              const angle = (i * 360) / 16;
              const isCardinal = i % 4 === 0;
              const outer = 45;
              const inner = isCardinal ? 36 : 40;
              const rad = (angle * Math.PI) / 180;
              const x1 = 50 + outer * Math.sin(rad);
              const y1 = 50 - outer * Math.cos(rad);
              const x2 = 50 + inner * Math.sin(rad);
              const y2 = 50 - inner * Math.cos(rad);
              return (
                <line
                  key={i}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="rgba(255,255,255,0.55)"
                  strokeWidth={isCardinal ? 2 : 1}
                />
              );
            })}

            {/* needle */}
            <polygon points="50,12 43,50 50,44 57,50" fill="#e53e3e" />
            <polygon points="50,88 43,50 50,56 57,50" fill="#f5f5f5" />
            <circle cx="50" cy="50" r="4" fill="#f5f5f5" stroke="rgba(0,0,0,0.3)" strokeWidth="1" />

            {/* cardinal labels */}
            <text x="50" y="24" textAnchor="middle" fontSize="12" fontWeight="700" fill="#e53e3e">
              N
            </text>
            <text x="82" y="54" textAnchor="middle" fontSize="9" fontWeight="600" fill="#f5f5f5">
              E
            </text>
            <text x="50" y="84" textAnchor="middle" fontSize="9" fontWeight="600" fill="#f5f5f5">
              S
            </text>
            <text x="18" y="54" textAnchor="middle" fontSize="9" fontWeight="600" fill="#f5f5f5">
              W
            </text>
          </svg>
        </div>
      </div>
    </div>
  );
};

export default StreetViewPano;
