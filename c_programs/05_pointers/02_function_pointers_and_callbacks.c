/**
 * ==============================================================================
 * Topic 5: Pointers - Program 2: Function Pointers, Callbacks & C Polymorphism
 * ==============================================================================
 * Description:
 * Demonstrates:
 *  1. Function Pointer declaration, assignment, and invocation
 *  2. Hardware Interrupt / Event Callback registration pattern
 *  3. Struct Interface Table (C "VTABLE" / Hardware Abstraction Layer)
 *     - Allows swapping between a Real Hardware Sensor and a Simulation/Mock
 *       driver without changing a single line of application code!
 * ==============================================================================
 */

#include <stdio.h>
#include <stdlib.h>
#include <stdint.h>
#include <stdbool.h>

/* ==============================================================================
 * Part 1: Callback Mechanism (Event / Timer Hook)
 * ==============================================================================
 */
typedef void (*ButtonCallback_t)(uint32_t press_duration_ms);

static ButtonCallback_t g_user_button_hook = NULL;

void ButtonDriver_RegisterCallback(ButtonCallback_t callback)
{
    g_user_button_hook = callback;
}

void Simulated_HardwareButtonInterrupt(uint32_t duration_ms)
{
    printf("  [HW Interrupt] Physical button pressed for %ums.\n", duration_ms);
    if (g_user_button_hook != NULL) {
        /* Call the user-registered callback function */
        g_user_button_hook(duration_ms);
    }
}

/* User's custom application callback */
void App_OnButtonShortPress(uint32_t duration_ms)
{
    printf("    -> [APP CALLBACK] Toggling Relay Output (Press duration: %ums)\n", duration_ms);
}

/* ==============================================================================
 * Part 2: C Polymorphism & Hardware Abstraction Layer (VTABLE Interface)
 * ==============================================================================
 */

/* Generic Sensor Interface */
typedef struct {
    bool    (*init)(void);
    int32_t (*read_millidegrees)(void);
    void    (*deinit)(void);
} TemperatureSensorInterface_t;

/* --- Implementation A: Real Physical Hardware Driver (e.g. over I2C) --- */
static bool RealHardware_Init(void) {
    printf("  [Real Sensor] Initialized I2C bus at 400kHz. Addr: 0x48\n");
    return true;
}
static int32_t RealHardware_Read(void) {
    return 24850; /* 24.85 deg C */
}
static void RealHardware_Deinit(void) {
    printf("  [Real Sensor] Powered down sensor into sleep mode.\n");
}

static const TemperatureSensorInterface_t g_real_sensor_driver = {
    .init              = RealHardware_Init,
    .read_millidegrees = RealHardware_Read,
    .deinit            = RealHardware_Deinit
};

/* --- Implementation B: Simulated / Host Mock Driver for Testing --- */
static bool Mock_Init(void) {
    printf("  [Mock Sensor] Initialized mock simulator on Linux host.\n");
    return true;
}
static int32_t Mock_Read(void) {
    return 85000; /* Simulated overheat: 85.00 deg C */
}
static void Mock_Deinit(void) {
    printf("  [Mock Sensor] Mock teardown complete.\n");
}

static const TemperatureSensorInterface_t g_mock_sensor_driver = {
    .init              = Mock_Init,
    .read_millidegrees = Mock_Read,
    .deinit            = Mock_Deinit
};

/* Application Function that works with ANY sensor adhering to the interface */
void Run_TemperatureSupervisor(const TemperatureSensorInterface_t *p_sensor, const char *label)
{
    printf("\n=== Running Supervisor with: %s ===\n", label);
    p_sensor->init();
    
    int32_t temp = p_sensor->read_millidegrees();
    printf("  Current Temperature: %.2f deg C\n", (float)temp / 1000.0f);

    if (temp > 80000) {
        printf("  ALERT: Over-temperature condition detected! Triggering cooling fans.\n");
    } else {
        printf("  Status: Normal operating temperature.\n");
    }

    p_sensor->deinit();
}

int main(void)
{
    printf("============================================================\n");
    printf("  Function Pointers, Callbacks & C Polymorphism\n");
    printf("============================================================\n\n");

    /* 1. Callback Hook Demo */
    printf("[1] Callback Registration Demo:\n");
    ButtonDriver_RegisterCallback(App_OnButtonShortPress);
    Simulated_HardwareButtonInterrupt(150);
    printf("\n");

    /* 2. Interface / Polymorphism Demo */
    printf("[2] C Polymorphism / Driver Swapping Demo:\n");
    /* Run with Real Driver */
    Run_TemperatureSupervisor(&g_real_sensor_driver, "Physical I2C Silicon");
    /* Run with Mock Driver without changing supervisor code! */
    Run_TemperatureSupervisor(&g_mock_sensor_driver, "Linux Host Mock");

    printf("\n============================================================\n");
    printf("Engineering Takeaway:\n");
    printf("Function pointers enable true modularity and 100%% host-based\n");
    printf("unit testing without requiring real hardware!\n");
    printf("============================================================\n");

    return EXIT_SUCCESS;
}
