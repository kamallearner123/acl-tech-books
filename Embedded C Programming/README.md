# Visualize Execution: The Complete STM32 Firmware Journey
## Interactive Instructional Module & Instructor Laboratory Guide

A self-contained, interactive, zero-dependency engineering chapter designed for BTech electrical, electronics, and computer science engineering students. It demystifies the entire microcontroller firmware execution journey: from high-level C code, preprocessing, compilation, assembly, linking, and ELF binary analysis, down to SWD flash burning, Cortex-M power-on hardware reset sequence, memory section mapping (`.text`, `.rodata`, `.data`, `.bss`, Stack, Heap), and peripheral orchestration (RCC, GPIO, EXTI, NVIC, UART, PIR sensor, and LED).

---

## 🎯 Learning Objectives

By completing this interactive chapter and associated laboratory session, students will be able to:

1. **Deconstruct the Embedded Build Chain**: Differentiate between the distinct roles, input artifacts, output formats, and failure modes of the Preprocessor (`cpp`), Compiler (`cc1`), Assembler (`as`), Linker (`ld`), and Binary Utilities (`objcopy`, `size`, `nm`, `readelf`).
2. **Master Memory Maps & Linker Scripts**: Interpret GNU Linker scripts (`.ld`) to analyze physical address space partitioning between Flash memory (`0x08000000`) and volatile SRAM (`0x20000000`), explaining the critical distinction between Load Memory Address (LMA) and Virtual Memory Address (VMA) for `.data`.
3. **Trace the Cortex-M Hardware Reset Sequence**: Explain the precise hardware behavior of ARM Cortex-M processors upon power stabilization: loading Word 0 from address `0x08000000` into the Main Stack Pointer (MSP) and Word 1 from `0x08000004` into the Program Counter (PC) to execute `Reset_Handler`.
4. **Analyze C Runtime Initialization**: Understand how `Reset_Handler` prepares physical SRAM before `main()` is reached by copying `.data` initial values from Flash and zeroing the `.bss` memory block.
5. **Bridge Software to Physical Silicon**: Trace the three-tier execution hierarchy from high-level C APIs (`HAL_GPIO_WritePin`), through memory-mapped peripheral registers (`BSRR`, `ODR`), down to complementary MOSFET push-pull drivers and physical pin voltage transitions.
6. **Interface Sensors & Asynchronous Peripherals**: Wire and configure digital inputs (PIR motion sensor with pull-down resistors), contrast Polling against hardware interrupt-driven architectures (EXTI and NVIC), and analyze asynchronous 8N1 serial framing on UART peripherals.
7. **Perform Hardware Debugging & Diagnostic Triage**: Connect and troubleshoot hardware using Serial Wire Debug (SWD), set hardware breakpoints using Cortex-M FPB units, interpret GDB register dumps, and diagnose the top 10 embedded systems failure modes.

---

## 🛠️ Prerequisites & Target Audience

- **Target Audience**: BTech Engineering students (ECE, EEE, CSE, Robotics, Mechatronics, IoT) in semesters 3–6.
- **Academic Prerequisites**:
  - Basic knowledge of C programming (variables, loops, pointers, structures, bitwise operators `&`, `|`, `^`, `~`).
  - Introductory digital logic (logic gates, HIGH/LOW voltage levels, Schmitt triggers, pull-up/pull-down resistors).
  - Familiarity with basic electrical circuits (Ohm's law, diode polarity, ground loops).
- **Assumed Knowledge Gap**: Students are *not* expected to have prior exposure to cross-toolchains, assembly language, linker scripts, microcontroller startup code, memory buses, or peripheral registers.

---

## 🔬 Laboratory Requirements

### 1. Hardware Bill of Materials (BOM)

| Item | Component / Model | Specification | Purpose |
| :--- | :--- | :--- | :--- |
| **1** | **STM32 Microcontroller Board** | STM32 Nucleo-64 (NUCLEO-F401RE or NUCLEO-F411RE or NUCLEO-F103RB) | Primary target evaluation board with on-board ST-LINK/V2-1 debugger. |
| **2** | **Passive Infrared (PIR) Sensor** | HC-SR501 or AM312 Mini PIR Module | Pyroelectric infrared sensor with digital output (3.3V compatible). |
| **3** | **External LED & Resistor** | 5mm Green/Red LED + $330\,\Omega$ resistor | Visual digital output indicator (if board user LED PA5 is not used). |
| **4** | **USB-to-UART Adapter** | FTDI FT232RL or CP2102 or CH340G | External serial logging (optional; Nucleo Virtual COM Port can be used directly). |
| **5** | **Jumper Wires** | Male-to-Female & Male-to-Male Dupont wires | Prototyping connections between Nucleo headers and PIR sensor. |
| **6** | **USB Cable** | USB Type-A to Mini-B / Micro-B (data capable) | Power, flashing, and ST-LINK virtual serial COM port communication. |

### 2. Software Requirements

- **Interactive HTML Chapter**: `stm32-firmware-journey.html` (zero installation; opens in Chrome, Firefox, Edge, Safari).
- **Toolchain**: GNU Arm Embedded Toolchain (`arm-none-eabi-gcc`, `arm-none-eabi-size`, `arm-none-eabi-objcopy`, `arm-none-eabi-nm`, `arm-none-eabi-gdb`).
- **Programming & Flashing Utility**: STM32CubeProgrammer (GUI or CLI) or OpenOCD.
- **Serial Terminal Monitor**: PuTTY, Tera Term, Minicom, screen, or STM32CubeIDE Serial Console (Configured for `115200 baud, 8 data bits, no parity, 1 stop bit, no flow control`).
- **IDE (Optional)**: STM32CubeIDE, VS Code with Cortex-Debug, or a pure Makefile/CMake workflow.

---

## ⚡ Safety, Electrical & Wiring Guidelines

> [!CAUTION]
> **5V Tolerance Warning**: Although many STM32 pins are 5V-tolerant (marked **FT** in the datasheet table), pins configured in Analog mode or certain dedicated oscillator pins are **3.3V maximum only**. Never apply 5V directly to a non-FT pin, or the internal ESD clamping diodes will be destroyed.

1. **Common Ground Connection (Mandatory)**: Always connect the GND pin of the PIR module and the GND of any external USB-UART adapter directly to the `GND` pin of the STM32 board. Floating grounds cause erratic voltage offsets and communication failures.
2. **PIR Power Selection**: Standard HC-SR501 modules run on 5V (connect to Nucleo `5V` pin), but their onboard 3.3V regulator outputs a safe 3.3V digital logic signal on their `OUT` pin. Verify with a digital multimeter before wiring to `PB0`.
3. **LED Current Limiting**: Never connect an LED directly between a GPIO pin and GND without a series resistor ($220\,\Omega$ to $470\,\Omega$). An unconstrained diode draws excessive current (&gt;25mA), triggering thermal degradation of the STM32 pin output driver.
4. **PIR Warm-Up Interval**: Instruct students that PIR sensors output erratic transitions for 30–60 seconds after power is first connected while their analog baseline stabilizes.

---

## ⏱️ Recommended 2-Hour Teaching Sequence

| Time | Duration | Activity / Interactive Scenario | Instructor Actions & Demonstrations |
| :--- | :--- | :--- | :--- |
| **00:00 - 00:15** | 15 min | **Introduction & The Complete Pipeline**<br>*(Scenarios 1 & 2)* | • Open `stm32-firmware-journey.html` on projector.<br>• Demonstrate the 10-stage interactive pipeline.<br>• Ask: *"Why can't the microcontroller read main.c directly?"*<br>• Show live PA5 LED blink on a connected Nucleo board. |
| **00:15 - 00:35** | 20 min | **Toolchain Deep-Dive: Preprocessing & Assembly**<br>*(Scenarios 3, 4 & 5)* | • Run `arm-none-eabi-gcc -E` and demonstrate the 15,000-line `.i` expansion.<br>• Explain RISC Load/Store architecture: why modifying an I/O bit requires LDR &rarr; EOR &rarr; STR.<br>• Deliberately omit `stm32f4xx_hal.c` to show an *"undefined reference to HAL_Init"* error. |
| **00:35 - 00:55** | 20 min | **Linker Scripts, Memory Map & Binary Formats**<br>*(Scenarios 6, 7 & 8)* | • Use the interactive Memory Map visualizer.<br>• Explain LMA vs VMA for `.data` and why `.bss` needs zeroing.<br>• Run `arm-none-eabi-size` on `firmware.elf` to demonstrate why an 800KB ELF fits in 18KB of Flash.<br>• Demonstrate converting ELF to BIN with `objcopy`. |
| **00:55 - 01:15** | 20 min | **Power-On Reset, Vector Table & Startup**<br>*(Scenarios 9, 10, 11 & 12)* | • **Pause Point 1**: Walk through the Cortex-M startup sequence.<br>• Show that Word 0 (`0x08000000`) is `_estack` (MSP) and Word 1 (`0x08000004`) is `Reset_Handler`.<br>• Step through the RAM state before/after initialization animation.<br>• Step through the CPU Fetch-Decode-Execute cycle. |
| **01:15 - 01:40** | 25 min | **Peripherals: GPIO, EXTI, UART & Integrated Lab**<br>*(Scenarios 13, 14, 15, 16 & 17)* | • Demonstrate the 3 layers of GPIO: C HAL &rarr; BSRR register &rarr; Push-Pull MOSFET.<br>• Simulate the PIR motion sensor and explain floating inputs.<br>• Compare Polling vs Interrupts side-by-side; explain the `volatile` keyword.<br>• Fire the live interactive PIR-to-LED-to-UART workbench and observe virtual serial output. |
| **01:40 - 01:50** | 10 min | **Debugging, Bootloaders & Troubleshooting**<br>*(Scenarios 18, 19 & 20)* | • Show how GDB uses DWARF tables in ELF to set breakpoints.<br>• Explain bootloader vector table relocation (`SCB->VTOR`).<br>• Walk through the 10 diagnostic troubleshooting cards. |
| **01:50 - 02:00** | 10 min | **Mastery Assessment & Wrap-up**<br>*(Final Quiz & Learning Map)* | • Have students complete the 10-Question interactive assessment on their own devices.<br>• Review class scores and address misconceptions using the answer key below. |

---

## 👩‍🏫 Instructor Pause Points & Discussion Questions

1. **At Scenario 5 (Symbols)**:
   - *Question for Students*: "If my code compiles without syntax errors, why can the build still fail during linking?"
   - *Teaching Note*: Emphasize that the compiler compiles single `.c` files in total isolation; only the linker checks if called functions actually exist anywhere in the project.
2. **At Scenario 10 (Vector Table)**:
   - *Question for Students*: "Can you change the starting address of the vector table when power is first applied?"
   - *Teaching Note*: Emphasize that Cortex-M silicon hardware *hardcodes* the initial fetch to `0x00000000` (aliased to `0x08000000` via BOOT pins). Software can only relocate the table later by modifying `SCB->VTOR`.
3. **At Scenario 15 (Polling vs Interrupts)**:
   - *Question for Students*: "Why shouldn't you put `printf()` or `HAL_Delay()` inside an Interrupt Service Routine?"
   - *Teaching Note*: Explain priority inversion and deadlock: `HAL_Delay()` depends on the SysTick interrupt firing; if called from an ISR with equal or higher priority, the SysTick interrupt is blocked, deadlocking the MCU forever.

---

## 📝 10-Question Assessment: Instructor Answer Key

### Question 1
- **Question**: What is the exact purpose of the Preprocessor stage in the GNU ARM toolchain?
- **Correct Answer**: **B. Expands #include header files, substitutes #define macros, and strips comments via text processing.**
- **Technical Explanation**: The preprocessor (`cpp`) runs prior to C syntax analysis. It performs purely textual substitutions and conditional block selection (`#ifdef`). It has no knowledge of C grammar, types, or machine instructions.

### Question 2
- **Question**: Which compiler flag is required to generate compact 16/32-bit Thumb-2 instructions for ARM Cortex-M microcontrollers?
- **Correct Answer**: **B. -mthumb**
- **Technical Explanation**: ARM Cortex-M microcontrollers (M0, M3, M4, M7, M33) do not support the 32-bit ARM instruction set. They execute Thumb / Thumb-2 instructions exclusively. Omitting `-mthumb` causes GCC to emit ARM instructions, causing an immediate `UsageFault` or `HardFault` on the target.

### Question 3
- **Question**: Why does the linker report an "undefined reference" error even if the corresponding header file was included?
- **Correct Answer**: **A. The header file only provides declarations to the compiler; the object file (.o) containing the definition was omitted from the linker command.**
- **Technical Explanation**: Header files (`.h`) contain declarations (function prototypes and structure definitions) that tell the compiler how to construct calls. The actual compiled machine code resides in an object file (`.o`) or library archive (`.a`). If that object file is not passed to the linker, symbol resolution fails.

### Question 4
- **Question**: In an STM32 linker script, which memory section holds initial values for global variables that are copied to RAM at startup?
- **Correct Answer**: **B. .data**
- **Technical Explanation**: Initialized global variables (e.g., `uint32_t baud = 115200;`) must persist through power cycles (stored in non-volatile Flash LMA), but must be modifiable at runtime (residing at SRAM VMA). The `.data` section startup loop bridges this gap.

### Question 5
- **Question**: What are the first two 32-bit words located at flash address 0x08000000 on an ARM Cortex-M microcontroller?
- **Correct Answer**: **A. Word 0: Initial Main Stack Pointer (_estack); Word 1: Address of Reset_Handler.**
- **Technical Explanation**: In the ARMv7-M architecture, the hardware automatically samples Word 0 into the SP (R13) and Word 1 into the PC (R15) before executing any instructions. [Source: Armv7-M Architecture Reference Manual, Section B1.5.3].

### Question 6
- **Question**: What is the fundamental difference between a `firmware.bin` file and a `firmware.hex` file?
- **Correct Answer**: **B. HEX files include destination memory address records and checksums; BIN is raw bytes with no address information.**
- **Technical Explanation**: Intel HEX is an ASCII-encoded format where each line defines a 32-bit target base address and byte checksum. A raw BIN file is a raw binary stream starting at byte 0; the flashing tool must be told externally where to burn it (e.g. `0x08000000`).

### Question 7
- **Question**: Which register allows atomic setting and resetting of GPIO pin output bits without read-modify-write hazards?
- **Correct Answer**: **B. BSRR (Bit Set/Reset Register)**
- **Technical Explanation**: Writing a 1 to bits [15:0] sets the pin HIGH; writing a 1 to bits [31:16] resets the pin LOW. Because this occurs in a single 32-bit bus write, it cannot be interrupted midway by an ISR, eliminating read-modify-write race conditions that afflict the `ODR` register.

### Question 8
- **Question**: What occurs when a digital input pin is left floating without pull-up or pull-down resistors?
- **Correct Answer**: **B. The input has high impedance and picks up stray electromagnetic fields, toggling randomly between 0 and 1.**
- **Technical Explanation**: CMOS gates exhibit input impedances exceeding $10^9\,\Omega$. When unconnected, electrostatic charges and AC line noise easily charge and discharge the pin gate capacitance above and below the Schmitt trigger threshold voltages.

### Question 9
- **Question**: In an 8N1 UART configuration at 115,200 baud, how many total physical bit durations are sent over the wire to transmit a single ASCII byte?
- **Correct Answer**: **B. 10 bits (1 Start bit + 8 Data bits + 1 Stop bit).**
- **Technical Explanation**: Asynchronous UART framing requires 1 Start Bit (LOW) to synchronize the receiver clock, 8 Data Bits (transmitted LSB first), 0 Parity bits (None), and 1 Stop Bit (HIGH) to return the line to idle. Total = $1 + 8 + 1 = 10\text{ bits}$.

### Question 10
- **Question**: When an in-application bootloader jumps to a user application at 0x08008000, which CPU register must be reprogrammed to redirect interrupt vectors?
- **Correct Answer**: **B. SCB->VTOR (Vector Table Offset Register).**
- **Technical Explanation**: By default, the NVIC looks for the vector table at address `0x00000000`. When branching to an application located at an offset like `0x08008000`, software must set `SCB->VTOR = 0x08008000` so that subsequent interrupts jump to the application's handlers rather than the bootloader's handlers.

---

## 🔧 STM32 Family-Specific Customization Notes

While the chapter uses standard ARM Cortex-M architecture concepts universal to all Cortex-M devices, instructors using specific development boards should note the following pin and peripheral differences:

1. **Board User LEDs**:
   - **Nucleo-64 (F401RE / F411RE / F103RB)**: User LED `LD2` is wired to **PA5** (Active-HIGH).
   - **Discovery Kit (STM32F407G-DISC1)**: Four user LEDs are wired to **PD12, PD13, PD14, PD15**.
   - **Blue Pill (STM32F103C8T6)**: Onboard LED is wired to **PC13** and is **Active-LOW** (writing 0 turns it ON).
2. **Clock Tree Frequencies**:
   - STM32F401RE runs up to **84 MHz**.
   - STM32F411RE runs up to **100 MHz**.
   - STM32F103 runs up to **72 MHz**.
   - STM32F407 runs up to **168 MHz**.
   Instructors must adjust the PLL multiplier and Flash latency wait states accordingly in `SystemClock_Config()`.
3. **UART Virtual COM Port Pins**:
   - On Nucleo-64 boards, `USART2` (`PA2 = TX`, `PA3 = RX`) is internally hardwired to the on-board ST-LINK MCU, automatically exposing a USB Virtual COM Port on the host PC without any external USB-UART dongle!
   - On custom boards or Discovery boards, students must connect an external USB-to-UART bridge to the designated USART pins.

---

## 📚 Citations & Authoritative References

1. **Arm Architecture Reference Manual**: *Armv7-M Architecture Reference Manual* (ARM DDI 0403E.e), Section B1.5 "Exception Model" and Section B1.5.3 "Reset behavior".
2. **CMSIS-Core Documentation**: *Arm Cortex Microcontroller Software Interface Standard (CMSIS-Core)*, Version 5.4.0 — Vector Table and Startup Definitions.
3. **STMicroelectronics Reference Manual**: *RM0368: STM32F401xB/C and STM32F401xD/E advanced Arm-based 32-bit MCUs*, Section 6 "Reset and Clock Control (RCC)", Section 8 "General-Purpose I/Os (GPIO)", Section 19 "Universal Synchronous Asynchronous Receiver Transmitter (USART)".
4. **GNU Toolchain Reference**: *Using ld: The GNU Linker*, Red Hat Inc. / Free Software Foundation, Version 2.38 — SECTIONS, MEMORY commands, LMA vs. VMA.
