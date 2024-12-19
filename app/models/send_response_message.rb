class SendResponseMessage
  def initialize(channel, thread_ts, title, reference_messages)
    @channel = channel
    @thread_ts = thread_ts
    @instruction_template = <<~EOS
    あなたは開発チームのドキュメント作成担当者です。

    今からSlackのスレッドに記載されたメッセージの一覧を渡します。
    そのメッセージの一覧は何らかの作業を行った際のログ記録です。実際に行った作業、またその作業を行った結果を記録しています。
    このメッセージをドキュメントとして記録できるように要約してください。
    このドキュメントのタイトルは「#{title}」としたいです、そのため、ログ記録の中でタイトル名に関連しないと考えられる内容は記載しないでください。

    要約は以下の「~~~」で囲った内容のフォーマットで記録してください。
    - 必要に応じて項目を追加して説明をしてください。
    - まとめた文章は必ず日本語で記述してください。
    - 出力時、ドキュメントにそのまま転記できるようにマークダウンで記述してください。
    - 「~~~」はテンプレートの範囲を示すためのもので、実際のドキュメントには含めないでください。
    - 渡されたスレッドメッセージの中から作業の実施者がつまづいたと考えられるポイントや注意点などがあれば、その説明も手順に記載してください。
    - 作成するのはドキュメントです。文章は「〜しました」という報告口調ではなく「〜する」や「〜を行う」のような説明口調、人に実施してもらいたい手順を説明する口調で記述すること。
    - 作業の目的や内容に照らした結果、実施している作業の目的には直接関係のない作業、取り組みについては記載しないこと。
    - その他、スレッドメッセージに記載がなくても、技術的な補足が可能である場合は、それぞれの手順の説明に追記すること。
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    # タイトル
    #{title}

    # 概要
    [スレッド内で記載された作業の内容、目的について説明する]

    # 手順
    [スレッド内で記載された作業の内容をステップごとに記載。それぞれの作業を行った結果、どうなるのかも記載。各手順のサブタイトルはマークダウンのh2になるようにしてください。]
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    以下がSlackのスレッドに記載されたメッセージの一覧です。スレッドに投稿された順番に番号を振ってあります。
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    #{reference_messages}
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    EOS
  end

  def perform
    post_message = slack_client.chat_postMessage(channel: @channel, thread_ts: @thread_ts, text: "...要約中...")
    replay_message_thread_ts = post_message.ts

    updated_text = ""
    posted_text = ""
    last_updated = Time.now

    openai_client.chat(
      parameters: {
        model: "gpt-4o-mini",
        messages: [ { role: "user", content: @instruction_template } ],
        temperature: 0.3,
        stream: proc do |chunk, _bytesize|
          unless chunk.dig("choices", 0, "finish_reason") == "stop"
            updated_text += chunk.dig("choices", 0, "delta", "content")

            # 0.3秒以内に更新するとよくないらしい
            if (Time.now - last_updated) > 0.3 and updated_text.length > 0
              last_updated = Time.now
              slack_client.chat_update(channel: @channel, ts: replay_message_thread_ts, text: updated_text)

              posted_text = updated_text
            end
          end
        end
      }
    )
    # 更新漏れが起きうるので最後に確認
    if posted_text != updated_text
      slack_client.chat_update(channel: @channel, ts: replay_message_thread_ts, text: updated_text)
    end
  end

  private

  def slack_client
    @slack_client ||= Slack::Web::Client.new
  end

  def openai_client
    @openai_client ||= OpenAI::Client.new
  end
end
