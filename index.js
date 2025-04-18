import express from "express";
import dotenv from "dotenv";
import { App } from "@octokit/app";
import { Webhooks, createNodeMiddleware } from "@octokit/webhooks";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Octokit App instance
const octokitApp = new App({
  appId: process.env.APP_ID,
  privateKey: process.env.PRIVATE_KEY,
  oauth: {
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
  },
  webhooks: {
    secret: process.env.WEBHOOK_SECRET,
  },
});

// Create webhook listener
const webhooks = new Webhooks({
  secret: process.env.WEBHOOK_SECRET,
});

webhooks.on("push", async ({ payload }) => {
  const repo = payload.repository.full_name;
  const pusher = payload.pusher.name;
  console.log(`\uD83D\uDEE0️ ${pusher} pushed to ${repo}`);

  const octokit = await octokitApp.getInstallationOctokit(
    Number(process.env.INSTALLATION_ID)
  );

  try {
    // Fetch current README
    const { data: file } = await octokit.repos.getContent({
      owner: payload.repository.owner.name,
      repo: payload.repository.name,
      path: "README.md",
    });

    const content = Buffer.from(file.content, "base64").toString("utf-8");
    const timestamp = new Date().toISOString();
    const updatedContent = `${content}\n\n## \uD83D\uDD25 ForgeSoul was here - ${timestamp}`;

    await octokit.repos.createOrUpdateFileContents({
      owner: payload.repository.owner.name,
      repo: payload.repository.name,
      path: "README.md",
      message: `ForgeSoul update on ${timestamp}`,
      content: Buffer.from(updatedContent, "utf-8").toString("base64"),
      sha: file.sha,
    });

    console.log(`✅ ForgeSoul updated README.md in ${repo}`);
  } catch (error) {
    console.error("❌ Failed to update README:", error.message);
  }
});

// Middleware mounted at GitHub webhook path
app.use("/github-webhook", createNodeMiddleware(webhooks));

app.get("/", (_, res) => {
  res.send("ForgeSoul Bot is online and awaiting webhooks.");
});

app.listen(PORT, () => {
  console.log(`\u2705 ForgeSoul Bot running at http://localhost:${PORT}`);
});
