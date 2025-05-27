'use server';
/**
 * @fileOverview Generates an AI response including text and suggested actions.
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
  suggestedActions: z
    .array(z.string())
    .describe(
      'An array of up to three relevant follow-up actions based on the response and conversation.'
    ),
});
type GenerateAiResponseOutput = z.infer<typeof GenerateAiResponseOutputSchema>;

export async function generateAiResponse(
  input: GenerateAiResponseInput
): Promise<GenerateAiResponseOutput> {
  return generateAiResponseFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateAiResponsePrompt',
  input: {schema: GenerateAiResponseInputSchema},
  output: {schema: GenerateAiResponseOutputSchema},
  prompt: `You are LUMEN, an AI assistant for a neobank.
The user's latest message is: "{{currentMessage}}"

Consider the following conversation history:
{{{conversationHistory}}}

Your task is:
1. Generate a direct, helpful, and conversational textual response to the user's current message. This response should directly address their query or statement.
2. After crafting the response, suggest up to three relevant follow-up actions the user might want to take. These suggestions should be concise and directly related to the current context of the conversation and your response.

Respond strictly in the JSON format specified by the output schema. Ensure 'responseText' contains your full conversational answer and 'suggestedActions' is an array of strings. If no specific actions are highly relevant, provide a smaller number of suggestions or an empty array for suggestedActions.
`,
});

const generateAiResponseFlow = ai.defineFlow(
  {
    name: 'generateAiResponseFlow',
    inputSchema: GenerateAiResponseInputSchema,
    outputSchema: GenerateAiResponseOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output) {
      // Fallback in case the LLM fails to generate valid structured output
      return {
        responseText: "I'm sorry, I had trouble formulating a full response. Could you try rephrasing?",
        suggestedActions: ["Ask a different question", "Check account balance", "View transaction history"],
      };
    }
    // Ensure suggestedActions is always an array, even if the LLM omits it or sends null
    return {
        ...output,
        suggestedActions: output.suggestedActions || [], 
    };
  }
);
