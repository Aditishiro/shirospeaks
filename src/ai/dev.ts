import { config } from 'dotenv';
config();

import '@/ai/flows/generate-initial-prompt.ts';
import '@/ai/flows/summarize-conversation.ts';
import '@/ai/flows/generate-ai-response.ts'; // Updated from suggest-follow-up-actions.ts
