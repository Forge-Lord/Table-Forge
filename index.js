import express from "express";
import dotenv from "dotenv";
import { App } from "@octokit/app";
import { Webhooks, createNodeMiddleware } from "@octokit/webhooks";

dotenv.config();

const app = express();
const PORT = process.env.PORT;
const FIXED_PRIVATE_KEY = process.env.PRIVATE_KEY.replace(/\\n/g, "\n");

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

// ✅ Push event handler
webhooks.on("push", async ({ payload }) => {
  const repo = payload.repository.name;
  const owner = payload.repository.owner.login;
  const branch = payload.ref.replace("refs/heads/", "");
  const pusher = payload.pusher.name;

  console.log(`🛠️ Push by ${pusher} on ${owner}/${repo} [${branch}]`);

  try {
    const octokit = await octokitApp.getInstallationOctokit(process.env.INSTALLATION_ID);
    console.log("🔐 Authenticated Octokit");

    const content = `# Witness Me\n🔥 Commit by ${pusher} on branch ${branch} at ${new Date().toISOString()}`;
    const path = ".forge/witness-me.md";

    await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path,
      message: `ForgeSoul Bot: Witnessed push to ${branch}`,
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

    console.log("✅ witness-me.md committed successfully.");
  } catch (error) {
    console.error("❌ Commit failed:");
    console.error(error.stack || error.message || error);
  }
});

// ✅ Webhook middleware route
app.use("/github-webhook", createNodeMiddleware(webhooks, {
  path: "/github-webhook" // critical for GitHub routing!
}));

// ✅ Basic root + diagnostics
app.get("/", (_, res) => {
  res.send("✅ ForgeSoul Bot is online and ready.");
});

app.listen(PORT, () => {
  console.log(`✅ ForgeSoul Bot running at http://localhost:${PORT}`);
});
