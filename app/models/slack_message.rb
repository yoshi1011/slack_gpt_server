class SlackMessage
  def initialize(channel:, thread_ts:)
    @channel = channel
    @thread_ts = thread_ts
  end

  def exclude_messages
    slack_messages = slack_client.conversations_replies(channel: @channel, ts: @thread_ts).messages

    messages = slack_messages.select { |message| rich_text_message?(message) }

    # スレをまとめる君へのメンションは除外
    messages = messages.reject { |message| message.text.include?("<@U0850P2U5MJ>") }
    rich_text_sections = messages.map { |message| exclude_rich_text_section(message.dig(:blocks, 0, :elements)) }.flatten
    texts = rich_text_sections.map { |section| build_text_from_rich_text_section(section).strip }

    numberd_join(texts)
  end

  private

  def slack_client
    @slack_client ||= Slack::Web::Client.new
  end

  def rich_text_message?(message)
    message.blocks? &&
    message.blocks[0].type == "rich_text" &&
    has_rich_text_section?(message.dig(:blocks, 0, :elements))
  end

  def has_rich_text_section?(elements)
    elements.any? { |element| element.type == "rich_text_section" }
  end

  def exclude_rich_text_section(elements)
    elements.filter { |element| element.type == "rich_text_section" }
  end

  def numberd_join(text_array)
    text_array.map.with_index(1) { |text, index| "#{index}. #{text}" }.join("\n")
  end

  def build_text_from_rich_text_section(rich_text_section)
    rich_text_section.elements.map do |element|
      if element.style.nil?
        element.text
      else
        element.style.code ? "`#{element.text}`" : element.text
      end
    end.join("")
  end
end
