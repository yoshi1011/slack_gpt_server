import { Manifest } from "deno-slack-sdk/mod.ts";
import SummarizeThreadWorkflow from "./workflows/summarize_thread_workflow.ts";

/**
 * The app manifest contains the app's configuration. This
 * file defines attributes like app name and description.
 * https://api.slack.com/automation/manifest
 */
export default Manifest({
  name: "thread_summarizer",
  description: "Slackのスレッド内をまとめてドキュメントの下書きにして返してくれるアプリ",
  icon: "assets/default_new_app_icon.png",
  workflows: [SummarizeThreadWorkflow],
  outgoingDomains: [],
  datastores: [],
  botScopes: [
    "app_mentions:read",
    "channels:history",
    "chat:write",
    "commands",
    "groups:history",
    "im:history",
    "mpim:history",
    "files:read"
  ],
});
