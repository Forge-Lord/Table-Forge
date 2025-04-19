import express from "express";
import dotenv from "dotenv";
import { App } from "@octokit/app";
import { Webhooks, createNodeMiddleware } from "@octokit/webhooks";
import { Octokit } from "@octokit/rest";
import bodyParser from "body-parser";

dotenv.config();

const app = express();
const PORT = process.env.PORT;

// Enable body parsing
app.use(bodyParser.json());

// GitHub App Setup
const octokitApp = new App({
  appId: process.env.APP_ID,
  privateKey: process.env.PRIVATE_KEY,
  oauth: {
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET
  },
  webhooks: {
    secret: process.env.WEBHOOK_SECRET
  }
});

// Webhooks
const webhooks = new Webhooks({
  secret: process.env.WEBHOOK_SECRET
});

// Push Event Logic
webhooks.on("push", async ({ payload }) => {
  const repo = payload.repository.name;
  const owner = payload.repository.owner.login;
  const pusher = payload.pusher.name;
  const branch = payload.ref.replace("refs/heads/", "");

  console.log(`🛠️ ${pusher} pushed to ${owner}/${repo} on ${branch}`);

  try {
    const octokit = await octokitApp.getInstallationOctokit(process.env.INSTALLATION_ID);
    console.log("🔐 Octokit authenticated.");

    const path = ".forge/witness-me.md";
    const content = `# Witness Me\nThis file was created by ForgeSoul Bot.\n\n🔥 You have been noticed.`;

    await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path,
      message: "ForgeSoul Bot: Added witness-me file",
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

    console.log(`✅ Committed ${path} to ${branch}`);
  } catch (err) {
    console.error("❌ Error committing file:", err.message);
    if (err.response) {
      console.error("GitHub Error:", err.response.data);
    }
  }
});

// Manual POST hook log to make sure route fires
app.post("/github-webhook", (req, res, next) => {
  console.log("🔥 /github-webhook POST received");
  next();
});

// ✅ Must come AFTER logging middleware
app.use("/github-webhook", createNodeMiddleware(webhooks));

// GET for debugging route
app.get("/github-webhook", (_, res) => {
  res.send("🛠️ GitHub Webhook is active.");
});

// Root test page
app.get("/", (_, res) => {
  res.send("ForgeSoul Bot is online.");
});

// Start
app.listen(PORT, () => {
  console.log(`✅ ForgeSoul Bot running at http://localhost:${PORT}`);
});
