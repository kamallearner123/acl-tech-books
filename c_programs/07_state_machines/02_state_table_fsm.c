/**
 * ==============================================================================
 * Topic 7: State Machines - Program 2: 2D Tabular Function-Pointer State Machine
 * ==============================================================================
 * Description:
 * Demonstrates an industrial table-driven FSM engine:
 *  - Constant transition matrix stored in Flash (.rodata)
 *  - O(1) instantaneous lookup without nested switch-case complexity
 *  - Action callbacks associated with state-event transitions
 *
 * Example: Smart Battery Charger / Medical Infusion Pump Controller
 *  States: DISCONNECTED, CHARGING, FULL_TRICKLE, FAULT_OVERHEAT
 *  Events: PLUG_IN, CHARGE_COMPLETE, UNPLUG, TEMP_EXCEEDED
 * ==============================================================================
 */

#include <stdio.h>
#include <stdlib.h>
#include <stdint.h>
#include <stdbool.h>

typedef enum {
    STATE_DISCONNECTED = 0,
    STATE_CHARGING,
    STATE_FULL_TRICKLE,
    STATE_FAULT,
    STATE_MAX
} ChargerState_t;

typedef enum {
    EVENT_PLUG_IN = 0,
    EVENT_CHARGE_COMPLETE,
    EVENT_UNPLUG,
    EVENT_OVERHEAT,
    EVENT_MAX
} ChargerEvent_t;

typedef void (*TransitionAction_t)(void);

typedef struct {
    ChargerState_t      next_state;
    TransitionAction_t  action;
} StateTransition_t;

/* --- Action Callbacks --- */
static void Action_StartCC_Mode(void) {
    printf("    [ACTION] Engaging Constant Current (CC) power stage at 2.0 Amps.\n");
}
static void Action_SwitchToTrickle(void) {
    printf("    [ACTION] Battery voltage reached 4.2V. Reducing current to 50mA trickle.\n");
}
static void Action_CutoffPower(void) {
    printf("    [ACTION] Cable disconnected. Disabling all MOSFET power switches.\n");
}
static void Action_TripSafetyRelay(void) {
    printf("    [ACTION] EMERGENCY OVERHEAT! Tripping hardware safety relay immediately!\n");
}
static void Action_Ignore(void) {
    printf("    [ACTION] Event ignored in this state (no-op).\n");
}

/* --- 2D Transition Matrix (Flash .rodata) --- */
static const StateTransition_t g_transition_matrix[STATE_MAX][EVENT_MAX] = {
    [STATE_DISCONNECTED] = {
        [EVENT_PLUG_IN]         = { STATE_CHARGING,       Action_StartCC_Mode },
        [EVENT_CHARGE_COMPLETE] = { STATE_DISCONNECTED,   Action_Ignore },
        [EVENT_UNPLUG]          = { STATE_DISCONNECTED,   Action_Ignore },
        [EVENT_OVERHEAT]        = { STATE_FAULT,          Action_TripSafetyRelay }
    },
    [STATE_CHARGING] = {
        [EVENT_PLUG_IN]         = { STATE_CHARGING,       Action_Ignore },
        [EVENT_CHARGE_COMPLETE] = { STATE_FULL_TRICKLE,   Action_SwitchToTrickle },
        [EVENT_UNPLUG]          = { STATE_DISCONNECTED,   Action_CutoffPower },
        [EVENT_OVERHEAT]        = { STATE_FAULT,          Action_TripSafetyRelay }
    },
    [STATE_FULL_TRICKLE] = {
        [EVENT_PLUG_IN]         = { STATE_FULL_TRICKLE,   Action_Ignore },
        [EVENT_CHARGE_COMPLETE] = { STATE_FULL_TRICKLE,   Action_Ignore },
        [EVENT_UNPLUG]          = { STATE_DISCONNECTED,   Action_CutoffPower },
        [EVENT_OVERHEAT]        = { STATE_FAULT,          Action_TripSafetyRelay }
    },
    [STATE_FAULT] = {
        /* Once in fault, all events require manual hardware service reset */
        [EVENT_PLUG_IN]         = { STATE_FAULT,          Action_Ignore },
        [EVENT_CHARGE_COMPLETE] = { STATE_FAULT,          Action_Ignore },
        [EVENT_UNPLUG]          = { STATE_FAULT,          Action_Ignore },
        [EVENT_OVERHEAT]        = { STATE_FAULT,          Action_Ignore }
    }
};

const char *ChargerState_ToString(ChargerState_t s)
{
    switch (s) {
        case STATE_DISCONNECTED: return "DISCONNECTED";
        case STATE_CHARGING:     return "CHARGING (Constant Current)";
        case STATE_FULL_TRICKLE: return "FULL_TRICKLE (Maintenance)";
        case STATE_FAULT:        return "FAULT (Overheat Trip)";
        default:                 return "INVALID";
    }
}

/* O(1) Tabular State Machine Engine */
void Charger_DispatchEvent(ChargerState_t *p_current_state, ChargerEvent_t evt)
{
    if ((p_current_state == NULL) || 
        (*p_current_state >= STATE_MAX) || 
        (evt >= EVENT_MAX)) {
        return;
    }

    StateTransition_t transition = g_transition_matrix[*p_current_state][evt];

    printf("  Event triggered: %d. Current state: %s\n", evt, ChargerState_ToString(*p_current_state));

    /* Execute the state transition action */
    if (transition.action != NULL) {
        transition.action();
    }

    /* Update current state */
    *p_current_state = transition.next_state;
    printf("  New state: %s\n\n", ChargerState_ToString(*p_current_state));
}

int main(void)
{
    printf("============================================================\n");
    printf("  2D Tabular Function-Pointer State Machine Engine\n");
    printf("============================================================\n\n");

    ChargerState_t current_state = STATE_DISCONNECTED;
    printf("Initial State: %s\n\n", ChargerState_ToString(current_state));

    /* Sequence 1: Plug in device */
    printf("[Sequence 1] User plugs in power cable:\n");
    Charger_DispatchEvent(&current_state, EVENT_PLUG_IN);

    /* Sequence 2: Battery full event */
    printf("[Sequence 2] Battery full charge reached:\n");
    Charger_DispatchEvent(&current_state, EVENT_CHARGE_COMPLETE);

    /* Sequence 3: Thermal sensor trips overheat */
    printf("[Sequence 3] Thermal runaway sensor triggers:\n");
    Charger_DispatchEvent(&current_state, EVENT_OVERHEAT);

    /* Sequence 4: User unplugs while in fault */
    printf("[Sequence 4] Attempting unplug during lock-out fault:\n");
    Charger_DispatchEvent(&current_state, EVENT_UNPLUG);

    printf("============================================================\n");
    printf("Takeaway: 2D State Tables have ZERO cyclomatic complexity,\n");
    printf("execute in deterministic O(1) time, and cannot have missing\n");
    printf("unhandled branches!\n");
    printf("============================================================\n");

    return EXIT_SUCCESS;
}
