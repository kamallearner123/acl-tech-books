/**
 * ==============================================================================
 * Topic 3: Event-Driven Programming in C
 * ==============================================================================
 * Description:
 * Implements a decoupled, reactive event loop architecture:
 *  1. Event Queue (circular FIFO ring-buffer)
 *  2. Event Dispatcher Table (maps Event IDs to action handler callbacks)
 *  3. Simulated Producer Interrupts / Hardware Events
 *  4. Reactive Consumer Superloop
 *
 * Compilation & Run:
 *   gcc -Wall -Wextra -std=c11 01_event_loop.c -o event_loop
 *   ./event_loop
 * ==============================================================================
 */

#include <stdio.h>
#include <stdlib.h>
#include <stdint.h>
#include <stdbool.h>

#define EVENT_QUEUE_CAPACITY (8U)

/* 1. Event Type Enumeration */
typedef enum {
    EVENT_NONE = 0,
    EVENT_BUTTON_PRESSED,
    EVENT_TEMP_ALERT,
    EVENT_TIMER_EXPIRED,
    EVENT_SYSTEM_SHUTDOWN,
    EVENT_COUNT
} EventType_t;

/* 2. Event Structure with Payload */
typedef struct {
    EventType_t type;
    uint32_t    timestamp_ms;
    int32_t     payload; /* e.g., temperature reading or button pin */
} Event_t;

/* 3. Circular Ring Buffer for Events */
typedef struct {
    Event_t  buffer[EVENT_QUEUE_CAPACITY];
    uint32_t head;
    uint32_t tail;
    uint32_t count;
} EventQueue_t;

static EventQueue_t g_event_queue = {0};

/* 4. Queue Operations */
bool EventQueue_Push(Event_t evt)
{
    if (g_event_queue.count >= EVENT_QUEUE_CAPACITY) {
        printf("  [QUEUE WARNING] Event Queue is FULL! Dropping event %d\n", evt.type);
        return false;
    }

    g_event_queue.buffer[g_event_queue.head] = evt;
    g_event_queue.head = (g_event_queue.head + 1U) % EVENT_QUEUE_CAPACITY;
    g_event_queue.count++;
    return true;
}

bool EventQueue_Pop(Event_t *p_evt)
{
    if ((p_evt == NULL) || (g_event_queue.count == 0U)) {
        return false;
    }

    *p_evt = g_event_queue.buffer[g_event_queue.tail];
    g_event_queue.tail = (g_event_queue.tail + 1U) % EVENT_QUEUE_CAPACITY;
    g_event_queue.count--;
    return true;
}

/* 5. Event Callback Handlers */
typedef void (*EventHandler_t)(const Event_t *evt);

static void Handle_ButtonPressed(const Event_t *evt)
{
    printf("  -> [HANDLER: BUTTON] User pressed Button on Pin %d at t=%ums\n", 
           evt->payload, evt->timestamp_ms);
}

static void Handle_TempAlert(const Event_t *evt)
{
    printf("  -> [HANDLER: TEMP ALERT] Over-temperature detected: %d deg C! Cooling activated.\n", 
           evt->payload);
}

static void Handle_TimerExpired(const Event_t *evt)
{
    printf("  -> [HANDLER: TIMER] Periodic watchdog heartbeat timer #%d expired.\n", 
           evt->payload);
}

static bool g_system_running = true;
static void Handle_SystemShutdown(const Event_t *evt)
{
    (void)evt;
    printf("  -> [HANDLER: SHUTDOWN] Graceful shutdown command received. Terminating loop.\n");
    g_system_running = false;
}

/* 6. Event Dispatcher Lookup Table (O(1) Dispatch) */
static const EventHandler_t g_event_dispatch_table[EVENT_COUNT] = {
    [EVENT_NONE]            = NULL,
    [EVENT_BUTTON_PRESSED]  = Handle_ButtonPressed,
    [EVENT_TEMP_ALERT]      = Handle_TempAlert,
    [EVENT_TIMER_EXPIRED]   = Handle_TimerExpired,
    [EVENT_SYSTEM_SHUTDOWN] = Handle_SystemShutdown
};

void EventDispatcher_Dispatch(const Event_t *evt)
{
    if ((evt->type > EVENT_NONE) && (evt->type < EVENT_COUNT)) {
        EventHandler_t handler = g_event_dispatch_table[evt->type];
        if (handler != NULL) {
            handler(evt);
        } else {
            printf("  -> [WARNING] No handler registered for Event ID %d\n", evt->type);
        }
    }
}

int main(void)
{
    printf("============================================================\n");
    printf("  Decoupled Reactive Event-Driven System in C\n");
    printf("============================================================\n\n");

    /* Step 1: Simulate events produced by Interrupts (ISR) or peripherals */
    printf("[1] Enqueueing Simulated Peripheral Events:\n");
    
    Event_t e1 = { .type = EVENT_BUTTON_PRESSED, .timestamp_ms = 120, .payload = 13 };
    Event_t e2 = { .type = EVENT_TIMER_EXPIRED,  .timestamp_ms = 250, .payload = 1 };
    Event_t e3 = { .type = EVENT_TEMP_ALERT,     .timestamp_ms = 310, .payload = 88 };
    Event_t e4 = { .type = EVENT_SYSTEM_SHUTDOWN,.timestamp_ms = 500, .payload = 0 };

    EventQueue_Push(e1);
    printf("  Pushed: EVENT_BUTTON_PRESSED\n");
    EventQueue_Push(e2);
    printf("  Pushed: EVENT_TIMER_EXPIRED\n");
    EventQueue_Push(e3);
    printf("  Pushed: EVENT_TEMP_ALERT\n");
    EventQueue_Push(e4);
    printf("  Pushed: EVENT_SYSTEM_SHUTDOWN\n\n");

    /* Step 2: Main Application Event Processing Loop */
    printf("[2] Processing Events in Main Reactive Superloop:\n");
    uint32_t processed_count = 0U;

    while (g_system_running) {
        Event_t current_evt;
        if (EventQueue_Pop(&current_evt)) {
            printf("\n[Event #%u dequeued] Type: %d, Time: %ums\n", 
                   ++processed_count, current_evt.type, current_evt.timestamp_ms);
            EventDispatcher_Dispatch(&current_evt);
        } else {
            /* No events to process: CPU would sleep (e.g. WFI instruction in Cortex-M) */
            break;
        }
    }

    printf("\n============================================================\n");
    printf("Event-Driven Architecture Summary:\n");
    printf("Producers (ISRs) only push events into the queue;\n");
    printf("Consumers (Main Loop) dispatch events without blocking.\n");
    printf("============================================================\n");

    return EXIT_SUCCESS;
}
