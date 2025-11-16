import React from "react";
import { SlidersHorizontalIcon, UploadIcon, PaperclipIcon, SendIcon, XIcon } from "lucide-react";
import { Button } from "../ui/button";
import { ScrollArea } from "../ui/scroll-area";
import type { ColorScheme } from "../../types";
import { CopilotChat } from "@copilotkit/react-ui";

type MainContentProps = {
  colors: ColorScheme;
  isDragging: boolean;
  uploadedFiles: File[];
  onDragEnter: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveFile: (index: number) => void;
  onSaveMaterials: () => void;
  onOpenMaterials: () => void;
};

export const MainContent: React.FC<MainContentProps> = ({
  colors,
  isDragging,
  uploadedFiles,
  onDragEnter,
  onDragOver,
  onDragLeave,
  onDrop,
  onFileSelect,
  onRemoveFile,
  onSaveMaterials,
  onOpenMaterials,
}) => {
  return (
    <main className="flex-1 flex flex-col opacity-0 translate-y-[-1rem] animate-fade-in [--animation-delay:200ms]">
      <header className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: colors.border }}>
        <h2 className="text-lg font-semibold" style={{ color: colors.primaryText }}>
          StudyBuddy
        </h2>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          style={{ color: colors.primaryText }}
          onClick={onOpenMaterials}
        >
          <SlidersHorizontalIcon className="w-5 h-5" />
        </Button>
      </header>

      <div
        className="flex-1 flex flex-col p-6 relative overflow-hidden" // Added overflow-hidden here
        onDragEnter={onDragEnter}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        {isDragging && (
          <div className="absolute inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: `${colors.background}ee` }}>
            <div className="border-2 border-dashed rounded-lg p-12 text-center" style={{ borderColor: colors.accent }}>
              <UploadIcon className="w-16 h-16 mx-auto mb-4" style={{ color: colors.accent }} />
              <p className="text-lg font-semibold mb-2" style={{ color: colors.primaryText }}>
                Drop PDF files here
              </p>
              <p className="text-sm" style={{ color: colors.secondaryText }}>
                Upload course materials, slides, or documents
              </p>
            </div>
          </div>
        )}

        <div
          className="flex-1 rounded-lg border p-4 mb-4"
          style={{
            backgroundColor: colors.card,
            borderColor: colors.border,
            color: colors.primaryText,
          }}
        >
          <CopilotChat
            className="h-full"
            labels={{
              title: "StudyBuddy Assistant",
              placeholder: "Ask about the lecture content or paste a problem...",
            }}
          />
        </div>

        {uploadedFiles.length > 0 && (
          <div className="mb-3">
            <div className="space-y-2 mb-2">
              {uploadedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg"
                  style={{ backgroundColor: colors.panel, borderColor: colors.border }}
                >
                  <PaperclipIcon className="w-4 h-4 flex-shrink-0" style={{ color: colors.secondaryText }} />
                  <span className="text-sm flex-1 truncate" style={{ color: colors.primaryText }}>
                    {file.name}
                  </span>
                  <button onClick={() => onRemoveFile(index)} className="flex-shrink-0" style={{ color: colors.secondaryText }}>
                    <XIcon className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <Button
              size="sm"
              onClick={onSaveMaterials}
              style={{
                backgroundColor: colors.accent,
                color: colors.buttonIcon,
                width: "100%",
              }}
            >
              Save Materials to Course
            </Button>
          </div>
        )}

        <div className="relative flex-shrink-0">
          <input
            type="file"
            id="file-upload-input"
            multiple
            accept=".pdf"
            className="hidden"
            onChange={onFileSelect}
          />
          <div className="flex justify-end gap-2 mt-2">
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              style={{ color: colors.primaryText }}
              onClick={() => document.getElementById("file-upload-input")?.click()}
            >
              <PaperclipIcon className="w-4 h-4" />
            </Button>
            <Button
              size="icon"
              className="h-8 w-8 rounded-full"
              style={{ backgroundColor: colors.accent, color: colors.buttonIcon }}
            >
              <SendIcon className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <footer className="text-center text-xs mt-4 flex-shrink-0" style={{ color: colors.secondaryText }}> {/* Added flex-shrink-0 */}
          StudyBuddy@2025 | All rights reserved
        </footer>
      </div>
    </main>
  );
};
