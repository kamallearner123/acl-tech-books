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
 *       - Section 5: String & Metric Calculation Logic (WPM & Accuracy)
 *       - Section 6: User Interface & Formatting
 *       - Section 7: The main() Entry Point, Control Flow & Exit Codes
 *
 * ⏱ HOW THE TIMER WORKS:
 *  - Uses POSIX signal handling (SIGALRM) with alarm(TEST_DURATION_SECONDS).
 *  - When the timer expires, the OS sends a SIGALRM signal interrupting fgets().
 *  - The program catches the signal, sets g_time_up = true, terminates input,
 *    and immediately calculates the score.
 *  - If the user finishes before the timer expires, exact elapsed time is measured.
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
#include <stdio.h>      /* Standard Input/Output: printf(), fgets(), fflush() */
#include <stdlib.h>     /* General Utilities: system(), exit(), EXIT_SUCCESS   */
#include <stdint.h>     /* Fixed-width integers: uint32_t, int32_t             */
#include <stdbool.h>    /* Boolean type: true, false, bool                     */
#include <string.h>     /* String manipulation: strlen(), strncpy()            */
#include <time.h>       /* Time tracking: time(), difftime(), time_t           */
#include <unistd.h>     /* POSIX Operating System API: alarm(), sleep()        */
#include <signal.h>     /* Signal handling: signal(), sigaction, SIGALRM       */
#include <errno.h>      /* Error numbers: errno, EINTR                         */

/* ==============================================================================
 * SECTION 2: MACROS & CONFIGURATION CONSTANTS
 * ------------------------------------------------------------------------------
 * Macros (#define) perform compile-time text replacement.
 * Always parenthesize expressions to avoid operator precedence bugs!
 * ==============================================================================
 */
#define DEFAULT_TEST_SECONDS   (30U)     /* Countdown timer limit */
#define BUFFER_CAPACITY        (1024U)   /* Maximum input character buffer */
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
     * This causes blocking read/fgets to immediately unblock and return EINTR when alarm fires.
     */
    sa.sa_flags = 0; 
    sigaction(SIGALRM, &sa, NULL);
}

/* ==============================================================================
 * SECTION 5: METRIC CALCULATION LOGIC
 * ------------------------------------------------------------------------------
 * Pure business logic: calculates accuracy, gross WPM, and net WPM.
 * ==============================================================================
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

static void Print_ScoreBoard(const TypingResult_t *r)
{
    printf("\n============================================================\n");
    printf("                  📊 TYPING TEST SCORECARD                  \n");
    printf("============================================================\n");
    printf("  ⏱ Time Elapsed     : %.2f seconds\n", r->elapsed_seconds);
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
 * The operating system transfers control here upon launching the binary.
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
    printf("3. When time is up, the OS timer will stop input automatically.\n");
    printf("4. Or, press [ENTER] when you finish typing to submit early!\n");
    printf("============================================================\n\n");

    printf("📜 TEXT TO TYPE:\n");
    printf("------------------------------------------------------------\n");
    printf("\033[1;36m%s\033[0m\n", TARGET_PARAGRAPH);
    printf("------------------------------------------------------------\n\n");

    printf("Press [ENTER] when you are ready to begin countdown...");
    fflush(stdout);

    /* Wait for user to press ENTER */
    int c;
    while ((c = getchar()) != '\n' && c != EOF) {}

    /* Install the POSIX Timer Signal Handler */
    Timer_Configure();

    printf("\n🚀 GO! TIMER STARTED (%u SECONDS). TYPE BELOW:\n", DEFAULT_TEST_SECONDS);
    printf(">> ");
    fflush(stdout);

    /* Arm the OS Timer: alarm() will deliver SIGALRM in DEFAULT_TEST_SECONDS */
    alarm(DEFAULT_TEST_SECONDS);
    time_t start_time = time(NULL);

    /* Read user input from STDIN (stops if user hits Enter OR if SIGALRM triggers) */
    char *read_ptr = fgets(user_input, BUFFER_CAPACITY, stdin);

    /* Disarm the timer once input completes or gets interrupted */
    alarm(0);
    time_t end_time = time(NULL);

    double elapsed_sec = difftime(end_time, start_time);

    /* Check whether time expired via signal handler */
    if (g_time_up || (read_ptr == NULL && errno == EINTR)) {
        printf("\n\n\033[1;31m⏰ TIME'S UP! The %u-second countdown expired!\033[0m\n", DEFAULT_TEST_SECONDS);
        elapsed_sec = (double)DEFAULT_TEST_SECONDS;
    } else {
        printf("\n\n\033[1;32m🎉 Done! You completed typing before the timer expired.\033[0m\n");
    }

    /* Compute scores */
    TypingResult_t results = Calculate_Score(TARGET_PARAGRAPH, user_input, elapsed_sec);

    /* Print results */
    Print_ScoreBoard(&results);

    /* Pedagogical summary for students */
    printf("💡 ANATOMY OF THIS C PROGRAM FOR STUDENTS:\n");
    printf(" - #include directives brought in standard library functions.\n");
    printf(" - struct TypingResult_t bundled multiple statistics into one clean type.\n");
    printf(" - sigaction() and alarm(%u) demonstrated asynchronous OS event handling.\n", DEFAULT_TEST_SECONDS);
    printf(" - volatile sig_atomic_t g_time_up ensured safe communication between the\n");
    printf("   signal handler (emulating an interrupt) and main().\n");
    printf(" - Floating-point typecasts (double) prevented integer truncation errors.\n\n");

    return EXIT_SUCCESS; /* Return 0 to OS indicating clean execution */
}
