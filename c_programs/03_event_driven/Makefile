CC = gcc
CFLAGS = -Wall -Wextra -std=c11 -O2

TARGET = 01_event_loop

all: $(TARGET)

$(TARGET): 01_event_loop.c
	$(CC) $(CFLAGS) $< -o $@

run: all
	@echo "=== Running Event Loop Demo ==="
	./$(TARGET)

clean:
	rm -f $(TARGET)
