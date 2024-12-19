class SendResponseMessageJob < ApplicationJob
  queue_as :default

  def perform(channel, thread_ts, title, reference_messages)
    SendResponseMessage.new(channel, thread_ts, title, reference_messages).perform
  end
end
