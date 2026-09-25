# Topic 0: The Complete C Program Anatomy (Typing Speed Test)

Welcome to the **first hands-on C program** of the course! This program serves two key purposes:
1. **Interactive Experience**: Test your typing speed and accuracy against an embedded engineering paragraph with a live countdown timer.
2. **Pedagogical Walkthrough**: Deconstruct the anatomy of a complete, production-grade C program.

---

## 🏛️ Anatomy of a Complete C Program

Every production C program consists of standard structural sections demonstrated in `typing_speed.c`:

```text
┌─────────────────────────────────────────────────────────────┐
│ 1. Preprocessor Directives (#include, #define)              │
├─────────────────────────────────────────────────────────────┤
│ 2. Type Definitions & Structs (typedef struct { ... })      │
├─────────────────────────────────────────────────────────────┤
│ 3. Global State & Interrupt/Signal Flags (volatile ...)     │
├─────────────────────────────────────────────────────────────┤
│ 4. Asynchronous Event / Signal Handlers (Timer_Handler)     │
├─────────────────────────────────────────────────────────────┤
│ 5. Core Metric Calculation Logic (Pure C Algorithms)        │
├─────────────────────────────────────────────────────────────┤
│ 6. User Interface & Display Helpers (printf, ANSI colors)   │
├─────────────────────────────────────────────────────────────┤
│ 7. Application Entry Point (int main(void)) & Exit Codes    │
└─────────────────────────────────────────────────────────────┘
```

### 1. Preprocessor Directives
```c
#include <stdio.h>
#include <unistd.h>
#include <signal.h>
```
* Lines beginning with `#` are processed *before* compilation by the C Preprocessor (`cpp`).
* `<stdio.h>` brings in standard input/output functions (`printf`, `fgets`).
* `<unistd.h>` and `<signal.h>` provide access to POSIX operating system calls (`alarm`, `sigaction`).

### 2. Grouping Data with `struct`
```c
typedef struct {
    double   elapsed_seconds;
    uint32_t total_chars_typed;
    uint32_t correct_chars;
    double   net_wpm;
    double   accuracy_percent;
} TypingResult_t;
```
* Instead of passing 7 separate loose variables across functions, a `struct` bundles related data into a cohesive, readable object.

### 3. Asynchronous Timer & Signals (Interrupt Emulation)
```c
alarm(30); // Request OS to deliver SIGALRM in 30 seconds
char *read_ptr = fgets(user_input, BUFFER_CAPACITY, stdin);
```
* On microcontrollers, timers trigger hardware interrupts (ISRs). On Linux and macOS, the operating system emulates this with **Signals** (`SIGALRM`).
* By clearing the `SA_RESTART` flag in `sigaction`, the moment the countdown timer expires, the OS delivers `SIGALRM`, instantly unblocking the waiting `fgets()` input call with `errno == EINTR`.
* The variable communicating between the timer handler and `main()` is declared as `volatile sig_atomic_t g_time_up` to prevent the compiler from caching it in a CPU register.

### 4. Mathematical Precision
```c
double minutes = elapsed_sec / 60.0;
res.net_wpm = (res.correct_chars / 5.0) / minutes;
```
* Dividing an integer by an integer in C performs **integer truncation** (e.g. `25 / 60` yields `0`).
* Using floating-point literals (`60.0`, `5.0`) or explicit casts `(double)` ensures high-precision calculations.

---

## 🚀 Quick Start (Build & Run)

```bash
# Enter the topic directory
cd c_programs/00_typing_speed_test

# Compile the program
make

# Run the test
make run
```

---

## 🎯 How the Score is Calculated

* **Standard Word Definition**: 1 Word = 5 keystrokes (including spaces and punctuation).
* **Gross WPM**: $\frac{\text{Total Characters Typed} / 5}{\text{Time (minutes)}}$
* **Net WPM**: $\frac{\text{Correct Characters Typed} / 5}{\text{Time (minutes)}}$
* **Accuracy**: $\frac{\text{Correct Characters}}{\text{Total Characters Typed}} \times 100\%$

---

## 📝 Student Practice Exercises

1. **Exercise 1 (Configurable Timer)**:
   - Modify `typing_speed.c` to ask the user to choose their challenge difficulty before starting:
     - Easy: 45 seconds
     - Medium: 30 seconds
     - Hard / Blitz: 15 seconds
2. **Exercise 2 (Multiple Paragraphs)**:
   - Create an array of 3 different paragraphs (e.g., `PARAGRAPH_EMBEDDED`, `PARAGRAPH_LINUX_KERNEL`, `PARAGRAPH_ALGORITHMS`).
   - Use `rand() % 3` with `srand(time(NULL))` to randomly select a paragraph for each run.
3. **Exercise 3 (High Score Persistence)**:
   - Use standard C file I/O (`fopen()`, `fprintf()`, `fscanf()`, `fclose()`) to save the student's highest Net WPM to a file named `highscore.txt`.
   - On subsequent runs, check if the current score beats the high score and announce: `"🎉 NEW HIGH SCORE!"`.
