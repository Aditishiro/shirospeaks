
'use server';
/**
 * @fileOverview Generates an AI response.
 *
 * - generateAiResponse - A function that handles AI response generation.
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
  return generateAiResponseFlow(input);
}

// New prompt definition that asks for plain text output
const plainTextPrompt = ai.definePrompt({
  name: 'generateAiResponsePlainTextPrompt',
  input: {schema: GenerateAiResponseInputSchema},
  // No output schema here, model will return plain text.
  prompt: `You are LUMEN, an AI assistant for a neobank.
The user's latest message is: "{{currentMessage}}"

Consider the following conversation history:
{{{conversationHistory}}}

Your task is to generate a direct, helpful, and conversational textual response to the user's current message. This response should directly address their query or statement.
ONLY provide the textual response. Do not include any other information or formatting.
`,
});

const generateAiResponseFlow = ai.defineFlow(
  {
    name: 'generateAiResponseFlow',
    inputSchema: GenerateAiResponseInputSchema,
    outputSchema: GenerateAiResponseOutputSchema, // The flow still adheres to this output schema
  },
  async input => {
    // Call the plain text prompt
    const llmResponse = await plainTextPrompt(input);
    const textOutput = llmResponse.text;

    if (!textOutput || textOutput.trim() === "") {
      // Fallback in case the LLM fails to generate a valid textual response
      return {
        responseText: "I'm sorry, I had trouble formulating a response. Could you try rephrasing?",
      };
    }
    // Manually construct the expected output object
    return { responseText: textOutput };
  }
);

