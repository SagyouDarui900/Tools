export function initMarkdownEditor() {
  (function initMarkdownEditor() {
            const textarea = document.getElementById('mdTextarea');
            const previewContainer = document.getElementById('mdPreviewContainer');
            const cursorInfo = document.getElementById('mdCursorInfo');
            const templateSelect = document.getElementById('mdTemplateSelect');
            const applyTemplateBtn = document.getElementById('mdApplyTemplateBtn');
            const fileInput = document.getElementById('mdFileInput');
            const clearBtn = document.getElementById('mdClearBtn');
            const filenameInput = document.getElementById('mdFilenameInput');
            const downloadBtn = document.getElementById('mdDownloadBtn');
            const copyMdBtn = document.getElementById('mdCopyMdBtn');
            const copyDiscordBtn = document.getElementById('mdCopyDiscordBtn');
            const copyRichHtmlBtn = document.getElementById('mdCopyRichHtmlBtn');
            const saveStatus = document.getElementById('mdSaveStatus');

            // View modes
            const viewModeSplit = document.getElementById('mdViewModeSplit');
            const viewModeEditor = document.getElementById('mdViewModeEditor');
            const viewModePreview = document.getElementById('mdViewModePreview');
            const editorCol = document.getElementById('mdEditorCol');
            const previewCol = document.getElementById('mdPreviewCol');
            const editorGrid = document.getElementById('mdEditorGrid');

            // Stats
            const statTotalChars = document.getElementById('mdStatTotalChars');
            const statNoSpaceChars = document.getElementById('mdStatNoSpaceChars');
            const statWords = document.getElementById('mdStatWords');
            const statLines = document.getElementById('mdStatLines');
            const statReadTime = document.getElementById('mdStatReadTime');
            const discordMeterText = document.getElementById('mdDiscordMeterText');
            const discordMeterBar = document.getElementById('mdDiscordMeterBar');
            const discordStatusBadge = document.getElementById('mdDiscordStatusBadge');

            // Toolbar buttons
            const btnBold = document.getElementById('mdBtnBold');
            const btnItalic = document.getElementById('mdBtnItalic');
            const btnStrike = document.getElementById('mdBtnStrike');
            const btnUnderline = document.getElementById('mdBtnUnderline');
            const btnInlineCode = document.getElementById('mdBtnInlineCode');
            const btnH1 = document.getElementById('mdBtnH1');
            const btnH2 = document.getElementById('mdBtnH2');
            const btnH3 = document.getElementById('mdBtnH3');
            const btnUl = document.getElementById('mdBtnUl');
            const btnOl = document.getElementById('mdBtnOl');
            const btnTask = document.getElementById('mdBtnTask');
            const btnQuote = document.getElementById('mdBtnQuote');
            const btnCodeBlock = document.getElementById('mdBtnCodeBlock');
            const btnTable = document.getElementById('mdBtnTable');
            const btnHr = document.getElementById('mdBtnHr');
            const btnLink = document.getElementById('mdBtnLink');
            const btnImage = document.getElementById('mdBtnImage');

            // Discord & GitHub & Formatting
            const btnDiscordSpoiler = document.getElementById('mdBtnDiscordSpoiler');
            const btnDiscordSubtext = document.getElementById('mdBtnDiscordSubtext');
            const btnDiscordTimestamp = document.getElementById('mdBtnDiscordTimestamp');
            const btnDiscordQuoteMulti = document.getElementById('mdBtnDiscordQuoteMulti');
            const btnDiscordAnsi = document.getElementById('mdBtnDiscordAnsi');
            const btnGhAlert = document.getElementById('mdBtnGhAlert');
            const btnDetails = document.getElementById('mdBtnDetails');
            const btnShieldsBadge = document.getElementById('mdBtnShieldsBadge');
            const btnZenHanAlpha = document.getElementById('mdBtnZenHanAlpha');
            const btnHanZenKana = document.getElementById('mdBtnHanZenKana');
            const btnCaseToggle = document.getElementById('mdBtnCaseToggle');
            const btnCleanLines = document.getElementById('mdBtnCleanLines');
            const btnPunctToggle = document.getElementById('mdBtnPunctToggle');
            const btnUndo = document.getElementById('mdBtnUndo');
            const btnRedo = document.getElementById('mdBtnRedo');

            if (!textarea || !previewContainer) return;

            // Undo / Redo History Stack
            const historyStack = [];
            let historyIndex = -1;
            const MAX_HISTORY = 40;

            function pushHistory(text) {
                if (historyIndex >= 0 && historyStack[historyIndex] === text) return;
                historyStack.splice(historyIndex + 1);
                historyStack.push(text);
                if (historyStack.length > MAX_HISTORY) {
                    historyStack.shift();
                } else {
                    historyIndex++;
                }
                updateUndoRedoBtns();
            }

            function updateUndoRedoBtns() {
                if (btnUndo) btnUndo.disabled = historyIndex <= 0;
                if (btnRedo) btnRedo.disabled = historyIndex >= historyStack.length - 1;
            }

            function triggerUndo() {
                if (historyIndex > 0) {
                    historyIndex--;
                    textarea.value = historyStack[historyIndex];
                    renderMarkdown();
                    updateUndoRedoBtns();
                }
            }

            function triggerRedo() {
                if (historyIndex < historyStack.length - 1) {
                    historyIndex++;
                    textarea.value = historyStack[historyIndex];
                    renderMarkdown();
                    updateUndoRedoBtns();
                }
            }

            // Toast helper
            function showToast(msg) {
                const toast = document.getElementById('tcToast');
                if (!toast) return;
                toast.textContent = msg;
                toast.classList.add('show');
                setTimeout(() => toast.classList.remove('show'), 2200);
            }

            // Templates Map
            const templates = {
                layout_callouts: `# GitHub コールアウト & 囲み枠レイアウト

> [!NOTE]
> **NOTE ボックス**
> 補足情報やメモを記載する標準の強調枠です。

> [!TIP]
> **TIP ボックス**
> ヒントやおすすめの操作方法を強調表示する枠です。

> [!IMPORTANT]
> **IMPORTANT ボックス**
> 見落としてはならない重要情報を記述します。

> [!WARNING]
> **WARNING ボックス**
> 注意事項や警告文をユーザーに伝える枠です。

> [!CAUTION]
> **CAUTION ボックス**
> 危険な操作や不可逆な変更についての警告枠です。`,

                layout_2col_grid: `# 2カラム並列 & カード比較レイアウト

| 左カラム (仕様 / Feature A) | 右カラム (比較 / Feature B) |
| :--- | :--- |
| **画面レイアウト**<br>・ダークモード対応<br>・高コントラスト設計 | **パフォーマンス**<br>・クライアント完結動作<br>・メモリ消費量 < 15MB |
| **サポートファイル**<br>・\`.md\`, \`.txt\`<br>・\`.rpp\` (REAPER) | **セキュリティ**<br>・オフライン完全対応<br>・外部通信ゼロ |

---

### ステータスカード型配置

| 🟢 システム状態 | ⚡ 処理パフォーマンス | 🔒 セキュリティ |
| :---: | :---: | :---: |
| **正常稼働中** | **0.02 秒** 応答 | **完全ローカル** 実行 |`,

                layout_accordion: `# 折りたたみ (アコーディオン) レイアウト

<details>
<summary><b>▶ セクション1: 詳細設定を開く (クリックで展開)</b></summary>

### 展開時のコンテンツ
ここに隠されていた詳細情報や設定項目を記述します。
- 項目 A: 設定値 100
- 項目 B: 有効化済み

\`\`\`json
{
  "setting": "enabled",
  "debug": false
}
\`\`\`
</details>

<details>
<summary><b>▶ セクション2: よくある質問 (FAQ)</b></summary>

> **Q: データの保存先はどこですか？**  
> A: すべてブラウザローカル（LocalStorage）に保存されます。外部送信はありません。
</details>`,

                layout_dashboard: `# プロジェクト概要ダッシュボード

![Build Status](https://img.shields.io/badge/build-passing-brightgreen) ![Version](https://img.shields.io/badge/version-v1.2.0-blue) ![License](https://img.shields.io/badge/license-MIT-green)

---

### クイックナビゲーション
[ [📄 ドキュメント](#) ] &nbsp;&nbsp; [ [⚡ ライブデモ](#) ] &nbsp;&nbsp; [ [🐛 不具合報告](#) ]

---

### コンポーネント進捗状況
- [x] コアエンジン設計
- [x] UI/UX 改善およびレスポンシブ最適化
- [ ] プラグインシステム構築`,

                layout_typography_skeleton: `# H1 大見出しタイトル

## H2 中項目セクション

### H3 小項目見出し

---

本文テキストです。**太字強調**、*斜体*、~~打ち消し線~~、<u>下線</u>、および \`インラインコード\` を組み合わせた段落例です。

> 引用テキストブロック：主要な要約やステートメントをここに配置します。

---

- **箇条書きリスト 1**: 説明テキスト
  - ネストされたリスト項目 A
  - ネストされたリスト項目 B
1. **番号付きリスト 1**: 手順の記述
2. **番号付きリスト 2**: 次のステップ`,

                layout_badges_status: `# バッジ & ステータス表示レイアウト

### 1. Shields.io バッジ群 (ステータス表示)
![Build Status](https://img.shields.io/badge/build-passing-brightgreen)
![Version](https://img.shields.io/badge/version-v1.2.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Platform](https://img.shields.io/badge/platform-Web%20%7C%20PWA-orange)

### 2. インラインステータス・タスク進捗
- [x] **コアエンジン**: クライアントサイド完結ロジック実装済み
- [x] **UI調整**: ダークテーマ＆可読性コントラスト調整完了
- [ ] **追加拡張**: オプションプラグイン構築中

### 3. ボタン風リンク & アクション
[ [📄 ドキュメントを開く](https://example.com) ] &nbsp;&nbsp; [ [⚡ デモを実行](https://example.com) ]`,

                layout_tables: `# データ比較・各種揃えテーブルレイアウト

| ID | ツール名 | カテゴリ | 処理方式 | 評価 |
| :--- | :--- | :---: | :---: | ---: |
| **#01** | REAPERパス編集 | 音響・DAW | テキスト一括置換 | ★★★★★ |
| **#02** | 文字化け復元 | エンコード | バイナリ再解読 | ★★★★★ |
| **#03** | URLエンコード | Web基本 | Percent-Encoding | ★★★★☆ |
| **#04** | スプライト切り出し | 画像処理 | Canvas 2D | ★★★★★ |

> [!NOTE]
> \`:---\` は左揃え、\`:---:\` は中央揃え、\`---:\` は右揃えを表します。`,

                layout_code_console: `# コード・Diff 比較・ログ出力レイアウト

### 1. 差分比較 (Diff Format)
\`\`\`diff
- 原色の派手なアクセントカラー設定 (#38bdf8 / #34d399)
+ 落ち着いたトーンの統一カラーシステム (#3b82f6 / #10b981)
! 注意: 見やすいアクセントコントラストを維持
\`\`\`

### 2. ログ / コンソール出力風
\`\`\`console
[SYSTEM] Initializing Web Tools...
[INFO]   Offline Service Worker registered.
[SUCCESS] All 15 tools loaded successfully in 12ms.
> Ready for input.
\`\`\`

### 3. 多言語インライン・ブロックコード
JavaScript (\`.js\`):
\`\`\`javascript
const convertPath = (rawText, fromPath, toPath) => {
    return rawText.replaceAll(fromPath, toPath);
};
\`\`\``,

                layout_discord_components: `# Discord 特殊装飾パーツ集

### 1. スポイラー (クリックで隠し解除)
||この文字はクリックするまで隠されます||

### 2. サブテキスト (補足小文字)
-# ※ この表記はDiscord上で小さくグレーで表示されます

### 3. 動的タイムスタンプ (相手の時域に合わせて自動変換)
- **日時フル表示**: <t:1735689600:F>
- **相対時間表示**: <t:1735689600:R>
- **時刻のみ**: <t:1735689600:t>

### 4. 引用 & 装飾見出し
> **【重要なお知らせ】**
> 本文テキストの引用ライン表示です。`
            };

            // Custom Markdown Formatter for marked.js
            function customMarkdownParse(src) {
                if (!src) return '';

                let text = src;

                // 1. Process GitHub Callouts / Alerts (> [!NOTE], > [!TIP], > [!IMPORTANT], > [!WARNING], > [!CAUTION])
                text = text.replace(/^>[ \t]*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\][ \t]*\n((?:^>[ \t]*.*(?:\n|$))*)/gim, (match, type, content) => {
                    const cleanType = type.toUpperCase();
                    const cleanContent = content.replace(/^>[ \t]?/gm, '');
                    const iconMap = {
                        NOTE: '[NOTE]',
                        TIP: '[TIP]',
                        IMPORTANT: '[IMPORTANT]',
                        WARNING: '[WARNING]',
                        CAUTION: '[CAUTION]'
                    };
                    const typeClass = 'gh-alert-' + cleanType.toLowerCase();
                    return `<div class="gh-alert ${typeClass}"><div class="gh-alert-title">${iconMap[cleanType] || cleanType}</div>${marked.parse(cleanContent)}</div>\n\n`;
                });

                // 2. Process Discord Subtext (-# text at start of lines)
                text = text.replace(/^-#\s+(.+)$/gm, '<span class="discord-subtext">$1</span>');

                // 3. Process Discord Spoilers (||text||)
                text = text.replace(/\|\|([\s\S]+?)\|\|/g, '<span class="discord-spoiler" onclick="this.classList.toggle(\'revealed\')" title="クリックで表示">$1</span>');

                // 4. Process Discord Timestamp Tags (<t:1234567890:R> etc)
                text = text.replace(/<t:(\d+)(?::([a-zA-Z]))?>/g, (match, timestamp, format) => {
                    const date = new Date(parseInt(timestamp, 10) * 1000);
                    let formatted = isNaN(date.getTime()) ? match : date.toLocaleString('ja-JP');
                    return `<span class="discord-timestamp-badge" title="Unix: ${timestamp}">${formatted}</span>`;
                });

                // 5. Marked.js Core Parsing
                let html = '';
                if (typeof marked !== 'undefined' && marked.parse) {
                    html = marked.parse(text, {
                        breaks: true,
                        gfm: true
                    });
                } else {
                    html = '<pre>' + text.replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</pre>';
                }

                // 6. Post-process code blocks with Copy button
                html = html.replace(/<pre><code([^>]*)>([\s\S]*?)<\/code><\/pre>/g, (match, codeAttr, codeContent) => {
                    return `<pre><button class="code-copy-btn" onclick="navigator.clipboard.writeText(this.nextElementSibling.innerText).then(() => { this.textContent = 'コピー完了'; setTimeout(() => this.textContent = 'コピー', 1500); })">コピー</button><code${codeAttr}>${codeContent}</code></pre>`;
                });

                return html;
            }

            // Real-time Render & Stats calculation
            function renderMarkdown() {
                const text = textarea.value;

                // 1. Render Preview
                if (!text.trim()) {
                    previewContainer.innerHTML = '<div style="color: var(--text-muted); font-size: 12px; text-align: center; padding-top: 40px;">マークダウンを入力すると、リアルタイムでプレビューが生成されます</div>';
                } else {
                    previewContainer.innerHTML = customMarkdownParse(text);
                }

                // 2. Calculate Stats
                const totalChars = Array.from(text).length;
                const noSpaceChars = Array.from(text.replace(/[\s\u3000\r\n\t]/g, '')).length;
                const lines = text ? text.split('\n').length : 0;
                const words = text.trim() ? (text.match(/[\w\d\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+/gu) || []).length : 0;
                const readMinutes = Math.ceil(totalChars / 500);

                statTotalChars.textContent = totalChars.toLocaleString();
                statNoSpaceChars.textContent = noSpaceChars.toLocaleString();
                statWords.textContent = words.toLocaleString();
                statLines.textContent = lines.toLocaleString();
                statReadTime.textContent = totalChars > 0 ? `約 ${readMinutes} 分` : '約 0 分';

                // 3. Discord Meter (2,000 char threshold)
                const DISCORD_LIMIT = 2000;
                const remaining = DISCORD_LIMIT - totalChars;
                const pct = Math.min(100, (totalChars / DISCORD_LIMIT) * 100);

                if (totalChars <= DISCORD_LIMIT) {
                    discordMeterText.textContent = `${totalChars.toLocaleString()} / 2,000 文字 (残り ${remaining.toLocaleString()}字)`;
                    discordMeterBar.style.width = `${pct}%`;
                    discordMeterBar.style.backgroundColor = pct > 80 ? 'var(--accent-amber)' : 'var(--accent-primary)';
                    discordStatusBadge.textContent = '1枠で投稿可能';
                    discordStatusBadge.style.color = 'var(--accent-green)';
                    discordStatusBadge.style.borderColor = 'rgba(52, 211, 153, 0.4)';
                    discordStatusBadge.style.backgroundColor = 'rgba(52, 211, 153, 0.12)';
                } else {
                    const postCount = Math.ceil(totalChars / DISCORD_LIMIT);
                    discordMeterText.textContent = `${totalChars.toLocaleString()} / 2,000 文字 (${totalChars - DISCORD_LIMIT}字 超過)`;
                    discordMeterBar.style.width = '100%';
                    discordMeterBar.style.backgroundColor = 'var(--accent-red)';
                    discordStatusBadge.textContent = `⚠️ ${postCount}枠に分割が必要`;
                    discordStatusBadge.style.color = 'var(--accent-red)';
                    discordStatusBadge.style.borderColor = 'rgba(248, 113, 113, 0.4)';
                    discordStatusBadge.style.backgroundColor = 'rgba(248, 113, 113, 0.12)';
                }

                // 4. Update Cursor Info
                updateCursorInfo();

                // 5. Auto Save to LocalStorage
                try {
                    localStorage.setItem('workspace_markdown_draft', text);
                    if (saveStatus) {
                        saveStatus.textContent = '🟢 自動保存: 完了';
                        saveStatus.style.color = 'var(--accent-green)';
                    }
                } catch (e) {
                    console.warn('LocalStorage save failed', e);
                }
            }

            function updateCursorInfo() {
                const start = textarea.selectionStart;
                const end = textarea.selectionEnd;
                const val = textarea.value;
                const lines = val.substring(0, start).split('\n');
                const lineNum = lines.length;
                const colNum = lines[lines.length - 1].length + 1;
                const selCount = end - start;

                cursorInfo.textContent = `行: ${lineNum} 列: ${colNum} | 選択: ${selCount}文字`;
            }

            // Text Selection Manipulation Helpers
            function wrapSelection(before, after = before, defaultText = 'テキスト') {
                textarea.focus();
                const start = textarea.selectionStart;
                const end = textarea.selectionEnd;
                const text = textarea.value;
                const selected = text.substring(start, end);

                let replacement = '';
                let newCursorPos = start + before.length;

                if (selected) {
                    replacement = before + selected + after;
                    newCursorPos = start + replacement.length;
                } else {
                    replacement = before + defaultText + after;
                    newCursorPos = start + before.length;
                }

                textarea.setRangeText(replacement, start, end, 'select');
                if (!selected) {
                    textarea.setSelectionRange(start + before.length, start + before.length + defaultText.length);
                }
                pushHistory(textarea.value);
                renderMarkdown();
            }

            function prefixLines(prefix, defaultLineText = '項目') {
                textarea.focus();
                const start = textarea.selectionStart;
                const end = textarea.selectionEnd;
                const text = textarea.value;

                if (start === end) {
                    // Single line prefix
                    const lineStart = text.lastIndexOf('\n', start - 1) + 1;
                    let lineEnd = text.indexOf('\n', start);
                    if (lineEnd === -1) lineEnd = text.length;

                    const curLine = text.substring(lineStart, lineEnd);
                    const newLine = curLine.startsWith(prefix) ? curLine.substring(prefix.length) : prefix + (curLine || defaultLineText);

                    textarea.setRangeText(newLine, lineStart, lineEnd, 'end');
                } else {
                    // Multi line prefix
                    const lineStart = text.lastIndexOf('\n', start - 1) + 1;
                    let lineEnd = text.indexOf('\n', end);
                    if (lineEnd === -1) lineEnd = text.length;

                    const block = text.substring(lineStart, lineEnd);
                    const lines = block.split('\n');
                    const allPrefixed = lines.every(l => l.startsWith(prefix));

                    const newLines = lines.map((l, idx) => {
                        if (allPrefixed) {
                            return l.substring(prefix.length);
                        } else if (prefix === '1. ') {
                            return `${idx + 1}. ` + l.replace(/^\d+\.\s*/, '');
                        } else {
                            return prefix + l;
                        }
                    });

                    textarea.setRangeText(newLines.join('\n'), lineStart, lineEnd, 'select');
                }
                pushHistory(textarea.value);
                renderMarkdown();
            }

            function transformSelection(fn) {
                textarea.focus();
                const start = textarea.selectionStart;
                const end = textarea.selectionEnd;
                const text = textarea.value;

                if (start === end) {
                    // Transform entire document if nothing selected
                    textarea.value = fn(text);
                    textarea.setSelectionRange(start, start);
                } else {
                    const selected = text.substring(start, end);
                    const transformed = fn(selected);
                    textarea.setRangeText(transformed, start, end, 'select');
                }
                pushHistory(textarea.value);
                renderMarkdown();
            }

            // Toolbar Button Bindings
            if (btnBold) btnBold.addEventListener('click', () => wrapSelection('**', '**', '太字テキスト'));
            if (btnItalic) btnItalic.addEventListener('click', () => wrapSelection('*', '*', '斜体テキスト'));
            if (btnStrike) btnStrike.addEventListener('click', () => wrapSelection('~~', '~~', '打ち消しテキスト'));
            if (btnUnderline) btnUnderline.addEventListener('click', () => wrapSelection('<u>', '</u>', '下線テキスト'));
            if (btnInlineCode) btnInlineCode.addEventListener('click', () => wrapSelection('`', '`', 'code'));
            if (btnH1) btnH1.addEventListener('click', () => prefixLines('# ', '見出し 1'));
            if (btnH2) btnH2.addEventListener('click', () => prefixLines('## ', '見出し 2'));
            if (btnH3) btnH3.addEventListener('click', () => prefixLines('### ', '見出し 3'));
            if (btnUl) btnUl.addEventListener('click', () => prefixLines('- ', 'リスト項目'));
            if (btnOl) btnOl.addEventListener('click', () => prefixLines('1. ', '番号付き項目'));
            if (btnTask) btnTask.addEventListener('click', () => prefixLines('- [ ] ', 'タスク項目'));
            if (btnQuote) btnQuote.addEventListener('click', () => prefixLines('> ', '引用テキスト'));
            if (btnHr) btnHr.addEventListener('click', () => wrapSelection('\n\n---\n\n', '', ''));
            if (btnLink) btnLink.addEventListener('click', () => wrapSelection('[', '](https://example.com)', 'リンクテキスト'));
            if (btnImage) btnImage.addEventListener('click', () => wrapSelection('![', '](https://via.placeholder.com/600x300)', '代替テキスト'));

            if (btnCodeBlock) btnCodeBlock.addEventListener('click', () => {
                textarea.focus();
                const start = textarea.selectionStart;
                const end = textarea.selectionEnd;
                const selected = textarea.value.substring(start, end) || '// ここにコードを入力';
                wrapSelection('```typescript\n', '\n```', selected);
            });

            if (btnTable) btnTable.addEventListener('click', () => {
                const sampleTable = `\n| 項目名 | 説明 | 状態 |\n| :--- | :--- | :---: |\n| データ1 | 内容の詳細 | ✅ 完了 |\n| データ2 | サンプル記述 | ⏳ 進行中 |\n\n`;
                wrapSelection(sampleTable, '', '');
            });

            // Discord Tools
            if (btnDiscordSpoiler) btnDiscordSpoiler.addEventListener('click', () => wrapSelection('||', '||', '隠しネタバレ'));
            if (btnDiscordSubtext) btnDiscordSubtext.addEventListener('click', () => prefixLines('-# ', '小さな補足テキスト'));
            if (btnDiscordTimestamp) btnDiscordTimestamp.addEventListener('click', () => {
                const nowUnix = Math.floor(Date.now() / 1000);
                wrapSelection(`<t:${nowUnix}:F> (<t:${nowUnix}:R>)`, '', '');
                showToast('Discord用タイムスタンプタグを挿入しました');
            });
            if (btnDiscordQuoteMulti) btnDiscordQuoteMulti.addEventListener('click', () => prefixLines('>>> ', '全体引用テキスト'));
            if (btnDiscordAnsi) btnDiscordAnsi.addEventListener('click', () => {
                const ansiBlock = `\`\`\`ansi\n\u001b[1;32m[SUCCESS]\u001b[0m 正常に完了しました\n\u001b[1;31m[ERROR]\u001b[0m エラーが発生しました\n\`\`\`\n`;
                wrapSelection(ansiBlock, '', '');
            });

            // GitHub Tools
            if (btnGhAlert) btnGhAlert.addEventListener('click', () => {
                const alertText = `> [!NOTE]\n> ここに重要な注意点や補足情報を記述します。\n\n`;
                wrapSelection(alertText, '', '');
            });
            if (btnDetails) btnDetails.addEventListener('click', () => {
                const detailsText = `<details>\n<summary>詳細を見る (クリックで開閉)</summary>\n\n折りたたまれていた内容がここに展開されます。\n\n</details>\n\n`;
                wrapSelection(detailsText, '', '');
            });
            if (btnShieldsBadge) btnShieldsBadge.addEventListener('click', () => {
                const badgeText = `![Badge](https://img.shields.io/badge/Status-Active-brightgreen)\n`;
                wrapSelection(badgeText, '', '');
            });

            // Text Formatter Tools
            if (btnZenHanAlpha) btnZenHanAlpha.addEventListener('click', () => {
                transformSelection(t => t.replace(/[！-～]/g, s => String.fromCharCode(s.charCodeAt(0) - 0xFEE0)).replace(/　/g, ' '));
                showToast('全角英数を半角に変換しました');
            });

            if (btnHanZenKana) btnHanZenKana.addEventListener('click', () => {
                const kanaMap = {
                    'ｶﾞ':'ガ','ｷﾞ':'ギ','ｸﾞ':'グ','ｹﾞ':'ゲ','ｺﾞ':'ゴ',
                    'ｻﾞ':'ザ','ｼﾞ':'ジ','ｽﾞ':'ズ','ｾﾞ':'ゼ','ｿﾞ':'ゾ',
                    'ﾀﾞ':'ダ','ﾁﾞ':'ヂ','ﾂﾞ':'ヅ','ﾃﾞ':'デ','ﾄﾞ':'ド',
                    'ﾊﾞ':'バ','ﾋﾞ':'ビ','ﾌﾞ':'ブ','ﾍﾞ':'ベ','ﾎﾞ':'ボ',
                    'ﾊﾟ':'パ','ﾋﾟ':'ピ','ﾌﾟ':'プ','ﾍﾟ':'ペ','ﾎﾟ':'ポ',
                    'ｳﾞ':'ヴ','ﾜﾞ':'ヷ','ｦﾞ':'ヺ',
                    'ｱ':'ア','ｲ':'イ','ｳ':'ウ','ｴ':'エ','ｵ':'オ',
                    'ｶ':'カ','ｷ':'キ','ｸ':'ク','ｹ':'ケ','ｺ':'コ',
                    'ｻ':'サ','ｼ':'シ','ｽ':'ス','ｾ':'セ','ｿ':'ソ',
                    'ﾀ':'タ','ﾁ':'チ','ﾂ':'ツ','ﾃ':'テ','ﾄ':'ト',
                    'ﾅ':'ナ','ﾆ':'ニ','ﾇ':'ヌ','ﾈ':'ネ','ﾉ':'ノ',
                    'ﾊ':'ハ','ﾋ':'ヒ','ﾌ':'フ','ﾍ':'ヘ','ﾎ':'ホ',
                    'ﾏ':'マ','ﾐ':'ミ','ﾑ':'ム','ﾒ':'メ','ﾓ':'モ',
                    'ﾔ':'ヤ','ﾕ':'ユ','ﾖ':'ヨ',
                    'ﾗ':'ラ','ﾘ':'リ','ﾙ':'ル','ﾚ':'レ','ﾛ':'ロ',
                    'ﾜ':'ワ','ｦ':'ヲ','ﾝ':'ン',
                    'ｧ':'ァ','ｨ':'ィ','ｩ':'ゥ','ｪ':'ェ','ｫ':'ォ',
                    'ｯ':'ッ','ｬ':'ャ','ｭ':'ュ','ｮ':'ョ',
                    '｡':'。','｢':'「','｣':'」','､':'、','･':'・','ｰ':'ー'
                };
                transformSelection(t => {
                    let res = t;
                    for (const [k, v] of Object.entries(kanaMap)) {
                        res = res.replaceAll(k, v);
                    }
                    return res;
                });
                showToast('半角カナを全角に変換しました');
            });

            if (btnCaseToggle) btnCaseToggle.addEventListener('click', () => {
                transformSelection(t => {
                    if (t === t.toUpperCase()) return t.toLowerCase();
                    if (t === t.toLowerCase()) return t.replace(/\b\w/g, l => l.toUpperCase());
                    return t.toUpperCase();
                });
                showToast('大文字 / 小文字を変換しました');
            });

            if (btnCleanLines) btnCleanLines.addEventListener('click', () => {
                transformSelection(t => {
                    return t
                        .split('\n')
                        .map(line => line.replace(/[ \t]+$/, '')) // trim trailing
                        .join('\n')
                        .replace(/\n{3,}/g, '\n\n') // max 2 line breaks
                        .trim() + '\n';
                });
                showToast('行末空白と連続空行を整理しました');
            });

            if (btnPunctToggle) btnPunctToggle.addEventListener('click', () => {
                transformSelection(t => {
                    const hasJp = t.includes('、') || t.includes('。');
                    if (hasJp) {
                        return t.replaceAll('、', '，').replaceAll('。', '．');
                    } else {
                        return t.replaceAll('，', '、').replaceAll('．', '。');
                    }
                });
                showToast('句読点を切り替えました');
            });

            if (btnUndo) btnUndo.addEventListener('click', triggerUndo);
            if (btnRedo) btnRedo.addEventListener('click', triggerRedo);

            // Template Application
            if (applyTemplateBtn && templateSelect) {
                applyTemplateBtn.addEventListener('click', () => {
                    const key = templateSelect.value;
                    if (!key || !templates[key]) {
                        showToast('テンプレートを選択してください');
                        return;
                    }
                    if (textarea.value.trim() && !confirm('現在の編集内容が上書きされます。テンプレートを適用しますか？')) {
                        return;
                    }
                    textarea.value = templates[key];
                    pushHistory(textarea.value);
                    renderMarkdown();
                    showToast('テンプレートを適用しました');
                });
            }

            // Clear Button
            if (clearBtn) clearBtn.addEventListener('click', () => {
                if (textarea.value.trim() && !confirm('入力内容をクリアしますか？')) return;
                textarea.value = '';
                pushHistory('');
                renderMarkdown();
                showToast('エディタをクリアしました');
            });

            // File Read (.md, .txt)
            if (fileInput) fileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (event) => {
                    textarea.value = event.target.result;
                    if (filenameInput) filenameInput.value = file.name;
                    pushHistory(textarea.value);
                    renderMarkdown();
                    showToast(`「${file.name}」を読み込みました`);
                };
                reader.readAsText(file);
                fileInput.value = '';
            });

            // Save .md file
            if (downloadBtn) downloadBtn.addEventListener('click', () => {
                const text = textarea.value;
                let filename = (filenameInput.value || 'document.md').trim();
                if (!filename.toLowerCase().endsWith('.md') && !filename.toLowerCase().endsWith('.txt')) {
                    filename += '.md';
                }
                const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                showToast(`「${filename}」をダウンロードしました`);
            });

            // Copy Markdown raw
            if (copyMdBtn) copyMdBtn.addEventListener('click', () => {
                const text = textarea.value;
                if (!text.trim()) {
                    showToast('コピーするMarkdownがありません');
                    return;
                }
                navigator.clipboard.writeText(text).then(() => {
                    showToast('Markdownテキストをコピーしました');
                }).catch(() => {
                    showToast('コピーに失敗しました');
                });
            });

            // Copy Discord format
            if (copyDiscordBtn) copyDiscordBtn.addEventListener('click', () => {
                let text = textarea.value;
                if (!text.trim()) {
                    showToast('コピーする文章がありません');
                    return;
                }
                // Adapt github alert syntax to Discord-friendly blockquotes
                text = text.replace(/^>[ \t]*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\][ \t]*/gim, '> **[$1]** ');
                navigator.clipboard.writeText(text).then(() => {
                    showToast('Discord用に整形してコピーしました');
                }).catch(() => {
                    showToast('コピーに失敗しました');
                });
            });

            // Copy Rich Text HTML (for Google Docs / Gmail / Notion)
            if (copyRichHtmlBtn) copyRichHtmlBtn.addEventListener('click', async () => {
                const html = previewContainer.innerHTML;
                const plain = textarea.value;
                if (!plain.trim()) {
                    showToast('コピーする本文がありません');
                    return;
                }
                try {
                    if (navigator.clipboard && window.ClipboardItem) {
                        const blobHtml = new Blob([html], { type: 'text/html' });
                        const blobText = new Blob([plain], { type: 'text/plain' });
                        await navigator.clipboard.write([
                            new ClipboardItem({
                                'text/html': blobHtml,
                                'text/plain': blobText
                            })
                        ]);
                        showToast('書式付きリッチテキストとしてコピーしました (Docs/Gmail等に貼り付け可能)');
                    } else {
                        await navigator.clipboard.writeText(plain);
                        showToast('テキストをコピーしました');
                    }
                } catch (err) {
                    await navigator.clipboard.writeText(plain);
                    showToast('テキストをコピーしました');
                }
            });

            // View Modes Switching
            function setMdViewMode(mode) {
                editorGrid.classList.remove('mode-split', 'mode-editor', 'mode-preview');
                editorGrid.style.gridTemplateColumns = '';
                editorCol.style.display = '';
                previewCol.style.display = '';

                viewModeSplit.classList.remove('btn-primary');
                viewModeEditor.classList.remove('btn-primary');
                viewModePreview.classList.remove('btn-primary');

                if (mode === 'editor') {
                    editorGrid.classList.add('mode-editor');
                    viewModeEditor.classList.add('btn-primary');
                } else if (mode === 'preview') {
                    editorGrid.classList.add('mode-preview');
                    viewModePreview.classList.add('btn-primary');
                } else {
                    editorGrid.classList.add('mode-split');
                    viewModeSplit.classList.add('btn-primary');
                }
            }

            if (viewModeSplit) viewModeSplit.addEventListener('click', () => setMdViewMode('split'));
            if (viewModeEditor) viewModeEditor.addEventListener('click', () => setMdViewMode('editor'));
            if (viewModePreview) viewModePreview.addEventListener('click', () => setMdViewMode('preview'));

            // Input & Keyboard Shortcuts
            let mdRenderAnimationFrame = null;
            textarea.addEventListener('input', () => {
                if (mdRenderAnimationFrame) cancelAnimationFrame(mdRenderAnimationFrame);
                mdRenderAnimationFrame = requestAnimationFrame(() => {
                    renderMarkdown();
                });
            });

            textarea.addEventListener('keyup', updateCursorInfo);
            textarea.addEventListener('click', updateCursorInfo);
            textarea.addEventListener('select', updateCursorInfo);

            // Tab key support & Keyboard Shortcuts
            textarea.addEventListener('keydown', (e) => {
                if (e.key === 'Tab') {
                    e.preventDefault();
                    const start = textarea.selectionStart;
                    const end = textarea.selectionEnd;
                    textarea.setRangeText('  ', start, end, 'end');
                    renderMarkdown();
                } else if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
                    e.preventDefault();
                    wrapSelection('**', '**', '太字');
                } else if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
                    e.preventDefault();
                    wrapSelection('*', '*', '斜体');
                } else if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                    e.preventDefault();
                    wrapSelection('[', '](https://example.com)', 'リンク');
                } else if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                    e.preventDefault();
                    downloadBtn.click();
                }
            });

            // Initial load from LocalStorage or default sample
            try {
                const saved = localStorage.getItem('workspace_markdown_draft');
                if (saved !== null && saved !== undefined) {
                    textarea.value = saved;
                } else {
                    textarea.value = templates.github_readme_full;
                }
            } catch (e) {
                textarea.value = templates.github_readme_full;
            }

            pushHistory(textarea.value);
            renderMarkdown();
        })();

        // ==========================================================================
        // 13. TOOL: 特殊文字・フォント変換 (Unicode Fancy Font & Symbols)
        // ==========================================================================
        (function() {
            // Elements
            const inputEl = document.getElementById('ufInput');
            const prefixEl = document.getElementById('ufCustomPrefix');
            const suffixEl = document.getElementById('ufCustomSuffix');
            const clearDecorBtn = document.getElementById('ufClearDecorBtn');
            const gridEl = document.getElementById('ufGrid');
            const gridContainer = document.getElementById('ufGridContainer');
            const palettePanel = document.getElementById('ufSymbolPalettePanel');
            const counterBadge = document.getElementById('ufCounterBadge');
            const searchInput = document.getElementById('ufSearchInput');
            const categoryTabs = document.querySelectorAll('#ufCategoryTabs .uf-tab-btn');
            const presetDecorBtns = document.querySelectorAll('.uf-preset-decor');

            // Quick actions
            const sample1Btn = document.getElementById('ufSample1Btn');
            const sample2Btn = document.getElementById('ufSample2Btn');
            const upperBtn = document.getElementById('ufUpperBtn');
            const lowerBtn = document.getElementById('ufLowerBtn');
            const titleBtn = document.getElementById('ufTitleBtn');
            const spaceBtn = document.getElementById('ufSpaceBtn');
            const clearBtn = document.getElementById('ufClearBtn');

            // Toast helper
            function ufToast(msg) {
                const toast = document.getElementById('tcToast');
                if (toast) {
                    toast.textContent = msg;
                    toast.classList.add('show');
                    setTimeout(() => toast.classList.remove('show'), 2000);
                }
            }

            // --- UNICODE MAP BUILDERS ---
            function createOffsetMap(normalChars, startCodePoint, exceptions = {}) {
                const map = {};
                for (let i = 0; i < normalChars.length; i++) {
                    const char = normalChars[i];
                    if (exceptions[char]) {
                        map[char] = exceptions[char];
                    } else {
                        map[char] = String.fromCodePoint(startCodePoint + i);
                    }
                }
                return map;
            }

            const UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
            const LOWER = "abcdefghijklmnopqrstuvwxyz";
            const DIGITS = "0123456789";

            // 1. Bold (Serif)
            const mapBoldUpper = createOffsetMap(UPPER, 0x1D400);
            const mapBoldLower = createOffsetMap(LOWER, 0x1D41A);
            const mapBoldDigits = createOffsetMap(DIGITS, 0x1D7CE);

            // 2. Italic (Serif)
            const mapItalicUpper = createOffsetMap(UPPER, 0x1D434);
            const mapItalicLower = createOffsetMap(LOWER, 0x1D44E, { 'h': '\u210E' });

            // 3. Bold Italic (Serif)
            const mapBoldItalicUpper = createOffsetMap(UPPER, 0x1D468);
            const mapBoldItalicLower = createOffsetMap(LOWER, 0x1D482);

            // 4. Script / Cursive (草書・筆記体)
            const scriptExceptionsUpper = {
                'B': '\u212C', 'E': '\u2130', 'F': '\u2131', 'H': '\u210B',
                'I': '\u2110', 'L': '\u2112', 'M': '\u2133', 'R': '\u211B'
            };
            const scriptExceptionsLower = {
                'e': '\u212F', 'g': '\u210A', 'o': '\u2134'
            };
            const mapScriptUpper = createOffsetMap(UPPER, 0x1D49C, scriptExceptionsUpper);
            const mapScriptLower = createOffsetMap(LOWER, 0x1D4B6, scriptExceptionsLower);

            // 5. Bold Script (太字筆記体)
            const mapBoldScriptUpper = createOffsetMap(UPPER, 0x1D4D0);
            const mapBoldScriptLower = createOffsetMap(LOWER, 0x1D4EA);

            // 6. Fraktur / Old English (中世ゴシック)
            const frakturExceptionsUpper = {
                'C': '\u212D', 'H': '\u210C', 'I': '\u2111', 'R': '\u211C', 'Z': '\u2128'
            };
            const mapFrakturUpper = createOffsetMap(UPPER, 0x1D504, frakturExceptionsUpper);
            const mapFrakturLower = createOffsetMap(LOWER, 0x1D51E);

            // 7. Bold Fraktur (太字中世ゴシック)
            const mapBoldFrakturUpper = createOffsetMap(UPPER, 0x1D56C);
            const mapBoldFrakturLower = createOffsetMap(LOWER, 0x1D586);

            // 8. Double-Struck / Blackboard Bold (白抜き)
            const bbExceptionsUpper = {
                'C': '\u2102', 'H': '\u210D', 'N': '\u2115', 'P': '\u2119',
                'Q': '\u211A', 'R': '\u211D', 'Z': '\u2124'
            };
            const mapBbUpper = createOffsetMap(UPPER, 0x1D538, bbExceptionsUpper);
            const mapBbLower = createOffsetMap(LOWER, 0x1D552);
            const mapBbDigits = createOffsetMap(DIGITS, 0x1D7D8);

            // 9. Sans-Serif
            const mapSansUpper = createOffsetMap(UPPER, 0x1D5A0);
            const mapSansLower = createOffsetMap(LOWER, 0x1D5BA);
            const mapSansDigits = createOffsetMap(DIGITS, 0x1D7E2);

            // 10. Sans-Serif Bold
            const mapSansBoldUpper = createOffsetMap(UPPER, 0x1D5D4);
            const mapSansBoldLower = createOffsetMap(LOWER, 0x1D5EE);
            const mapSansBoldDigits = createOffsetMap(DIGITS, 0x1D7EC);

            // 11. Sans-Serif Italic
            const mapSansItalicUpper = createOffsetMap(UPPER, 0x1D608);
            const mapSansItalicLower = createOffsetMap(LOWER, 0x1D622);

            // 12. Sans-Serif Bold Italic
            const mapSansBoldItalicUpper = createOffsetMap(UPPER, 0x1D63C);
            const mapSansBoldItalicLower = createOffsetMap(LOWER, 0x1D656);

            // 13. Monospace / Typewriter (等幅)
            const mapMonoUpper = createOffsetMap(UPPER, 0x1D670);
            const mapMonoLower = createOffsetMap(LOWER, 0x1D68A);
            const mapMonoDigits = createOffsetMap(DIGITS, 0x1D7F6);

            // 14. Circled (丸囲み)
            const mapCircledUpper = createOffsetMap(UPPER, 0x24B6);
            const mapCircledLower = createOffsetMap(LOWER, 0x24D0);
            const mapCircledDigits = {
                '0': '⓪', '1': '①', '2': '②', '3': '③', '4': '④',
                '5': '⑤', '6': '⑥', '7': '⑦', '8': '⑧', '9': '⑨'
            };

            // 15. Inverse Circled (黒丸囲み)
            const mapInvCircledUpper = createOffsetMap(UPPER, 0x1F150);
            const mapInvCircledDigits = {
                '0': '⓿', '1': '➊', '2': '➋', '3': '➌', '4': '➍',
                '5': '➎', '6': '➏', '7': '➐', '8': '➑', '9': '➒'
            };

            // 16. Squared (四角囲み)
            const mapSquaredUpper = createOffsetMap(UPPER, 0x1F130);

            // 17. Inverse Squared (黒四角囲み)
            const mapInvSquaredUpper = createOffsetMap(UPPER, 0x1F170);

            // 18. Fullwidth (全角英数)
            const mapFullUpper = createOffsetMap(UPPER, 0xFF21);
            const mapFullLower = createOffsetMap(LOWER, 0xFF41);
            const mapFullDigits = createOffsetMap(DIGITS, 0xFF10);

            // 19. Small Caps (スモールキャピタル)
            const mapSmallCaps = {
                'a':'ᴀ','b':'ʙ','c':'ᴄ','d':'ᴅ','e':'ᴇ','f':'ғ','g':'ɢ','h':'ʜ','i':'ɪ',
                'j':'ᴊ','k':'ᴋ','l':'ʟ','m':'ᴍ','n':'ɴ','o':'ᴏ','p':'ᴘ','q':'ǫ','r':'ʀ',
                's':'s','t':'ᴛ','u':'ᴜ','v':'ᴠ','w':'ᴡ','x':'x','y':'ʏ','z':'ᴢ',
                'A':'ᴀ','B':'ʙ','C':'ᴄ','D':'ᴅ','E':'ᴇ','F':'ғ','G':'ɢ','H':'ʜ','I':'ɪ',
                'J':'ᴊ','K':'ᴋ','L':'ʟ','M':'ᴍ','N':'ɴ','O':'ᴏ','P':'ᴘ','Q':'ǫ','R':'ʀ',
                'S':'s','T':'ᴛ','U':'ᴜ','V':'ᴠ','W':'ᴡ','X':'x','Y':'ʏ','Z':'ᴢ'
            };

            // 20. Superscript (上付き)
            const mapSuper = {
                '0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹',
                '+':'⁺','-':'⁻','=':'⁼','(':'⁽',')':'⁾',
                'a':'ᵃ','b':'ᵇ','c':'ᶜ','d':'ᵈ','e':'ᵉ','f':'ᶠ','g':'ᵍ','h':'ʰ','i':'ⁱ',
                'j':'ʲ','k':'ᵏ','l':'ˡ','m':'ᵐ','n':'ⁿ','o':'ᵒ','p':'ᵖ','r':'ʳ','s':'ˢ',
                't':'ᵗ','u':'ᵘ','v':'ᵛ','w':'ʷ','x':'ˣ','y':'ʸ','z':'ᶻ',
                'A':'ᴬ','B':'ᴮ','C':'ᶜ','D':'ᴰ','E':'ᴱ','F':'ᶠ','G':'ᴳ','H':'ᴴ','I':'ᴵ',
                'J':'ᴶ','K':'ᴷ','L':'ᴸ','M':'ᴹ','N':'ᴺ','O':'ᴼ','P':'ᴾ','R':'ᴿ','T':'ᵀ','U':'ᵁ','W':'ᵂ'
            };

            // 21. Subscript (下付き)
            const mapSub = {
                '0':'₀','1':'₁','2':'₂','3':'₃','4':'₄','5':'₅','6':'₆','7':'₇','8':'₈','9':'₉',
                '+':'₊','-':'₋','=':'₌','(':'₍',')':'₎',
                'a':'ₐ','e':'ₑ','h':'ₕ','i':'ᵢ','j':'ⱼ','k':'ₖ','l':'ₗ','m':'ₘ','n':'ₙ',
                'o':'ₒ','p':'ₚ','r':'ᵣ','s':'ₛ','t':'ₜ','u':'ᵤ','v':'ᵥ','x':'ₓ',
                'A':'ₐ','E':'ₑ','H':'ₕ','I':'ᵢ','J':'ⱼ','K':'ₖ','L':'ₗ','M':'ₘ','N':'ₙ','O':'ₒ','P':'ₚ','R':'ᵣ','S':'ₛ','T':'ₜ','U':'ᵤ','V':'ᵥ','X':'ₓ'
            };

            // 22. Upside Down (上下反転)
            const mapUpsideDown = {
                'a':'ɐ','b':'q','c':'ɔ','d':'p','e':'ǝ','f':'ɟ','g':'ƃ','h':'ɥ','i':'ᴉ',
                'j':'ɾ','k':'ʞ','l':'l','m':'ɯ','n':'u','o':'o','p':'d','q':'b','r':'ɹ',
                's':'s','t':'ʇ','u':'n','v':'ʌ','w':'ʍ','x':'x','y':'ʎ','z':'z',
                'A':'∀','B':'q','C':'Ɔ','D':'p','E':'Ǝ','F':'Ⅎ','G':'פ','H':'H','I':'I',
                'J':'ſ','K':'ʞ','L':'˥','M':'W','N':'N','O':'O','P':'Ԁ','Q':'Ò','R':'ᴚ',
                'S':'S','T':'┴','U':'∩','V':'Λ','W':'M','X':'X','Y':'⅄','Z':'Z',
                '0':'0','1':'Ɩ','2':'ᄅ','3':'Ɛ','4':'ㄣ','5':'ϛ','6':'9','7':'ㄥ','8':'8','9':'6',
                '.':'˙',',':'\'','?':'¿','!':'¡','\'':',','"':'„','_':'‾'
            };

            // 23. Mirrored (左右反転)
            const mapMirror = {
                'a':'ɒ','b':'d','c':'ɔ','d':'b','e':'ɘ','f':'Ꮈ','g':'ǫ','h':'ʜ','i':'i',
                'j':'į','k':'ʞ','l':'l','m':'m','n':'n','o':'o','p':'q','q':'p','r':'ɿ',
                's':'ƨ','t':'ƚ','u':'u','v':'v','w':'w','x':'x','y':'ʏ','z':'ƹ',
                'A':'A','B':'ᗺ','C':'Ɔ','D':'ᗡ','E':'Ǝ','F':'ᖵ','G':'Ꭾ','H':'H','I':'I',
                'J':'ᒐ','K':'ʞ','L':'⅃','M':'M','N':'И','O':'O','P':'Գ','Q':'Ọ','R':'Я',
                'S':'Ƨ','T':'T','U':'U','V':'V','W':'W','X':'X','Y':'Y','Z':'Ƶ'
            };

            // Helper to apply map dictionary
            function applyCharMap(str, ...maps) {
                const combined = Object.assign({}, ...maps);
                return Array.from(str).map(ch => combined[ch] !== undefined ? combined[ch] : ch).join('');
            }

            // Helper to apply combining mark
            function applyCombining(str, mark) {
                return Array.from(str).map(ch => ch === ' ' || ch === '\n' ? ch : ch + mark).join('');
            }

            // Zalgo Glitch Generator
            const ZALGO_UP = ['\u030d','\u030e','\u0304','\u0305','\u033f','\u0311','\u0306','\u0310','\u0352','\u0357','\u0351','\u0307','\u0308','\u030a','\u0342','\u0343','\u0344','\u034a','\u034b','\u034c','\u0303','\u0302','\u030c','\u0350','\u0300','\u0301','\u030b','\u030f','\u0312','\u0313','\u0314','\u033d'];
            const ZALGO_DOWN = ['\u0316','\u0317','\u0318','\u0319','\u031c','\u031d','\u031e','\u031f','\u0320','\u0324','\u0325','\u0326','\u0329','\u032a','\u032b','\u032c','\u032d','\u032e','\u032f','\u0330','\u0331','\u0332','\u0333','\u0339','\u033a','\u033b','\u033c','\u0345','\u0347','\u0348','\u0349','\u034d','\u034e','\u0353','\u0354','\u0355','\u0356','\u0359','\u035a','\u0323'];
            const ZALGO_MID = ['\u0315','\u031b','\u0340','\u0341','\u0358','\u0321','\u0322','\u0327','\u0328','\u0334','\u0335','\u0336','\u034f','\u035c','\u035d','\u035e','\u035f','\u0360','\u0362','\u0338','\u0337','\u0361'];

            function zalgoText(text) {
                let result = '';
                for (let i = 0; i < text.length; i++) {
                    const c = text[i];
                    if (c === ' ' || c === '\n') {
                        result += c;
                        continue;
                    }
                    result += c;
                    // add 1-2 diacritics
                    result += ZALGO_UP[(c.charCodeAt(0) + i) % ZALGO_UP.length];
                    result += ZALGO_DOWN[(c.charCodeAt(0) * 3 + i) % ZALGO_DOWN.length];
                    if (i % 2 === 0) {
                        result += ZALGO_MID[(c.charCodeAt(0) + i * 2) % ZALGO_MID.length];
                    }
                }
                return result;
            }

            // --- DEFINITION OF ALL 48+ STYLES ---
            const FONT_STYLES = [
                // 1. CURSIVE / SERIF
                {
                    id: 'cursive_math',
                    name: '筆記体 (Script / Cursive)',
                    tag: '筆記体・英語・エレガント',
                    cat: 'cursive',
                    fn: t => applyCharMap(t, mapScriptUpper, mapScriptLower)
                },
                {
                    id: 'cursive_bold',
                    name: '太字筆記体 (Bold Script)',
                    tag: '太字筆記体・エレガント・強調',
                    cat: 'cursive',
                    fn: t => applyCharMap(t, mapBoldScriptUpper, mapBoldScriptLower)
                },
                {
                    id: 'italic_serif',
                    name: '斜体セリフ (Italic Serif)',
                    tag: '斜体・イタリック・標準',
                    cat: 'cursive',
                    fn: t => applyCharMap(t, mapItalicUpper, mapItalicLower)
                },
                {
                    id: 'bold_italic_serif',
                    name: '太字斜体 (Bold Italic)',
                    tag: '太字斜体・セリフ・強調',
                    cat: 'cursive',
                    fn: t => applyCharMap(t, mapBoldItalicUpper, mapBoldItalicLower)
                },
                {
                    id: 'small_caps',
                    name: 'スモールキャピタル (Small Caps)',
                    tag: '小文字大文字化・学術・上品',
                    cat: 'cursive',
                    fn: t => applyCharMap(t, mapSmallCaps)
                },

                // 2. GOTHIC / BOLD / MONO
                {
                    id: 'bold_serif',
                    name: '太字セリフ (Bold Serif)',
                    tag: '太字・明朝風・強調',
                    cat: 'gothic',
                    fn: t => applyCharMap(t, mapBoldUpper, mapBoldLower, mapBoldDigits)
                },
                {
                    id: 'sans_regular',
                    name: 'サンセリフ (Sans-Serif)',
                    tag: 'ゴシック・シンプル・現代的',
                    cat: 'gothic',
                    fn: t => applyCharMap(t, mapSansUpper, mapSansLower, mapSansDigits)
                },
                {
                    id: 'sans_bold',
                    name: '太字サンセリフ (Bold Sans-Serif)',
                    tag: '太字ゴシック・視認性・SNS最適',
                    cat: 'gothic',
                    fn: t => applyCharMap(t, mapSansBoldUpper, mapSansBoldLower, mapSansBoldDigits)
                },
                {
                    id: 'sans_italic',
                    name: '斜体サンセリフ (Italic Sans)',
                    tag: '斜体ゴシック・スポーティ',
                    cat: 'gothic',
                    fn: t => applyCharMap(t, mapSansItalicUpper, mapSansItalicLower)
                },
                {
                    id: 'sans_bold_italic',
                    name: '太字斜体サンセリフ (Bold Italic Sans)',
                    tag: '太字斜体ゴシック・疾走感',
                    cat: 'gothic',
                    fn: t => applyCharMap(t, mapSansBoldItalicUpper, mapSansBoldItalicLower)
                },
                {
                    id: 'fraktur',
                    name: 'フラクトゥール (Fraktur / Old English)',
                    tag: '中世ゴシック・ダーク・ヴィンテージ',
                    cat: 'gothic',
                    fn: t => applyCharMap(t, mapFrakturUpper, mapFrakturLower)
                },
                {
                    id: 'bold_fraktur',
                    name: '太字フラクトゥール (Bold Fraktur)',
                    tag: '重厚ゴシック・中世・迫力',
                    cat: 'gothic',
                    fn: t => applyCharMap(t, mapBoldFrakturUpper, mapBoldFrakturLower)
                },
                {
                    id: 'double_struck',
                    name: '白抜き文字 (Blackboard Bold)',
                    tag: '白抜き・黒板・数学・ポップ',
                    cat: 'gothic',
                    fn: t => applyCharMap(t, mapBbUpper, mapBbLower, mapBbDigits)
                },
                {
                    id: 'monospace',
                    name: '等幅 / タイプライター (Monospace)',
                    tag: '等幅・コード・タイプライター',
                    cat: 'gothic',
                    fn: t => applyCharMap(t, mapMonoUpper, mapMonoLower, mapMonoDigits)
                },
                {
                    id: 'fullwidth',
                    name: '全角英数 (Fullwidth / Vaporwave)',
                    tag: '全角・レトロPC・エモい',
                    cat: 'gothic',
                    fn: t => applyCharMap(t, mapFullUpper, mapFullLower, mapFullDigits)
                },

                // 3. ENCLOSED (囲み・丸・四角)
                {
                    id: 'circled',
                    name: '丸囲み文字 (Circled)',
                    tag: '丸・囲み文字・番号',
                    cat: 'enclosed',
                    fn: t => applyCharMap(t, mapCircledUpper, mapCircledLower, mapCircledDigits)
                },
                {
                    id: 'inv_circled',
                    name: '黒丸反転囲み (Inverse Circled)',
                    tag: '黒丸・白抜き・目立つ',
                    cat: 'enclosed',
                    fn: t => applyCharMap(t, mapInvCircledUpper, mapInvCircledUpper, mapInvCircledDigits)
                },
                {
                    id: 'squared',
                    name: '四角囲み文字 (Squared)',
                    tag: '四角・ボックス・スタンプ',
                    cat: 'enclosed',
                    fn: t => applyCharMap(t, mapSquaredUpper, mapSquaredUpper)
                },
                {
                    id: 'inv_squared',
                    name: '黒四角反転囲み (Inverse Squared)',
                    tag: '黒四角・アイコン風・バナー',
                    cat: 'enclosed',
                    fn: t => applyCharMap(t, mapInvSquaredUpper, mapInvSquaredUpper)
                },
                {
                    id: 'brackets_curly',
                    name: '曲面括弧 (Curved Parentheses)',
                    tag: '括弧・丸み・可愛い',
                    cat: 'enclosed',
                    fn: t => Array.from(t).map(c => c === ' ' ? ' ' : `(${c})`).join('')
                },
                {
                    id: 'brackets_box',
                    name: '角括弧ボックス (Square Boxed)',
                    tag: '角括弧・ボックス・整理',
                    cat: 'enclosed',
                    fn: t => Array.from(t).map(c => c === ' ' ? ' ' : `[${c}]`).join('')
                },

                // 4. EFFECTS & COMBINING & TRANSFORM
                {
                    id: 'strikethrough',
                    name: '取り消し線 (Strikethrough)',
                    tag: '打ち消し線・訂正線・エフェクト',
                    cat: 'effects',
                    fn: t => applyCombining(t, '\u0336')
                },
                {
                    id: 'slash_strike',
                    name: 'スラッシュ線 (Slash Strike)',
                    tag: '斜線・スタイリッシュ',
                    cat: 'effects',
                    fn: t => applyCombining(t, '\u0337')
                },
                {
                    id: 'underline_single',
                    name: 'アンダーライン (Underline)',
                    tag: '下線・アンダーバー',
                    cat: 'effects',
                    fn: t => applyCombining(t, '\u0332')
                },
                {
                    id: 'underline_double',
                    name: '二重下線 (Double Underline)',
                    tag: '二重下線・強調',
                    cat: 'effects',
                    fn: t => applyCombining(t, '\u0333')
                },
                {
                    id: 'overline',
                    name: 'オーバーライン (Overline)',
                    tag: '上線・マクロン',
                    cat: 'effects',
                    fn: t => applyCombining(t, '\u0305')
                },
                {
                    id: 'cross_x',
                    name: 'クロス装飾 (Cross Marks)',
                    tag: 'X飾り・可愛い・デコ',
                    cat: 'effects',
                    fn: t => applyCombining(t, '\u033D\u0353')
                },
                {
                    id: 'dot_under',
                    name: '下部ドット (Dot Under)',
                    tag: '下点・ドット・上品',
                    cat: 'effects',
                    fn: t => applyCombining(t, '\u0323')
                },
                {
                    id: 'wave_under',
                    name: '波線アンダー (Wave Under)',
                    tag: '波線・ゆるふわ',
                    cat: 'effects',
                    fn: t => applyCombining(t, '\u0330')
                },
                {
                    id: 'superscript',
                    name: '上付き文字 (Superscript)',
                    tag: '指数・ミニ文字・上付き',
                    cat: 'effects',
                    fn: t => applyCharMap(t, mapSuper)
                },
                {
                    id: 'subscript',
                    name: '下付き文字 (Subscript)',
                    tag: '化学式・ミニ文字・下付き',
                    cat: 'effects',
                    fn: t => applyCharMap(t, mapSub)
                },
                {
                    id: 'upside_down',
                    name: 'ひっくり返し反転 (Upside Down)',
                    tag: '上下逆さま・ひっくり返し・ネタ',
                    cat: 'effects',
                    fn: t => Array.from(applyCharMap(t, mapUpsideDown)).reverse().join('')
                },
                {
                    id: 'mirrored',
                    name: '左右ミラー反転 (Mirrored)',
                    tag: '鏡文字・左右反転',
                    cat: 'effects',
                    fn: t => Array.from(applyCharMap(t, mapMirror)).reverse().join('')
                },
                {
                    id: 'zalgo_glitch',
                    name: 'ザルゴ・グリッチ (Zalgo Chaos)',
                    tag: '崩壊文字・カオス・ホラー・グリッチ',
                    cat: 'effects',
                    fn: t => zalgoText(t)
                },

                // 5. FRAMES & DECORATIONS (装飾枠)
                {
                    id: 'frame_wing',
                    name: '天使の羽・エンジェル (Wings)',
                    tag: '羽・天使・かわいい・SNS',
                    cat: 'frames',
                    fn: t => `꧁ ${t} ꧂`
                },
                {
                    id: 'frame_butterfly',
                    name: '蝶々・バタフライ (Butterfly)',
                    tag: '蝶・バタフライ・ふんわり',
                    cat: 'frames',
                    fn: t => `ʚ ${t} ɞ`
                },
                {
                    id: 'frame_ribbon',
                    name: 'リボン・ガーリー (Ribbon)',
                    tag: 'リボン・かわいい・量産型',
                    cat: 'frames',
                    fn: t => `୨୧ ${t} ୨୧`
                },
                {
                    id: 'frame_cute_bow',
                    name: 'ミニボウ・ハート (Cute Bow)',
                    tag: 'ハート・リボン・推し活',
                    cat: 'frames',
                    fn: t => `♡⑅ ${t} ⑅♡`
                },
                {
                    id: 'frame_sparkle',
                    name: 'キラキラ星屑 (Sparkles)',
                    tag: '星・キラキラ・エモい',
                    cat: 'frames',
                    fn: t => `✧･ﾟ: * ${t} * :･ﾟ✧`
                },
                {
                    id: 'frame_stars_shooting',
                    name: '流れ星 (Shooting Stars)',
                    tag: '星・流れ星・タイトル',
                    cat: 'frames',
                    fn: t => `★:*:・ ${t} ・:*:★`
                },
                {
                    id: 'frame_corner_bracket',
                    name: 'エモーショナル括弧 (Aesthetic Bracket)',
                    tag: '韓国風・エモい・括弧',
                    cat: 'frames',
                    fn: t => `˗ˏˋ ${t} ˎˊ˗`
                },
                {
                    id: 'frame_music',
                    name: 'メロディ音符 (Melody Notes)',
                    tag: '音符・音楽・ミュージック',
                    cat: 'frames',
                    fn: t => `♬♩ ${t} ♩♬`
                },
                {
                    id: 'frame_clef',
                    name: 'ト音記号・ヘ音記号 (Treble Clef)',
                    tag: 'ト音記号・クラシック',
                    cat: 'frames',
                    fn: t => `𝄞 ${t} 𝄢`
                },
                {
                    id: 'frame_gothic_cross',
                    name: 'ゴシック・十字架 (Gothic Cross)',
                    tag: '十字架・ゴシック・ダーク',
                    cat: 'frames',
                    fn: t => `𓆩 ${t} 𓆪`
                },
                {
                    id: 'frame_ancient_shield',
                    name: '古代シールド (Ancient Shield)',
                    tag: '盾・神話・シンボル',
                    cat: 'frames',
                    fn: t => `𓊆 ${t} 𓊇`
                },
                {
                    id: 'frame_cyber_box',
                    name: 'サイバーブロック (Cyberpunk)',
                    tag: 'サイバー・レトロ・ブロック',
                    cat: 'frames',
                    fn: t => `█▓▒░ ${t} ░▒▓█`
                },
                {
                    id: 'frame_japanese_bracket',
                    name: '二重角括弧・和風 (Japanese Traditional)',
                    tag: '和風・強調・見出し',
                    cat: 'frames',
                    fn: t => `【 ${t} 】`
                },
                {
                    id: 'frame_lenticular',
                    name: '隅付き括弧 (Lenticular)',
                    tag: '白隅付き・上品',
                    cat: 'frames',
                    fn: t => `〖 ${t} 〗`
                },
                {
                    id: 'frame_white_box',
                    name: '白抜き二重括弧 (White Double Box)',
                    tag: '白二重・整理',
                    cat: 'frames',
                    fn: t => `〚 ${t} 〛`
                },
                {
                    id: 'frame_cat_ears',
                    name: '猫耳・キャット (Cat Ears)',
                    tag: '猫耳・かわいい・顔文字',
                    cat: 'frames',
                    fn: t => `ฅ^•ﻌ•^ฅ ${t} ฅ^•ﻌ•^ฅ`
                },
                {
                    id: 'frame_flower_crown',
                    name: 'フラワー花冠 (Flower Crown)',
                    tag: '花・ボタニカル・ナチュラル',
                    cat: 'frames',
                    fn: t => `✿*ﾟ ${t} ﾟ*✿`
                },
                {
                    id: 'frame_arrow_wrap',
                    name: 'アロー・矢印挟み (Arrow)',
                    tag: '矢印・ポインター・ポップ',
                    cat: 'frames',
                    fn: t => `➳ ${t} ➳`
                }
            ];

            // Update style counter badge
            if (counterBadge) {
                counterBadge.textContent = `全 ${FONT_STYLES.length} スタイル`;
            }

            // Current state
            let currentCat = 'all';
            let currentSearch = '';

            // RENDER FONT CONVERSION CARDS
            function renderFontGrid() {
                if (!gridEl) return;

                const rawInput = inputEl ? inputEl.value : '';
                const prefix = prefixEl ? prefixEl.value : '';
                const suffix = suffixEl ? suffixEl.value : '';
                const baseText = rawInput || 'Hello World';

                gridEl.innerHTML = '';

                let visibleCount = 0;

                FONT_STYLES.forEach(style => {
                    // Category filter
                    if (currentCat !== 'all' && style.cat !== currentCat) {
                        return;
                    }

                    // Search filter
                    if (currentSearch) {
                        const q = currentSearch.toLowerCase();
                        const matchName = style.name.toLowerCase().includes(q);
                        const matchTag = style.tag.toLowerCase().includes(q);
                        if (!matchName && !matchTag) return;
                    }

                    visibleCount++;

                    // Convert text
                    let converted = '';
                    try {
                        converted = style.fn(baseText);
                    } catch (e) {
                        converted = baseText;
                    }

                    // Apply custom prefix & suffix if provided
                    const finalOutput = `${prefix}${converted}${suffix}`;

                    // Create Card element
                    const card = document.createElement('div');
                    card.className = 'uf-card';

                    const header = document.createElement('div');
                    header.className = 'uf-card-header';

                    const nameSpan = document.createElement('span');
                    nameSpan.className = 'uf-card-name';
                    nameSpan.textContent = style.name;

                    const copyBtn = document.createElement('button');
                    copyBtn.className = 'btn btn-primary uf-card-copy-btn';
                    copyBtn.textContent = 'コピー';
                    copyBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        navigator.clipboard.writeText(finalOutput).then(() => {
                            copyBtn.textContent = 'コピー完了';
                            copyBtn.classList.add('copied');
                            ufToast(`「${style.name}」をコピーしました`);
                            setTimeout(() => {
                                copyBtn.textContent = 'コピー';
                                copyBtn.classList.remove('copied');
                            }, 1800);
                        }).catch(() => {
                            ufToast('コピーに失敗しました');
                        });
                    });

                    header.appendChild(nameSpan);
                    header.appendChild(copyBtn);

                    const textDiv = document.createElement('div');
                    textDiv.className = 'uf-card-text';
                    textDiv.textContent = finalOutput;
                    textDiv.title = 'クリックしてコピー';
                    textDiv.addEventListener('click', () => copyBtn.click());

                    const meta = document.createElement('div');
                    meta.className = 'uf-card-meta';
                    meta.textContent = style.tag;

                    card.appendChild(header);
                    card.appendChild(textDiv);
                    card.appendChild(meta);

                    gridEl.appendChild(card);
                });

                if (visibleCount === 0) {
                    const empty = document.createElement('div');
                    empty.style.gridColumn = '1 / -1';
                    empty.style.textAlign = 'center';
                    empty.style.padding = '30px';
                    empty.style.color = 'var(--text-muted)';
                    empty.textContent = '該当するフォントスタイルが見つかりませんでした。';
                    gridEl.appendChild(empty);
                }
            }

            // --- SYMBOLS & KAOMOJI PALETTES ---
            const SYMBOL_SETS = {
                hearts: [
                    '♡', '♥', '❥', '❦', '❧', '❣', 'ɞ', '✧', '★', '☆', '✦', '✡', '✩', '✪',
                    '✫', '✬', '✭', '✮', '✯', '✰', '⁺₊', '⋆', '｡˚', '໒꒱', '꒰', '꒱', 'ෆ',
                    '♡̷', '🤍', '🖤', '🤎', '💜', '💙', '💚', '💛', '🧡', '❤️', '🧁', '🍰'
                ],
                music: [
                    '♩', '♪', '♫', '♬', '♭', '♮', '♯', '𝄞', '𝄢', '𝄡', '𝄪', '𝄫', '🎼', '🎹',
                    '🎧', '🎙️', '📻', '🔊', '🔈', '🔉', '🔇', '🎵', '🎶', '🎤', '🎚️', '🎛️'
                ],
                arrows: [
                    '→', '←', '↑', '↓', '↔', '↕', '↗', '↖', '↘', '↙', '➔', '➜', '➝', '➞',
                    '➟', '➠', '➡', '➢', '➣', '➤', '➥', '➦', '➧', '➨', '➩', '➪', '➫', '➬',
                    '➭', '➮', '➯', '➱', '➲', '➳', '➵', '➸', '↺', '↻', '↶', '↷', '⇄', '⇅',
                    '⇐', '⇑', '⇒', '⇓', '⇔', '⇖', '⇗', '⇘', '⇙', '⇜', '⇝'
                ],
                flowers: [
                    '✿', '❀', '❁', '❃', '❋', '✾', '✽', '✼', '✻', '❉', '❊', '୨୧', '⑅', 'ɞ',
                    'ʚ', '𓆸', '𓆹', '𓇢', '𓂂', '☘', '⚘', '𖤣', '𖥧', '𖡼', '𖤣𖥧𖡼', '໒꒱', '🕊️', '🍃'
                ],
                brackets: [
                    '꧁', '꧂', '༺', '༻', '【', '】', '〖', '〗', '〘', '〙', '〚', '〛', '⟦', '⟧',
                    '⟨', '⟩', '⟪', '⟫', '❨', '❩', '❪', '❫', '❬', '❭', '❮', '❯', '❰', '❱',
                    '◜', '◝', '◞', '◟', '╭', '╮', '╯', '╰', '◤', '◢', '◣', '◥',
                    '─', '━', '│', '┃', '═', '║', '╔', '╗', '╚', '╝', '╠', '╣', '╦', '╩', '╬'
                ],
                geometric: [
                    '◆', '◇', '◈', '◉', '◊', '○', '◌', '◍', '◎', '●', '◐', '◑', '◒', '◓',
                    '◔', '◕', '◖', '◗', '◘', '◙', '◦', '◧', '◨', '◩', '◪', '◫', '◬', '◭', '◮',
                    '♔', '♕', '♖', '♗', '♘', '♙', '♚', '♛', '♜', '♝', '♞', '♟',
                    '♠', '♡', '♢', '♣', '♤', '♥', '♦', '♧', '☼', '☽', '☾', '☿', '♀', '♁', '♂'
                ],
                kaomoji: [
                    '(｡♥‿♥｡)', '( ˘ ³˘)♥', '(´｡• ᵕ •｡`) ♡', '( ´ ▽ ` ).｡ｏ♡',
                    '(✿´ ꒳ ` )', '(*´꒳`*)', '⸜(｡˃ ᵕ ˂ )⸝♡', '(๑>◡<๑)',
                    '(´,,•ω•,,)♡', '٩(๑❛ᴗ❛๑)۶', '( ˶ˆ꒳ˆ˵ )', '( ˘ᵕ˘ )',
                    '( ⁎ᵕᴗᵕ⁎ )❤︎', '(｡•́︿•̀｡)', '(๑•̀ㅂ•́)و✧', '(ง •̀_•́)ง',
                    'ฅ^•ﻌ•^ฅ', '(=^･ω･^=)', '(U・x・U)', '( ˘͈ ᵕ ˘͈♡)',
                    '( ᐡ•̥ •̥ᐡ )', '໒꒰ྀི∩˃ ᵕ ˂∩꒱ྀི১', '₍ᐢ._.ᐢ₎♡ ༘', '૮ ˶ᵔ ᵕ ᵔ˶ ა'
                ]
            };

            function populatePalette(containerId, list, isKaomoji = false) {
                const container = document.getElementById(containerId);
                if (!container) return;
                container.innerHTML = '';

                list.forEach(item => {
                    const btn = document.createElement('button');
                    btn.className = isKaomoji ? 'uf-kaomoji-btn' : 'uf-symbol-btn';
                    btn.textContent = item;
                    btn.title = `「${item}」をクリップボードにコピー`;
                    btn.addEventListener('click', () => {
                        navigator.clipboard.writeText(item).then(() => {
                            ufToast(`「${item}」をコピーしました`);
                        }).catch(() => {
                            ufToast('コピーに失敗しました');
                        });
                    });
                    container.appendChild(btn);
                });
            }

            // Populate all palettes
            populatePalette('ufPalHearts', SYMBOL_SETS.hearts);
            populatePalette('ufPalMusic', SYMBOL_SETS.music);
            populatePalette('ufPalArrows', SYMBOL_SETS.arrows);
            populatePalette('ufPalFlowers', SYMBOL_SETS.flowers);
            populatePalette('ufPalBrackets', SYMBOL_SETS.brackets);
            populatePalette('ufPalGeometric', SYMBOL_SETS.geometric);
            populatePalette('ufPalKaomoji', SYMBOL_SETS.kaomoji, true);

            // --- EVENT LISTENERS ---

            // Real-time input updates
            if (inputEl) inputEl.addEventListener('input', renderFontGrid);
            if (prefixEl) prefixEl.addEventListener('input', renderFontGrid);
            if (suffixEl) suffixEl.addEventListener('input', renderFontGrid);

            // Clear decor
            if (clearDecorBtn) {
                clearDecorBtn.addEventListener('click', () => {
                    if (prefixEl) prefixEl.value = '';
                    if (suffixEl) suffixEl.value = '';
                    renderFontGrid();
                    ufToast('装飾枠をクリアしました');
                });
            }

            // Preset decor clicks
            presetDecorBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    const pre = btn.getAttribute('data-pre') || '';
                    const suf = btn.getAttribute('data-suf') || '';
                    if (prefixEl) prefixEl.value = pre;
                    if (suffixEl) suffixEl.value = suf;
                    renderFontGrid();
                    ufToast(`枠「${btn.textContent}」を適用しました`);
                });
            });

            // Category Tab Switching
            categoryTabs.forEach(tab => {
                tab.addEventListener('click', () => {
                    categoryTabs.forEach(t => {
                        t.classList.remove('btn-primary', 'active');
                    });
                    tab.classList.add('btn-primary', 'active');
                    const cat = tab.getAttribute('data-cat') || 'all';
                    currentCat = cat;

                    if (cat === 'symbols') {
                        if (gridContainer) gridContainer.classList.add('hidden');
                        if (palettePanel) palettePanel.classList.remove('hidden');
                    } else {
                        if (gridContainer) gridContainer.classList.remove('hidden');
                        if (palettePanel) palettePanel.classList.add('hidden');
                        renderFontGrid();
                    }
                });
            });

            // Search input
            if (searchInput) {
                searchInput.addEventListener('input', (e) => {
                    currentSearch = e.target.value.trim();
                    renderFontGrid();
                });
            }

            // Quick Action Buttons
            if (sample1Btn) {
                sample1Btn.addEventListener('click', () => {
                    if (inputEl) {
                        inputEl.value = 'Kawaii Melody 2025';
                        renderFontGrid();
                    }
                });
            }

            if (sample2Btn) {
                sample2Btn.addEventListener('click', () => {
                    if (inputEl) {
                        inputEl.value = 'Hello World 2025';
                        renderFontGrid();
                    }
                });
            }

            if (upperBtn) {
                upperBtn.addEventListener('click', () => {
                    if (inputEl) {
                        inputEl.value = inputEl.value.toUpperCase();
                        renderFontGrid();
                    }
                });
            }

            if (lowerBtn) {
                lowerBtn.addEventListener('click', () => {
                    if (inputEl) {
                        inputEl.value = inputEl.value.toLowerCase();
                        renderFontGrid();
                    }
                });
            }

            if (titleBtn) {
                titleBtn.addEventListener('click', () => {
                    if (inputEl) {
                        inputEl.value = inputEl.value.replace(/\b\w/g, c => c.toUpperCase());
                        renderFontGrid();
                    }
                });
            }

            if (spaceBtn) {
                spaceBtn.addEventListener('click', () => {
                    if (inputEl) {
                        const clean = inputEl.value.replace(/\s+/g, '');
                        inputEl.value = Array.from(clean).join(' ');
                        renderFontGrid();
                    }
                });
            }

            if (clearBtn) {
                clearBtn.addEventListener('click', () => {
                    if (inputEl) {
                        inputEl.value = '';
                        renderFontGrid();
                    }
                });
            }

            // Initial render
            renderFontGrid();
        })();

        // ==========================================================================
        // REAPER PROJECT PATH EDITOR LOGIC
        // ==========================================================================
        function initReaperPathEditor() {
            const dropZone = document.getElementById('rpDropZone');
            const fileInput = document.getElementById('rpFileInput');
            const inputText = document.getElementById('rpInputText');
            const outputText = document.getElementById('rpOutputText');
            const optOwner = document.getElementById('rpOptOwner');
            const oldPathInput = document.getElementById('rpOldPath');
            const newPathInput = document.getElementById('rpNewPath');
            const applyBtn = document.getElementById('rpApplyBtn');
            const copyBtn = document.getElementById('rpCopyBtn');
            const downloadBtn = document.getElementById('rpDownloadBtn');
            const summaryBox = document.getElementById('rpSummaryBox');
            const totalPathsEl = document.getElementById('rpTotalPaths');
            const replacedPathsEl = document.getElementById('rpReplacedPaths');
            const fileNameTag = document.getElementById('rpFileNameTag');

            if (!inputText || !outputText) return;

            let loadedFileName = 'project.rpp';

            function processRpp() {
                const text = inputText.value;
                if (!text.trim()) {
                    outputText.value = '';
                    if (summaryBox) summaryBox.classList.add('hidden');
                    return;
                }

                let newText = text;
                let pathCount = 0;
                let replacedCount = 0;

                const pathRegex = /(["'])([a-zA-Z]:\\[^"'\r\n]+|\/[^"'\r\n]+)\1/g;
                const matches = text.match(pathRegex) || [];
                pathCount = matches.length;

                // 1. Replace username with owner
                if (optOwner && optOwner.checked) {
                    newText = newText.replace(/([a-zA-Z]:\\Users\\)[^\\]+(\\)/gi, '$1owner$2');
                    newText = newText.replace(/(\/Users\/)[^\/]+(\/)/gi, '$1owner$2');
                    newText = newText.replace(/(\/home\/)[^\/]+(\/)/gi, '$1owner$2');
                }

                // 2. Custom Path replacement
                if (oldPathInput && newPathInput) {
                    const oldVal = oldPathInput.value.trim();
                    const newVal = newPathInput.value.trim();
                    if (oldVal) {
                        newText = newText.replaceAll(oldVal, newVal);
                    }
                }

                if (text !== newText) {
                    const origLines = text.split('\n');
                    const newLines = newText.split('\n');
                    for (let i = 0; i < origLines.length; i++) {
                        if (origLines[i] !== newLines[i]) {
                            replacedCount++;
                        }
                    }
                }

                outputText.value = newText;
                if (summaryBox) summaryBox.classList.remove('hidden');
                if (totalPathsEl) totalPathsEl.textContent = pathCount.toLocaleString();
                if (replacedPathsEl) replacedPathsEl.textContent = replacedCount.toLocaleString();
                if (fileNameTag) fileNameTag.textContent = `ファイル: ${loadedFileName}`;
            }

            inputText.addEventListener('input', processRpp);
            if (optOwner) optOwner.addEventListener('change', processRpp);
            if (oldPathInput) oldPathInput.addEventListener('input', processRpp);
            if (newPathInput) newPathInput.addEventListener('input', processRpp);
            if (applyBtn) {
                applyBtn.addEventListener('click', () => {
                    processRpp();
                    showToast('パス変換処理を実行しました');
                });
            }

            if (fileInput) {
                fileInput.addEventListener('change', (e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    loadedFileName = file.name;
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        inputText.value = event.target.result;
                        processRpp();
                        showToast(`「${file.name}」を読み込みました`);
                    };
                    reader.readAsText(file);
                    fileInput.value = '';
                });
            }

            if (dropZone) {
                dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('drag-over'); });
                dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
                dropZone.addEventListener('drop', (e) => {
                    e.preventDefault();
                    dropZone.classList.remove('drag-over');
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                        const file = e.dataTransfer.files[0];
                        loadedFileName = file.name;
                        const reader = new FileReader();
                        reader.onload = (event) => {
                            inputText.value = event.target.result;
                            processRpp();
                            showToast(`「${file.name}」を読み込みました`);
                        };
                        reader.readAsText(file);
                    }
                });
            }

            if (copyBtn) {
                copyBtn.addEventListener('click', () => {
                    const val = outputText.value;
                    if (!val) { showToast('コピーする変換結果がありません'); return; }
                    navigator.clipboard.writeText(val).then(() => showToast('変換後テキストをコピーしました'));
                });
            }

            if (downloadBtn) {
                downloadBtn.addEventListener('click', () => {
                    const val = outputText.value;
                    if (!val) { showToast('保存するテキストがありません'); return; }
                    const blob = new Blob([val], { type: 'text/plain;charset=utf-8' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = loadedFileName || 'project_modified.rpp';
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                    showToast(`「${a.download}」をダウンロードしました`);
                });
            }
        }

        // ==========================================================================
        // MOJIBAKE SIMULATOR & FIXER LOGIC
        // ==========================================================================
        function initMojibakeTool() {
            const tabFixer = document.getElementById('mbTabFixer');
            const tabSim = document.getElementById('mbTabSimulator');
            const panelFixer = document.getElementById('mbFixerPanel');
            const panelSim = document.getElementById('mbSimPanel');

            const fixerInput = document.getElementById('mbFixerInput');
            const fixerExecBtn = document.getElementById('mbFixerExecBtn');
            const fixerResults = document.getElementById('mbFixerResults');
            const fixerSample1 = document.getElementById('mbFixerSample1');
            const fixerSample2 = document.getElementById('mbFixerSample2');

            const simInput = document.getElementById('mbSimInput');
            const simPattern = document.getElementById('mbSimPattern');
            const simOutput = document.getElementById('mbSimOutput');
            const simCopyBtn = document.getElementById('mbSimCopyBtn');

            if (!fixerInput || !fixerResults) return;

            if (tabFixer && tabSim) {
                tabFixer.addEventListener('click', () => {
                    tabFixer.classList.add('btn-primary');
                    tabSim.classList.remove('btn-primary');
                    panelFixer.classList.remove('hidden');
                    panelSim.classList.add('hidden');
                });

                tabSim.addEventListener('click', () => {
                    tabSim.classList.add('btn-primary');
                    tabFixer.classList.remove('btn-primary');
                    panelSim.classList.remove('hidden');
                    panelFixer.classList.add('hidden');
                    generateSimulation();
                });
            }

            // Windows-1252 reverse mapping for 0x80 - 0x9F characters
            const WIN1252_MAP = {
                0x20AC: 0x80, 0x201A: 0x82, 0x0192: 0x83, 0x201E: 0x84, 0x2026: 0x85, 0x2020: 0x86, 0x2021: 0x87,
                0x02C6: 0x88, 0x2030: 0x89, 0x0160: 0x8A, 0x2039: 0x8B, 0x0152: 0x8C, 0x017D: 0x8E, 0x2018: 0x91,
                0x2019: 0x92, 0x201C: 0x93, 0x201D: 0x94, 0x2022: 0x95, 0x2013: 0x96, 0x2014: 0x97, 0x02DC: 0x98,
                0x2122: 0x99, 0x0161: 0x9A, 0x203A: 0x9B, 0x0153: 0x9C, 0x017E: 0x9E, 0x0178: 0x9F
            };

            function textToWin1252Bytes(str) {
                const bytes = [];
                for (let i = 0; i < str.length; i++) {
                    const code = str.charCodeAt(i);
                    if (code <= 0xFF) {
                        bytes.push(code);
                    } else if (WIN1252_MAP[code] !== undefined) {
                        bytes.push(WIN1252_MAP[code]);
                    }
                }
                return new Uint8Array(bytes);
            }

            function decodeBytes(bytes, encoding) {
                if (!bytes || bytes.length === 0) return null;
                try {
                    return new TextDecoder(encoding, { fatal: false }).decode(bytes);
                } catch (e) {
                    return null;
                }
            }

            function decodeHtmlEntities(str) {
                if (!str || !str.includes('&')) return null;
                try {
                    const txt = document.createElement('textarea');
                    txt.innerHTML = str;
                    const val = txt.value;
                    return val !== str ? val : null;
                } catch(e) {
                    return null;
                }
            }

            function decodeUnicodeEscapes(str) {
                if (!str) return null;
                try {
                    if (/\\u[0-9a-fA-F]{4}/.test(str)) {
                        const val = str.replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
                        return val !== str ? val : null;
                    }
                } catch(e) {}
                return null;
            }

            function executeFixer() {
                const text = fixerInput.value.trim();
                if (!text) {
                    fixerResults.innerHTML = '<div style="color: var(--text-muted); font-size: 12px; padding: 12px;">解読するテキストを入力してください。</div>';
                    return;
                }

                const results = [];
                const seen = new Set();

                function addResult(title, textResult) {
                    if (!textResult || textResult === text || textResult.trim().length === 0) return;
                    if (!seen.has(textResult)) {
                        seen.add(textResult);
                        results.push({
                            title,
                            text: textResult
                        });
                    }
                }

                // 1. UTF-8 (Latin-1 誤解釈の復元)
                const win1252Bytes = textToWin1252Bytes(text);
                const decodedUtf8 = decodeBytes(win1252Bytes, 'utf-8');
                addResult('UTF-8 誤表示解読 (Latin-1/Windows-1252経由)', decodedUtf8);

                // 2. Shift_JIS (Latin-1 誤解釈の復元)
                const decodedSjis = decodeBytes(win1252Bytes, 'shift_jis');
                addResult('Shift_JIS 誤表示解読 (Latin-1/Windows-1252経由)', decodedSjis);

                // 3. EUC-JP (Latin-1 誤解釈の復元)
                const decodedEucjp = decodeBytes(win1252Bytes, 'euc-jp');
                addResult('EUC-JP 誤表示解読 (Latin-1/Windows-1252経由)', decodedEucjp);

                // 4. URL パーセントエンコード解読
                try {
                    const decodedUrl = decodeURIComponent(text);
                    addResult('URLパーセントエンコード解読 (%E6%97%A5...)', decodedUrl);
                } catch(e) {}

                // 5. HTML エンティティ解読
                const htmlDecoded = decodeHtmlEntities(text);
                addResult('HTML数値/文字エンティティ解読 (&#26085;...)', htmlDecoded);

                // 6. Unicode エスケープ解読
                const uniDecoded = decodeUnicodeEscapes(text);
                addResult('Unicodeエスケープシーケンス解読 (\\u65e5...)', uniDecoded);

                // 7. 2重文字化けの解除
                if (decodedUtf8) {
                    const win1252Bytes2 = textToWin1252Bytes(decodedUtf8);
                    const doubleDecoded = decodeBytes(win1252Bytes2, 'utf-8');
                    addResult('2重文字化けの解読', doubleDecoded);
                }

                fixerResults.innerHTML = '';
                if (results.length === 0) {
                    fixerResults.innerHTML = '<div style="color: var(--text-muted); font-size: 12px; padding: 12px;">有効な解読パターンが見つかりませんでした。テキストを確認してください。</div>';
                    return;
                }

                results.forEach((res, idx) => {
                    const card = document.createElement('div');
                    card.className = 'panel';
                    card.style.backgroundColor = idx === 0 ? 'rgba(52, 211, 153, 0.08)' : 'var(--bg-panel-secondary)';
                    card.style.borderColor = idx === 0 ? 'var(--accent-green)' : 'var(--border-color)';
                    card.style.padding = '10px 12px';
                    card.style.margin = '0';

                    card.innerHTML = `
                        <div class="flex-between mb-1">
                            <span style="font-weight: 700; font-size: 11.5px; color: ${idx === 0 ? 'var(--accent-green)' : 'var(--text-heading)'};">
                                ${res.title}
                            </span>
                            <button class="btn btn-primary card-copy-btn" style="padding: 2px 8px; font-size: 10.5px;">コピー</button>
                        </div>
                        <div style="font-size: 13.5px; font-weight: 500; font-family: monospace; color: var(--text-heading); word-break: break-all; margin-top: 4px; background: var(--bg-main); padding: 6px 8px; border: 1px solid var(--border-color);">
                            ${res.text.replace(/</g, '&lt;').replace(/>/g, '&gt;')}
                        </div>
                    `;

                    const copyBtn = card.querySelector('.card-copy-btn');
                    copyBtn.addEventListener('click', () => {
                        navigator.clipboard.writeText(res.text).then(() => showToast('解読結果をコピーしました'));
                    });

                    fixerResults.appendChild(card);
                });
            }

            if (fixerExecBtn) fixerExecBtn.addEventListener('click', executeFixer);
            if (fixerInput) fixerInput.addEventListener('input', executeFixer);

            const fixerSample3 = document.getElementById('mbFixerSample3');
            const fixerSample4 = document.getElementById('mbFixerSample4');

            if (fixerSample1) {
                fixerSample1.addEventListener('click', () => {
                    // "日本語テスト" utf8 as win1252
                    fixerInput.value = '\u00e6\u2014\u00a5\u00e6\u0153\u00ac\u00e8\u00aa\u00be\u00e3\u0192\u2021\u00e3\u201a\u00b9\u00e3\u0192\u00c6';
                    executeFixer();
                });
            }

            if (fixerSample2) {
                fixerSample2.addEventListener('click', () => {
                    // "あいうえお" sjis as win1252
                    fixerInput.value = '\u201a\u00a0\u201a\u00a2\u201a\u00a4\u201a\u00a6\u201a\u00a8';
                    executeFixer();
                });
            }

            if (fixerSample3) {
                fixerSample3.addEventListener('click', () => {
                    // URL & HTML Entities
                    fixerInput.value = '%E6%97%A5%E6%9C%AC%E8%AA%9E%20&#26085;&#26412;&#35486;';
                    executeFixer();
                });
            }

            if (fixerSample4) {
                fixerSample4.addEventListener('click', () => {
                    // Unicode Escape
                    fixerInput.value = '\\u65e5\\u672c\\u8a9e\\u30c6\\u30b9\\u30c8';
                    executeFixer();
                });
            }

            function generateSimulation() {
                if (!simInput || !simOutput) return;
                const src = simInput.value.trim();
                const pattern = simPattern ? simPattern.value : 'utf8_as_latin1';
                if (!src) {
                    simOutput.value = '';
                    return;
                }

                let result = src;
                try {
                    if (pattern === 'utf8_as_latin1') {
                        const bytes = new TextEncoder().encode(src);
                        result = new TextDecoder('windows-1252').decode(bytes);
                    } else if (pattern === 'sjis_as_utf8') {
                        const bytes = new TextEncoder().encode(src);
                        result = new TextDecoder('shift_jis', { fatal: false }).decode(bytes);
                    } else if (pattern === 'utf8_as_sjis') {
                        const bytes = new TextEncoder().encode(src);
                        result = new TextDecoder('shift_jis', { fatal: false }).decode(bytes);
                    } else if (pattern === 'eucjp_as_utf8' || pattern === 'utf8_as_eucjp') {
                        const bytes = new TextEncoder().encode(src);
                        result = new TextDecoder('euc-jp', { fatal: false }).decode(bytes);
                    }
                } catch(e) {
                    result = src;
                }

                simOutput.value = result;
            }

            if (simInput) simInput.addEventListener('input', generateSimulation);
            if (simPattern) simPattern.addEventListener('change', generateSimulation);
            if (simCopyBtn) {
                simCopyBtn.addEventListener('click', () => {
                    const val = simOutput.value;
                    if (!val) { showToast('コピーする結果がありません'); return; }
                    navigator.clipboard.writeText(val).then(() => showToast('文字化け結果をコピーしました'));
                });
            }

            executeFixer();
        }

        // ==========================================================================
        // JAPANESE URL ENCODER / DECODER LOGIC
        // ==========================================================================
        function initUrlCodecTool() {
            const inputEl = document.getElementById('urlInputText');
            const outputEl = document.getElementById('urlOutputText');
            const smartBtn = document.getElementById('urlSmartEncodeBtn');
            const fullBtn = document.getElementById('urlFullEncodeBtn');
            const decodeBtn = document.getElementById('urlDecodeBtn');
            const clearBtn = document.getElementById('urlClearBtn');
            const copyBtn = document.getElementById('urlCopyOutputBtn');
            const sampleBtn = document.getElementById('urlSampleBtn');
            const paramsPanel = document.getElementById('urlParamsPanel');
            const paramsTable = document.getElementById('urlParamsTable');

            if (!inputEl || !outputEl) return;

            function inspectQueryParams(urlStr) {
                if (!paramsTable || !paramsPanel) return;
                paramsTable.innerHTML = '';
                try {
                    let parsedUrl;
                    if (urlStr.startsWith('http://') || urlStr.startsWith('https://')) {
                        parsedUrl = new URL(urlStr);
                    } else if (urlStr.includes('?')) {
                        parsedUrl = new URL('https://example.com/' + (urlStr.startsWith('/') ? urlStr.substring(1) : urlStr));
                    }

                    if (parsedUrl && parsedUrl.search) {
                        const params = new URLSearchParams(parsedUrl.search);
                        const entries = Array.from(params.entries());

                        if (entries.length > 0) {
                            paramsPanel.classList.remove('hidden');
                            let html = `<table style="width: 100%; border-collapse: collapse; text-align: left;">
                                <thead>
                                    <tr style="border-bottom: 1px solid var(--border-color); color: var(--text-muted); font-size: 11px;">
                                        <th style="padding: 4px 8px; width: 30%;">キー (Key)</th>
                                        <th style="padding: 4px 8px;">値 (Value)</th>
                                    </tr>
                                </thead>
                                <tbody>`;

                            entries.forEach(([k, v]) => {
                                html += `<tr style="border-bottom: 1px dashed var(--border-color);">
                                    <td style="padding: 4px 8px; font-weight: 700; color: var(--accent-cyan); font-family: monospace;">${k.replace(/</g, '&lt;')}</td>
                                    <td style="padding: 4px 8px; font-family: monospace; color: var(--text-heading); word-break: break-all;">${v.replace(/</g, '&lt;')}</td>
                                </tr>`;
                            });

                            html += `</tbody></table>`;
                            paramsTable.innerHTML = html;
                            return;
                        }
                    }
                } catch(e) {}

                paramsPanel.classList.add('hidden');
            }

            if (smartBtn) {
                smartBtn.addEventListener('click', () => {
                    const text = inputEl.value.trim();
                    if (!text) { outputEl.value = ''; if (paramsPanel) paramsPanel.classList.add('hidden'); return; }

                    try {
                        const encoded = encodeURI(text);
                        outputEl.value = encoded;
                        inspectQueryParams(text);
                        showToast('スマートURLエンコードを完了しました');
                    } catch (e) {
                        outputEl.value = encodeURIComponent(text);
                        showToast('エンコードを完了しました');
                    }
                });
            }

            if (fullBtn) {
                fullBtn.addEventListener('click', () => {
                    const text = inputEl.value.trim();
                    if (!text) { outputEl.value = ''; if (paramsPanel) paramsPanel.classList.add('hidden'); return; }
                    outputEl.value = encodeURIComponent(text);
                    if (paramsPanel) paramsPanel.classList.add('hidden');
                    showToast('完全エンコードを完了しました');
                });
            }

            if (decodeBtn) {
                decodeBtn.addEventListener('click', () => {
                    const text = inputEl.value.trim();
                    if (!text) { outputEl.value = ''; if (paramsPanel) paramsPanel.classList.add('hidden'); return; }
                    try {
                        const decoded = decodeURIComponent(text);
                        outputEl.value = decoded;
                        inspectQueryParams(decoded);
                        showToast('URLデコードを完了しました');
                    } catch(e) {
                        showToast('デコードを完了しました');
                        outputEl.value = unescape(text);
                    }
                });
            }

            if (clearBtn) {
                clearBtn.addEventListener('click', () => {
                    inputEl.value = '';
                    outputEl.value = '';
                    if (paramsPanel) paramsPanel.classList.add('hidden');
                });
            }

            if (copyBtn) {
                copyBtn.addEventListener('click', () => {
                    const val = outputEl.value;
                    if (!val) { showToast('コピーする結果がありません'); return; }
                    navigator.clipboard.writeText(val).then(() => showToast('変換結果をコピーしました'));
                });
            }

            if (sampleBtn) {
                sampleBtn.addEventListener('click', () => {
                    inputEl.value = 'https://ja.wikipedia.org/wiki/メインページ?search=日本語テスト&category=音楽#見出し';
                    if (smartBtn) smartBtn.click();
                });
            }

            if (smartBtn) smartBtn.click();
        }

        // Initialize new tools when DOM is ready
        document.addEventListener('DOMContentLoaded', () => {
            initReaperPathEditor();
            initMojibakeTool();
            initUrlCodecTool();
        });

        // Service Worker Registration for Offline / GitHub Pages
        if ('serviceWorker' in navigator && (window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('./sw.js').catch(() => {});
            });
        }
}
