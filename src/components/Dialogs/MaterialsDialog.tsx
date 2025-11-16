import React, { useEffect, useState } from "react";
import { FileTextIcon, MoveIcon, TrashIcon, VideoIcon } from "lucide-react";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "../ui/dropdown-menu";
import type { Material, Course, ColorScheme } from "../../types";

type MaterialsDialogProps = {
  isOpen: boolean;
  materials: Material[];
  courses: Course[];
  currentCourse: Course;
  colors: ColorScheme;
  onClose: () => void;
  onDeleteMaterial: (materialId: string) => void;
  onMoveMaterial: (materialId: string, targetCourseId: string) => void;
};

export const MaterialsDialog: React.FC<MaterialsDialogProps> = ({
  isOpen,
  materials,
  courses,
  currentCourse,
  colors,
  onClose,
  onDeleteMaterial,
  onMoveMaterial,
}) => {
  const [backendVideos, setBackendVideos] = useState<any[]>([]);
  const [isLoadingVideos, setIsLoadingVideos] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [deletingVideoId, setDeletingVideoId] = useState<string | null>(null);

  // Fetch videos from backend when the dialog opens
  useEffect(() => {
    if (!isOpen) return;

    const fetchVideos = async () => {
      try {
        setIsLoadingVideos(true);
        setVideoError(null);

        const baseUrl = import.meta.env.VITE_VIDEO_API_URL || "http://localhost:8000";
        const response = await fetch(`${baseUrl}/api/videos`);

        if (!response.ok) {
          throw new Error("Failed to fetch videos");
        }

        const data = await response.json();
        const videos = Array.isArray(data?.videos) ? data.videos : [];
        setBackendVideos(videos);
      } catch (error) {
        console.error("Error fetching videos", error);
        setVideoError("Unable to load lecture recordings from the server.");
      } finally {
        setIsLoadingVideos(false);
      }
    };

    void fetchVideos();
  }, [isOpen]);

  const baseVideoUrl = import.meta.env.VITE_VIDEO_API_URL || "http://localhost:8000";

  const handleDeleteServerVideo = async (id: string | undefined) => {
    if (!id) return;

    try {
      setDeletingVideoId(id);
      const response = await fetch(`${baseVideoUrl}/api/videos/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete video");
      }

      setBackendVideos(prev => prev.filter(video => (video.id || video.video_id || video.uuid) !== id));
    } catch (error) {
      console.error("Error deleting video", error);
      setVideoError("Unable to delete lecture recording.");
    } finally {
      setDeletingVideoId(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent style={{ backgroundColor: colors.panel, borderColor: colors.border }} className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle style={{ color: colors.primaryText }}>Course Materials</DialogTitle>
          <DialogDescription style={{ color: colors.secondaryText }}>Manage materials for {currentCourse.name}</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {materials.length === 0 && backendVideos.length === 0 && !isLoadingVideos && !videoError ? (
            <div className="text-center py-8" style={{ color: colors.secondaryText }}>
              <FileTextIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No materials uploaded for this course yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {materials.filter(m => m.type === 'pdf').length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-2 px-1" style={{ color: colors.primaryText }}>
                    Course Materials (PDFs)
                  </h3>
                  <div className="space-y-2">
                    {materials.filter(m => m.type === 'pdf').map((material) => (
                      <div key={material.id} className="flex items-center gap-3 p-3 rounded-lg border" style={{ backgroundColor: colors.card, borderColor: colors.border }}>
                        <FileTextIcon className="w-5 h-5 flex-shrink-0" style={{ color: colors.accent }} />
                        <span className="text-sm flex-1 truncate" style={{ color: colors.primaryText }}>
                          {material.name}
                        </span>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" style={{ color: colors.primaryText }}>
                              <MoveIcon className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent style={{ backgroundColor: colors.panel, borderColor: colors.border }}>
                            <DropdownMenuLabel style={{ color: colors.primaryText }}>Move to Course</DropdownMenuLabel>
                            <DropdownMenuSeparator style={{ backgroundColor: colors.border }} />
                            {courses
                              .filter((c) => c.id !== currentCourse.id)
                              .map((course) => (
                                <DropdownMenuItem key={course.id} onClick={() => onMoveMaterial(material.id, course.id)} className="cursor-pointer" style={{ color: colors.primaryText }}>
                                  {course.name}
                                </DropdownMenuItem>
                              ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <button onClick={() => onDeleteMaterial(material.id)} className="flex-shrink-0" style={{ color: colors.primaryText }}>
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {materials.filter(m => m.type === 'video').length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-2 px-1" style={{ color: colors.primaryText }}>
                    Lecture Recordings
                  </h3>
                  <div className="space-y-2">
                    {materials.filter(m => m.type === 'video').map((material) => (
                      <div key={material.id} className="flex items-center gap-3 p-3 rounded-lg border" style={{ backgroundColor: colors.card, borderColor: colors.border }}>
                        <FileTextIcon className="w-5 h-5 flex-shrink-0" style={{ color: colors.accent }} />
                        <span className="text-sm flex-1 truncate" style={{ color: colors.primaryText }}>
                          {material.name}
                        </span>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" style={{ color: colors.primaryText }}>
                              <MoveIcon className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent style={{ backgroundColor: colors.panel, borderColor: colors.border }}>
                            <DropdownMenuLabel style={{ color: colors.primaryText }}>Move to Course</DropdownMenuLabel>
                            <DropdownMenuSeparator style={{ backgroundColor: colors.border }} />
                            {courses
                              .filter((c) => c.id !== currentCourse.id)
                              .map((course) => (
                                <DropdownMenuItem key={course.id} onClick={() => onMoveMaterial(material.id, course.id)} className="cursor-pointer" style={{ color: colors.primaryText }}>
                                  {course.name}
                                </DropdownMenuItem>
                              ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <button onClick={() => onDeleteMaterial(material.id)} className="flex-shrink-0" style={{ color: colors.primaryText }}>
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-sm font-semibold mb-2 px-1" style={{ color: colors.primaryText }}>
                  Server Lecture Recordings
                </h3>
                {isLoadingVideos ? (
                  <p className="text-sm px-1" style={{ color: colors.secondaryText }}>
                    Loading recordings...
                  </p>
                ) : videoError ? (
                  <p className="text-sm px-1" style={{ color: colors.secondaryText }}>
                    {videoError}
                  </p>
                ) : backendVideos.length === 0 ? (
                  <p className="text-sm px-1" style={{ color: colors.secondaryText }}>
                    No recordings available from the server yet.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {backendVideos.map((video, index) => {
                      const id = video.id || video.video_id || video.uuid;
                      const name = video.title || video.name || `Recording ${index + 1}`;

                      return (
                        <div
                          key={id ?? index}
                          className="flex items-center gap-3 p-3 rounded-lg border"
                          style={{ backgroundColor: colors.card, borderColor: colors.border }}
                        >
                          <VideoIcon className="w-5 h-5 flex-shrink-0" style={{ color: colors.accent }} />
                          <span className="text-sm flex-1 truncate" style={{ color: colors.primaryText }}>
                            {name}
                          </span>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 flex-shrink-0"
                                style={{ color: colors.primaryText }}
                              >
                                <MoveIcon className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent style={{ backgroundColor: colors.panel, borderColor: colors.border }}>
                              <DropdownMenuLabel style={{ color: colors.primaryText }}>
                                Move to Course (coming soon)
                              </DropdownMenuLabel>
                            </DropdownMenuContent>
                          </DropdownMenu>
                          <button
                            onClick={() => handleDeleteServerVideo(id)}
                            className="flex-shrink-0"
                            style={{ color: colors.primaryText }}
                            disabled={deletingVideoId === id}
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button onClick={onClose} style={{ backgroundColor: colors.accent, color: colors.buttonIcon }}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
