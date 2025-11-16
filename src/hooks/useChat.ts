import { useState, useEffect, useCallback } from "react";
import type { ChatMessage } from "../types";
import { getRandomMockResponse } from "../services/mockResponses";

const generateId = () => Math.random().toString(36).substring(2, 9);

export const useChat = (courseId: string | undefined) => {
  // Stores chat histories for all courses, keyed by courseId
  const [allChatHistories, setAllChatHistories] = useState<Map<string, ChatMessage[]>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [inputValue, setInputValue] = useState("");

  // Get the current course's messages
  const messages = courseId ? allChatHistories.get(courseId) || [] : [];

  // Update messages when courseId changes
  useEffect(() => {
    if (courseId && !allChatHistories.has(courseId)) {
      setAllChatHistories(prev => new Map(prev).set(courseId, []));
    }
  }, [courseId, allChatHistories]);

  const sendMessage = useCallback(async () => {
    const message = inputValue.trim();
    if (!message || !courseId) return;

    const userMessage: ChatMessage = {
      id: generateId(),
      role: "user",
      content: message,
      timestamp: new Date(),
    };

    setInputValue(""); // Clear input immediately

    // Add user message
    setAllChatHistories(prevAllChatHistories => {
      const newAllChatHistories = new Map(prevAllChatHistories);
      const currentMessages = newAllChatHistories.get(courseId) || [];
      newAllChatHistories.set(courseId, [...currentMessages, userMessage]);
      return newAllChatHistories;
    });

    setIsLoading(true);

    const assistantPlaceholderId = generateId();
    // Add placeholder assistant message
    setAllChatHistories(prevAllChatHistories => {
      const newAllChatHistories = new Map(prevAllChatHistories);
      const currentMessages = newAllChatHistories.get(courseId) || []; // Get latest messages including user message
      newAllChatHistories.set(courseId, [
        ...currentMessages,
        {
          id: assistantPlaceholderId,
          role: "assistant",
          content: "",
          timestamp: new Date(),
          isTyping: true,
        },
      ]);
      return newAllChatHistories;
    });

    const delay = 1000 + Math.random() * 1000;

    setTimeout(() => {
      const fullResponse = getRandomMockResponse();

      // Update the placeholder message
      setAllChatHistories(prevAllChatHistories => {
        const newAllChatHistories = new Map(prevAllChatHistories);
        const currentMessages = newAllChatHistories.get(courseId) || [];
        newAllChatHistories.set(
          courseId,
          currentMessages.map(msg =>
            msg.id === assistantPlaceholderId
              ? { ...msg, content: fullResponse, isTyping: false }
              : msg
          )
        );
        return newAllChatHistories;
      });
      setIsLoading(false);
    }, delay);
  }, [inputValue, courseId]);

  const clearMessages = useCallback(() => {
    if (courseId) {
      setAllChatHistories(prev => new Map(prev).set(courseId, []));
    }
  }, [courseId]);

  const deleteCourseHistory = useCallback((deletedCourseId: string) => {
    setAllChatHistories(prev => {
      const newMap = new Map(prev);
      newMap.delete(deletedCourseId);
      return newMap;
    });
  }, []);

  return {
    messages,
    isLoading,
    inputValue,
    setInputValue,
    sendMessage,
    clearMessages,
    deleteCourseHistory,
  };
};
