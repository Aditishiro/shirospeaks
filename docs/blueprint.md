# **App Name**: LUMEN AI Assistant MVP

## Core Features:

- Chat Interface: A chat interface for users to interact with LUMEN.
- AI Response Generation: Generate responses to user messages using the OpenAI API, incorporating intent detection, tone modulation, and knowledge retrieval using a tool to adapt when these should be done or not.
- Feedback Mechanism: Allow users to provide feedback on Lumen's responses using thumbs up/down.
- Smart Suggestions: Display suggested actions based on the conversation context.
- Memory Engine: Provides hints or reminders based on past conversations. This feature allows users to resume previous conversations.
- Message history: Display recent and past conversations to enable the Memory Engine tool. Uses a container directly to a Firestore subcollection to display /conversations/{conversationId}/messages

## Style Guidelines:

- Primary color: A muted blackto convey trust and stability, aligning with the financial context of neobanking.
- Background color: Light gray (#F0F0F0) to create a clean and professional look. Offers enough contrast to reduce eye strain and complement the primary color.
- Accent color: gradient lavender and orange  (#9999CC) to add a touch of innovation and sophistication. It contrasts mildly to bring some actions to the foreground.
- Clean, sans-serif font for readability and a modern feel.
- Simple, professional icons for clear navigation.
- Clean, intuitive layout with clear information hierarchy.
- Subtle animations for feedback and loading states.