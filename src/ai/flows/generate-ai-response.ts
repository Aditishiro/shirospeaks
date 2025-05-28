
'use server';
/**
 * @fileOverview Generates an AI response.
 * - generateAiResponse - A function that handles AI response generation.
 */

import { z } from 'genkit';

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


export async function generateAiResponse(
  input: GenerateAiResponseInput
): Promise<GenerateAiResponseOutput> {
  // THIS IS THE VERY FIRST LINE OF THE SERVER ACTION
  console.log('[generateAiResponse SERVER ACTION] DIAGNOSTIC: Entered function. Input:', JSON.stringify(input));
  
  // --- DIAGNOSTIC MODIFICATION: Return a hardcoded response ---
  const diagnosticResponse = `DIAGNOSTIC: Received message: "${input.currentMessage}". This is a hardcoded server response.`;
  console.log('[generateAiResponse SERVER ACTION] DIAGNOSTIC: Returning hardcoded response:', diagnosticResponse);
  return { responseText: diagnosticResponse };
  // --- END DIAGNOSTIC MODIFICATION ---

  /* Original code (commented out for diagnostics)
  console.log('[generateAiResponse] Flow started. Input:', JSON.stringify(input, null, 2));

  if (!process.env.GOOGLE_GENAI_API_KEY) {
    const errorMsg = "[generateAiResponse] CRITICAL: GOOGLE_GENAI_API_KEY is not set in the environment for the flow.";
    console.error(errorMsg);
    return {
        responseText: "Server configuration error: AI service API key is missing. Please check server logs.",
    };
  }

  try {
    console.log(`[generateAiResponse] Attempting to generate response for: "${input.currentMessage}" using direct ai.generate()`);

    // Direct call to ai.generate for simplicity and robustness
    // Ensure 'ai' is correctly imported and initialized from '@/ai/genkit' if re-enabling
    // const { ai } = await import('@/ai/genkit'); // Dynamic import if needed, or static at top
    
    // Placeholder for ai object if not importing dynamically for test
    const ai = { generate: async (options: any) => { 
      console.log("[generateAiResponse] Mock ai.generate called with options:", options);
      // Simulate a delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      // Simulate a successful response
      // return { text: () => `Mocked AI response to: ${options.prompt}` }; 
      // Simulate an error or unexpected structure
      // return { text: () => null }; // Or throw new Error("Mock AI Error");
      return { text: `Mocked AI response to: ${options.prompt}`, candidates: [{finishReason: 'STOP'}] };
    }};


    const result = await ai.generate({
      prompt: `User message: "${input.currentMessage}". Respond briefly and directly.`,
      // model: 'googleai/gemini-1.5-flash-latest', // Model is set globally in genkit.ts or passed here
      // config: {}, // No special config needed for simple text generation
    });

    const responseText = result.text;

    console.log('[generateAiResponse] AI call completed. Raw result object:', JSON.stringify(result, null, 2));
    console.log('[generateAiResponse] Response text extracted:', responseText);

    if (typeof responseText !== 'string' || responseText.trim() === "") {
      console.warn("[generateAiResponse] AI response text was empty or not a string. Raw result was:", JSON.stringify(result));
      let diagnostics = "";
      if (result?.candidates?.[0]?.finishReason) {
        diagnostics += ` Finish Reason: ${result.candidates[0].finishReason}.`;
      }
      if (result?.candidates?.[0]?.finishMessage) {
        diagnostics += ` Finish Message: ${result.candidates[0].finishMessage}.`;
      }
      if (result?.usage) {
        diagnostics += ` Usage: ${JSON.stringify(result.usage)}.`;
      }
      return {
        responseText: `I received an unusual response from the AI. Please try rephrasing. ${diagnostics ? `(Diagnostics: ${diagnostics.trim()})` : ""}`,
      };
    }
    
    console.log("[generateAiResponse] Successfully processed response:", responseText);
    return { responseText };

  } catch (error: any) {
    console.error("[generateAiResponse] Error during ai.generate() call or processing. Name:", error.name, "Message:", error.message);
    if (error.stack) {
      console.error("[generateAiResponse] Error stack:", error.stack);
    }
    
    let errorDetails = "Could not stringify error object.";
    try {
        const errorProps = Object.getOwnPropertyNames(error);
        const customErrorDetails: Record<string, any> = { message: error.message, name: error.name };
        errorProps.forEach(prop => {
            if (prop !== 'stack' && prop !== 'message' && prop !== 'name') {
                customErrorDetails[prop] = error[prop];
            }
        });
        errorDetails = JSON.stringify(customErrorDetails, null, 2);
        console.error("[generateAiResponse] Stringified error details:", errorDetails);
    } catch (e) {
        console.error("[generateAiResponse] Could not stringify the full error object for logging. Basic message:", error.message);
    }
    
    if (error.message?.includes('API key not valid') || error.message?.includes('Invalid API key')) {
        return { responseText: "There seems to be an issue with the AI service configuration (API key). Please contact support." };
    }
    if (error.message?.includes('permission denied') || error.message?.includes('PermissionDenied')) {
        return { responseText: "There seems to be a permission issue with the AI service. Please check API key permissions and ensure the Gemini API is enabled for your project. Contact support if issues persist." };
    }
    if (error.message?.includes('Quota') || error.message?.includes('quota exceeded')) {
        return { responseText: "The AI service quota has been exceeded. Please try again later or check your quota limits." };
    }
    if (error.message?.includes('Billing account')) {
        return { responseText: "There might be an issue with the billing account associated with the AI service. Please verify your project's billing status." };
    }
    if (error.message?.includes('model is not supported')) {
        return { responseText: "The configured AI model may not be supported or available. Please check the model name." };
    }

    return {
      responseText: "I encountered an unexpected server issue processing your request. Please check server logs for details and try again in a moment.",
    };
  }
  */
}
