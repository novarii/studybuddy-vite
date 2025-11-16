import React, { useEffect, useState } from "react";
import { ChevronUpIcon, ChevronDownIcon, SkipBackIcon, PlayIcon, PauseIcon, SkipForwardIcon, VideoIcon } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import type { ColorScheme } from "../../types";
import { cn } from "../../lib/utils";

type VideoSectionProps = {
  isCollapsed: boolean;
  colors: ColorScheme;
  isPlaying: boolean;
  onToggle: () => void;
  onSetPlaying: (playing: boolean) => void;
};

export const VideoSection: React.FC<VideoSectionProps> = ({ isCollapsed, colors, isPlaying, onToggle, onSetPlaying }) => {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch the first available video from the backend when the section is opened
  useEffect(() => {
    if (isCollapsed || videoUrl || isLoading) return;

    const fetchVideo = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const baseUrl = import.meta.env.VITE_VIDEO_API_URL || "http://localhost:8000";
        const response = await fetch(`${baseUrl}/api/videos`);

        if (!response.ok) {
          throw new Error("Failed to fetch videos");
        }

        const data = await response.json();
        const videos = Array.isArray(data?.videos) ? data.videos : [];

        if (videos.length > 0) {
          const first = videos[0];
          const id = first.id || first.video_id || first.uuid;

          if (id) {
            setVideoUrl(`${baseUrl}/api/videos/${id}/file`);
          } else {
            setError("Invalid video data received from server");
          }
        } else {
          setVideoUrl(null);
        }
      } catch (err) {
        console.error("Error fetching videos", err);
        setError("Unable to load lecture clip.");
      } finally {
        setIsLoading(false);
      }
    };

    void fetchVideo();
  }, [isCollapsed, videoUrl, isLoading]);
  const handleSkipBack = () => {
    const video = document.querySelector("video");
    if (video) video.currentTime -= 10;
  };

  const handleSkipForward = () => {
    const video = document.querySelector("video");
    if (video) video.currentTime += 10;
  };

  const handlePlayPause = () => {
    const video = document.querySelector("video");
    if (video) {
      if (isPlaying) {
        video.pause();
      } else {
        video.play();
      }
      onSetPlaying(!isPlaying);
    }
  };

  return (
    <section
      className={cn("flex flex-col transition-all duration-300", isCollapsed ? "flex-none" : "")}
      style={{
        flex: isCollapsed ? "none" : "1 1 45%",
        minHeight: isCollapsed ? "auto" : "40%",
      }}
    >
      <header className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: colors.border }}>
        <h2 className="text-lg font-semibold" style={{ color: colors.primaryText }}>
          Lecture Clip
        </h2>
        <Button variant="ghost" size="icon" className="h-8 w-8" style={{ color: colors.primaryText }} onClick={onToggle}>
          {isCollapsed ? <ChevronDownIcon className="w-5 h-5" /> : <ChevronUpIcon className="w-5 h-5" />}
        </Button>
      </header>

      {!isCollapsed && (
        <div className="flex-1 p-4 flex flex-col overflow-hidden">
          <Card className="overflow-hidden flex-1 flex flex-col items-center justify-center" style={{ backgroundColor: colors.card, borderColor: colors.border }}>
            {videoUrl ? (
              <CardContent className="p-0 flex-1 flex flex-col overflow-hidden w-full">
                <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
                  <video className="w-full h-full object-contain" src={videoUrl} controls>
                    Your browser does not support the video tag.
                  </video>
                </div>
                <div className="p-4 border-t flex items-center justify-center gap-4" style={{ backgroundColor: colors.card, borderColor: colors.border }}>
                  <Button variant="ghost" size="icon" className="h-10 w-10" style={{ color: colors.primaryText }} onClick={handleSkipBack}>
                    <SkipBackIcon className="w-5 h-5" />
                  </Button>
                  <Button size="icon" className="h-12 w-12 rounded-full" style={{ backgroundColor: colors.accent, color: colors.buttonIcon }} onClick={handlePlayPause}>
                    {isPlaying ? <PauseIcon className="w-6 h-6" /> : <PlayIcon className="w-6 h-6" />}
                  </Button>
                  <Button variant="ghost" size="icon" className="h-10 w-10" style={{ color: colors.primaryText }} onClick={handleSkipForward}>
                    <SkipForwardIcon className="w-5 h-5" />
                  </Button>
                </div>
              </CardContent>
            ) : (
              <CardContent className="p-8 text-center">
                <div className="flex flex-col items-center gap-4">
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: colors.panel }}
                  >
                    <VideoIcon className="w-8 h-8" style={{ color: colors.accent }} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2" style={{ color: colors.primaryText }}>
                      {isLoading ? "Loading lecture clip..." : "No Lecture Recordings"}
                    </h3>
                    <p className="text-sm mb-4" style={{ color: colors.secondaryText }}>
                      {error
                        ? error
                        : "Use our browser extension to capture lecture recordings"}
                    </p>
                  </div>
                  <Button
                    style={{ backgroundColor: colors.accent, color: colors.buttonIcon }}
                    onClick={() => window.open('https://chrome.google.com/webstore', '_blank')}
                  >
                    <VideoIcon className="w-4 h-4 mr-2" />
                    Get Extension
                  </Button>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      )}
    </section>
  );
};
