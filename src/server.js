import express from 'express';
import { createSession } from './sessions.js';
import { castVote } from './votes.js';

const app = express();

app.use(express.json());
app.use(express.static('public'));

app.post('/api/sessions', (req, res) => {
  const { title, items } = req.body;
  const result = createSession(title, items);

  if (result.error) {
    return res.status(result.status).json({ success: false, error: result.error });
  }

  return res.status(200).json({ success: true, data: result.data });
});

app.post('/api/sessions/:code/votes', (req, res) => {
  const { voterName, allocations } = req.body;
  const result = castVote(req.params.code, voterName, allocations);

  if (result.error) {
    return res.status(result.status).json({ success: false, error: result.error });
  }

  return res.status(200).json({ success: true, data: result.data });
});

const PORT = process.env.PORT || 3000;

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'))) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

export default app;
