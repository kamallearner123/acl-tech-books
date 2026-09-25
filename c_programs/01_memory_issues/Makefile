CC = gcc
CFLAGS = -Wall -Wextra -std=c11 -O2
ASAN_FLAGS = -fsanitize=address -g -O1

TARGETS = 01_stack_vs_heap 02_buffer_overflow 03_memory_leak_use_after_free

all: $(TARGETS)

01_stack_vs_heap: 01_stack_vs_heap.c
	$(CC) $(CFLAGS) $< -o $@

02_buffer_overflow: 02_buffer_overflow.c
	$(CC) $(CFLAGS) $< -o $@

03_memory_leak_use_after_free: 03_memory_leak_use_after_free.c
	$(CC) $(CFLAGS) $< -o $@

# Target to compile with AddressSanitizer
asan:
	$(CC) $(CFLAGS) $(ASAN_FLAGS) 01_stack_vs_heap.c -o 01_stack_vs_heap_asan
	$(CC) $(CFLAGS) $(ASAN_FLAGS) 02_buffer_overflow.c -o 02_buffer_overflow_asan
	$(CC) $(CFLAGS) $(ASAN_FLAGS) 03_memory_leak_use_after_free.c -o 03_memory_leak_asan
	@echo "Built AddressSanitizer binaries. Run ./02_buffer_overflow_asan to see ASAN trap an illegal write!"

run: all
	@echo "=== Running 01_stack_vs_heap ==="
	./01_stack_vs_heap
	@echo "\n=== Running 02_buffer_overflow ==="
	./02_buffer_overflow
	@echo "\n=== Running 03_memory_leak_use_after_free ==="
	./03_memory_leak_use_after_free

clean:
	rm -f $(TARGETS) *_asan
