
'use server';
/**
 * @fileOverview Generates an AI response.
 *
 * - generateAiResponse - A function that handles AI response generation.
 * - GenerateAiResponseInput - The input type for the generateAiResponse function.
 * - GenerateAiResponseOutput - The return type for the generateAiResponse function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateAiResponseInputSchema = z.object({
  conversationHistory: z
    .string()
    .describe('The history of the conversation as a single string.'),
  currentMessage: z.string().describe("The user's current message."),
});
type GenerateAiResponseInput = z.infer<typeof GenerateAiResponseInputSchema>;

const GenerateAiResponseOutputSchema = z.object({
  responseText: z
    .string()
    .describe("The AI's textual and conversational response to the current message."),
});
type GenerateAiResponseOutput = z.infer<typeof GenerateAiResponseOutputSchema>;

export async function generateAiResponse(
  input: GenerateAiResponseInput
): Promise<GenerateAiResponseOutput> {
  console.log('[generateAiResponse] Flow started with input:', JSON.stringify(input.currentMessage)); // Log only current message for brevity
  try {
    console.log('[generateAiResponse] Calling generateAiResponsePrompt...');
    const {output} = await generateAiResponsePrompt(input);
    console.log('[generateAiResponse] Received output from prompt:', JSON.stringify(output));

    if (!output || !output.responseText || output.responseText.trim() === "") {
      console.warn("[generateAiResponse] AI response was empty or invalid, returning fallback.");
      return {
        responseText: "I seem to be having trouble formulating a full response. Could you try rephrasing?",
      };
    }
    console.log("[generateAiResponse] Successfully processed response.");
    return output;
  } catch (error) {
    console.error("[generateAiResponse] Error in flow:", error);
    return {
      responseText: "I encountered an unexpected issue. Please try again in a moment.",
    };
  }
}

// Prompt definition that asks for structured output adhering to GenerateAiResponseOutputSchema
const generateAiResponsePrompt = ai.definePrompt({
  name: 'generateAiResponsePrompt',
  input: {schema: GenerateAiResponseInputSchema},
  output: {schema: GenerateAiResponseOutputSchema},
  // TEMPORARILY SIMPLIFIED PROMPT FOR DEBUGGING:
  prompt: `You are LUMEN, an AI assistant. Respond to: "{{currentMessage}}". Your response should be a JSON object with a single key "responseText" containing your textual reply.`,
  // ORIGINAL PROMPT (commented out for now):
  // prompt: `You are LUMEN, an AI assistant for a neobank.
// The user's latest message is: "{{currentMessage}}"

// Consider the following conversation history:
// {{{conversationHistory}}}

// Your task is to generate a direct, helpful, and conversational textual response to the user's current message.
// Ensure your response strictly follows the output schema, providing only the 'responseText' field.
// `,
});

