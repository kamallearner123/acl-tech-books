/**
 * ==============================================================================
 * Topic 5: Pointers - Program 1: Pointer Fundamentals & Struct Memory Alignment
 * ==============================================================================
 * Description:
 * Demonstrates:
 *  1. Basic Pointer syntax (&, *) and pointer arithmetic
 *  2. Const correctness:
 *     - const int *ptr (pointer to const data)
 *     - int * const ptr (const pointer to mutable data)
 *  3. Struct Memory Alignment & Padding (Crucial for hardware register layouts!)
 * ==============================================================================
 */

#include <stdio.h>
#include <stdlib.h>
#include <stdint.h>
#include <stddef.h>

/* Demonstrating Struct Padding */
typedef struct {
    uint8_t  flag;      /* 1 byte */
    /* Compiler inserts 3 bytes of padding here on 32-bit systems! */
    uint32_t counter;   /* 4 bytes */
    uint16_t sensor_id; /* 2 bytes */
    /* Compiler inserts 2 bytes of trailing padding here! */
} UnpackedStruct_t;

/* Packed Struct: Forces compiler to remove all padding (attribute packed) */
typedef struct __attribute__((packed)) {
    uint8_t  flag;      /* 1 byte */
    uint32_t counter;   /* 4 bytes */
    uint16_t sensor_id; /* 2 bytes */
} PackedStruct_t;

int main(void)
{
    printf("============================================================\n");
    printf("  Pointer Fundamentals & Memory Alignment in C\n");
    printf("============================================================\n\n");

    /* 1. Pointer Basics & Addresses */
    uint32_t value = 0xAABBCCDD;
    uint32_t *p_val = &value;

    printf("[1] Pointer Basics:\n");
    printf("  value content:              0x%08X\n", value);
    printf("  Address of value (&value):   %p\n", (void*)&value);
    printf("  Pointer variable (p_val):    %p\n", (void*)p_val);
    printf("  Dereferenced value (*p_val): 0x%08X\n\n", *p_val);

    /* 2. Pointer Arithmetic */
    uint16_t adc_buffer[4] = { 100, 200, 300, 400 };
    uint16_t *p_adc = adc_buffer;

    printf("[2] Pointer Arithmetic (Walking a 16-bit array):\n");
    for (size_t i = 0; i < 4; ++i) {
        printf("  Element %zu: address %p, value = %u\n", 
               i, (void*)(p_adc + i), *(p_adc + i));
    }
    printf("  Notice how each address increments by %zu bytes (sizeof(uint16_t))!\n\n", sizeof(uint16_t));

    /* 3. Const Correctness */
    printf("[3] Const Correctness Matrix:\n");
    int32_t var_a = 10;
    int32_t var_b = 20;

    /* A: Pointer to constant data (data cannot be changed via ptr) */
    const int32_t *p_const_data = &var_a;
    printf("  const int *p: Points to %d. Can point to var_b (%d), but *p cannot be modified.\n", 
           *p_const_data, var_b);
    p_const_data = &var_b; /* Allowed */

    /* B: Constant pointer to mutable data (address cannot be changed) */
    int32_t * const p_const_ptr = &var_a;
    *p_const_ptr = 55; /* Allowed */
    printf("  int * const p: Address is fixed (%p), but data modified to %d.\n\n", 
           (void*)p_const_ptr, *p_const_ptr);

    /* 4. Struct Padding vs Packed Layout */
    printf("[4] Struct Memory Alignment & Padding:\n");
    printf("  Sum of member bytes (1 + 4 + 2):       7 bytes\n");
    printf("  Actual sizeof(UnpackedStruct_t):      %zu bytes (Compiler added 5 padding bytes!)\n", 
           sizeof(UnpackedStruct_t));
    printf("  Actual sizeof(PackedStruct_t):        %zu bytes (Zero padding)\n\n", 
           sizeof(PackedStruct_t));

    printf("  Offset of members in UnpackedStruct_t:\n");
    printf("    offset of 'flag':      %zu\n", offsetof(UnpackedStruct_t, flag));
    printf("    offset of 'counter':   %zu (aligned to 4-byte boundary!)\n", offsetof(UnpackedStruct_t, counter));
    printf("    offset of 'sensor_id': %zu\n", offsetof(UnpackedStruct_t, sensor_id));

    printf("\n============================================================\n");
    printf("Embedded Lesson: Hardware registers MUST match physical chip\n");
    printf("memory. Always understand how padding affects register maps!\n");
    printf("============================================================\n");

    return EXIT_SUCCESS;
}
