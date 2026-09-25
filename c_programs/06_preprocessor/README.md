# Topic 6: The C Preprocessor (Techniques & Traps)

The preprocessor (`cpp`) runs before the compiler. It performs text substitution, evaluates conditionals (`#ifdef`), expands macros, and enforces compile-time assertions.

## Key Concepts

1. **The Side-Effect Trap**: Why `#define SQUARE(x) ((x)*(x))` breaks when invoked with `SQUARE(i++)`.
2. **Stringification (`#`)**: Converts an identifier into a quoted C string literal at compile time.
3. **Token-Pasting (`##`)**: Concatenates two tokens into one identifier, useful for generating boilerplate code.
4. **Compile-Time Assertions (`_Static_assert`)**: Catches invalid struct layouts or configuration errors at build-time with zero runtime CPU cost!

## Quick Start

```bash
make
make run

# Inspect actual preprocessed output (.i file)
make preprocess
```

## Student Practice Exercises

1. **Exercise 1 (Array Length Macro)**:
   - Implement the classic macro:
     `#define ARRAY_SIZE(arr) (sizeof(arr) / sizeof((arr)[0]))`
   - Test it on arrays of integers, structs, and floats.
   - What happens if you pass a pointer instead of an array to `ARRAY_SIZE`? (Write code demonstrating the pitfall!).
2. **Exercise 2 (Bit-Mask Generation Macro)**:
   - Create a macro `#define BIT_MASK(len) ((1U << (len)) - 1U)`.
   - Test it for `BIT_MASK(4)` (should equal `0x0F`) and `BIT_MASK(8)` (should equal `0xFF`).
3. **Exercise 3 (Static Memory Boundary Guard)**:
   - Use `_Static_assert` to ensure that a buffer size macro `BUFFER_SIZE` is a power of 2:
     `_Static_assert((BUFFER_SIZE & (BUFFER_SIZE - 1)) == 0, "Buffer size must be a power of 2!");`
