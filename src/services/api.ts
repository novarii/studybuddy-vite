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

export const apiService = {
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

  async uploadMaterial(file: File, courseId: string): Promise<{ success: boolean; materialId: string }> {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("courseId", courseId);

      const response = await fetch(`${API_BASE_URL}/materials/upload`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload material");
      }

      return await response.json();
    } catch (error) {
      console.error("Error uploading material:", error);
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
