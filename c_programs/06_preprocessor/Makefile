CC = gcc
CFLAGS = -Wall -Wextra -std=c11 -O2 -DDEBUG_ENABLED

TARGET = 01_preprocessor_tricks_and_traps

all: $(TARGET)

$(TARGET): 01_preprocessor_tricks_and_traps.c
	$(CC) $(CFLAGS) $< -o $@

# Preprocess only (emits .i file so students can see macro expansion directly!)
preprocess:
	$(CC) $(CFLAGS) -E 01_preprocessor_tricks_and_traps.c -o expanded_macro.i
	@echo "Generated expanded_macro.i! Open it to see pure preprocessor expansion."

run: all
	@echo "=== Running Preprocessor Demo ==="
	./$(TARGET)

clean:
	rm -f $(TARGET) *.i
