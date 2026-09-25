# ==============================================================================
# Standard Modular Makefile for Linux and macOS
# ==============================================================================

# Compiler & Linker Configuration
CC ?= gcc
CFLAGS ?= -Wall -Wextra -std=c11 -O2 -Iinclude

# Directory Structure
SRC_DIR = src
INC_DIR = include
BUILD_DIR = build
BIN = $(BUILD_DIR)/app_runner

# Source & Object Files
SRCS = $(wildcard $(SRC_DIR)/*.c)
OBJS = $(patsubst $(SRC_DIR)/%.c, $(BUILD_DIR)/%.o, $(SRCS))

# Default Target
.PHONY: all clean run help

all: $(BIN)

# Link Object Files into Final Executable
$(BIN): $(OBJS)
	@mkdir -p $(BUILD_DIR)
	@echo "Linking final executable: $@"
	$(CC) $(OBJS) -o $@

# Pattern Rule: Compile each .c into .o in build/
$(BUILD_DIR)/%.o: $(SRC_DIR)/%.c
	@mkdir -p $(BUILD_DIR)
	@echo "Compiling: $< -> $@"
	$(CC) $(CFLAGS) -c $< -o $@

# Run the Compiled Binary
run: all
	@echo "\n=== Running Application ==="
	./$(BIN)

# Clean Build Artifacts
clean:
	@echo "Cleaning build directory..."
	rm -rf $(BUILD_DIR)

# Help Menu
help:
	@echo "Makefile usage:"
	@echo "  make        - Build the binary ($(BIN))"
	@echo "  make run    - Build and execute the binary"
	@echo "  make clean  - Remove all compiled artifacts"
	@echo "  make help   - Display this menu"
