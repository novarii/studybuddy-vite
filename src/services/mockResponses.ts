export const mockResponses = [
  "Based on the lecture materials, this concept relates to the fundamental principles we discussed in Unit 1. Let me break it down for you...",
  "Great question! According to the course content, this topic is covered in depth in the slides. Here's what you need to know...",
  "I can help you with that. Looking at the practice problems, this is a common area where students need clarification. Let me explain...",
  "That's an interesting point. From the lecture recordings, the professor emphasized this concept multiple times. Here's the key takeaway...",
  "Let me walk you through this step by step. First, we need to understand the foundational concept, then we can apply it to your specific question...",
  "This is directly related to what we covered in the previous unit. The connection between these topics is important because...",
  "Good observation! The syllabus mentions this as a critical learning objective. Here's how it ties into the broader course goals...",
  "I see what you're asking about. This appears in several of your course materials. Let me synthesize the information for you...",
];

export const getRandomMockResponse = (): string => {
  return mockResponses[Math.floor(Math.random() * mockResponses.length)];
};
