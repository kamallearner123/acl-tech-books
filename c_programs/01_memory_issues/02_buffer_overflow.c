/**
 * ==============================================================================
 * Topic 1: Memory Issues - Program 2: Buffer Overflow & Safe Boundaries
 * ==============================================================================
 * Description:
 * Demonstrates:
 *  1. How an off-by-one or unchecked array write corrupts neighboring stack data
 *  2. How to implement defensive boundary checks
 *  3. How modern compilers catch this with AddressSanitizer (-fsanitize=address)
 *
 * Compilation & Run:
 *   gcc -Wall -Wextra -std=c11 02_buffer_overflow.c -o buffer_overflow
 *   ./buffer_overflow
 *
 * Run with AddressSanitizer (catches illegal writes immediately):
 *   gcc -Wall -Wextra -fsanitize=address -g 02_buffer_overflow.c -o asan_test
 *   ./asan_test
 * ==============================================================================
 */

#include <stdio.h>
#include <stdlib.h>
#include <stdint.h>
#include <stdbool.h>

#define SENSOR_BUFFER_CAPACITY (4U)

typedef struct {
    uint32_t sensor_readings[SENSOR_BUFFER_CAPACITY];
    uint32_t safety_canary; /* Guard variable to detect memory corruption */
} SensorChannel_t;

/**
 * @brief SAFE implementation: Validates array indices defensively
 */
bool Safe_StoreReading(SensorChannel_t *p_channel, size_t index, uint32_t value)
{
    if (p_channel == NULL) {
        return false;
    }

    /* Defensive guard: ensure index is strictly within allocated bounds */
    if (index >= SENSOR_BUFFER_CAPACITY) {
        printf("  [SAFE GUARD TRIGGERED] Blocked out-of-bounds write at index %zu (Capacity: %u)!\n",
               index, SENSOR_BUFFER_CAPACITY);
        return false;
    }

    p_channel->sensor_readings[index] = value;
    return true;
}

/**
 * @brief DEMO of unsafe boundary overrun
 */
void Demo_UnsafeOverflow(SensorChannel_t *p_channel)
{
    printf("[1] Initial State:\n");
    printf("  safety_canary value: 0x%08X (Expected: 0xDEADBEEF)\n\n", p_channel->safety_canary);

    printf("[2] Executing Safe Writes (indices 0 to 3):\n");
    for (size_t i = 0; i < SENSOR_BUFFER_CAPACITY; ++i) {
        Safe_StoreReading(p_channel, i, (uint32_t)((i + 1) * 100));
        printf("  Stored readings[%zu] = %u\n", i, p_channel->sensor_readings[i]);
    }

    printf("\n[3] Attempting Out-of-Bounds Write with Safe Guard:\n");
    Safe_StoreReading(p_channel, SENSOR_BUFFER_CAPACITY, 9999U); /* index 4 is invalid */

    printf("\n[4] Unchecked Direct Buffer Overflow (Simulating buggy C driver):\n");
    printf("  Writing directly to sensor_readings[4] without checking bounds...\n");

    /* WARNING: Index 4 is out of bounds! In struct layout, it overwrites safety_canary! */
    p_channel->sensor_readings[SENSOR_BUFFER_CAPACITY] = 0xCAFEBABE;

    printf("  safety_canary value AFTER overflow: 0x%08X\n", p_channel->safety_canary);

    if (p_channel->safety_canary != 0xDEADBEEF) {
        printf("  CRITICAL ALERT: Stack/Struct Memory Corruption Detected!\n");
        printf("  Canary was overwritten from 0xDEADBEEF to 0x%08X\n", p_channel->safety_canary);
    }
}

int main(void)
{
    SensorChannel_t channel;
    channel.safety_canary = 0xDEADBEEF;

    printf("============================================================\n");
    printf("  Buffer Overflow & Defensive Bounds Checking Demo\n");
    printf("============================================================\n\n");

    Demo_UnsafeOverflow(&channel);

    printf("\n============================================================\n");
    printf("Student Exercise:\n");
    printf("1. Recompile this with: gcc -fsanitize=address -g 02_buffer_overflow.c\n");
    printf("2. Run it and observe how AddressSanitizer traps the illegal access.\n");
    printf("============================================================\n");

    return EXIT_SUCCESS;
}
