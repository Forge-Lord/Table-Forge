// index.js
import express from "express";
import dotenv from "dotenv";
import { App } from "@octokit/app";
import { Webhooks, createNodeMiddleware } from "@octokit/webhooks";

dotenv.config();

const app = express();
const PORT = process.env.PORT;

// Fix escaped newline characters in PRIVATE_KEY
const FIXED_PRIVATE_KEY = process.env.PRIVATE_KEY.replace(/\\n/g, "\n");

// GitHub App setup
const octokitApp = new App({
  appId: process.env.APP_ID,
  privateKey: FIXED_PRIVATE_KEY,
  oauth: {
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET
  },
  webhooks: {
    secret: process.env.WEBHOOK_SECRET
  }
});

const webhooks = new Webhooks({
  secret: process.env.WEBHOOK_SECRET
});

// Confirm root and webhook GETs
app.get("/", (_, res) => {
  res.send("✅ ForgeSoul Bot is alive.");
});

app.get("/github-webhook", (_, res) => {
  res.send("✅ GitHub Webhook route is active.");
});

// Log POSTs to /github-webhook for diagnostics
app.post("/github-webhook", express.json(), (req, res, next) => {
  console.log("🔥 /github-webhook POST received");
  next();
});

// Webhook push event
webhooks.on("push", async ({ payload }) => {
  console.log("🔔 Push event received from GitHub");
  const repo = payload.repository.name;
  const owner = payload.repository.owner.login;
  const branch = payload.ref.replace("refs/heads/", "");
  const pusher = payload.pusher.name;

  console.log(`🛠️ Push detected: ${pusher} -> ${owner}/${repo} (${branch})`);

  try {
    const octokit = await octokitApp.getInstallationOctokit(process.env.INSTALLATION_ID);
    console.log("🔐 Octokit authenticated");

    const content = `# Witness Me\n🔥 Commit by ${pusher} on ${branch} at ${new Date().toISOString()}`;
    const path = ".forge/witness-me.md";

    await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path,
      message: `ForgeSoul Bot: Witnessed ${branch} push`,
      content: Buffer.from(content).toString("base64"),
      committer: {
        name: "ForgeSoul Bot",
        email: "bot@tableforge.app"
      },
      author: {
        name: "ForgeSoul Bot",
        email: "bot@tableforge.app"
      },
      branch
    });

    console.log(`✅ Committed: ${path}`);
  } catch (err) {
    console.error("❌ Commit failed:", err.message || err);
  }
});

// Bind webhook middleware
app.use("/github-webhook", createNodeMiddleware(webhooks));

// Start server
app.listen(PORT, () => {
  console.log(`✅ ForgeSoul Bot is live on http://localhost:${PORT}`);
});
