document.addEventListener('DOMContentLoaded', () => {
    initThemeToggle();
    initSearchModal();
    initPrintButton();
    initGitHubButton();
    initSidebarToggle();
    initSubtopicNavigation();
    initSidebarScrollRestoration();
    initSidebarResize();
    initMCQInteractivity();
    initChapterCompletion();
    initChapterNotesAndQuestions();
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
        localStorage.setItem('embedded-theme', nextTheme);
        updateThemeIcon(nextTheme);
    });
}

// =========================================================
// Top Navigation: Spotlight Search Modal (Ctrl/Cmd + K)
// =========================================================
function initSearchModal() {
    const searchBtns = document.querySelectorAll('.icon-btn[aria-label="Search"]');

    // Course Search Index data covering all 25 Embedded C Programming topics
    const courseIndex = [
        { day: 0, title: "Course Overview & Curriculum Map", url: "index.html", tags: "intro roadmap syllabus architecture embedded c standards", desc: "Overview of the 25-topic Embedded C Programming curriculum." },
        { day: "intro", title: "Introduction: Why Program on Constrained Devices?", url: "intro.html", tags: "intro constrained smartwatch drone medical device microcontroller sensor actuator bldc ppg imu power real-time", desc: "Why over 98% of processors are embedded: Smartwatch, Drone, and Medical Device case studies; Microcontrollers, Sensors, and Actuators anatomy." },
        { day: 1, title: "Topic 1: C Programming History & Tools", url: "topic_01.html", tags: "c history standards c99 c11 tools compiler toolchain embedded", desc: "Evolution of C, ANSI/C99/C11 standards, embedded toolchain overview and fundamentals." },
        { day: 2, title: "Topic 2: C Programming Best Practices", url: "topic_02.html", tags: "best practices fixed width types const volatile bounds deterministic memory", desc: "Deterministic coding, fixed-width integers, side-effect elimination, const-correctness." },
        { day: 3, title: "Topic 3: Compile, Runtime, Link & Logic Errors", url: "topic_03.html", tags: "errors compilation linking runtime undefined behavior sequence points memory corruption", desc: "Taxonomy of bugs: compiler diagnostics, linker multiple definitions, runtime undefined behavior." },
        { day: 4, title: "Topic 4: Assertions, Logging & Debugging Methodology", url: "topic_04.html", tags: "assertions assert logging ring buffer printf retargeting debugging gdb", desc: "Target assertions, non-blocking telemetry loggers, UART printf retargeting, systematic debugging." },
        { day: 5, title: "Topic 5: Unit Testing Concepts", url: "topic_05.html", tags: "unit testing tdd unity ceedling mocks test runners host simulation", desc: "Host-based firmware unit testing, mocking hardware peripherals, Unity framework patterns." },
        { day: 6, title: "Topic 6: Build Pipeline", url: "topic_06.html", tags: "build pipeline preprocessor compiler assembler linker elf binary translation unit", desc: "Step-by-step pipeline from C source through cpp, cc1, as, ld to relocatable object and ELF." },
        { day: 7, title: "Topic 7: GCC & Cross-Compilers", url: "topic_07.html", tags: "gcc cross compiler arm-none-eabi optimization flags abi sysroot wall wextra", desc: "Cross-compilation targets, target triplets, compiler optimization flags, warning configurations." },
        { day: 8, title: "Topic 8: objdump, size, nm & GDB", url: "topic_08.html", tags: "objdump size nm gdb disassembly symbols memory sections dwarf elf inspection", desc: "Inspecting symbols, section sizes, disassembly analysis, and interactive GDB debugging." },
        { day: 9, title: "Topic 9: Make & CMake Basics", url: "topic_09.html", tags: "make cmake build automation makefile rules dependencies targets out-of-tree", desc: "Automating builds with Makefiles, pattern rules, and modern cross-platform CMake targets." },
        { day: 10, title: "Topic 10: Git Workflow for Firmware", url: "topic_10.html", tags: "git workflow submodules hal vendor version control gitignore binary assets", desc: "Version control for firmware teams, submodule management for vendor HALs, commit hygiene." },
        { day: 11, title: "Topic 11: Events & Event Handling", url: "topic_11.html", tags: "events event handling event loop publisher subscriber reactive decoupling", desc: "Event-driven reactive firmware, event queues, decoupled producer-consumer architectures." },
        { day: 12, title: "Topic 12: Polling vs Interrupts", url: "topic_12.html", tags: "polling interrupts latency jitter nvic isr critical sections race conditions", desc: "Comparing busy-wait polling with hardware interrupts, latency analysis, and ISR race conditions." },
        { day: 13, title: "Topic 13: Callbacks & Hardware Timers", url: "topic_13.html", tags: "callbacks function pointers hardware timers timer wheels periodic events", desc: "Function pointers in C, callback registration patterns, hardware timer interrupt hooks." },
        { day: 14, title: "Topic 14: Non-Blocking Firmware Design", url: "topic_14.html", tags: "non-blocking superloop delay elimination state progression systick millis cooperative", desc: "Eliminating blocking delay loops, cooperative superloop scheduling, timestamp arithmetic." },
        { day: 15, title: "Topic 15: Naming Conventions & Code Style", url: "topic_15.html", tags: "naming conventions code style barr group standards prefixes typedefs consistency", desc: "Industrial C naming conventions, prefix encapsulation, typedef rules, readability standards." },
        { day: 16, title: "Topic 16: Defensive Programming", url: "topic_16.html", tags: "defensive programming input validation bounds check stuck sensors watchdog recovery", desc: "Input sanitization, buffer boundary guards, stuck sensor fail-safes, watchdog heartbeats." },
        { day: 17, title: "Topic 17: Documentation Practices", url: "topic_17.html", tags: "documentation doxygen comments architecture adr register maps specifications", desc: "Doxygen documentation standards, architecture decision records, register interface specs." },
        { day: 18, title: "Topic 18: MISRA-C Concepts", url: "topic_18.html", tags: "misra-c safety critical automotive static analysis cppcheck compliance rules", desc: "MISRA-C:2012 core rules, undefined behavior prevention, static analysis automation." },
        { day: 19, title: "Topic 19: States, Events & Transitions", url: "topic_19.html", tags: "state machines fsm states events transitions uml statecharts mealy moore", desc: "Finite-state machine theory, transition matrices, event dispatching, state invariants." },
        { day: 20, title: "Topic 20: State Tables & Finite-State Machines", url: "topic_20.html", tags: "state tables function pointers fsm hierarchical state machines switch case engine", desc: "Tabular 2D function pointer state engines, state transition tables, hierarchical FSM design." },
        { day: 21, title: "Topic 21: Modular .c & .h Files", url: "topic_21.html", tags: "modular architecture header files encapsulation include guards pragma once static private", desc: "Header separation, translation unit isolation, static private functions, minimal coupling." },
        { day: 22, title: "Topic 22: Interfaces, APIs & Abstraction", url: "topic_22.html", tags: "interfaces api abstraction opaque pointers pimpl vtable hardware decoupling", desc: "Opaque pointers, struct interface tables, hardware-agnostic API design in pure C." },
        { day: 23, title: "Topic 23: Reusable Firmware Components", url: "topic_23.html", tags: "reusable components ring buffer software timer pid controller packet parser", desc: "Industrial reusable C modules: lock-free ring buffer, software timers, packet stream parsers." },
        { day: 24, title: "Topic 24: Application, Driver, HAL & BSP Layers", url: "topic_24.html", tags: "layered architecture bsp hal drivers application abstraction separation", desc: "Architectural layering: Application, Middleware, HAL, and Board Support Package (BSP)." },
        { day: 25, title: "Topic 25: Integrated Firmware Architecture (Capstone)", url: "topic_25.html", tags: "capstone architecture integrated firmware event queue fsm bsp drivers telemetry", desc: "Grand capstone: fully integrated event-driven firmware project tying all concepts together." },
        { day: "p1", title: "Project 1: Module 1 Milestone — C Foundations & Diagnostics", url: "project_01.html", tags: "project milestone module 1 telemetry crc assert unit testing linux wsl stm32 bare metal gpio", desc: "Dual Project: Linux telemetry packet decoder with Unity & AddressSanitizer; STM32 bare-metal GPIO assert diagnostics." },
        { day: "p2", title: "Project 2: Module 2 Milestone — Toolchains, Linker Scripts & Bloat Gate", url: "project_02.html", tags: "project milestone module 2 toolchain linker script bloat check nm size elf git pre-commit stm32 startup crt0", desc: "Dual Project: Linux automated binary bloat gate CLI; STM32 zero-IDE bare-metal firmware with custom linker script." },
        { day: "p3", title: "Project 3: Module 3 Milestone — Reactive Systems & Ring Buffers", url: "project_03.html", tags: "project milestone module 3 reactive interrupts ring buffer spsc posix signals timers non-blocking stm32 uart cli", desc: "Dual Project: Linux POSIX signal-emulated ISR with lock-free ring buffer; STM32 hardware timer scheduler & interrupt UART CLI." },
        { day: "p4", title: "Project 4: Module 4 Milestone — Standards, FSMs & Defensive Design", url: "project_04.html", tags: "project milestone module 4 misra-c fsm state table gdb test headless watchdog iwdg hardfault stm32 safety", desc: "Dual Project: Linux MISRA-C table-driven access control FSM with GDB test harness; STM32 motor controller with IWDG & HardFault trap." },
        { day: "p5", title: "Project 5: Module 5 Milestone — Layered Architecture & Production Capstone", url: "project_05.html", tags: "project milestone module 5 layered architecture hal bsp mock sensor bme280 ci cd github actions stm32 flight recorder", desc: "Dual Project: Linux decoupled sensor hub with mock HAL & GitHub Actions CI; STM32 production environmental flight recorder." },
        { day: "ref0", title: "Engineering Reference: Overview & Hardware Triad", url: "reference.html", tags: "reference overview sensors actuators silicon devices standards", desc: "Industrial engineering compendium and hardware triad reference." },
        { day: "ref1", title: "Ref 1: Sensors, Transducers & Signal Conditioning", url: "ref_sensors.html", tags: "reference sensors imu ppg adc hall effect thermocouple strain gauge signal conditioning", desc: "Exhaustive taxonomy of 10 industrial sensor categories with interface circuits and sample C drivers." },
        { day: "ref2", title: "Ref 2: Actuators, Motors & Power Drivers", url: "ref_actuators.html", tags: "reference actuators bldc stepper solenoid h-bridge mosfet gate driver back-emf pwm", desc: "Detailed breakdown of electric motors, solenoids, piezo, and silicon gate driver circuits." },
        { day: "ref3", title: "Ref 3: Microcontrollers vs Microprocessors (Silicon)", url: "ref_silicon.html", tags: "reference mcu mpu cortex-m cortex-a arm risc-v silicon peripheral comparison", desc: "Comparative hardware architectural deep-dive into MCU vs MPU silicon selection." },
        { day: "ref4", title: "Ref 4: 20 Mission-Critical Industrial Architectures", url: "ref_devices.html", tags: "reference 20 devices automotive medical aerospace bms infusion pump plc telemetry", desc: "Schematics, bill-of-materials, fail-safe modes, and firmware state machines for 20 real devices." },
        { day: "ref5", title: "Ref 5: Standards, Protocols & Datasheets Directory", url: "ref_standards.html", tags: "reference standards misra iso26262 iec62304 iec61508 autosar canbus spi i2c uart", desc: "Safety regulations, communication bus electrical limits, and how to dissect 1,000-page datasheets." },
        { day: "sim", title: "Visualize Execution: The Complete STM32 Firmware Journey", url: "stm32-firmware-journey.html", tags: "visualize execution simulation stm32 pipeline cortex-m reset vector table flash ram elf bin hex gpio pir uart led bootloader", desc: "Interactive animated silicon simulation of the full build pipeline, power-on reset, vector table, memory initialization, and peripheral execution." }
    ];

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
                    <input type="text" class="search-input" id="search-modal-input" placeholder="Search lessons, registers, drivers, protocols (e.g. NVIC, DMA, CAN)..." autocomplete="off">
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
            resultsContainer.innerHTML = '<div class="search-empty">No matching modules found. Try searching for "NVIC", "FreeRTOS", "DMA", "CAN", or "GPIO".</div>';
            return;
        }

        resultsContainer.innerHTML = results.map((item, idx) => `
            <a href="${item.url}" class="search-result-item ${idx === 0 ? 'selected' : ''}" data-index="${idx}">
                <div class="search-result-header">
                    <span class="search-result-title">${item.title}</span>
                    <span class="search-badge">${item.day === 0 ? 'OVERVIEW' : 'DAY ' + item.day}</span>
                </div>
                <div class="search-result-desc">${item.desc}</div>
            </a>
        `).join('');

        resultsContainer.querySelectorAll('.search-result-item').forEach(el => {
            el.addEventListener('mouseenter', () => {
                resultsContainer.querySelectorAll('.search-result-item').forEach(r => r.classList.remove('selected'));
                el.classList.add('selected');
                selectedIndex = parseInt(el.getAttribute('data-index'), 10);
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
                window.location.href = currentResults[selectedIndex].url;
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
// Top Navigation & Sidebar: Toggle (Desktop Hide/Show & Mobile Drawer)
// =========================================================
function initSidebarToggle() {
    const sidebar = document.querySelector('.sidebar');
    if (!sidebar) return;

    const toggleBtns = document.querySelectorAll('#sidebar-toggle, .sidebar-toggle, .menu-toggle');
    const sidebarHeader = document.querySelector('.sidebar-header');

    // Add collapse button inside sidebar-header if not present
    let closeBtn = document.querySelector('.sidebar-close-btn');
    if (!closeBtn && sidebarHeader) {
        closeBtn = document.createElement('button');
        closeBtn.className = 'sidebar-close-btn';
        closeBtn.type = 'button';
        closeBtn.setAttribute('aria-label', 'Hide Sidebar (Ctrl+B)');
        closeBtn.title = 'Hide Sidebar (Ctrl+B)';
        closeBtn.innerHTML = `<svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
        </svg>`;
        sidebarHeader.appendChild(closeBtn);
    }

    // Backdrop for mobile drawer
    let backdrop = document.querySelector('.sidebar-backdrop');
    if (!backdrop) {
        backdrop = document.createElement('div');
        backdrop.className = 'sidebar-backdrop';
        document.body.appendChild(backdrop);
    }

    const isMobile = () => window.innerWidth <= 900;

    function updateToggleButtons(isCollapsed) {
        toggleBtns.forEach(btn => {
            btn.setAttribute('aria-expanded', (!isCollapsed).toString());
            btn.setAttribute('title', isCollapsed ? 'Show Navigation Sidebar (Ctrl+B)' : 'Hide Navigation Sidebar (Ctrl+B)');
        });
    }

    // Restore desktop collapsed preference from localStorage
    const savedCollapsed = localStorage.getItem('embedded-sidebar-collapsed') === 'true';
    if (!isMobile() && savedCollapsed) {
        document.body.classList.add('sidebar-collapsed');
        updateToggleButtons(true);
    } else {
        updateToggleButtons(false);
    }

    function toggleSidebar() {
        if (isMobile()) {
            const isOpen = sidebar.classList.toggle('open');
            backdrop.classList.toggle('active', isOpen);
            document.body.style.overflow = isOpen ? 'hidden' : '';
        } else {
            const willCollapse = !document.body.classList.contains('sidebar-collapsed');
            document.body.classList.toggle('sidebar-collapsed', willCollapse);
            localStorage.setItem('embedded-sidebar-collapsed', willCollapse.toString());
            updateToggleButtons(willCollapse);
        }
    }

    function closeSidebar() {
        if (isMobile()) {
            sidebar.classList.remove('open');
            backdrop.classList.remove('active');
            document.body.style.overflow = '';
        } else {
            document.body.classList.add('sidebar-collapsed');
            localStorage.setItem('embedded-sidebar-collapsed', 'true');
            updateToggleButtons(true);
        }
    }

    // Attach click listener to all toggle buttons (top-nav)
    toggleBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleSidebar();
        });
    });

    // Close button in sidebar header
    if (closeBtn) {
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            closeSidebar();
        });
    }

    // Backdrop click closes mobile drawer
    backdrop.addEventListener('click', () => {
        if (isMobile()) {
            sidebar.classList.remove('open');
            backdrop.classList.remove('active');
            document.body.style.overflow = '';
        }
    });

    // Close mobile drawer when clicking a topic link
    sidebar.querySelectorAll('.toc a').forEach(link => {
        link.addEventListener('click', () => {
            if (isMobile()) {
                sidebar.classList.remove('open');
                backdrop.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    });

    // Keyboard shortcut: Ctrl+B or Cmd+B to toggle sidebar, Esc to close on mobile
    window.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
            e.preventDefault();
            toggleSidebar();
        } else if (e.key === 'Escape' && isMobile() && sidebar.classList.contains('open')) {
            sidebar.classList.remove('open');
            backdrop.classList.remove('active');
            document.body.style.overflow = '';
        }
    });
}

// =========================================================
// Sidebar Scroll Preservation & Active Topic Auto-Focus
// =========================================================
function initSidebarScrollRestoration() {
    const sidebar = document.querySelector('.sidebar');
    if (!sidebar) return;

    // 1. Restore previous scroll position if saved in this session
    const savedPos = sessionStorage.getItem('embedded_sidebar_scroll_top');
    if (savedPos !== null) {
        const parsed = parseInt(savedPos, 10);
        if (!isNaN(parsed)) {
            sidebar.scrollTop = parsed;
        }
    }

    // 2. Ensure active topic item is comfortably visible in the sidebar viewport
    requestAnimationFrame(() => {
        setTimeout(() => {
            const activeItem = sidebar.querySelector('li.active') ||
                               sidebar.querySelector('.toc-subtopics li.active') ||
                               sidebar.querySelector('.toc a.active');

            if (activeItem) {
                const sidebarRect = sidebar.getBoundingClientRect();
                const itemRect = activeItem.getBoundingClientRect();

                // Check if active item is comfortably inside the visible area
                const isComfortablyVisible = (
                    itemRect.top >= sidebarRect.top + 50 &&
                    itemRect.bottom <= sidebarRect.bottom - 50
                );

                // If not comfortably visible (e.g. navigated from Next Topic or freshly loaded), center it
                if (!isComfortablyVisible) {
                    activeItem.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'instant' });
                    sessionStorage.setItem('embedded_sidebar_scroll_top', sidebar.scrollTop.toString());
                }
            }
        }, 50);
    });

    // 3. Save scroll position on every link click inside the sidebar
    sidebar.addEventListener('click', (e) => {
        const link = e.target.closest('a');
        if (link) {
            sessionStorage.setItem('embedded_sidebar_scroll_top', sidebar.scrollTop.toString());
        }
    });

    // 4. Save scroll position on window beforeunload
    window.addEventListener('beforeunload', () => {
        sessionStorage.setItem('embedded_sidebar_scroll_top', sidebar.scrollTop.toString());
    });
}

// =========================================================
// Sidebar Resize Functionality
// =========================================================
function initSidebarResize() {
    const sidebar = document.querySelector('.sidebar');
    if (!sidebar || window.matchMedia('(max-width: 900px)').matches) return;

    const handle = document.createElement('button');
    handle.type = 'button';
    handle.className = 'sidebar-resize-handle';
    handle.setAttribute('aria-label', 'Resize navigation sidebar');
    handle.title = 'Drag to resize navigation sidebar';
    sidebar.appendChild(handle);

    const savedWidth = Number.parseInt(localStorage.getItem('embedded-sidebar-width'), 10);
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
        localStorage.setItem('embedded-sidebar-width', getComputedStyle(sidebar).width);
    };

    handle.addEventListener('pointerup', stopResizing);
    handle.addEventListener('pointercancel', stopResizing);
}

function setSidebarWidth(width) {
    const clampedWidth = Math.min(Math.max(width, 220), Math.min(480, window.innerWidth * 0.45));
    document.documentElement.style.setProperty('--sidebar-width', `${clampedWidth}px`);
}

// =========================================================
// Subtopic Navigation & Expandable Day TOC
// =========================================================
function initSubtopicNavigation() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';

    // Highlight active day and ensure its details is expanded
    document.querySelectorAll('.day-toc-group').forEach((details) => {
        const link = details.querySelector('summary a');
        if (!link) return;
        const href = link.getAttribute('href');
        if (href === currentPage) {
            details.open = true;
            details.classList.add('active');
            const parentItem = details.closest('.toc-day-item');
            if (parentItem) parentItem.classList.add('active');
        }
    });

    // Smooth scroll for subtopic anchor clicks
    document.querySelectorAll('.toc-subtopics a').forEach((link) => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            if (!href) return;

            // If link points to an anchor on current page (e.g. #topic-1-1 or day_01.html#topic-1-1)
            const isCurrentPageAnchor = href.startsWith('#') || href.startsWith(currentPage + '#');
            if (isCurrentPageAnchor) {
                const targetId = href.split('#')[1];
                const targetEl = document.getElementById(targetId);
                if (targetEl) {
                    e.preventDefault();
                    targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    history.pushState(null, '', '#' + targetId);

                    // Update active subtopic state
                    document.querySelectorAll('.toc-subtopics li').forEach(li => li.classList.remove('active'));
                    const li = link.closest('li');
                    if (li) li.classList.add('active');
                }
            }
        });
    });

    // Initial scroll if page loaded with a hash
    scrollToRequestedTopic();
}

function scrollToRequestedTopic() {
    const targetId = window.location.hash.slice(1);
    if (!targetId) return;
    setTimeout(() => {
        const target = document.getElementById(targetId);
        if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, 100);
}

// =========================================================
// =========================================================
// Interactive Multiple Choice Questions (MCQ) & Dynamic Score System
// =========================================================
function initMCQInteractivity() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const containers = Array.from(document.querySelectorAll('.mcq-container'));
    const totalCourseQuestions = 270;

    // Load progress from localStorage
    let progressData = {};
    try {
        progressData = JSON.parse(localStorage.getItem('embedded_c_mcq_progress') || '{}');
    } catch (e) {
        progressData = {};
    }

    if (!progressData[currentPage]) {
        progressData[currentPage] = {};
    }

    // Locate or create score badge in top navigation
    let scoreBadge = document.getElementById('mcq-score-badge');
    const navActions = document.querySelector('.nav-actions');
    if (!scoreBadge && navActions) {
        scoreBadge = document.createElement('div');
        scoreBadge.id = 'mcq-score-badge';
        scoreBadge.className = 'mcq-score-badge';
        const initialVal = containers.length > 0 ? `0/${containers.length}` : `0/${totalCourseQuestions}`;
        scoreBadge.innerHTML = `
            <span class="score-icon">🎯</span>
            <span class="score-label">Score:</span>
            <span class="score-value" id="mcq-score-value">${initialVal}</span>
        `;
        const themeBtn = document.getElementById('theme-toggle');
        if (themeBtn) {
            navActions.insertBefore(scoreBadge, themeBtn);
        } else {
            navActions.appendChild(scoreBadge);
        }
    }

    // Create dropdown scorecard popup if not present
    let popup = scoreBadge ? scoreBadge.querySelector('.score-details-popup') : null;
    if (!popup && scoreBadge) {
        popup = document.createElement('div');
        popup.className = 'score-details-popup';
        scoreBadge.appendChild(popup);
    }

    // Toggle scorecard popup on badge click
    if (scoreBadge && popup) {
        scoreBadge.addEventListener('click', (e) => {
            if (e.target.closest('.score-reset-btn')) return;
            popup.classList.toggle('active');
        });

        // Close popup when clicking outside
        document.addEventListener('click', (e) => {
            if (!scoreBadge.contains(e.target)) {
                popup.classList.remove('active');
            }
        });
    }

    // Calculate course-wide statistics
    function getGlobalStats() {
        let globalCorrect = 0;
        let globalAnswered = 0;
        for (const page in progressData) {
            if (Object.prototype.hasOwnProperty.call(progressData, page)) {
                const pageAnswers = progressData[page];
                for (const q in pageAnswers) {
                    if (pageAnswers[q]) {
                        globalAnswered++;
                        if (pageAnswers[q].correct) globalCorrect++;
                    }
                }
            }
        }
        return { globalCorrect, globalAnswered, globalTotal: totalCourseQuestions };
    }

    // Calculate topic-specific statistics
    function getPageStats() {
        const pageAnswers = progressData[currentPage] || {};
        let pageCorrect = 0;
        let pageAnswered = 0;
        for (const q in pageAnswers) {
            if (pageAnswers[q]) {
                pageAnswered++;
                if (pageAnswers[q].correct) pageCorrect++;
            }
        }
        return { pageCorrect, pageAnswered, pageTotal: containers.length };
    }

    // Update Score badge display and popup scorecard
    function updateScoreDisplay(shouldPulse = false) {
        if (!scoreBadge) return;
        const scoreValEl = scoreBadge.querySelector('.score-value') || document.getElementById('mcq-score-value');
        const scoreIconEl = scoreBadge.querySelector('.score-icon');
        const { pageCorrect, pageTotal } = getPageStats();
        const { globalCorrect, globalTotal } = getGlobalStats();

        if (pageTotal > 0) {
            if (scoreValEl) scoreValEl.textContent = `${pageCorrect}/${pageTotal}`;
            scoreBadge.title = `Topic Quiz Score: ${pageCorrect}/${pageTotal} (${Math.round(pageCorrect / pageTotal * 100)}%) — Click for scorecard`;
            if (pageCorrect === pageTotal && pageTotal > 0) {
                if (scoreIconEl) scoreIconEl.textContent = '🏆';
                scoreBadge.classList.add('score-perfect');
            } else {
                if (scoreIconEl) scoreIconEl.textContent = '🎯';
                scoreBadge.classList.remove('score-perfect');
            }
        } else {
            if (scoreValEl) scoreValEl.textContent = `${globalCorrect}/${globalTotal}`;
            scoreBadge.title = `Course MCQ Score: ${globalCorrect}/${globalTotal} (${Math.round(globalCorrect / globalTotal * 100)}%) — Click for scorecard`;
            if (scoreIconEl) scoreIconEl.textContent = '🎯';
            scoreBadge.classList.remove('score-perfect');
        }

        // Render popup contents
        if (popup) {
            const pagePct = pageTotal > 0 ? Math.round(pageCorrect / pageTotal * 100) : 0;
            const globalPct = Math.round(globalCorrect / globalTotal * 100);

            popup.innerHTML = `
                <div class="score-popup-title">
                    <span>📊 MCQ Scorecard</span>
                    <span style="font-size: 0.8rem; color: var(--accent); font-weight: 800;">${pageTotal > 0 ? pagePct + '%' : globalPct + '%'}</span>
                </div>
                ${pageTotal > 0 ? `
                <div class="score-popup-row">
                    <span>This Chapter:</span>
                    <strong>${pageCorrect} / ${pageTotal} correct</strong>
                </div>
                <div class="score-popup-bar">
                    <div class="score-popup-fill" style="width: ${pagePct}%"></div>
                </div>
                ` : ''}
                <div class="score-popup-row">
                    <span>Course Overall:</span>
                    <strong>${globalCorrect} / ${globalTotal} correct</strong>
                </div>
                <div class="score-popup-bar">
                    <div class="score-popup-fill" style="width: ${globalPct}%; background: linear-gradient(90deg, #6366f1, #8b5cf6);"></div>
                </div>
                ${pageTotal > 0 ? `
                <button class="score-reset-btn" id="score-reset-topic-btn" type="button">Reset Chapter Quiz</button>
                ` : `
                <div style="font-size: 0.76rem; color: var(--text-muted); text-align: center; margin-top: 0.5rem;">Solve chapter MCQs to raise your score!</div>
                `}
            `;

            const resetBtn = popup.querySelector('#score-reset-topic-btn');
            if (resetBtn) {
                resetBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    resetTopicQuiz();
                });
            }
        }

        if (shouldPulse) {
            scoreBadge.classList.remove('score-pulse');
            void scoreBadge.offsetWidth;
            scoreBadge.classList.add('score-pulse');
            setTimeout(() => scoreBadge.classList.remove('score-pulse'), 500);
        }
    }

    // Reset current topic quiz
    function resetTopicQuiz() {
        delete progressData[currentPage];
        try {
            localStorage.setItem('embedded_c_mcq_progress', JSON.stringify(progressData));
        } catch (e) {}

        containers.forEach(container => {
            container.querySelectorAll('.mcq-option').forEach(opt => {
                opt.classList.remove('selected', 'correct', 'incorrect');
                opt.style.background = '';
            });
            const submitBtn = container.querySelector('.mcq-submit');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Submit';
            }
            const feedback = container.querySelector('.mcq-feedback');
            if (feedback) {
                feedback.style.display = 'none';
                feedback.classList.remove('correct', 'incorrect');
            }
        });

        updateScoreDisplay(true);
    }

    // Restore previously answered questions on page load
    containers.forEach((container, qIdx) => {
        const savedAnswer = progressData[currentPage]?.[qIdx];
        if (!savedAnswer) return;

        const options = Array.from(container.querySelectorAll('.mcq-option'));
        const selectedOpt = options[savedAnswer.selected];
        const feedback = container.querySelector('.mcq-feedback');
        const submitBtn = container.querySelector('.mcq-submit');

        if (selectedOpt && feedback) {
            selectedOpt.classList.add('selected');
            if (savedAnswer.correct) {
                selectedOpt.classList.add('correct');
                feedback.classList.add('correct');
                const explanation = feedback.getAttribute('data-raw-explanation') || feedback.textContent.trim();
                feedback.innerHTML = `<strong>✓ Correct!</strong> ${explanation || 'Great job mastering this concept!'}`;
            } else {
                selectedOpt.classList.add('incorrect');
                const correctOption = container.querySelector('.mcq-option[data-correct="true"]');
                if (correctOption) correctOption.classList.add('correct');
                feedback.classList.add('incorrect');
                const explanation = feedback.getAttribute('data-raw-explanation') || feedback.textContent.trim();
                feedback.innerHTML = `<strong>✗ Incorrect.</strong> ${explanation || 'Review the lesson above and try again!'}`;
            }
            feedback.style.display = 'block';
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Submitted';
            }
        }
    });

    // Initial score display update
    updateScoreDisplay(false);

    // Delegated click handler for selecting options
    document.addEventListener('click', (e) => {
        const option = e.target.closest('.mcq-option');
        if (option) {
            const container = option.closest('.mcq-container');
            if (!container) return;

            const qIdx = containers.indexOf(container);
            if (progressData[currentPage]?.[qIdx] !== undefined) return;

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

        // Delegated click handler for submitting answer
        const submitBtn = e.target.closest('.mcq-submit');
        if (submitBtn) {
            const container = submitBtn.closest('.mcq-container');
            if (!container) return;

            const qIdx = containers.indexOf(container);
            if (qIdx === -1) return;

            const options = Array.from(container.querySelectorAll('.mcq-option'));
            const selected = container.querySelector('.mcq-option.selected');
            const feedback = container.querySelector('.mcq-feedback');
            if (!selected || !feedback) return;

            const selectedIndex = options.indexOf(selected);
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
                if (correctOption) correctOption.classList.add('correct');
                feedback.classList.add('incorrect');
                feedback.innerHTML = `<strong>✗ Incorrect.</strong> ${explanation || 'Review the lesson above and try again!'}`;
            }

            feedback.style.display = 'block';
            submitBtn.disabled = true;
            submitBtn.textContent = 'Submitted';

            if (!progressData[currentPage]) progressData[currentPage] = {};
            progressData[currentPage][qIdx] = {
                selected: selectedIndex,
                correct: isCorrect
            };
            try {
                localStorage.setItem('embedded_c_mcq_progress', JSON.stringify(progressData));
            } catch (err) {}

            updateScoreDisplay(true);
            return;
        }
    });
}

// =========================================================
// Floating Toast Notification Helper
// =========================================================
function showCourseToast(message, icon = '✓') {
    let toast = document.querySelector('.course-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.className = 'course-toast';
        document.body.appendChild(toast);
    }
    toast.innerHTML = `<span style="font-size: 1.2rem; line-height: 1;">${icon}</span> <span>${message}</span>`;
    toast.classList.add('visible');
    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(() => {
        toast.classList.remove('visible');
    }, 2800);
}

// =========================================================
// Chapter Completion Tracking (Sidebar Ticks & On-Page Toggle)
// =========================================================
function initChapterCompletion() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
    // Load completed chapters array from localStorage
    let completedChapters = [];
    try {
        completedChapters = JSON.parse(localStorage.getItem('embedded_c_completed_chapters') || '[]');
        if (!Array.isArray(completedChapters)) completedChapters = [];
    } catch (e) {
        completedChapters = [];
    }

    const tocList = document.querySelector('.toc');
    if (!tocList) return;

    // Collect all valid chapter links in TOC (excluding external or anchor links)
    const tocLinks = Array.from(tocList.querySelectorAll('li > a')).filter(a => {
        const href = a.getAttribute('href');
        return href && href.endsWith('.html') && !href.startsWith('http');
    });

    const totalChapters = tocLinks.length;

    function saveAndSync(url, isCompleted) {
        const idx = completedChapters.indexOf(url);
        if (isCompleted && idx === -1) {
            completedChapters.push(url);
        } else if (!isCompleted && idx !== -1) {
            completedChapters.splice(idx, 1);
        }

        try {
            localStorage.setItem('embedded_c_completed_chapters', JSON.stringify(completedChapters));
        } catch (e) {}

        updateAllUI();
    }

    function updateAllUI() {
        // 1. Update TOC items with clickable tick buttons
        tocLinks.forEach(a => {
            const href = a.getAttribute('href');
            const li = a.closest('li');
            if (!li) return;

            let tickBtn = li.querySelector('.toc-tick-btn');
            if (!tickBtn) {
                tickBtn = document.createElement('button');
                tickBtn.type = 'button';
                tickBtn.className = 'toc-tick-btn';
                tickBtn.innerHTML = '✓';
                li.insertBefore(tickBtn, a);

                tickBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const nowCompleted = !tickBtn.classList.contains('completed');
                    saveAndSync(href, nowCompleted);
                    const chapterTitle = a.textContent.trim().replace(/^Topic \d+:\s*|^Ref \d+:\s*|^Project \d+:\s*/, '');
                    showCourseToast(nowCompleted ? `"${chapterTitle}" marked as covered!` : `"${chapterTitle}" marked in progress`, nowCompleted ? '✅' : '⏳');
                });
            }

            const isDone = completedChapters.includes(href);
            tickBtn.classList.toggle('completed', isDone);
            li.classList.toggle('toc-completed', isDone);
            tickBtn.title = isDone ? 'Chapter covered (click to unmark)' : 'Mark chapter as covered';
        });

        // 2. Update on-page completion card if applicable
        const completionCard = document.querySelector('.chapter-completion-card');
        if (completionCard) {
            const isDone = completedChapters.includes(currentPage);
            completionCard.classList.toggle('completed', isDone);
            const toggleBtn = completionCard.querySelector('.completion-toggle-btn');
            const statusText = completionCard.querySelector('.completion-status-text');
            if (toggleBtn) {
                toggleBtn.classList.toggle('completed', isDone);
                toggleBtn.innerHTML = isDone ? `<span>✓</span> Chapter Covered` : `<span>✓</span> Mark as Covered`;
            }
            if (statusText) {
                statusText.textContent = isDone ? 'Great job! You have marked this chapter as completed.' : 'Mark this chapter as covered to track your curriculum progress.';
            }
        }

        // 3. Update course progress badge in index.html and top navigation
        const completenessBadge = document.querySelector('.completeness-badge');
        const completedCount = completedChapters.length;
        const pct = totalChapters > 0 ? Math.round((completedCount / totalChapters) * 100) : 0;
        if (completenessBadge) {
            completenessBadge.innerHTML = `Covered: <span>${completedCount} / ${totalChapters} Chapters (${pct}%)</span>`;
            completenessBadge.title = `${completedCount} of ${totalChapters} chapters covered (${pct}%)`;
        }

        // 4. Update homepage curriculum progress meter if present
        const homeCovered = document.getElementById('home-covered-count');
        const homeTotal = document.getElementById('home-total-count');
        const homePct = document.getElementById('home-progress-pct');
        const homeFill = document.getElementById('home-progress-fill');
        const homeNotes = document.getElementById('home-questions-count');

        if (homeCovered) homeCovered.textContent = completedCount.toString();
        if (homeTotal) homeTotal.textContent = totalChapters.toString();
        if (homePct) homePct.textContent = `${pct}%`;
        if (homeFill) homeFill.style.width = `${pct}%`;
        if (homeNotes) {
            let totalNotes = 0;
            try {
                const notesObj = JSON.parse(localStorage.getItem('embedded_c_chapter_notes') || '{}');
                for (const k in notesObj) {
                    if (Array.isArray(notesObj[k])) totalNotes += notesObj[k].length;
                }
            } catch (e) {}
            homeNotes.textContent = totalNotes.toString();
        }
    }

    // Insert on-page completion banner on reading pages (excluding index.html)
    if (currentPage !== 'index.html') {
        const bookPage = document.querySelector('.book-page');
        const pageNav = document.querySelector('.page-navigation') || document.querySelector('footer.page-navigation');
        if (bookPage && !document.querySelector('.chapter-completion-card')) {
            const card = document.createElement('div');
            card.className = 'chapter-completion-card';
            card.innerHTML = `
                <div class="completion-info">
                    <span class="completion-icon">📘</span>
                    <div class="completion-text">
                        <h4>Finished studying this chapter?</h4>
                        <p class="completion-status-text">Mark this chapter as covered to track your curriculum progress.</p>
                    </div>
                </div>
                <button class="completion-toggle-btn" type="button">
                    <span>✓</span> Mark as Covered
                </button>
            `;

            if (pageNav && pageNav.parentNode === bookPage) {
                bookPage.insertBefore(card, pageNav);
            } else if (pageNav && pageNav.parentNode) {
                pageNav.parentNode.insertBefore(card, pageNav);
            } else {
                bookPage.appendChild(card);
            }

            const toggleBtn = card.querySelector('.completion-toggle-btn');
            toggleBtn.addEventListener('click', () => {
                const nowCompleted = !completedChapters.includes(currentPage);
                saveAndSync(currentPage, nowCompleted);
                showCourseToast(nowCompleted ? 'Chapter marked as covered! Keep up the great work!' : 'Chapter marked as in-progress', nowCompleted ? '🎉' : '⏳');
            });
        }
    }

    // Initialize all UI states
    updateAllUI();
}

// =========================================================
// Chapter Study Notes & Questions Scratchpad (Per Chapter)
// =========================================================
function initChapterNotesAndQuestions() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    if (currentPage === 'index.html') return; // Only on chapter content pages

    const bookPage = document.querySelector('.book-page');
    if (!bookPage) return;

    // Load notes data from localStorage
    let allNotes = {};
    try {
        allNotes = JSON.parse(localStorage.getItem('embedded_c_chapter_notes') || '{}');
    } catch (e) {
        allNotes = {};
    }

    if (!Array.isArray(allNotes[currentPage])) {
        allNotes[currentPage] = [];
    }

    // Locate or create notes widget
    let notesWidget = document.querySelector('.chapter-notes-widget');
    if (!notesWidget) {
        notesWidget = document.createElement('div');
        notesWidget.className = 'chapter-notes-widget';
        notesWidget.id = 'chapter-notes-widget';

        const completionCard = document.querySelector('.chapter-completion-card');
        const pageNav = document.querySelector('.page-navigation') || document.querySelector('footer.page-navigation');

        if (completionCard && completionCard.parentNode) {
            completionCard.parentNode.insertBefore(notesWidget, completionCard);
        } else if (pageNav && pageNav.parentNode) {
            pageNav.parentNode.insertBefore(notesWidget, pageNav);
        } else {
            bookPage.appendChild(notesWidget);
        }
    }

    function saveNotes() {
        try {
            localStorage.setItem('embedded_c_chapter_notes', JSON.stringify(allNotes));
        } catch (e) {}
    }

    function renderNotes() {
        const chapterNotes = allNotes[currentPage] || [];
        const total = chapterNotes.length;
        const unresolved = chapterNotes.filter(n => !n.resolved).length;

        const countBadgeText = total === 0 
            ? '0 Questions' 
            : `${total} Note${total > 1 ? 's' : ''} (${unresolved} open)`;

        notesWidget.innerHTML = `
            <div class="notes-widget-header">
                <h3 class="notes-widget-title">
                    <span>📝</span> Chapter Notes &amp; Questions
                </h3>
                <span class="completeness-badge" style="font-size: 0.78rem; padding: 0.2rem 0.65rem;">${countBadgeText}</span>
            </div>
            <p class="notes-widget-desc">
                Record questions to ask mentors, register doubts to review, or key takeaways for this chapter. Automatically saved in your browser.
            </p>

            <form class="notes-form" id="notes-add-form">
                <textarea class="notes-textarea" id="note-input-text" placeholder="Type a question, doubt to clarify, or key technical note for this chapter..." rows="2" required></textarea>
                <div class="notes-form-row">
                    <select class="notes-category-select" id="note-input-category">
                        <option value="question">❓ Question / Doubt</option>
                        <option value="takeaway">💡 Key Takeaway</option>
                        <option value="research">🔬 To Research</option>
                        <option value="hazard">⚠️ Gotcha / Hazard</option>
                    </select>
                    <button type="submit" class="notes-add-btn">
                        <span>+</span> Add to Notes
                    </button>
                </div>
            </form>

            <div class="notes-toolbar">
                <span>Your Saved Notes &amp; Inquiries:</span>
                ${total > 0 ? `
                <button type="button" class="notes-copy-btn" id="notes-copy-btn" title="Copy all questions to clipboard">
                    <span>📋</span> Copy Questions
                </button>
                ` : ''}
            </div>

            <div class="notes-list" id="notes-items-list">
                ${total === 0 ? `
                <div class="notes-empty-state">
                    No questions or notes logged for this chapter yet. Have a doubt about timing, registers, or pointers? Add your question above!
                </div>
                ` : ''}
            </div>
        `;

        const listContainer = notesWidget.querySelector('#notes-items-list');

        if (total > 0 && listContainer) {
            chapterNotes.forEach((note, index) => {
                const item = document.createElement('div');
                item.className = `note-item ${note.resolved ? 'resolved' : ''}`;
                item.dataset.id = note.id;

                const tagLabels = {
                    question: '❓ Question',
                    takeaway: '💡 Takeaway',
                    research: '🔬 Research',
                    hazard: '⚠️ Hazard'
                };

                const tagClass = `tag-${note.type || 'question'}`;
                const tagText = tagLabels[note.type] || '❓ Question';

                item.innerHTML = `
                    <input type="checkbox" class="note-check" ${note.resolved ? 'checked' : ''} title="${note.resolved ? 'Mark as unresolved' : 'Mark as resolved / answered'}">
                    <div class="note-body">
                        <div class="note-meta">
                            <span class="note-tag ${tagClass}">${tagText}</span>
                            <span class="note-time">${note.timestamp || ''}</span>
                        </div>
                        <p class="note-text">${escapeHtml(note.text)}</p>
                    </div>
                    <button type="button" class="note-del-btn" title="Delete note">✕</button>
                `;

                // Toggle resolved
                const checkbox = item.querySelector('.note-check');
                checkbox.addEventListener('change', () => {
                    note.resolved = checkbox.checked;
                    saveNotes();
                    renderNotes();
                    showCourseToast(note.resolved ? 'Question marked as resolved!' : 'Question marked as open', note.resolved ? '✅' : '📝');
                });

                // Delete note
                const delBtn = item.querySelector('.note-del-btn');
                delBtn.addEventListener('click', () => {
                    chapterNotes.splice(index, 1);
                    saveNotes();
                    renderNotes();
                    showCourseToast('Note deleted', '🗑');
                });

                listContainer.appendChild(item);
            });
        }

        // Attach form submit
        const form = notesWidget.querySelector('#notes-add-form');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const textEl = form.querySelector('#note-input-text');
            const catEl = form.querySelector('#note-input-category');
            const text = textEl.value.trim();
            if (!text) return;

            const now = new Date();
            const dateStr = now.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + ', ' +
                            now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

            const newNote = {
                id: 'note_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
                text: text,
                type: catEl.value,
                resolved: false,
                timestamp: dateStr
            };

            chapterNotes.unshift(newNote);
            saveNotes();
            renderNotes();
            showCourseToast('Question saved to Chapter Notes!', '📝');
        });

        // Attach copy button
        const copyBtn = notesWidget.querySelector('#notes-copy-btn');
        if (copyBtn) {
            copyBtn.addEventListener('click', () => {
                const titleEl = document.querySelector('h1');
                const chapterTitle = titleEl ? titleEl.textContent.trim() : currentPage;
                let exportText = `### Chapter Questions & Notes: ${chapterTitle}\n\n`;
                chapterNotes.forEach((n, i) => {
                    const status = n.resolved ? '[x] Resolved' : '[ ] Open';
                    exportText += `${i + 1}. ${status} (${n.type.toUpperCase()}): ${n.text} (${n.timestamp})\n`;
                });

                navigator.clipboard.writeText(exportText).then(() => {
                    showCourseToast('Chapter questions copied to clipboard!', '📋');
                }).catch(() => {
                    showCourseToast('Failed to copy to clipboard', '⚠️');
                });
            });
        }
    }

    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    renderNotes();
}
