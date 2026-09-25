CC = gcc
CFLAGS = -Wall -Wextra -std=c11 -O2

TARGET = typing_speed

all: $(TARGET)

$(TARGET): typing_speed.c
	$(CC) $(CFLAGS) $< -o $@

run: all
	@echo "Launching Typing Speed Test..."
	./$(TARGET)

clean:
	rm -f $(TARGET)
