
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
  console.log('[generateAiResponse] Flow started with input message:', JSON.stringify(input.currentMessage));
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
  } catch (error) {
    console.error("[generateAiResponse] Error in flow:", error);
    // Check if the error object has more details, e.g., error.message
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    console.error("[generateAiResponse] Error details:", errorMessage);
    return {
      responseText: "I encountered an unexpected issue processing your request. Please try again in a moment.",
    };
  }
}

// Prompt definition that asks for structured output adhering to GenerateAiResponseOutputSchema
const generateAiResponsePrompt = ai.definePrompt({
  name: 'generateAiResponsePrompt',
  input: {schema: GenerateAiResponseInputSchema},
  output: {schema: GenerateAiResponseOutputSchema}, // Genkit will try to make the model's output fit this
  prompt: `You are LUMEN, an AI assistant for a neobank.
The user's latest message is: "{{currentMessage}}"

Consider the following conversation history (if any):
{{{conversationHistory}}}

Your task is to generate a direct, helpful, and conversational textual response to the user's current message.
Focus on providing the most relevant and concise textual answer. The output should be suitable for direct display to the user.`,
  // Removed explicit instructions for JSON output from the prompt text itself.
  // The output.schema will guide Genkit to expect a JSON structure like { "responseText": "..." }.
});

