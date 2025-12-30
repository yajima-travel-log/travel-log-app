Travel Log App

旅行の記録を 期間・評価付きで管理できるシンプルなWebアプリ です。
JavaScriptの基礎（DOM操作・イベント委譲・localStorage）を用いて実装しました。

🔗 公開URL
https://yajima-travel-log.github.io/travel-log-app/

・機能一覧
旅行ログの追加
旅行期間の表示（◯泊◯日）
★評価（1〜5）
メモ・★評価の編集
ログの削除
日時順での並び替え（新しい順 / 古い順）
localStorage によるデータ保存・復元

・使用技術
HTML
CSS
JavaScript
localStorage
GitHub Pages（公開）

工夫した点・学んだこと

イベント委譲を用いて、動的に追加された要素（編集・削除ボタン）にも対応
localStorage に保存したデータを復元後、
並び替え用に data-start-date を再付与することで日時ソートを実現
UI面ではカード型レイアウトを採用し、視認性を向上

作者
矢嶋 陽向
GitHub: https://github.com/yajima-travel-log
