/**
 * Tutor Store
 * 
 * Zustand store for AI tutor state management.
 * Tracks conversation history, student level, and preferences.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type StudentLevel = 'beginner' | 'intermediate';

export interface TutorMessage {
    id: string;
    role: 'user' | 'tutor';
    content: string;
    timestamp: Date;
    contextUsed?: boolean; // Whether network context was included
}

interface TutorState {
    // Conversation
    messages: TutorMessage[];

    // Preferences
    studentLevel: StudentLevel;
    proactiveHints: boolean;
    detailMode: boolean;

    // Actions
    addMessage: (role: 'user' | 'tutor', content: string, contextUsed?: boolean) => void;
    setStudentLevel: (level: StudentLevel) => void;
    toggleProactiveHints: () => void;
    toggleDetailMode: () => void;
    clearHistory: () => void;
    getConversationContext: () => string;
}

export const useTutorStore = create<TutorState>()(
    persist(
        (set, get) => ({
            // Initial state
            messages: [],
            studentLevel: 'beginner',
            proactiveHints: true,
            detailMode: false,

            // Add a message to conversation
            addMessage: (role, content, contextUsed = false) => {
                const message: TutorMessage = {
                    id: Date.now().toString(),
                    role,
                    content,
                    timestamp: new Date(),
                    contextUsed
                };

                set(state => ({
                    messages: [...state.messages, message]
                }));
            },

            // Set student level
            setStudentLevel: (level) => set({ studentLevel: level }),

            // Toggle proactive hints
            toggleProactiveHints: () => set(state => ({
                proactiveHints: !state.proactiveHints
            })),

            // Toggle detail mode
            toggleDetailMode: () => set(state => ({
                detailMode: !state.detailMode
            })),

            // Clear conversation history
            clearHistory: () => set({ messages: [] }),

            // Get last 5 exchanges for conversation context
            getConversationContext: () => {
                const { messages } = get();
                const recent = messages.slice(-10); // Last 10 messages (5 exchanges)

                return recent
                    .map(m => `${m.role === 'user' ? 'Student' : 'Tutor'}: ${m.content}`)
                    .join('\n');
            }
        }),
        {
            name: 'tutor-storage',
            partialize: (state) => ({
                studentLevel: state.studentLevel,
                proactiveHints: state.proactiveHints,
                // Don't persist messages - start fresh each session
            })
        }
    )
);
