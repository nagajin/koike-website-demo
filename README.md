# 小池直之研究室 ホームページ（刷新デモ）

現行の研究室ページ <https://www.rs.kagu.tus.ac.jp/~koike/> の全内容を移植し、
退職後も長期間そのまま公開しつづけられる形に作り直したもの。

## 設計方針

- **素の HTML + CSS + JavaScript のみ**。ビルド不要・Node.js 不要で、
  HTML ファイルをテキストエディタで直接編集して push すれば更新できる。
- **外部ライブラリ・CDN 依存なし**（フォントもシステムフォント）。
  数式表示の MathJax も `assets/mathjax/` に同梱しており、外部への通信は一切発生しない。
- **元サーバーのファイルはすべてリポジトリ内へ取り込み済み**。
  退職により `rs.kagu.tus.ac.jp` が停止してもリンク切れが起こらない。

## 構成

```
index.html          ホーム（お知らせ / 研究概要 / 著書 / シミュレーション / 学生の方へ）
research.html       研究内容の詳説（研究テーマ・平均曲率流とは・一般相対性理論について）
publications.html   著書5冊＋査読付き論文66本（キーワード絞り込み検索付き）
conferences.html    研究集会 — 主催シリーズ＋2014〜2026年度の活動記録（全53件）
seminars.html       神楽坂微分幾何学セミナー2021年度の記録・幾何学系セミナー一覧・集中講義
students.html       卒業研究・平均曲率流の解説・学生の方々へのメッセージ
about.html          プロフィール・科研費受給歴（10件）・リンク集
gallery.html        フォトギャラリー（21点）
hobby.html          自己紹介（プライベート版）・ひとり言
en/index.html       英語版（簡易）
archive/            過去に主催した研究集会12回のプログラム・スライド・写真
assets/style.css    共通スタイル
assets/main.js      ナビ開閉・論文検索・MCFアニメーション
assets/portrait.jpg 近影（2025年7月21日撮影）
assets/mathjax/     MathJax v4.1.3（SVG出力・字形・数式の読み上げデータまで同梱。説明は同フォルダの README.md）
assets/files/       『理論物理に潜む部分多様体幾何』訂正PDF等
assets/talks/       研究集会の講演スライド・集中講義資料（94点）
assets/photos/      研究室の写真（38点）
assets/conf-photos/ 研究集会の記録写真（19点）
```

## 数式の書き方

`research.html` `seminars.html` `students.html` の `<head>` に MathJax の設定と
読み込みが入っている。本文中では LaTeX 記法をそのまま書ける。

- 行中の数式：`\( f_t(x) \)`
- 別行立ての数式：`\[ \mathrm{Ric} - \frac{R}{4}g + \Lambda g = 0 \]`
- HTML なので、数式内の `<` は `&lt;` と書く（例：`\( 0 \leqq t &lt; T \)`）

他のページで数式を使いたい場合は、`research.html` の `<head>` にある
MathJax の `<script>` 2つをそのページにもコピーする
（`en/` 以下など、サブディレクトリの場合は `../assets/mathjax/tex-svg.js` と
`fontPath` の `../assets/mathjax/fonts/%%FONT%%` の2か所を直す）。

## ローカル確認

```
python3 -m http.server 8141
```

## 本番公開の前にすること

このフォルダは GitHub のデモ（検索よけ付きの仮公開）と同じ中身。

- **大学サーバ（rs.kagu.tus.ac.jp/~koike/）に WinSCP で上げる本番用**は、
  `../koike-website-guide/tools/make_lab_site_zip.py` で作る。
  検索よけと robots.txt・README.md を外し、旧ページ名（List-Publication.html など）の
  転送用ファイル 39 個を加えて `../koike-website-guide/送付物/koike-website.zip` に書く。
  ここを直したら、作り直してから先生にお渡しすること。
- **GitHub Pages ＋ 独自ドメインへ本番として移すとき**は、
  1. `robots.txt` を削除する
  2. 全ページの `<meta name="robots" content="noindex, nofollow">` を削除する
     （各ファイルにコメントで目印を付けてある）
  3. 移す元は、その時点で先生のお手元にある最新の koike-website フォルダ（大学サーバ用の一式から更新されている）
