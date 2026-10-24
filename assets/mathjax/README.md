MathJax v4.1.3 (https://www.mathjax.org/) — Apache License 2.0

## 同梱しているもの

    tex-svg.js            数式表示の本体（SVG 出力版の単一バンドル）
    fonts/                字形データ（tex-svg.js が必要な分だけ読み込む）
    sre/speech-worker.js  数式の読み上げ文・点字を作る処理（worker として読み込まれる）
    sre/mathmaps/         読み上げの規則データ（base・英語 en・点字 nemeth / euro）

すべてこのフォルダの中にあり、CDN など外部への通信は発生しない。
どれも https://registry.npmjs.org/mathjax/-/mathjax-4.1.3.tgz の package/ 以下から
そのまま取り出したもの（tex-svg.js は tgz のものとバイト単位で同一）。

## 数式の読み上げ（speech / braille）

v4 は既定で、数式ごとに読み上げ文と点字を生成し、スクリーンリーダーに渡す。
その処理は tex-svg.js の外にあり、`sre/speech-worker.js` と `sre/mathmaps/*.json` を
読みに行く。これらが無いと 404 になるので、**sre/ フォルダは消さないこと。**

読み上げの言語は英語（SRE に日本語の規則が無いため）。和文ページでも数式部分は
「R over 4」のように英語で読まれる。ほかの言語を足すときは、tgz の
package/sre/mathmaps/ から該当する json（de.json など）を同じ場所へ置く。

## 更新するとき

1. 新しい版の tgz を取り、package/tex-svg.js と package/sre/ の上記ファイルを
   **同じ版どうしで**差し替える（版が混ざると読み上げが動かないことがある）。
2. fonts/ も同じ版のものに差し替える。
3. research.html を開き、コンソールにエラーが無いこと、数式要素に
   `data-semantic-speech` 属性が付くことを確かめる。

## 数式を使うページを増やすとき

research.html の `<head>` にある MathJax の `<script>` 2つをコピーする。
サブフォルダ（en/ など）に置くページでは、次の2か所の相対パスを両方直す。

- `<script defer src="assets/mathjax/tex-svg.js">` → `../assets/mathjax/tex-svg.js`
- `output: { fontPath: 'assets/mathjax/fonts/%%FONT%%' }` → `'../assets/mathjax/fonts/%%FONT%%'`

（sre/ の場所は tex-svg.js の位置から自動で決まるので、直す必要はない。）
