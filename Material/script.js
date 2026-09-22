document.addEventListener('DOMContentLoaded', () => {
    // 1. Setup Python Playground using Ace Editor & Pyodide
    function setupPythonPlayground() {
        // Add custom styles for the editor, toolbar actions, and terminal
        if (!document.getElementById('python-playground-style')) {
            const style = document.createElement('style');
            style.id = 'python-playground-style';
            style.textContent = `
                .code-wrapper { position: relative; margin: 2.25rem 0; border-radius: 12px; overflow: hidden; box-shadow: 0 12px 32px rgba(0, 0, 0, 0.2); border: 1px solid rgba(226, 232, 240, 0.15); background: #0d1117; }
                .code-window-header { display: flex; align-items: center; justify-content: space-between; background: #161b26; padding: 0.65rem 1.25rem; border-bottom: 1px solid rgba(255, 255, 255, 0.08); }
                .mac-controls { display: flex; align-items: center; gap: 7px; }
                .mac-dot { width: 11px; height: 11px; border-radius: 50%; display: inline-block; }
                .mac-dot.red { background-color: #ff5f56; }
                .mac-dot.yellow { background-color: #ffbd2e; }
                .mac-dot.green { background-color: #27c93f; }
                .code-title-tag { font-family: 'Fira Code', monospace; font-size: 0.82rem; font-weight: 600; color: #94a3b8; display: flex; align-items: center; gap: 0.4rem; }
                .code-actions-bar { display: flex; align-items: center; gap: 0.45rem; }
                .ace_editor { font-family: 'Fira Code', monospace !important; font-size: 0.95em !important; line-height: 1.6 !important; }
                .code-btn {
                    background: rgba(255, 255, 255, 0.08); border: 1px solid rgba(255, 255, 255, 0.15);
                    color: #f8fafc; padding: 0.35rem 0.85rem; border-radius: 6px;
                    font-size: 0.78rem; font-weight: 700; font-family: 'Inter', sans-serif; cursor: pointer; transition: all 0.2s ease;
                    display: inline-flex; align-items: center; gap: 0.3rem;
                }
                .code-btn:hover { background: rgba(255, 255, 255, 0.18); border-color: rgba(255, 255, 255, 0.3); }
                .play-btn { background: linear-gradient(135deg, #f97316, #ea580c) !important; border-color: #ea580c !important; color: #ffffff !important; box-shadow: 0 2px 8px rgba(234, 88, 12, 0.4); }
                .play-btn:hover { background: linear-gradient(135deg, #fb923c, #f97316) !important; box-shadow: 0 4px 12px rgba(234, 88, 12, 0.6); transform: translateY(-1px); }
                .save-btn { color: #60a5fa; border-color: rgba(96, 165, 250, 0.4); }
                .save-btn:hover { background: rgba(96, 165, 250, 0.25); color: #fff; border-color: #60a5fa; }
                .reset-btn { color: #9ca3af; border-color: rgba(156, 163, 175, 0.3); }
                .reset-btn:hover { background: rgba(156, 163, 175, 0.2); color: #fff; }
                .terminal-window { margin: 0; padding: 1.25rem 1.5rem; border: none; border-top: 1px solid rgba(255, 255, 255, 0.1); background: #06090e; color: #4ade80; font-family: 'Fira Code', monospace; white-space: pre-wrap; font-size: 0.88rem; max-height: 320px; overflow-y: auto; }
            `;
            document.head.appendChild(style);
        }

        // Function to load and configure Pyodide
        let pyodideReadyPromise = null;
        async function getPyodide() {
            if (!pyodideReadyPromise) {
                pyodideReadyPromise = (async () => {
                    const pyodide = await loadPyodide();
                    await pyodide.loadPackage("micropip");
                    const micropip = pyodide.pyimport("micropip");
                    // Pre-install scikit-learn for our Day 1 examples
                    await micropip.install("scikit-learn");
                    return pyodide;
                })();
            }
            return pyodideReadyPromise;
        }

        // Inject Pyodide script into document head
        if (!window.loadPyodide) {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js';
            document.head.appendChild(script);
        }

        // Build the editor UI
        function buildEditorWrapper(originalCodeText, storageKey) {
            const wrapper = document.createElement('div');
            wrapper.className = 'code-wrapper';
            
            // Load saved code from Local Storage if user previously modified/saved it
            const savedCode = storageKey ? localStorage.getItem(storageKey) : null;
            const codeToLoad = savedCode !== null ? savedCode : originalCodeText;

            // Extract title if available from first comment line
            let titleText = 'main.py';
            const firstLine = codeToLoad.trim().split('\n')[0];
            if (firstLine && firstLine.startsWith('# Program')) {
                titleText = firstLine.replace('#', '').trim().split(':')[0];
                if (!titleText.endsWith('.py')) titleText += '.py';
            }

            // Create macOS Window Title Header
            const headerDiv = document.createElement('div');
            headerDiv.className = 'code-window-header';
            headerDiv.innerHTML = `
                <div class="mac-controls">
                    <span class="mac-dot red"></span>
                    <span class="mac-dot yellow"></span>
                    <span class="mac-dot green"></span>
                </div>
                <div class="code-title-tag">🐍 <span>${titleText}</span></div>
                <div class="code-actions-bar"></div>
            `;
            wrapper.appendChild(headerDiv);

            // Calculate height based on lines of code
            const lines = codeToLoad.split('\n').length;
            const editorHeight = Math.max(130, lines * 22 + 30);
            
            const editorDiv = document.createElement('div');
            editorDiv.style.width = '100%';
            editorDiv.style.height = editorHeight + 'px';
            editorDiv.textContent = codeToLoad;
            
            wrapper.appendChild(editorDiv);
            
            // Initialize Ace Editor
            const editor = ace.edit(editorDiv);
            editor.setTheme("ace/theme/tomorrow_night");
            editor.session.setMode("ace/mode/python");
            editor.setOptions({
                fontFamily: "'Fira Code', monospace",
                fontSize: "14px",
                showPrintMargin: false,
                displayIndentGuides: true,
                highlightActiveLine: true,
                tabSize: 4
            });

            // Bind Ctrl+/ and Cmd+/ for Jupyter Notebook style line commenting/uncommenting
            editor.commands.addCommand({
                name: 'toggleCommentCustom',
                bindKey: { win: 'Ctrl-/', mac: 'Cmd-/|Ctrl-/' },
                exec: function(ed) {
                    ed.toggleCommentLines();
                },
                readOnly: false
            });
            
            // Controls toolbar inside title header
            const actionsBar = headerDiv.querySelector('.code-actions-bar');

            const saveBtn = document.createElement('button');
            saveBtn.className = 'code-btn save-btn';
            saveBtn.title = 'Save your custom code locally';
            saveBtn.innerHTML = savedCode !== null ? 'Saved 💾' : 'Save 💾';

            const resetBtn = document.createElement('button');
            resetBtn.className = 'code-btn reset-btn';
            resetBtn.title = 'Reset code to default template';
            resetBtn.innerHTML = 'Reset 🔄';

            const playBtn = document.createElement('button');
            playBtn.className = 'code-btn play-btn';
            playBtn.title = 'Run code in Pyodide environment';
            playBtn.innerHTML = 'Run ▶';

            actionsBar.appendChild(saveBtn);
            actionsBar.appendChild(resetBtn);
            actionsBar.appendChild(playBtn);

            // Save Functionality
            saveBtn.addEventListener('click', () => {
                if (!storageKey) return;
                const currentCode = editor.getValue();
                localStorage.setItem(storageKey, currentCode);
                saveBtn.innerHTML = 'Saved ✓';
                saveBtn.style.color = '#3fb950';
                saveBtn.style.borderColor = '#3fb950';
                setTimeout(() => {
                    saveBtn.innerHTML = 'Save 💾';
                    saveBtn.style.color = '';
                    saveBtn.style.borderColor = '';
                }, 2000);
            });

            // Reset Functionality
            resetBtn.addEventListener('click', () => {
                if (storageKey) {
                    localStorage.removeItem(storageKey);
                }
                editor.setValue(originalCodeText, -1);
                resetBtn.innerHTML = 'Reset ✓';
                setTimeout(() => {
                    resetBtn.innerHTML = 'Reset 🔄';
                }, 1500);
            });

            // Debounced Auto-Save on edit
            let autoSaveTimer = null;
            editor.session.on('change', () => {
                if (!storageKey) return;
                clearTimeout(autoSaveTimer);
                autoSaveTimer = setTimeout(() => {
                    localStorage.setItem(storageKey, editor.getValue());
                }, 1000);
            });
            
            const outputDiv = document.createElement('div');
            outputDiv.className = 'terminal-window';
            outputDiv.style.display = 'none';
            
            // Handle Code Execution
            playBtn.addEventListener('click', async () => {
                outputDiv.style.display = 'block';
                const code = editor.getValue();
                
                // --- Mock Execution for Heavy Models ---
                if (code.includes("from transformers import pipeline") || code.includes("openai")) {
                    outputDiv.innerHTML = '<span style="color: #a5d6ff;">[Simulated Execution] Sending prompt to Large Language Model...</span>\n\n';
                    setTimeout(() => {
                        if (code.includes("pipeline('text-generation'")) {
                            outputDiv.innerHTML += "LLM Generation: Machine learning is a rapidly evolving field of artificial intelligence that focuses on...\n";
                        } else {
                            outputDiv.innerHTML += "Response: \n- Legacy NLP required manual feature engineering and complex pipelines.\n- Modern LLMs use simple prompt-based API calls.\n- Generative models offer much more flexibility and raw intelligence.\n";
                        }
                    }, 1000);
                    return;
                }

                // --- Real Pyodide Execution ---
                outputDiv.innerHTML = '<span style="color: #ffbd2e;">Initializing Browser Python Environment (this takes a few seconds on first run)...</span>\n';
                
                try {
                    const pyodide = await getPyodide();
                    outputDiv.innerHTML = '<span style="color: #3fb950;">Python Ready! Executing code...</span>\n\n';
                    
                    // Capture standard output (print statements) & standard input (input() calls)
                    let outputBuffer = "";
                    let lastStdoutMsg = "";

                    pyodide.setStdout({
                        batched: (msg) => {
                            outputBuffer += msg + "\n";
                            lastStdoutMsg = msg;
                            outputDiv.innerHTML = outputBuffer;
                            outputDiv.scrollTop = outputDiv.scrollHeight;
                        }
                    });
                    
                    pyodide.setStderr({
                        batched: (msg) => {
                            outputBuffer += '<span style="color: #ff5f56;">' + msg + '</span>\n';
                            outputDiv.innerHTML = outputBuffer;
                            outputDiv.scrollTop = outputDiv.scrollHeight;
                        }
                    });

                    pyodide.setStdin({
                        stdin: () => {
                            outputDiv.innerHTML = outputBuffer + '<span style="color: #ffbd2e;">[Waiting for user input...]</span>\n';
                            outputDiv.scrollTop = outputDiv.scrollHeight;

                            const promptText = lastStdoutMsg.trim()
                                ? `Python input requested:\n"${lastStdoutMsg.trim()}"`
                                : "Python program requires user input:";

                            let userInput = window.prompt(promptText);
                            if (userInput === null) {
                                userInput = "";
                            }

                            outputBuffer += `<span style="color: #4caf50;">${userInput}</span>\n`;
                            outputDiv.innerHTML = outputBuffer;
                            outputDiv.scrollTop = outputDiv.scrollHeight;

                            return userInput + "\n";
                        }
                    });
                    
                    await pyodide.runPythonAsync(code);
                    
                    if (outputBuffer.trim() === "") {
                        outputDiv.innerHTML += "<em>(Program finished with no output)</em>";
                    } else {
                        outputDiv.innerHTML = outputBuffer;
                    }
                    
                } catch (err) {
                    outputDiv.innerHTML += `\n<span style="color: #ff5f56;">Error:\n${err}</span>`;
                }
            });
            
            outputDiv.className = 'terminal-window';
            outputDiv.style.display = 'none';
            wrapper.appendChild(outputDiv);
            return wrapper;
        }

        // Find all Prism python blocks and convert them to Ace
        function initAceEditors() {
            const codeBlocks = document.querySelectorAll('pre code.language-python');
            const pagePath = window.location.pathname.split('/').pop() || 'index.html';
            codeBlocks.forEach((codeBlock, idx) => {
                const pre = codeBlock.parentElement;
                
                const originalCodeText = codeBlock.textContent.trim();
                const storageKey = `saved_code_${pagePath}_block_${idx}`;
                const wrapper = buildEditorWrapper(originalCodeText, storageKey);
                pre.parentNode.insertBefore(wrapper, pre);
                pre.remove();
            });
        }

        // Inject Ace Editor script if not present
        if (window.ace) {
            initAceEditors();
        } else {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/ace/1.32.3/ace.js';
            script.onload = initAceEditors;
            document.head.appendChild(script);
        }
    }

    setupPythonPlayground();
    initThemeToggle();
    initSearchModal();
    initPrintButton();
    initGitHubButton();
    initMobileMenu();
    initSubtopicNavigation();
    initDisabledLinks();
    initMathRendering();
    initSidebarResize();
    initMCQInteractivity();
});

// =========================================================
// Top Navigation: Theme Toggle
// =========================================================
function initThemeToggle() {
    const themeBtn = document.getElementById('theme-toggle') || document.querySelector('.icon-btn[aria-label="Toggle Theme"]');
    if (!themeBtn) return;

    const sunSvg = `<svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="5"></circle>
        <line x1="12" y1="1" x2="12" y2="3"></line>
        <line x1="12" y1="21" x2="12" y2="23"></line>
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
        <line x1="1" y1="12" x2="3" y2="12"></line>
        <line x1="21" y1="12" x2="23" y2="12"></line>
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
    </svg>`;

    const moonSvg = `<svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
    </svg>`;

    function updateThemeIcon(theme) {
        themeBtn.innerHTML = theme === 'dark' ? sunSvg : moonSvg;
        themeBtn.setAttribute('title', theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode');
    }

    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    updateThemeIcon(currentTheme);

    themeBtn.addEventListener('click', () => {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const nextTheme = isDark ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', nextTheme);
        localStorage.setItem('rust-book-theme', nextTheme);
        localStorage.setItem('agentic-ai-theme', nextTheme);
        updateThemeIcon(nextTheme);
    });
}

// =========================================================
// Top Navigation: Spotlight Search Modal (Ctrl/Cmd + K)
// =========================================================
function initSearchModal() {
    const searchBtns = document.querySelectorAll('.icon-btn[aria-label="Search"]');
    if (!searchBtns.length) return;

    // Course Search Index data covering all 24 days + core topics
    const courseIndex = [
        { day: 0, title: "Course Overview & Architecture", url: "index.html", tags: "intro roadmap syllabus 20 projects methodology prerequisites", desc: "Curriculum roadmap, 20 industrial projects, prerequisites, and learning methodology." },
        { day: 1, title: "Day 1: Python Fundamentals for Agentic Workflows", url: "day_01.html", tags: "type hints pydantic v2 schemas async await concurrency exponential backoff jitter semaphore", desc: "Pydantic v2 schema enforcement, typed state, async semaphore execution, jittered backoff." },
        { day: 2, title: "Day 2: The AI Landscape: From Basic ML to LLMs", url: "day_02.html", tags: "machine learning deep learning transformers chinchilla scaling logit sampling ttft tpot", desc: "Chinchilla compute-optimal scaling, 5 levels of autonomy, logit sampling profiler." },
        { day: 3, title: "Day 3: How LLMs Work — And How to Prompt Them Well", url: "day_03.html", tags: "tokenization embeddings context window attention prompt engineering rctno zero shot few shot", desc: "Tokens, embeddings, and self-attention, plus structured prompting basics: RCTNO, clear instructions, zero-shot and few-shot prompting." },
        { day: 4, title: "Day 4: Advanced Prompting, Grounding & How LLMs Are Trained", url: "day_04.html", tags: "temperature logits softmax training inference backpropagation loss hallucination grounding chain of thought prompt iteration agents", desc: "How an LLM is trained (loss, backpropagation, weight updates), hallucination and grounding, reasoning-oriented prompting, prompt iteration, and prompts as an agent control layer." },
        { day: 5, title: "Day 5: Turning LLMs into Specialists", url: "day_05.html", tags: "constrained decoding dfa logit masking structured outputs pydantic router grammar", desc: "Constrained decoding, deterministic DFA logit masking, multi-specialist Pydantic schema router." },
        { day: 6, title: "Day 6: Executing Code & External Tools", url: "day_06.html", tags: "tool calling json schema wire protocol sandbox subprocess memory guards security cve", desc: "Tool-calling wire protocol overhead, dynamic @tool signature introspector, sandboxed code executor." },
        { day: 7, title: "Day 7: Deterministic Loops & Compound Reliability", url: "day_07.html", tags: "compound reliability prompt chains fan out fan in state machine json snapshot", desc: "Compound reliability math, sequential prompt chaining, async fan-out risk aggregator, state machines." },
        { day: 8, title: "Day 8: Capstone: Autonomous Problem Solver", url: "day_08.html", tags: "capstone cli problem solver rich terminal hitl approval self healing code", desc: "Full-scale problem solver CLI: Pydantic decomposition, Rich UI, HITL plan approval, self-healing code executor." },
        { day: 9, title: "Day 9: The Agentic Mindset: Autonomous Reasoning Loops", url: "day_09.html", tags: "pomdp react loop quadratic token reflexion episodic critique multi-path tool fallback", desc: "POMDP formalization, quadratic token telemetry, bounded ReAct loop, Reflexion episodic critique engine." },
        { day: 10, title: "Day 10: Dynamic Tool Selection & Registries", url: "day_10.html", tags: "tool registry semantic tool index vector embeddings two stage retrieval parameter coercion", desc: "Dynamic tool registries, two-stage semantic tool index, resilient parameter coercion engine." },
        { day: 11, title: "Day 11: Introduction to Vector RAG Pipelines", url: "day_11.html", tags: "vector geometry cosine similarity hnsw graph chromadb semantic chunking numpy search", desc: "Vector geometry math, HNSW graph indexing, ChromaDB RAG, semantic chunker with sliding overlap." },
        { day: 12, title: "Day 12: Improving Retrieval Quality: BM25 & Hybrid Search", url: "day_12.html", tags: "okapi bm25 inverted index hybrid search reciprocal rank fusion rrf cross encoder rerank", desc: "Okapi BM25 formula from scratch, Bi-Encoder vs Cross-Encoder, Reciprocal Rank Fusion (k=60), Cross-Encoder re-ranker." },
        { day: 13, title: "Day 13: Framework Abstractions: LangChain Core & LCEL", url: "day_13.html", tags: "lcel monadic composition runnable astream streaming runnablebranch fallback chains", desc: "LCEL monadic composition (g | f), real-time streaming, dynamic RunnableBranch router, fallback chains." },
        { day: 14, title: "Day 14: Visual Agentic Workflows with n8n", url: "day_14.html", tags: "n8n visual workflow hmac sha256 webhook fastapi receiver dead letter queue dlq", desc: "HMAC-SHA256 webhook cryptography, full n8n JSON workflow specification, FastAPI receiver, DLQ bridge." },
        { day: 15, title: "Day 15: Agentic RAG: Self-Correction & Multi-Hop Reasoning", url: "day_15.html", tags: "agentic rag self-rag reflection tokens multi-silo query rewriting document grading multi-hop", desc: "Self-RAG reflection tokens, multi-silo retrieval (ChromaDB + SQLite + Python), document grading, query re-writer." },
        { day: 16, title: "Day 16: Capstone: Multi-Silo Enterprise Knowledge Agent", url: "day_16.html", tags: "capstone enterprise hr knowledge agent chromadb sqlite session memory citation auditor cli", desc: "Multi-silo enterprise agent fusing ChromaDB policy store, SQLite HRIS records, safe calculator, citation auditor." },
        { day: 17, title: "Day 17: LangGraph Fundamentals: State & Cyclic Graphs", url: "day_17.html", tags: "langgraph fsm mealy stategraph channel reducers operator add cyclic code refiner mermaid", desc: "Mealy-type FSM state transition math, StateGraph channel reducers (operator.add), cyclic self-refining code evaluator." },
        { day: 18, title: "Day 18: Agent Persistence, Memory & State Management", url: "day_18.html", tags: "sqlitesaver postgres checkpoint time travel debugging thread isolation crash recovery", desc: "Storage footprint Ω(N) & RTO equations, SqliteSaver crash recovery, time-travel debugging with update_state." },
        { day: 19, title: "Day 19: Multi-Agent Systems & Swarm Architectures", url: "day_19.html", tags: "dec-pomdp multi-agent supervisor worker subgraph encapsulation peer swarm handoffs", desc: "Dec-POMDP formalization, quadratic context savings, hierarchical supervisor, peer-to-peer swarm with handoffs." },
        { day: 20, title: "Day 20: Security, Guardrails & Defensive Engineering", url: "day_20.html", tags: "agent security risk index prompt injection confused deputy pii secret sanitizer hitl interrupt", desc: "Agent Security Risk Index, multi-vector ingestion guardrail, reversible PII/secret sanitizer, LangGraph interrupt_before." },
        { day: 21, title: "Day 21: UI & Productionization: Streaming & Webhooks", url: "day_21.html", tags: "server sent events sse wire protocol fastapi sse streaming streamlit cockpit", desc: "SSE wire protocol specification, TTFT/TPOT latency dynamics, FastAPI async SSE server, Streamlit Agent Studio." },
        { day: 22, title: "Day 22: Shipping Real Agents: Testing, Eval & CI/CD", url: "day_22.html", tags: "sre availability mtbf mttr pytest regression harness docker non root github actions ci cd", desc: "SRE availability modeling, production-hardened agent, automated PyTest regression harness, multi-stage Docker & CI/CD." },
        { day: 23, title: "Day 23: Milestone Project: Self-Recovering Distributed Agent", url: "day_23.html", tags: "milestone saga pattern idempotency zero duplicate crash reboot streamlit cockpit", desc: "Distributed Saga pattern, zero-duplicate idempotency after crash reboot, Streamlit operations approval cockpit." },
        { day: 24, title: "Day 24: Grand Capstone: Cyber-Physical Automotive Diagnostic Assistant", url: "day_24.html", tags: "capstone automotive can bus obd-ii pid decoding iso 26262 asil safety gate oem rag", desc: "SAE J1979 Mode 01 PID decoding, ISO 26262 ASIL safety risk gate, synthetic CAN bus frame streamer, master cockpit UI." }
    ];

    // Build modal markup if not already present
    let overlay = document.getElementById('search-modal-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'search-modal-overlay';
        overlay.className = 'search-modal-overlay';
        overlay.innerHTML = `
            <div class="search-modal-container">
                <div class="search-modal-header">
                    <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                    <input type="text" class="search-input" id="search-modal-input" placeholder="Search lessons, concepts, algorithms, projects (e.g. LangGraph, ReAct, OBD-II)..." autocomplete="off">
                    <button class="search-close-btn" id="search-close-btn">ESC</button>
                </div>
                <div class="search-results-container" id="search-modal-results"></div>
                <div class="search-footer-hint">
                    <span>Use <kbd class="search-kbd">↑</kbd> <kbd class="search-kbd">↓</kbd> to navigate</span>
                    <span><kbd class="search-kbd">ENTER</kbd> to select</span>
                    <span><kbd class="search-kbd">ESC</kbd> to close</span>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
    }

    const input = overlay.querySelector('#search-modal-input');
    const resultsContainer = overlay.querySelector('#search-modal-results');
    const closeBtn = overlay.querySelector('#search-close-btn');

    let selectedIndex = 0;
    let currentResults = [];

    function renderResults(results) {
        currentResults = results;
        selectedIndex = 0;
        if (!results.length) {
            resultsContainer.innerHTML = '<div class="search-empty">No matching modules or topics found. Try searching for "LangGraph", "RAG", "Pydantic", "OBD-II", or "Prompt".</div>';
            return;
        }

        resultsContainer.innerHTML = results.map((item, idx) => {
            const isDayDisabled = false;
            return `
            <a href="${item.url}" class="search-result-item ${idx === 0 ? 'selected' : ''} ${isDayDisabled ? 'disabled' : ''}" data-index="${idx}" data-disabled="${isDayDisabled}">
                <div class="search-result-header">
                    <span class="search-result-title">${item.title}</span>
                    <span class="search-badge">${item.day === 0 ? 'OVERVIEW' : (isDayDisabled ? 'COMING SOON' : 'DAY ' + item.day)}</span>
                </div>
                <div class="search-result-desc">${item.desc}</div>
            </a>
        `;
        }).join('');

        // Attach click handlers
        resultsContainer.querySelectorAll('.search-result-item').forEach(el => {
            el.addEventListener('mouseenter', () => {
                resultsContainer.querySelectorAll('.search-result-item').forEach(r => r.classList.remove('selected'));
                el.classList.add('selected');
                selectedIndex = parseInt(el.getAttribute('data-index'), 10);
            });
            el.addEventListener('click', (e) => {
                if (el.getAttribute('data-disabled') === 'true') {
                    e.preventDefault();
                    e.stopPropagation();
                    closeModal();
                    showToast('Content is getting created.');
                }
            });
        });
    }

    function openModal() {
        overlay.classList.add('active');
        input.value = '';
        renderResults(courseIndex);
        setTimeout(() => input.focus(), 50);
    }

    function closeModal() {
        overlay.classList.remove('active');
    }

    searchBtns.forEach(btn => {
        btn.addEventListener('click', openModal);
        btn.setAttribute('title', 'Quick Search (Ctrl + K)');
    });
    closeBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeModal();
    });

    // Keyboard navigation
    input.addEventListener('input', (e) => {
        const q = e.target.value.toLowerCase().trim();
        if (!q) {
            renderResults(courseIndex);
            return;
        }
        const filtered = courseIndex.filter(item => 
            item.title.toLowerCase().includes(q) ||
            item.tags.toLowerCase().includes(q) ||
            item.desc.toLowerCase().includes(q)
        );
        renderResults(filtered);
    });

    input.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (currentResults.length > 0) {
                selectedIndex = (selectedIndex + 1) % currentResults.length;
                updateSelection();
            }
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (currentResults.length > 0) {
                selectedIndex = (selectedIndex - 1 + currentResults.length) % currentResults.length;
                updateSelection();
            }
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (currentResults[selectedIndex]) {
                if (false) {
                    closeModal();
                    showToast('Content is getting created.');
                } else {
                    window.location.href = currentResults[selectedIndex].url;
                }
            }
        } else if (e.key === 'Escape') {
            closeModal();
        }
    });

    function updateSelection() {
        const items = resultsContainer.querySelectorAll('.search-result-item');
        items.forEach((item, idx) => {
            if (idx === selectedIndex) {
                item.classList.add('selected');
                item.scrollIntoView({ block: 'nearest' });
            } else {
                item.classList.remove('selected');
            }
        });
    }

    // Global shortcut: Ctrl+K or Cmd+K
    window.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
            e.preventDefault();
            if (overlay.classList.contains('active')) {
                closeModal();
            } else {
                openModal();
            }
        }
    });
}

// =========================================================
// Top Navigation: Print Button
// =========================================================
function initPrintButton() {
    const printBtns = document.querySelectorAll('.icon-btn[aria-label="Print"]');
    printBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            window.print();
        });
        btn.setAttribute('title', 'Print Lesson / Save PDF');
    });
}

// =========================================================
// Top Navigation: GitHub Repository Link
// =========================================================
function initGitHubButton() {
    const githubBtns = document.querySelectorAll('.icon-btn[aria-label="GitHub"]');
    githubBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            window.open('https://github.com/kamallearner123/AgenticAIBook', '_blank', 'noopener,noreferrer');
        });
        btn.setAttribute('title', 'View GitHub Repository');
    });
}

// =========================================================
// Top Navigation: Mobile Hamburger Sidebar Toggle
// =========================================================
function initMobileMenu() {
    const toggleBtn = document.querySelector('.menu-toggle');
    const sidebar = document.querySelector('.sidebar');
    if (!toggleBtn || !sidebar) return;

    let backdrop = document.querySelector('.sidebar-backdrop');
    if (!backdrop) {
        backdrop = document.createElement('div');
        backdrop.className = 'sidebar-backdrop';
        document.body.appendChild(backdrop);
    }

    function toggleMenu() {
        const isOpen = sidebar.classList.toggle('open');
        backdrop.classList.toggle('active', isOpen);
    }

    function closeMenu() {
        sidebar.classList.remove('open');
        backdrop.classList.remove('active');
    }

    toggleBtn.addEventListener('click', toggleMenu);
    backdrop.addEventListener('click', closeMenu);
}

function initSidebarResize() {
    const sidebar = document.querySelector('.sidebar');
    if (!sidebar || window.matchMedia('(max-width: 900px)').matches) return;

    const handle = document.createElement('button');
    handle.type = 'button';
    handle.className = 'sidebar-resize-handle';
    handle.setAttribute('aria-label', 'Resize navigation sidebar');
    handle.title = 'Drag to resize navigation sidebar';
    sidebar.appendChild(handle);

    const savedWidth = Number.parseInt(localStorage.getItem('agentic-ai-sidebar-width'), 10);
    if (savedWidth) setSidebarWidth(savedWidth);

    let resizing = false;

    handle.addEventListener('pointerdown', (event) => {
        resizing = true;
        handle.setPointerCapture(event.pointerId);
        document.body.classList.add('resizing-sidebar');
        event.preventDefault();
    });

    handle.addEventListener('pointermove', (event) => {
        if (!resizing) return;
        setSidebarWidth(event.clientX);
    });

    const stopResizing = (event) => {
        if (!resizing) return;
        resizing = false;
        if (event.pointerId !== undefined && handle.hasPointerCapture(event.pointerId)) {
            handle.releasePointerCapture(event.pointerId);
        }
        document.body.classList.remove('resizing-sidebar');
        localStorage.setItem('agentic-ai-sidebar-width', getComputedStyle(sidebar).width);
    };

    handle.addEventListener('pointerup', stopResizing);
    handle.addEventListener('pointercancel', stopResizing);
}

function setSidebarWidth(width) {
    const clampedWidth = Math.min(Math.max(width, 220), Math.min(480, window.innerWidth * 0.45));
    document.documentElement.style.setProperty('--sidebar-width', `${clampedWidth}px`);
}

// Build expandable day groups with links to every lesson section.
const COURSE_SUBTOPICS = {
    "1": [
        "Module 1 \u2014 Python Foundations",
        "Module 2 \u2014 Variables, Types & Operators",
        "Module 3 \u2014 Control Flow",
        "Module 4 \u2014 Collections & Data Processing",
        "Module 5 \u2014 Functions",
        "Module 6 \u2014 Error Handling & Debugging",
        "Module 7 \u2014 Files & Data Formats (Text, CSV, JSON, YAML)",
        "Module 8 \u2014 Modules, Packages & Project Structure",
        "Module 9 \u2014 Object-Oriented Python & Dataclasses",
        "Module 10 \u2014 Database Programming (SQLite & SQL)",
        "Module 11 \u2014 Modern Python Typing",
        "Module 12 \u2014 Pydantic: Runtime Validation & Structured Output",
        "Module 13 \u2014 HTTP & REST APIs",
        "Module 14 \u2014 Environment Variables & Configuration",
        "Module 16 \u2014 Reliability & Production Python",
        "Module 18 \u2014 Python for AI/LLM Applications"
    ],
    "2": [
        "2.1. Traditional Programming vs. Machine Learning",
        "2.2. The Four Pillars of Machine Learning",
        "2.3. Deep Learning & Neural Networks",
        "2.4. The Breakthrough: Transformer Architecture",
        "2.5. Generative AI & Large Language Models (LLMs)",
        "2.6. Mathematical Foundations: Scaling Laws & Compute Dynamics",
        "2.7. The Autonomy Spectrum: From Chatbots to Agent Swarms",
        "2.8. Deep-Dive Code Implementations",
        "2.9. Why AI Systems Fail in Production: The 5 Anti-Patterns"
    ],
    "3": [
        "3.1. The Mechanical Reality: Next-Token Prediction",
        "3.2. Tokens vs. Words: The Anatomy of Subword Tokenization",
        "3.3. Embeddings: Giving Geometry to Meaning",
        "3.4. Context Windows & The Attention Bottleneck",
        "3.5. What Is Prompt Engineering?",
        "3.6. How Prompting Works With an LLM",
        "3.7. Anatomy of a Good Prompt \u2014 RCTNO",
        "3.8. Writing Clear Instructions",
        "3.9. Context, Constraints & Boundaries",
        "3.10. Output Formatting",
        "3.11. Zero-Shot Prompting",
        "3.12. Few-Shot Prompting"
    ],
    "4": [
        "4.1. Temperature, Logits & Softmax",
        "4.2. Training vs. Inference",
        "4.3. How an LLM is Trained",
        "4.4. Hallucination & Limitations of LLMs",
        "4.5. Hallucinations & Grounding",
        "4.6. Reasoning-Oriented Prompting / Chain-of-Thought",
        "4.7. Prompt Iteration & Evaluation",
        "4.8. Prompt Engineering for AI Agents"
    ],
    "5": [
        "5.1. System Prompts vs. User Prompts",
        "5.2. The Anatomy of a Specialist Persona",
        "5.3. Specialist Persona in Action",
        "5.4. Persona Examples Across Different Jobs",
        "5.5. Why \"Please Reply in JSON\" Isn't Enough",
        "5.6. Structured Outputs: Guaranteeing the Format You Need",
        "5.7. Structured Output Beyond JSON",
        "5.8. How the Model Actually Guarantees the Format",
        "5.9. Real-World Walkthrough: From Messy Input to Clean Output"
    ],
    "6": [
        "6.1. The Fundamental Limit of Text Prediction",
        "6.2. The Function Calling Lifecycle",
        "6.3. Implementing the Tool Execution Loop in Python",
        "6.4. Tool Error Handling & Self-Healing Retries",
        "6.5. The Function Calling Wire Protocol & Token Overhead Mathematics",
        "6.6. Deep-Dive Production Engineering Programs",
        "6.7. Tool Execution Security Best Practices"
    ],
    "7": [
        "7.1. The Monolithic Mega-Prompt Fallacy & Compound Reliability",
        "7.2. Architectural Patterns for Agentic Workflows",
        "7.3. Program 1: Sequential Prompt Chain with Validation Gates & Self-Correction",
        "7.4. Program 2: Parallel Fan-Out / Fan-In Async Aggregator",
        "7.5. Program 3: Resilient State Machine with Checkpointing & Audit Trail",
        "7.6. Production Failure Modes & Engineering Gotchas",
        "7.7. Monolithic Mega-Prompt vs. Chained Pipeline Comparison"
    ],
    "8": [
        "8.1. Problem Solver Cognitive Architecture",
        "8.2. Program 1: The Core Autonomous Problem Solver Engine",
        "8.3. Program 2: Interactive Terminal UI with Rich & Human-in-the-Loop (HITL)",
        "8.4. Program 3: Sandboxed Code Runner with Self-Healing Error Loop",
        "8.5. Production Failure Modes & Hardening Playbooks"
    ],
    "9": [
        "9.1. The Spectrum of AI Autonomy: Assistant vs. Workflow vs. Agent",
        "9.2. Mathematical Formalization: The Agent as a Markov Decision Process (MDP)",
        "9.3. Program 1: Production Bounded ReAct Agent Loop with Token Telemetry",
        "9.4. Program 2: The Reflexion Architecture (Self-Critique & Memory)",
        "9.5. Program 3: Multi-Path Tool Selection with Dynamic Fallback",
        "9.6. Production Failure Modes & Engineering Gotchas",
        "9.7. Assistant vs. Workflow vs. Agent Architectural Matrix"
    ],
    "10": [
        "10.1. The Mechanics of Dynamic Tool Selection",
        "10.2. Theory: Two-Stage Semantic Tool Retrieval for Large Catalogs",
        "10.3. Program 1: Dynamic Multi-Tool Registry with Pydantic v2 Introspection",
        "10.4. Program 2: Two-Stage Semantic Tool Retrieval Engine",
        "10.5. Program 3: Resilient Tool Dispatcher with Auto-Coercion & Error Healing",
        "10.6. Production Failure Modes & Engineering Gotchas",
        "10.7. Tool Description Engineering Guidelines"
    ],
    "11": [
        "11.1. The RAG Paradigm: Open-Book Grounding",
        "11.2. Mathematical Foundation: Vector Geometry & HNSW Graph Indexing",
        "11.3. Program 1: Production ChromaDB RAG Pipeline with Metadata Filtering",
        "11.4. Program 2: Pure Python Recursive Semantic Chunking Engine",
        "11.5. Program 3: NumPy Vector Search Engine (Cosine Similarity from Scratch)",
        "11.6. Production Failure Modes & Engineering Gotchas",
        "11.7. Chunking Strategy Comparison Matrix"
    ],
    "12": [
        "12.1. The Bi-Encoder Bottleneck & Semantic Drift",
        "12.2. Mathematical Formulations: BM25, RRF & Cross-Encoders",
        "12.3. Program 1: Pure Python BM25 Inverted Index & Scoring Engine",
        "12.4. Program 2: Complete Hybrid Search & Reciprocal Rank Fusion (RRF)",
        "12.5. Program 3: Cross-Encoder Re-Ranking & Contextual Compression",
        "12.6. Production Failure Modes & Engineering Gotchas",
        "12.7. Retrieval Architecture Comparison Matrix"
    ],
    "13": [
        "13.1. The Evolution of LangChain: From Black-Box Chains to LCEL",
        "13.2. Mathematical Formalization: The Runnable Protocol & Monadic Composition",
        "13.3. Program 1: Declarative RAG Pipeline with Streaming Token Iteration",
        "13.4. Program 2: Multi-Branch Dynamic Router with Pydantic Schema Validation",
        "13.5. Program 3: Resilient Chains with Model Fallbacks & Automatic Retries",
        "13.6. Production Failure Modes & Engineering Gotchas",
        "13.7. Raw Python API vs. Modern LCEL Comparison Matrix"
    ],
    "14": [
        "14.1. The Hybrid AI Architecture: Code-First Models + Low-Code Mesh",
        "14.2. Cryptographic Webhook Security: HMAC-SHA256 & Replay Protection",
        "14.3. Program 1: Declarative n8n AI Agent Workflow Specification (JSON)",
        "14.4. Program 2: Production Python FastAPI Webhook Receiver with HMAC Security",
        "14.5. Program 3: Resilient Python-to-n8n Bridge with Dead-Letter Queue (DLQ)",
        "14.6. Production Failure Modes & Engineering Gotchas",
        "14.7. Code-First vs. Visual Low-Code (n8n) Comparison Matrix"
    ],
    "15": [
        "15.1. The Paradigm Shift: From Fixed Pipeline to Agentic Routing",
        "15.2. Theory: Self-RAG Reflection & Adaptive Routing Mathematics",
        "15.3. Program 1: Production Multi-Silo Agentic RAG (Vector + SQLite + Math)",
        "15.4. Program 2: Self-Reflective Retrieval with Automatic Query Rewriting",
        "15.5. Program 3: Multi-Hop Document Reasoning Agent",
        "15.6. Production Failure Modes & Engineering Gotchas",
        "15.7. Traditional RAG vs. Agentic RAG Comparison Matrix"
    ],
    "16": [
        "16.1. System Architecture: Multi-Tier Knowledge Mesh",
        "16.2. Theory: Groundedness & Faithfulness Verification Metrics",
        "16.3. Program 1: The Complete Company Knowledge Agent Core Engine",
        "16.4. Program 2: Automated Faithfulness & Citation Validator",
        "16.5. Program 3: Multi-Turn Interactive CLI with Session Memory",
        "16.6. Production Failure Modes & Hardening Playbooks"
    ],
    "17": [
        "17.1. Theoretical Foundations: State Machines vs. Directed Acyclic Graphs",
        "17.2. Architecture Blueprint: The LangGraph Runtime Engine",
        "17.4. Complete Python Implementation 1: StateGraph with Reducers & Message History",
        "17.5. Complete Python Implementation 2: Cyclic Self-Refining Code Generator with Bounded Loop",
        "17.6. Complete Python Implementation 3: Multi-Branch Routing Graph with State Inspection",
        "17.7. Production Failure Modes & Anti-Patterns",
        "17.8. Interactive Knowledge Verification: 10 Examination Questions",
        "17.9. Hands-On Engineering Assignments"
    ],
    "18": [
        "18.1. Mathematical Formalization of Checkpoint Storage & Recovery",
        "18.2. Architecture Blueprint: The Checkpointer Storage Subsystem",
        "18.3. Production Checkpointer Storage Matrix",
        "18.4. Complete Python Implementation 1: SqliteSaver with Crash Simulation & Recovery",
        "18.5. Complete Python Implementation 2: Time-Travel Debugging & State Forking",
        "18.6. Complete Python Implementation 3: Multi-Tenant Concurrency & Thread Isolation",
        "18.7. Production Failure Modes & Operational Gotchas",
        "18.8. Interactive Knowledge Verification: 10 Examination Questions",
        "18.9. Hands-On Engineering Assignments"
    ],
    "19": [
        "19.1. Formal Foundations: Multi-Agent Decision Processes & Attention Capacity",
        "19.2. Architecture Blueprint: Hierarchical Supervisor vs. Peer-to-Peer Swarms",
        "19.3. Complete Python Implementation 1: Deterministic Hierarchical Supervisor Pattern",
        "19.4. Complete Python Implementation 2: Subgraph Composition & Hierarchical Delegation",
        "19.5. Complete Python Implementation 3: Peer-to-Peer Swarm with Deadlock Prevention",
        "19.6. Production Failure Modes & Architectural Anti-Patterns",
        "19.7. Interactive Knowledge Verification: 10 Examination Questions",
        "19.8. Hands-On Engineering Assignments"
    ],
    "20": [
        "20.1. Formal Threat Modeling: The Agent Attack Surface (OWASP Top 10 for LLMs)",
        "20.2. Architecture Blueprint: The 4-Tier Defense-in-Depth Model",
        "20.3. Complete Python Implementation 1: Ingestion Guardrail Engine",
        "20.4. Complete Python Implementation 2: Automated PII & Secret Redactor",
        "20.5. Complete Python Implementation 3: LangGraph Human-in-the-Loop Approval Gate",
        "20.6. Production Failure Modes & Real-World CVEs",
        "20.7. Interactive Knowledge Verification: 10 Examination Questions",
        "20.8. Hands-On Engineering Assignments"
    ],
    "21": [
        "21.1. Formal Mechanics of Real-Time Agent Streaming: SSE Protocol & Latency Dynamics",
        "21.2. Architecture Blueprint: The 4-Tier Enterprise Agent Stack",
        "21.3. Complete Python Implementation 1: Production FastAPI Backend with SSE Token Streaming",
        "21.4. Complete Python Implementation 2: Streamlit Studio with Thought Accordions & HITL Gate",
        "21.5. Complete Python Implementation 3: SSE Streaming Client with Disconnect Handling",
        "21.6. Production Failure Modes & Operational Gotchas",
        "21.7. Interactive Knowledge Verification: 10 Examination Questions",
        "21.8. Hands-On Engineering Assignments"
    ],
    "22": [
        "22.1. Formal SRE Metrics for Autonomous Agents",
        "22.2. Architecture Blueprint: The SRE Observability & Containerization Lifecycle",
        "22.3. Complete Python Implementation 1: End-to-End Hardened Enterprise Agent",
        "22.4. Complete Python Implementation 2: Automated PyTest Regression Harness",
        "22.5. Production Multi-Stage Dockerfile & GitHub Actions CI/CD",
        "22.6. Production Failure Modes & Operational Gotchas",
        "22.7. Interactive Knowledge Verification: 10 Examination Questions",
        "22.8. Hands-On Engineering Assignments"
    ],
    "23": [
        "23.1. Formal Foundations: The Saga Pattern & State Recovery Guarantees",
        "23.2. Architecture Blueprint: The Recoverable System Topology",
        "23.3. Complete Python Implementation 1: The Resilient Backend Engine",
        "23.4. Complete Python Implementation 2: Streamlit Human Approval Cockpit UI",
        "23.5. Complete Python Implementation 3: Crash-Injection & Automated Recovery Benchmark",
        "23.6. Production Failure Modes & Mitigation Strategies",
        "23.7. Interactive Knowledge Verification: 10 Examination Questions",
        "23.8. Hands-On Engineering Assignments"
    ],
    "24": [
        "24.1. Formal Foundations: Cyber-Physical Automotive Protocols & ISO 26262 ASIL Risk",
        "24.2. Architecture Blueprint: The End-to-End Automotive Diagnostics Pipeline",
        "24.3. Complete Python Implementation 1: The Automotive Diagnostics Engine",
        "24.4. Complete Python Implementation 2: Synthetic CAN Bus Telemetry Streamer",
        "24.5. Complete Python Implementation 3: Streamlit Automotive Cockpit UI",
        "24.6. Production Failure Modes & Automotive Gotchas",
        "24.7. Interactive Knowledge Verification: 10 Final Capstone Questions",
        "24.8. Hands-On Capstone Certification Assignments"
    ]
};

function initSubtopicNavigation() {
    const article = document.querySelector('article.book-page');
    const dayLinks = Array.from(document.querySelectorAll('.toc > li > a[href^="day_"]'));
    if (!dayLinks.length) return;

    const currentPage = window.location.pathname.split('/').pop() || 'index.html';

    dayLinks.forEach((dayLink) => {
        const dayItem = dayLink.parentElement;
        const dayMatch = dayLink.getAttribute('href').match(/day_(\d+)/);
        if (!dayMatch) return;

        const dayNumber = Number.parseInt(dayMatch[1], 10);
        const dayPage = dayLink.getAttribute('href');

        if (dayItem.querySelector('details')) return;

        const details = document.createElement('details');
        details.className = 'day-toc-group';
        details.open = (dayPage === currentPage);

        const summary = document.createElement('summary');
        summary.appendChild(dayLink.cloneNode(true));
        details.appendChild(summary);
        dayItem.replaceChildren(details);

        // Load pre-defined subtopics
        const topics = COURSE_SUBTOPICS[dayNumber] || [];
        if (topics.length) {
            const subtopics = document.createElement('ul');
            subtopics.className = 'toc-subtopics';
            subtopics.setAttribute('aria-label', `Day ${dayNumber} subtopics`);

            topics.forEach((topicText, index) => {
                const topicId = `day-${String(dayNumber).padStart(2, '0')}-topic-${index + 1}`;
                const item = document.createElement('li');
                const link = document.createElement('a');
                link.href = (dayPage === currentPage) ? `#${topicId}` : `${dayPage}#${topicId}`;
                link.textContent = topicText;
                item.appendChild(link);
                subtopics.appendChild(item);
            });
            details.appendChild(subtopics);
        }
    });

    // Subtopic click smooth scrolling
    document.querySelectorAll('.toc-subtopics a').forEach((link) => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            if (!href) return;
            const isCurrentPageAnchor = href.startsWith('#') || href.startsWith(currentPage + '#');
            if (isCurrentPageAnchor) {
                const targetId = href.split('#')[1];
                const targetEl = document.getElementById(targetId);
                if (targetEl) {
                    e.preventDefault();
                    targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    history.pushState(null, '', '#' + targetId);
                }
            }
        });
    });

    scrollToRequestedTopic();
}

function getLessonHeadings(root) {
    return Array.from(root.querySelectorAll('article.book-page h2, main h2'))
        .filter(heading => /^\d+\.\d+\.\s/.test(heading.textContent.trim()));
}

function addSubtopicLinks(details, dayNumber, headings, page) {
    if (!headings.length || details.querySelector('.toc-subtopics')) return;

    const subtopics = document.createElement('ul');
    subtopics.className = 'toc-subtopics';
    subtopics.setAttribute('aria-label', `Day ${dayNumber} subtopics`);

    headings.forEach((heading, index) => {
        const topicId = `day-${String(dayNumber).padStart(2, '0')}-topic-${index + 1}`;
        if (!heading.id) heading.id = topicId;

        const item = document.createElement('li');
        const link = document.createElement('a');
        link.href = `${page}#${topicId}`;
        link.textContent = heading.textContent.trim();
        item.appendChild(link);
        subtopics.appendChild(item);
    });

    details.appendChild(subtopics);
}

function scrollToRequestedTopic() {
    const targetId = window.location.hash.slice(1);
    if (!targetId) return;
    const target = document.getElementById(targetId);
    if (target) target.scrollIntoView();
}

function initMathRendering() {
    const katexCss = document.createElement('link');
    katexCss.rel = 'stylesheet';
    katexCss.href = 'https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css';
    document.head.appendChild(katexCss);

    const autoRender = document.createElement('script');
    autoRender.src = 'https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/contrib/auto-render.min.js';
    autoRender.onload = () => {
        renderMathInElement(document.body, {
            delimiters: [
                { left: '$$', right: '$$', display: true },
                { left: '$', right: '$', display: false },
                { left: '\\(', right: '\\)', display: false },
                { left: '\\[', right: '\\]', display: true }
            ],
            throwOnError: false
        });
    };
    document.head.appendChild(autoRender);
}


// Interactive MCQ Checker for radio-button quiz cards
function checkMCQ(questionId, correctAnswer, explanation) {
    const card = document.getElementById(questionId);
    if (!card) return;
    
    const selected = card.querySelector(`input[name="${questionId}"]:checked`);
    const feedbackEl = card.querySelector('.feedback');
    if (!feedbackEl) return;
    
    if (!selected) {
        feedbackEl.innerHTML = '<span style="color: #f59e0b; font-weight: 600;">⚠️ Please select an answer before checking!</span>';
        feedbackEl.style.display = 'block';
        return;
    }
    
    if (selected.value === correctAnswer) {
        feedbackEl.innerHTML = `<span style="color: #10b981; font-weight: 600;">✓ ${explanation}</span>`;
    } else {
        feedbackEl.innerHTML = `<span style="color: #ef4444; font-weight: 600;">✗ Incorrect. Try again!</span>`;
    }
    feedbackEl.style.display = 'block';
}

// Copy button functionality for code snippets
function copyCode(button) {
    const container = button.closest('.code-header') ? button.closest('.code-header').nextElementSibling : button.parentElement;
    const code = container ? container.querySelector('code') : null;
    const textToCopy = code ? code.innerText : '';
    
    if (textToCopy) {
        navigator.clipboard.writeText(textToCopy).then(() => {
            const originalText = button.innerText;
            button.innerText = 'Copied!';
            button.style.backgroundColor = 'var(--accent-color, #10b981)';
            button.style.color = '#fff';
            setTimeout(() => {
                button.innerText = originalText;
                button.style.backgroundColor = '';
                button.style.color = '';
            }, 2000);
        });
    }
}

// =========================================================
// Toast Notification for Unreleased Modules
// =========================================================
let toastTimeout = null;
function showToast(message = 'Content is getting created.') {
    let toast = document.getElementById('course-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'course-toast';
        toast.className = 'course-toast';
        toast.setAttribute('role', 'status');
        toast.setAttribute('aria-live', 'polite');
        toast.innerHTML = `
            <div class="toast-icon">
                <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
            </div>
            <div class="toast-message">${message}</div>
        `;
        document.body.appendChild(toast);
    } else {
        const msgEl = toast.querySelector('.toast-message');
        if (msgEl) msgEl.textContent = message;
    }

    toast.classList.remove('visible');
    void toast.offsetWidth; // Force DOM reflow to re-trigger transition animation
    toast.classList.add('visible');

    if (toastTimeout) {
        clearTimeout(toastTimeout);
    }
    toastTimeout = setTimeout(() => {
        toast.classList.remove('visible');
    }, 3200);
}

// =========================================================
// Intercept Other Lesson Links pointing to Day 05-24
// =========================================================
function initDisabledLinks() {
    // All 24 days are fully enabled
}

// =========================================================
// Interactive Multiple Choice Questions (MCQ) Handler
// =========================================================
function initMCQInteractivity() {
    document.addEventListener('click', (e) => {
        const option = e.target.closest('.mcq-option');
        if (option) {
            const container = option.closest('.mcq-container');
            if (!container) return;

            container.querySelectorAll('.mcq-option').forEach(opt => {
                opt.classList.remove('selected', 'correct', 'incorrect');
                opt.style.background = '';
            });

            option.classList.add('selected');

            const submitBtn = container.querySelector('.mcq-submit');
            if (submitBtn) {
                submitBtn.disabled = false;
            }

            const feedback = container.querySelector('.mcq-feedback');
            if (feedback) {
                feedback.style.display = 'none';
                feedback.classList.remove('correct', 'incorrect');
            }
            return;
        }

        const submitBtn = e.target.closest('.mcq-submit');
        if (submitBtn) {
            const container = submitBtn.closest('.mcq-container');
            if (!container) return;

            const selected = container.querySelector('.mcq-option.selected');
            const feedback = container.querySelector('.mcq-feedback');
            if (!selected || !feedback) return;

            const isCorrect = selected.getAttribute('data-correct') === 'true';

            if (!feedback.getAttribute('data-raw-explanation')) {
                const cleanedText = feedback.textContent.replace(/^[✓✗]\s*(Correct answer!?|Incorrect\.?|Correct!?)\s*/i, '').trim();
                feedback.setAttribute('data-raw-explanation', cleanedText);
            }
            const explanation = feedback.getAttribute('data-raw-explanation') || '';

            container.querySelectorAll('.mcq-option').forEach(opt => opt.classList.remove('correct', 'incorrect'));
            feedback.classList.remove('correct', 'incorrect');

            if (isCorrect) {
                selected.classList.add('correct');
                feedback.classList.add('correct');
                feedback.innerHTML = `<strong>✓ Correct!</strong> ${explanation || 'Great job mastering this concept!'}`;
            } else {
                selected.classList.add('incorrect');
                const correctOption = container.querySelector('.mcq-option[data-correct="true"]');
                if (correctOption) {
                    correctOption.classList.add('correct');
                }
                feedback.classList.add('incorrect');
                feedback.innerHTML = `<strong>✗ Incorrect.</strong> ${explanation || 'Review the lesson above and try again!'}`;
            }

            feedback.style.display = 'block';
            return;
        }
    });
}


