import express from 'express';
import { createNodeMiddleware } from '@octokit/webhooks';
import pkg from '@octokit/webhooks-methods';
import { App } from 'octokit';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const { Webhooks } = pkg;

const octokitApp = new App({
  appId: process.env.APP_ID,
  privateKey: process.env.PRIVATE_KEY,
  oauth: {
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
  },
  webhooks: {
    secret: process.env.WEBHOOK_SECRET,
  },
});

const webhooks = new Webhooks({
  secret: process.env.WEBHOOK_SECRET,
});

webhooks.on("push", async ({ payload }) => {
  const repo = payload.repository.full_name;
  const pusher = payload.pusher.name;
  console.log(`🚀 ${pusher} pushed to ${repo}`);
});

app.use(createNodeMiddleware(webhooks));

app.get("/", (_, res) => {
  res.send("🛠️ ForgeSoul Bot is alive.");
});

app.listen(PORT, () => {
  console.log(`🧠 ForgeSoul Bot running on port ${PORT}`);
});
