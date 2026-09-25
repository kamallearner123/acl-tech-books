/**
 * ==============================================================================
 * Topic 6: Preprocessor - Program 1: Advanced Preprocessor & Macro Traps
 * ==============================================================================
 * Description:
 * Demonstrates:
 *  1. Common Macro Pitfalls (Unparenthesized macros & side-effect evaluation)
 *  2. Stringification operator (#) for printable symbol names
 *  3. Token-Pasting operator (##) for automated code generation
 *  4. Production-grade Variadic Logging Macro with __FILE__, __LINE__, and __func__
 *  5. Compile-time assertions (_Static_assert)
 * ==============================================================================
 */

#include <stdio.h>
#include <stdlib.h>
#include <stdint.h>
#include <stdbool.h>

/* ==============================================================================
 * 1. Macro Pitfalls: The Side-Effect Trap
 * ==============================================================================
 */
/* DANGEROUS MACRO: Evaluates argument twice! */
#define BAD_SQUARE(x)       (x * x)
/* SAFER MACRO: Parenthesized, but still suffers from side-effects! */
#define SAFER_SQUARE(x)     ((x) * (x))
/* INLINE FUNCTION (Best Practice): Evaluates argument exactly once! */
static inline int32_t Safe_Square(int32_t x) {
    return x * x;
}

/* ==============================================================================
 * 2. Stringification (#) and Token-Pasting (##)
 * ==============================================================================
 */
/* Stringify a symbol name directly into a string literal */
#define STR_EXPAND(tok)     #tok
#define STRINGIFY(tok)      STR_EXPAND(tok)

/* Token-pasting: Concatenate two tokens to synthesize variable names */
#define DEFINE_SENSOR(name, id_num) \
    typedef struct { uint32_t id; const char *label; } Sensor_##name##_t; \
    Sensor_##name##_t g_sensor_##name = { .id = id_num, .label = #name }

DEFINE_SENSOR(Temperature, 101);
DEFINE_SENSOR(Pressure, 102);

/* ==============================================================================
 * 3. Variadic Logging Macro with Metadata
 * ==============================================================================
 */
#ifdef DEBUG_ENABLED
    #define LOG_DEBUG(fmt, ...) \
        printf("[DEBUG] [%s:%d in %s()] " fmt "\n", \
               __FILE__, __LINE__, __func__, ##__VA_ARGS__)
#else
    #define LOG_DEBUG(fmt, ...) /* Zero overhead in Release builds! */
#endif

#define LOG_ERROR(fmt, ...) \
    fprintf(stderr, "[ERROR] [%s:%d in %s()] " fmt "\n", \
            __FILE__, __LINE__, __func__, ##__VA_ARGS__)

/* ==============================================================================
 * 4. Compile-Time Assertions (_Static_assert)
 * ==============================================================================
 */
typedef struct {
    uint32_t magic;
    uint16_t version;
    uint16_t payload_len;
} Header_t;

/* Enforce at compile-time that Header_t must be exactly 8 bytes */
_Static_assert(sizeof(Header_t) == 8, "Error: Header_t size mismatch! Struct alignment padding violation.");

int main(void)
{
    printf("============================================================\n");
    printf("  C Preprocessor Mastery: Traps, Stringify & Token-Pasting\n");
    printf("============================================================\n\n");

    /* 1. Macro Pitfall Demonstration */
    printf("[1] The Side-Effect Macro Trap:\n");
    int32_t a = 3;
    printf("  Initial a = %d\n", a);

    /* BAD_SQUARE(1 + 2) expands to (1 + 2 * 1 + 2) = 1 + 2 + 2 = 5! (NOT 9!) */
    int32_t bad_res = BAD_SQUARE(1 + 2);
    printf("  BAD_SQUARE(1 + 2) expands to: 1 + 2 * 1 + 2 = %d (Expected 9!)\n", bad_res);

    /* SAFER_SQUARE with post-increment side-effect: ((a++) * (a++)) */
    int32_t side_effect_res = SAFER_SQUARE(a++);
    printf("  SAFER_SQUARE(a++) evaluated a multiple times! Result: %d, Final a: %d\n", 
           side_effect_res, a);

    /* Safe Inline Function */
    a = 3;
    int32_t inline_res = Safe_Square(a++);
    printf("  Safe_Square(a++) evaluated a once: Result: %d, Final a: %d\n\n", 
           inline_res, a);

    /* 2. Stringification (#) Demo */
    printf("[2] Stringification (#) Operator:\n");
    #define BAUD_RATE 115200
    printf("  Baud rate identifier: %s = %d\n\n", STRINGIFY(BAUD_RATE), BAUD_RATE);

    /* 3. Token-Pasting (##) Demo */
    printf("[3] Token-Pasting (##) Macro Output:\n");
    printf("  Generated g_sensor_Temperature -> ID: %u, Label: \"%s\"\n", 
           g_sensor_Temperature.id, g_sensor_Temperature.label);
    printf("  Generated g_sensor_Pressure    -> ID: %u, Label: \"%s\"\n\n", 
           g_sensor_Pressure.id, g_sensor_Pressure.label);

    /* 4. Logging Macro Demo */
    printf("[4] Variadic Logging Macros:\n");
    LOG_DEBUG("Sensor initialization step %d complete (voltage = %.2fV)", 1, 3.29);
    LOG_ERROR("I2C Bus timeout occurred on Address 0x%02X!", 0x48);

    printf("\n============================================================\n");
    printf("Rule: Prefer 'static inline' functions over complex macros!\n");
    printf("Use macros strictly for header guards, constants, and logging.\n");
    printf("============================================================\n");

    return EXIT_SUCCESS;
}
