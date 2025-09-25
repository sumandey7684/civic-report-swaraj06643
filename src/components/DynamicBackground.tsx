import React from "react";
import "./DynamicBackground.css";

const DynamicBackground: React.FC = () => {
  return (
    <div className="parallax-bg">
      {/* Sky Layer */}
      <div className="sky-layer" />
      {/* Parallax SVG Road Scene */}
      <svg
        className="road-svg"
        viewBox="0 0 1440 600"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid slice"
      >
        {/* Perspective Road (trapezoid for 3D effect) */}
        <polygon
          points="440,600 1000,600 1200,400 240,400"
          fill="#222"
          filter="url(#roadShadow)"
        />
        <defs>
          <filter id="roadShadow" x="0" y="390" width="1440" height="210">
            <feDropShadow
              dx="0"
              dy="-10"
              stdDeviation="10"
              flood-color="#111"
              flood-opacity="0.5"
            />
          </filter>
        </defs>
        {/* Road stripes (perspective) */}
        {[0, 1, 2, 3, 4].map((i) => {
          const y = 500 - i * 40;
          const w = 60 - i * 8;
          const x = 720 - w / 2;
          return (
            <rect
              key={i}
              x={x}
              y={y}
              width={w}
              height={10}
              fill="#fff"
              rx={5}
              opacity={0.8 - i * 0.1}
            />
          );
        })}
        {/* Street lights (perspective) */}
        {[0, 1, 2, 3].map((i) => {
          const x = 400 + i * 250;
          const y = 420 - i * 20;
          return (
            <g key={i} className="street-lights">
              <rect x={x} y={y} width="10" height="60" fill="#888" />
              <circle
                cx={x + 5}
                cy={y}
                r="15"
                fill="#ffd700"
                className="light-glow"
              />
            </g>
          );
        })}
        {/* Roadside grass for depth */}
        <polygon
          points="240,400 1200,400 1440,600 0,600"
          fill="#2e7d32"
          opacity="0.5"
        />
      </svg>
    </div>
  );
};

export default DynamicBackground;
