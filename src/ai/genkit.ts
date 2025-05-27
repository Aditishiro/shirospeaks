
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

const googleApiKey = process.env.GOOGLE_GENAI_API_KEY;

if (!googleApiKey) {
  // This will cause the server to fail loudly if the key isn't set,
  // which is helpful for debugging.
  console.error(
    'FATAL ERROR: GOOGLE_GENAI_API_KEY is not set in environment variables. ' +
    'Please ensure it is defined in your .env file and that .env is loaded correctly by your server/Genkit process.'
  );
  throw new Error(
    'GOOGLE_GENAI_API_KEY is not set. The application cannot start without it.'
  );
}

export const ai = genkit({
  plugins: [googleAI({apiKey: googleApiKey})],
  model: 'googleai/gemini-1.5-flash-latest',
});
