# Topic 4: Bitwise Operations in Embedded C

Direct register manipulation and communication packet compression require mastery of C bitwise operators: `&`, `|`, `^`, `~`, `<<`, and `>>`.

## Programs Included

| File | Concept | Real-World Application |
| :--- | :--- | :--- |
| `01_bit_manipulation.c` | Set, clear, toggle, check, and multi-bit field edits | Manipulating hardware registers (`GPIOx_MODER`, `ODR`, `BSRR`). |
| `02_packet_packing.c` | Bit shifts, bit masks, serialization/deserialization | CAN-bus, BLE, and LoRa packet framing where bandwidth is constrained. |

## Quick Start

```bash
make
make run
```

## Student Practice Exercises

1. **Exercise 1 (Bit Reversal)**:
   - Write a function `uint8_t Bit_Reverse8(uint8_t val)` that reverses the order of bits in a byte (e.g. `0b11000001` becomes `0b10000011`).
   - Where is bit reversal used? (Hint: SPI bit-order conversion LSB-first vs MSB-first).
2. **Exercise 2 (Color Packing - RGB565)**:
   - Microcontroller LCD screens often use 16-bit RGB565 format (5 bits Red, 6 bits Green, 5 bits Blue).
   - Write a function `uint16_t Color_RGB888_to_RGB565(uint8_t r, uint8_t g, uint8_t b)` using bit shifts and masks.
3. **Exercise 3 (Parity Check)**:
   - Write a function `bool Bit_CalculateEvenParity(uint32_t val)` that returns `true` if the number of set bits is even, and `false` if odd.
