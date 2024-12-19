class SlackMessage
  def initialize(channel:, thread_ts:)
    @channel = channel
    @thread_ts = thread_ts
  end

  def exclude_messages
    slack_messages = slack_client.conversations_replies(channel: @channel, ts: @thread_ts).messages

    messages = slack_messages.select { |message| text_message?(message) }

    # スレをまとめる君へのメンションは除外
    messages = messages.reject { |message| message.text.include?("<@U0850P2U5MJ>") }
    texts = messages.map { |message| message.text }

    numberd_join(texts)
  end

  private

  def slack_client
    @slack_client ||= Slack::Web::Client.new
  end

  def text_message?(message)
    message.blocks? &&
    message.blocks[0].type == "rich_text"
  end

  def numberd_join(text_array)
    text_array.map.with_index(1) { |text, index| "#{index}. #{text}" }.join("\n")
  end
end
