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
