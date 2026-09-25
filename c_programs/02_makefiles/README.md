# Topic 2: Makefiles (Modular C Project)

In embedded firmware development, projects consist of dozens of `.c` and `.h` files. Building every file manually with `gcc *.c` is slow, error-prone, and doesn't scale to cross-compilation.

A `Makefile` defines dependency trees and only recompiles files that have been modified since the last build.

## Directory Structure

```text
02_makefiles/
├── Makefile               # Build script with variables, pattern rules & phony targets
├── include/
│   └── math_utils.h       # Function declarations and public interfaces
├── src/
│   ├── main.c             # Application entry point
│   └── math_utils.c       # Math utility implementations
└── README.md
```

## Quick Start

```bash
# 1. Build the application
make

# 2. Run the application
make run

# 3. Clean all build outputs
make clean
```

## Student Practice Exercises

1. **Exercise 1 (Incremental Build)**:
   - Run `make` and observe both `main.c` and `math_utils.c` compile.
   - Run `make` a second time: notice Make prints `make: Nothing to be done for 'all'`, saving compilation time.
   - Run `touch src/math_utils.c` and run `make`: notice *only* `math_utils.c` is recompiled, then relinked!
2. **Exercise 2 (Add a New Module)**:
   - Create `include/filter.h` and `src/filter.c` with a low-pass filter function:
     `int32_t Filter_LowPass(int32_t current, int32_t previous, uint8_t alpha_pct);`
   - Include `filter.h` in `src/main.c` and call the function.
   - Run `make`: observe how the `$(wildcard)` rule automatically detects and builds the new file without modifying the `Makefile`!
3. **Exercise 3 (Compiler Warning Flags)**:
   - Introduce an unused variable in `src/main.c` (e.g. `int unused = 10;`).
   - Run `make CFLAGS="-Wall -Wextra -Werror -Iinclude"` and observe the build fail, demonstrating how industrial CI pipelines catch careless mistakes.
