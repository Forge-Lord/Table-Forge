import express from "express";
import dotenv from "dotenv";
import { App } from "@octokit/app";
import { Webhooks, createNodeMiddleware } from "@octokit/webhooks";
import { Octokit } from "@octokit/rest";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize GitHub App auth
const octokitApp = new App({
  appId: process.env.APP_ID,
  privateKey: process.env.PRIVATE_KEY,
  oauth: {
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET
  },
  webhooks: { secret: process.env.WEBHOOK_SECRET }
});

const webhooks = new Webhooks({
  secret: process.env.WEBHOOK_SECRET
});

webhooks.on("push", async ({ payload }) => {
  const repo = payload.repository.full_name;
  const pusher = payload.pusher.name;
  console.log(`🛠️ ${pusher} pushed to ${repo}`);

  // Authenticate as the GitHub App installation
  const installationId = process.env.INSTALLATION_ID;
  const octokit = await octokitApp.getInstallationOctokit(Number(installationId));

  try {
    const content = `# Witness Me\nThis file was created by ForgeSoul Bot.\n\n🔥 You have been noticed.`;
    const path = ".forge/witness-me.md";
    const owner = "Forge-Lord";
    const repoName = "Table-Forge";

    await octokit.rest.repos.createOrUpdateFileContents({
      owner,
      repo: repoName,
      path,
      message: "🤖 ForgeSoul Bot manifests .forge/witness-me.md",
      content: Buffer.from(content).toString("base64"),
      committer: {
        name: "ForgeSoul Bot",
        email: "bot@tableforge.app"
      },
      author: {
        name: "ForgeSoul Bot",
        email: "bot@tableforge.app"
      },
      branch: payload.ref.replace("refs/heads/", "")
    });

    console.log("✅ File created successfully.");
  } catch (error) {
    console.error("❌ Failed to create file:", error);
  }
});

app.use("/github-webhook", createNodeMiddleware(webhooks));

app.get("/", (_, res) => {
  res.send("ForgeSoul Bot is online and awaiting webhooks.");
});

app.listen(PORT, () => {
  console.log(`✅ ForgeSoul Bot running at http://localhost:${PORT}`);
});
