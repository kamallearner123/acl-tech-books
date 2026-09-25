# Topic 5: Pointers & C Polymorphism

Pointers are the bridge between C software and hardware memory. They enable zero-copy DMA streaming, interrupt callback hooks, and hardware abstraction.

## Programs Included

| File | Concepts Covered |
| :--- | :--- |
| `01_pointer_basics_and_structs.c` | Addresses (`&`), dereference (`*`), pointer arithmetic, const-correctness, and struct memory padding/alignment. |
| `02_function_pointers_and_callbacks.c` | Function pointers, asynchronous ISR callback registration, and struct interface VTABLEs (C polymorphism). |

## Quick Start

```bash
make
make run
```

## Student Practice Exercises

1. **Exercise 1 (Generic Void Pointer Swap)**:
   - Implement a generic swap function:
     `void Memory_Swap(void *p_a, void *p_b, size_t size);`
   - Test it swapping two `uint32_t` integers, and then two `struct` objects using `memcpy` or byte-by-byte copies.
2. **Exercise 2 (Function Pointer Dispatch Table)**:
   - Create an array of 4 math operation function pointers:
     `int32_t (*math_ops[4])(int32_t a, int32_t b) = { Add, Subtract, Multiply, Divide };`
   - Write a loop that executes all 4 operations over a pair of test integers.
3. **Exercise 3 (Struct Alignment Inspection)**:
   - Rearrange the members of `UnpackedStruct_t` in `01_pointer_basics_and_structs.c` from largest to smallest type:
     `uint32_t counter; uint16_t sensor_id; uint8_t flag;`
   - Run `make run` and observe how the compiler padding drops from 5 bytes to just 1 byte!
