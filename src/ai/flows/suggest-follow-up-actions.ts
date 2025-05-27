'use server';

/**
 * @fileOverview Suggests relevant follow-up actions based on the current conversation.
 *
 * Exports:
 * - suggestFollowUpActions: A function that suggests follow-up actions.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestFollowUpActionsInputSchema = z.object({
  conversationHistory: z
    .string()
    .describe('The history of the conversation as a single string.'),
});
type SuggestFollowUpActionsInput = z.infer<
  typeof SuggestFollowUpActionsInputSchema
>;

const SuggestFollowUpActionsOutputSchema = z.object({
  suggestedActions: z
    .array(z.string())
    .describe('An array of suggested follow-up actions.'),
});
type SuggestFollowUpActionsOutput = z.infer<
  typeof SuggestFollowUpActionsOutputSchema
>;

export async function suggestFollowUpActions(
  input: SuggestFollowUpActionsInput
): Promise<SuggestFollowUpActionsOutput> {
  return suggestFollowUpActionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestFollowUpActionsPrompt',
  input: {schema: SuggestFollowUpActionsInputSchema},
  output: {schema: SuggestFollowUpActionsOutputSchema},
  prompt: `You are LUMEN, an AI assistant for a neobank. Based on the following conversation history, suggest three relevant follow-up actions the user might want to take. Return the suggestions as an array of strings.

Conversation History:
{{{conversationHistory}}}

Suggested Actions:`, // Ensure correct Handlebars usage
});

const suggestFollowUpActionsFlow = ai.defineFlow(
  {
    name: 'suggestFollowUpActionsFlow',
    inputSchema: SuggestFollowUpActionsInputSchema,
    outputSchema: SuggestFollowUpActionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
