import express from "express";
import dotenv from "dotenv";
import { Webhooks, createNodeMiddleware } from "@octokit/webhooks";

dotenv.config();

const app = express();
const PORT = process.env.PORT;

const webhooks = new Webhooks({ secret: process.env.WEBHOOK_SECRET });

webhooks.on("push", async ({ payload }) => {
  console.log("✅ Push received:");
  console.log(`Repo: ${payload.repository.full_name}`);
  console.log(`Branch: ${payload.ref}`);
  console.log(`Pusher: ${payload.pusher.name}`);
});

app.use("/github-webhook", createNodeMiddleware(webhooks, {
  path: "/github-webhook"
}));

app.get("/", (_, res) => {
  res.send("🧪 ForgeSoul Bot test mode.");
});

app.listen(PORT, () => {
  console.log(`🧪 ForgeSoul Bot listening at http://localhost:${PORT}`);
});
