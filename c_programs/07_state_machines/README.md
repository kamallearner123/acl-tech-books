# Topic 7: Finite State Machines (FSMs) in C

A Finite State Machine (FSM) models a reactive system with a finite set of discrete states, responding to input events by executing transition actions and transitioning to a next state.

## Programs Included

| File | Pattern | Best Used For |
| :--- | :--- | :--- |
| `01_switch_case_fsm.c` | Nested `switch (state)` + `switch (event)` | Simple state machines with 3 to 5 states (e.g. traffic light, button debouncer). |
| `02_state_table_fsm.c` | 2D Array Matrix of Function Pointers | Complex, safety-critical systems with 10+ states (medical ventilators, automotive ECUs). |

## Quick Start

```bash
make
make run
```

## Student Practice Exercises

1. **Exercise 1 (Microwave Oven FSM)**:
   - Implement a microwave oven controller using the switch-case pattern:
     - States: `IDLE`, `HEATING`, `PAUSED`, `DOOR_OPEN`.
     - Events: `EVT_START_PRESSED`, `EVT_TIMER_ZERO`, `EVT_DOOR_OPENED`, `EVT_DOOR_CLOSED`.
     - Safety Invariant: Heating magnetron MUST turn off immediately if door is opened!
2. **Exercise 2 (Extending the 2D State Table)**:
   - In `02_state_table_fsm.c`, add an `EVENT_RESET_BUTTON` event and an `Action_ServiceReset()` function that clears the fault state back to `STATE_DISCONNECTED`.
   - Update the `[STATE_FAULT]` row in the transition matrix.
