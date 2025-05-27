
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

const prompt = ai.definePrompt({
  name: 'generateAiResponsePrompt',
  input: {schema: GenerateAiResponseInputSchema},
  output: {schema: GenerateAiResponseOutputSchema},
  prompt: `You are LUMEN, an AI assistant for a neobank.
The user's latest message is: "{{currentMessage}}"

Consider the following conversation history:
{{{conversationHistory}}}

Your task is to generate a direct, helpful, and conversational textual response to the user's current message. This response should directly address their query or statement.

Respond strictly in the JSON format specified by the output schema, ensuring the 'responseText' field contains your full conversational answer.
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
    if (!output || !output.responseText) {
      // Fallback in case the LLM fails to generate valid structured output
      return {
        responseText: "I'm sorry, I had trouble formulating a full response. Could you try rephrasing?",
      };
    }
    return output;
  }
);
