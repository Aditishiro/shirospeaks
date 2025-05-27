
'use server';
/**
 * @fileOverview Generates an AI response.
 * - generateAiResponse - A function that handles AI response generation.
 */

import {ai} from '@/ai/genkit';
import {GenerateResult, z} from 'genkit';

// Input schema for the exported flow function (client-facing)
const GenerateAiResponseInputSchema = z.object({
  currentMessage: z.string().describe("The user's current message."),
});
export type GenerateAiResponseInput = z.infer<typeof GenerateAiResponseInputSchema>;

// Output schema for the exported flow function (client-facing)
const GenerateAiResponseOutputSchema = z.object({
  responseText: z
    .string()
    .describe("The AI's textual and conversational response to the current message."),
});
export type GenerateAiResponseOutput = z.infer<typeof GenerateAiResponseOutputSchema>;

// Define the prompt with minimal configuration
// No explicit input/output schema for the prompt itself to simplify Genkit interaction.
// Genkit will pass the input object to the handlebars template, 
// and we'll extract text from the GenerateResult.
const generateAiResponsePrompt = ai.definePrompt({
  name: 'generateAiResponsePrompt',
  prompt: `User message: "{{currentMessage}}". Respond briefly and directly.`,
});

export async function generateAiResponse(
  input: GenerateAiResponseInput
): Promise<GenerateAiResponseOutput> {
  console.log('[generateAiResponse] Flow started. Input:', JSON.stringify(input));

  try {
    console.log('[generateAiResponse] Calling simplified prompt...');
    
    // Call the prompt with the input object.
    // Genkit's definePrompt (without input/output schema) returns a function that
    // takes an object and returns Promise<GenerateResult>.
    const result: GenerateResult = await generateAiResponsePrompt(input);
    const responseText = result.text;

    console.log('[generateAiResponse] Prompt call completed. Response text:', responseText);

    if (typeof responseText !== 'string' || responseText.trim() === "") {
      console.warn("[generateAiResponse] AI response text was empty or not a string. Raw result:", JSON.stringify(result));
      return {
        responseText: "I received an unusual response format. Could you try rephrasing?",
      };
    }
    
    console.log("[generateAiResponse] Successfully processed response:", responseText);
    return { responseText };

  } catch (error: any) {
    console.error("[generateAiResponse] Error during prompt execution or processing. Name:", error.name, "Message:", error.message);
    if (error.stack) {
      console.error("[generateAiResponse] Error stack:", error.stack);
    }
    let errorDetails = "Could not stringify error.";
    try {
      errorDetails = JSON.stringify(error, Object.getOwnPropertyNames(error), 2);
      console.error("[generateAiResponse] Stringified error details:", errorDetails);
    } catch (e) {
      console.error("[generateAiResponse] Could not stringify the full error object for logging. Message:", error.message);
    }
    
    // Check for specific Genkit/Google AI error patterns if possible
    if (error.message && error.message.includes('API key not valid')) {
        return {
            responseText: "There seems to be an issue with the AI service configuration (API key). Please contact support.",
        };
    }
     if (error.message && error.message.includes('permission')) {
        return {
            responseText: "There seems to be a permission issue with the AI service. Please contact support.",
        };
    }
    if (error.message && error.message.includes('Quota')) {
        return {
            responseText: "The AI service quota has been exceeded. Please try again later.",
        };
    }


    return {
      responseText: "I encountered an unexpected server issue processing your request. Please try again in a moment.",
    };
  }
}
