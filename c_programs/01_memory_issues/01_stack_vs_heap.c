/**
 * ==============================================================================
 * Topic 1: Memory Issues - Program 1: Stack vs Heap Memory
 * ==============================================================================
 * Description:
 * Demonstrates the physical and architectural differences between:
 *  1. Stack Memory (automatic lifetime, fast L1 cache, fixed frame limit)
 *  2. Heap Memory (manual lifetime via malloc/free, risk of fragmentation & leaks)
 *  3. Static/Global (.data & .bss) Memory (fixed lifetime, zero runtime allocation)
 *
 * Compilation & Run:
 *   gcc -Wall -Wextra -std=c11 01_stack_vs_heap.c -o stack_vs_heap
 *   ./stack_vs_heap
 * ==============================================================================
 */

#include <stdio.h>
#include <stdlib.h>
#include <stdint.h>

/* Global/Static Memory: Lives for the entire life of the process */
int32_t g_initialized_var = 42;       /* Placed in .data section */
int32_t g_uninitialized_var;          /* Placed in .bss section (zeroed at startup) */

void stack_frame_demo(int32_t depth)
{
    /* Local variable: allocated on the CPU Stack */
    int32_t local_stack_var = depth * 10;
    
    printf("  [Stack Depth %d] Local var address: %p (Value: %d)\n", 
           depth, (void*)&local_stack_var, local_stack_var);

    if (depth < 3) {
        stack_frame_demo(depth + 1);
    }
}

int main(void)
{
    printf("============================================================\n");
    printf("  Memory Layout Demonstration (Linux / macOS)\n");
    printf("============================================================\n\n");

    /* 1. Global / Static Section Addresses */
    printf("[1] Static & Global Memory (.data / .bss):\n");
    printf("  g_initialized_var (.data) address: %p\n", (void*)&g_initialized_var);
    printf("  g_uninitialized_var (.bss) address: %p\n\n", (void*)&g_uninitialized_var);

    /* 2. Stack Memory Addresses */
    printf("[2] Stack Memory (Grows downward on x86/ARM):\n");
    int32_t main_local = 100;
    printf("  main() local stack address:        %p\n", (void*)&main_local);
    stack_frame_demo(1);
    printf("\n");

    /* 3. Heap Memory Addresses */
    printf("[3] Heap Memory (Allocated dynamically via OS):\n");
    size_t num_elements = 5;
    int32_t *heap_arr = (int32_t *)malloc(num_elements * sizeof(int32_t));
    
    if (heap_arr == NULL) {
        fprintf(stderr, "Error: malloc failed!\n");
        return EXIT_FAILURE;
    }

    printf("  Heap allocated buffer address:     %p\n", (void*)heap_arr);
    printf("  Pointer variable address on Stack: %p\n", (void*)&heap_arr);

    for (size_t i = 0; i < num_elements; ++i) {
        heap_arr[i] = (int32_t)(i * 100);
    }

    printf("  Heap values: ");
    for (size_t i = 0; i < num_elements; ++i) {
        printf("%d ", heap_arr[i]);
    }
    printf("\n");

    /* Always free heap memory in desktop C! */
    free(heap_arr);
    heap_arr = NULL; /* Good practice: eliminate dangling pointer */

    printf("\n============================================================\n");
    printf("Key Embedded Takeaway:\n");
    printf("In embedded systems (MISRA-C Dir 4.12), heap usage is prohibited\n");
    printf("because allocation failures and fragmentation cause silent crashes.\n");
    printf("Use static buffers or bounded stack frames instead!\n");
    printf("============================================================\n");

    return EXIT_SUCCESS;
}
