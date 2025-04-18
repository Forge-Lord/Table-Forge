import express from 'express';
import { App } from '@octokit/app';
import { Webhooks } from '@octokit/webhooks-methods';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const webhooks = new Webhooks({
  secret: process.env.WEBHOOK_SECRET,
});

const octokitApp = new App({
  appId: process.env.APP_ID,
  privateKey: process.env.PRIVATE_KEY,
  oauth: {
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
  },
  webhooks,
});

webhooks.on('push', ({ payload }) => {
  console.log(`🚀 ${payload.pusher.name} pushed to ${payload.repository.full_name}`);
});

app.use(express.json());

app.post('/webhooks', async (req, res) => {
  try {
    await webhooks.verifyAndReceive({
      id: req.headers['x-github-delivery'],
      name: req.headers['x-github-event'],
      signature: req.headers['x-hub-signature-256'],
      payload: req.body,
    });
    res.status(200).send('Webhook received');
  } catch (err) {
    console.error('Webhook error:', err);
    res.status(400).send('Invalid signature');
  }
});

app.get('/', (_, res) => {
  res.send('🧠 ForgeSoul Bot is alive.');
});

app.listen(PORT, () => console.log(`✅ ForgeSoul Bot running on port ${PORT}`));
