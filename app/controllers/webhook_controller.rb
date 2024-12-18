class WebhookController < ApplicationController
  def webhook
    slack_request = Slack::Events::Request.new(request)
    slack_request.verify!

    unless webhook_params[:type] == "url_verification"
      reference_messages = SlackMessage.new(channel: event_params[:channel], thread_ts: event_params[:thread_ts]).exclude_messages

      SendResponseMessageJob.perform_later(event_params[:channel], event_params[:thread_ts], reference_messages)
    end

    render json: { challenge: webhook_params[:challenge] }
  end

  private

  def webhook_params
    @webhook_params ||= params.require(:webhook).permit(:challenge, :type)
  end

  def event_params
    @event_params ||= params.require(:event).permit(:channel, :ts, :thread_ts, :text)
  end
end
