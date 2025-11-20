import { useCallback, useEffect, useRef, useState } from "react";
import { useCopilotChat } from "@copilotkit/react-core";
import { TextMessage, MessageRole } from "@copilotkit/runtime-client-gql";
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

type DemoTopic = {
  name: string;
  date?: string;
  reading?: string;
  assignments?: string;
};

type DemoUnit = {
  id: string;
  title: string;
  topics: DemoTopic[];
};

const DEMO_UNITS: DemoUnit[] = [
  {
    id: "unit-data-representation",
    title: "Unit 1 - Data Representation",
    topics: [
      {
        name: "Introduction",
        date: "Mon. Aug. 25",
        reading: "Chapter 1",
        assignments: "Get a CSUG account; Set up university VPN.",
      },
      {
        name: "Binary and Integers I",
        date: "Wed. Aug. 27",
        reading: "Chapter 2",
        assignments: "A1: datalab (bit twiddling) out.",
      },
      {
        name: "Binary and Integers II",
        date: "Wed. Sep. 3",
        reading: "Chapter 2 (continued)",
      },
      {
        name: "Floating Point",
        date: "Mon. Sep. 8",
        reading: "Chapter 3",
      },
    ],
  },
  {
    id: "unit-assembly-programming",
    title: "Unit 2 - Assembly Programming",
    topics: [
      {
        name: "ISA Overview",
        date: "Wed. Sep. 10",
      },
      {
        name: "Data Movement and Compute Instructions",
        date: "Mon. Sep. 15",
        assignments: "A1 due at midnight; A2: the binary bomb released.",
      },
      {
        name: "Control Instructions",
        date: "Wed. Sep. 17",
      },
      {
        name: "Functions",
        date: "Mon. Sep. 22",
      },
      {
        name: "Data Structures and Buffer Overflow",
        date: "Wed. Sep. 24",
        reading: "Chapter 4 intro; Sections 4.2-4.3",
        assignments: "Compare RISC vs CISC approaches.",
      },
    ],
  },
  {
    id: "unit-systems-architecture",
    title: "Unit 3 - Systems & Advanced Concepts",
    topics: [
      {
        name: "Instruction Encoding",
        date: "Mon. Sep. 29",
        reading: "Sections 4.5, 4.6, 5.7",
      },
      {
        name: "Single-cycle CPU",
        date: "Wed. Oct. 1",
        reading: "Sections 4.5, 4.6, 5.7",
        assignments: "A2 due; A3: the buffer bomb out.",
      },
      {
        name: "Pipelining I",
        date: "Wed. Oct. 15",
      },
      {
        name: "Pipelining II",
        date: "Mon. Oct. 20",
      },
      {
        name: "Cache, Memory, and Storage",
        date: "Wed. Oct. 22",
        reading: "Chapter 6.2-6.4",
      },
      {
        name: "Cache",
        date: "Mon. Oct. 27",
        reading: "Chapter 6.5-6.6",
        assignments: "A3 due; A4: cache simulator out.",
      },
      {
        name: "Processes",
        date: "Wed. Oct. 29",
        reading: "Skim Chapter 8.1 and 8.3; Read Chapter 8.2",
      },
      {
        name: "Signals",
        date: "Mon. Nov. 3",
        reading: "Chapter 8.5",
      },
      {
        name: "Interrupts and Exceptions",
        date: "Wed. Nov. 5",
        reading: "Chapter 9.1-9.6",
      },
      {
        name: "Virtual Memory",
        date: "Mon. Nov. 10",
        reading: "Chapter 9.6-9.7",
      },
      {
        name: "VM Optimizations",
        date: "Wed. Nov. 12",
        reading: "Chapter 9.8",
        assignments: "A4 due Monday 11/17.",
      },
      {
        name: "Memory Management",
        date: "Mon. Nov. 17",
        reading: "Chapter 9.9",
        assignments: "A5: memory allocation out.",
      },
      {
        name: "Advanced Memory Management",
        date: "Wed. Nov. 19",
        reading: "Chapter 9.10",
      },
      {
        name: "Multi-threading and Multi-core",
        date: "Mon. Nov. 24",
        reading: "Chapters 12.4, 12.5.1-12.5.3, 12.6, 12.7.5",
      },
      {
        name: "Systems Security",
        date: "Mon. Dec. 1",
      },
      {
        name: "Review Class",
        date: "Wed. Dec. 3",
      },
    ],
  },
];

const buildTopicPrompt = (unitTitle: string, topic: DemoTopic) => {
  let prompt = `Explain the topic "${topic.name}" from the ${unitTitle} unit of our CS 242 Computer Systems demo course.`;
  if (topic.date) {
    prompt += ` It was covered on ${topic.date}.`;
  }
  prompt += " Focus on why it matters for systems programming students.";
  if (topic.reading) {
    prompt += ` Reference the assigned reading (${topic.reading}).`;
  }
  if (topic.assignments) {
    prompt += ` Mention the related assignments or milestones: ${topic.assignments}`;
  }
  prompt += " Keep the answer concise enough for a live walkthrough but include concrete talking points.";
  return prompt;
};

const createDemoCourse = (): {
  demoCourse: Course;
  topicPrompts: Map<string, string>;
  firstTopic: string;
} => {
  const topicPrompts = new Map<string, string>();
  const content = DEMO_UNITS.map((unit) => ({
    id: unit.id,
    title: unit.title,
    children: unit.topics.map((topic) => {
      topicPrompts.set(topic.name, buildTopicPrompt(unit.title, topic));
      return topic.name;
    }),
  }));

  return {
    demoCourse: {
      id: "course-demo",
      name: "CSC 252 Computer Systems",
      content,
    },
    topicPrompts,
    firstTopic: content[0]?.children[0] ?? "",
  };
};

const {
  demoCourse: DEMO_COURSE,
  topicPrompts: DEMO_TOPIC_PROMPTS,
  firstTopic: DEMO_FIRST_TOPIC,
} = createDemoCourse();

export const Studybuddy = () => {
  const { toast } = useToast();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isSlidesCollapsed, setIsSlidesCollapsed] = useState(false);
  const [isVideoCollapsed, setIsVideoCollapsed] = useState(false);
  const [courses, setCourses] = useState<Course[]>([DEMO_COURSE]);
  const [currentCourseId, setCurrentCourseId] = useState<string>(DEMO_COURSE.id);
  const [selectedTopic, setSelectedTopic] = useState(DEMO_FIRST_TOPIC);
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

  const { appendMessage } = useCopilotChat();
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

  const sendTopicPrompt = useCallback(
    async (topic: string) => {
      const prompt = DEMO_TOPIC_PROMPTS.get(topic);
      if (!prompt) return;

      try {
        await appendMessage(
          new TextMessage({
            role: MessageRole.User,
            content: prompt,
          })
        );
      } catch (error) {
        console.error("Failed to send topic prompt", error);
      }
    },
    [appendMessage]
  );

  const handleTopicSelect = useCallback(
    (topic: string) => {
      setSelectedTopic(topic);
      void sendTopicPrompt(topic);
    },
    [sendTopicPrompt]
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
            onTopicSelect={handleTopicSelect}
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
