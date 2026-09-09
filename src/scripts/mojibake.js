export function initMojibakeTool() {
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
