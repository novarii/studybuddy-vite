import type { Course, ChatMessage } from "../types";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000/api";

export interface LLMResponse {
  message: string;
  session_id?: string;
  courseContent?: Course["content"];
  pdfUrl?: string;
  videoUrl?: string;
  videoTimestamps?: Array<{
    time: number;
    label: string;
  }>;
}

export interface DocumentUploadResponse {
  status: string;
  document?: {
    document_id?: string;
    id?: string;
    uuid?: string;
    filename?: string;
    name?: string;
    title?: string;
    course_id?: string;
  };
  processing?: string;
}

export const apiService = {
  async createCourse(name: string): Promise<Course> {
    try {
      const trimmedName = name.trim();
      if (!trimmedName) {
        throw new Error("Course name is required");
      }

      const response = await fetch(`${API_BASE_URL}/courses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: trimmedName }),
      });

      if (!response.ok) {
        throw new Error("Failed to create course");
      }

      const data = await response.json();
      const coursePayload = (data.course ?? data) as {
        id?: string;
        course_id?: string;
        name?: string;
        content?: Course["content"];
      };

      const id = coursePayload.id ?? coursePayload.course_id;

      if (!id) {
        throw new Error("Invalid course response: missing id");
      }

      return {
        id,
        name: coursePayload.name ?? trimmedName,
        content: coursePayload.content ?? [],
      };
    } catch (error) {
      console.error("Error creating course:", error);
      throw error;
    }
  },

  async sendMessage(
    message: string,
    courseId: string,
    sessionId?: string
  ): Promise<LLMResponse> {
    try {
      const payload: Record<string, unknown> = {
        message,
        course_id: courseId,
      };

      if (sessionId) {
        payload.session_id = sessionId;
      }

      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      return await response.json();
    } catch (error) {
      console.error("Error sending message:", error);
      throw error;
    }
  },

  async uploadDocument(file: File, courseId: string): Promise<DocumentUploadResponse> {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("course_id", courseId);

      const response = await fetch(`${API_BASE_URL}/documents/upload`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload document");
      }

      return await response.json();
    } catch (error) {
      console.error("Error uploading document:", error);
      throw error;
    }
  },

  async generateCourseContent(courseId: string, materials: File[]): Promise<Course["content"]> {
    try {
      const formData = new FormData();
      formData.append("courseId", courseId);
      materials.forEach((file) => {
        formData.append("materials", file);
      });

      const response = await fetch(`${API_BASE_URL}/courses/generate-content`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to generate course content");
      }

      return await response.json();
    } catch (error) {
      console.error("Error generating course content:", error);
      throw error;
    }
  },
};
