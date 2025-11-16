export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  isTyping?: boolean;
};

export type MaterialType = "pdf" | "video";

export type Material = {
  id: string;
  name: string;
  file: File;
  courseId: string;
  type: MaterialType;
};

export type Course = {
  id: string;
  name: string;
  content: Array<{
    id: string;
    title: string;
    children: string[];
  }>;
};

export type ColorScheme = {
  background: string;
  panel: string;
  card: string;
  border: string;
  primaryText: string;
  secondaryText: string;
  accent: string;
  accentHover: string;
  hover: string;
  selected: string;
  buttonIcon: string;
};
