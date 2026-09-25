CC = gcc
CFLAGS = -Wall -Wextra -std=c11 -O2

TARGETS = 01_bit_manipulation 02_packet_packing

all: $(TARGETS)

01_bit_manipulation: 01_bit_manipulation.c
	$(CC) $(CFLAGS) $< -o $@

02_packet_packing: 02_packet_packing.c
	$(CC) $(CFLAGS) $< -o $@

run: all
	@echo "=== Running 01_bit_manipulation ==="
	./01_bit_manipulation
	@echo "\n=== Running 02_packet_packing ==="
	./02_packet_packing

clean:
	rm -f $(TARGETS)
