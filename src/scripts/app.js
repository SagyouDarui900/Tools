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
            const filenameInput = document.getElementById('specFilenameInput');

            let currentImg = null;
            let currentAudioUrl = null;

            function getFormattedFilename() {
                const rawName = filenameInput ? filenameInput.value.trim() : '';
                const cleanName = rawName.replace(/[/\\?%*:|"<>]/g, '').trim();
                return (cleanName || 'spectrogram-art') + '.wav';
            }

            if (filenameInput) {
                filenameInput.addEventListener('input', () => {
                    downloadBtn.download = getFormattedFilename();
                });
            }

            setupDropZone(drop, input, (files) => {
                if (files && files[0]) loadImage(files[0]);
            });

            function loadImage(file) {
                if (filenameInput && file.name) {
                    const base = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
                    filenameInput.value = `${base}_spectrogram`;
                    downloadBtn.download = getFormattedFilename();
                }

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
                        if (currentAudioUrl) {
                            URL.revokeObjectURL(currentAudioUrl);
                        }
                        const blobUrl = URL.createObjectURL(wavBlob);
                        currentAudioUrl = blobUrl;

                        audioPlayer.src = blobUrl;
                        downloadBtn.href = blobUrl;
                        downloadBtn.download = getFormattedFilename();

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

            // Zoom & Maximize Controls
            const viewSection = document.getElementById('view-sprite-cutter');
            const maximizeBtn = document.getElementById('spriteMaximizeBtn');
            const maximizeIcon = document.getElementById('spriteMaximizeIcon');
            const maximizeText = document.getElementById('spriteMaximizeText');
            const zoomSelect = document.getElementById('spriteZoomSelect');
            const zoomInBtn = document.getElementById('spriteZoomInBtn');
            const zoomOutBtn = document.getElementById('spriteZoomOutBtn');
            const zoom100Btn = document.getElementById('spriteZoom100Btn');
            const zoomFitBtn = document.getElementById('spriteZoomFitBtn');
            const resolutionBadge = document.getElementById('spriteResolutionBadge');
            const canvasContainer = document.getElementById('spriteCanvasContainer');

            let currentImg = null;
            let sprites = []; // { id, rect: {x,y,w,h} }
            let history = [];
            let currentId = 0;
            let isDragging = false;
            let startX = 0, startY = 0, currentX = 0, currentY = 0;
            let isPipette = false;

            // Zoom & Fullscreen State
            let currentZoom = 1.0;
            let isMaximized = false;

            // Animation State
            let isPlayingAnim = false;
            let animCurrentFrame = 0;
            let animTimer = null;

            // Drag-and-drop reorder state
            let dragSourceIndex = null;

            function applyZoom(zoom, centerScroll = false) {
                if (!currentImg) {
                    currentZoom = zoom;
                    if (zoomSelect) zoomSelect.value = zoom.toString();
                    return;
                }

                currentZoom = Math.max(0.1, Math.min(16.0, zoom));

                if (wrapper) {
                    wrapper.style.width = Math.round(imgCanvas.width * currentZoom) + 'px';
                    wrapper.style.height = Math.round(imgCanvas.height * currentZoom) + 'px';
                }

                // Update select dropdown value if matching
                if (zoomSelect) {
                    let matched = false;
                    for (let opt of zoomSelect.options) {
                        if (Math.abs(parseFloat(opt.value) - currentZoom) < 0.05) {
                            zoomSelect.value = opt.value;
                            matched = true;
                            break;
                        }
                    }
                    if (!matched) {
                        zoomSelect.value = '';
                    }
                }
            }

            function zoomToFit() {
                if (!currentImg || !canvasContainer) return;
                const containerW = canvasContainer.clientWidth - 32;
                const containerH = canvasContainer.clientHeight - 32;
                if (containerW <= 0 || containerH <= 0) return;

                const fitScale = Math.min(containerW / imgCanvas.width, containerH / imgCanvas.height);
                // 100%以上の場合は等倍で表示、画面より大きい場合は縮小フィット
                const finalScale = fitScale < 1.0 ? Math.floor(fitScale * 100) / 100 : 1.0;
                applyZoom(finalScale);
            }

            function toggleMaximize() {
                isMaximized = !isMaximized;
                if (isMaximized) {
                    viewSection.classList.add('sprite-view-maximized');
                    if (maximizeIcon) maximizeIcon.textContent = '🗗';
                    if (maximizeText) maximizeText.textContent = '縮小して戻す';
                } else {
                    viewSection.classList.remove('sprite-view-maximized');
                    if (maximizeIcon) maximizeIcon.textContent = '⛶';
                    if (maximizeText) maximizeText.textContent = 'ウィンドウ拡大';
                }

                setTimeout(() => {
                    zoomToFit();
                }, 120);
            }

            if (maximizeBtn) {
                maximizeBtn.addEventListener('click', toggleMaximize);
            }

            // Esc key to exit fullscreen
            window.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && isMaximized) {
                    toggleMaximize();
                }
            });

            // Zoom Controls Events
            if (zoomSelect) {
                zoomSelect.addEventListener('change', () => {
                    const val = parseFloat(zoomSelect.value);
                    if (!isNaN(val)) applyZoom(val);
                });
            }

            if (zoomInBtn) {
                zoomInBtn.addEventListener('click', () => {
                    const steps = [0.25, 0.5, 0.75, 1.0, 1.5, 2.0, 3.0, 4.0, 8.0];
                    let next = steps.find(s => s > currentZoom + 0.05) || (currentZoom * 1.5);
                    applyZoom(next);
                });
            }

            if (zoomOutBtn) {
                zoomOutBtn.addEventListener('click', () => {
                    const steps = [0.25, 0.5, 0.75, 1.0, 1.5, 2.0, 3.0, 4.0, 8.0];
                    let prev = [...steps].reverse().find(s => s < currentZoom - 0.05) || (currentZoom * 0.75);
                    applyZoom(prev);
                });
            }

            if (zoom100Btn) {
                zoom100Btn.addEventListener('click', () => applyZoom(1.0));
            }

            if (zoomFitBtn) {
                zoomFitBtn.addEventListener('click', zoomToFit);
            }

            // Mouse wheel zoom (Ctrl + wheel or wheel in canvas)
            if (canvasContainer) {
                canvasContainer.addEventListener('wheel', (e) => {
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        const delta = e.deltaY < 0 ? 1.2 : 0.833;
                        applyZoom(currentZoom * delta);
                    }
                }, { passive: false });
            }

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

                        if (resolutionBadge) {
                            resolutionBadge.textContent = `${img.width} × ${img.height} px`;
                        }

                        ctxImg.drawImage(img, 0, 0);
                        sprites = [];
                        history = [];
                        stopAnimation();
                        animCurrentFrame = 0;

                        // Fit to window or 100%
                        zoomToFit();
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

            function pushSpriteHistory() {
                history.push(JSON.stringify(sprites));
                if (history.length > 50) history.shift();
            }

            function addSprite(rect) {
                pushSpriteHistory();
                sprites.push({ id: currentId++, rect });
                render();
            }

            // 順番入れ替え（▲ / ▼）
            function moveSprite(index, direction) {
                const target = index + direction;
                if (target < 0 || target >= sprites.length) return;
                pushSpriteHistory();
                const temp = sprites[index];
                sprites[index] = sprites[target];
                sprites[target] = temp;
                render();
            }

            // 読順自動整列（左上→右下）
            function sortSpritesByReadingOrder() {
                if (sprites.length < 2) return;
                pushSpriteHistory();
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
                pushSpriteHistory();
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
                pushSpriteHistory();
                sprites = [];
                stopAnimation();
                animCurrentFrame = 0;
                render();
            });

            // スプライト単体を透過処理したオフスクリーンCanvasを生成（高速化キャッシュ付き）
            function getProcessedSpriteCanvas(s) {
                const isColorMode = bgMode.value === 'color';
                const cacheKey = `${s.id}_${s.rect.x}_${s.rect.y}_${s.rect.w}_${s.rect.h}_${isColorMode ? bgColorPicker.value + '_' + bgTolInput.value : 'none'}`;
                if (s._cachedCanvas && s._cacheKey === cacheKey) {
                    return s._cachedCanvas;
                }

                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = s.rect.w;
                tempCanvas.height = s.rect.h;
                const tempCtx = tempCanvas.getContext('2d');

                if (isColorMode) {
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
                s._cachedCanvas = tempCanvas;
                s._cacheKey = cacheKey;
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
                            pushSpriteHistory();
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
                            pushSpriteHistory();
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
                    img.onerror = () => {
                        URL.revokeObjectURL(url);
                        reject();
                    };
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

            let chromaRaf = null;
            function scheduleProcess() {
                if (chromaRaf) cancelAnimationFrame(chromaRaf);
                chromaRaf = requestAnimationFrame(() => {
                    process();
                });
            }

            colorPicker.addEventListener('input', (e) => {
                colorText.value = e.target.value.toUpperCase();
                scheduleProcess();
            });

            tolInput.addEventListener('input', (e) => {
                tolVal.textContent = e.target.value + '%';
                scheduleProcess();
            });

            smoothInput.addEventListener('input', (e) => {
                smoothVal.textContent = e.target.value + '%';
                scheduleProcess();
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
            const samplePhonemeBtn = document.getElementById('rpSamplePhonemeBtn');
            const summaryBox = document.getElementById('rpSummaryBox');
            const totalPathsEl = document.getElementById('rpTotalPaths');
            const replacedPathsEl = document.getElementById('rpReplacedPaths');
            const fileNameTag = document.getElementById('rpFileNameTag');
            const logPanel = document.getElementById('rpLogPanel');
            const logList = document.getElementById('rpLogList');
            const logBadge = document.getElementById('rpLogBadge');
            const clearLogBtn = document.getElementById('rpClearLogBtn');

            if (!inputText || !outputText) return;

            let loadedFileName = 'project.rpp';

            function updateReplacementLogs(origText, newText) {
                if (!logPanel || !logList) return;
                if (!origText.trim() || origText === newText) {
                    logPanel.classList.add('hidden');
                    logList.innerHTML = '';
                    if (logBadge) logBadge.textContent = '変更箇所: 0件';
                    return;
                }

                const origLines = origText.split(/\r?\n/);
                const newLines = newText.split(/\r?\n/);
                const logs = [];

                const maxLen = Math.max(origLines.length, newLines.length);
                const MAX_DIFF_LOGS = 500;
                for (let i = 0; i < maxLen; i++) {
                    const oldL = origLines[i] || '';
                    const newL = newLines[i] || '';
                    if (oldL !== newL) {
                        logs.push({
                            line: i + 1,
                            oldStr: oldL.trim(),
                            newStr: newL.trim()
                        });
                        if (logs.length >= MAX_DIFF_LOGS) break;
                    }
                }

                if (logs.length === 0) {
                    logPanel.classList.add('hidden');
                    return;
                }

                logPanel.classList.remove('hidden');
                if (logBadge) logBadge.textContent = `変更箇所: ${logs.length}件`;
                logList.innerHTML = '';

                logs.slice(0, 100).forEach(item => {
                    const card = document.createElement('div');
                    card.style.backgroundColor = 'var(--bg-main)';
                    card.style.border = '1px solid var(--border-color)';
                    card.style.borderRadius = '4px';
                    card.style.padding = '6px 10px';
                    card.style.display = 'flex';
                    card.style.flexDirection = 'column';
                    card.style.gap = '3px';

                    card.innerHTML = `
                        <div style="display: flex; justify-content: space-between; align-items: center; color: var(--text-muted); font-size: 10px;">
                            <span style="font-weight: 700;">Line ${item.line}</span>
                            <button class="btn btn-copy-line" style="padding: 1px 6px; font-size: 10px;">変更後パスをコピー</button>
                        </div>
                        <div style="color: #ef4444; background: rgba(239, 68, 68, 0.08); padding: 3px 6px; border-radius: 3px; word-break: break-all;">
                            - ${escapeHtml(item.oldStr)}
                        </div>
                        <div style="color: #22c55e; background: rgba(34, 197, 94, 0.08); padding: 3px 6px; border-radius: 3px; word-break: break-all; font-weight: 600;">
                            + ${escapeHtml(item.newStr)}
                        </div>
                    `;

                    card.querySelector('.btn-copy-line').addEventListener('click', () => {
                        navigator.clipboard.writeText(item.newStr).then(() => {
                            showToast(`Line ${item.line} の変更後パスをコピーしました`);
                        });
                    });

                    logList.appendChild(card);
                });

                if (logs.length > 100) {
                    const moreNotice = document.createElement('div');
                    moreNotice.style.textAlign = 'center';
                    moreNotice.style.color = 'var(--text-muted)';
                    moreNotice.style.padding = '6px';
                    moreNotice.style.fontSize = '11px';
                    moreNotice.textContent = `...他 ${logs.length - 100} 件の変更箇所があります`;
                    logList.appendChild(moreNotice);
                }
            }

            if (clearLogBtn) {
                clearLogBtn.addEventListener('click', () => {
                    if (logList) logList.innerHTML = '';
                    if (logPanel) logPanel.classList.add('hidden');
                    if (logBadge) logBadge.textContent = '変更箇所: 0件';
                    showToast('置換ログをクリアしました');
                });
            }

            function processRpp() {
                const text = inputText.value;
                if (resetBtn) {
                    resetBtn.classList.toggle('hidden', !text.trim());
                }

                if (!text.trim()) {
                    outputText.value = '';
                    if (summaryBox) summaryBox.classList.add('hidden');
                    updateReplacementLogs('', '');
                    return;
                }

                let newText = text;
                let pathCount = 0;
                let replacedCount = 0;

                // Path matching regex (matches both RPP quotes & JSON escaped paths)
                const pathRegex = /(["'])([a-zA-Z]:(?:\\[\\[a-zA-Z0-9_.\-\s\u3000-\u9fff]+|\\\/[^"'\r\n]+|\\[^"'\r\n]+)|\/[^"'\r\n]+)\1/g;
                const matches = text.match(pathRegex) || [];
                pathCount = matches.length;

                // 1. Replace username with owner (handles single backslash, double escaped backslash, and slashes)
                if (optOwner && optOwner.checked) {
                    // Windows single backslash: C:\Users\xxx\
                    newText = newText.replace(/([a-zA-Z]:\\Users\\)[^\\]+(\\)/gi, '$1owner$2');
                    // Windows double escaped backslash in JSON: C:\\Users\\xxx\\
                    newText = newText.replace(/([a-zA-Z]:\\\\Users\\\\)[^\\\\]+(\\\\)/gi, '$1owner$2');
                    // Mac/Linux slash: /Users/xxx/ & /home/xxx/
                    newText = newText.replace(/(\/Users\/)[^\/]+(\/)/gi, '$1owner$2');
                    newText = newText.replace(/(\/home\/)[^\/]+(\/)/gi, '$1owner$2');
                }

                // 2. Custom Path replacement
                if (oldPathInput && newPathInput) {
                    const oldVal = oldPathInput.value.trim();
                    const newVal = newPathInput.value.trim();
                    if (oldVal) {
                        newText = newText.replaceAll(oldVal, newVal);
                        // Also try replace escaped backslashes if input was single backslash in JSON
                        if (oldVal.includes('\\') && !oldVal.includes('\\\\')) {
                            const escapedOld = oldVal.replaceAll('\\', '\\\\');
                            const escapedNew = newVal.replaceAll('\\', '\\\\');
                            newText = newText.replaceAll(escapedOld, escapedNew);
                        }
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

                updateReplacementLogs(text, newText);
            }

            let rppDebounce = null;
            function scheduleProcessRpp() {
                if (rppDebounce) clearTimeout(rppDebounce);
                rppDebounce = setTimeout(() => {
                    processRpp();
                }, 100);
            }

            inputText.addEventListener('input', scheduleProcessRpp);
            if (optOwner) optOwner.addEventListener('change', () => processRpp());
            if (oldPathInput) oldPathInput.addEventListener('input', scheduleProcessRpp);
            if (newPathInput) newPathInput.addEventListener('input', scheduleProcessRpp);
            if (applyBtn) {
                applyBtn.addEventListener('click', () => {
                    processRpp();
                    showToast('パス変換処理を実行しました');
                });
            }

            if (samplePhonemeBtn) {
                samplePhonemeBtn.addEventListener('click', () => {
                    const sampleJson = JSON.stringify({
                        "Version": "1.3.1",
                        "Name": "C:\\Users\\tsuru\\Videos\\音MAD素材\\シャニマス\\Vocal抽出\\斑鳩ルカ\\luca.json",
                        "SongData": [
                            {
                                "Path": "C:\\Users\\tsuru\\Videos\\音MAD素材\\シャニマス\\Vocal抽出\\斑鳩ルカ\\aiview-luca.wav",
                                "PlayTime": 146250,
                                "SamplingRate": 44100,
                                "Lyric": "息あいなびゅ 息いぇ",
                                "Children": [
                                    { "Name": "息", "Pitch": "", "Midicent": -1, "Path": null, "StartTime": 112.7, "EndTime": 412.4 },
                                    { "Name": "あ", "Pitch": "A#4", "Midicent": 7006.9, "Path": null, "StartTime": 404.0, "EndTime": 622.0 }
                                ]
                            }
                        ]
                    }, null, 2);

                    inputText.value = sampleJson;
                    loadedFileName = 'phoneme_db.json';
                    if (oldPathInput) oldPathInput.value = 'C:\\Users\\tsuru';
                    if (newPathInput) newPathInput.value = 'C:\\Users\\owner';
                    processRpp();
                    showToast('音素DBサンプルJSONを挿入しました');
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
                    const isJson = loadedFileName.toLowerCase().endsWith('.json') || val.trim().startsWith('{');
                    const mimeType = isJson ? 'application/json;charset=utf-8' : 'text/plain;charset=utf-8';
                    const defaultName = isJson ? 'phoneme_db_modified.json' : 'project_modified.rpp';
                    const blob = new Blob([val], { type: mimeType });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = loadedFileName || defaultName;
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
        // MARKDOWN REALTIME EDITOR LOGIC
        // ==========================================================================
        function initMarkdownEditor() {
            const textarea = document.getElementById('mdTextarea');
            const preview = document.getElementById('mdPreviewContainer');
            const saveStatus = document.getElementById('mdSaveStatus');
            const templateSelect = document.getElementById('mdTemplateSelect');
            const applyTemplateBtn = document.getElementById('mdApplyTemplateBtn');
            const fileInput = document.getElementById('mdFileInput');
            const clearBtn = document.getElementById('mdClearBtn');

            // View Modes
            const btnModeSplit = document.getElementById('mdViewModeSplit');
            const btnModeEditor = document.getElementById('mdViewModeEditor');
            const btnModePreview = document.getElementById('mdViewModePreview');
            const editorGrid = document.getElementById('mdEditorGrid');
            const editorCol = document.getElementById('mdEditorCol');
            const previewCol = document.getElementById('mdPreviewCol');

            // Export / Action Buttons
            const copyDiscordBtn = document.getElementById('mdCopyDiscordBtn');
            const copyMdBtn = document.getElementById('mdCopyMdBtn');
            const copyRichHtmlBtn = document.getElementById('mdCopyRichHtmlBtn');
            const filenameInput = document.getElementById('mdFilenameInput');
            const downloadBtn = document.getElementById('mdDownloadBtn');

            // Meter & Stats
            const cursorInfo = document.getElementById('mdCursorInfo');
            const discordMeterText = document.getElementById('mdDiscordMeterText');
            const discordMeterBar = document.getElementById('mdDiscordMeterBar');
            const discordStatusBadge = document.getElementById('mdDiscordStatusBadge');

            const statTotalChars = document.getElementById('mdStatTotalChars');
            const statNoSpaceChars = document.getElementById('mdStatNoSpaceChars');
            const statWords = document.getElementById('mdStatWords');
            const statLines = document.getElementById('mdStatLines');
            const statReadTime = document.getElementById('mdStatReadTime');

            if (!textarea || !preview) return;

            // History Stack for Undo/Redo
            const history = [];
            let historyIndex = -1;
            const MAX_HISTORY = 50;

            function pushHistory() {
                const val = textarea.value;
                if (historyIndex >= 0 && history[historyIndex] === val) return;
                history.splice(historyIndex + 1);
                history.push(val);
                if (history.length > MAX_HISTORY) history.shift();
                historyIndex = history.length - 1;
                updateUndoRedoBtns();
            }

            function updateUndoRedoBtns() {
                const btnUndo = document.getElementById('mdBtnUndo');
                const btnRedo = document.getElementById('mdBtnRedo');
                if (btnUndo) btnUndo.disabled = historyIndex <= 0;
                if (btnRedo) btnRedo.disabled = historyIndex >= history.length - 1;
            }

            // Restore saved draft
            try {
                const saved = localStorage.getItem('md_editor_draft');
                if (saved) {
                    textarea.value = saved;
                }
            } catch(e) {}

            pushHistory();

            // RENDER MARKDOWN TO HTML
            function parseMarkdown(mdText) {
                if (!mdText || !mdText.trim()) {
                    return '<div style="color: var(--text-muted); font-size: 12px; text-align: center; padding-top: 40px;">マークダウンを入力すると、リアルタイムでプレビューが生成されます</div>';
                }

                let html = escapeHtml(mdText);

                // 1. Code blocks (```lang ... ```)
                html = html.replace(/```([a-zA-Z0-9_\-]*)\n([\s\S]*?)```/g, (_, lang, code) => {
                    return `<pre style="background: var(--bg-main); border: 1px solid var(--border-color); padding: 10px 12px; border-radius: 4px; overflow-x: auto; font-family: monospace; font-size: 12px; margin: 8px 0;"><code>${code}</code></pre>`;
                });

                // 2. GitHub Callouts / Alerts (> [!NOTE] etc)
                html = html.replace(/^&gt;\s*\[\!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*\n((?:&gt;.*(?:\n|$))+)/gm, (_, type, body) => {
                    const cleanBody = body.replace(/^&gt;\s?/gm, '');
                    let color = '#3b82f6';
                    let label = 'NOTE';
                    if (type === 'TIP') { color = '#10b981'; label = 'TIP'; }
                    else if (type === 'IMPORTANT') { color = '#8b5cf6'; label = 'IMPORTANT'; }
                    else if (type === 'WARNING') { color = '#f59e0b'; label = 'WARNING'; }
                    else if (type === 'CAUTION') { color = '#ef4444'; label = 'CAUTION'; }
                    return `<div style="border-left: 4px solid ${color}; background: rgba(0,0,0,0.1); padding: 8px 12px; margin: 8px 0; border-radius: 0 4px 4px 0;"><strong style="color: ${color}; font-size: 11px;">[${label}]</strong><div style="margin-top: 4px;">${cleanBody}</div></div>`;
                });

                // 3. Blockquotes (&gt;)
                html = html.replace(/^&gt;\s?(.*)$/gm, '<blockquote style="border-left: 3px solid var(--accent-primary); padding-left: 10px; margin: 6px 0; color: var(--text-muted);">$1</blockquote>');

                // 4. Headings (# ~ ###)
                html = html.replace(/^### (.*$)/gm, '<h3 style="font-size: 15px; font-weight: 700; margin: 12px 0 6px 0; color: var(--text-heading); border-bottom: 1px dashed var(--border-color); padding-bottom: 4px;">$1</h3>');
                html = html.replace(/^## (.*$)/gm, '<h2 style="font-size: 17px; font-weight: 700; margin: 14px 0 6px 0; color: var(--text-heading); border-bottom: 1px solid var(--border-color); padding-bottom: 4px;">$1</h2>');
                html = html.replace(/^# (.*$)/gm, '<h1 style="font-size: 20px; font-weight: 800; margin: 16px 0 8px 0; color: var(--text-heading); border-bottom: 2px solid var(--accent-primary); padding-bottom: 6px;">$1</h1>');

                // 5. Horizontal Rules (---)
                html = html.replace(/^---$/gm, '<hr style="border: none; border-top: 1px solid var(--border-color); margin: 12px 0;">');

                // 6. Checkbox lists (- [ ] or - [x])
                html = html.replace(/^- \[ \] (.*)$/gm, '<div style="display: flex; align-items: center; gap: 6px; margin: 3px 0;"><input type="checkbox" disabled> <span>$1</span></div>');
                html = html.replace(/^- \[x\] (.*)$/gi, '<div style="display: flex; align-items: center; gap: 6px; margin: 3px 0;"><input type="checkbox" checked disabled> <span style="text-decoration: line-through; opacity: 0.7;">$1</span></div>');

                // 7. Unordered Lists (- or *)
                html = html.replace(/^[\-\*]\s+(.*)$/gm, '<li style="margin-left: 20px; list-style-type: disc;">$1</li>');

                // 8. Ordered Lists (1. 2. etc)
                html = html.replace(/^\d+\.\s+(.*)$/gm, '<li style="margin-left: 20px; list-style-type: decimal;">$1</li>');

                // 9. Discord Spoiler (||spoiler||)
                html = html.replace(/\|\|(.*?)\|\|/g, '<span style="background-color: #202225; color: #202225; padding: 1px 4px; border-radius: 3px; cursor: pointer;" onclick="this.style.color=\'#fff\'" title="クリックで表示">$1</span>');

                // 10. Inline Code (`code`)
                html = html.replace(/`([^`]+)`/g, '<code style="background: rgba(255,255,255,0.08); padding: 1px 5px; border-radius: 3px; font-family: monospace; font-size: 11.5px;">$1</code>');

                // 11. Bold (**text**) & Italic (*text*) & Strike (~~text~~)
                html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
                html = html.replace(/~~(.*?)~~/g, '<del>$1</del>');

                // 12. Images & Links
                html = html.replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1" style="max-width: 100%; border-radius: 4px; margin: 6px 0;">');
                html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener" style="color: var(--accent-primary); text-decoration: underline;">$1</a>');

                // Line breaks (\n)
                html = html.replace(/\n/g, '<br>');

                return html;
            }

            // UPDATE STATS & PREVIEW & AUTOSAVE
            let updateTimer = null;
            function updateEditor() {
                const text = textarea.value;

                // Autosave
                try {
                    localStorage.setItem('md_editor_draft', text);
                    if (saveStatus) saveStatus.textContent = '自動保存: 有効';
                } catch(e) {}

                // Live Preview
                preview.innerHTML = parseMarkdown(text);

                // Stats calculation
                const totalChars = text.length;
                const noSpaceChars = text.replace(/\s/g, '').length;
                const lines = text ? text.split('\n').length : 0;
                const words = text.trim() ? text.trim().split(/\s+/).length : 0;
                const readMinutes = Math.ceil(noSpaceChars / 500); // 約500文字/分

                if (statTotalChars) statTotalChars.textContent = totalChars.toLocaleString();
                if (statNoSpaceChars) statNoSpaceChars.textContent = noSpaceChars.toLocaleString();
                if (statWords) statWords.textContent = words.toLocaleString();
                if (statLines) statLines.textContent = lines.toLocaleString();
                if (statReadTime) statReadTime.textContent = `約 ${readMinutes} 分`;

                // Discord Meter (Limit 2,000)
                const discLimit = 2000;
                const remaining = discLimit - totalChars;
                const pct = Math.min(100, Math.max(0, (totalChars / discLimit) * 100));

                if (discordMeterText) {
                    discordMeterText.textContent = `${totalChars.toLocaleString()} / 2,000 文字 (残り ${remaining.toLocaleString()}字)`;
                    discordMeterText.style.color = totalChars > discLimit ? '#ef4444' : 'var(--text-heading)';
                }
                if (discordMeterBar) {
                    discordMeterBar.style.width = `${pct}%`;
                    discordMeterBar.style.backgroundColor = totalChars > discLimit ? '#ef4444' : (pct > 85 ? '#f59e0b' : 'var(--accent-primary)');
                }
                if (discordStatusBadge) {
                    if (totalChars === 0) {
                        discordStatusBadge.textContent = '1枠で投稿可能';
                        discordStatusBadge.style.backgroundColor = '';
                        discordStatusBadge.style.color = '';
                    } else if (totalChars <= discLimit) {
                        discordStatusBadge.textContent = '1枠で投稿可能';
                        discordStatusBadge.style.backgroundColor = 'rgba(34, 197, 94, 0.15)';
                        discordStatusBadge.style.color = '#22c55e';
                    } else {
                        const slots = Math.ceil(totalChars / discLimit);
                        discordStatusBadge.textContent = `要 ${slots}枠に分割投稿`;
                        discordStatusBadge.style.backgroundColor = 'rgba(239, 68, 68, 0.15)';
                        discordStatusBadge.style.color = '#ef4444';
                    }
                }
            }

            function updateCursorPos() {
                if (!cursorInfo) return;
                const pos = textarea.selectionStart || 0;
                const endPos = textarea.selectionEnd || 0;
                const val = textarea.value;

                const lines = val.substring(0, pos).split('\n');
                const lineNum = lines.length;
                const colNum = lines[lines.length - 1].length + 1;
                const selectedLen = Math.abs(endPos - pos);

                cursorInfo.textContent = `行: ${lineNum} 列: ${colNum} | 選択: ${selectedLen}文字`;
            }

            textarea.addEventListener('input', () => {
                updateEditor();
                clearTimeout(updateTimer);
                updateTimer = setTimeout(pushHistory, 400);
            });
            textarea.addEventListener('keyup', updateCursorPos);
            textarea.addEventListener('click', updateCursorPos);
            textarea.addEventListener('select', updateCursorPos);

            // TEXT INSERTION HELPER
            function wrapOrInsert(prefix, suffix = '', defaultText = '') {
                const start = textarea.selectionStart;
                const end = textarea.selectionEnd;
                const text = textarea.value;
                const selected = text.substring(start, end) || defaultText;

                const replacement = prefix + selected + suffix;
                textarea.value = text.substring(0, start) + replacement + text.substring(end);
                
                const newCursorPos = start + prefix.length + selected.length;
                textarea.setSelectionRange(start + prefix.length, newCursorPos);
                textarea.focus();

                updateEditor();
                pushHistory();
            }

            function prependLine(prefix) {
                const start = textarea.selectionStart;
                const end = textarea.selectionEnd;
                const text = textarea.value;

                const lineStart = text.lastIndexOf('\n', start - 1) + 1;
                const lineEnd = text.indexOf('\n', end);
                const actualEnd = lineEnd === -1 ? text.length : lineEnd;

                const targetText = text.substring(lineStart, actualEnd);
                const lines = targetText.split('\n');
                const modifiedLines = lines.map(line => prefix + line);
                const replacement = modifiedLines.join('\n');

                textarea.value = text.substring(0, lineStart) + replacement + text.substring(actualEnd);
                textarea.setSelectionRange(lineStart, lineStart + replacement.length);
                textarea.focus();

                updateEditor();
                pushHistory();
            }

            // TOOLBAR BUTTON HANDLERS
            const btnMap = {
                'mdBtnBold': () => wrapOrInsert('**', '**', '太字テキスト'),
                'mdBtnItalic': () => wrapOrInsert('*', '*', '斜体テキスト'),
                'mdBtnStrike': () => wrapOrInsert('~~', '~~', '打ち消しテキスト'),
                'mdBtnUnderline': () => wrapOrInsert('<u>', '</u>', '下線テキスト'),
                'mdBtnInlineCode': () => wrapOrInsert('`', '`', 'code'),
                'mdBtnH1': () => prependLine('# '),
                'mdBtnH2': () => prependLine('## '),
                'mdBtnH3': () => prependLine('### '),
                'mdBtnUl': () => prependLine('- '),
                'mdBtnOl': () => prependLine('1. '),
                'mdBtnTask': () => prependLine('- [ ] '),
                'mdBtnQuote': () => prependLine('> '),
                'mdBtnCodeBlock': () => wrapOrInsert('```typescript\n', '\n```', '// ここにコードを入力'),
                'mdBtnTable': () => wrapOrInsert('\n| 項目A | 項目B | 項目C |\n|---|---|---|\n| データ1 | データ2 | データ3 |\n'),
                'mdBtnHr': () => wrapOrInsert('\n---\n'),
                'mdBtnLink': () => wrapOrInsert('[', '](https://example.com)', 'リンクテキスト'),
                'mdBtnImage': () => wrapOrInsert('![', '](https://via.placeholder.com/600x300)', '画像名'),
                
                // Discord / GitHub
                'mdBtnDiscordSpoiler': () => wrapOrInsert('||', '||', 'ネタバレ注意'),
                'mdBtnDiscordSubtext': () => prependLine('-# '),
                'mdBtnDiscordTimestamp': () => wrapOrInsert(`<t:${Math.floor(Date.now()/1000)}:R>`),
                'mdBtnDiscordQuoteMulti': () => prependLine('>>> '),
                'mdBtnDiscordAnsi': () => wrapOrInsert('```ansi\n\u001b[31m赤色テキスト\u001b[0m\n```'),
                'mdBtnGhAlert': () => wrapOrInsert('> [!NOTE]\n> ここに補足注意事項を入力してください\n'),
                'mdBtnShieldsBadge': () => wrapOrInsert('![Badge](https://img.shields.io/badge/Status-Active-brightgreen)\n'),
                'mdBtnDetails': () => wrapOrInsert('<details>\n<summary>折りたたみを展開</summary>\n\n詳細なコンテンツがここに表示されます\n\n</details>\n'),

                // Text Formatting
                'mdBtnZenHanAlpha': () => {
                    const start = textarea.selectionStart;
                    const end = textarea.selectionEnd;
                    const val = textarea.value;
                    const target = val.substring(start, end) || val;
                    const converted = target.replace(/[Ａ-Ｚａ-ｚ０-９]/g, s => String.fromCharCode(s.charCodeAt(0) - 0xFEE0));
                    if (start !== end) {
                        textarea.value = val.substring(0, start) + converted + val.substring(end);
                    } else {
                        textarea.value = converted;
                    }
                    updateEditor();
                    pushHistory();
                    showToast('全角英数を半角に変換しました');
                },
                'mdBtnHanZenKana': () => {
                    const start = textarea.selectionStart;
                    const end = textarea.selectionEnd;
                    const val = textarea.value;
                    const target = val.substring(start, end) || val;
                    const kanaMap = {
                        'ｶﾞ':'ガ','ｷﾞ':'ギ','ｸﾞ':'グ','ｹﾞ':'ゲ','ｺﾞ':'ゴ',
                        'ｻﾞ':'ザ','ｼﾞ':'ジ','ｽﾞ':'ズ','ｾﾞ':'ゼ','ｿﾞ':'ゾ',
                        'ﾀﾞ':'ダ','ﾁﾞ':'ヂ','ﾂﾞ':'ヅ','ﾃﾞ':'デ','ﾄﾞ':'ド',
                        'ﾊﾞ':'バ','ﾋﾞ':'ビ','ﾌﾞ':'ブ','ﾍﾞ':'ベ','ﾎﾞ':'ボ',
                        'ﾊﾟ':'パ','ﾋﾟ':'ピ','ﾌﾟ':'プ','ﾍﾟ':'ペ','ﾎﾟ':'ポ',
                        'ｱ':'ア','ｲ':'イ','ｳ':'ウ','ｴ':'エ','ｵ':'オ',
                        'ｶ':'カ','ｷ':'キ','ｸ':'ク','ｹ':'ケ','ｺ':'コ',
                        'ｻ':'サ','ｼ':'シ','ｽ':'ス','ｾ':'セ','ｿ':'ソ',
                        'ﾀ':'タ','ﾁ':'チ','ﾂ':'ツ','ﾃ':'テ','ﾄ':'ト',
                        'ﾅ':'ナ','ﾆ':'ニ','ﾇ':'ヌ','ﾈ':'ネ','ﾉ':'ノ',
                        'ﾊ':'ハ','ﾋ':'ヒ','ﾌ':'フ','ﾍ':'ヘ','ﾎ':'ホ',
                        'ﾏ':'マ','ﾐ':'ミ','ﾑ':'ム','ﾒ':'メ','ﾓ':'モ',
                        'ﾔ':'ヤ','ﾕ':'ユ','ﾖ':'ヨ',
                        'ﾗ':'ラ','ﾘ':'リ','ﾙ':'ル','ﾚ':'レ','ﾛ':'ロ',
                        'ﾜ':'ワ','ｦ':'ヲ','ﾝ':'ン','ｧ':'ァ','ｨ':'ィ',
                        'ｩ':'ゥ','ｪ':'ェ','ｫ':'ォ','ｯ':'ッ','ｬ':'ャ',
                        'ｭ':'ュ','ｮ':'ョ','ｰ':'ー','ﾟ':'゜','ﾞ':'ﾞ'
                    };
                    const reg = new RegExp(Object.keys(kanaMap).join('|'), 'g');
                    const converted = target.replace(reg, s => kanaMap[s] || s);
                    if (start !== end) {
                        textarea.value = val.substring(0, start) + converted + val.substring(end);
                    } else {
                        textarea.value = converted;
                    }
                    updateEditor();
                    pushHistory();
                    showToast('半角カナを全角に変換しました');
                },
                'mdBtnCaseToggle': () => {
                    const start = textarea.selectionStart;
                    const end = textarea.selectionEnd;
                    const val = textarea.value;
                    const target = val.substring(start, end) || val;
                    const isUpper = target === target.toUpperCase();
                    const converted = isUpper ? target.toLowerCase() : target.toUpperCase();
                    if (start !== end) {
                        textarea.value = val.substring(0, start) + converted + val.substring(end);
                    } else {
                        textarea.value = converted;
                    }
                    updateEditor();
                    pushHistory();
                    showToast(isUpper ? '小文字に変換しました' : '大文字に変換しました');
                },
                'mdBtnCleanLines': () => {
                    let val = textarea.value;
                    val = val.replace(/[ \t]+$/gm, '');
                    val = val.replace(/\n{3,}/g, '\n\n');
                    textarea.value = val;
                    updateEditor();
                    pushHistory();
                    showToast('連続空行および行末スペースを整理しました');
                },
                'mdBtnPunctToggle': () => {
                    let val = textarea.value;
                    if (val.includes('、') || val.includes('。')) {
                        val = val.replaceAll('、', '，').replaceAll('。', '．');
                        showToast('「，」「．」に変換しました');
                    } else {
                        val = val.replaceAll('，', '、').replaceAll('。', '．');
                        showToast('「、」「。」に変換しました');
                    }
                    textarea.value = val;
                    updateEditor();
                    pushHistory();
                }
            };

            Object.keys(btnMap).forEach(btnId => {
                const btn = document.getElementById(btnId);
                if (btn) {
                    btn.addEventListener('click', btnMap[btnId]);
                }
            });

            // Undo / Redo Click Handlers
            const btnUndo = document.getElementById('mdBtnUndo');
            const btnRedo = document.getElementById('mdBtnRedo');
            if (btnUndo) {
                btnUndo.addEventListener('click', () => {
                    if (historyIndex > 0) {
                        historyIndex--;
                        textarea.value = history[historyIndex];
                        updateEditor();
                        updateUndoRedoBtns();
                    }
                });
            }
            if (btnRedo) {
                btnRedo.addEventListener('click', () => {
                    if (historyIndex < history.length - 1) {
                        historyIndex++;
                        textarea.value = history[historyIndex];
                        updateEditor();
                        updateUndoRedoBtns();
                    }
                });
            }

            // Keyboard Shortcuts inside Textarea
            textarea.addEventListener('keydown', (e) => {
                if (e.ctrlKey || e.metaKey) {
                    if (e.key === 'b' || e.key === 'B') { e.preventDefault(); btnMap['mdBtnBold'](); }
                    else if (e.key === 'i' || e.key === 'I') { e.preventDefault(); btnMap['mdBtnItalic'](); }
                    else if (e.key === 'k' || e.key === 'K') { e.preventDefault(); btnMap['mdBtnLink'](); }
                    else if (e.key === 'z' || e.key === 'Z') {
                        if (e.shiftKey) {
                            e.preventDefault();
                            if (btnRedo) btnRedo.click();
                        } else {
                            e.preventDefault();
                            if (btnUndo) btnUndo.click();
                        }
                    } else if (e.key === 'y' || e.key === 'Y') {
                        e.preventDefault();
                        if (btnRedo) btnRedo.click();
                    }
                }
            });

            // VIEW MODE SWITCHING
            if (btnModeSplit && btnModeEditor && btnModePreview && editorGrid && editorCol && previewCol) {
                btnModeSplit.addEventListener('click', () => {
                    editorGrid.style.display = 'grid';
                    editorGrid.style.gridTemplateColumns = '1fr 1fr';
                    editorCol.style.display = 'block';
                    previewCol.style.display = 'block';
                    [btnModeSplit, btnModeEditor, btnModePreview].forEach(b => b.classList.remove('btn-primary'));
                    btnModeSplit.classList.add('btn-primary');
                });
                btnModeEditor.addEventListener('click', () => {
                    editorGrid.style.display = 'block';
                    editorCol.style.display = 'block';
                    previewCol.style.display = 'none';
                    [btnModeSplit, btnModeEditor, btnModePreview].forEach(b => b.classList.remove('btn-primary'));
                    btnModeEditor.classList.add('btn-primary');
                });
                btnModePreview.addEventListener('click', () => {
                    editorGrid.style.display = 'block';
                    editorCol.style.display = 'none';
                    previewCol.style.display = 'block';
                    [btnModeSplit, btnModeEditor, btnModePreview].forEach(b => b.classList.remove('btn-primary'));
                    btnModePreview.classList.add('btn-primary');
                });
            }

            // TEMPLATE INSERTION
            const TEMPLATES = {
                layout_callouts: `# GitHub コールアウト記法サンプル\n\n> [!NOTE]\n> ここは補足情報や重要知識を記載するノートエリアです。\n\n> [!TIP]\n> 作業効率を上げるTipsやヒントを記載します。\n\n> [!IMPORTANT]\n> 見落とし厳禁な開発ルールや手順です。\n\n> [!WARNING]\n> 警告事項や注意事項を記載します。\n\n> [!CAUTION]\n> 非推奨な操作やリスクのあるコマンドです。\n`,
                readme: `# プロジェクト名\n\n簡易的なプロジェクトの説明文をここに記載します。\n\n## 🚀 特徴\n\n- ✨ 軽量で高速な動作\n- 🎨 直感的なユーザーインターフェース\n- 📦 依存関係なし\n\n## 🛠️ 使い方\n\n\`\`\`bash\nnpm install\nnpm run dev\n\`\`\`\n\n## 📄 ライセンス\n\nMIT License\n`,
                release_note: `# リリースノート v1.2.0\n\n**リリース日:** 2026年9月12日\n\n### 🌟 新機能・改善\n- 音素データベースのパス一括置換ログ表示機能を追加\n- Markdownエディタのリアルタイムプレビューを強化\n\n### 🐛 バグ修正\n- ファイルドロップ時の文字化けを修正\n`,
                meeting_notes: `# ミーティング議事録\n\n**日時:** 2026/09/12 10:00 - 11:00\n**参加者:** 山田, 田中, 鈴木\n\n## 📋 議題\n1. 新機能の仕様確認\n2. スケジュール調整\n\n## 決定事項\n- [x] パス置換ログ機能の実装決定\n- [ ] 来週月曜日にα版リリース\n`,
                tech_spec: `# 技術仕様書: 音素DB解析モジュール\n\n## 1. 概要\n音素データベース (JSON) 内のファイルパスおよび音素パラメータを構造解析・変換するシステム。\n\n## 2. データ構造\n\`\`\`json\n{\n  "Version": "1.3.1",\n  "SongData": []\n}\n\`\`\`\n`,
                discord_post: `# 📢 お知らせフォーマット\n\nユーザーの皆様へ\n\n新機能アップデートを公開しました！\n\n-# 詳細は下記URLをご確認ください\n\n||https://example.com/update-info||\n`
            };

            if (applyTemplateBtn && templateSelect) {
                applyTemplateBtn.addEventListener('click', () => {
                    const key = templateSelect.value;
                    if (!key || !TEMPLATES[key]) {
                        showToast('テンプレートを選択してください');
                        return;
                    }
                    textarea.value = TEMPLATES[key];
                    updateEditor();
                    pushHistory();
                    showToast('定型テンプレートを適用しました');
                });
            }

            // FILE INPUT & CLEAR
            if (fileInput) {
                fileInput.addEventListener('change', (e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    if (filenameInput) filenameInput.value = file.name;
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        textarea.value = event.target.result;
                        updateEditor();
                        pushHistory();
                        showToast(`「${file.name}」を読み込みました`);
                    };
                    reader.readAsText(file);
                    fileInput.value = '';
                });
            }

            if (clearBtn) {
                clearBtn.addEventListener('click', () => {
                    textarea.value = '';
                    updateEditor();
                    pushHistory();
                    showToast('エディタをクリアしました');
                });
            }

            // EXPORT & COPY HANDLERS
            if (copyMdBtn) {
                copyMdBtn.addEventListener('click', () => {
                    const val = textarea.value;
                    if (!val) { showToast('コピーするテキストがありません'); return; }
                    navigator.clipboard.writeText(val).then(() => showToast('Markdownテキストをコピーしました'));
                });
            }

            if (copyDiscordBtn) {
                copyDiscordBtn.addEventListener('click', () => {
                    const val = textarea.value;
                    if (!val) { showToast('コピーするテキストがありません'); return; }
                    navigator.clipboard.writeText(val).then(() => showToast('Discord形式テキストをコピーしました'));
                });
            }

            if (copyRichHtmlBtn) {
                copyRichHtmlBtn.addEventListener('click', () => {
                    const htmlContent = preview.innerHTML;
                    if (!htmlContent) { showToast('コピーするプレビューがありません'); return; }

                    try {
                        const blobInput = new Blob([htmlContent], { type: 'text/html' });
                        const blobText = new Blob([textarea.value], { type: 'text/plain' });
                        const item = new ClipboardItem({
                            'text/html': blobInput,
                            'text/plain': blobText
                        });
                        navigator.clipboard.write([item]).then(() => showToast('リッチテキスト(HTML)をクリップボードにコピーしました'));
                    } catch(e) {
                        navigator.clipboard.writeText(htmlContent).then(() => showToast('HTMLテキストをコピーしました'));
                    }
                });
            }

            if (downloadBtn) {
                downloadBtn.addEventListener('click', () => {
                    const val = textarea.value;
                    if (!val) { showToast('保存するテキストがありません'); return; }
                    const fn = (filenameInput ? filenameInput.value.trim() : '') || 'document.md';
                    const blob = new Blob([val], { type: 'text/markdown;charset=utf-8' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = fn.endsWith('.md') ? fn : fn + '.md';
                    a.click();
                    setTimeout(() => URL.revokeObjectURL(url), 1000);
                    showToast(`「${a.download}」を保存しました`);
                });
            }

            // Initial Update
            updateEditor();
            updateCursorPos();
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
                    const zipUrl = URL.createObjectURL(zipContent);
                    const a = document.createElement('a');
                    a.href = zipUrl;
                    a.download = `youtube_thumbnails_${targetExt}_${Date.now()}.zip`;
                    a.click();
                    setTimeout(() => URL.revokeObjectURL(zipUrl), 1500);
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
            const initializers = [
                initReaperPathEditor,
                initMarkdownEditor,
                initMojibakeTool,
                initUrlCodecTool,
                initYtThumbTool,
                initExpandUrlTool
            ];
            initializers.forEach(fn => {
                try {
                    if (typeof fn === 'function') fn();
                } catch (e) {
                    console.warn('Tool initialization skipped due to error:', e);
                }
            });
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