import { WebClient } from '@slack/web-api';

class SlackMessage {
  private channel: string;
  private messageTs: string;
  private slackClient: WebClient;

  constructor(channel: string, messageTs: string) {
    this.channel = channel;
    this.messageTs = messageTs;
    this.slackClient = new WebClient();
  }

  async excludeMessages(): Promise<string> {
    const response = await this.slackClient.conversations.replies({
      channel: this.channel,
      ts: this.messageTs
    });

    const slackMessages = response.messages || [];
    const messages = slackMessages.filter(message => this.textMessage(message));

    // スレをまとめる君へのメンションは除外
    const filteredMessages = messages.filter(message => !message.text.includes("<@U0850P2U5MJ>"));
    const texts = filteredMessages.map(message => message.text);

    return this.numberedJoin(texts);
  }

  private textMessage(message: any): boolean {
    return message.blocks && message.blocks[0].type === "rich_text";
  }

  private numberedJoin(textArray: string[]): string {
    return textArray.map((text, index) => `${index + 1}. ${text}`).join("\n");
  }
}

export default SlackMessage;
