import express from "express";
import dotenv from "dotenv";
import { App } from "@octokit/app";
import { Webhooks, createNodeMiddleware } from "@octokit/webhooks";

dotenv.config();

const app = express();
const PORT = process.env.PORT;

// GitHub App setup
const octokitApp = new App({
  appId: process.env.APP_ID,
  privateKey: process.env.PRIVATE_KEY.replace(/\\n/g, '\n'), // fix multiline key
  oauth: {
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET
  },
  webhooks: {
    secret: process.env.WEBHOOK_SECRET
  }
});

const webhooks = new Webhooks({ secret: process.env.WEBHOOK_SECRET });

// Diagnostic endpoint
app.get("/", (_, res) => {
  res.send("🧙 ForgeSoul Bot is alive and listening.");
});

// Optional GET checker
app.get("/github-webhook", (_, res) => {
  res.send("✅ Webhook is set up correctly.");
});

// Diagnostic POST middleware (must come *before* Octokit middleware)
app.post("/github-webhook", express.json(), (req, res, next) => {
  console.log("🔥 /github-webhook POST received");
  next(); // Let Octokit handle it
});

// Hook listener
webhooks.on("push", async ({ payload }) => {
  const repo = payload.repository.name;
  const owner = payload.repository.owner.login;
  const branch = payload.ref.replace("refs/heads/", "");
  const pusher = payload.pusher.name;

  console.log(`🛠️ ${pusher} pushed to ${owner}/${repo} on branch ${branch}`);
  try {
    const octokit = await octokitApp.getInstallationOctokit(process.env.INSTALLATION_ID);
    console.log("🔐 Octokit installation authenticated");

    const path = ".forge/witness-me.md";
    const content = `# Witness Me\n🔥 Pushed by ${pusher} on ${new Date().toISOString()}`;

    await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path,
      message: `ForgeSoul Bot: Witnessed a push to ${branch}`,
      content: Buffer.from(content).toString("base64"),
      committer: { name: "ForgeSoul Bot", email: "bot@tableforge.app" },
      author: { name: "ForgeSoul Bot", email: "bot@tableforge.app" },
      branch
    });

    console.log(`✅ Committed ${path}`);
  } catch (err) {
    console.error("❌ Error in webhook handler:", err.message);
    console.error(err.stack);
  }
});

// Must come LAST
app.use("/github-webhook", createNodeMiddleware(webhooks));

app.listen(PORT, () => {
  console.log(`✅ ForgeSoul Bot running on http://localhost:${PORT}`);
});
