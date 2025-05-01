import express from "express";
import dotenv from "dotenv";
import { App } from "@octokit/app";
import { Webhooks, createNodeMiddleware } from "@octokit/webhooks";
import { Octokit } from "@octokit/rest";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Fix line breaks in Render secrets
const FIXED_PRIVATE_KEY = process.env.PRIVATE_KEY.replace(/\\n/g, '\n');

// Octokit App Setup
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

// Webhooks
const webhooks = new Webhooks({
  secret: process.env.WEBHOOK_SECRET
});

// Push event logic
webhooks.on("push", async ({ payload }) => {
  const repo = payload.repository.name;
  const owner = payload.repository.owner.login;
  const branch = payload.ref.replace("refs/heads/", "");
  const pusher = payload.pusher.name;

  console.log(`🔥 Push received from ${pusher} on ${owner}/${repo} [${branch}]`);

  try {
    const octokit = await octokitApp.getInstallationOctokit(process.env.INSTALLATION_ID);

    const path = ".forge/witness-me.md";
    const content = `# Witness Me\n🔥 Commit by ${pusher} to \`${branch}\` at ${new Date().toISOString()}`;

    await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path,
      message: `ForgeSoul Bot: Commit detected on ${branch}`,
      content: Buffer.from(content).toString("base64"),
      committer: { name: "ForgeSoul Bot", email: "bot@tableforge.app" },
      author: { name: "ForgeSoul Bot", email: "bot@tableforge.app" },
      branch
    });

    console.log(`✅ File committed to ${repo}/${branch} at ${path}`);
  } catch (error) {
    console.error("❌ Commit failed:", error.message || error);
  }
});

// Route for GitHub webhook POSTs
app.use("/github-webhook", express.json(), createNodeMiddleware(webhooks));

// Diagnostic routes
app.get("/", (_, res) => res.send("✅ ForgeSoul Bot is running"));
app.get("/github-webhook", (_, res) => res.send("✅ GitHub webhook route is active"));

app.listen(PORT, () => {
  console.log(`✅ ForgeSoul Bot is live on http://localhost:${PORT}`);
});
