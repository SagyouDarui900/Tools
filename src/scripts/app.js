// Global Toast Notification Helper
        function showToast(msg) {
            let toast = document.getElementById('tcToast');
            if (!toast) {
                toast = document.createElement('div');
                toast.id = 'tcToast';
                toast.className = 'tc-toast';
                document.body.appendChild(toast);
            }
            toast.textContent = msg;
            toast.classList.add('show');
            if (toast._timer) clearTimeout(toast._timer);
            toast._timer = setTimeout(() => toast.classList.remove('show'), 2200);
        }
        window.showToast = showToast;

        // Global HTML Escape Utility
        function escapeHtml(str) {
            if (str == null) return '';
            return String(str).replace(/[&<>"']/g, m => ({
                '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
            }[m]));
        }
        window.escapeHtml = escapeHtml;

        // Global Safe URI Decoder (Fallback for deprecated unescape)
        function safeDecodeURI(str) {
            if (!str) return '';
            try {
                return decodeURIComponent(str.replace(/\+/g, ' '));
            } catch {
                return str.replace(/%([0-9A-Fa-f]{2})/g, (match, hex) => {
                    try {
                        return String.fromCharCode(parseInt(hex, 16));
                    } catch {
                        return match;
                    }
                });
            }
        }
        window.safeDecodeURI = safeDecodeURI;

        // PDF.js Worker Initialization
        if (typeof pdfjsLib !== 'undefined') {
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        }

        // ==========================================================================
        // 1. SYSTEM INITIALIZATION & NAVIGATION
        // ==========================================================================
        function addSuffixC(filename) {
            if (!filename) return 'output_c.png';
            const dot = filename.lastIndexOf('.');
            if (dot === -1) return filename + '_c';
            return filename.substring(0, dot) + '_c' + filename.substring(dot);
        }

        const themeBtn = document.getElementById('themeToggleBtn');
        const themeLabel = document.getElementById('themeLabel');

        try {
            const savedTheme = localStorage.getItem('workspace_theme');
            if (savedTheme === 'light') {
                document.body.classList.add('theme-light');
                if (themeLabel) themeLabel.textContent = 'テーマ切替 (ライト)';
            } else {
                document.body.classList.remove('theme-light');
                if (themeLabel) themeLabel.textContent = 'テーマ切替 (ダーク)';
            }
        } catch (e) {}

        themeBtn.addEventListener('click', () => {
            if (document.body.classList.contains('theme-light')) {
                document.body.classList.remove('theme-light');
                themeLabel.textContent = 'テーマ切替 (ダーク)';
                try { localStorage.setItem('workspace_theme', 'dark'); } catch (e) {}
            } else {
                document.body.classList.add('theme-light');
                themeLabel.textContent = 'テーマ切替 (ライト)';
                try { localStorage.setItem('workspace_theme', 'light'); } catch (e) {}
            }
        });

        // Generic Drop Zone helper to eliminate drag-and-drop bugs across tools
        function setupDropZone(dropEl, inputEl, onFiles) {
            if (!dropEl) return;
            dropEl.addEventListener('click', () => {
                if (inputEl) inputEl.click();
            });
            dropEl.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.stopPropagation();
                dropEl.classList.add('dragover');
            });
            dropEl.addEventListener('dragleave', (e) => {
                e.preventDefault();
                e.stopPropagation();
                dropEl.classList.remove('dragover');
            });
            dropEl.addEventListener('drop', (e) => {
                e.preventDefault();
                e.stopPropagation();
                dropEl.classList.remove('dragover');
                if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                    onFiles(e.dataTransfer.files);
                }
            });
            if (inputEl) {
                inputEl.addEventListener('change', (e) => {
                    if (e.target.files && e.target.files.length > 0) {
                        onFiles(e.target.files);
                    }
                });
            }
        }

        // Navigation Switcher & Mobile Menu & Desktop Wide Layout
        const navBtns = document.querySelectorAll('.nav-btn');
        const toolViews = document.querySelectorAll('.tool-view');
        const sidebar = document.getElementById('sidebar');
        const sidebarToggleBtn = document.getElementById('sidebarToggleBtn');
        const sidebarBackdrop = document.getElementById('sidebarBackdrop');

        function toggleMobileSidebar(open) {
            if (!sidebar) return;
            if (open) {
                sidebar.classList.add('open');
                if (sidebarBackdrop) sidebarBackdrop.classList.add('active');
            } else {
                sidebar.classList.remove('open');
                if (sidebarBackdrop) sidebarBackdrop.classList.remove('active');
            }
        }

        function setDesktopSidebar(collapsed, save = true) {
            if (!sidebar) return;
            sidebar.classList.toggle('collapsed', collapsed);
            document.body.classList.toggle('sidebar-collapsed', collapsed);
            const appLayout = document.getElementById('app-layout');
            if (appLayout) appLayout.classList.toggle('sidebar-collapsed', collapsed);

            if (sidebarToggleBtn) {
                sidebarToggleBtn.classList.toggle('active', collapsed);
                sidebarToggleBtn.title = collapsed 
                    ? 'サイドバーを表示 (標準表示に戻す / Alt+M)' 
                    : 'サイドバーを折りたたむ (画面を広く使う / Alt+M)';
            }

            if (save) {
                try { localStorage.setItem('workspace_sidebar_collapsed', collapsed ? 'true' : 'false'); } catch (e) {}
            }

            // Canvas and chart components redraw crisply when screen expands
            setTimeout(() => {
                window.dispatchEvent(new Event('resize'));
            }, 60);
        }

        if (sidebarToggleBtn) {
            sidebarToggleBtn.addEventListener('click', () => {
                if (window.innerWidth <= 768) {
                    toggleMobileSidebar(!sidebar.classList.contains('open'));
                } else {
                    const isCollapsed = sidebar.classList.contains('collapsed');
                    setDesktopSidebar(!isCollapsed);
                }
            });
        }

        // Keyboard Shortcut: Alt+M to toggle sidebar / wide view mode
        window.addEventListener('keydown', (e) => {
            if (e.altKey && (e.key === 'm' || e.key === 'M')) {
                e.preventDefault();
                if (window.innerWidth <= 768) {
                    toggleMobileSidebar(!sidebar.classList.contains('open'));
                } else {
                    const isCollapsed = sidebar.classList.contains('collapsed');
                    setDesktopSidebar(!isCollapsed);
                }
            }
        });

        try {
            if (window.innerWidth > 768 && localStorage.getItem('workspace_sidebar_collapsed') === 'true') {
                setDesktopSidebar(true, false);
            }
        } catch (e) {}

        if (sidebarBackdrop) {
            sidebarBackdrop.addEventListener('click', () => {
                toggleMobileSidebar(false);
            });
        }
        const sidebarCloseBtn = document.getElementById('sidebarCloseBtn');
        if (sidebarCloseBtn) {
            sidebarCloseBtn.addEventListener('click', () => {
                toggleMobileSidebar(false);
            });
        }

        navBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const target = btn.dataset.target;
                navBtns.forEach(b => b.classList.remove('active'));
                toolViews.forEach(v => v.classList.remove('active'));
                
                btn.classList.add('active');
                const targetEl = document.getElementById(target);
                if (targetEl) {
                    targetEl.classList.add('active');
                    // Notify any canvas/chart inside the newly shown view to redraw
                    window.dispatchEvent(new Event('resize'));
                }

                // Close mobile sidebar on select
                toggleMobileSidebar(false);
            });
        });

        // ==========================================================================
        // 2. TOOL 1: 音素DB解析 LOGIC (1JSON = 1キャラクター対応)
        // ==========================================================================
        (function() {
            const state = {
                characters: [],
                selectedIndex: 0
            };

            const GOJUON_MATRIX = [
                { title: "清音", data: [
                    ['あ', 'い', 'う', 'え', 'お'],
                    ['か', 'き', 'く', 'け', 'こ'],
                    ['さ', 'し', 'す', 'せ', 'そ'],
                    ['た', 'ち', 'つ', 'て', 'と'],
                    ['な', 'に', 'ぬ', 'ね', 'の'],
                    ['は', 'ひ', 'ふ', 'へ', 'ほ'],
                    ['ま', 'み', 'む', 'め', 'も'],
                    ['や', '', 'ゆ', '', 'よ'],
                    ['ら', 'り', 'る', 'れ', 'ろ'],
                    ['わ', 'を', 'ん', '息', '']
                ]},
                { title: "濁音・半濁音", data: [
                    ['が', 'ぎ', 'ぐ', 'げ', 'ご'],
                    ['ざ', 'じ', 'ず', 'ぜ', 'ぞ'],
                    ['だ', 'ぢ', 'づ', 'で', 'ど'],
                    ['ば', 'び', 'ぶ', 'べ', 'ぼ'],
                    ['ぱ', 'ぴ', 'ぷ', 'ぺ', 'ぽ']
                ]},
                { title: "拗音", data: [
                    ['きゃ', 'きゅ', 'きょ'],
                    ['しゃ', 'しゅ', 'しょ'],
                    ['ちゃ', 'ちゅ', 'ちょ'],
                    ['にゃ', 'にゅ', 'にょ'],
                    ['ひゃ', 'ひゅ', 'ひょ'],
                    ['みゃ', 'みゅ', 'みょ'],
                    ['りゃ', 'りゅ', 'りょ'],
                    ['ぎゃ', 'ぎゅ', 'ぎょ'],
                    ['じゃ', 'じゅ', 'じょ'],
                    ['びゃ', 'びゅ', 'びょ'],
                    ['ぴゃ', 'ぴゅ', 'ぴょ']
                ]}
            ];

            const PREDEFINED_SET = new Set();
            GOJUON_MATRIX.forEach(g => g.data.forEach(r => r.forEach(p => { if (p) PREDEFINED_SET.add(p); })));

            const dropZone = document.getElementById('pdbDropZone');
            const fileInput = document.getElementById('pdbFileInput');
            const charSelectGroup = document.getElementById('pdbCharSelectGroup');
            const charSelect = document.getElementById('pdbCharSelect');
            const charCountChip = document.getElementById('pdbCharCountChip');
            const statsSummary = document.getElementById('pdbStatsSummary');
            const mainContent = document.getElementById('pdbMainContent');
            const resetBtn = document.getElementById('pdbResetBtn');

            dropZone.addEventListener('click', () => fileInput.click());
            fileInput.addEventListener('change', (e) => handleFiles(e.target.files));
            dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('dragover'); });
            dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
            dropZone.addEventListener('drop', (e) => {
                e.preventDefault();
                dropZone.classList.remove('dragover');
                handleFiles(e.dataTransfer.files);
            });

            charSelect.addEventListener('change', (e) => {
                state.selectedIndex = parseInt(e.target.value) || 0;
                renderUI();
            });

            resetBtn.addEventListener('click', () => {
                state.characters = [];
                state.selectedIndex = 0;
                charSelectGroup.classList.add('hidden');
                statsSummary.classList.add('hidden');
                mainContent.classList.add('hidden');
                resetBtn.classList.add('hidden');
                fileInput.value = '';
            });

            function handleFiles(files) {
                const promises = Array.from(files).map(file => {
                    return new Promise(resolve => {
                        if (!file.name.endsWith('.json')) return resolve();
                        const reader = new FileReader();
                        reader.onload = (e) => {
                            try {
                                const json = JSON.parse(e.target.result);
                                processCharJSON(json, file.name);
                            } catch (err) {}
                            resolve();
                        };
                        reader.readAsText(file);
                    });
                });

                Promise.all(promises).then(() => {
                    if (state.characters.length > 0) {
                        state.selectedIndex = state.characters.length - 1; // 最新のファイルを選択
                        renderUI();
                    }
                });
            }

            function recalculateCharObj(charObj) {
                charObj.songs = [];
                charObj.phonemesMap = new Map();
                charObj.pitchesMap = new Map();
                charObj.totalPhonemes = 0;

                charObj.json.SongData.forEach(song => {
                    let fullPath = song.Path || "不明なパス";
                    let title = song.Path ? song.Path.split(/[\\/]/).pop() : "不明な楽曲";
                    const songInfo = { title, fullPath, playTime: song.PlayTime || 0, phonemeCount: 0, lyric: song.Lyric || '' };

                    if (song.Children && Array.isArray(song.Children)) {
                        songInfo.phonemeCount = song.Children.length;
                        song.Children.forEach(child => {
                            const name = child.Name ? child.Name.trim() : '';
                            if (!name) return;

                            charObj.totalPhonemes++;
                            if (!charObj.phonemesMap.has(name)) charObj.phonemesMap.set(name, { count: 0, pitches: new Set() });
                            const pData = charObj.phonemesMap.get(name);
                            pData.count++;

                            if (child.Pitch && child.Pitch.trim()) {
                                pData.pitches.add(child.Pitch);
                                charObj.pitchesMap.set(child.Pitch, (charObj.pitchesMap.get(child.Pitch) || 0) + 1);
                            }
                        });
                    }
                    charObj.songs.push(songInfo);
                });
            }

            function processCharJSON(json, filename) {
                if (!json.SongData || !Array.isArray(json.SongData)) return;

                const charObj = {
                    name: filename.replace(/\.json$/i, ''),
                    filename: filename,
                    json: json,
                    songs: [],
                    phonemesMap: new Map(),
                    pitchesMap: new Map(),
                    totalPhonemes: 0
                };

                recalculateCharObj(charObj);
                state.characters.push(charObj);
            }

            function removeSongFromChar(currentChar, idx) {
                currentChar.json.SongData.splice(idx, 1);
                recalculateCharObj(currentChar);
                renderUI();
            }

            const pdbDownloadJsonBtn = document.getElementById('pdbDownloadJsonBtn');
            if (pdbDownloadJsonBtn) {
                pdbDownloadJsonBtn.addEventListener('click', () => {
                    const currentChar = state.characters[state.selectedIndex];
                    if (!currentChar) return;
                    
                    // 一部の厳格なパーサーを持つ外部ツールでの読み込みエラー（クラッシュ）を防ぐため、コンパクトなJSON（改行・インデントなし）で出力します
                    const jsonStr = JSON.stringify(currentChar.json);
                    const blob = new Blob([jsonStr], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = currentChar.filename;
                    a.click();
                    setTimeout(() => URL.revokeObjectURL(url), 1000);
                });
            }

            function renderUI() {
                if (!state.characters.length) return;

                charSelectGroup.classList.remove('hidden');
                statsSummary.classList.remove('hidden');
                mainContent.classList.remove('hidden');
                resetBtn.classList.remove('hidden');

                // キャラクターセレクトボックス構築
                charSelect.innerHTML = state.characters.map((c, idx) => `
                    <option value="${idx}" ${idx === state.selectedIndex ? 'selected' : ''}>
                        ${c.name} (${c.songs.length}曲 / ${c.totalPhonemes.toLocaleString()}音素)
                    </option>
                `).join('');

                charCountChip.textContent = `${state.characters.length} キャラクター読み込み済み`;

                const currentChar = state.characters[state.selectedIndex];
                if (!currentChar) return;

                document.getElementById('pdbStatSongs').textContent = currentChar.songs.length;
                document.getElementById('pdbStatPhonemes').textContent = currentChar.totalPhonemes.toLocaleString();
                document.getElementById('pdbStatUnique').textContent = `${currentChar.phonemesMap.size} 種類`;

                renderGojuon(currentChar);
                renderPitchCanvas(currentChar);
                renderSongCards(currentChar);
            }

            function renderGojuon(currentChar) {
                const container = document.getElementById('pdbGojuonContainer');
                container.innerHTML = '';

                GOJUON_MATRIX.forEach(group => {
                    let html = `<div style="display: flex; flex-direction: column; gap: 4px; direction: ltr;">`;
                    html += `<label>${group.title}</label><div style="display: flex; gap: 4px;">`;

                    for (let i = group.data.length - 1; i >= 0; i--) {
                        let col = group.data[i];
                        html += `<div style="display: flex; flex-direction: column; gap: 4px; width: 44px;">`;
                        col.forEach(ph => {
                            if (!ph) {
                                html += `<div class="phoneme-cell" style="border-color: transparent; background: transparent;"></div>`;
                            } else {
                                const data = currentChar.phonemesMap.get(ph);
                                const count = data ? data.count : 0;
                                let cls = '';
                                if (count > 0 && count < 10) cls = 'count-low';
                                else if (count >= 10 && count < 50) cls = 'count-med';
                                else if (count >= 50) cls = 'count-high';

                                html += `<div class="phoneme-cell ${cls}" data-count="${count}">
                                    <span>${ph}</span>
                                    ${count > 0 ? `<span style="font-size: 9px; opacity: 0.8;">${count}</span>` : ''}
                                </div>`;
                            }
                        });
                        html += `</div>`;
                    }
                    html += `</div></div>`;
                    container.innerHTML += html;
                });

                // Other phonemes
                const otherContainer = document.getElementById('pdbOtherPhonemes');
                let otherHtml = '';
                Array.from(currentChar.phonemesMap.keys())
                    .filter(k => !PREDEFINED_SET.has(k))
                    .forEach(ph => {
                        const count = currentChar.phonemesMap.get(ph).count;
                        otherHtml += `<span class="chip">${ph}: ${count}</span>`;
                    });
                otherContainer.innerHTML = otherHtml || '<span style="color: var(--text-muted);">その他なし</span>';
            }

            function renderPitchCanvas(currentChar) {
                const canvas = document.getElementById('pdbPitchCanvas');
                if (!canvas) return;
                const parentW = canvas.parentElement ? (canvas.parentElement.clientWidth - 16) : 550;
                if (parentW > 100) {
                    canvas.width = parentW;
                }
                const ctx = canvas.getContext('2d');
                ctx.clearRect(0, 0, canvas.width, canvas.height);

                const entries = Array.from(currentChar.pitchesMap.entries());
                if (!entries.length) {
                    document.getElementById('pdbStatLowest').textContent = '-';
                    document.getElementById('pdbStatHighest').textContent = '-';
                    document.getElementById('pdbStatMost').textContent = '-';
                    return;
                }

                const PITCH_ORDER = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
                function getPitchVal(pStr) {
                    const m = pStr.match(/([A-G]#?)(\d)/);
                    if (m) return parseInt(m[2]) * 12 + PITCH_ORDER.indexOf(m[1]);
                    return 0;
                }

                entries.sort((a, b) => getPitchVal(a[0]) - getPitchVal(b[0]));
                document.getElementById('pdbStatLowest').textContent = entries[0][0];
                document.getElementById('pdbStatHighest').textContent = entries[entries.length - 1][0];

                let maxCount = 0, mostPitch = '';
                entries.forEach(e => { if (e[1] > maxCount) { maxCount = e[1]; mostPitch = e[0]; } });
                document.getElementById('pdbStatMost').textContent = `${mostPitch} (${maxCount}回)`;

                // Draw Bar Chart
                const padding = 35;
                const w = canvas.width - padding * 2;
                const h = canvas.height - padding * 2;
                const barWidth = Math.max(4, Math.floor(w / entries.length) - 2);

                ctx.strokeStyle = '#484854';
                ctx.beginPath();
                ctx.moveTo(padding, canvas.height - padding);
                ctx.lineTo(canvas.width - padding, canvas.height - padding);
                ctx.stroke();

                entries.forEach((entry, idx) => {
                    const barH = Math.floor((entry[1] / maxCount) * h);
                    const x = padding + idx * (barWidth + 2);
                    const y = canvas.height - padding - barH;

                    ctx.fillStyle = '#007acc';
                    ctx.fillRect(x, y, barWidth, barH);

                    if (entries.length < 25 || idx % Math.ceil(entries.length / 15) === 0) {
                        ctx.fillStyle = '#808090';
                        ctx.font = '9px sans-serif';
                        ctx.textAlign = 'center';
                        ctx.fillText(entry[0], x + barWidth / 2, canvas.height - padding + 12);
                    }
                });
            }

            function renderSongCards(currentChar) {
                const container = document.getElementById('pdbSongCards');
                container.innerHTML = currentChar.songs.map((song, idx) => `
                    <div class="panel" style="margin: 0; background-color: var(--bg-panel-secondary);">
                        <div class="flex-between mb-1">
                            <span style="font-weight: 700; word-break: break-all;">${song.title}</span>
                            <div style="display: flex; gap: 6px; align-items: center; flex-shrink: 0;">
                                <span class="chip">${song.phonemeCount} 音素</span>
                                <button class="btn btn-danger pdb-song-del-btn" data-idx="${idx}" style="padding: 2px 6px; font-size: 10px;">楽曲を削除</button>
                            </div>
                        </div>
                        <div style="font-size: 10px; color: var(--accent-primary); margin-bottom: 6px; word-break: break-all;">
                            ${song.fullPath}
                        </div>
                        <div style="font-size: 11px; color: var(--text-muted); margin-bottom: 8px;">
                            再生時間: ${(song.playTime / 1000).toFixed(1)}s
                        </div>
                        <textarea readonly style="height: 50px; font-size: 10px; color: var(--text-muted); width: 100%; border: 1px solid var(--border-color); background-color: var(--bg-panel); padding: 4px; resize: none;">${song.lyric || '歌詞データなし'}</textarea>
                    </div>
                `).join('');

                container.querySelectorAll('.pdb-song-del-btn').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const idx = parseInt(e.currentTarget.dataset.idx);
                        const song = currentChar.songs[idx];
                        if (confirm(`以下の楽曲データ全体をJSONから削除しますか？\n\nファイル名: ${song.title}\nパス: ${song.fullPath}\n\n※ブラウザ上のデータのみ削除されます。保存するには後で「編集済みJSONを保存」を押してください。`)) {
                            removeSongFromChar(currentChar, idx);
                        }
                    });
                });
            }

            // Tabs
            document.querySelectorAll('.pdb-tab-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    document.querySelectorAll('.pdb-tab-btn').forEach(b => b.classList.remove('btn-primary'));
                    document.querySelectorAll('.pdb-tab-content').forEach(c => c.classList.add('hidden'));
                    btn.classList.add('btn-primary');
                    document.getElementById(btn.dataset.tab).classList.remove('hidden');
                    if (btn.dataset.tab === 'pdb-tab-pitch' && state.characters.length && state.characters[state.selectedIndex]) {
                        renderPitchCanvas(state.characters[state.selectedIndex]);
                    }
                });
            });

            window.addEventListener('resize', () => {
                const pitchTab = document.getElementById('pdb-tab-pitch');
                if (pitchTab && !pitchTab.classList.contains('hidden') && state.characters.length && state.characters[state.selectedIndex]) {
                    renderPitchCanvas(state.characters[state.selectedIndex]);
                }
            });
        })();

        // ==========================================================================
        // 3. TOOL 2: スペクトログラム音声生成 LOGIC (Web Worker対応)
        // ==========================================================================
        (function() {
            const drop = document.getElementById('specDropZone');
            const input = document.getElementById('specFileInput');
            const canvas = document.getElementById('specCanvas');
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            const placeholder = document.getElementById('specPlaceholder');
            const generateBtn = document.getElementById('specGenerateBtn');
            const progressSection = document.getElementById('specProgressSection');
            const progressBar = document.getElementById('specProgressBar');
            const progressPercent = document.getElementById('specProgressPercent');
            const statusText = document.getElementById('specStatusText');
            const audioSection = document.getElementById('specAudioSection');
            const audioPlayer = document.getElementById('specAudioPlayer');
            const downloadBtn = document.getElementById('specDownloadBtn');

            let currentImg = null;

            setupDropZone(drop, input, (files) => {
                if (files && files[0]) loadImage(files[0]);
            });

            function loadImage(file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const img = new Image();
                    img.onload = () => {
                        currentImg = img;
                        renderPreview();
                        generateBtn.disabled = false;
                        placeholder.classList.add('hidden');
                        canvas.classList.remove('hidden');
                    };
                    img.src = e.target.result;
                };
                reader.readAsDataURL(file);
            }

            function renderPreview() {
                if (!currentImg) return;
                const H = parseInt(document.getElementById('specResolution').value);
                const aspect = currentImg.width / currentImg.height;
                let W = Math.round(H * aspect);
                if (W > 1024) W = 1024;
                canvas.width = W;
                canvas.height = H;
                ctx.fillStyle = "black";
                ctx.fillRect(0, 0, W, H);
                ctx.filter = 'grayscale(100%)';
                ctx.drawImage(currentImg, 0, 0, W, H);
                ctx.filter = 'none';
            }

            const specResEl = document.getElementById('specResolution');
            if (specResEl) specResEl.addEventListener('change', renderPreview);

            generateBtn.addEventListener('click', () => {
                if (!currentImg) return;

                if (audioPlayer.src && audioPlayer.src.startsWith('blob:')) {
                    URL.revokeObjectURL(audioPlayer.src);
                }

                progressSection.classList.remove('hidden');
                audioSection.classList.add('hidden');
                generateBtn.disabled = true;
                statusText.textContent = '合成アルゴリズムを実行中...';

                const duration = parseFloat(document.getElementById('specDuration').value);
                const H = parseInt(document.getElementById('specResolution').value);
                const minFreq = parseFloat(document.getElementById('specMinFreq').value);
                const maxFreq = parseFloat(document.getElementById('specMaxFreq').value);
                const scaleType = document.getElementById('specScale').value;
                const contrast = parseFloat(document.getElementById('specContrast').value);

                const W = canvas.width;
                const imgData = ctx.getImageData(0, 0, W, H).data;
                const pixels = new Float32Array(W * H);
                for (let i = 0; i < imgData.length; i += 4) {
                    pixels[i / 4] = (0.299 * imgData[i] + 0.587 * imgData[i + 1] + 0.114 * imgData[i + 2]) / 255.0;
                }

                // Inline Worker Script
                const workerScript = `
                self.onmessage = function(e) {
                    const { pixels, W, H, duration, sampleRate, minFreq, maxFreq, scaleType, contrast } = e.data;
                    const totalSamples = Math.floor(sampleRate * duration);
                    const buffer = new Float32Array(totalSamples);

                    for (let y = 0; y < H; y++) {
                        const yFrac = (H - 1 - y) / (H - 1);
                        let freq = scaleType === 'log' 
                            ? Math.max(20, minFreq) * Math.pow(maxFreq / Math.max(20, minFreq), yFrac)
                            : minFreq + (maxFreq - minFreq) * yFrac;

                        const phase = Math.random() * Math.PI * 2;
                        const omega = 2 * Math.PI * freq / sampleRate;

                        let i = 0;
                        for (let x = 0; x < W; x++) {
                            const endSample = Math.floor((x + 1) * totalSamples / W);
                            const samplesInChunk = endSample - i;
                            if (samplesInChunk <= 0) continue;

                            let lum = Math.pow(pixels[y * W + x], contrast);
                            let prevLum = x > 0 ? Math.pow(pixels[y * W + (x - 1)], contrast) : lum;

                            for (let j = 0; j < samplesInChunk; j++, i++) {
                                const currentAmp = prevLum + (lum - prevLum) * (j / samplesInChunk);
                                buffer[i] += currentAmp * Math.sin(i * omega + phase);
                            }
                        }
                        if (y % 10 === 0) self.postMessage({ type: 'progress', progress: y / H });
                    }

                    let maxVal = 0.001;
                    for (let i = 0; i < totalSamples; i++) {
                        if (Math.abs(buffer[i]) > maxVal) maxVal = Math.abs(buffer[i]);
                    }
                    for (let i = 0; i < totalSamples; i++) {
                        buffer[i] = (buffer[i] / maxVal) * 0.9;
                    }

                    // WAV encode
                    const wavBuffer = new ArrayBuffer(44 + buffer.length * 2);
                    const view = new DataView(wavBuffer);
                    function writeString(v, o, s) { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); }

                    writeString(view, 0, 'RIFF');
                    view.setUint32(4, 36 + buffer.length * 2, true);
                    writeString(view, 8, 'WAVE');
                    writeString(view, 12, 'fmt ');
                    view.setUint32(16, 16, true);
                    view.setUint16(20, 1, true);
                    view.setUint16(22, 1, true);
                    view.setUint32(24, sampleRate, true);
                    view.setUint32(28, sampleRate * 2, true);
                    view.setUint16(32, 2, true);
                    view.setUint16(34, 16, true);
                    writeString(view, 36, 'data');
                    view.setUint32(40, buffer.length * 2, true);

                    let offset = 44;
                    for (let i = 0; i < buffer.length; i++, offset += 2) {
                        let s = Math.max(-1, Math.min(1, buffer[i]));
                        view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
                    }

                    self.postMessage({ type: 'done', wavBuffer: wavBuffer }, [wavBuffer]);
                };
                `;

                const blob = new Blob([workerScript], { type: 'application/javascript' });
                const workerUrl = URL.createObjectURL(blob);
                const worker = new Worker(workerUrl);

                worker.onmessage = (e) => {
                    if (e.data.type === 'progress') {
                        const pct = Math.round(e.data.progress * 100);
                        progressBar.style.width = pct + '%';
                        progressPercent.textContent = pct + '%';
                    } else if (e.data.type === 'done') {
                        progressBar.style.width = '100%';
                        progressPercent.textContent = '100%';

                        const wavBlob = new Blob([e.data.wavBuffer], { type: 'audio/wav' });
                        const blobUrl = URL.createObjectURL(wavBlob);

                        audioPlayer.src = blobUrl;
                        downloadBtn.href = blobUrl;

                        setTimeout(() => {
                            progressSection.classList.add('hidden');
                            audioSection.classList.remove('hidden');
                            generateBtn.disabled = false;
                        }, 300);

                        worker.terminate();
                        URL.revokeObjectURL(workerUrl);
                    }
                };

                worker.onerror = (err) => {
                    console.error('Spectrogram worker error:', err);
                    showToast('音声合成処理中にエラーが発生しました');
                    progressSection.classList.add('hidden');
                    generateBtn.disabled = false;
                    worker.terminate();
                    URL.revokeObjectURL(workerUrl);
                };

                worker.postMessage({
                    pixels, W, H, duration, sampleRate: 44100, minFreq, maxFreq, scaleType, contrast
                });
            });
        })();

        // ==========================================================================
        // 4. TOOL 3: スプライトシート切り出し LOGIC (レスポンシブ・単色背景自動/手動透過・自動吸着＆並び替え＆連番プレビュー)
        // ==========================================================================
        (function() {
            const drop = document.getElementById('spriteDropZone');
            const input = document.getElementById('spriteFileInput');
            const bgMode = document.getElementById('spriteBgMode');
            const bgColorGroup = document.getElementById('spriteBgColorGroup');
            const bgColorPicker = document.getElementById('spriteBgColorPicker');
            const bgColorText = document.getElementById('spriteBgColorText');
            const bgPipetteBtn = document.getElementById('spriteBgPipetteBtn');
            const bgTolInput = document.getElementById('spriteBgTol');
            const dragModeSelect = document.getElementById('spriteDragMode');
            const fitPaddingInput = document.getElementById('spriteFitPadding');
            const wrapper = document.getElementById('spriteCanvasWrapper');
            const imgCanvas = document.getElementById('spriteImgCanvas');
            const overlayCanvas = document.getElementById('spriteOverlayCanvas');
            const ctxImg = imgCanvas.getContext('2d', { willReadFrequently: true });
            const ctxOverlay = overlayCanvas.getContext('2d');
            const listContainer = document.getElementById('spriteListContainer');
            const countBadge = document.getElementById('spriteCountBadge');
            const clearAllBtn = document.getElementById('spriteClearAllBtn');
            const sortOrderBtn = document.getElementById('spriteSortOrderBtn');
            const reverseBtn = document.getElementById('spriteReverseBtn');
            const filenameInput = document.getElementById('spriteFilename');
            const exportBtn = document.getElementById('spriteExportBtn');

            // Animation Preview Controls
            const animCanvas = document.getElementById('spriteAnimCanvas');
            const animCtx = animCanvas ? animCanvas.getContext('2d') : null;
            const animPlayBtn = document.getElementById('spriteAnimPlayBtn');
            const animFpsInput = document.getElementById('spriteAnimFps');
            const animFrameText = document.getElementById('spriteAnimFrameText');
            const animPrevBtn = document.getElementById('spriteAnimPrevBtn');
            const animNextBtn = document.getElementById('spriteAnimNextBtn');

            let currentImg = null;
            let sprites = []; // { id, rect: {x,y,w,h} }
            let history = [];
            let currentId = 0;
            let isDragging = false;
            let startX = 0, startY = 0, currentX = 0, currentY = 0;
            let isPipette = false;

            // Animation State
            let isPlayingAnim = false;
            let animCurrentFrame = 0;
            let animTimer = null;

            // Drag-and-drop reorder state
            let dragSourceIndex = null;

            bgMode.addEventListener('change', () => {
                if (bgMode.value === 'color') bgColorGroup.classList.remove('hidden');
                else bgColorGroup.classList.add('hidden');
                render();
            });

            bgColorPicker.addEventListener('input', (e) => {
                bgColorText.value = e.target.value.toUpperCase();
                render();
            });

            bgTolInput.addEventListener('input', () => {
                render();
            });

            bgPipetteBtn.addEventListener('click', () => {
                isPipette = !isPipette;
                bgPipetteBtn.style.backgroundColor = isPipette ? 'var(--accent-primary)' : '';
            });

            setupDropZone(drop, input, (files) => {
                if (files && files[0]) loadImage(files[0]);
            });

            function loadImage(file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const img = new Image();
                    img.onload = () => {
                        currentImg = img;
                        imgCanvas.width = img.width;
                        imgCanvas.height = img.height;
                        overlayCanvas.width = img.width;
                        overlayCanvas.height = img.height;

                        ctxImg.drawImage(img, 0, 0);
                        sprites = [];
                        history = [];
                        stopAnimation();
                        animCurrentFrame = 0;
                        render();
                    };
                    img.src = e.target.result;
                };
                reader.readAsDataURL(file);
            }

            // Coordinate helper for mouse & touch
            function getCanvasCoords(e) {
                const rect = overlayCanvas.getBoundingClientRect();
                const scaleX = overlayCanvas.width / rect.width;
                const scaleY = overlayCanvas.height / rect.height;
                const clientX = e.touches && e.touches.length > 0 ? e.touches[0].clientX : e.clientX;
                const clientY = e.touches && e.touches.length > 0 ? e.touches[0].clientY : e.clientY;

                return {
                    x: Math.floor((clientX - rect.left) * scaleX),
                    y: Math.floor((clientY - rect.top) * scaleY)
                };
            }

            function handleCanvasStart(e) {
                if (!currentImg) return;
                if (e.type === 'touchstart') e.preventDefault(); // Prevent scrolling on touch drag

                const { x, y } = getCanvasCoords(e);

                if (isPipette) {
                    const p = ctxImg.getImageData(x, y, 1, 1).data;
                    const hex = "#" + ((1 << 24) + (p[0] << 16) + (p[1] << 8) + p[2]).toString(16).slice(1).toUpperCase();
                    bgColorPicker.value = hex;
                    bgColorText.value = hex;
                    isPipette = false;
                    bgPipetteBtn.style.backgroundColor = '';
                    render();
                    return;
                }

                startX = x;
                startY = y;
                currentX = x;
                currentY = y;
                isDragging = true;
            }

            function handleCanvasMove(e) {
                if (!isDragging || !currentImg) return;
                if (e.type === 'touchmove') e.preventDefault();

                const { x, y } = getCanvasCoords(e);
                currentX = x;
                currentY = y;
                renderOverlay();
            }

            function handleCanvasEnd(e) {
                if (!isDragging) return;
                if (e && e.cancelable) e.preventDefault();
                isDragging = false;

                const rx = Math.max(0, Math.min(startX, currentX));
                const ry = Math.max(0, Math.min(startY, currentY));
                const rw = Math.min(imgCanvas.width - rx, Math.abs(currentX - startX));
                const rh = Math.min(imgCanvas.height - ry, Math.abs(currentY - startY));

                if (rw < 4 || rh < 4) {
                    // 単一クリック -> BFS連結成分自動輪郭切り出し
                    findSmartBoundsBFS(rx, ry);
                } else {
                    const dragMode = dragModeSelect ? dragModeSelect.value : 'fit';
                    if (dragMode === 'fit') {
                        // 火や光など複数の小さな離れたオブジェクトもまとめて1つの最小矩形に吸着フィット
                        const fitRect = findDragFitBounds(rx, ry, rw, rh);
                        addSprite(fitRect);
                    } else {
                        // ドラッグ枠そのまま切り出し
                        addSprite({ x: rx, y: ry, w: rw, h: rh });
                    }
                }
            }

            // Mouse Events
            overlayCanvas.addEventListener('mousedown', handleCanvasStart);
            overlayCanvas.addEventListener('mousemove', handleCanvasMove);
            overlayCanvas.addEventListener('mouseup', handleCanvasEnd);
            window.addEventListener('mouseup', (e) => {
                if (isDragging) handleCanvasEnd(e);
            });

            // Touch Events (Mobile/Tablet support)
            overlayCanvas.addEventListener('touchstart', handleCanvasStart, { passive: false });
            overlayCanvas.addEventListener('touchmove', handleCanvasMove, { passive: false });
            overlayCanvas.addEventListener('touchend', handleCanvasEnd, { passive: false });
            overlayCanvas.addEventListener('touchcancel', () => { isDragging = false; renderOverlay(); });

            // ドラッグ範囲内の全不透明ピクセル（前景）の最小外接矩形を計算（火・光・複数小オブジェクト統合）
            function findDragFitBounds(rx, ry, rw, rh) {
                const cropImgData = ctxImg.getImageData(rx, ry, rw, rh);
                const data = cropImgData.data;
                const isAlphaMode = bgMode.value === 'alpha';
                const hex = bgColorPicker.value;
                const bgR = parseInt(hex.slice(1, 3), 16);
                const bgG = parseInt(hex.slice(3, 5), 16);
                const bgB = parseInt(hex.slice(5, 7), 16);
                const tol = parseFloat(bgTolInput.value);

                let minLX = rw, maxLX = -1, minLY = rh, maxLY = -1;
                let foundPixel = false;

                for (let ly = 0; ly < rh; ly++) {
                    for (let lx = 0; lx < rw; lx++) {
                        const idx = (ly * rw + lx) * 4;
                        let isFg = false;
                        if (isAlphaMode) {
                            isFg = data[idx + 3] > 10;
                        } else {
                            const r = data[idx];
                            const g = data[idx + 1];
                            const b = data[idx + 2];
                            const dist = Math.sqrt((r - bgR) ** 2 + (g - bgG) ** 2 + (b - bgB) ** 2) / 441.67 * 100;
                            isFg = dist > tol;
                        }

                        if (isFg) {
                            foundPixel = true;
                            if (lx < minLX) minLX = lx;
                            if (lx > maxLX) maxLX = lx;
                            if (ly < minLY) minLY = ly;
                            if (ly > maxLY) maxLY = ly;
                        }
                    }
                }

                if (!foundPixel) {
                    // 不透明ピクセルが見つからない場合はドラッグ枠そのまま
                    return { x: rx, y: ry, w: rw, h: rh };
                }

                const pad = Math.max(0, parseInt(fitPaddingInput ? fitPaddingInput.value : 0, 10) || 0);
                const fx = Math.max(0, rx + minLX - pad);
                const fy = Math.max(0, ry + minLY - pad);
                const right = Math.min(imgCanvas.width, rx + maxLX + 1 + pad);
                const bottom = Math.min(imgCanvas.height, ry + maxLY + 1 + pad);
                return {
                    x: fx,
                    y: fy,
                    w: Math.max(1, right - fx),
                    h: Math.max(1, bottom - fy)
                };
            }

            function findSmartBoundsBFS(clickX, clickY) {
                const w = imgCanvas.width;
                const h = imgCanvas.height;
                const imgData = ctxImg.getImageData(0, 0, w, h);
                const data = imgData.data;

                const isAlphaMode = bgMode.value === 'alpha';
                const hex = bgColorPicker.value;
                const bgR = parseInt(hex.slice(1, 3), 16);
                const bgG = parseInt(hex.slice(3, 5), 16);
                const bgB = parseInt(hex.slice(5, 7), 16);
                const tol = parseFloat(bgTolInput.value);

                function isForeground(idx) {
                    if (isAlphaMode) {
                        return data[idx + 3] > 10;
                    } else {
                        const r = data[idx];
                        const g = data[idx + 1];
                        const b = data[idx + 2];
                        const dist = Math.sqrt((r - bgR) ** 2 + (g - bgG) ** 2 + (b - bgB) ** 2) / 441.67 * 100;
                        return dist > tol;
                    }
                }

                const clickIdx = (clickY * w + clickX) * 4;
                if (!isForeground(clickIdx)) return;

                const visited = new Uint8Array(w * h);
                const queue = [clickX, clickY];
                visited[clickY * w + clickX] = 1;

                let minX = clickX, maxX = clickX, minY = clickY, maxY = clickY;
                let head = 0;

                while (head < queue.length) {
                    const cx = queue[head++];
                    const cy = queue[head++];

                    if (cx < minX) minX = cx;
                    if (cx > maxX) maxX = cx;
                    if (cy < minY) minY = cy;
                    if (cy > maxY) maxY = cy;

                    const neighbors = [cx + 1, cy, cx - 1, cy, cx, cy + 1, cx, cy - 1];
                    for (let i = 0; i < neighbors.length; i += 2) {
                        const nx = neighbors[i];
                        const ny = neighbors[i + 1];
                        if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
                            const nIdx = ny * w + nx;
                            if (visited[nIdx] === 0) {
                                visited[nIdx] = 1;
                                if (isForeground(nIdx * 4)) {
                                    queue.push(nx, ny);
                                }
                            }
                        }
                    }
                }

                addSprite({ x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 });
            }

            function addSprite(rect) {
                history.push(JSON.stringify(sprites));
                sprites.push({ id: currentId++, rect });
                render();
            }

            // 順番入れ替え（▲ / ▼）
            function moveSprite(index, direction) {
                const target = index + direction;
                if (target < 0 || target >= sprites.length) return;
                history.push(JSON.stringify(sprites));
                const temp = sprites[index];
                sprites[index] = sprites[target];
                sprites[target] = temp;
                render();
            }

            // 読順自動整列（左上→右下）
            function sortSpritesByReadingOrder() {
                if (sprites.length < 2) return;
                history.push(JSON.stringify(sprites));
                const avgH = sprites.reduce((acc, s) => acc + s.rect.h, 0) / sprites.length;
                const rowTol = avgH * 0.5;

                sprites.sort((a, b) => {
                    if (Math.abs(a.rect.y - b.rect.y) > rowTol) {
                        return a.rect.y - b.rect.y;
                    }
                    return a.rect.x - b.rect.x;
                });
                render();
            }

            // 順序反転（リバース）
            function reverseSprites() {
                if (sprites.length < 2) return;
                history.push(JSON.stringify(sprites));
                sprites.reverse();
                render();
            }

            if (sortOrderBtn) {
                sortOrderBtn.addEventListener('click', sortSpritesByReadingOrder);
            }

            if (reverseBtn) {
                reverseBtn.addEventListener('click', reverseSprites);
            }

            clearAllBtn.addEventListener('click', () => {
                if (!sprites.length) return;
                history.push(JSON.stringify(sprites));
                sprites = [];
                stopAnimation();
                animCurrentFrame = 0;
                render();
            });

            // スプライト単体を透過処理したオフスクリーンCanvasを生成
            function getProcessedSpriteCanvas(s) {
                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = s.rect.w;
                tempCanvas.height = s.rect.h;
                const tempCtx = tempCanvas.getContext('2d');

                if (bgMode.value === 'color') {
                    const hex = bgColorPicker.value;
                    const bgR = parseInt(hex.slice(1, 3), 16);
                    const bgG = parseInt(hex.slice(3, 5), 16);
                    const bgB = parseInt(hex.slice(5, 7), 16);
                    const tol = parseFloat(bgTolInput.value);

                    const cropImgData = ctxImg.getImageData(s.rect.x, s.rect.y, s.rect.w, s.rect.h);
                    const d = cropImgData.data;
                    for (let i = 0; i < d.length; i += 4) {
                        const dist = Math.sqrt((d[i] - bgR) ** 2 + (d[i + 1] - bgG) ** 2 + (d[i + 2] - bgB) ** 2) / 441.67 * 100;
                        if (dist <= tol) d[i + 3] = 0;
                    }
                    tempCtx.putImageData(cropImgData, 0, 0);
                } else {
                    tempCtx.drawImage(imgCanvas, s.rect.x, s.rect.y, s.rect.w, s.rect.h, 0, 0, s.rect.w, s.rect.h);
                }
                return tempCanvas;
            }

            function render() {
                countBadge.textContent = `${sprites.length} 個選択中`;
                exportBtn.disabled = sprites.length === 0;

                renderOverlay();
                renderList();
                updateAnimPreview();
            }

            function renderOverlay() {
                ctxOverlay.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

                if (isDragging) {
                    const rx = Math.min(startX, currentX);
                    const ry = Math.min(startY, currentY);
                    const rw = Math.abs(currentX - startX);
                    const rh = Math.abs(currentY - startY);
                    ctxOverlay.fillStyle = 'rgba(0, 122, 204, 0.25)';
                    ctxOverlay.fillRect(rx, ry, rw, rh);
                    ctxOverlay.strokeStyle = '#007acc';
                    ctxOverlay.lineWidth = 2;
                    ctxOverlay.setLineDash([4, 3]);
                    ctxOverlay.strokeRect(rx, ry, rw, rh);
                    ctxOverlay.setLineDash([]);
                }

                sprites.forEach((s, idx) => {
                    ctxOverlay.strokeStyle = '#ef4444';
                    ctxOverlay.lineWidth = 2;
                    ctxOverlay.strokeRect(s.rect.x, s.rect.y, s.rect.w, s.rect.h);

                    // 連番インデックス描画
                    ctxOverlay.fillStyle = '#ef4444';
                    ctxOverlay.fillRect(s.rect.x, Math.max(0, s.rect.y - 16), 24, 16);
                    ctxOverlay.fillStyle = '#ffffff';
                    ctxOverlay.font = 'bold 10px monospace';
                    ctxOverlay.fillText(`#${idx + 1}`, s.rect.x + 3, Math.max(0, s.rect.y - 16) + 12);
                });
            }

            function renderList() {
                listContainer.innerHTML = '';
                if (sprites.length === 0) {
                    const empty = document.createElement('div');
                    empty.style.textAlign = 'center';
                    empty.style.color = 'var(--text-muted)';
                    empty.style.fontSize = '12px';
                    empty.style.padding = '24px 8px';
                    empty.textContent = 'スプライト画像上のオブジェクトをクリックまたはドラッグで選択してください';
                    listContainer.appendChild(empty);
                    return;
                }

                sprites.forEach((s, idx) => {
                    const item = document.createElement('div');
                    item.className = 'sprite-item';
                    item.setAttribute('draggable', 'true');
                    item.dataset.index = idx;

                    const thumbCanvas = getProcessedSpriteCanvas(s);
                    const thumbUrl = thumbCanvas.toDataURL('image/png');

                    item.innerHTML = `
                        <div class="sprite-drag-handle" title="ドラッグして順番を入れ替え">⋮⋮</div>
                        <span class="sprite-order-badge">#${idx + 1}</span>
                        <div class="sprite-thumb checkerboard">
                            <img src="${thumbUrl}">
                        </div>
                        <div class="sprite-info">
                            <span>${s.rect.w}×${s.rect.h}px</span> (X:${s.rect.x}, Y:${s.rect.y})
                        </div>
                        <div class="sprite-actions">
                            <button class="sprite-btn-move btn-move-up" title="上へ移動 (連番繰り上げ)" ${idx === 0 ? 'disabled' : ''}>▲</button>
                            <button class="sprite-btn-move btn-move-down" title="下へ移動 (連番繰り下げ)" ${idx === sprites.length - 1 ? 'disabled' : ''}>▼</button>
                            <button class="btn btn-danger btn-delete-sprite" style="padding: 2px 6px; font-size: 10px; height: 22px;">削除</button>
                        </div>
                    `;

                    // 上へ移動
                    const upBtn = item.querySelector('.btn-move-up');
                    if (upBtn) {
                        upBtn.addEventListener('click', (e) => {
                            e.stopPropagation();
                            moveSprite(idx, -1);
                        });
                    }

                    // 下へ移動
                    const downBtn = item.querySelector('.btn-move-down');
                    if (downBtn) {
                        downBtn.addEventListener('click', (e) => {
                            e.stopPropagation();
                            moveSprite(idx, 1);
                        });
                    }

                    // 削除
                    const delBtn = item.querySelector('.btn-delete-sprite');
                    if (delBtn) {
                        delBtn.addEventListener('click', (e) => {
                            e.stopPropagation();
                            history.push(JSON.stringify(sprites));
                            sprites = sprites.filter(item => item.id !== s.id);
                            render();
                        });
                    }

                    // HTML5 ドラッグ＆ドロップ並び替え
                    item.addEventListener('dragstart', (e) => {
                        dragSourceIndex = idx;
                        item.classList.add('dragging');
                        e.dataTransfer.effectAllowed = 'move';
                        e.dataTransfer.setData('text/plain', String(idx));
                    });

                    item.addEventListener('dragover', (e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = 'move';
                        const rect = item.getBoundingClientRect();
                        const midY = rect.top + rect.height / 2;
                        if (e.clientY < midY) {
                            item.classList.add('drag-over-top');
                            item.classList.remove('drag-over-bottom');
                        } else {
                            item.classList.add('drag-over-bottom');
                            item.classList.remove('drag-over-top');
                        }
                    });

                    item.addEventListener('dragleave', () => {
                        item.classList.remove('drag-over-top', 'drag-over-bottom');
                    });

                    item.addEventListener('drop', (e) => {
                        e.preventDefault();
                        item.classList.remove('drag-over-top', 'drag-over-bottom');
                        const fromIdx = dragSourceIndex;
                        const toIdx = idx;

                        if (fromIdx !== null && fromIdx !== toIdx) {
                            history.push(JSON.stringify(sprites));
                            const moved = sprites.splice(fromIdx, 1)[0];
                            const rect = item.getBoundingClientRect();
                            const midY = rect.top + rect.height / 2;
                            let insertIdx = e.clientY < midY ? toIdx : toIdx + 1;
                            if (fromIdx < insertIdx) insertIdx--;
                            sprites.splice(insertIdx, 0, moved);
                            render();
                        }
                    });

                    item.addEventListener('dragend', () => {
                        item.classList.remove('dragging');
                        document.querySelectorAll('.sprite-item').forEach(el => {
                            el.classList.remove('drag-over-top', 'drag-over-bottom', 'dragging');
                        });
                        dragSourceIndex = null;
                    });

                    listContainer.appendChild(item);
                });
            }

            // 連番アニメーションプレビュー制御
            function updateAnimPreview() {
                if (!animCanvas || !animCtx) return;
                animCtx.clearRect(0, 0, animCanvas.width, animCanvas.height);

                if (sprites.length === 0) {
                    if (animFrameText) animFrameText.textContent = 'コマ: - / -';
                    if (isPlayingAnim) stopAnimation();
                    return;
                }

                if (animCurrentFrame >= sprites.length) {
                    animCurrentFrame = 0;
                } else if (animCurrentFrame < 0) {
                    animCurrentFrame = sprites.length - 1;
                }

                if (animFrameText) {
                    animFrameText.textContent = `コマ: ${animCurrentFrame + 1} / ${sprites.length}`;
                }

                const s = sprites[animCurrentFrame];
                if (!s) return;

                const processedCanvas = getProcessedSpriteCanvas(s);
                const cW = animCanvas.width;
                const cH = animCanvas.height;
                const scale = Math.min((cW - 4) / s.rect.w, (cH - 4) / s.rect.h);
                const dw = Math.round(s.rect.w * scale);
                const dh = Math.round(s.rect.h * scale);
                const dx = Math.round((cW - dw) / 2);
                const dy = Math.round((cH - dh) / 2);

                animCtx.imageSmoothingEnabled = false;
                animCtx.drawImage(processedCanvas, dx, dy, dw, dh);
            }

            function startAnimation() {
                if (sprites.length === 0) return;
                isPlayingAnim = true;
                if (animPlayBtn) {
                    animPlayBtn.textContent = '停止';
                    animPlayBtn.classList.remove('btn-primary');
                    animPlayBtn.classList.add('btn-danger');
                }
                const fps = Math.min(60, Math.max(1, parseInt(animFpsInput ? animFpsInput.value : 10, 10) || 10));
                const interval = 1000 / fps;

                if (animTimer) clearInterval(animTimer);
                animTimer = setInterval(() => {
                    if (sprites.length === 0) {
                        stopAnimation();
                        return;
                    }
                    animCurrentFrame = (animCurrentFrame + 1) % sprites.length;
                    updateAnimPreview();
                }, interval);
            }

            function stopAnimation() {
                isPlayingAnim = false;
                if (animTimer) {
                    clearInterval(animTimer);
                    animTimer = null;
                }
                if (animPlayBtn) {
                    animPlayBtn.textContent = '再生';
                    animPlayBtn.classList.remove('btn-danger');
                    animPlayBtn.classList.add('btn-primary');
                }
            }

            if (animPlayBtn) {
                animPlayBtn.addEventListener('click', () => {
                    if (isPlayingAnim) {
                        stopAnimation();
                    } else {
                        startAnimation();
                    }
                });
            }

            if (animFpsInput) {
                animFpsInput.addEventListener('change', () => {
                    if (isPlayingAnim) {
                        startAnimation(); // restart with new fps
                    }
                });
            }

            if (animPrevBtn) {
                animPrevBtn.addEventListener('click', () => {
                    stopAnimation();
                    if (sprites.length > 0) {
                        animCurrentFrame = (animCurrentFrame - 1 + sprites.length) % sprites.length;
                        updateAnimPreview();
                    }
                });
            }

            if (animNextBtn) {
                animNextBtn.addEventListener('click', () => {
                    stopAnimation();
                    if (sprites.length > 0) {
                        animCurrentFrame = (animCurrentFrame + 1) % sprites.length;
                        updateAnimPreview();
                    }
                });
            }

            // ZIP連番エクスポート
            exportBtn.addEventListener('click', async () => {
                if (!sprites.length) return;
                if (typeof JSZip === 'undefined') {
                    showToast('ZIPライブラリの読み込みに失敗しました');
                    return;
                }
                const zip = new JSZip();
                const baseName = filenameInput.value.trim() || 'sprite';

                sprites.forEach((s, idx) => {
                    const tempCanvas = getProcessedSpriteCanvas(s);
                    const dataUrl = tempCanvas.toDataURL('image/png').split(',')[1];
                    const numStr = String(idx + 1).padStart(3, '0');
                    zip.file(`${baseName}_${numStr}.png`, dataUrl, { base64: true });
                });

                const content = await zip.generateAsync({ type: 'blob' });
                const zipUrl = URL.createObjectURL(content);
                const a = document.createElement('a');
                a.href = zipUrl;
                a.download = `${baseName}.zip`;
                a.click();
                setTimeout(() => URL.revokeObjectURL(zipUrl), 1000);
            });

            // Undo (Ctrl+Z)
            document.addEventListener('keydown', (e) => {
                if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
                if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
                    if (history.length) {
                        sprites = JSON.parse(history.pop());
                        render();
                    }
                }
            });

            // Background Switcher
            document.querySelectorAll('.sprite-bg-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    document.querySelectorAll('.sprite-bg-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    const bg = btn.dataset.bg;
                    if (bg === 'checker') {
                        document.getElementById('spriteCanvasContainer').className = 'checkerboard';
                        document.getElementById('spriteCanvasContainer').style.backgroundColor = '';
                    } else {
                        document.getElementById('spriteCanvasContainer').className = '';
                        document.getElementById('spriteCanvasContainer').style.backgroundColor = bg;
                    }
                });
            });
        })();

        // ==========================================================================
        // 5. TOOL 4: 画像形式一括変換 LOGIC
        // ==========================================================================
        (function() {
            let items = [];
            let fmt = 'png';
            let quality = 80;

            const drop = document.getElementById('imgConvDrop');
            const input = document.getElementById('imgConvInput');
            const list = document.getElementById('imgConvList');
            const startBtn = document.getElementById('imgConvStartBtn');
            const zipBtn = document.getElementById('imgConvZipBtn');
            const countEl = document.getElementById('imgConvCount');
            const clearBtn = document.getElementById('imgConvClearBtn');
            const qualityBox = document.getElementById('imgConvQualityBox');
            const qualityInput = document.getElementById('imgConvQuality');
            const qualityVal = document.getElementById('imgConvQualityVal');

            document.querySelectorAll('#imgConvFmtGroup button').forEach(btn => {
                btn.addEventListener('click', () => {
                    document.querySelectorAll('#imgConvFmtGroup button').forEach(b => b.classList.remove('btn-primary'));
                    btn.classList.add('btn-primary');
                    fmt = btn.dataset.fmt;
                    if (fmt === 'jpg' || fmt === 'webp') qualityBox.classList.remove('hidden');
                    else qualityBox.classList.add('hidden');
                });
            });

            qualityInput.addEventListener('input', (e) => {
                quality = parseInt(e.target.value);
                qualityVal.textContent = quality + '%';
            });

            setupDropZone(drop, input, handleFiles);

            function handleFiles(files) {
                Array.from(files).filter(f => f.type.startsWith('image/')).forEach(f => {
                    items.push({ file: f, status: 'pending', blob: null, url: null });
                });
                render();
            }

            clearBtn.addEventListener('click', () => {
                items.forEach(i => { if (i.url) URL.revokeObjectURL(i.url); });
                items = [];
                render();
            });

            startBtn.addEventListener('click', async () => {
                for (let item of items) {
                    if (item.status === 'done') continue;
                    try {
                        const blob = await convertImage(item.file, fmt, quality);
                        item.blob = blob;
                        if (item.url) URL.revokeObjectURL(item.url);
                        item.url = URL.createObjectURL(blob);
                        item.status = 'done';
                    } catch (err) {
                        item.status = 'error';
                    }
                }
                render();
            });

            zipBtn.addEventListener('click', async () => {
                if (typeof JSZip === 'undefined') return;
                const zip = new JSZip();
                items.filter(i => i.status === 'done' && i.blob).forEach(i => {
                    const baseName = i.file.name.substring(0, i.file.name.lastIndexOf('.')) || i.file.name;
                    zip.file(`${baseName}.${fmt === 'jpg' ? 'jpeg' : fmt}`, i.blob);
                });
                const content = await zip.generateAsync({ type: 'blob' });
                const zipUrl = URL.createObjectURL(content);
                const a = document.createElement('a');
                a.href = zipUrl;
                a.download = 'converted_images.zip';
                a.click();
                setTimeout(() => URL.revokeObjectURL(zipUrl), 1000);
            });

            function convertImage(file, format, q) {
                return new Promise((resolve, reject) => {
                    const img = new Image();
                    const url = URL.createObjectURL(file);
                    img.onload = () => {
                        URL.revokeObjectURL(url);
                        const canvas = document.createElement('canvas');
                        canvas.width = img.width;
                        canvas.height = img.height;
                        const ctx = canvas.getContext('2d');
                        if (format === 'jpg') {
                            ctx.fillStyle = '#FFFFFF';
                            ctx.fillRect(0, 0, canvas.width, canvas.height);
                        }
                        ctx.drawImage(img, 0, 0);
                        const mime = format === 'jpg' ? 'image/jpeg' : format === 'webp' ? 'image/webp' : 'image/png';
                        canvas.toBlob(b => b ? resolve(b) : reject(), mime, q / 100);
                    };
                    img.onerror = reject;
                    img.src = url;
                });
            }

            function render() {
                countEl.textContent = `ファイル一覧 (${items.length}件)`;
                startBtn.disabled = !items.some(i => i.status === 'pending');
                zipBtn.disabled = !items.some(i => i.status === 'done');

                list.innerHTML = items.map(i => {
                    const baseName = i.file.name.replace(/\.[^/.]+$/, "") || i.file.name;
                    return `
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 6px; border: 1px solid var(--border-color); background-color: var(--bg-panel);">
                        <span style="font-weight: 600; font-size: 11px;">${i.file.name}</span>
                        <div>
                            ${i.status === 'done' ? `<a href="${i.url}" download="${baseName}_conv.${fmt}" class="btn btn-primary" style="padding: 2px 6px; font-size: 10px;">保存</a>` : ''}
                            <span class="chip">${i.status}</span>
                        </div>
                    </div>
                `}).join('');
            }
        })();

        // ==========================================================================
        // 6. TOOL 5: 透過画像余白自動削減 LOGIC (ファイル名末尾 _c)
        // ==========================================================================
        (function() {
            const drop = document.getElementById('pngCropDrop');
            const input = document.getElementById('pngCropInput');
            const results = document.getElementById('pngCropResults');

            setupDropZone(drop, input, handleFiles);

            function handleFiles(files) {
                Array.from(files).forEach(file => {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        const img = new Image();
                        img.onload = () => {
                            const canvas = document.createElement('canvas');
                            canvas.width = img.width;
                            canvas.height = img.height;
                            const ctx = canvas.getContext('2d');
                            ctx.drawImage(img, 0, 0);

                            const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                            const bounds = getBoundingBox(imgData);
                            if (!bounds) {
                                showToast(`${file.name}: 削減可能な不透明ピクセルが見つかりませんでした`);
                                return;
                            }

                            const cropCanvas = document.createElement('canvas');
                            cropCanvas.width = bounds.w;
                            cropCanvas.height = bounds.h;
                            const cropCtx = cropCanvas.getContext('2d');
                            cropCtx.drawImage(canvas, bounds.x, bounds.y, bounds.w, bounds.h, 0, 0, bounds.w, bounds.h);

                            const cropUrl = cropCanvas.toDataURL('image/png');
                            const outName = addSuffixC(file.name);

                            renderCard(cropUrl, outName, bounds.w, bounds.h);
                        };
                        img.src = e.target.result;
                    };
                    reader.readAsDataURL(file);
                });
            }

            function getBoundingBox(imgData) {
                const { data, width, height } = imgData;
                let minX = width, minY = height, maxX = -1, maxY = -1;
                let found = false;

                for (let y = 0; y < height; y++) {
                    for (let x = 0; x < width; x++) {
                        const alpha = data[(y * width + x) * 4 + 3];
                        if (alpha > 0) {
                            if (x < minX) minX = x;
                            if (x > maxX) maxX = x;
                            if (y < minY) minY = y;
                            if (y > maxY) maxY = y;
                            found = true;
                        }
                    }
                }
                if (!found) return null;
                return { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 };
            }

            function renderCard(url, name, w, h) {
                const card = document.createElement('div');
                card.className = 'panel';
                card.style.margin = '0';
                card.innerHTML = `
                    <div class="checkerboard" style="border: 1px solid var(--border-color); height: 120px; display: flex; align-items: center; justify-content: center; margin-bottom: 8px;">
                        <img src="${url}" style="max-width: 100%; max-height: 100%; object-fit: contain;">
                    </div>
                    <div style="font-size: 11px; font-weight: 700; margin-bottom: 6px;">${name} (${w}x${h}px)</div>
                    <a href="${url}" download="${name}" class="btn btn-primary" style="width: 100%; text-align: center;">保存</a>
                `;
                results.appendChild(card);
            }
        })();

        // ==========================================================================
        // 7. TOOL 6: クロマキー背景透過 LOGIC (スポイト修正完全連動版)
        // ==========================================================================
        (function() {
            let currentImg = null;
            let isPipette = false;

            const drop = document.getElementById('chromaDrop');
            const input = document.getElementById('chromaInput');
            const colorPicker = document.getElementById('chromaColorPicker');
            const colorText = document.getElementById('chromaColorText');
            const pipetteBtn = document.getElementById('chromaPipetteBtn');
            const pipetteHint = document.getElementById('chromaPipetteHint');
            const tolInput = document.getElementById('chromaTol');
            const tolVal = document.getElementById('chromaTolVal');
            const smoothInput = document.getElementById('chromaSmooth');
            const smoothVal = document.getElementById('chromaSmoothVal');
            const downloadBtn = document.getElementById('chromaDownloadBtn');
            const canvas = document.getElementById('chromaCanvas');
            const placeholder = document.getElementById('chromaPlaceholder');
            const ctx = canvas.getContext('2d', { willReadFrequently: true });

            setupDropZone(drop, input, (files) => {
                if (files && files[0]) handleFile(files[0]);
            });

            function handleFile(file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const img = new Image();
                    img.onload = () => {
                        currentImg = img;
                        downloadBtn.disabled = false;
                        placeholder.classList.add('hidden');
                        canvas.classList.remove('hidden');
                        process();
                    };
                    img.src = e.target.result;
                };
                reader.readAsDataURL(file);
            }

            colorPicker.addEventListener('input', (e) => {
                colorText.value = e.target.value.toUpperCase();
                process();
            });

            tolInput.addEventListener('input', (e) => {
                tolVal.textContent = e.target.value + '%';
                process();
            });

            smoothInput.addEventListener('input', (e) => {
                smoothVal.textContent = e.target.value + '%';
                process();
            });

            pipetteBtn.addEventListener('click', () => {
                isPipette = !isPipette;
                if (isPipette) {
                    pipetteBtn.style.backgroundColor = 'var(--accent-primary)';
                    pipetteHint.classList.remove('hidden');
                } else {
                    pipetteBtn.style.backgroundColor = '';
                    pipetteHint.classList.add('hidden');
                }
            });

            canvas.addEventListener('click', (e) => {
                if (!isPipette || !currentImg) return;
                const rect = canvas.getBoundingClientRect();
                const scaleX = canvas.width / rect.width;
                const scaleY = canvas.height / rect.height;
                const x = Math.floor((e.clientX - rect.left) * scaleX);
                const y = Math.floor((e.clientY - rect.top) * scaleY);

                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = canvas.width;
                tempCanvas.height = canvas.height;
                const tempCtx = tempCanvas.getContext('2d');
                tempCtx.drawImage(currentImg, 0, 0);

                const p = tempCtx.getImageData(x, y, 1, 1).data;
                const hex = "#" + ((1 << 24) + (p[0] << 16) + (p[1] << 8) + p[2]).toString(16).slice(1).toUpperCase();
                colorPicker.value = hex;
                colorText.value = hex;

                isPipette = false;
                pipetteBtn.style.backgroundColor = '';
                pipetteHint.classList.add('hidden');
                process();
            });

            function process() {
                if (!currentImg) return;
                canvas.width = currentImg.naturalWidth;
                canvas.height = currentImg.naturalHeight;
                ctx.drawImage(currentImg, 0, 0);

                const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const data = imgData.data;

                const hex = colorPicker.value;
                const targetR = parseInt(hex.slice(1, 3), 16);
                const targetG = parseInt(hex.slice(3, 5), 16);
                const targetB = parseInt(hex.slice(5, 7), 16);

                const tol = parseFloat(tolInput.value);
                const smooth = parseFloat(smoothInput.value);
                const maxDist = 441.67;

                for (let i = 0; i < data.length; i += 4) {
                    const dist = Math.sqrt((data[i] - targetR) ** 2 + (data[i + 1] - targetG) ** 2 + (data[i + 2] - targetB) ** 2);
                    const pct = (dist / maxDist) * 100;
                    if (pct <= tol) {
                        data[i + 3] = 0;
                    } else if (pct <= tol + smooth) {
                        data[i + 3] = Math.floor(data[i + 3] * ((pct - tol) / smooth));
                    }
                }
                ctx.putImageData(imgData, 0, 0);
            }

            downloadBtn.addEventListener('click', () => {
                if (!currentImg) return;
                const a = document.createElement('a');
                a.href = canvas.toDataURL('image/png');
                a.download = 'chromakey_output.png';
                a.click();
            });
        })();

        // ==========================================================================
        // 8. TOOL 7: SVG余白トリミング LOGIC (ファイル名末尾 _c)
        // ==========================================================================
        (function() {
            const drop = document.getElementById('svgCropDrop');
            const input = document.getElementById('svgCropInput');
            const workspace = document.getElementById('svgCropWorkspace');
            const preview = document.getElementById('svgCropPreview');
            const viewboxEl = document.getElementById('svgCropViewbox');
            const paddingChk = document.getElementById('svgCropPaddingChk');
            const paddingRange = document.getElementById('svgCropPaddingRange');
            const downloadBtn = document.getElementById('svgCropDownloadBtn');
            const copyBtn = document.getElementById('svgCropCopyBtn');
            const calcContainer = document.getElementById('svgCropCalcContainer');

            let origSvgStr = '';
            let croppedSvgStr = '';
            let bbox = null;
            let filename = '';

            setupDropZone(drop, input, (files) => {
                if (files && files[0]) handleFile(files[0]);
            });

            function handleFile(file) {
                filename = file.name;
                const reader = new FileReader();
                reader.onload = (e) => {
                    origSvgStr = e.target.result;
                    processSvg();
                };
                reader.readAsText(file);
            }

            function processSvg() {
                calcContainer.innerHTML = '';
                const parser = new DOMParser();
                const doc = parser.parseFromString(origSvgStr, 'image/svg+xml');
                const svgEl = doc.documentElement;

                calcContainer.appendChild(svgEl.cloneNode(true));
                const calcSvg = calcContainer.querySelector('svg');
                calcSvg.removeAttribute('width');
                calcSvg.removeAttribute('height');

                try {
                    const wrapper = document.createElementNS("http://www.w3.org/2000/svg", "g");
                    while (calcSvg.firstChild) wrapper.appendChild(calcSvg.firstChild);
                    calcSvg.appendChild(wrapper);
                    bbox = wrapper.getBBox();

                    updateCroppedSvg();
                    drop.classList.add('hidden');
                    workspace.classList.remove('hidden');
                } catch (err) {}
            }

            function updateCroppedSvg() {
                if (!bbox) return;
                const p = paddingChk.checked ? parseInt(paddingRange.value) : 0;
                const newX = bbox.x - p;
                const newY = bbox.y - p;
                const newW = bbox.width + (p * 2);
                const newH = bbox.height + (p * 2);

                const newVb = `${Math.round(newX * 100) / 100} ${Math.round(newY * 100) / 100} ${Math.round(newW * 100) / 100} ${Math.round(newH * 100) / 100}`;
                viewboxEl.textContent = newVb;

                const parser = new DOMParser();
                const doc = parser.parseFromString(origSvgStr, 'image/svg+xml');
                const svg = doc.documentElement;
                svg.removeAttribute('width');
                svg.removeAttribute('height');
                svg.setAttribute('viewBox', newVb);

                croppedSvgStr = new XMLSerializer().serializeToString(doc);
                preview.innerHTML = croppedSvgStr;
            }

            paddingChk.addEventListener('change', (e) => {
                if (e.target.checked) paddingRange.classList.remove('hidden');
                else paddingRange.classList.add('hidden');
                updateCroppedSvg();
            });

            paddingRange.addEventListener('input', updateCroppedSvg);

            downloadBtn.addEventListener('click', () => {
                if (!croppedSvgStr) return;
                const blob = new Blob([croppedSvgStr], { type: 'image/svg+xml' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = addSuffixC(filename || 'output.svg');
                a.click();
                setTimeout(() => URL.revokeObjectURL(url), 1000);
            });

            copyBtn.addEventListener('click', () => {
                if (!croppedSvgStr) return;
                navigator.clipboard.writeText(croppedSvgStr);
            });
        })();

        // ==========================================================================
        // 9. TOOL 8: PDF画像抽出・変換 LOGIC (復活機能)
        // ==========================================================================
        (function() {
            const drop = document.getElementById('pdfDropZone');
            const input = document.getElementById('pdfFileInput');
            const modeSelect = document.getElementById('pdfModeSelect');
            const scaleSelect = document.getElementById('pdfScaleSelect');
            const progressSection = document.getElementById('pdfProgressSection');
            const progressBar = document.getElementById('pdfProgressBar');
            const progressPercent = document.getElementById('pdfProgressPercent');
            const resultSection = document.getElementById('pdfResultSection');
            const gallery = document.getElementById('pdfGallery');
            const zipBtn = document.getElementById('pdfZipBtn');

            let generatedImages = [];

            setupDropZone(drop, input, (files) => {
                if (files && files[0]) handleFile(files[0]);
            });

            function handleFile(file) {
                if (file.type !== 'application/pdf') return;
                processPdf(file);
            }

            async function processPdf(file) {
                resultSection.classList.add('hidden');
                gallery.innerHTML = '';
                generatedImages = [];
                progressSection.classList.remove('hidden');

                try {
                    const buf = await file.arrayBuffer();
                    const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
                    const total = pdf.numPages;
                    const mode = modeSelect.value;

                    for (let i = 1; i <= total; i++) {
                        const page = await pdf.getPage(i);
                        if (mode === 'convert') {
                            await renderPageToImage(page, i, file.name);
                        } else {
                            await extractImagesFromPage(page, i, file.name);
                        }
                        const pct = Math.round((i / total) * 100);
                        progressBar.style.width = pct + '%';
                        progressPercent.textContent = `${i} / ${total} ページ完了`;
                    }
                    showResults();
                } catch (err) {
                    showToast('PDFの処理中にエラーが発生しました: ' + (err.message || '読み込み失敗'));
                } finally {
                    progressSection.classList.add('hidden');
                }
            }

            async function renderPageToImage(page, pageNum, filename) {
                const scale = parseFloat(scaleSelect.value);
                const viewport = page.getViewport({ scale });
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.height = viewport.height;
                canvas.width = viewport.width;

                await page.render({ canvasContext: ctx, viewport }).promise;
                const baseName = filename.replace(/\.pdf$/i, '');
                const fname = `${baseName}_p${String(pageNum).padStart(3, '0')}.png`;
                generatedImages.push({ url: canvas.toDataURL('image/png'), name: fname });
            }

            async function extractImagesFromPage(page, pageNum, filename) {
                const ops = await page.getOperatorList();
                const baseName = filename.replace(/\.pdf$/i, '');
                for (let i = 0; i < ops.fnArray.length; i++) {
                    if (ops.fnArray[i] === pdfjsLib.OPS.paintImageXObject || ops.fnArray[i] === pdfjsLib.OPS.paintInlineImageXObject) {
                        const imgName = ops.argsArray[i][0];
                        try {
                            const imgObj = await new Promise(res => page.objs.get(imgName, res));
                            if (imgObj) {
                                const canvas = document.createElement('canvas');
                                const ctx = canvas.getContext('2d');
                                canvas.width = imgObj.width;
                                canvas.height = imgObj.height;

                                if (imgObj.bitmap) {
                                    ctx.drawImage(imgObj.bitmap, 0, 0);
                                    generatedImages.push({ url: canvas.toDataURL('image/png'), name: `${baseName}_p${pageNum}_img${i}.png` });
                                } else if (imgObj.data) {
                                    const imgData = new ImageData(new Uint8ClampedArray(imgObj.data), imgObj.width, imgObj.height);
                                    ctx.putImageData(imgData, 0, 0);
                                    generatedImages.push({ url: canvas.toDataURL('image/png'), name: `${baseName}_p${pageNum}_img${i}.png` });
                                }
                            }
                        } catch (e) {}
                    }
                }
            }

            function showResults() {
                resultSection.classList.remove('hidden');
                document.getElementById('pdfResultCount').textContent = `抽出結果 (${generatedImages.length}件)`;

                if (generatedImages.length === 0) {
                    gallery.innerHTML = `
                        <div style="grid-column: 1 / -1; text-align: center; padding: 24px 12px; color: var(--text-muted); font-size: 13px;">
                            抽出可能な画像が見つかりませんでした。「全ページを画像に変換」モードをお試しください。
                        </div>
                    `;
                    return;
                }

                generatedImages.forEach(img => {
                    const card = document.createElement('div');
                    card.className = 'panel';
                    card.style.margin = '0';
                    card.innerHTML = `
                        <div class="checkerboard" style="border: 1px solid var(--border-color); height: 100px; display: flex; align-items: center; justify-content: center; margin-bottom: 6px;">
                            <img src="${img.url}" style="max-width: 100%; max-height: 100%; object-fit: contain;">
                        </div>
                        <div style="font-size: 11px; font-weight: 700; margin-bottom: 6px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${img.name}</div>
                        <a href="${img.url}" download="${img.name}" class="btn btn-primary" style="width: 100%; text-align: center;">保存</a>
                    `;
                    gallery.appendChild(card);
                });
            }

            zipBtn.addEventListener('click', async () => {
                if (!generatedImages.length || typeof JSZip === 'undefined') return;
                const zip = new JSZip();
                generatedImages.forEach(img => {
                    zip.file(img.name, img.url.split(',')[1], { base64: true });
                });
                const content = await zip.generateAsync({ type: 'blob' });
                const zipUrl = URL.createObjectURL(content);
                const a = document.createElement('a');
                a.href = zipUrl;
                a.download = 'pdf_images.zip';
                a.click();
                setTimeout(() => URL.revokeObjectURL(zipUrl), 1000);
            });
        })();

        // ==========================================================================
        // 10. TOOL 9: 1バイトフォントコード変換 LOGIC
        // ==========================================================================
        (function() {
            const baseKanaToJis = {
                'ア':'3', 'イ':'e', 'ウ':'4', 'エ':'5', 'オ':'6',
                'カ':'t', 'キ':'g', 'ク':'h', 'ケ':':', 'コ':'b',
                'サ':'x', 'シ':'d', 'ス':'r', 'セ':'p', 'ソ':'c',
                'タ':'q', 'チ':'a', 'ツ':'z', 'テ':'w', 'ト':'s',
                'ナ':'u', 'ニ':'i', 'ヌ':'1', 'ネ':',', 'ノ':'k',
                'ハ':'f', 'ヒ':'v', 'フ':'2', 'ヘ':'^', 'ホ':'-',
                'マ':'j', 'ミ':'n', 'ム':']', 'メ':'/', 'モ':'m',
                'ヤ':'7', 'ユ':'8', 'ヨ':'9',
                'ラ':'o', 'リ':'l', 'ル':'.', 'レ':';', 'ロ':'\\',
                'ワ':'0', 'ヲ':'~', 'ン':'y',
                'ァ':'#', 'ィ':'E', 'ゥ':'$', 'ェ':'%', 'ォ':'&',
                'ャ':'\'', 'ュ':'(', 'ョ':')', 'ッ':'Z',
                'ー':'\\', '・':'/', '、':',', '。':'.'
            };

            const dakutenMap = {
                'ガ':'t@', 'ギ':'g@', 'グ':'h@', 'ゲ':':@', 'ゴ':'b@',
                'ザ':'x@', 'ジ':'d@', 'ズ':'r@', 'ゼ':'p@', 'ゾ':'c@',
                'ダ':'q@', 'ヂ':'a@', 'ヅ':'z@', 'デ':'w@', 'ド':'s@',
                'バ':'f@', 'ビ':'v@', 'ブ':'2@', 'ベ':'^@', 'ボ':'-@',
                'ヴ':'4@',
                'パ':'f[', 'ピ':'v[', 'プ':'2[', 'ペ':'^[', 'ポ':'-['
            };

            const input = document.getElementById('oneByteInput');
            const output = document.getElementById('oneByteOutput');
            const hasDakuten = document.getElementById('oneByteHasDakuten');
            const copyBtn = document.getElementById('oneByteCopyBtn');
            const clearBtn = document.getElementById('oneByteClearBtn');
            const inputClearBtn = document.getElementById('oneByteInputClearBtn');

            function convert() {
                let t = input.value;
                // Convert hiragana to katakana
                t = t.replace(/[\u3041-\u3096]/g, m => String.fromCharCode(m.charCodeAt(0) + 0x60));

                let res = '';
                for (let i = 0; i < t.length; i++) {
                    const char = t[i];
                    if (hasDakuten.checked && dakutenMap[char]) {
                        res += dakutenMap[char];
                    } else if (baseKanaToJis[char]) {
                        res += baseKanaToJis[char];
                    } else {
                        res += char;
                    }
                }
                output.value = res;
            }

            function clearAll() {
                input.value = '';
                output.value = '';
                input.focus();
            }

            input.addEventListener('input', convert);
            hasDakuten.addEventListener('change', convert);

            if (clearBtn) clearBtn.addEventListener('click', clearAll);
            if (inputClearBtn) inputClearBtn.addEventListener('click', clearAll);

            copyBtn.addEventListener('click', () => {
                if (output.value) {
                    navigator.clipboard.writeText(output.value);
                    const originalText = copyBtn.textContent;
                    copyBtn.textContent = '✅ コピー完了';
                    setTimeout(() => {
                        copyBtn.textContent = originalText;
                    }, 1500);
                }
            });
        })();

        // ==========================================================================
        // 11. TOOL 10: ローマ字かな変換 LOGIC
        // ==========================================================================
        (function() {
            const romajiMap = {
                'tsya': 'ちゃ', 'tsyu': 'ちゅ', 'tsyo': 'ちょ',
                'kya': 'きゃ', 'kyu': 'きゅ', 'kyo': 'きょ',
                'sha': 'しゃ', 'shi': 'し', 'shu': 'しゅ', 'she': 'しぇ', 'sho': 'しょ',
                'cha': 'ちゃ', 'chi': 'ち', 'chu': 'ちゅ', 'che': 'ちぇ', 'cho': 'ちょ',
                'nya': 'にゃ', 'nyu': 'にゅ', 'nyo': 'にょ',
                'hya': 'ひゃ', 'hyu': 'ひゅ', 'hyo': 'ひょ',
                'mya': 'みゃ', 'myu': 'みゅ', 'myo': 'みょ',
                'rya': 'りゃ', 'ryu': 'りゅ', 'ryo': 'りょ',
                'gya': 'ぎゃ', 'gyu': 'ぎゅ', 'gyo': 'ぎょ',
                'bya': 'びゃ', 'byu': 'びゅ', 'byo': 'びょ',
                'pya': 'ぴゃ', 'pyu': 'ぴゅ', 'pyo': 'ぴょ',
                'tsu': 'つ', 'ka': 'か', 'ki': 'き', 'ku': 'く', 'ke': 'け', 'ko': 'こ',
                'sa': 'さ', 'si': 'し', 'su': 'す', 'se': 'せ', 'so': 'そ',
                'ta': 'た', 'ti': 'ち', 'tu': 'つ', 'te': 'て', 'to': 'と',
                'na': 'な', 'ni': 'に', 'nu': 'ぬ', 'ne': 'ね', 'no': 'の',
                'ha': 'は', 'hi': 'ひ', 'hu': 'ふ', 'fu': 'ふ', 'he': 'へ', 'ho': 'ほ',
                'ma': 'ま', 'mi': 'み', 'mu': 'む', 'me': 'め', 'mo': 'も',
                'ya': 'や', 'yu': 'ゆ', 'yo': 'よ',
                'ra': 'ら', 'ri': 'り', 'ru': 'る', 're': 'れ', 'ro': 'ろ',
                'wa': 'わ', 'wo': 'を', 'ga': 'が', 'gi': 'ぎ', 'gu': 'ぐ', 'ge': 'げ', 'go': 'ご',
                'za': 'ざ', 'zi': 'じ', 'zu': 'ず', 'ze': 'ぜ', 'zo': 'ぞ',
                'da': 'だ', 'di': 'ぢ', 'du': 'づ', 'de': 'で', 'do': 'ど',
                'ba': 'ば', 'bi': 'び', 'bu': 'ぶ', 'be': 'べ', 'bo': 'ぼ',
                'pa': 'ぱ', 'pi': 'ぴ', 'pu': 'ぷ', 'pe': 'ぺ', 'po': 'ぽ',
                'a': 'あ', 'i': 'い', 'u': 'う', 'e': 'え', 'o': 'お', '-': 'ー'
            };

            const input = document.getElementById('romajiInput');
            const output = document.getElementById('romajiOutput');
            const spacesChk = document.getElementById('romajiSpaces');
            const punctChk = document.getElementById('romajiPunct');
            const copyBtn = document.getElementById('romajiCopyBtn');
            const clearBtn = document.getElementById('romajiClearBtn');
            const inputClearBtn = document.getElementById('romajiInputClearBtn');

            const keys = Object.keys(romajiMap).sort((a, b) => b.length - a.length);

            function convert() {
                let t = input.value.toLowerCase();
                t = t.replace(/ā/g, 'あー').replace(/ī/g, 'いー').replace(/ū/g, 'うー').replace(/ē/g, 'えー').replace(/ō/g, 'おー');
                t = t.replace(/nn/g, 'ん');
                t = t.replace(/n(?=[bcdfghjklmpqrstvwxz]|$|\s|[!?,.'])/g, 'ん');
                t = t.replace(/([bcdfghjklmpqrstvwxyz])\1/g, 'っ$1');

                for (let key of keys) {
                    t = t.split(key).join(romajiMap[key]);
                }
                t = t.replace(/n/g, 'ん');

                if (spacesChk.checked) t = t.replace(/[ 　\t]/g, '');
                if (punctChk.checked) t = t.replace(/[.,!?。、！？()（）"']/g, '');

                output.value = t;
            }

            function clearAll() {
                input.value = '';
                output.value = '';
                input.focus();
            }

            input.addEventListener('input', convert);
            spacesChk.addEventListener('change', convert);
            punctChk.addEventListener('change', convert);

            if (clearBtn) clearBtn.addEventListener('click', clearAll);
            if (inputClearBtn) inputClearBtn.addEventListener('click', clearAll);

            copyBtn.addEventListener('click', () => {
                if (output.value) {
                    navigator.clipboard.writeText(output.value);
                    const originalText = copyBtn.textContent;
                    copyBtn.textContent = '✅ コピー完了';
                    setTimeout(() => {
                        copyBtn.textContent = originalText;
                    }, 1500);
                }
            });
        })();

        // ==========================================================================
        // 12. TOOL 11: 文字数カウンター (大学ミニレポート・文章解析・自動校正) LOGIC
        // ==========================================================================
        (function() {
            const editor = document.getElementById('tcEditor');
            const targetInput = document.getElementById('tcTargetInput');
            const targetPills = document.querySelectorAll('.tc-target-pill');
            const progressBar = document.getElementById('tcProgressBar');
            const progressPercentEl = document.getElementById('tcProgressPercent');
            const progressDiffEl = document.getElementById('tcProgressDiff');
            const targetRangeAdviceEl = document.getElementById('tcTargetRangeAdvice');
            const manuscriptBadgeEl = document.getElementById('tcManuscriptBadge');
            const cursorPosEl = document.getElementById('tcCursorPos');
            const lastSavedEl = document.getElementById('tcLastSaved');
            const toastEl = document.getElementById('tcToast');

            // KPI Stats Elements
            const statTotalChars = document.getElementById('tcStatTotalChars');
            const statNoSpaceChars = document.getElementById('tcStatNoSpaceChars');
            const statLettersOnly = document.getElementById('tcStatLettersOnly');
            const statWordCount = document.getElementById('tcStatWordCount');
            const statLines = document.getElementById('tcStatLines');
            const statLinesSub = document.getElementById('tcStatLinesSub');
            const statParagraphs = document.getElementById('tcStatParagraphs');
            const statGenko400 = document.getElementById('tcStatGenko400');
            const statGenko200 = document.getElementById('tcStatGenko200');
            const statReadTime = document.getElementById('tcStatReadTime');
            const statSpeechTime = document.getElementById('tcStatSpeechTime');

            // Composition Elements
            const kanjiRateBadge = document.getElementById('tcKanjiRateBadge');
            const readabilityBox = document.getElementById('tcReadabilityBox');
            const countHiragana = document.getElementById('tcCountHiragana');
            const pctHiragana = document.getElementById('tcPctHiragana');
            const countKatakana = document.getElementById('tcCountKatakana');
            const pctKatakana = document.getElementById('tcPctKatakana');
            const countKanji = document.getElementById('tcCountKanji');
            const pctKanji = document.getElementById('tcPctKanji');
            const countAlpha = document.getElementById('tcCountAlpha');
            const pctAlpha = document.getElementById('tcPctAlpha');
            const countNumber = document.getElementById('tcCountNumber');
            const pctNumber = document.getElementById('tcPctNumber');
            const countSymbol = document.getElementById('tcCountSymbol');
            const pctSymbol = document.getElementById('tcPctSymbol');
            const countSpace = document.getElementById('tcCountSpace');
            const pctSpace = document.getElementById('tcPctSpace');
            const countNewline = document.getElementById('tcCountNewline');
            const pctNewline = document.getElementById('tcPctNewline');

            // Bar Segments
            const segHiragana = document.getElementById('tcSegHiragana');
            const segKatakana = document.getElementById('tcSegKatakana');
            const segKanji = document.getElementById('tcSegKanji');
            const segAlpha = document.getElementById('tcSegAlpha');
            const segNumber = document.getElementById('tcSegNumber');
            const segSymbol = document.getElementById('tcSegSymbol');
            const segSpace = document.getElementById('tcSegSpace');

            // Toolbar & Buttons
            const toolIndent = document.getElementById('tcToolIndent');
            const toolCleanLines = document.getElementById('tcToolCleanLines');
            const toolPunctToggle = document.getElementById('tcToolPunctToggle');
            const toolZenHanAlpha = document.getElementById('tcToolZenHanAlpha');
            const toolHanZenKana = document.getElementById('tcToolHanZenKana');
            const toolCaseToggle = document.getElementById('tcToolCaseToggle');
            const toolUndo = document.getElementById('tcToolUndo');
            const copyBtn = document.getElementById('tcCopyBtn');
            const saveTxtBtn = document.getElementById('tcSaveTxtBtn');
            const clearBtn = document.getElementById('tcClearBtn');
            const fileInput = document.getElementById('tcFileInput');
            const fontSizeSm = document.getElementById('tcFontSizeSm');
            const fontSizeMd = document.getElementById('tcFontSizeMd');
            const fontSizeLg = document.getElementById('tcFontSizeLg');

            // Snapshots
            const saveSnapshotBtn = document.getElementById('tcSaveSnapshotBtn');
            const snapshotListEl = document.getElementById('tcSnapshotList');

            // State & Undo History
            const undoStack = [];
            const MAX_UNDO = 40;
            let autoSaveTimer = null;

            function showToast(msg) {
                if (!toastEl) return;
                toastEl.textContent = msg;
                toastEl.classList.add('show');
                setTimeout(() => toastEl.classList.remove('show'), 2200);
            }

            function pushUndoState() {
                if (undoStack.length === 0 || undoStack[undoStack.length - 1] !== editor.value) {
                    undoStack.push(editor.value);
                    if (undoStack.length > MAX_UNDO) undoStack.shift();
                    toolUndo.disabled = false;
                }
            }

            function updateCursorInfo() {
                const text = editor.value;
                const pos = editor.selectionStart || 0;
                const end = editor.selectionEnd || 0;
                const before = text.substring(0, pos);
                const lineNum = (before.match(/\n/g) || []).length + 1;
                const lastNl = before.lastIndexOf('\n');
                const colNum = lastNl === -1 ? pos + 1 : pos - lastNl;
                const selectedCount = Math.abs(end - pos);

                cursorPosEl.textContent = `カーソル: ${lineNum}行目 ${colNum}文字目 | 選択: ${selectedCount}文字`;
            }

            // Word Count Helper
            function countWords(text) {
                if (!text || !text.trim()) return 0;
                if (typeof Intl !== 'undefined' && Intl.Segmenter) {
                    try {
                        const segmenter = new Intl.Segmenter('ja', { granularity: 'word' });
                        let count = 0;
                        for (const seg of segmenter.segment(text)) {
                            if (seg.isWordLike && seg.segment.trim().length > 0) {
                                count++;
                            }
                        }
                        return count;
                    } catch (e) {}
                }
                // Fallback word counter: count Japanese tokens & alphanumeric sequences
                const words = text.match(/[\u4E00-\u9FFF\u3400-\u4DBF\uF900-\uFAFF\u3040-\u309F\u30A0-\u30FF]+|[a-zA-Z0-9_-]+/g);
                return words ? words.length : 0;
            }

            // Halfwidth Kana to Fullwidth Map
            const kanaMap = {
                'ｶﾞ': 'ガ', 'ｷﾞ': 'ギ', 'ｸﾞ': 'グ', 'ｹﾞ': 'ゲ', 'ｺﾞ': 'ゴ',
                'ｻﾞ': 'ザ', 'ｼﾞ': 'ジ', 'ｽﾞ': 'ズ', 'ｾﾞ': 'ゼ', 'ｿﾞ': 'ゾ',
                'ﾀﾞ': 'ダ', 'ﾁﾞ': 'ヂ', 'ﾂﾞ': 'ヅ', 'ﾃﾞ': 'デ', 'ﾄﾞ': 'ド',
                'ﾊﾞ': 'バ', 'ﾋﾞ': 'ビ', 'ﾌﾞ': 'ブ', 'ﾍﾞ': 'ベ', 'ﾎﾞ': 'ボ',
                'ﾊﾟ': 'パ', 'ﾋﾟ': 'ピ', 'ﾌﾟ': 'プ', 'ﾍﾟ': 'ペ', 'ﾎﾟ': 'ポ',
                'ｳﾞ': 'ヴ', 'ﾜﾞ': 'ヷ', 'ｦﾞ': 'ヺ',
                'ｱ': 'ア', 'ｲ': 'イ', 'ｳ': 'ウ', 'ｴ': 'エ', 'ｵ': 'オ',
                'ｶ': 'カ', 'ｷ': 'キ', 'ｸ': 'ク', 'ｹ': 'ケ', 'ｺ': 'コ',
                'ｻ': 'サ', 'ｼ': 'シ', 'ｽ': 'ス', 'ｾ': 'セ', 'ｿ': 'ソ',
                'ﾀ': 'タ', 'ﾁ': 'チ', 'ﾂ': 'ツ', 'ﾃ': 'テ', 'ﾄ': 'ト',
                'ﾅ': 'ナ', 'ﾆ': 'ニ', 'ﾇ': 'ヌ', 'ﾈ': 'ネ', 'ﾉ': 'ノ',
                'ﾊ': 'ハ', 'ﾋ': 'ヒ', 'ﾌ': 'フ', 'ﾍ': 'ヘ', 'ﾎ': 'ホ',
                'ﾏ': 'マ', 'ﾐ': 'ミ', 'ﾑ': 'ム', 'ﾒ': 'メ', 'ﾓ': 'モ',
                'ﾔ': 'ヤ', 'ﾕ': 'ユ', 'ﾖ': 'ヨ',
                'ﾗ': 'ラ', 'ﾘ': 'リ', 'ﾙ': 'ル', 'ﾚ': 'レ', 'ﾛ': 'ロ',
                'ﾜ': 'ワ', 'ｦ': 'ヲ', 'ﾝ': 'ン',
                'ｧ': 'ァ', 'ｨ': 'ィ', 'ｩ': 'ゥ', 'ｪ': 'ェ', 'ｫ': 'ォ',
                'ｯ': 'ッ', 'ｬ': 'ャ', 'ｭ': 'ュ', 'ｮ': 'ョ',
                'ｰ': 'ー', '｡': '。', '｢': '「', '｣': '」', '､': '、', '･': '・'
            };

            function calculateStats() {
                const text = editor.value;
                const target = parseInt(targetInput.value, 10) || 800;

                // 1. Array representation for accurate surrogate pair handling
                const chars = Array.from(text);
                const totalChars = chars.length;

                // No spaces & no newlines
                const noSpaceText = text.replace(/[\s\u3000\r\n\t]/g, '');
                const noSpaceCount = Array.from(noSpaceText).length;

                // Letters only (alphanumeric, Kanji, Hiragana, Katakana - excluding symbols/punctuation/spaces)
                const lettersOnlyMatches = text.match(/[\u4E00-\u9FFF\u3400-\u4DBF\uF900-\uFAFF\u3040-\u309F\u30A0-\u30FF\u31F0-\u31FF\uFF65-\uFF9Fa-zA-Z0-9ａ-ｚＡ-Ｚ０-９]/g) || [];
                const lettersOnlyCount = lettersOnlyMatches.length;

                // Words
                const wordCount = countWords(text);

                // Lines
                const allLines = text ? text.split(/\r\n|\r|\n/) : [];
                const totalLines = allLines.length;
                const nonEmptyLines = allLines.filter(l => l.trim().length > 0).length;

                // Paragraphs (continuous blocks)
                const paragraphs = text ? text.split(/\n+/).filter(p => p.trim().length > 0).length : 0;

                // Manuscript calculation (400 chars: 20 chars per line, line break on paragraph)
                let genkoLines = 0;
                if (allLines.length > 0) {
                    for (const line of allLines) {
                        const len = Array.from(line).length;
                        genkoLines += Math.ceil(len / 20) || 1;
                    }
                }
                const sheets400 = Math.floor(genkoLines / 20);
                const remainLines400 = genkoLines % 20;
                const genko200Approx = (noSpaceCount / 200).toFixed(1);

                // Reading & speech time
                const readTimeMin = (noSpaceCount / 500).toFixed(1);
                const speechTimeMin = (noSpaceCount / 300).toFixed(1);

                // Update KPI Elements
                statTotalChars.textContent = totalChars.toLocaleString();
                statNoSpaceChars.textContent = noSpaceCount.toLocaleString();
                statLettersOnly.textContent = lettersOnlyCount.toLocaleString();
                statWordCount.textContent = wordCount.toLocaleString();
                statLines.textContent = totalLines.toLocaleString();
                statLinesSub.textContent = `空行除く: ${nonEmptyLines} 行`;
                statParagraphs.textContent = paragraphs.toLocaleString();
                statGenko400.textContent = `${sheets400}枚 ${remainLines400}行`;
                statGenko200.textContent = `200字詰: 約${genko200Approx}枚 (総${genkoLines}行)`;
                statReadTime.textContent = `約 ${readTimeMin} 分`;
                statSpeechTime.textContent = `音読/発表: 約 ${speechTimeMin} 分`;
                manuscriptBadgeEl.textContent = `400字詰: ${sheets400}枚 ${remainLines400}行 (原稿用紙約 ${(genkoLines / 20).toFixed(1)} 枚分)`;

                // 2. Target Progress & Color
                const progressPct = target > 0 ? (noSpaceCount / target) * 100 : 0;
                const diff = target - noSpaceCount;
                const minTarget = Math.round(target * 0.9);
                const maxTarget = Math.round(target * 1.1);

                progressBar.style.width = `${Math.min(100, progressPct)}%`;
                progressPercentEl.textContent = `達成率: ${progressPct.toFixed(1)}%`;
                targetRangeAdviceEl.textContent = `レポート推奨目安: ${minTarget}〜${maxTarget}字 (±10%)`;

                if (diff > 0) {
                    if (noSpaceCount >= minTarget) {
                        progressDiffEl.textContent = `適正範囲内 (残り ${diff} 字)`;
                        progressDiffEl.style.color = 'var(--accent-green)';
                        progressDiffEl.style.borderColor = 'rgba(52, 211, 153, 0.4)';
                        progressDiffEl.style.backgroundColor = 'rgba(52, 211, 153, 0.12)';
                        progressBar.style.backgroundColor = 'var(--accent-green)';
                    } else {
                        progressDiffEl.textContent = `目標まで残り ${diff} 字`;
                        progressDiffEl.style.color = 'var(--accent-primary)';
                        progressDiffEl.style.borderColor = 'rgba(56, 189, 248, 0.4)';
                        progressDiffEl.style.backgroundColor = 'rgba(56, 189, 248, 0.12)';
                        progressBar.style.backgroundColor = 'var(--accent-primary)';
                    }
                } else if (diff === 0) {
                    progressDiffEl.textContent = `目標達成`;
                    progressDiffEl.style.color = 'var(--accent-green)';
                    progressDiffEl.style.borderColor = 'rgba(52, 211, 153, 0.4)';
                    progressDiffEl.style.backgroundColor = 'rgba(52, 211, 153, 0.15)';
                    progressBar.style.backgroundColor = 'var(--accent-green)';
                } else {
                    const over = Math.abs(diff);
                    if (noSpaceCount <= maxTarget) {
                        progressDiffEl.textContent = `適正範囲内 (+${over}字)`;
                        progressDiffEl.style.color = 'var(--accent-green)';
                        progressDiffEl.style.borderColor = 'rgba(52, 211, 153, 0.4)';
                        progressDiffEl.style.backgroundColor = 'rgba(52, 211, 153, 0.12)';
                        progressBar.style.backgroundColor = 'var(--accent-green)';
                    } else {
                        progressDiffEl.textContent = `目標を +${over} 字 超過`;
                        progressDiffEl.style.color = 'var(--accent-red)';
                        progressDiffEl.style.borderColor = 'rgba(248, 113, 113, 0.4)';
                        progressDiffEl.style.backgroundColor = 'rgba(248, 113, 113, 0.12)';
                        progressBar.style.backgroundColor = 'var(--accent-amber)';
                    }
                }

                // 3. Character Breakdown
                const hiraganaMatches = text.match(/[\u3040-\u309F]/g) || [];
                const katakanaMatches = text.match(/[\u30A0-\u30FF\u31F0-\u31FF\uFF65-\uFF9F]/g) || [];
                const kanjiMatches = text.match(/[\u4E00-\u9FFF\u3400-\u4DBF\uF900-\uFAFF]/g) || [];
                const alphaMatches = text.match(/[a-zA-Zａ-ｚＡ-Ｚ]/g) || [];
                const numberMatches = text.match(/[0-9０-９]/g) || [];
                const symbolMatches = text.match(/[^\s\u3000\r\n\t\u4E00-\u9FFF\u3400-\u4DBF\uF900-\uFAFF\u3040-\u309F\u30A0-\u30FF\u31F0-\u31FF\uFF65-\uFF9Fa-zA-Z0-9ａ-ｚＡ-Ｚ０-９]/g) || [];
                const spaceMatches = text.match(/[ \t\u3000]/g) || [];
                const newlineMatches = text.match(/[\r\n]/g) || [];

                const cHiragana = hiraganaMatches.length;
                const cKatakana = katakanaMatches.length;
                const cKanji = kanjiMatches.length;
                const cAlpha = alphaMatches.length;
                const cNumber = numberMatches.length;
                const cSymbol = symbolMatches.length;
                const cSpace = spaceMatches.length;
                const cNewline = newlineMatches.length;

                const baseTotal = totalChars || 1;
                const pHiragana = ((cHiragana / baseTotal) * 100).toFixed(1);
                const pKatakana = ((cKatakana / baseTotal) * 100).toFixed(1);
                const pKanji = ((cKanji / baseTotal) * 100).toFixed(1);
                const pAlpha = ((cAlpha / baseTotal) * 100).toFixed(1);
                const pNumber = ((cNumber / baseTotal) * 100).toFixed(1);
                const pSymbol = ((cSymbol / baseTotal) * 100).toFixed(1);
                const pSpace = ((cSpace / baseTotal) * 100).toFixed(1);
                const pNewline = ((cNewline / baseTotal) * 100).toFixed(1);

                countHiragana.textContent = cHiragana; pctHiragana.textContent = pHiragana;
                countKatakana.textContent = cKatakana; pctKatakana.textContent = pKatakana;
                countKanji.textContent = cKanji; pctKanji.textContent = pKanji;
                countAlpha.textContent = cAlpha; pctAlpha.textContent = pAlpha;
                countNumber.textContent = cNumber; pctNumber.textContent = pNumber;
                countSymbol.textContent = cSymbol; pctSymbol.textContent = pSymbol;
                countSpace.textContent = cSpace; pctSpace.textContent = pSpace;
                countNewline.textContent = cNewline; pctNewline.textContent = pNewline;

                segHiragana.style.width = `${pHiragana}%`;
                segKatakana.style.width = `${pKatakana}%`;
                segKanji.style.width = `${pKanji}%`;
                segAlpha.style.width = `${pAlpha}%`;
                segNumber.style.width = `${pNumber}%`;
                segSymbol.style.width = `${pSymbol}%`;
                segSpace.style.width = `${parseFloat(pSpace) + parseFloat(pNewline)}%`;

                // 4. Kanji Rate & Readability Advice
                const japaneseChars = cHiragana + cKatakana + cKanji;
                const kanjiRate = japaneseChars > 0 ? ((cKanji / japaneseChars) * 100) : 0;
                kanjiRateBadge.textContent = `漢字率: ${kanjiRate.toFixed(1)}%`;

                if (totalChars === 0) {
                    kanjiRateBadge.style.color = 'var(--text-muted)';
                    kanjiRateBadge.style.borderColor = 'var(--border-color)';
                    kanjiRateBadge.style.backgroundColor = 'transparent';
                    readabilityBox.innerHTML = `<strong>文章可読性診断:</strong> 本文を入力すると漢字率や文章バランスのアドバイスが表示されます。`;
                } else if (kanjiRate >= 25 && kanjiRate <= 35) {
                    kanjiRateBadge.style.color = 'var(--accent-green)';
                    kanjiRateBadge.style.borderColor = 'rgba(52, 211, 153, 0.4)';
                    kanjiRateBadge.style.backgroundColor = 'rgba(52, 211, 153, 0.12)';
                    readabilityBox.innerHTML = `<strong>適正 (漢字率 ${kanjiRate.toFixed(1)}%):</strong> レポート・文章として最も読みやすく、バランスの取れた漢字率です。`;
                } else if (kanjiRate > 35 && kanjiRate <= 45) {
                    kanjiRateBadge.style.color = 'var(--accent-amber)';
                    kanjiRateBadge.style.borderColor = 'rgba(251, 191, 36, 0.4)';
                    kanjiRateBadge.style.backgroundColor = 'rgba(251, 191, 36, 0.12)';
                    readabilityBox.innerHTML = `<strong>やや硬め (漢字率 ${kanjiRate.toFixed(1)}%):</strong> 学術論文や論理的なレポートに適したトーンです。`;
                } else if (kanjiRate > 45) {
                    kanjiRateBadge.style.color = 'var(--accent-red)';
                    kanjiRateBadge.style.borderColor = 'rgba(248, 113, 113, 0.4)';
                    kanjiRateBadge.style.backgroundColor = 'rgba(248, 113, 113, 0.12)';
                    readabilityBox.innerHTML = `<strong>漢字多め (漢字率 ${kanjiRate.toFixed(1)}%):</strong> 文章が硬く難解な印象を与える可能性があります。一部接続詞や補助動詞をひらがなにすると読みやすくなります。`;
                } else {
                    kanjiRateBadge.style.color = 'var(--accent-primary)';
                    kanjiRateBadge.style.borderColor = 'rgba(56, 189, 248, 0.4)';
                    kanjiRateBadge.style.backgroundColor = 'rgba(56, 189, 248, 0.12)';
                    readabilityBox.innerHTML = `<strong>ひらがな多め (漢字率 ${kanjiRate.toFixed(1)}%):</strong> 平易で読みやすい反面、フォーマルな文章としては少し口語的に見える場合があります。`;
                }

                // 5. Trigger debounced auto-save
                clearTimeout(autoSaveTimer);
                autoSaveTimer = setTimeout(() => {
                    saveToLocalStorage();
                }, 800);
            }

            function saveToLocalStorage() {
                try {
                    localStorage.setItem('workspace_tc_text', editor.value);
                    localStorage.setItem('workspace_tc_target', targetInput.value);
                    const now = new Date();
                    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
                    lastSavedEl.textContent = `自動保存: ${timeStr}`;
                } catch (e) {}
            }

            function loadFromLocalStorage() {
                try {
                    const savedText = localStorage.getItem('workspace_tc_text');
                    const savedTarget = localStorage.getItem('workspace_tc_target');
                    if (savedText !== null) editor.value = savedText;
                    if (savedTarget !== null) {
                        targetInput.value = savedTarget;
                        highlightTargetPill(savedTarget);
                    }
                } catch (e) {}
            }

            function highlightTargetPill(num) {
                targetPills.forEach(pill => {
                    if (pill.dataset.targetNum === String(num)) {
                        pill.classList.add('active');
                    } else {
                        pill.classList.remove('active');
                    }
                });
            }

            // Snapshots Management
            function getSnapshots() {
                try {
                    return JSON.parse(localStorage.getItem('workspace_tc_snapshots') || '[]');
                } catch (e) {
                    return [];
                }
            }

            function saveSnapshots(list) {
                try {
                    localStorage.setItem('workspace_tc_snapshots', JSON.stringify(list));
                } catch (e) {}
            }

            function renderSnapshots() {
                const list = getSnapshots();
                if (!snapshotListEl) return;
                if (list.length === 0) {
                    snapshotListEl.innerHTML = `<div style="color: var(--text-muted); font-size: 11px; text-align: center; padding: 6px;">保存されたスナップショットはありません</div>`;
                    return;
                }

                snapshotListEl.innerHTML = '';
                list.forEach((snap, idx) => {
                    const item = document.createElement('div');
                    item.style.display = 'flex';
                    item.style.alignItems = 'center';
                    item.style.justifyContent = 'space-between';
                    item.style.padding = '4px 8px';
                    item.style.background = 'var(--bg-panel)';
                    item.style.border = '1px solid var(--border-color)';
                    item.style.gap = '6px';

                    const info = document.createElement('div');
                    info.style.overflow = 'hidden';
                    info.style.textOverflow = 'ellipsis';
                    info.style.whiteSpace = 'nowrap';
                    info.style.flex = '1';
                    info.innerHTML = `<strong>${snap.date}</strong> <span style="color: var(--accent-primary); font-weight:700;">(${snap.chars}字)</span> <span style="color: var(--text-muted);">${escapeHtml(snap.preview)}</span>`;

                    const btnGroup = document.createElement('div');
                    btnGroup.style.display = 'flex';
                    btnGroup.style.gap = '4px';

                    const restoreBtn = document.createElement('button');
                    restoreBtn.className = 'btn btn-primary';
                    restoreBtn.style.padding = '1px 6px';
                    restoreBtn.style.fontSize = '10px';
                    restoreBtn.textContent = '復元';
                    restoreBtn.addEventListener('click', () => {
                        pushUndoState();
                        editor.value = snap.text;
                        calculateStats();
                        showToast('下書きスナップショットを復元しました');
                    });

                    const delBtn = document.createElement('button');
                    delBtn.className = 'btn btn-danger';
                    delBtn.style.padding = '1px 5px';
                    delBtn.style.fontSize = '10px';
                    delBtn.textContent = '×';
                    delBtn.addEventListener('click', () => {
                        const cur = getSnapshots();
                        cur.splice(idx, 1);
                        saveSnapshots(cur);
                        renderSnapshots();
                    });

                    btnGroup.appendChild(restoreBtn);
                    btnGroup.appendChild(delBtn);
                    item.appendChild(info);
                    item.appendChild(btnGroup);
                    snapshotListEl.appendChild(item);
                });
            }

            // EVENT LISTENERS
            let charCounterAnimationFrame = null;
            editor.addEventListener('input', () => {
                if (charCounterAnimationFrame) cancelAnimationFrame(charCounterAnimationFrame);
                charCounterAnimationFrame = requestAnimationFrame(() => {
                    calculateStats();
                    updateCursorInfo();
                });
            });

            editor.addEventListener('keyup', updateCursorInfo);
            editor.addEventListener('click', updateCursorInfo);
            editor.addEventListener('select', updateCursorInfo);

            targetInput.addEventListener('input', () => {
                highlightTargetPill(targetInput.value);
                calculateStats();
            });

            targetPills.forEach(pill => {
                pill.addEventListener('click', () => {
                    const num = pill.dataset.targetNum;
                    targetInput.value = num;
                    highlightTargetPill(num);
                    calculateStats();
                });
            });

            // Quick Format Tools
            toolIndent.addEventListener('click', () => {
                pushUndoState();
                const lines = editor.value.split(/\r?\n/);
                const indented = lines.map(line => {
                    if (line.trim().length === 0) return line;
                    const cleaned = line.replace(/^[ 　\t]+/, '');
                    return '　' + cleaned;
                });
                editor.value = indented.join('\n');
                calculateStats();
                showToast('段落先頭に全角字下げを適用しました');
            });

            toolCleanLines.addEventListener('click', () => {
                pushUndoState();
                let val = editor.value;
                // Trim trailing space from each line
                val = val.split(/\r?\n/).map(l => l.replace(/[ \t　]+$/, '')).join('\n');
                // Replace 3+ consecutive newlines with 2
                val = val.replace(/\n{3,}/g, '\n\n');
                editor.value = val;
                calculateStats();
                showToast('余分な空行・行末空白を整理しました');
            });

            if (toolPunctToggle) toolPunctToggle.addEventListener('click', () => {
                pushUndoState();
                let val = editor.value;
                const hasAcademic = val.includes('，') || val.includes('．');
                if (hasAcademic) {
                    // Convert to standard 「、」「。」
                    val = val.replace(/，/g, '、').replace(/．/g, '。');
                    showToast('句読点を標準「、」「。」に変換しました');
                } else {
                    // Convert to academic 「，」「．」
                    val = val.replace(/、/g, '，').replace(/。/g, '．');
                    showToast('句読点を学術・論文形式「，」「．」に変換しました');
                }
                editor.value = val;
                calculateStats();
            });

            if (toolZenHanAlpha) toolZenHanAlpha.addEventListener('click', () => {
                pushUndoState();
                let val = editor.value;
                // Convert fullwidth alphanumeric to halfwidth
                val = val.replace(/[Ａ-Ｚａ-ｚ０-９]/g, s => String.fromCharCode(s.charCodeAt(0) - 0xFEE0));
                editor.value = val;
                calculateStats();
                showToast('全角英数字を半角に変換しました');
            });

            if (toolHanZenKana) toolHanZenKana.addEventListener('click', () => {
                pushUndoState();
                let val = editor.value;
                for (const [han, zen] of Object.entries(kanaMap)) {
                    val = val.split(han).join(zen);
                }
                editor.value = val;
                calculateStats();
                showToast('半角カタカナを全角に変換しました');
            });

            if (toolCaseToggle) toolCaseToggle.addEventListener('click', () => {
                pushUndoState();
                let val = editor.value;
                const hasLower = /[a-z]/.test(val);
                if (hasLower) {
                    val = val.toUpperCase();
                    showToast('英字を大文字に統一しました');
                } else {
                    val = val.toLowerCase();
                    showToast('英字を小文字に統一しました');
                }
                editor.value = val;
                calculateStats();
            });

            if (toolUndo) toolUndo.addEventListener('click', () => {
                if (undoStack.length > 0) {
                    editor.value = undoStack.pop();
                    calculateStats();
                    if (undoStack.length === 0) toolUndo.disabled = true;
                    showToast('直前の操作を取り消しました');
                }
            });

            if (copyBtn) copyBtn.addEventListener('click', () => {
                if (!editor.value) {
                    showToast('コピーする本文がありません');
                    return;
                }
                navigator.clipboard.writeText(editor.value).then(() => {
                    showToast('本文をクリップボードにコピーしました！');
                }).catch(() => {
                    editor.select();
                    document.execCommand('copy');
                    showToast('コピーしました');
                });
            });

            if (saveTxtBtn) saveTxtBtn.addEventListener('click', () => {
                const text = editor.value;
                if (!text) {
                    showToast('保存するテキストがありません');
                    return;
                }
                const now = new Date();
                const dateStr = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}_${String(now.getHours()).padStart(2,'0')}${String(now.getMinutes()).padStart(2,'0')}`;
                const filename = `レポート_${statNoSpaceChars.textContent}字_${dateStr}.txt`;

                const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                a.click();
                setTimeout(() => URL.revokeObjectURL(url), 1000);
                showToast(`${filename} をダウンロードしました`);
            });

            if (clearBtn) clearBtn.addEventListener('click', () => {
                if (!editor.value) return;
                if (confirm('入力中の本文をすべて消去しますか？\n（※「元に戻す」で復元可能です）')) {
                    pushUndoState();
                    editor.value = '';
                    calculateStats();
                    showToast('エディタをクリアしました');
                }
            });

            if (fileInput) fileInput.addEventListener('change', (e) => {
                const file = e.target.files && e.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (evt) => {
                    pushUndoState();
                    editor.value = evt.target.result || '';
                    calculateStats();
                    showToast(`ファイル「${file.name}」を読み込みました`);
                    fileInput.value = '';
                };
                reader.readAsText(file, 'utf-8');
            });

            // Drag and drop onto editor
            if (editor) {
                editor.addEventListener('dragover', (e) => {
                    e.preventDefault();
                    editor.style.borderColor = 'var(--accent-primary)';
                });
                editor.addEventListener('dragleave', () => {
                    editor.style.borderColor = '';
                });
                editor.addEventListener('drop', (e) => {
                    e.preventDefault();
                    editor.style.borderColor = '';
                    const files = e.dataTransfer && e.dataTransfer.files;
                    if (files && files.length > 0) {
                        const file = files[0];
                        const reader = new FileReader();
                        reader.onload = (evt) => {
                            pushUndoState();
                            editor.value = evt.target.result || '';
                            calculateStats();
                            showToast(`ファイル「${file.name}」を読み込みました`);
                        };
                        reader.readAsText(file, 'utf-8');
                    }
                });
            }

            // Font size toggles
            if (fontSizeSm) fontSizeSm.addEventListener('click', () => {
                editor.style.fontSize = '12px';
                fontSizeSm.classList.add('btn-primary');
                fontSizeMd.classList.remove('btn-primary');
                fontSizeLg.classList.remove('btn-primary');
            });
            if (fontSizeMd) fontSizeMd.addEventListener('click', () => {
                editor.style.fontSize = '14px';
                fontSizeMd.classList.add('btn-primary');
                fontSizeSm.classList.remove('btn-primary');
                fontSizeLg.classList.remove('btn-primary');
            });
            if (fontSizeLg) fontSizeLg.addEventListener('click', () => {
                editor.style.fontSize = '17px';
                fontSizeLg.classList.add('btn-primary');
                fontSizeSm.classList.remove('btn-primary');
                fontSizeMd.classList.remove('btn-primary');
            });

            // Snapshot Save
            if (saveSnapshotBtn) saveSnapshotBtn.addEventListener('click', () => {
                const text = editor.value;
                if (!text.trim()) {
                    showToast('保存する下書き本文がありません');
                    return;
                }
                const now = new Date();
                const dateStr = `${String(now.getMonth()+1).padStart(2,'0')}/${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
                const chars = Array.from(text.replace(/[\s\u3000\r\n\t]/g, '')).length;
                const preview = text.trim().substring(0, 30).replace(/\n/g, ' ') + '...';

                const list = getSnapshots();
                list.unshift({
                    date: dateStr,
                    chars: chars,
                    preview: preview,
                    text: text
                });
                if (list.length > 5) list.pop(); // keep last 5
                saveSnapshots(list);
                renderSnapshots();
                showToast('スナップショットを履歴に保存しました');
            });

            // Initial load & stats calculation
            loadFromLocalStorage();
            calculateStats();
            renderSnapshots();
        })();

        /* ==========================================================================
           MARKDOWN EDITOR & LIVE PREVIEW ENGINE
           ========================================================================== */
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

| システム状態 | 処理パフォーマンス | セキュリティ |
| :---: | :---: | :---: |
| **正常稼働中** | **0.02 秒** 応答 | **完全ローカル** 実行 |`,

                layout_accordion: `# 折りたたみ (アコーディオン) レイアウト

<details>
<summary><b>セクション1: 詳細設定を開く (クリックで展開)</b></summary>

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
<summary><b>セクション2: よくある質問 (FAQ)</b></summary>

> **Q: データの保存先はどこですか？**  
> A: すべてブラウザローカル（LocalStorage）に保存されます。外部送信はありません。
</details>`,

                layout_dashboard: `# プロジェクト概要ダッシュボード

![Build Status](https://img.shields.io/badge/build-passing-brightgreen) ![Version](https://img.shields.io/badge/version-v1.2.0-blue) ![License](https://img.shields.io/badge/license-MIT-green)

---

### クイックナビゲーション
[ [ドキュメント](#) ] &nbsp;&nbsp; [ [ライブデモ](#) ] &nbsp;&nbsp; [ [不具合報告](#) ]

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
[ [ドキュメントを開く](https://example.com) ] &nbsp;&nbsp; [ [デモを実行](https://example.com) ]`,

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

                // 7. Sanitize potentially harmful scripts / inline event handlers
                html = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                           .replace(/\bon\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, (match) => {
                               if (match.includes('navigator.clipboard.writeText') || match.includes('classList.toggle')) {
                                   return match;
                               }
                               return '';
                           })
                           .replace(/href\s*=\s*["']\s*javascript:[^"']*["']/gi, 'href="#"');

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
                    discordStatusBadge.textContent = `${postCount}枠に分割が必要`;
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
                        saveStatus.textContent = '自動保存: 完了';
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
            const ufToast = showToast;

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
            const resetBtn = document.getElementById('rpResetBtn');
            const summaryBox = document.getElementById('rpSummaryBox');
            const totalPathsEl = document.getElementById('rpTotalPaths');
            const replacedPathsEl = document.getElementById('rpReplacedPaths');
            const fileNameTag = document.getElementById('rpFileNameTag');

            if (!inputText || !outputText) return;

            let loadedFileName = 'project.rpp';

            function processRpp() {
                const text = inputText.value;
                if (resetBtn) {
                    resetBtn.classList.toggle('hidden', !text.trim());
                }

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

            if (resetBtn) {
                resetBtn.addEventListener('click', () => {
                    inputText.value = '';
                    outputText.value = '';
                    if (oldPathInput) oldPathInput.value = '';
                    if (newPathInput) newPathInput.value = '';
                    if (summaryBox) summaryBox.classList.add('hidden');
                    resetBtn.classList.add('hidden');
                    loadedFileName = 'project.rpp';
                    if (fileInput) fileInput.value = '';
                    showToast('入力をクリアしました');
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

            function runSmartEncode(showToastNotification = true) {
                const text = inputEl.value.trim();
                if (!text) { outputEl.value = ''; if (paramsPanel) paramsPanel.classList.add('hidden'); return; }

                try {
                    const encoded = encodeURI(text);
                    outputEl.value = encoded;
                    inspectQueryParams(text);
                    if (showToastNotification) showToast('スマートURLエンコードを完了しました');
                } catch (e) {
                    outputEl.value = encodeURIComponent(text);
                    if (showToastNotification) showToast('エンコードを完了しました');
                }
            }

            if (smartBtn) {
                smartBtn.addEventListener('click', () => runSmartEncode(true));
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
                        const decoded = decodeURIComponent(text.replace(/\+/g, ' '));
                        outputEl.value = decoded;
                        inspectQueryParams(decoded);
                        showToast('URLデコードを完了しました');
                    } catch(e) {
                        const fallbackDecoded = safeDecodeURI(text);
                        outputEl.value = fallbackDecoded;
                        inspectQueryParams(fallbackDecoded);
                        showToast('デコードを完了しました');
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
                    runSmartEncode(true);
                });
            }

            let codecDebounce = null;
            inputEl.addEventListener('input', () => {
                clearTimeout(codecDebounce);
                codecDebounce = setTimeout(() => {
                    runSmartEncode(false);
                }, 300);
            });

            // 初回ロード時はトースト通知を出さずにサイレント実行
            runSmartEncode(false);
        }

        // --------------------------------------------------------------------------
        // YOUTUBE THUMBNAIL EXTRACTOR LOGIC
        // --------------------------------------------------------------------------
        function initYtThumbTool() {
            const inputEl = document.getElementById('ytThumbInput');
            const extractBtn = document.getElementById('ytThumbExtractBtn');
            const sampleBtn = document.getElementById('ytThumbSampleBtn');
            const clearBtn = document.getElementById('ytThumbClearBtn');
            const countBadge = document.getElementById('ytThumbCountBadge');
            const zipAllBtn = document.getElementById('ytThumbZipAllBtn');
            const resultsContainer = document.getElementById('ytThumbResultsContainer');

            if (!inputEl || !resultsContainer) return;

            let currentVideosData = [];

            // Extract Video IDs from text
            function extractYouTubeIds(text) {
                if (!text) return [];
                const lines = text.split(/[\r\n\s,]+/);
                const ids = [];
                const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts|live)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
                
                lines.forEach(line => {
                    const str = line.trim();
                    if (!str) return;
                    if (/^[a-zA-Z0-9_-]{11}$/.test(str)) {
                        if (!ids.includes(str)) ids.push(str);
                    } else {
                        const match = str.match(regExp);
                        if (match && match[1] && !ids.includes(match[1])) {
                            ids.push(match[1]);
                        }
                    }
                });
                return ids;
            }

            // Fetch oEmbed title
            async function fetchVideoTitle(videoId) {
                try {
                    const res = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
                    if (res.ok) {
                        const data = await res.json();
                        return { title: data.title, author: data.author_name };
                    }
                } catch(e) {}
                return { title: `YouTube Video (${videoId})`, author: '' };
            }

            // Check image availability (e.g. maxresdefault dummy 120x90 check)
            function checkImageDimensions(url) {
                return new Promise((resolve) => {
                    const img = new Image();
                    img.onload = () => {
                        resolve({ width: img.naturalWidth || img.width, height: img.naturalHeight || img.height, valid: (img.naturalWidth || img.width) > 120 });
                    };
                    img.onerror = () => {
                        resolve({ width: 0, height: 0, valid: false });
                    };
                    img.src = url;
                });
            }

            // Main extraction process
            async function runExtraction(userTriggered = false) {
                const rawText = inputEl.value.trim();
                const videoIds = extractYouTubeIds(rawText);

                resultsContainer.innerHTML = '';
                currentVideosData = [];

                if (videoIds.length === 0) {
                    if (countBadge) countBadge.textContent = '';
                    if (zipAllBtn) zipAllBtn.disabled = true;
                    if (userTriggered) showToast('有効なYouTube URLまたは動画IDが見つかりませんでした');
                    resultsContainer.innerHTML = `
                        <div style="text-align: center; padding: 32px 16px; color: var(--text-muted); background-color: var(--bg-panel-secondary); border-radius: 4px; border: 1px dashed var(--border-color);">
                            <div style="font-size: 13px; font-weight: 600; color: var(--text-heading);">URLを入力してサムネイルを取得</div>
                            <div style="font-size: 11.5px; margin-top: 4px;">YouTubeの動画URL、Shorts、または動画IDを上に貼り付けてください</div>
                        </div>
                    `;
                    return;
                }

                if (countBadge) countBadge.textContent = `${videoIds.length}件の動画を解析中...`;

                for (let i = 0; i < videoIds.length; i++) {
                    const id = videoIds[i];
                    
                    // URLs
                    const maxresJpg = `https://img.youtube.com/vi/${id}/maxresdefault.jpg`;
                    const sdJpg = `https://img.youtube.com/vi/${id}/sddefault.jpg`;
                    const hqJpg = `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
                    const mqJpg = `https://img.youtube.com/vi/${id}/mqdefault.jpg`;

                    const maxresWebp = `https://i.ytimg.com/vi_webp/${id}/maxresdefault.webp`;
                    const hqWebp = `https://i.ytimg.com/vi_webp/${id}/hqdefault.webp`;

                    // Title & maxres check in parallel
                    const [meta, maxresCheck, sdCheck, hqCheck] = await Promise.all([
                        fetchVideoTitle(id),
                        checkImageDimensions(maxresJpg),
                        checkImageDimensions(sdJpg),
                        checkImageDimensions(hqJpg)
                    ]);

                    const bestJpg = maxresCheck.valid ? maxresJpg : (sdCheck.valid ? sdJpg : hqJpg);
                    const bestWebp = maxresCheck.valid ? maxresWebp : hqWebp;
                    const bestResolutionLabel = maxresCheck.valid ? `最高画質 (1920x1080)` : (sdCheck.valid ? `高画質 (640x480)` : `標準 (480x360)`);

                    const videoItem = {
                        id,
                        title: meta.title,
                        author: meta.author,
                        hasMaxRes: maxresCheck.valid,
                        bestJpg,
                        bestWebp,
                        maxresCheck,
                        sdCheck,
                        hqCheck,
                        maxresJpg,
                        sdJpg,
                        hqJpg,
                        mqJpg,
                        maxresWebp,
                        hqWebp
                    };

                    currentVideosData.push(videoItem);

                    renderVideoCard(videoItem);
                }

                if (countBadge) countBadge.textContent = `${videoIds.length}件の動画からサムネイルを取得しました`;
                if (zipAllBtn) zipAllBtn.disabled = false;
                if (userTriggered) showToast(`${videoIds.length}件のサムネイル画像を取得しました`);
            }

            // Render single video card UI
            function renderVideoCard(item) {
                const card = document.createElement('div');
                card.className = 'panel';
                card.style.backgroundColor = 'var(--bg-panel)';
                card.style.border = '1px solid var(--border-color)';
                card.style.borderRadius = '6px';
                card.style.padding = '14px';

                const defaultJpg = item.bestJpg;

                card.innerHTML = `
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; margin-bottom: 12px; flex-wrap: wrap;">
                        <div style="flex: 1; min-width: 240px;">
                            <div style="font-weight: 700; font-size: 14px; color: var(--text-heading); line-height: 1.4; margin-bottom: 4px;">
                                ${escapeHtml(item.title)}
                            </div>
                            <div style="font-size: 12px; color: var(--text-muted); display: flex; align-items: center; gap: 10px;">
                                <span>${item.author ? '投稿者: ' + escapeHtml(item.author) : ''}</span>
                                <span>ID: <code style="color: var(--accent-primary); font-weight: 600;">${item.id}</code></span>
                            </div>
                        </div>
                        <a href="https://www.youtube.com/watch?v=${item.id}" target="_blank" class="btn" style="padding: 4px 10px; font-size: 11.5px; display: inline-flex; align-items: center; gap: 4px;">
                            YouTubeで動画を開く ↗
                        </a>
                    </div>

                    <div style="display: grid; grid-template-columns: minmax(280px, 1fr) 280px; gap: 16px;" class="yt-card-grid">
                        <!-- Left: Main Preview -->
                        <div>
                            <div style="position: relative; background-color: #000; border-radius: 4px; overflow: hidden; border: 1px solid var(--border-color); text-align: center;">
                                <img id="previewImg_${item.id}" src="${defaultJpg}" style="max-width: 100%; max-height: 380px; object-fit: contain; vertical-align: middle;" alt="YouTube Thumbnail">
                                <span id="resBadge_${item.id}" style="position: absolute; bottom: 8px; right: 8px; background: rgba(0,0,0,0.8); color: #fff; font-size: 11px; padding: 2px 8px; border-radius: 3px; font-weight: 600;">
                                    ${item.hasMaxRes ? '1080p (最高画質)' : '480p (標準)'}
                                </span>
                            </div>
                            <div style="display: flex; gap: 6px; margin-top: 10px; flex-wrap: wrap;">
                                <button class="btn btn-primary btn-dl-jpg" style="padding: 5px 8px; font-size: 11.5px; flex: 1; min-width: 65px;">
                                    JPG保存
                                </button>
                                <button class="btn btn-dl-png" style="padding: 5px 8px; font-size: 11.5px; background-color: var(--accent-green); color: #fff; flex: 1; min-width: 65px;">
                                    PNG保存
                                </button>
                                <button class="btn btn-dl-webp" style="padding: 5px 8px; font-size: 11.5px; background-color: var(--accent-purple); color: #fff; flex: 1; min-width: 65px;">
                                    WebP保存
                                </button>
                                <button class="btn btn-copy-img" style="padding: 5px 8px; font-size: 11.5px; min-width: 50px;" title="画像をクリップボードにコピー">
                                    コピー
                                </button>
                            </div>
                        </div>

                        <!-- Right: Quality Selector Buttons -->
                        <div style="display: flex; flex-direction: column; gap: 8px; background-color: var(--bg-panel-secondary); padding: 10px; border-radius: 4px; border: 1px solid var(--border-color);">
                            <div style="font-weight: 700; font-size: 11.5px; color: var(--text-heading); margin-bottom: 2px;">解像度・画質選択</div>

                            <button class="btn q-btn ${item.hasMaxRes ? 'active' : ''}" data-url="${item.maxresJpg}" data-webp="${item.maxresWebp}" data-label="最高画質 (1080p)" data-valid="${item.hasMaxRes}" style="text-align: left; padding: 8px; font-size: 11.5px; display: flex; justify-content: space-between; align-items: center;">
                                <div>
                                    <div style="font-weight: 600;">最高画質 (MaxRes / 1080p)</div>
                                    <div style="font-size: 10px; color: var(--text-muted);">1920 × 1080 px</div>
                                </div>
                                <span class="badge" style="font-size: 10px; ${item.hasMaxRes ? 'background-color: rgba(34,197,94,0.15); color: #22c55e;' : 'opacity: 0.5;'}">
                                    ${item.hasMaxRes ? '利用可能' : '非対応'}
                                </span>
                            </button>

                            <button class="btn q-btn ${!item.hasMaxRes && item.sdCheck.valid ? 'active' : ''}" data-url="${item.sdJpg}" data-webp="${item.sdJpg}" data-label="高画質 (720p/SD)" data-valid="${item.sdCheck.valid}" style="text-align: left; padding: 8px; font-size: 11.5px; display: flex; justify-content: space-between; align-items: center;">
                                <div>
                                    <div style="font-weight: 600;">高画質 (SD / 720p)</div>
                                    <div style="font-size: 10px; color: var(--text-muted);">640 × 480 px</div>
                                </div>
                                <span class="badge" style="font-size: 10px;">${item.sdCheck.valid ? '640px' : '標準'}</span>
                            </button>

                            <button class="btn q-btn ${!item.hasMaxRes && !item.sdCheck.valid ? 'active' : ''}" data-url="${item.hqJpg}" data-webp="${item.hqWebp}" data-label="中画質 (HQ)" data-valid="true" style="text-align: left; padding: 8px; font-size: 11.5px; display: flex; justify-content: space-between; align-items: center;">
                                <div>
                                    <div style="font-weight: 600;">中画質 (HQ)</div>
                                    <div style="font-size: 10px; color: var(--text-muted);">480 × 360 px</div>
                                </div>
                                <span class="badge" style="font-size: 10px;">標準</span>
                            </button>

                            <button class="btn q-btn" data-url="${item.mqJpg}" data-webp="${item.mqJpg}" data-label="標準画質 (MQ)" data-valid="true" style="text-align: left; padding: 8px; font-size: 11.5px; display: flex; justify-content: space-between; align-items: center;">
                                <div>
                                    <div style="font-weight: 600;">小サイズ (MQ)</div>
                                    <div style="font-size: 10px; color: var(--text-muted);">320 × 180 px</div>
                                </div>
                                <span class="badge" style="font-size: 10px;">軽量</span>
                            </button>
                        </div>
                    </div>
                `;

                resultsContainer.appendChild(card);

                // Event Listeners for this card
                let selectedJpgUrl = defaultJpg;
                let selectedWebpUrl = item.bestWebp;
                let currentLabel = item.hasMaxRes ? '1080p' : 'HQ';

                const mainImg = card.querySelector(`#previewImg_${item.id}`);
                const resBadge = card.querySelector(`#resBadge_${item.id}`);

                // Quality switch buttons
                const qBtns = card.querySelectorAll('.q-btn');
                qBtns.forEach(btn => {
                    btn.addEventListener('click', () => {
                        const url = btn.getAttribute('data-url');
                        const webp = btn.getAttribute('data-webp');
                        const label = btn.getAttribute('data-label');
                        
                        selectedJpgUrl = url;
                        selectedWebpUrl = webp;
                        currentLabel = label;

                        if (mainImg) mainImg.src = url;
                        if (resBadge) resBadge.textContent = label;

                        qBtns.forEach(b => b.classList.remove('active'));
                        btn.classList.add('active');
                    });
                });

                // Download JPG
                card.querySelector('.btn-dl-jpg').addEventListener('click', () => {
                    downloadCanvasImage(selectedJpgUrl, `yt_thumb_${item.id}.jpg`, 'image/jpeg');
                });

                // Download PNG
                card.querySelector('.btn-dl-png').addEventListener('click', () => {
                    downloadCanvasImage(selectedJpgUrl, `yt_thumb_${item.id}.png`, 'image/png');
                });

                // Download WebP
                card.querySelector('.btn-dl-webp').addEventListener('click', () => {
                    downloadCanvasImage(selectedWebpUrl || selectedJpgUrl, `yt_thumb_${item.id}.webp`, 'image/webp');
                });

                // Copy Image
                card.querySelector('.btn-copy-img').addEventListener('click', () => {
                    copyImageToClipboard(selectedJpgUrl);
                });
            }

            // Convert Blob to specific Image MIME Type (e.g. image/png)
            async function convertBlobToFormat(blob, targetMimeType = 'image/png') {
                if (!blob) return null;
                if (blob.type === targetMimeType) return blob;
                return new Promise((resolve) => {
                    const img = new Image();
                    const blobUrl = URL.createObjectURL(blob);
                    img.onload = () => {
                        try {
                            const canvas = document.createElement('canvas');
                            canvas.width = img.naturalWidth || img.width;
                            canvas.height = img.naturalHeight || img.height;
                            const ctx = canvas.getContext('2d');
                            ctx.drawImage(img, 0, 0);
                            canvas.toBlob((converted) => {
                                URL.revokeObjectURL(blobUrl);
                                resolve(converted || blob);
                            }, targetMimeType, 0.95);
                        } catch (e) {
                            URL.revokeObjectURL(blobUrl);
                            resolve(blob);
                        }
                    };
                    img.onerror = () => {
                        URL.revokeObjectURL(blobUrl);
                        resolve(blob);
                    };
                    img.src = blobUrl;
                });
            }

            // Canvas / Proxy download helper with format conversion (JPG, PNG, WebP)
            async function downloadCanvasImage(url, filename, format = 'image/jpeg') {
                try {
                    let blob = await fetchImageAsBlob(url);
                    if (blob) {
                        if (format !== blob.type) {
                            blob = await convertBlobToFormat(blob, format);
                        }
                        const blobUrl = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = blobUrl;
                        a.download = filename;
                        a.click();
                        setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);
                        showToast(`${filename} を保存しました`);
                        return;
                    }
                } catch(e) {}

                // Direct fallback
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                a.target = '_blank';
                a.click();
            }

            // Copy Image to Clipboard as PNG
            async function copyImageToClipboard(url) {
                try {
                    const blob = await fetchImageAsBlob(url);
                    if (blob && navigator.clipboard && window.ClipboardItem) {
                        const pngBlob = await convertBlobToFormat(blob, 'image/png');
                        if (pngBlob) {
                            await navigator.clipboard.write([new ClipboardItem({ 'image/png': pngBlob })]);
                            showToast('サムネイル画像をクリップボードにコピーしました');
                            return;
                        }
                    }
                } catch(e) {}
                showToast('クリップボードへの画像コピーに失敗しました');
            }

            // ZIP All Best Thumbnails (supports PNG, JPG, WebP)
            if (zipAllBtn) {
                zipAllBtn.addEventListener('click', async () => {
                    if (!currentVideosData.length) return;
                    if (!window.JSZip) {
                        showToast('ZIPライブラリが読み込まれていません');
                        return;
                    }

                    const zipFormatSelect = document.getElementById('ytThumbZipFormat');
                    const targetExt = zipFormatSelect ? zipFormatSelect.value : 'png';
                    const targetMime = targetExt === 'png' ? 'image/png' : (targetExt === 'webp' ? 'image/webp' : 'image/jpeg');

                    showToast(`サムネイル一括ZIP (${targetExt.toUpperCase()}) を生成中...`);
                    const zip = new JSZip();

                    for (let i = 0; i < currentVideosData.length; i++) {
                        const item = currentVideosData[i];
                        const imgUrl = targetExt === 'webp' ? (item.bestWebp || item.bestJpg) : item.bestJpg;
                        try {
                            let blob = await fetchImageAsBlob(imgUrl);
                            if (blob) {
                                if (blob.type !== targetMime) {
                                    blob = await convertBlobToFormat(blob, targetMime);
                                }
                                const cleanTitle = (item.title || item.id).replace(/[\\/:*?"<>|]/g, '_').substring(0, 40);
                                zip.file(`${i + 1}_${cleanTitle}_${item.id}.${targetExt}`, blob);
                            }
                        } catch(e) {}
                    }

                    const zipContent = await zip.generateAsync({ type: 'blob' });
                    const a = document.createElement('a');
                    a.href = URL.createObjectURL(zipContent);
                    a.download = `youtube_thumbnails_${targetExt}_${Date.now()}.zip`;
                    a.click();
                    showToast(`ZIPアーカイブ (${targetExt.toUpperCase()}) をダウンロードしました`);
                });
            }

            async function fetchImageAsBlob(url) {
                // 1. Try server proxy (bypasses YouTube CDN CORS restrictions)
                try {
                    const proxyRes = await fetch('/api/proxy-image?url=' + encodeURIComponent(url));
                    if (proxyRes.ok) {
                        return await proxyRes.blob();
                    }
                } catch(e) {}

                // 2. Try direct fetch
                try {
                    const directRes = await fetch(url, { mode: 'cors' });
                    if (directRes.ok) {
                        return await directRes.blob();
                    }
                } catch(e) {}

                // 3. Fallback to image element + canvas
                return new Promise((resolve) => {
                    const img = new Image();
                    img.crossOrigin = 'anonymous';
                    img.onload = () => {
                        try {
                            const canvas = document.createElement('canvas');
                            canvas.width = img.naturalWidth || img.width;
                            canvas.height = img.naturalHeight || img.height;
                            const ctx = canvas.getContext('2d');
                            ctx.drawImage(img, 0, 0);
                            canvas.toBlob(blob => resolve(blob), 'image/jpeg', 0.95);
                        } catch(err) {
                            resolve(null);
                        }
                    };
                    img.onerror = () => resolve(null);
                    img.src = url;
                });
            }

            // Extract Button Click
            if (extractBtn) {
                extractBtn.addEventListener('click', () => runExtraction(true));
            }

            // Sample Button Click
            if (sampleBtn) {
                sampleBtn.addEventListener('click', () => {
                    inputEl.value = [
                        'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                        'https://youtu.be/L_LUpnjgPso',
                        'https://www.youtube.com/shorts/5qap5aO4i9A'
                    ].join('\n');
                    runExtraction(true);
                });
            }

            // Clear Button
            if (clearBtn) {
                clearBtn.addEventListener('click', () => {
                    inputEl.value = '';
                    resultsContainer.innerHTML = '';
                    if (countBadge) countBadge.textContent = '';
                    if (zipAllBtn) zipAllBtn.disabled = true;
                });
            }

            // Real-time input listener (debounced)
            let debounceTimer = null;
            inputEl.addEventListener('input', () => {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => {
                    if (inputEl.value.trim()) {
                        runExtraction(false);
                    }
                }, 400);
            });

            // Run initial empty prompt
            runExtraction(false);
        }

        // --------------------------------------------------------------------------
        // SHORT URL EXPANDER LOGIC
        // --------------------------------------------------------------------------
        function initExpandUrlTool() {
            const inputEl = document.getElementById('expandUrlInput');
            const runBtn = document.getElementById('expandUrlRunBtn');
            const sampleBtn = document.getElementById('expandUrlSampleBtn');
            const clearBtn = document.getElementById('expandUrlClearBtn');
            const statusBadge = document.getElementById('expandUrlStatusBadge');
            const copyAllBtn = document.getElementById('expandUrlCopyAllBtn');
            const resultsContainer = document.getElementById('expandUrlResultsContainer');

            if (!inputEl || !resultsContainer) return;

            let lastExpandedFinalUrls = [];

            async function expandSingleUrl(urlStr) {
                let target = urlStr.trim();
                if (!target) return null;
                if (!/^https?:\/\//i.test(target)) {
                    target = 'https://' + target;
                }

                // Primary: Internal Express API
                try {
                    const res = await fetch('/api/expand-url', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ url: target })
                    });
                    if (res.ok) {
                        const data = await res.json();
                        return data;
                    }
                } catch(e) {}

                // Fallback: Public unshorten API
                try {
                    const res = await fetch(`https://unshorten.me/api/v2/unshorten?url=${encodeURIComponent(target)}`);
                    if (res.ok) {
                        const data = await res.json();
                        if (data && data.unshortened_url) {
                            return {
                                originalUrl: target,
                                finalUrl: data.unshortened_url,
                                redirectCount: target !== data.unshortened_url ? 1 : 0,
                                chain: [target, data.unshortened_url],
                                status: 'success'
                            };
                        }
                    }
                } catch(e) {}

                return {
                    originalUrl: target,
                    finalUrl: target,
                    redirectCount: 0,
                    chain: [target],
                    status: 'fallback'
                };
            }

            async function runExpandAll(userTriggered = false) {
                const text = inputEl.value.trim();
                if (!text) {
                    resultsContainer.innerHTML = `
                        <div style="text-align: center; padding: 32px 16px; color: var(--text-muted); background-color: var(--bg-panel-secondary); border-radius: 4px; border: 1px dashed var(--border-color);">
                            <div style="font-size: 13px; font-weight: 600; color: var(--text-heading);">短縮URLを入力して解析開始</div>
                            <div style="font-size: 11.5px; margin-top: 4px;">bit.ly, t.co, tinyurl などの短縮URLを上に貼り付けてください</div>
                        </div>
                    `;
                    if (statusBadge) statusBadge.textContent = '';
                    if (copyAllBtn) copyAllBtn.disabled = true;
                    if (userTriggered) showToast('短縮URLを入力してください');
                    return;
                }

                const urls = text.split(/[\r\n\s,]+/).map(u => u.trim()).filter(Boolean);
                if (urls.length === 0) return;

                resultsContainer.innerHTML = '';
                lastExpandedFinalUrls = [];
                if (statusBadge) statusBadge.textContent = `${urls.length}件の短縮URLを解析中...`;

                for (let i = 0; i < urls.length; i++) {
                    const res = await expandSingleUrl(urls[i]);
                    if (res) {
                        lastExpandedFinalUrls.push(res.finalUrl);
                        renderResultCard(res, i + 1);
                    }
                }

                if (statusBadge) statusBadge.textContent = `${urls.length}件の短縮URLの展開が完了しました`;
                if (copyAllBtn) copyAllBtn.disabled = false;
                if (userTriggered) showToast(`${urls.length}件の短縮URLを展開しました`);
            }

            function renderResultCard(data, index) {
                const card = document.createElement('div');
                card.className = 'panel';
                card.style.backgroundColor = 'var(--bg-panel)';
                card.style.border = '1px solid var(--border-color)';
                card.style.borderRadius = '6px';
                card.style.padding = '14px';

                const isRedirected = data.redirectCount > 0;
                let parsedFinal = null;
                try {
                    parsedFinal = new URL(data.finalUrl);
                } catch(e) {}

                card.innerHTML = `
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; margin-bottom: 10px; flex-wrap: wrap;">
                        <div style="font-weight: 700; font-size: 13px; color: var(--text-heading); display: flex; align-items: center; gap: 8px;">
                            <span style="background-color: var(--accent-primary); color: #fff; font-size: 11px; padding: 1px 6px; border-radius: 3px; font-weight: 700;">#${index}</span>
                            <span style="word-break: break-all;">${escapeHtml(data.originalUrl)}</span>
                        </div>
                        <span class="badge" style="font-size: 11px; ${isRedirected ? 'background-color: rgba(34,197,94,0.15); color: #22c55e;' : 'opacity: 0.6;'}">
                            ${isRedirected ? `転送あり (${data.redirectCount}回リダイレクト)` : 'ダイレクト'}
                        </span>
                    </div>

                    <!-- FINAL DESTINATION -->
                    <div style="background-color: var(--bg-panel-secondary); padding: 10px 12px; border-radius: 4px; border: 1px solid var(--border-color); margin-bottom: 10px;">
                        <div style="font-size: 11px; color: var(--text-muted); font-weight: 600; margin-bottom: 4px;">展開後の到達URL (元の長URL)</div>
                        <div style="font-size: 13.5px; font-weight: 700; color: var(--accent-primary); word-break: break-all; line-height: 1.4; font-family: monospace;">
                            ${escapeHtml(data.finalUrl)}
                        </div>
                        ${parsedFinal ? `
                            <div style="font-size: 11px; color: var(--text-muted); margin-top: 6px; display: flex; gap: 12px; flex-wrap: wrap;">
                                <span>ドメイン: <strong style="color: var(--text-heading);">${escapeHtml(parsedFinal.hostname)}</strong></span>
                                <span>プロトコル: <strong style="color: var(--text-heading);">${escapeHtml(parsedFinal.protocol)}</strong></span>
                            </div>
                        ` : ''}
                    </div>

                    <!-- REDIRECT CHAIN STEPS -->
                    ${data.chain && data.chain.length > 1 ? `
                        <div style="margin-bottom: 10px;">
                            <details style="font-size: 12px; color: var(--text-muted);">
                                <summary style="cursor: pointer; font-weight: 600; color: var(--text-heading); margin-bottom: 6px; user-select: none;">
                                    リダイレクト経路履歴 (${data.chain.length}ステップ) を表示
                                </summary>
                                <div style="display: flex; flex-direction: column; gap: 4px; padding-left: 8px; border-left: 2px solid var(--accent-primary); margin-top: 6px;">
                                    ${data.chain.map((stepUrl, sIdx) => `
                                        <div style="font-family: monospace; font-size: 11.5px; word-break: break-all; padding: 2px 0;">
                                            <span style="color: var(--text-muted); font-weight: 700;">Step ${sIdx + 1}:</span>
                                            <span style="${sIdx === data.chain.length - 1 ? 'color: var(--accent-primary); font-weight: 700;' : 'color: var(--text-main);'}">${escapeHtml(stepUrl)}</span>
                                        </div>
                                    `).join('')}
                                </div>
                            </details>
                        </div>
                    ` : ''}

                    <!-- ACTIONS -->
                    <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                        <button class="btn btn-primary btn-copy-final" style="padding: 4px 12px; font-size: 11.5px;">
                            展開後URLをコピー
                        </button>
                        <a href="${escapeHtml(data.finalUrl)}" target="_blank" rel="noopener noreferrer" class="btn" style="padding: 4px 12px; font-size: 11.5px; text-decoration: none;">
                            展開後ページを開く
                        </a>
                    </div>
                `;

                resultsContainer.appendChild(card);

                // Copy button event
                card.querySelector('.btn-copy-final').addEventListener('click', () => {
                    navigator.clipboard.writeText(data.finalUrl).then(() => {
                        showToast('展開後のURLをコピーしました');
                    });
                });
            }

            if (runBtn) runBtn.addEventListener('click', () => runExpandAll(true));

            if (sampleBtn) {
                sampleBtn.addEventListener('click', () => {
                    inputEl.value = [
                        'https://tinyurl.com/2p8a4u6r',
                        'https://is.gd/S4Wz7E',
                        'https://x.gd/8Xf2l'
                    ].join('\n');
                    runExpandAll(true);
                });
            }

            if (clearBtn) {
                clearBtn.addEventListener('click', () => {
                    inputEl.value = '';
                    resultsContainer.innerHTML = '';
                    if (statusBadge) statusBadge.textContent = '';
                    if (copyAllBtn) copyAllBtn.disabled = true;
                    lastExpandedFinalUrls = [];
                });
            }

            if (copyAllBtn) {
                copyAllBtn.addEventListener('click', () => {
                    if (!lastExpandedFinalUrls.length) return;
                    navigator.clipboard.writeText(lastExpandedFinalUrls.join('\n')).then(() => {
                        showToast(`${lastExpandedFinalUrls.length}件の展開後URLをコピーしました`);
                    });
                });
            }

            runExpandAll(false);
        }

        // Initialize new tools safely whether DOM is loading or already ready
        function initNewTools() {
            initReaperPathEditor();
            initMojibakeTool();
            initUrlCodecTool();
            initYtThumbTool();
            initExpandUrlTool();
        }

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initNewTools);
        } else {
            initNewTools();
        }

        // Service Worker Registration for Offline / GitHub Pages
        if ('serviceWorker' in navigator && (window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('./sw.js').catch(() => {});
            });
        }