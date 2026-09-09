export function initUrlCodecTool() {
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
