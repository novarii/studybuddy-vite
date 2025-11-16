import React, { useEffect, useRef, useState } from "react";
import { ChevronUpIcon, ChevronDownIcon, UploadIcon } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import type { ColorScheme } from "../../types";
import { cn } from "../../lib/utils";

type SlidesSectionProps = {
  isCollapsed: boolean;
  colors: ColorScheme;
  pageNumber: number;
  hasMaterials: boolean;
  onToggle: () => void;
  onUploadClick: () => void;
};

export const SlidesSection: React.FC<SlidesSectionProps> = ({
  isCollapsed,
  colors,
  pageNumber,
  hasMaterials,
  onToggle,
  onUploadClick,
}) => {
  const [pdfSrc, setPdfSrc] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pdfUrlRef = useRef<string | null>(null);

  // Fetch first PDF from backend when the section is opened
  useEffect(() => {
    if (isCollapsed || pdfSrc || isLoading) return;

    const fetchFirstDocument = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const baseUrl =
          import.meta.env.VITE_BACKEND_API_URL ||
          import.meta.env.VITE_VIDEO_API_URL ||
          "http://localhost:8000";

        const response = await fetch(`${baseUrl}/api/documents`);

        if (!response.ok) {
          throw new Error("Failed to fetch documents");
        }

        const data = await response.json();
        const documents = Array.isArray(data?.documents) ? data.documents : [];

        if (documents.length > 0) {
          const first = documents[0];
          const documentId = first.document_id || first.id || first.uuid;

          if (!documentId) {
            setError("Invalid document data received from server.");
            return;
          }

          // Stream the file as a blob so we can safely render it inline
          const fileResponse = await fetch(`${baseUrl}/api/documents/${documentId}/file`);

          if (!fileResponse.ok) {
            throw new Error("Failed to fetch document file");
          }

          const blob = await fileResponse.blob();
          const objectUrl = URL.createObjectURL(blob);

          if (pdfUrlRef.current) {
            URL.revokeObjectURL(pdfUrlRef.current);
          }
          pdfUrlRef.current = objectUrl;
          setPdfSrc(objectUrl);
        }
      } catch (err) {
        console.error("Error fetching documents", err);
        setError("Unable to load course slides.");
      } finally {
        setIsLoading(false);
      }
    };

    void fetchFirstDocument();
  }, [isCollapsed, pdfSrc, isLoading]);

  useEffect(() => {
    return () => {
      if (pdfUrlRef.current) {
        URL.revokeObjectURL(pdfUrlRef.current);
      }
    };
  }, []);

  const hasAnySlides = !!pdfSrc || hasMaterials;

  return (
    <section
      className={cn("flex flex-col border-b transition-all duration-300", isCollapsed ? "flex-none" : "")}
      style={{
        borderColor: colors.border,
        minHeight: isCollapsed ? "auto" : "50%",
        flex: isCollapsed ? "none" : "1 1 55%",
      }}
    >
      <header className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: colors.border }}>
        <h2 className="text-lg font-semibold" style={{ color: colors.primaryText }}>
          Slides
        </h2>
        <Button variant="ghost" size="icon" className="h-8 w-8" style={{ color: colors.primaryText }} onClick={onToggle}>
          {isCollapsed ? <ChevronDownIcon className="w-5 h-5" /> : <ChevronUpIcon className="w-5 h-5" />}
        </Button>
      </header>

      {!isCollapsed && (
        <div className="flex-1 p-4 overflow-hidden">
          <Card className="overflow-hidden h-full flex items-center justify-center" style={{ backgroundColor: colors.card, borderColor: colors.border }}>
            {hasAnySlides && pdfSrc ? (
              <CardContent className="p-0 h-full w-full">
                <iframe
                  src={`${pdfSrc}#page=${pageNumber}`}
                  className="w-full h-full border-0"
                  title="PDF Viewer"
                  key={pdfSrc + pageNumber}
                />
              </CardContent>
            ) : (
              <CardContent className="p-8 text-center">
                <div className="flex flex-col items-center gap-4">
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: colors.panel }}
                  >
                    <UploadIcon className="w-8 h-8" style={{ color: colors.accent }} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2" style={{ color: colors.primaryText }}>
                      {isLoading ? "Loading course materials..." : "No Course Materials"}
                    </h3>
                    <p className="text-sm mb-4" style={{ color: colors.secondaryText }}>
                      {error
                        ? error
                        : "Upload PDFs, slides, or course materials to get started"}
                    </p>
                  </div>
                  <Button
                    onClick={onUploadClick}
                    style={{ backgroundColor: colors.accent, color: colors.buttonIcon }}
                  >
                    <UploadIcon className="w-4 h-4 mr-2" />
                    Upload Materials
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
