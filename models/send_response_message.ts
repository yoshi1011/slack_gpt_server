import { WebClient } from '@slack/web-api';
import OpenAI from "npm:openai";

class SendResponseMessage {
  private channel: string;
  private messageTs: string;
  private instructionTemplate: string;
  private slackClient: WebClient;
  private openaiClient: OpenAI;

  constructor(channel: string, messageTs: string) {
    this.channel = channel;
    this.messageTs = messageTs;
    this.slackClient = new WebClient();
    this.openaiClient = new OpenAI();
  }

  async perform(title: string, referenceMessages: string): Promise<void> {
    const instructionTemplate = `
    あなたは開発チームのドキュメント作成担当者です。

    今からSlackのスレッドに記載されたメッセージの一覧を渡します。
    そのメッセージの一覧は何らかの作業を行った際のログ記録です。実際に行った作業、またその作業を行った結果を記録しています。
    このメッセージを作業ドキュメント、もしくは調査レポートとして記録できるように要約してください。
    このドキュメントのタイトルは「${title}」としたいです、そのため、ログ記録の中でタイトル名に関連しないと考えられる内容は記載しないでください。

    フォーマットはドキュメント用および調査用の2種類を用意しています。
    ${title}に"調査"という文字が含まれている場合は調査レポート用のテンプレートを利用してください。
    含まれていない場合はドキュメント用のテンプレートを利用してドキュメントを生成してください。

    ---
    ドキュメント用のテンプレート:
    # タイトル
    ${title}

    # 概要
    [スレッド内で記載された作業の内容、目的について説明する]

    # 手順
    [スレッド内で記載された作業の内容をステップごとに記載。それぞれの作業を行った結果、どうなるのかも記載。各手順のサブタイトルはマークダウンのh2になるようにしてください。]

    ---
    調査レポート用のテンプレート:
    # タイトル
    ${title}

    # 概要
    [スレッド内で記載された調査ログの内容、目的について説明する]

    # 調査の結論
    [スレッド内で記載された内容を参考に、今回の調査の結論をなるべく簡潔に書いてください。]

    # 調査の詳細

    ## 調査の流れ
    [スレッド内で記載された調査の内容を参考に、調査の流れ、手順、どのように行ったのかをまとめてください。もし、この説明の中でサブタイトルを付与したい場合はマークダウンのh3になるようにしてください。]

    ## 調査で判明したこと
    [スレッド内で記載された調査の内容を参考に、調査で得た知見、わかったことをまとめてください。まとめる情報はタイトルに関係のあるもののみを出してください。もし、この説明の中でサブタイトルを付与したい場合はマークダウンのh3になるようにしてください。]

    ## この内容から導き出せること
    [スレッド内で記載された調査の内容を参考に、得られた知見から考えられる事実をまとめてください。「調査の結論」に記載した内容に繋げられるような文章にしてください。もし、この説明の中でサブタイトルを付与したい場合はマークダウンのh3になるようにしてください。]

    ---

    以下がSlackのスレッドに記載されたメッセージの一覧です。スレッドに投稿された順番に番号を振ってあります。
    ---
    ${referenceMessages}
    ---

    文章の生成にあたって以下のことに留意してください。
    - 必要に応じて項目を追加して説明をしてください。
    - まとめた文章は必ず日本語で記述してください。
    - 出力時、ドキュメントにそのまま転記できるようにマークダウンで記述してください。
    - 「~~~」はテンプレートの範囲を示すためのものです。出力結果には含めるな。
    - 渡されたスレッドメッセージの中から作業の実施者がつまづいたと考えられるポイントや注意点などがあれば、その説明も手順に記載してください。
    - 生成する文章がドキュメントの場合、文章は「〜しました」という報告口調ではなく「〜する」や「〜を行う」のような説明口調、人に実施してもらいたい手順を説明する口調で記述すること。
    - 作業の目的や内容に照らした結果、実施している作業の目的には直接関係のない作業、取り組みについては記載しないこと。
    - その他、スレッドメッセージに記載がなくても、技術的な補足が可能である場合は、それぞれの手順の説明に追記すること。
    `;

    const replies = await this.slackClient.conversations.replies({
      channel: this.channel,
      ts: this.messageTs
    });
    const messages = replies.messages
    if (messages.length === 0) {
      return 'エラーが起こりました'
    }

    // 要約開始のメッセージを送る
    const postMessage = await this.slackClient.chat.postMessage({
      channel: this.channel,
      thread_ts: this.threadTs,
      text: "...要約中..."
    });
    const replayMessageThreadTs = postMessage.ts;

    let updatedText = "";
    let postedText = "";
    let lastUpdated = Date.now();

    await this.openaiClient.chat({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: instructionTemplate }],
      temperature: 0.3,
      stream: (chunk: any) => {
        if (chunk.choices[0].finish_reason !== "stop") {
          updatedText += chunk.choices[0].delta.content;

          // 0.3秒以内に更新するとよくないらしい
          if (Date.now() - lastUpdated > 300 && updatedText.length > 0) {
            lastUpdated = Date.now();
            this.slackClient.chat.update({
              channel: this.channel,
              ts: replayMessageThreadTs,
              text: updatedText
            });

            postedText = updatedText;
          }
        }
      }
    });

    // 更新漏れが起きうるので最後に確認
    if (postedText !== updatedText) {
      await this.slackClient.chat.update({
        channel: this.channel,
        ts: replayMessageThreadTs,
        text: updatedText
      });
    }

    return '要約が完了しました'
  }
}

export default SendResponseMessage;
