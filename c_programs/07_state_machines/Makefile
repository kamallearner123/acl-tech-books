CC = gcc
CFLAGS = -Wall -Wextra -std=c11 -O2

TARGETS = 01_switch_case_fsm 02_state_table_fsm

all: $(TARGETS)

01_switch_case_fsm: 01_switch_case_fsm.c
	$(CC) $(CFLAGS) $< -o $@

02_state_table_fsm: 02_state_table_fsm.c
	$(CC) $(CFLAGS) $< -o $@

run: all
	@echo "=== Running 01_switch_case_fsm ==="
	./01_switch_case_fsm
	@echo "\n=== Running 02_state_table_fsm ==="
	./02_state_table_fsm

clean:
	rm -f $(TARGETS)
