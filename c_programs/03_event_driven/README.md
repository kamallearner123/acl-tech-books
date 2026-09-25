# Topic 3: Event-Driven Programming in C

In classic non-blocking embedded software, firmware should never stall inside long `delay_ms()` calls or execute heavy processing inside Interrupt Service Routines (ISRs).

The **Event-Driven Architecture** splits duties into:
1. **Event Producers (ISRs / Timers):** Fast execution that pushes an `Event_t` into a circular ring-buffer queue and exits within microseconds.
2. **Event Consumers (Main Superloop):** Dequeues events and dispatches them via function-pointer lookup tables.

## Quick Start

```bash
make
make run
```

## Student Practice Exercises

1. **Exercise 1 (Add New Event Type)**:
   - Add `EVENT_LOW_BATTERY` to the `EventType_t` enum.
   - Implement a handler `Handle_LowBattery(const Event_t *evt)` that prints an alert and reduces CPU power mode.
   - Add it to the `g_event_dispatch_table` array.
   - Push a simulated low battery event with voltage payload (e.g. `3100` mV) and observe the dispatch.
2. **Exercise 2 (Priority Event Queue)**:
   - Modify the queue push function to support an emergency high-priority push: `EventQueue_PushFront(Event_t evt)`.
   - Test that emergency shutdown events bypass normal FIFO ordering and get processed first!
