
'use server';
/**
 * @fileOverview Generates an AI response.
 * - generateAiResponse - A function that handles AI response generation.
 */

import {ai} from '@/ai/genkit';
import {z, type GenerateResult} from 'genkit';

// Simplified Input Schema - only currentMessage
const GenerateAiResponseInputSchema = z.object({
  currentMessage: z.string().describe("The user's current message."),
});
type GenerateAiResponseInput = z.infer<typeof GenerateAiResponseInputSchema>;

const GenerateAiResponseOutputSchema = z.object({
  responseText: z
    .string()
    .describe("The AI's textual and conversational response to the current message."),
});
type GenerateAiResponseOutput = z.infer<typeof GenerateAiResponseOutputSchema>;

const AI_PROMPT_SERVER_TIMEOUT_MS = 25000; // 25 seconds server-side timeout for the prompt call

export async function generateAiResponse(
  input: GenerateAiResponseInput
): Promise<GenerateAiResponseOutput> {
  console.log('[generateAiResponse] Flow started. Input currentMessage:', JSON.stringify(input.currentMessage));
  // Log the full input being sent to the prompt for detailed debugging
  console.log('[generateAiResponse] Full input for prompt (simplified):', JSON.stringify(input, null, 2));

  try {
    console.log(`[generateAiResponse] Preparing to call simplified prompt with a ${AI_PROMPT_SERVER_TIMEOUT_MS / 1000}s server-side timeout...`);
    
    const promptTask = generateAiResponsePrompt(input);
    
    const timeoutTask = new Promise<never>((_, reject) => // This promise will always reject if the timeout is hit
      setTimeout(() => {
        console.warn('[generateAiResponse] Server-side timeout triggered for AI prompt call.');
        reject(new Error('SERVER_PROMPT_TIMEOUT'));
      }, AI_PROMPT_SERVER_TIMEOUT_MS)
    );

    // Race the prompt call against the timeout
    // @ts-ignore Genkit's prompt function return type can be complex to align perfectly with Promise.race here
    const resultFromRace = await Promise.race([promptTask, timeoutTask]);
    
    // If promptTask resolved, resultFromRace is its result.
    // If timeoutTask rejected, the catch block below will be executed.
    // @ts-ignore
    const output = resultFromRace.output; // Accessing the structured output
    
    console.log('[generateAiResponse] Prompt call completed successfully (did not time out on server).');
    console.log('[generateAiResponse] Received raw output from prompt call:', JSON.stringify(output));

    if (!output || typeof output.responseText !== 'string' || output.responseText.trim() === "") {
      console.warn("[generateAiResponse] AI response was empty, invalid, or not a string after successful call. Output was:", JSON.stringify(output), "Returning fallback.");
      return {
        responseText: "I seem to be having trouble formulating a full response. Could you try rephrasing or asking something different?",
      };
    }
    console.log("[generateAiResponse] Successfully processed response:", output.responseText);
    return output;

  } catch (error: any) {
    console.error("[generateAiResponse] Error in flow's main try/catch. Full error object name:", error.name, "message:", error.message);
    
    if (error.message === 'SERVER_PROMPT_TIMEOUT') {
      // This case is specifically for our server-side timeout
      return {
        responseText: "Sorry, the AI took too long to respond from the server. Please try again.",
      };
    }
    
    // Log other specific error properties if they exist
    if (error.stack) {
      console.error("[generateAiResponse] Error stack:", error.stack);
    }
    try {
      // Attempt to stringify the error for more details, handling potential circular references
      const errorDetails = JSON.stringify(error, Object.getOwnPropertyNames(error), 2);
      console.error("[generateAiResponse] Stringified error details:", errorDetails);
    } catch (e) {
      console.error("[generateAiResponse] Could not stringify the full error object. Message:", error.message);
    }
    
    // Generic fallback for other errors
    return {
      responseText: "I encountered an unexpected issue processing your request on the server. Please try again in a moment.",
    };
  }
}

// Drastically simplified prompt for diagnostics
const generateAiResponsePrompt = ai.definePrompt({
  name: 'generateAiResponsePrompt',
  input: {schema: GenerateAiResponseInputSchema}, // Uses the simplified input schema
  output: {schema: GenerateAiResponseOutputSchema},
  prompt: `User said: "{{currentMessage}}". Respond very briefly.`, // Very simple prompt, no history
});
