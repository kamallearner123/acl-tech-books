/**
 * ==============================================================================
 * Topic 4: Bitwise Operations - Program 1: Register Bit Manipulation
 * ==============================================================================
 * Description:
 * Demonstrates the 5 foundational bit operations essential for MCU programming:
 *  1. SET BIT (OR with mask)
 *  2. CLEAR BIT (AND with inverted mask)
 *  3. TOGGLE BIT (XOR with mask)
 *  4. TEST BIT (AND with mask)
 *  5. MODIFY MULTI-BIT FIELD (Clear then Set)
 *
 * Simulates ARM Cortex-M GPIO Registers (MODER, ODR, BSRR).
 * ==============================================================================
 */

#include <stdio.h>
#include <stdlib.h>
#include <stdint.h>
#include <stdbool.h>

/* Helper function to print binary representation of a 32-bit integer */
void Print_Binary32(const char *label, uint32_t val)
{
    printf("%-20s: 0x%08X | 0b", label, val);
    for (int8_t i = 31; i >= 0; --i) {
        printf("%c", ((val >> (uint8_t)i) & 1U) ? '1' : '0');
        if ((i % 8 == 0) && (i != 0)) {
            printf("_");
        }
    }
    printf("\n");
}

int main(void)
{
    printf("============================================================\n");
    printf("  Embedded C: Bitwise Operations & Register Manipulation\n");
    printf("============================================================\n\n");

    /* Simulated 32-bit Microcontroller Register */
    uint32_t simulated_reg = 0x00000000U;
    Print_Binary32("Initial Register", simulated_reg);
    printf("\n");

    /* 1. SET BIT: Turn ON LED at Pin 5 */
    #define PIN_LED (5U)
    printf("[1] SET BIT (Turn ON Pin %u):\n", PIN_LED);
    printf("    Formula: REG |= (1U << %u)\n", PIN_LED);
    simulated_reg |= (1U << PIN_LED);
    Print_Binary32("After Set Pin 5", simulated_reg);
    printf("\n");

    /* 2. SET MULTIPLE BITS: Turn ON Pins 1, 2, and 7 */
    printf("[2] SET MULTIPLE BITS (Pins 1, 2, 7):\n");
    simulated_reg |= (1U << 1) | (1U << 2) | (1U << 7);
    Print_Binary32("After Pins 1,2,7 Set", simulated_reg);
    printf("\n");

    /* 3. TEST / CHECK BIT: Is Pin 5 HIGH? */
    printf("[3] TEST BIT:\n");
    bool is_pin5_high = (simulated_reg & (1U << PIN_LED)) != 0U;
    printf("    Is Pin %u HIGH? %s\n", PIN_LED, is_pin5_high ? "YES (HIGH)" : "NO (LOW)");
    bool is_pin4_high = (simulated_reg & (1U << 4)) != 0U;
    printf("    Is Pin 4 HIGH? %s\n\n", is_pin4_high ? "YES (HIGH)" : "NO (LOW)");

    /* 4. TOGGLE BIT: Flip Pin 5 */
    printf("[4] TOGGLE BIT (Flip Pin %u):\n", PIN_LED);
    printf("    Formula: REG ^= (1U << %u)\n", PIN_LED);
    simulated_reg ^= (1U << PIN_LED);
    Print_Binary32("After 1st Toggle", simulated_reg);
    simulated_reg ^= (1U << PIN_LED);
    Print_Binary32("After 2nd Toggle", simulated_reg);
    printf("\n");

    /* 5. CLEAR BIT: Turn OFF Pin 2 */
    #define PIN_CLEAR (2U)
    printf("[5] CLEAR BIT (Turn OFF Pin %u):\n", PIN_CLEAR);
    printf("    Formula: REG &= ~(1U << %u)\n", PIN_CLEAR);
    simulated_reg &= ~(1U << PIN_CLEAR);
    Print_Binary32("After Clear Pin 2", simulated_reg);
    printf("\n");

    /* 6. MULTI-BIT FIELD MODIFICATION:
     * In STM32 GPIOx_MODER, each pin uses 2 bits:
     * 00 = Input, 01 = Output, 10 = Alternate Function, 11 = Analog
     * Let's configure Pin 5 to Alternate Function (mode = 0b10)
     */
    printf("[6] MULTI-BIT FIELD CONFIGURATION (STM32 GPIOx_MODER):\n");
    uint32_t moder_reg = 0x00000000U;
    uint32_t pin_num = 5U;
    uint32_t mode_val = 0x02U; /* 0b10: Alternate Function */
    
    Print_Binary32("Initial MODER", moder_reg);

    /* Step A: Clear the 2-bit field at (pin_num * 2) */
    moder_reg &= ~(0x03U << (pin_num * 2U));
    /* Step B: Set the desired mode bits */
    moder_reg |= (mode_val << (pin_num * 2U));

    Print_Binary32("MODER after Pin 5 AF", moder_reg);

    printf("\n============================================================\n");
    printf("Takeaway: Always use (1U << N) with unsigned literal 'U'\n");
    printf("to prevent undefined behavior from signed integer overflow!\n");
    printf("============================================================\n");

    return EXIT_SUCCESS;
}
