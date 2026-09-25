# Embedded C Practice Programs (Linux & macOS)

A comprehensive, zero-dependency suite of production-grade C programs designed for engineering instructors and students. Every program is self-contained, adheres to modern C standards (C11), and compiles cleanly on **macOS** (Clang/Apple LLVM) and **Linux Ubuntu / Debian / WSL** (GCC).

---

## 📂 Laboratory Directory Map

| Directory | Topic & Key Focus | Core Files |
| :--- | :--- | :--- |
| **`01_memory_issues/`** | Stack vs Heap, Buffer Overflows & Leaks | `01_stack_vs_heap.c`<br>`02_buffer_overflow.c`<br>`03_memory_leak_use_after_free.c` |
| **`02_makefiles/`** | Multi-File Modular C Build Pipeline | `src/main.c`<br>`src/math_utils.c`<br>`include/math_utils.h`<br>`Makefile` |
| **`03_event_driven/`** | Ring-Buffer Event Queues & Dispatchers | `01_event_loop.c` |
| **`04_bitwise_ops/`** | Register Bitfields & Telemetry Serialization | `01_bit_manipulation.c`<br>`02_packet_packing.c` |
| **`05_pointers/`** | Struct Alignment, Callbacks & C VTABLEs | `01_pointer_basics_and_structs.c`<br>`02_function_pointers_and_callbacks.c` |
| **`06_preprocessor/`** | Macro Traps, Stringify `#`, Token Paste `##` | `01_preprocessor_tricks_and_traps.c` |
| **`07_state_machines/`** | Switch-Case FSM & 2D State Tables ($O(1)$) | `01_switch_case_fsm.c`<br>`02_state_table_fsm.c` |

---

## 🚀 Quick Start Guide

### Prerequisites
* **macOS**: Xcode Command Line Tools (`xcode-select --install`)
* **Linux (Ubuntu/Debian/WSL)**: `sudo apt update && sudo apt install build-essential gdb`

### Build & Run Everything

```bash
# Enter the c_programs folder
cd c_programs

# 1. Compile all 7 topic projects
make

# 2. Run all demonstrations and test suites
make run

# 3. Clean up all compiled binaries
make clean
```

### Running an Individual Topic

Each subdirectory contains its own standalone `Makefile`:

```bash
# Example: Running the Bitwise Operations module
cd 04_bitwise_ops
make
make run
```

---

## 🎯 Instructor Guide & Student Practice Curriculum

### Module 1: Memory Issues
* **Goal**: Teach students how memory behaves physically in hardware.
* **Demonstration**: Run `make asan` in `01_memory_issues` to demonstrate how the compiler's AddressSanitizer traps illegal memory writes at runtime with stack traces.
* **Student Assignment**: In `03_memory_leak_use_after_free.c`, implement a `StaticBuffer_Pop()` FIFO function to safely consume telemetry packets without dynamic heap memory.

### Module 2: Makefiles
* **Goal**: Transition students from single-file academic scripts to modular multi-file architectures.
* **Demonstration**: Run `touch src/math_utils.c` and observe how `make` recompiles only the modified dependency.
* **Student Assignment**: Add a new module `include/filter.h` and `src/filter.c` implementing an exponential moving average, and verify that the Makefile's wildcard rules build it automatically.

### Module 3: Event-Driven Programming
* **Goal**: Replace blocking `delay()` superloops with decoupled, asynchronous event loops.
* **Demonstration**: Show how producers (ISRs) enqueue events without waiting, and consumers (superloop) process events at their own pace.
* **Student Assignment**: Add `EVENT_LOW_BATTERY` to the event queue and register a low-power sleep mode callback in the dispatch table.

### Module 4: Bitwise Operations
* **Goal**: Master bit shifts and masks for register programming and communication packets.
* **Demonstration**: Set, clear, toggle, and test individual bits on simulated 32-bit Cortex-M registers.
* **Student Assignment**: Write a function converting 24-bit RGB888 color into 16-bit RGB565 format using bit masks and shifts.

### Module 5: Pointers & Polymorphism
* **Goal**: Demystify pointer arithmetic, memory alignment padding, and function pointers.
* **Demonstration**: Show how a single supervisor function can interact with either real silicon hardware or a Linux simulation mock via a struct of function pointers (C VTABLE).
* **Student Assignment**: Reorder struct members to minimize padding bytes and write a generic `void *` memory swap function.

### Module 6: Preprocessor Techniques
* **Goal**: Understand compilation phases and avoid dangerous macro side-effects.
* **Demonstration**: Run `make preprocess` to inspect the raw `.i` text file emitted by the preprocessor before compilation.
* **Student Assignment**: Create an `ARRAY_SIZE(arr)` macro and demonstrate with unit tests why it fails if passed a pointer instead of a true array.

### Module 7: State Machines (FSMs)
* **Goal**: Model deterministic systems using states and events.
* **Demonstration**: Compare simple switch-case state logic against an industrial 2D function-pointer transition matrix.
* **Student Assignment**: Implement a Microwave Oven controller with an emergency safety invariant: opening the door in any active state immediately cuts off magnetron power.
