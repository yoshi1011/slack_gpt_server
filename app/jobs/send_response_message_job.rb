class SendResponseMessageJob < ApplicationJob
  queue_as :default

  def perform(channel, thread_ts, reference_messages)
    SendResponseMessage.new(channel: channel, thread_ts: thread_ts, reference_messages: reference_messages).perform
  end
end
