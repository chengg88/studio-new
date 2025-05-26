import {genkit} from 'genkit';
// import {googleAI} from '@genkit-ai/googleai'; // Removed googleAI plugin

export const ai = genkit({
  promptDir: './prompts',
  plugins: [
    // googleAI({ // Removed googleAI plugin
    //   apiKey: process.env.GOOGLE_GENAI_API_KEY,
    // }),
  ],
  // model: 'googleai/gemini-2.0-flash', // Model configuration might need adjustment if no plugins provide it
});
