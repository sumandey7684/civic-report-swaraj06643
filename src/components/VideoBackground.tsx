import React from "react";
<<<<<<< Updated upstream
import "./VideoBackground.css";

interface VideoBackgroundProps {
  src: string;
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;
}

const VideoBackground: React.FC<VideoBackgroundProps> = ({
  src,
  autoPlay = true,
  loop = true,
  muted = true,
}) => {
  return (
    <div className="video-bg-container">
      <video
        className="video-bg"
        src={src}
        autoPlay={autoPlay}
        loop={loop}
        muted={muted}
        playsInline
      />
    </div>
  );
};

export default VideoBackground;
=======

interface VideoBackgroundProps {
  src: string;
}

export const VideoBackground: React.FC<VideoBackgroundProps> = ({ src }) => (
  <video
    className="video-bg"
    src={src}
    autoPlay
    loop
    muted
    playsInline
    style={{
      position: "absolute",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      objectFit: "cover",
      zIndex: 0,
      pointerEvents: "none",
    }}
  />
);
>>>>>>> Stashed changes
