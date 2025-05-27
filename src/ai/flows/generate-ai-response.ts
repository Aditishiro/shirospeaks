
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
  console.log('[generateAiResponse] Flow started. Input currentMessage:', JSON.stringify(input.currentMessage));
  // Log the full input being sent to the prompt for detailed debugging
  console.log('[generateAiResponse] Full input for prompt:', JSON.stringify(input, null, 2));

  try {
    console.log('[generateAiResponse] Calling generateAiResponsePrompt...');
    const {output} = await generateAiResponsePrompt(input);
    console.log('[generateAiResponse] Received raw output from prompt call:', JSON.stringify(output));

    if (!output || typeof output.responseText !== 'string' || output.responseText.trim() === "") {
      console.warn("[generateAiResponse] AI response was empty, invalid, or not a string. Output was:", JSON.stringify(output), "Returning fallback.");
      return {
        responseText: "I seem to be having trouble formulating a full response. Could you try rephrasing or asking something different?",
      };
    }
    console.log("[generateAiResponse] Successfully processed response:", output.responseText);
    return output;
  } catch (error: any) {
    console.error("[generateAiResponse] Error in flow. Full error object:", error);
    // Log specific properties if they exist
    if (error && error.message) {
      console.error("[generateAiResponse] Error message:", error.message);
    }
    if (error && error.stack) {
      console.error("[generateAiResponse] Error stack:", error.stack);
    }
    // Attempt to stringify the error if it's an object, for more details
    try {
      console.error("[generateAiResponse] Stringified error:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
    } catch (e) {
      console.error("[generateAiResponse] Could not stringify error object.");
    }
    
    return {
      responseText: "I encountered an unexpected issue processing your request. Please try again in a moment.",
    };
  }
}

// Simplified prompt for diagnostics
const generateAiResponsePrompt = ai.definePrompt({
  name: 'generateAiResponsePrompt',
  input: {schema: GenerateAiResponseInputSchema},
  output: {schema: GenerateAiResponseOutputSchema},
  prompt: `User's message: "{{currentMessage}}"
Conversation history:
{{{conversationHistory}}}

Provide a concise textual response.`,
});
