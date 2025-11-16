import { useCallback, useEffect, useRef, useState } from "react";
import { Sidebar } from "../../components/Sidebar/Sidebar";
import { MainContent } from "../../components/MainContent/MainContent";
import { SunIcon, MoonIcon } from "lucide-react";
import { RightPanel } from "../../components/RightPanel/RightPanel";
import { CreateCourseDialog } from "../../components/Dialogs/CreateCourseDialog";
import { MaterialsDialog } from "../../components/Dialogs/MaterialsDialog";
import { EmptyState } from "../../components/EmptyState/EmptyState";
import { Toaster } from "../../components/ui/toaster";
import { useToast } from "../../hooks/use-toast";
import { useFileUpload } from "../../hooks/useFileUpload";
import { useResizePanel } from "../../hooks/useResizePanel";
import { darkModeColors, lightModeColors } from "../../constants/colors";
import type { Course, Material } from "../../types";
import { apiService } from "../../services/api";

const DEMO_VIDEO_ID = "003cbc6c-214e-421b-9278-b383013fe4b4";
const DEMO_VIDEO_TIMESTAMP_SECONDS = 30 * 60 + 58;
const DEMO_VIDEO_TIMESTAMP_LABEL = "30:58";
const DEMO_DOCUMENT_ID = "doc_20251116_113045_649868";
const DEMO_DOCUMENT_NAME = "doc_20251116_113045_649868.pdf";

export const Studybuddy = () => {
  const { toast } = useToast();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isSlidesCollapsed, setIsSlidesCollapsed] = useState(false);
  const [isVideoCollapsed, setIsVideoCollapsed] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [currentCourseId, setCurrentCourseId] = useState<string>("");
  const [selectedTopic, setSelectedTopic] = useState("");
  const [materials, setMaterials] = useState<Material[]>([]);
  const [isCreateCourseOpen, setIsCreateCourseOpen] = useState(false);
  const [isMaterialsDialogOpen, setIsMaterialsDialogOpen] = useState(false);
  const [newCourseName, setNewCourseName] = useState("");
  const [hoveredCourseId, setHoveredCourseId] = useState<string | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isCreatingCourse, setIsCreatingCourse] = useState(false);
  const [isUploadingDocuments, setIsUploadingDocuments] = useState(false);
  const [demoAssetsUnlocked, setDemoAssetsUnlocked] = useState(false);

  const colors = isDarkMode ? darkModeColors : lightModeColors;
  const currentCourse = courses.find((c) => c.id === currentCourseId) ?? courses[0] ?? null;

  const {
    uploadedFiles,
    isDragging,
    handleDragEnter,
    handleDragLeave,
    handleDragOver,
    handleDrop,
    handleFileSelect,
    removeFile,
    clearFiles,
    replaceFiles,
  } = useFileUpload();

  const { panelWidth, isResizing, handleMouseDown } = useResizePanel(400, 800, 400);
  const chatStartedRef = useRef(false);

  const handleChatProgressChange = useCallback(
    (inProgress: boolean) => {
      if (inProgress) {
        chatStartedRef.current = true;
        return;
      }

      if (chatStartedRef.current && !demoAssetsUnlocked) {
        setDemoAssetsUnlocked(true);
      }
    },
    [demoAssetsUnlocked]
  );

  const handleCourseChange = (course: Course) => {
    console.log("Current courseId:", course.id);
    setCurrentCourseId(course.id);
    setSelectedTopic(course.content[0]?.children[0] || "");
  };

  const handleDeleteCourse = (courseId: string) => {
    const courseToDelete = courses.find((c) => c.id === courseId);
    const filteredCourses = courses.filter((c) => c.id !== courseId);
    setCourses(filteredCourses);
    
    if (currentCourseId === courseId) {
      if (filteredCourses.length > 0) {
        setCurrentCourseId(filteredCourses[0].id);
        setSelectedTopic(filteredCourses[0].content[0]?.children[0] || "");
      } else {
        setCurrentCourseId(""); // No courses left
        setSelectedTopic("");
      }
    }

    if (courseToDelete) {
      toast({
        title: "Course deleted",
        description: `${courseToDelete.name} and its chat history have been removed.`,
      });
    }
  };

  const handleCreateCourse = async () => {
    const trimmedName = newCourseName.trim();
    if (!trimmedName || isCreatingCourse) return;

    try {
      setIsCreatingCourse(true);
      const createdCourse = await apiService.createCourse(trimmedName);

      setCourses(prevCourses => [...prevCourses, createdCourse]);
      setCurrentCourseId(createdCourse.id);
      setSelectedTopic(createdCourse.content[0]?.children[0] || "");
      setNewCourseName("");
      setIsCreateCourseOpen(false);

      toast({
        title: "Course created",
        description: `${createdCourse.name} has been created successfully`,
      });
    } catch (error) {
      toast({
        title: "Course creation failed",
        description: "We couldn't create the course. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingCourse(false);
    }
  };

  const handleSaveMaterials = async () => {
    if (!currentCourse || uploadedFiles.length === 0 || isUploadingDocuments) return;

    const filesToUpload = [...uploadedFiles];
    const failedFiles: File[] = [];
    const successfulMaterials: Material[] = [];

    setIsUploadingDocuments(true);

    for (const file of filesToUpload) {
      try {
        const response = await apiService.uploadDocument(file, currentCourse.id);
        const metadata = response.document ?? {};
        const documentId =
          metadata.document_id ??
          metadata.id ??
          metadata.uuid ??
          `document-${Date.now()}-${Math.random()}`;
        const materialName = metadata.title ?? metadata.filename ?? metadata.name ?? file.name;
        const status: Material["status"] =
          response.processing === "queued"
            ? "queued"
            : response.processing === "processing"
            ? "processing"
            : "stored";

        successfulMaterials.push({
          id: documentId,
          name: materialName,
          courseId: currentCourse.id,
          type: "pdf",
          documentId,
          status,
        });
      } catch (error) {
        console.error("Error uploading document:", error);
        failedFiles.push(file);
      }
    }

    if (successfulMaterials.length > 0) {
      setMaterials(prevMaterials => [...prevMaterials, ...successfulMaterials]);
      toast({
        title: "Upload successful",
        description: `${successfulMaterials.length} file${successfulMaterials.length > 1 ? "s" : ""} uploaded to ${currentCourse.name}`,
      });
    }

    if (failedFiles.length > 0) {
      toast({
        title: "Upload failed",
        description: `${failedFiles.length} file${failedFiles.length > 1 ? "s" : ""} failed to upload. Please try again.`,
        variant: "destructive",
      });
      replaceFiles(failedFiles);
    } else {
      clearFiles();
    }

    setIsUploadingDocuments(false);
  };

  useEffect(() => {
    if (!demoAssetsUnlocked || !currentCourse) return;

    setMaterials(prevMaterials => {
      const alreadyExists = prevMaterials.some(material => material.id === DEMO_DOCUMENT_ID);
      if (alreadyExists) {
        return prevMaterials;
      }

      return [
        ...prevMaterials,
        {
          id: DEMO_DOCUMENT_ID,
          name: DEMO_DOCUMENT_NAME,
          courseId: currentCourse.id,
          type: "pdf",
          documentId: DEMO_DOCUMENT_ID,
          status: "stored",
        },
      ];
    });
  }, [demoAssetsUnlocked, currentCourse]);

  useEffect(() => {
    if (demoAssetsUnlocked && pageNumber !== 75) {
      setPageNumber(75);
    }
  }, [demoAssetsUnlocked, pageNumber]);

  const demoVideo = demoAssetsUnlocked
    ? {
        id: DEMO_VIDEO_ID,
        timestampSeconds: DEMO_VIDEO_TIMESTAMP_SECONDS,
        timestampLabel: DEMO_VIDEO_TIMESTAMP_LABEL,
      }
    : null;

  const demoDocument = demoAssetsUnlocked
    ? {
        id: DEMO_DOCUMENT_ID,
        name: DEMO_DOCUMENT_NAME,
      }
    : null;

  const handleUploadClick = () => {
    document.getElementById("file-upload-input")?.click();
  };

  const getPdfMaterials = () => {
    return materials.filter((m) => m.courseId === currentCourseId && m.type === "pdf");
  };

  const getVideoMaterials = () => {
    return materials.filter((m) => m.courseId === currentCourseId && m.type === "video");
  };

  const handleDeleteMaterial = (materialId: string) => {
    if (!currentCourse) return;
    const material = materials.find((m) => m.id === materialId);
    setMaterials(materials.filter((m) => m.id !== materialId));

    if (material) {
      toast({
        title: "Material deleted",
        description: `${material.name} has been removed from ${currentCourse.name}`,
      });
    }
  };

  const handleMoveMaterial = (materialId: string, targetCourseId: string) => {
    setMaterials(materials.map((m) => (m.id === materialId ? { ...m, courseId: targetCourseId } : m)));
  };

  const getCurrentCourseMaterials = () => {
    return materials.filter((m) => m.courseId === currentCourseId);
  };

  return (
    <div className="flex h-screen" style={{ backgroundColor: colors.background }}>
      {currentCourse ? (
        <>
          <Sidebar
            isCollapsed={isSidebarCollapsed}
            setIsCollapsed={setIsSidebarCollapsed}
            isDarkMode={isDarkMode}
            setIsDarkMode={setIsDarkMode}
            courses={courses}
            currentCourse={currentCourse}
            selectedTopic={selectedTopic}
            colors={colors}
            onCourseChange={handleCourseChange}
            onTopicSelect={setSelectedTopic}
            onDeleteCourse={handleDeleteCourse}
            onCreateCourse={() => setIsCreateCourseOpen(true)}
            hoveredCourseId={hoveredCourseId}
            setHoveredCourseId={setHoveredCourseId}
          />

          <MainContent
            colors={colors}
            isDragging={isDragging}
            uploadedFiles={uploadedFiles}
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onFileSelect={handleFileSelect}
            onRemoveFile={removeFile}
            onSaveMaterials={handleSaveMaterials}
            onOpenMaterials={() => setIsMaterialsDialogOpen(true)}
            isSavingMaterials={isUploadingDocuments}
            onChatProgressChange={handleChatProgressChange}
          />

          <RightPanel
            panelWidth={panelWidth}
            isResizing={isResizing}
            isSlidesCollapsed={isSlidesCollapsed}
            isVideoCollapsed={isVideoCollapsed}
            colors={colors}
            pageNumber={pageNumber}
            isPlaying={isPlaying}
            hasPdfMaterials={getPdfMaterials().length > 0}
            onMouseDown={handleMouseDown}
            onToggleSlides={() => setIsSlidesCollapsed(!isSlidesCollapsed)}
            onToggleVideo={() => setIsVideoCollapsed(!isVideoCollapsed)}
            onSetPlaying={setIsPlaying}
            onUploadClick={handleUploadClick}
            preloadedDocument={demoDocument}
            preloadedVideo={demoVideo}
          />
        </>
      ) : (
        <div className="flex-1 flex flex-col">
          <header className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: colors.border }}>
            <h2 className="text-lg font-semibold" style={{ color: colors.primaryText }}>
              StudyBuddy
            </h2>
            <button
              className="h-8 w-8 flex items-center justify-center"
              onClick={() => setIsDarkMode(!isDarkMode)}
              style={{ color: colors.primaryText }}
            >
              {isDarkMode ? <SunIcon className="w-4 h-4" /> : <MoonIcon className="w-4 h-4" />}
              </button>
          </header>
          <EmptyState
            colors={colors}
            onCreateCourse={() => setIsCreateCourseOpen(true)}
          />
        </div>
      )}

      <CreateCourseDialog
        isOpen={isCreateCourseOpen}
        courseName={newCourseName}
        colors={colors}
        onClose={() => {
          setIsCreateCourseOpen(false);
          setNewCourseName("");
        }}
        onCourseNameChange={setNewCourseName}
        onCreate={handleCreateCourse}
        isSubmitting={isCreatingCourse}
      />

      {currentCourse && (
        <MaterialsDialog
          isOpen={isMaterialsDialogOpen}
          materials={getCurrentCourseMaterials()}
          courses={courses}
          currentCourse={currentCourse}
          colors={colors}
          onClose={() => setIsMaterialsDialogOpen(false)}
          onDeleteMaterial={handleDeleteMaterial}
          onMoveMaterial={handleMoveMaterial}
        />
      )}

      <Toaster />
    </div>
  );
};
