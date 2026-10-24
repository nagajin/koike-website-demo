MathJax v4.1.3 (https://www.mathjax.org/) — Apache License 2.0
tex-svg.js は SVG 出力版の単一バンドル。外部フォントを読み込まないため、
このファイル1つで数式表示が完結する（CDN 等への外部リクエストは発生しない）。
更新する場合は https://registry.npmjs.org/mathjax/-/mathjax-<version>.tgz の
package/tex-svg.js を差し替える。

## 読み上げ文の生成を切ってある

v4 は既定で数式の読み上げ文（speech / braille）を生成する。この処理だけは
tex-svg.js の中で完結せず、worker から `assets/mathjax/sre/speech-worker.js` と
音声規則データを別途読みに行くため、tex-svg.js だけを置いた構成では 404 になる
（数式は正常に表示されるが、コンソールにエラーが出続ける）。

そこで数式を使う research.html / seminars.html / students.html の3ページで

    menuOptions: { settings: { enrich: false, speech: false, braille: false } }

として生成自体を切っている。**tex-svg.js を差し替えるときはこの設定も残すこと。**
消すと 404 が復活する。数式のあるページを増やすときも同じ設定を入れる。

読み上げに対応させたい場合は、上記 tgz の package/sre/ 一式を assets/mathjax/sre/
へ置いた上でこの設定を外す（数MB増える）。支援技術向けの MathML を添える
`a11y/assistive-mml` も同様に tex-svg.js には含まれておらず、別ファイルが要る。

同じ対処を部門サイト（koike-projects/dgns-website/）でも行っている。
