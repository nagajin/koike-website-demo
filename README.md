# 小池直之 個人サイト（リニューアル・デモ）

現行の研究室ページ <https://www.rs.kagu.tus.ac.jp/~koike/> をもとに刷新した、
退職後も個人で維持できる静的サイトのデモ。

## 設計方針

- **完全静的（HTML/CSS/JS のみ、ビルド不要）** — GitHub Pages で無料ホスティングでき、
  大学サーバーが使えなくなっても URL を維持できる。HTML を直接編集するだけで更新可能。
- 外部ライブラリ・CDN 依存なし（フォントもシステムフォント）。
- レスポンシブ対応（スマホではハンバーガーメニュー）。
- トップのヒーロー背景は平均曲率流（曲線短縮流）の Canvas アニメーション
  （`assets/main.js` の `startMCF`）。

## 構成

```
index.html          ホーム（お知らせ / 研究概要 / 著書 / シミュレーション / 学生の方へ）
research.html       研究内容の詳説（研究テーマ・平均曲率流とは・一般相対性理論について）
publications.html   著書5冊＋査読付き論文66本（キーワード絞り込み検索付き）
conferences.html    研究集会の年度別記録（2023〜2025年度、以前は現行ページへリンク）
en/index.html       英語版（簡易）
assets/style.css    共通スタイル
assets/main.js      ナビ開閉・論文検索・MCFアニメーション
assets/portrait.jpg 近影（現行サイトの 2025年7月21日撮影の写真）
```

## ローカル確認

```bash
python3 -m http.server 8141 --directory koike-projects/koike-website
```

## GitHub Pages での公開手順（本番移行時）

1. GitHub に新リポジトリ（例：`koike-homepage`）を作成
2. この中身を push
3. リポジトリの Settings → Pages → Branch: `main` / root を選択
4. `https://<アカウント名>.github.io/koike-homepage/` で公開される

## 未移行・要確認事項

- 研究集会の 2022 年度以前の全記録（現在は現行ページへのリンクで代替）
- セミナー・集中講義・科研費・リンク集・趣味・写真ギャラリーの各ページ
- 訂正 PDF（teisei-*.pdf）・卒研スライド等は現行サーバーの URL を参照中 →
  本番時はリポジトリ内へコピーする
- 退職後の所属表記（現在は現行ページに合わせて理科大表記のまま）
