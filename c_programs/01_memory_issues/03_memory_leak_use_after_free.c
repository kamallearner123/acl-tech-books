/**
 * ==============================================================================
 * Topic 1: Memory Issues - Program 3: Memory Leaks & Use-After-Free
 * ==============================================================================
 * Description:
 * Demonstrates:
 *  1. Memory Leak: Losing references to dynamically allocated heap blocks
 *  2. Dangling Pointer & Use-After-Free: Accessing memory that has been freed
 *  3. Embedded Defense: Prefer static ring buffers over runtime heap allocation
 *
 * Compilation & Run:
 *   gcc -Wall -Wextra -std=c11 03_memory_leak_use_after_free.c -o leak_demo
 *   ./leak_demo
 *
 * With AddressSanitizer:
 *   gcc -Wall -Wextra -fsanitize=address -g 03_memory_leak_use_after_free.c -o leak_asan
 *   ./leak_asan
 * ==============================================================================
 */

#include <stdio.h>
#include <stdlib.h>
#include <stdint.h>
#include <string.h>

#define PACKET_SIZE (32U)

/**
 * @brief Demonstrates a Memory Leak
 */
void Demo_MemoryLeak(void)
{
    printf("[1] Memory Leak Demonstration:\n");
    for (int i = 0; i < 3; ++i) {
        char *temp_packet = (char *)malloc(PACKET_SIZE);
        if (temp_packet != NULL) {
            snprintf(temp_packet, PACKET_SIZE, "Telemetry Packet #%d", i);
            printf("  Allocated packet at %p: \"%s\"\n", (void*)temp_packet, temp_packet);
            /* BUG: Function exits without calling free(temp_packet)! */
            /* In a 24/7 industrial controller, this causes the MCU to run out of RAM! */
        }
    }
    printf("  --> Leaked 3 * 32 = 96 bytes of memory!\n\n");
}

/**
 * @brief Demonstrates Use-After-Free & Dangling Pointer
 */
void Demo_UseAfterFree(void)
{
    printf("[2] Dangling Pointer & Use-After-Free Demonstration:\n");
    
    int32_t *p_data = (int32_t *)malloc(sizeof(int32_t));
    if (p_data == NULL) return;

    *p_data = 12345;
    printf("  Allocated p_data at %p with value: %d\n", (void*)p_data, *p_data);

    /* Free the memory back to the heap */
    free(p_data);
    printf("  Memory at %p freed.\n", (void*)p_data);

    /* DANGER: p_data still points to that memory address! (Dangling pointer) */
    printf("  Accessing freed memory (Undefined Behavior): value = %d\n", *p_data);

    /* DEFENSIVE FIX: Always set pointer to NULL immediately after free */
    p_data = NULL;
    printf("  Defensive Fix: p_data set to NULL (%p)\n\n", (void*)p_data);
}

/**
 * @brief EMBEDDED BEST PRACTICE: Static Zero-Allocation Ring Buffer
 */
#define STATIC_BUFFER_SLOTS (4U)

typedef struct {
    char slots[STATIC_BUFFER_SLOTS][PACKET_SIZE];
    uint32_t head;
    uint32_t tail;
    uint32_t count;
} StaticPacketBuffer_t;

static StaticPacketBuffer_t g_packet_buffer; /* 100% deterministic, zero malloc! */

void StaticBuffer_Push(const char *msg)
{
    if (g_packet_buffer.count < STATIC_BUFFER_SLOTS) {
        strncpy(g_packet_buffer.slots[g_packet_buffer.head], msg, PACKET_SIZE - 1);
        g_packet_buffer.slots[g_packet_buffer.head][PACKET_SIZE - 1] = '\0';
        g_packet_buffer.head = (g_packet_buffer.head + 1U) % STATIC_BUFFER_SLOTS;
        g_packet_buffer.count++;
        printf("  StaticBuffer pushed successfully. Count: %u/%u\n", 
               g_packet_buffer.count, STATIC_BUFFER_SLOTS);
    } else {
        printf("  StaticBuffer FULL! Rejected packet (No heap explosion).\n");
    }
}

int main(void)
{
    printf("============================================================\n");
    printf("  Memory Leak & Use-After-Free Educational Demonstration\n");
    printf("============================================================\n\n");

    Demo_MemoryLeak();
    Demo_UseAfterFree();

    printf("[3] Safe Embedded Alternative (Static Allocation):\n");
    StaticBuffer_Push("CAN_MSG_SPEED_50KMH");
    StaticBuffer_Push("CAN_MSG_TEMP_42C");
    StaticBuffer_Push("CAN_MSG_VOLT_12V");

    printf("\n============================================================\n");
    printf("Summary:\n");
    printf("Static buffers eliminate dynamic allocation, leaks, and dangling\n");
    printf("pointers at compile-time!\n");
    printf("============================================================\n");

    return EXIT_SUCCESS;
}
