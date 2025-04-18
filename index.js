// botsoul/index.js

import express from 'express';
import { createNodeMiddleware } from '@octokit/webhooks';
import { Webhooks } from '@octokit/webhooks';
import { App } from 'octokit';

const app = express();
const PORT = process.env.PORT || 3000;

// Create GitHub App instance
const octokitApp = new App({
  appId: process.env.APP_ID,
  privateKey: process.env.PRIVATE_KEY,
  oauth: { clientId: process.env.CLIENT_ID, clientSecret: process.env.CLIENT_SECRET },
  webhooks: {
    secret: process.env.WEBHOOK_SECRET
  }
});

const webhooks = new Webhooks({
  secret: process.env.WEBHOOK_SECRET
});

webhooks.on("push", async ({ payload, octokit }) => {
  const repo = payload.repository.full_name;
  const pusher = payload.pusher.name;
  console.log(`🚀 ${pusher} pushed to ${repo}`);
  // You can expand this later with auto-commits, PRs, bot logic, etc.
});

app.use(createNodeMiddleware(webhooks));

app.get("/", (_, res) => {
  res.send("🛠️ ForgeSoul Bot is alive.");
});

app.listen(PORT, () => console.log(`🧠 ForgeSoul Bot running on port ${PORT}`));
