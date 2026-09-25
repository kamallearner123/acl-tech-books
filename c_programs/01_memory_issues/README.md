# Topic 1: Memory Issues in C (Linux & macOS)

This laboratory module explores the most common memory pitfalls in C programs and how embedded engineers prevent them.

## Programs Included

| File | Concept Demonstrated | Key Learning |
| :--- | :--- | :--- |
| `01_stack_vs_heap.c` | Stack vs Heap vs Static (`.data`/`.bss`) | Understand physical memory addresses, stack frames, and why heap is prohibited in safety-critical systems. |
| `02_buffer_overflow.c` | Array bounds overrun & stack corruption | See how off-by-one writes overwrite neighboring data, and how defensive guards prevent it. |
| `03_memory_leak_use_after_free.c` | Memory leaks, dangling pointers, static buffers | Detect memory leaks and implement deterministic zero-malloc static buffers. |

## Quick Start (Build & Run)

```bash
# Build all programs
make

# Run all programs
make run

# Build with AddressSanitizer
make asan

# Clean binaries
make clean
```

## Student Practice Exercises

1. **Exercise 1 (Stack Overflow)**: In `01_stack_vs_heap.c`, change the recursion termination condition from `depth < 3` to an infinite loop or a large number (e.g. `1000000`). Run it and observe the operating system `Segmentation fault (core dumped)` caused by running out of stack space.
2. **Exercise 2 (ASAN Trapping)**: Build with `make asan` and execute `./02_buffer_overflow_asan`. Note the detailed call stack and memory layout emitted by AddressSanitizer showing the exact byte where the out-of-bounds write occurred.
3. **Exercise 3 (Safe Ring Buffer)**: In `03_memory_leak_use_after_free.c`, implement a `StaticBuffer_Pop(char *out_buf)` function that reads items in FIFO order and updates `g_packet_buffer.tail` and `g_packet_buffer.count`.
