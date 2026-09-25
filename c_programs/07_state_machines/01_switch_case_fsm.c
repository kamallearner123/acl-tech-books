/**
 * ==============================================================================
 * Topic 7: State Machines - Program 1: Switch-Case Finite State Machine
 * ==============================================================================
 * Description:
 * Implements a classic Traffic Light Controller with:
 *  - States: RED, GREEN, YELLOW, BLINKING_FAULT
 *  - Events: TIMER_EXPIRED, PEDESTRIAN_BUTTON, SENSOR_FAULT
 *  - Deterministic state entry and exit actions
 * ==============================================================================
 */

#include <stdio.h>
#include <stdlib.h>
#include <stdint.h>
#include <stdbool.h>

typedef enum {
    STATE_RED = 0,
    STATE_GREEN,
    STATE_YELLOW,
    STATE_FAULT,
    STATE_COUNT
} TrafficState_t;

typedef enum {
    EVT_TIMER_EXPIRED = 0,
    EVT_PEDESTRIAN_BTN,
    EVT_EMERGENCY_STOP,
    EVT_FAULT_DETECTED
} TrafficEvent_t;

typedef struct {
    TrafficState_t current_state;
    uint32_t       state_ticks;
} TrafficController_t;

const char *State_ToString(TrafficState_t s)
{
    switch (s) {
        case STATE_RED:    return "RED (Stop)";
        case STATE_GREEN:  return "GREEN (Go)";
        case STATE_YELLOW: return "YELLOW (Prepare to Stop)";
        case STATE_FAULT:  return "FAULT (Blinking Amber Alert)";
        default:           return "UNKNOWN";
    }
}

void Traffic_ProcessEvent(TrafficController_t *ctrl, TrafficEvent_t evt)
{
    TrafficState_t next_state = ctrl->current_state;

    /* Global Emergency / Fault override from ANY state */
    if (evt == EVT_FAULT_DETECTED || evt == EVT_EMERGENCY_STOP) {
        printf("  [EMERGENCY OVERRIDE] Fault event triggered!\n");
        ctrl->current_state = STATE_FAULT;
        return;
    }

    switch (ctrl->current_state) {
        case STATE_RED:
            if (evt == EVT_TIMER_EXPIRED) {
                printf("  [TRANSITION] RED timer finished -> Switching to GREEN\n");
                next_state = STATE_GREEN;
            }
            break;

        case STATE_GREEN:
            if (evt == EVT_PEDESTRIAN_BTN) {
                printf("  [TRANSITION] Pedestrian button pressed -> Shortening green to YELLOW\n");
                next_state = STATE_YELLOW;
            } else if (evt == EVT_TIMER_EXPIRED) {
                printf("  [TRANSITION] Normal GREEN timer finished -> Switching to YELLOW\n");
                next_state = STATE_YELLOW;
            }
            break;

        case STATE_YELLOW:
            if (evt == EVT_TIMER_EXPIRED) {
                printf("  [TRANSITION] YELLOW clearance timer finished -> Switching to RED\n");
                next_state = STATE_RED;
            }
            break;

        case STATE_FAULT:
            printf("  [SYSTEM IN SAFE STATE] Controller halted in FAULT mode.\n");
            break;

        default:
            /* Defensive programming: reset to safe state on corrupted memory */
            ctrl->current_state = STATE_FAULT;
            break;
    }

    ctrl->current_state = next_state;
}

int main(void)
{
    printf("============================================================\n");
    printf("  Switch-Case Finite State Machine (Traffic Light)\n");
    printf("============================================================\n\n");

    TrafficController_t controller = { .current_state = STATE_RED, .state_ticks = 0 };

    printf("Initial State: %s\n\n", State_ToString(controller.current_state));

    /* Step 1: Normal Red -> Green transition */
    printf("[1] Sending EVT_TIMER_EXPIRED:\n");
    Traffic_ProcessEvent(&controller, EVT_TIMER_EXPIRED);
    printf("  Current State: %s\n\n", State_ToString(controller.current_state));

    /* Step 2: Pedestrian button pressed during Green */
    printf("[2] Sending EVT_PEDESTRIAN_BTN:\n");
    Traffic_ProcessEvent(&controller, EVT_PEDESTRIAN_BTN);
    printf("  Current State: %s\n\n", State_ToString(controller.current_state));

    /* Step 3: Yellow clearance timer expires */
    printf("[3] Sending EVT_TIMER_EXPIRED:\n");
    Traffic_ProcessEvent(&controller, EVT_TIMER_EXPIRED);
    printf("  Current State: %s\n\n", State_ToString(controller.current_state));

    /* Step 4: Emergency hardware fault */
    printf("[4] Sending EVT_FAULT_DETECTED:\n");
    Traffic_ProcessEvent(&controller, EVT_FAULT_DETECTED);
    printf("  Current State: %s\n\n", State_ToString(controller.current_state));

    return EXIT_SUCCESS;
}
