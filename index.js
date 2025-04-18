import express from 'express';
import { createNodeMiddleware } from '@octokit/webhooks';
import { Webhooks } from '@octokit/webhooks';

const app = express();
const PORT = process.env.PORT || 3000;

const webhooks = new Webhooks({
  secret: process.env.WEBHOOK_SECRET
});

webhooks.on("push", async ({ payload }) => {
  const repo = payload.repository.full_name;
  const pusher = payload.pusher.name;
  console.log(`🚀 ${pusher} pushed to ${repo}`);
});

// IMPORTANT: Route webhook to correct path
app.use('/github-webhook', createNodeMiddleware(webhooks));

// Simple test route
app.get("/", (_, res) => {
  res.send("🛠️ ForgeSoul Bot is alive.");
});

app.listen(PORT, () => console.log(`🧠 ForgeSoul Bot running on port ${PORT}`));
