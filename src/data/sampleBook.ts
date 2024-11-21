import { Book } from '../types';

export const sampleBooks: Book[] = [
  {
    id: 1,
    title: "The Psychology of Money",
    author: "Morgan Housel",
    coverUrl: "https://images.unsplash.com/photo-1553729459-efe14ef6055d?auto=format&fit=crop&q=80&w=2070",
    chapters: [
      {
        id: 1,
        title: "No One's Crazy",
        content: {
          original: [
            {
              pageNumber: 1,
              content: [
                "Your personal experiences with money make up maybe 0.00000001% of what's happened in the world, but maybe 80% of how you think the world works...",
                "Let me tell you about a person we'll call Grace. Grace was born in 1945. Her earliest memories were of her parents talking about the Great Depression. She watched her parents be extremely frugal, always saving money and living below their means."
              ]
            },
            {
              pageNumber: 2,
              content: [
                "The economists I studied in college spent little time on the field's most important topic: human behavior. They focused on theory and math, which is like someone trying to learn how to be a chef by studying chemistry.",
                "Economics, like many fields, is most useful when it's used as a way to explain things that happened, rather than as a way to predict things that will happen."
              ]
            },
            {
              pageNumber: 3,
              content: [
                "What makes the study of financial history so interesting is that money has been a constant throughout history, but what people think about money – their behaviors, goals, and feelings – has been a total revolution.",
                "The way people think about money has changed more in the last century than it did in the previous five thousand years."
              ]
            }
          ],
          condensed: [
            {
              pageNumber: 1,
              originalPageRange: { start: 1, end: 2 },
              content: [
                "Our personal experiences heavily influence our financial decisions, despite representing only a tiny fraction of all possible financial scenarios.",
                "Traditional economic education often overlooks the crucial role of human behavior, focusing instead on theoretical models."
              ]
            },
            {
              pageNumber: 2,
              originalPageRange: { start: 2, end: 3 },
              content: [
                "While money itself has remained constant throughout history, people's attitudes and behaviors towards it have undergone dramatic changes.",
                "The evolution of financial thinking in the last century has been more dramatic than in all previous recorded history."
              ]
            }
          ],
          quick: [
            {
              pageNumber: 1,
              content: [
                "Personal experience shapes financial worldview despite limited exposure to all possibilities.",
                "Human behavior, not theory, drives financial decisions.",
                "Money is constant; people's attitudes toward it evolve."
              ]
            }
          ]
        },
        estimatedReadTime: {
          original: 15,
          condensed: 8,
          quick: 3
        },
        totalPages: {
          original: 3,
          condensed: 2,
          quick: 1
        }
      }
    ]
  },
  {
    id: 2,
    title: "Atomic Habits",
    author: "James Clear",
    coverUrl: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=1974",
    chapters: []
  },
  {
    id: 3,
    title: "Deep Work",
    author: "Cal Newport",
    coverUrl: "https://images.unsplash.com/photo-1456324504439-367cee3b3c32?auto=format&fit=crop&q=80&w=2070",
    chapters: []
  },
  {
    id: 4,
    title: "Think Again",
    author: "Adam Grant",
    coverUrl: "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&q=80&w=2070",
    chapters: []
  },
  {
    id: 5,
    title: "The Almanack of Naval Ravikant",
    author: "Eric Jorgenson",
    coverUrl: "https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&q=80&w=2070",
    chapters: []
  }
];

export const sampleBook = sampleBooks[0];