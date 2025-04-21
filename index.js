import express from "express";
import dotenv from "dotenv";
import { App } from "@octokit/app";
import { Webhooks, createNodeMiddleware } from "@octokit/webhooks";

dotenv.config();

const app = express();
const PORT = process.env.PORT;

// ✅ Fix Render's newline escaping in the RSA key
const FIXED_PRIVATE_KEY = process.env.PRIVATE_KEY.replace(/\\n/g, '\n');

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

const webhooks = new Webhooks({ secret: process.env.WEBHOOK_SECRET });

// Confirm base route
app.get("/", (_, res) => {
  res.send("✅ ForgeSoul Bot is alive.");
});

// Confirm GET route for GitHub debugging
app.get("/github-webhook", (_, res) => {
  res.send("✅ GitHub Webhook route is active.");
});

// Diagnostic POST route to verify receipt
app.post("/github-webhook", express.json(), (req, res, next) => {
  console.log("🔥 /github-webhook POST received");
  next(); // Pass to Octokit middleware
});

// GitHub webhook push handler
webhooks.on("push", async ({ payload }) => {
  const repo = payload.repository.name;
  const owner = payload.repository.owner.login;
  const branch = payload.ref.replace("refs/heads/", "");
  const pusher = payload.pusher.name;

  console.log(`🛠️ Push detected: ${pusher} -> ${owner}/${repo} (${branch})`);

  try {
    const octokit = await octokitApp.getInstallationOctokit(process.env.INSTALLATION_ID);
    console.log("🔐 Authenticated Octokit!");

    const content = `# Witness Me\n🔥 Commit by ${pusher} on branch ${branch} at ${new Date().toISOString()}`;
    const path = ".forge/witness-me.md";

    await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path,
      message: `ForgeSoul Bot: Witnessed ${branch} push`,
      content: Buffer.from(content).toString("base64"),
      committer: { name: "ForgeSoul Bot", email: "bot@tableforge.app" },
      author: { name: "ForgeSoul Bot", email: "bot@tableforge.app" },
      branch
    });

    console.log(`✅ Committed file: ${path}`);
  } catch (error) {
    console.error("❌ Error committing file:");
    console.error(error.stack || error.message || error);
  }
});

// Final webhook middleware
app.use("/github-webhook", createNodeMiddleware(webhooks));

// Boot it up
app.listen(PORT, () => {
  console.log(`✅ ForgeSoul Bot running at http://localhost:${PORT}`);
});
