export function initReaperPathEditor() {
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
