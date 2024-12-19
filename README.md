# SlackGPTServer

Slackで建てた作業スレッドの内容を解析してドキュメントのテンプレートを生成します。Slackにナレッジが散らばった状態を作らないよう定期的にドキュメント化することを目的としています。

VSCodeなどでdevcontainerで起動するとラクです。

# Usage(Server)

## Slack Botの準備

SlackBotを作成してください。必要なScopeは
- app_mentions:read
- channels:history
- chat:write
- commands
- groups:history
- im:history
- incoming-webhook
- mpim:history

です。(削減の見直しをしていないので不要なScopeが存在するかも)

## envファイルをenv.sampleから作成

作成したSlack BotのBot User OAuth TokenをSLACK_BOT_USER_OAUTH_TOKENに設定
Slack BotのSigning SecretをSLACK_SIGNING_SECRETに設定
OpenAI APIのアクセストークンをOPENAI_ACCESS_TOKENに設定

## ngrokでホストネームの設定

※ローカルで実行することを想定した説明です
ngrokで`ngrok http 3000`でrails serverに外部接続できるホストネームを生成

生成されたホストネームを.envのDEV_HOST_NAMEに設定

## Rails Serverを起動

```shell
rails server
```

## SlackBotのEvent SubscriptionsにRequestURLを設定

Request URLに以下の値を設定

```
https://ngrokで決められたホストネーム/webhook
```

入力後、リクエストテストがパスできることを確認したら保存する

## SlackBotのインストール

利用したいチャンネル内で作成したSlackBotをインストールしてください。

# Usage(Bot)

内容をまとめたいスレッド内で以下を入力

```
@スレをまとめる君 `文章化したい内容のタイトルを入力`
```

入力したタイトルに「調査」という文字が含めると調査レポートを、そうでなければドキュメントを生成します。
