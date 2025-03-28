import { Trigger } from "deno-slack-sdk/types.ts";
import { TriggerContextData, TriggerTypes, TriggerEventTypes } from "deno-slack-api/mod.ts";
import SummarizeThreadWorkflow from "../workflows/summarize_thread_workflow.ts";
/**
 * Triggers determine when workflows are executed. A trigger
 * file describes a scenario in which a workflow should be run,
 * such as a user pressing a button or when a specific event occurs.
 * https://api.slack.com/automation/triggers
 */
const mentionTrigger: Trigger<typeof SummarizeThreadWorkflow.definition> = {
  type: TriggerTypes.Shortcut,
  name: "Sample trigger",
  description: "メンションを送られたときにトリガーを発火させます",
  workflow: `#/workflows/${SummarizeThreadWorkflow.definition.callback_id}`,
  event: {
    event_type: TriggerEventTypes.AppMentioned,
    all_resources: true,
  },
  inputs: {
    user: {
      value: TriggerContextData.Shortcut.user_id,
    },
    channelId: {
      value: TriggerContextData.Event.AppMentioned.channel_id,
    },
    messageTs: {
      value: TriggerContextData.Event.AppMentioned.message_ts,
    },
    inputText: {
      value: TriggerContextData.Event.AppMentioned.text,
    },
  },
};

export default mentionTrigger;
