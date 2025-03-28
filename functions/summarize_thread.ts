import { DefineFunction, Schema, SlackFunction } from "deno-slack-sdk/mod.ts";
import SampleObjectDatastore from "../datastores/sample_datastore.ts";
import { SlackAPI } from "deno-slack-sdk/deps.ts";

/**
 * Functions are reusable building blocks of automation that accept
 * inputs, perform calculations, and provide outputs. Functions can
 * be used independently or as steps in workflows.
 * https://api.slack.com/automation/functions/custom
 */
export const SummarizeThreadDefinition = DefineFunction({
  callback_id: "summarize_thread",
  title: "Summarize Thread",
  description: "Slack内のスレッドをまとめる本処理",
  source_file: "functions/summarize_thread.ts",
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
      },
    },
    required: ["channelId", "user", "messageTs", "inputText"],
  },
  output_parameters: {
    properties: {
      updatedMsg: {
        type: Schema.types.string,
        description: "Updated message to be posted",
      },
    },
    required: ["updatedMsg"],
  },
});

/**
 * SlackFunction takes in two arguments: the CustomFunction
 * definition (see above), as well as a function that contains
 * handler logic that's run when the function is executed.
 * https://api.slack.com/automation/functions/custom
 */
export default SlackFunction(
  SummarizeThreadDefinition,
  async ({ inputs, client }) => {
    const slackMessage = new SlackMessage(inputs.channelId, inputs.messageTs);
    const messages = await slackMessage.excludeMessages();

    const sendResponseMessage = new SendResponseMessage(inputs.channelId, inputs.messageTs);
    const message = await sendResponseMessage.perform(inputs.inputText, messages);

    return { outputs: { message } };
  },
);
