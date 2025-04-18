import express from "express";
import dotenv from "dotenv";
import { App } from "@octokit/app";
import { Webhooks, createNodeMiddleware } from "@octokit/webhooks";
import { Octokit } from "@octokit/rest";

dotenv.config();

const app = express();
// ✅ Must use Render's assigned port
const PORT = process.env.PORT;

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

const webhooks = new Webhooks({
  secret: process.env.WEBHOOK_SECRET
});

webhooks.on("push", async ({ payload }) => {
  const repo = payload.repository.name;
  const owner = payload.repository.owner.login;
  const pusher = payload.pusher.name;
  const branch = payload.ref.replace("refs/heads/", "");

  console.log(`🛠️ ${pusher} pushed to ${owner}/${repo} on ${branch}`);

  try {
    const octokit = await octokitApp.getInstallationOctokit(process.env.INSTALLATION_ID);
    console.log("🔐 Installation Octokit authenticated.");

    const content = `# Witness Me\nThis file was created by ForgeSoul Bot.\n\n🔥 You have been noticed.`;
    const path = ".forge/witness-me.md";

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

    console.log(`✅ File committed successfully: ${path}`);
  } catch (error) {
    console.error("❌ Commit failed:", error.message || error);
  }
});

// Webhook Endpoint
app.use("/github-webhook", createNodeMiddleware(webhooks));

// Simple Landing
app.get("/", (_, res) => {
  res.send("ForgeSoul Bot is online and awaiting webhooks.");
});

app.listen(PORT, () => {
  console.log(`✅ ForgeSoul Bot running at http://localhost:${PORT}`);
});
