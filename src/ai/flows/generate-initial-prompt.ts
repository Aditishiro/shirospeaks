'use server';

/**
 * @fileOverview Generates an initial prompt for new users to understand LUMEN's capabilities.
 *
 * Exports:
 * - generateInitialPrompt: A function that generates the initial prompt.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateInitialPromptInputSchema = z.void();
type GenerateInitialPromptInput = z.infer<typeof GenerateInitialPromptInputSchema>;

const GenerateInitialPromptOutputSchema = z.object({
  prompt: z.string().describe('A helpful starting prompt for new users.'),
});
type GenerateInitialPromptOutput = z.infer<typeof GenerateInitialPromptOutputSchema>;

export async function generateInitialPrompt(): Promise<GenerateInitialPromptOutput> {
  return generateInitialPromptFlow();
}

const prompt = ai.definePrompt({
  name: 'generateInitialPromptPrompt',
  input: {schema: GenerateInitialPromptInputSchema},
  output: {schema: GenerateInitialPromptOutputSchema},
  prompt: `You are LUMEN, an AI assistant specializing in financial guidance and neobanking.
  Generate a single helpful starting prompt for a new user who is unfamiliar with your capabilities.
  The prompt should be concise and encourage the user to explore LUMEN's features related to finance.
  Do not greet the user, just provide the starting prompt.
  `,
});

const generateInitialPromptFlow = ai.defineFlow(
  {
    name: 'generateInitialPromptFlow',
    inputSchema: GenerateInitialPromptInputSchema,
    outputSchema: GenerateInitialPromptOutputSchema,
  },
  async () => {
    const {output} = await prompt();
    return output!;
  }
);
