
'use server';
/**
 * @fileOverview Generates an AI response.
 * - generateAiResponse - A function that handles AI response generation.
 */

import { ai } from '@/ai/genkit'; // Ensure ai is imported from your genkit setup
import { z } from 'genkit';

// Input schema for the exported flow function (client-facing)
const GenerateAiResponseInputSchema = z.object({
  currentMessage: z.string().describe("The user's current message."),
  // conversationHistory: z.string().optional().describe("The history of the conversation so far."),
});
export type GenerateAiResponseInput = z.infer<typeof GenerateAiResponseInputSchema>;

// Output schema for the exported flow function (client-facing)
const GenerateAiResponseOutputSchema = z.object({
  responseText: z
    .string()
    .describe("The AI's textual and conversational response to the current message."),
});
export type GenerateAiResponseOutput = z.infer<typeof GenerateAiResponseOutputSchema>;


export async function generateAiResponse(
  input: GenerateAiResponseInput
): Promise<GenerateAiResponseOutput> {
  console.log('[generateAiResponse SERVER ACTION] Flow function CALLED. Input:', JSON.stringify(input));

  if (!process.env.GOOGLE_GENAI_API_KEY) {
    const errorMsg = "[generateAiResponse SERVER ACTION] CRITICAL: GOOGLE_GENAI_API_KEY is not set in the environment for the flow.";
    console.error(errorMsg);
    // Consider also logging this to a more persistent store in a real app
    return {
        responseText: "Server configuration error: AI service API key is missing. Please contact support.",
    };
  }
  
  try {
    console.log(`[generateAiResponse SERVER ACTION] Attempting to generate response for: "${input.currentMessage}"`);
    
    // Simplified direct call to ai.generate
    const result = await ai.generate({
      prompt: `User message: "${input.currentMessage}". Respond briefly and directly as a helpful AI assistant.`,
      // model: 'googleai/gemini-1.5-flash-latest', // Model is set globally in genkit.ts or passed here
      // config: {}, // No special config needed for simple text generation
    });

    const responseText = result.text; // Using .text directly based on Genkit v1.x syntax

    console.log('[generateAiResponse SERVER ACTION] AI call completed. Raw result object:', JSON.stringify(result, null, 2));
    console.log('[generateAiResponse SERVER ACTION] Response text extracted:', responseText);

    if (typeof responseText !== 'string' || responseText.trim() === "") {
      console.warn("[generateAiResponse SERVER ACTION] AI response text was empty or not a string. Raw result was:", JSON.stringify(result));
      let diagnostics = "";
      if (result?.candidates?.[0]?.finishReason) {
        diagnostics += ` Finish Reason: ${result.candidates[0].finishReason}.`;
      }
      // Add other diagnostic info as needed
      return {
        responseText: `I received an unusual response from the AI. Please try rephrasing. ${diagnostics ? `(Diagnostics: ${diagnostics.trim()})` : ""}`,
      };
    }
    
    console.log("[generateAiResponse SERVER ACTION] Successfully processed response:", responseText);
    return { responseText };

  } catch (error: any) {
    console.error("[generateAiResponse SERVER ACTION] Error during ai.generate() call or processing. Name:", error.name, "Message:", error.message);
    if (error.stack) {
      console.error("[generateAiResponse SERVER ACTION] Error stack:", error.stack);
    }
    
    // Attempt to stringify more error details
    let errorDetails = "Could not stringify error object.";
    try {
        const errorProps = Object.getOwnPropertyNames(error);
        const customErrorDetails: Record<string, any> = { message: error.message, name: error.name };
        errorProps.forEach(prop => {
            if (prop !== 'stack' && prop !== 'message' && prop !== 'name') { // Avoid duplicating common props or large ones like stack
                customErrorDetails[prop] = error[prop];
            }
        });
        errorDetails = JSON.stringify(customErrorDetails, null, 2);
        console.error("[generateAiResponse SERVER ACTION] Stringified error details:", errorDetails);
    } catch (e) {
        console.error("[generateAiResponse SERVER ACTION] Could not stringify the full error object for logging. Basic message:", error.message);
    }
    
    // Specific error messages based on common issues
    if (error.message?.includes('API key not valid') || error.message?.includes('Invalid API key')) {
        return { responseText: "There seems to be an issue with the AI service configuration (API key). Please contact support." };
    }
    if (error.message?.includes('permission denied') || error.message?.includes('PermissionDenied')) {
        // This can be key permissions or API not enabled
        return { responseText: "There seems to be a permission issue with the AI service. Please check API key permissions and ensure the Generative Language API (or Vertex AI API) is enabled for your project, and that billing is active. Contact support if issues persist." };
    }
    if (error.message?.includes('Quota') || error.message?.includes('quota exceeded')) {
        return { responseText: "The AI service quota has been exceeded. Please try again later or check your quota limits." };
    }
     if (error.message?.includes('Billing account') || error.message?.includes('billing account')) {
        return { responseText: "There might be an issue with the billing account associated with the AI service. Please verify your project's billing status." };
    }
    if (error.message?.includes('model is not supported') || error.message?.includes('model not found')) {
        return { responseText: "The configured AI model may not be supported or available. Please check the model name." };
    }
    // Generic fallback
    return {
      responseText: "I encountered an unexpected server issue while trying to get a response. Please check server logs for details and try again in a moment.",
    };
  }
}
