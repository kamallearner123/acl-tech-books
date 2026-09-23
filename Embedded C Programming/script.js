document.addEventListener('DOMContentLoaded', () => {
    initThemeToggle();
    initSearchModal();
    initPrintButton();
    initGitHubButton();
    initMobileMenu();
    initSubtopicNavigation();
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
        localStorage.setItem('embedded-theme', nextTheme);
        updateThemeIcon(nextTheme);
    });
}

// =========================================================
// Top Navigation: Spotlight Search Modal (Ctrl/Cmd + K)
// =========================================================
function initSearchModal() {
    const searchBtns = document.querySelectorAll('.icon-btn[aria-label="Search"]');
    if (!searchBtns.length) return;

    // Course Search Index data covering all 24 Embedded C days
    const courseIndex = [
        { day: 0, title: "Course Overview & Curriculum Map", url: "index.html", tags: "intro roadmap syllabus architecture hardware arm stm32 nucleo", desc: "Overview of the 24-day Embedded Systems and C Programming curriculum." },
        { day: 1, title: "Day 1: Introduction to Embedded Systems & C Programming", url: "day_01.html", tags: "cortex-m vector table reset handler volatile registers memory map", desc: "Cortex-M startup code, vector table VTOR, volatile qualifier, memory segments." },
        { day: 2, title: "Day 2: Memory Architecture & Bit Manipulation", url: "day_02.html", tags: "flash sram bit masking bitfields endianness structure packing mpu", desc: "Harvard vs Von Neumann, bit masking macros, endianness swapping, struct packing." },
        { day: 3, title: "Day 3: GPIO, Registers & Bare-Metal LED Control", url: "day_03.html", tags: "gpio moder otyper pupdr bssr atomic bit set push pull open drain", desc: "GPIO configuration registers, atomic bit toggling via BSRR, push-pull vs open-drain." },
        { day: 4, title: "Day 4: Interrupts, NVIC & Event-Driven Programming", url: "day_04.html", tags: "interrupts nvic exti priority grouping latency tail chaining isr", desc: "NVIC priority grouping, EXTI line configuration, interrupt latency, tail-chaining." },
        { day: 5, title: "Day 5: Timers, PWM & Real-Time Clocks", url: "day_05.html", tags: "timers prescaler autoreload pwm duty cycle rtc input capture", desc: "Hardware timers, prescaler math, PWM waveform synthesis, input capture." },
        { day: 6, title: "Day 6: ADC, DAC & Sensor Interfacing", url: "day_06.html", tags: "adc dac sampling theorem nyquist snr kalman filter calibration dma", desc: "Successive approximation ADC, continuous conversion, sampling theorems, sensor filtering." },
        { day: 7, title: "Day 7: UART, SPI & I2C Communication", url: "day_07.html", tags: "uart spi i2c baud rate clock polarity cpol cpha pullup open drain", desc: "Serial bus topologies, baud rate dividers, SPI clock phases, I2C ACK/NACK transactions." },
        { day: 8, title: "Day 8: Capstone: Sensor Logger with Serial Output", url: "day_08.html", tags: "capstone circular ring buffer uart packet framing cli telemetry", desc: "Lock-free circular ring buffer, structured packet framing, streaming sensor telemetry." },
        { day: 9, title: "Day 9: RTOS Fundamentals (FreeRTOS)", url: "day_09.html", tags: "rtos freertos scheduler tcb context switch systick kernel", desc: "FreeRTOS task control blocks, SysTick preemption, context switching mechanics." },
        { day: 10, title: "Day 10: Task Scheduling, Priorities & Context Switching", url: "day_10.html", tags: "pendsv context switch priority inversion rate monotonic scheduling rms", desc: "PendSV assembly context switch, rate monotonic scheduling, priority inversion." },
        { day: 11, title: "Day 11: Queues, Semaphores & Mutexes", url: "day_11.html", tags: "queues counting semaphore binary mutex priority inheritance deadlock", desc: "Inter-task synchronization, priority inheritance, deadlock avoidance, bounded buffers." },
        { day: 12, title: "Day 12: DMA & High-Speed Data Transfers", url: "day_12.html", tags: "dma direct memory access double buffering circular dma cache coherency", desc: "DMA controllers, stream channels, double buffering, cache coherency invalidation." },
        { day: 13, title: "Day 13: CAN Bus & Automotive Protocols", url: "day_13.html", tags: "can bus automotive differential signaling bit stuffing arbitration identifier", desc: "CAN 2.0B / CAN-FD physical layer, bitwise arbitration, CRC validation, transceiver design." },
        { day: 14, title: "Day 14: USB, Ethernet & Wireless (BLE/Wi-Fi)", url: "day_14.html", tags: "usb cdc vcp ethernet lwip sockets ble bluetooth wifi mqtt", desc: "USB CDC Virtual COM Port, lwIP TCP/IP stack, BLE GATT attributes, wireless IoT." },
        { day: 15, title: "Day 15: Bootloaders & Firmware Update (OTA)", url: "day_15.html", tags: "bootloader ota dual bank flash crc32 vector table remap secure boot", desc: "Custom bootloader architecture, dual-bank A/B partitioning, CRC verification." },
        { day: 16, title: "Day 16: Capstone: Multi-Tasking RTOS Sensor Hub", url: "day_16.html", tags: "capstone rtos sensor hub producer consumer dma queue watchdog", desc: "Multi-threaded RTOS application, producer-consumer queues, independent watchdog (IWDG)." },
        { day: 17, title: "Day 17: Low-Power Design & Sleep Modes", url: "day_17.html", tags: "low power sleep stop standby wfi wfe lpuart battery optimization", desc: "Cortex-M power domains, STOP/STANDBY modes, WFI/WFE entry, sub-microamp consumption." },
        { day: 18, title: "Day 18: Flash Memory, EEPROM & File Systems (FatFS)", url: "day_18.html", tags: "flash endurance wear leveling fatfs eeprom emulation spi nor flash", desc: "Flash page erase cycles, wear leveling algorithms, FatFS filesystem integration." },
        { day: 19, title: "Day 19: Safety-Critical Firmware & MISRA-C", url: "day_19.html", tags: "misra-c safety critical iso 26262 iec 61508 static analysis cppcheck", desc: "MISRA-C:2012 guidelines, static analysis rules, defensive memory bounds checks." },
        { day: 20, title: "Day 20: Hardware Debugging (JTAG, SWD, Logic Analyzer)", url: "day_20.html", tags: "swd jtag gdb openocd swo itm data watchpoints logic analyzer", desc: "Serial Wire Debug protocol, hardware breakpoints, ITM print tracing, GDB debugging." },
        { day: 21, title: "Day 21: Testing Embedded Systems (Unity, CMock, HIL)", url: "day_21.html", tags: "testing unity cmock hardware in the loop hil test driven development tdd", desc: "Unit testing embedded C with Unity and CMock, register stubbing, HIL testbeds." },
        { day: 22, title: "Day 22: Embedded Linux & Device Drivers", url: "day_22.html", tags: "embedded linux device tree kernel module char driver ioctl sysfs", desc: "Device Tree overlays, Linux character device drivers, file operations, kernel modules." },
        { day: 23, title: "Day 23: Milestone: Self-Recovering IoT Node", url: "day_23.html", tags: "milestone iot self-recovering crash telemetry blackbox flight recorder iwdg", desc: "Crash-proof firmware architecture, non-volatile flight data recorder, brownout recovery." },
        { day: 24, title: "Day 24: Grand Capstone: ECU Diagnostic Tool", url: "day_24.html", tags: "grand capstone ecu diagnostic obd-ii uds can bus iso 14229", desc: "Automotive ISO 14229 UDS diagnostic stack, CAN frame parsing, fault code management." }
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
// Interactive Multiple Choice Questions (MCQ) Handler
// =========================================================
function initMCQInteractivity() {
    // Delegated click handler for selecting options
    document.addEventListener('click', (e) => {
        const option = e.target.closest('.mcq-option');
        if (option) {
            const container = option.closest('.mcq-container');
            if (!container) return;

            // Reset previous highlights within this question
            container.querySelectorAll('.mcq-option').forEach(opt => {
                opt.classList.remove('selected', 'correct', 'incorrect');
                opt.style.background = '';
            });

            // Mark clicked option as selected
            option.classList.add('selected');

            // Enable submit button
            const submitBtn = container.querySelector('.mcq-submit');
            if (submitBtn) {
                submitBtn.disabled = false;
            }

            // Hide prior feedback until submit is re-clicked
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

            const selected = container.querySelector('.mcq-option.selected');
            const feedback = container.querySelector('.mcq-feedback');
            if (!selected || !feedback) return;

            const isCorrect = selected.getAttribute('data-correct') === 'true';

            // Store raw explanation text if not already stored
            if (!feedback.getAttribute('data-raw-explanation')) {
                const cleanedText = feedback.textContent.replace(/^[✓✗]\s*(Correct answer!?|Incorrect\.?|Correct!?)\s*/i, '').trim();
                feedback.setAttribute('data-raw-explanation', cleanedText);
            }
            const explanation = feedback.getAttribute('data-raw-explanation') || '';

            // Clean previous states
            container.querySelectorAll('.mcq-option').forEach(opt => opt.classList.remove('correct', 'incorrect'));
            feedback.classList.remove('correct', 'incorrect');

            if (isCorrect) {
                selected.classList.add('correct');
                feedback.classList.add('correct');
                feedback.innerHTML = `<strong>✓ Correct!</strong> ${explanation || 'Great job mastering this concept!'}`;
            } else {
                selected.classList.add('incorrect');
                // Highlight the correct answer as well for constructive learning
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
