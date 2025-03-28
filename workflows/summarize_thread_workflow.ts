import { DefineWorkflow, Schema } from "deno-slack-sdk/mod.ts";
import { SummarizeThreadDefinition } from "../functions/summarize_thread.ts";

/**
 * A workflow is a set of steps that are executed in order.
 * Each step in a workflow is a function.
 * https://api.slack.com/automation/workflows
 *
 * This workflow uses interactivity. Learn more at:
 * https://api.slack.com/automation/forms#add-interactivity
 */
const SummarizeThreadWorkflow = DefineWorkflow({
  callback_id: "summarize_thread_workflow",
  title: "スレをまとめる君",
  description: "Slackのスレッドをまとめてドキュメントの下書きを作ります！",
  input_parameters: {
    properties: {
      channelId: {
        type: Schema.slack.types.channel_id,
      },
      user: {
        type: Schema.slack.types.user_id,
      },
      messageTs: {
        type: Schema.slack.types.message_ts,
      },
      inputText: {
        type: Schema.types.string,
      }
    },
    required: ["channelId", "user", "messageTs", "inputText"],
  },
});

const summarizeThreadStep = SummarizeThreadWorkflow.addStep(
  SummarizeThreadDefinition,
  {
    channelId: SummarizeThreadWorkflow.inputs.channelId,
    user: SummarizeThreadWorkflow.inputs.user,
    messageTs: SummarizeThreadWorkflow.inputs.messageTs,
    inputText: SummarizeThreadWorkflow.inputs.inputText,
  },
);

// 返信先の取得方法がわからないため一旦実行結果を出力する方法の検討はやめる
// SummarizeThreadWorkflow.addStep(Schema.slack.functions.ReplyInThread, {
//   message: summarizeThreadStep.outputs.message,
//   message_context: Schema.slack.outputs.MessageContext,
// })

export default SummarizeThreadWorkflow;
