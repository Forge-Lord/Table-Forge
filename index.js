import express from "express";
import dotenv from "dotenv";
import { App } from "@octokit/app";
import { Webhooks, createNodeMiddleware } from "@octokit/webhooks";
import { Octokit } from "octokit";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// GitHub App setup
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

// Webhook handler
const webhooks = new Webhooks({
  secret: process.env.WEBHOOK_SECRET
});

webhooks.on("push", async ({ payload }) => {
  const owner = payload.repository.owner.name || payload.repository.owner.login;
  const repo = payload.repository.name;
  const installationId = payload.installation.id;

  console.log(`🛠️ ${payload.pusher.name} pushed to ${repo}`);

  try {
    const octokit = await octokitApp.getInstallationOctokit(installationId);

    const { data: readme } = await octokit.rest.repos.getContent({
      owner,
      repo,
      path: "README.md"
    });

    const updatedText = `## 🔥 ForgeSoul was here - ${new Date().toISOString()}`;
    const updatedContent = Buffer.from(updatedText).toString("base64");

    await octokit.rest.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: "README.md",
      message: "ForgeSoul: auto-edit test",
      content: updatedContent,
      sha: readme.sha
    });

    console.log(`✅ ForgeSoul updated README.md in ${owner}/${repo}`);
  } catch (err) {
    console.error("❌ ForgeSoul failed:", err.message);
  }
});

// GitHub webhook listener
app.use("/github-webhook", createNodeMiddleware(webhooks));

app.get("/", (_, res) => {
  res.send("ForgeSoul Bot is online and awaiting webhooks.");
});

app.listen(PORT, () => {
  console.log(`✅ ForgeSoul Bot running at http://localhost:${PORT}`);
});
