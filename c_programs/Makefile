# ==============================================================================
# Master Makefile for All C Practice Modules (Linux / macOS)
# ==============================================================================

SUBDIRS = 00_typing_speed_test \
          01_memory_issues \
          02_makefiles \
          03_event_driven \
          04_bitwise_ops \
          05_pointers \
          06_preprocessor \
          07_state_machines

.PHONY: all clean run help $(SUBDIRS)

all: $(SUBDIRS)

$(SUBDIRS):
	@echo "\n>>> Building in $@..."
	$(MAKE) -C $@

run:
	@for dir in $(SUBDIRS); do \
		echo "\n========================================================"; \
		echo ">>> Running in $$dir..."; \
		echo "========================================================"; \
		$(MAKE) -C $$dir run; \
	done

clean:
	@for dir in $(SUBDIRS); do \
		echo ">>> Cleaning in $$dir..."; \
		$(MAKE) -C $$dir clean; \
	done

help:
	@echo "Embedded C Programs Laboratory (Linux & macOS)"
	@echo "Available commands:"
	@echo "  make         - Compile all 7 topic projects"
	@echo "  make run     - Build and execute all 7 topic test runners"
	@echo "  make clean   - Clean binaries in all topic directories"
	@echo "  make <topic> - Build specific topic (e.g., make 01_memory_issues)"
