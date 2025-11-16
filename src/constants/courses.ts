import type { Course } from "../types";

export const initialCourses: Course[] = [
  {
    id: "course1",
    name: "CSC214 AI Fundamentals",
    content: [
      {
        id: "unit1",
        title: "Unit 1 - Decision Networks",
        children: [
          "Decisions as Outcome Trees",
          "Example: Decision Networks",
          "Ghostbusters Decision Network",
          "Value of Information",
          "VPI Properties",
          "Value of Imperfect Information",
        ],
      },
      {
        id: "unit2",
        title: "Unit 2 - Markov Models",
        children: [
          "Independence",
          "Conditional Independence",
          "The Markov Assumption: Time or Space",
          "Chain Rule or Markov Models",
          "Implied Conditional Independence",
          "Mini-Forward Algorithms",
          "Convergence",
          "Stationary Distributions",
          "Application of Stationary Distributions",
          "Web Search",
          "Hidden Markov Models",
          "Joint Distribution of an HMM",
          "Passage of Time",
          "Observation",
        ],
      },
      {
        id: "unit3",
        title: "Unit 3 - Bayes Networks: Sampling",
        children: [
          "Bayes Network Representation",
          "Variable Elimination",
          "Approximate Inference: Sampling",
          "Prior Sampling",
        ],
      },
    ],
  },
  {
    id: "course2",
    name: "CSC301 Machine Learning Basics",
    content: [
      {
        id: "unit1",
        title: "Unit 1 - Introduction to ML",
        children: [
          "What is Machine Learning",
          "Types of Learning",
          "Supervised Learning",
          "Unsupervised Learning",
        ],
      },
      {
        id: "unit2",
        title: "Unit 2 - Neural Networks",
        children: [
          "Perceptrons",
          "Activation Functions",
          "Backpropagation",
          "Deep Learning",
        ],
      },
    ],
  },
  {
    id: "course3",
    name: "CSC220 Data Structures",
    content: [
      {
        id: "unit1",
        title: "Unit 1 - Arrays and Lists",
        children: [
          "Array Basics",
          "Linked Lists",
          "Dynamic Arrays",
          "Time Complexity",
        ],
      },
      {
        id: "unit2",
        title: "Unit 2 - Trees and Graphs",
        children: [
          "Binary Trees",
          "Tree Traversal",
          "Graph Representation",
          "Graph Algorithms",
        ],
      },
    ],
  },
];
