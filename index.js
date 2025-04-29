import express from "express";
import dotenv from "dotenv";
import { App } from "@octokit/app";
import { createNodeMiddleware, Webhooks } from "@octokit/webhooks";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 10000;

// Fix multiline private key from Render
const PRIVATE_KEY = process.env.PRIVATE_KEY.replace(/\\n/g, "\n");

const octokitApp = new App({
  appId: process.env.APP_ID,
  privateKey: PRIVATE_KEY,
  oauth: {
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
  },
  webhooks: {
    secret: process.env.WEBHOOK_SECRET,
  },
});

const webhooks = new Webhooks({ secret: process.env.WEBHOOK_SECRET });

// Confirm bot is alive
app.get("/", (_, res) => res.send("✅ ForgeSoul Bot is alive."));

// Confirm webhook route is up (for GET testing only)
app.get("/github-webhook", (_, res) =>
  res.send("✅ GitHub Webhook route is active.")
);

// Mount Octokit webhook middleware properly
app.use("/github-webhook", express.json(), createNodeMiddleware(webhooks));

// Push handler
webhooks.on("push", async ({ payload }) => {
  const repo = payload.repository.name;
  const owner = payload.repository.owner.login;
  const branch = payload.ref.replace("refs/heads/", "");
  const pusher = payload.pusher.name;

  console.log(`🛠️ Push detected: ${pusher} -> ${owner}/${repo} (${branch})`);

  try {
    const octokit = await octokitApp.getInstallationOctokit(
      process.env.INSTALLATION_ID
    );

    const content = `# Witness Me\n🔥 Commit by ${pusher} on branch ${branch} at ${new Date().toISOString()}`;
    const path = ".forge/witness-me.md";

    await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path,
      message: `ForgeSoul Bot: Witnessed push on ${branch}`,
      content: Buffer.from(content).toString("base64"),
      committer: { name: "ForgeSoul Bot", email: "bot@tableforge.app" },
      author: { name: "ForgeSoul Bot", email: "bot@tableforge.app" },
      branch,
    });

    console.log(`✅ File committed: ${path}`);
  } catch (error) {
    console.error("❌ Error committing file:", error.message || error);
  }
});

// Start the bot server
app.listen(PORT, () => {
  console.log(`✅ ForgeSoul Bot running on port ${PORT}`);
});
