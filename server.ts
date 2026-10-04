import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { handleAIDispatchRequest } from './api-handler.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// API route for AI Dispatch Assistant with Maps Grounding
app.post('/api/ai-dispatch-assistant', async (req, res) => {
  try {
    const result = await handleAIDispatchRequest(req.body);
    res.json(result);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Internal Server Error';
    res.status(500).json({ error: msg });
  }
});

// Serve Vite production build static assets if exists
const distPath = path.resolve(__dirname, 'dist');
app.use(express.static(distPath));

app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(port, () => {
  console.log(`PaperTrack server listening on port ${port}`);
});
