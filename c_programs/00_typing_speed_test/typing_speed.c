/**
 * ==============================================================================
 * Topic 0: The Complete C Program Anatomy - Typing Speed & Accuracy Test
 * ==============================================================================
 *
 * 🎓 TEACHING OBJECTIVE:
 * This program is designed as the FIRST program for students. It serves two purposes:
 *  1. An interactive, fun Typing Speed Test using real OS hardware timers (POSIX alarm).
 *  2. A pedagogical walkthrough explaining every fundamental building block of a
 *     production C program:
 *       - Section 1: Preprocessor Directives & Standard Libraries
 *       - Section 2: Macros & Configuration Constants
 *       - Section 3: Data Types, Structs & Type Definitions
 *       - Section 4: Global Volatile State & Signal / Timer Handlers
 *       - Section 5: Word Counting & Metric Calculation Logic (Words, WPM & Accuracy)
 *       - Section 6: User Interface & Formatting
 *       - Section 7: The main() Entry Point, Real-Time Input Loop & Exit Codes
 *
 * ⏱ HOW THE TIMER & INPUT WORK:
 *  - Configures non-canonical terminal mode (termios) so every single typed key
 *    is captured in real-time as the student types.
 *  - Uses POSIX signal handling (SIGALRM) with alarm(TEST_DURATION_SECONDS).
 *  - When the countdown timer expires, the OS sends SIGALRM, unblocking read().
 *  - When timeout happens, the program STOPS immediately, counts the exact number
 *    of words and characters typed before time ran out, and presents the scorecard!
 *  - If the student finishes early and presses [ENTER], it disarms the timer and
 *    scores based on the exact elapsed duration.
 *
 * 🛠 COMPILATION & EXECUTION:
 *    gcc -Wall -Wextra -std=c11 typing_speed.c -o typing_speed
 *    ./typing_speed
 * ==============================================================================
 */

/* ==============================================================================
 * SECTION 1: PREPROCESSOR DIRECTIVES & STANDARD HEADERS
 * ------------------------------------------------------------------------------
 * Headers provide declarations for functions implemented in the C Standard Library.
 * ==============================================================================
 */
#include <stdio.h>      /* Standard Input/Output: printf(), fflush()           */
#include <stdlib.h>     /* General Utilities: system(), exit(), EXIT_SUCCESS   */
#include <stdint.h>     /* Fixed-width integers: uint32_t, int32_t             */
#include <stdbool.h>    /* Boolean type: true, false, bool                     */
#include <string.h>     /* String manipulation: strlen(), strncpy()            */
#include <ctype.h>      /* Character classification: isspace()                 */
#include <time.h>       /* Time tracking: time(), difftime(), time_t           */
#include <unistd.h>     /* POSIX Operating System API: alarm(), isatty(), read */
#include <signal.h>     /* Signal handling: sigaction, SIGALRM, sig_atomic_t   */
#include <termios.h>    /* Terminal I/O control: tcgetattr(), tcsetattr()      */
#include <errno.h>      /* Error numbers: errno, EINTR                         */

/* ==============================================================================
 * SECTION 2: MACROS & CONFIGURATION CONSTANTS
 * ------------------------------------------------------------------------------
 * Macros (#define) perform compile-time text replacement.
 * Always parenthesize expressions to avoid operator precedence bugs!
 * ==============================================================================
 */
#ifndef DEFAULT_TEST_SECONDS
#define DEFAULT_TEST_SECONDS   (30U)     /* Countdown timer limit in seconds */
#endif
#define BUFFER_CAPACITY        (2048U)   /* Maximum input character buffer */
#define CHARS_PER_WORD         (5.0)     /* Standard typing metric: 5 chars = 1 word */

/* Target test paragraph for students to type */
static const char * const TARGET_PARAGRAPH =
    "Embedded C programming bridges software with physical silicon. "
    "Deterministic timing, interrupt handling, and robust defensive programming "
    "are the hallmarks of great firmware engineers.";

/* ==============================================================================
 * SECTION 3: DATA STRUCTURES & TYPE DEFINITIONS
 * ------------------------------------------------------------------------------
 * Structures group related variables into a single coherent entity.
 * ==============================================================================
 */
typedef struct {
    double   elapsed_seconds;      /* Total time spent typing */
    uint32_t total_words_typed;    /* Total count of words typed */
    uint32_t correct_words_typed;  /* Count of fully correct words */
    uint32_t total_chars_typed;    /* Total keys pressed */
    uint32_t correct_chars;        /* Characters matching target exactly */
    uint32_t error_chars;          /* Mismatched characters */
    double   gross_wpm;            /* (total_chars / 5.0) / minutes */
    double   net_wpm;              /* (correct_chars / 5.0) / minutes */
    double   accuracy_percent;     /* (correct_chars / total_chars) * 100% */
} TypingResult_t;

/* ==============================================================================
 * SECTION 4: GLOBAL STATE & ASYNCHRONOUS SIGNAL HANDLER
 * ------------------------------------------------------------------------------
 * volatile sig_atomic_t guarantees atomic, safe modification from within an ISR
 * or OS signal handler without compiler register-caching issues.
 * ==============================================================================
 */
static volatile sig_atomic_t g_time_up = 0;
static struct termios g_orig_termios;
static bool g_termios_saved = false;

/**
 * @brief Restores terminal to original canonical echo mode.
 */
static void Terminal_Restore(void)
{
    if (g_termios_saved) {
        tcsetattr(STDIN_FILENO, TCSANOW, &g_orig_termios);
        g_termios_saved = false;
    }
}

/**
 * @brief Handles Ctrl+C (SIGINT) to ensure terminal is restored before exit.
 */
static void Sigint_Handler(int signum)
{
    (void)signum;
    Terminal_Restore();
    printf("\n\n[Test interrupted by user]. Exiting.\n");
    exit(EXIT_SUCCESS);
}

/**
 * @brief OS Signal Handler for SIGALRM (Timer Expiry).
 * This function is called asynchronously by the Operating System when alarm() fires!
 */
static void Timer_SignalHandler(int signum)
{
    (void)signum; /* Suppress unused parameter warning */
    g_time_up = 1;
}

/**
 * @brief Configures POSIX signal handling without SA_RESTART so blocking input aborts.
 */
static void Timer_Configure(void)
{
    struct sigaction sa;
    memset(&sa, 0, sizeof(sa));
    sa.sa_handler = Timer_SignalHandler;
    sigemptyset(&sa.sa_mask);
    
    /* Crucial: DO NOT set SA_RESTART!
     * This causes blocking read() to immediately unblock and return -1 with EINTR when alarm fires.
     */
    sa.sa_flags = 0; 
    sigaction(SIGALRM, &sa, NULL);

    /* Also catch SIGINT (Ctrl+C) to safely restore terminal echo */
    struct sigaction sa_int;
    memset(&sa_int, 0, sizeof(sa_int));
    sa_int.sa_handler = Sigint_Handler;
    sigemptyset(&sa_int.sa_mask);
    sa_int.sa_flags = 0;
    sigaction(SIGINT, &sa_int, NULL);
}

/* ==============================================================================
 * SECTION 5: WORD COUNTING & METRIC CALCULATION LOGIC
 * ------------------------------------------------------------------------------
 * Pure business logic: counts words, accuracy, gross WPM, and net WPM.
 * ==============================================================================
 */

/**
 * @brief Counts the number of whitespace-delimited words in a string.
 */
static uint32_t Count_Words(const char *text)
{
    uint32_t count = 0;
    bool in_word = false;

    if (text == NULL) return 0;

    for (size_t i = 0; text[i] != '\0'; ++i) {
        if (!isspace((unsigned char)text[i])) {
            if (!in_word) {
                in_word = true;
                count++;
            }
        } else {
            in_word = false;
        }
    }
    return count;
}

/**
 * @brief Compares typed words against target words to count matching words.
 */
static uint32_t Count_CorrectWords(const char *target, const char *typed)
{
    if (target == NULL || typed == NULL) return 0;

    /* Duplicate strings to tokenize safely */
    char target_copy[BUFFER_CAPACITY];
    char typed_copy[BUFFER_CAPACITY];
    strncpy(target_copy, target, sizeof(target_copy) - 1);
    strncpy(typed_copy, typed, sizeof(typed_copy) - 1);
    target_copy[sizeof(target_copy) - 1] = '\0';
    typed_copy[sizeof(typed_copy) - 1] = '\0';

    uint32_t correct_words = 0;
    char *saveptr_target = NULL;
    char *saveptr_typed  = NULL;

    char *token_target = strtok_r(target_copy, " \t\r\n", &saveptr_target);
    char *token_typed  = strtok_r(typed_copy, " \t\r\n", &saveptr_typed);

    while (token_target != NULL && token_typed != NULL) {
        if (strcmp(token_target, token_typed) == 0) {
            correct_words++;
        }
        token_target = strtok_r(NULL, " \t\r\n", &saveptr_target);
        token_typed  = strtok_r(NULL, " \t\r\n", &saveptr_typed);
    }

    return correct_words;
}

/**
 * @brief Computes all typing metrics (Words, Characters, WPM, Accuracy).
 */
static TypingResult_t Calculate_Score(const char *target, 
                                     const char *typed, 
                                     double elapsed_sec)
{
    TypingResult_t res;
    memset(&res, 0, sizeof(TypingResult_t));

    /* Clamp elapsed time to a positive non-zero minimum to avoid division by zero */
    if (elapsed_sec < 0.5) {
        elapsed_sec = 0.5;
    }
    res.elapsed_seconds = elapsed_sec;

    /* Count total and correct words */
    res.total_words_typed   = Count_Words(typed);
    res.correct_words_typed = Count_CorrectWords(target, typed);

    size_t target_len = strlen(target);
    size_t typed_len  = strlen(typed);

    /* Strip trailing newline from input if present */
    if (typed_len > 0 && typed[typed_len - 1] == '\n') {
        typed_len--;
    }
    res.total_chars_typed = (uint32_t)typed_len;

    /* Compare typed text character-by-character against target */
    uint32_t matches = 0;
    uint32_t errors  = 0;
    size_t compare_len = (typed_len < target_len) ? typed_len : target_len;

    for (size_t i = 0; i < compare_len; ++i) {
        if (typed[i] == target[i]) {
            matches++;
        } else {
            errors++;
        }
    }

    /* Any characters typed beyond the target paragraph length count as errors */
    if (typed_len > target_len) {
        errors += (uint32_t)(typed_len - target_len);
    }

    res.correct_chars = matches;
    res.error_chars   = errors;

    /* Standard WPM formula: 1 word = 5 keystrokes */
    double minutes = elapsed_sec / 60.0;
    res.gross_wpm = (res.total_chars_typed / CHARS_PER_WORD) / minutes;
    res.net_wpm   = (res.correct_chars / CHARS_PER_WORD) / minutes;

    /* Accuracy calculation */
    if (res.total_chars_typed > 0) {
        res.accuracy_percent = ((double)res.correct_chars / (double)res.total_chars_typed) * 100.0;
    } else {
        res.accuracy_percent = 0.0;
    }

    return res;
}

/* ==============================================================================
 * SECTION 6: USER INTERFACE & FORMATTING HELPERS
 * ------------------------------------------------------------------------------
 * Clean formatting and skill evaluation based on Net WPM.
 * ==============================================================================
 */
static const char *Get_SkillRating(double net_wpm, double accuracy)
{
    if (accuracy < 70.0) return "⚠️ Needs Accuracy Practice (Focus on precision over speed)";
    if (net_wpm < 25.0)  return "🌱 Beginner Typist (Getting started)";
    if (net_wpm < 45.0)  return "⚡ Average Typist (Solid foundation)";
    if (net_wpm < 70.0)  return "🚀 Fast Typist (Proficient Developer)";
    return "🏆 Pro Firmware Engineer (Elite Keyboard Virtuoso!)";
}

static void Print_ScoreBoard(const TypingResult_t *r, bool timed_out)
{
    printf("\n============================================================\n");
    printf("                  📊 TYPING TEST SCORECARD                  \n");
    printf("============================================================\n");
    if (timed_out) {
        printf("  ⏱ Status            : \033[1;31m⏰ TIME'S UP (Expired at %.2fs)\033[0m\n", r->elapsed_seconds);
    } else {
        printf("  ⏱ Status            : \033[1;32m✅ COMPLETED EARLY (in %.2fs)\033[0m\n", r->elapsed_seconds);
    }
    printf("  📝 Words Typed      : \033[1;33m%u words\033[0m (%u correct, %u errors)\n", 
           r->total_words_typed, r->correct_words_typed, 
           (r->total_words_typed >= r->correct_words_typed) ? (r->total_words_typed - r->correct_words_typed) : 0U);
    printf("  ⌨️ Total Characters : %u\n", r->total_chars_typed);
    printf("  ✅ Correct Keys     : %u\n", r->correct_chars);
    printf("  ❌ Mistakes / Errors : %u\n", r->error_chars);
    printf("  🎯 Accuracy Rate    : %.1f%%\n", r->accuracy_percent);
    printf("  ⚡ Gross Speed      : %.1f WPM\n", r->gross_wpm);
    printf("  🏁 Net Speed        : \033[1;32m%.1f WPM\033[0m\n", r->net_wpm);
    printf("------------------------------------------------------------\n");
    printf("  🏅 Skill Level      : %s\n", Get_SkillRating(r->net_wpm, r->accuracy_percent));
    printf("============================================================\n\n");
}

/* ==============================================================================
 * SECTION 7: PROGRAM ENTRY POINT (main)
 * ------------------------------------------------------------------------------
 * Demonstrates terminal raw/non-canonical input, signals, and control flow.
 * ==============================================================================
 */
int main(void)
{
    char user_input[BUFFER_CAPACITY];
    memset(user_input, 0, sizeof(user_input));

    /* Display Welcome Banner */
    printf("============================================================\n");
    printf("  WELCOME TO THE EMBEDDED C TYPING SPEED & ACCURACY TEST    \n");
    printf("============================================================\n");
    printf("Instructions:\n");
    printf("1. You will have %u seconds to type the paragraph below.\n", DEFAULT_TEST_SECONDS);
    printf("2. The countdown timer starts the moment you press [ENTER].\n");
    printf("3. When time is up, the OS timer will stop input automatically\n");
    printf("   and count all words and characters typed so far!\n");
    printf("4. Or, press [ENTER] when you finish typing to submit early!\n");
    printf("============================================================\n\n");

    printf("📜 TEXT TO TYPE:\n");
    printf("------------------------------------------------------------\n");
    printf("\033[1;36m%s\033[0m\n", TARGET_PARAGRAPH);
    printf("------------------------------------------------------------\n\n");

    printf("Press [ENTER] when you are ready to begin countdown...");
    fflush(stdout);

    /* Wait for user to press ENTER using unbuffered read */
    char enter_ch = 0;
    while (read(STDIN_FILENO, &enter_ch, 1) > 0) {
        if (enter_ch == '\n' || enter_ch == '\r') {
            break;
        }
    }

    /* Install the POSIX Timer Signal Handler */
    Timer_Configure();

    printf("\n🚀 GO! TIMER STARTED (%u SECONDS). TYPE BELOW:\n", DEFAULT_TEST_SECONDS);
    printf(">> ");
    fflush(stdout);

    /* Check if standard input is an interactive terminal */
    bool is_terminal = isatty(STDIN_FILENO);

    if (is_terminal) {
        /* Enable non-canonical mode without driver auto-echo so program echoes exactly once */
        tcgetattr(STDIN_FILENO, &g_orig_termios);
        g_termios_saved = true;
        atexit(Terminal_Restore);

        struct termios raw_termios = g_orig_termios;
        raw_termios.c_lflag &= ~(ICANON | ECHO); /* Disable canonical mode AND driver auto-echo */
        raw_termios.c_cc[VMIN]  = 1;              /* Wait for at least 1 character */
        raw_termios.c_cc[VTIME] = 0;              /* No character timer timeout */
        tcsetattr(STDIN_FILENO, TCSANOW, &raw_termios);
    }

    /* Arm the OS Timer: alarm() will deliver SIGALRM in DEFAULT_TEST_SECONDS */
    alarm(DEFAULT_TEST_SECONDS);
    time_t start_time = time(NULL);

    size_t input_idx = 0;

    /* Real-Time Input Loop: captures every character until time expires or Enter is pressed */
    while (!g_time_up && (input_idx < (BUFFER_CAPACITY - 1))) {
        char ch = 0;
        ssize_t bytes_read = read(STDIN_FILENO, &ch, 1);

        if (g_time_up) {
            break; /* Timer expired! */
        }

        if (bytes_read <= 0) {
            if (errno == EINTR) {
                /* Interrupted by SIGALRM signal! */
                break;
            }
            break; /* EOF or error */
        }

        /* Check for Enter key (submission) */
        if (ch == '\n' || ch == '\r') {
            printf("\n");
            break;
        }

        /* Handle Backspace key (ASCII 8 or 127) */
        if (ch == 127 || ch == '\b') {
            if (input_idx > 0) {
                input_idx--;
                user_input[input_idx] = '\0';
                if (is_terminal) {
                    /* Visually erase character in terminal */
                    printf("\b \b");
                    fflush(stdout);
                }
            }
            continue;
        }

        /* Store character into input buffer and echo to screen */
        user_input[input_idx++] = ch;
        user_input[input_idx]   = '\0';

        if (is_terminal) {
            putchar(ch);
            fflush(stdout);
        }
    }

    /* Disarm the timer once input completes or gets interrupted */
    alarm(0);
    time_t end_time = time(NULL);

    /* Restore original terminal settings */
    if (is_terminal) {
        Terminal_Restore();
    }

    double elapsed_sec = difftime(end_time, start_time);
    bool timed_out = (g_time_up != 0);

    /* Check whether time expired via signal handler */
    if (timed_out) {
        printf("\n\n\033[1;31m⏰ TIME'S UP! The %u-second countdown expired!\033[0m\n", DEFAULT_TEST_SECONDS);
        uint32_t words_captured = Count_Words(user_input);
        printf("You typed \033[1;33m%u words\033[0m (%zu characters) before the timer halted execution.\n", 
               words_captured, input_idx);
        elapsed_sec = (double)DEFAULT_TEST_SECONDS;
    } else {
        printf("\n\033[1;32m🎉 Done! You completed typing before the timer expired.\033[0m\n");
    }

    /* Compute scores */
    TypingResult_t results = Calculate_Score(TARGET_PARAGRAPH, user_input, elapsed_sec);

    /* Print scorecard */
    Print_ScoreBoard(&results, timed_out);

    /* Pedagogical summary for students */
    printf("💡 ANATOMY OF THIS C PROGRAM FOR STUDENTS:\n");
    printf(" 1. termios non-canonical mode captured keystrokes in real-time so that\n");
    printf("    when timeout occurred, all %u typed words were preserved!\n", results.total_words_typed);
    printf(" 2. Count_Words() traversed whitespace transitions to accurately count words.\n");
    printf(" 3. sigaction() and alarm(%u) demonstrated asynchronous OS event handling.\n", DEFAULT_TEST_SECONDS);
    printf(" 4. volatile sig_atomic_t g_time_up ensured safe communication between the\n");
    printf("    signal handler (emulating an interrupt) and main().\n");
    printf(" 5. Floating-point typecasts (double) prevented integer truncation errors.\n\n");

    return EXIT_SUCCESS; /* Return 0 to OS indicating clean execution */
}
