import express from "express";
import dotenv from "dotenv";
import { App } from "@octokit/app";
import { Webhooks, createNodeMiddleware } from "@octokit/webhooks";
import { Octokit } from "@octokit/rest";

dotenv.config();

const app = express();
const PORT = process.env.PORT;

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

const webhooks = new Webhooks({
  secret: process.env.WEBHOOK_SECRET
});

// Handle push
webhooks.on("push", async ({ payload }) => {
  const repo = payload.repository.name;
  const owner = payload.repository.owner.login;
  const pusher = payload.pusher.name;
  const branch = payload.ref.replace("refs/heads/", "");

  console.log(`🛠️ ${pusher} pushed to ${owner}/${repo} on ${branch}`);

  try {
    const octokit = await octokitApp.getInstallationOctokit(process.env.INSTALLATION_ID);
    console.log("🔐 Authenticated via installation ID");

    const path = ".forge/witness-me.md";
    const content = "# Witness Me\nThis file was created by ForgeSoul Bot.\n\n🔥 You have been noticed.";

    const fileData = Buffer.from(content).toString("base64");

    await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path,
      message: "ForgeSoul Bot: Added witness-me file",
      content: fileData,
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
    console.error("❌ Commit failed");
    if (err.response) {
      console.error("Status:", err.response.status);
      console.error("Headers:", err.response.headers);
      console.error("Body:", JSON.stringify(err.response.data, null, 2));
    } else {
      console.error(err);
    }
  }
});

// Confirm POST is hit
app.post("/github-webhook", (req, res, next) => {
  console.log("🔥 /github-webhook POST received");
  next();
});

// Confirm GET is reachable
app.get("/github-webhook", (_, res) => {
  res.send("🛠️ GitHub Webhook route is alive");
});

// Middleware
app.use("/github-webhook", createNodeMiddleware(webhooks));

// Root
app.get("/", (_, res) => {
  res.send("ForgeSoul Bot is online.");
});

app.listen(PORT, () => {
  console.log(`✅ ForgeSoul Bot running on http://localhost:${PORT}`);
});
