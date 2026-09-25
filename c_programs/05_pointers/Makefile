CC = gcc
CFLAGS = -Wall -Wextra -std=c11 -O2

TARGETS = 01_pointer_basics_and_structs 02_function_pointers_and_callbacks

all: $(TARGETS)

01_pointer_basics_and_structs: 01_pointer_basics_and_structs.c
	$(CC) $(CFLAGS) $< -o $@

02_function_pointers_and_callbacks: 02_function_pointers_and_callbacks.c
	$(CC) $(CFLAGS) $< -o $@

run: all
	@echo "=== Running 01_pointer_basics_and_structs ==="
	./01_pointer_basics_and_structs
	@echo "\n=== Running 02_function_pointers_and_callbacks ==="
	./02_function_pointers_and_callbacks

clean:
	rm -f $(TARGETS)
