/**
 * ==============================================================================
 * Topic 4: Bitwise Operations - Program 2: Telemetry Packet Packing & Unpacking
 * ==============================================================================
 * Description:
 * Demonstrates bit-field serialization for embedded radio/CAN/UART communication.
 * In embedded networks (CAN, BLE, LoRa), bandwidth is limited. Engineers pack
 * multiple data fields into compact bit-fields instead of sending loose strings.
 *
 * Packet Format (32 bits total):
 *  - [Bits 31..28] (4 bits): Sensor Device ID (0..15)
 *  - [Bit  27]     (1 bit) : Error Flag (0 = OK, 1 = Error)
 *  - [Bit  26]     (1 bit) : Calibrated Flag (0 = No, 1 = Yes)
 *  - [Bits 25..24] (2 bits): Power Mode (0=Sleep, 1=LowPower, 2=Normal, 3=Boost)
 *  - [Bits 23..16] (8 bits): Battery Level % (0..100)
 *  - [Bits 15..0]  (16 bits): Signed Temperature in deci-degrees C (e.g. 254 = 25.4 C)
 * ==============================================================================
 */

#include <stdio.h>
#include <stdlib.h>
#include <stdint.h>
#include <stdbool.h>

/* Shift Offsets */
#define SHIFT_DEVICE_ID   (28U)
#define SHIFT_ERROR_FLAG  (27U)
#define SHIFT_CALIB_FLAG  (26U)
#define SHIFT_POWER_MODE  (24U)
#define SHIFT_BATTERY     (16U)
#define SHIFT_TEMP        (0U)

/* Bit Masks */
#define MASK_DEVICE_ID    (0x0FU)
#define MASK_ERROR_FLAG   (0x01U)
#define MASK_CALIB_FLAG   (0x01U)
#define MASK_POWER_MODE   (0x03U)
#define MASK_BATTERY      (0xFFU)
#define MASK_TEMP         (0xFFFFU)

typedef struct {
    uint8_t device_id;
    bool    has_error;
    bool    is_calibrated;
    uint8_t power_mode;
    uint8_t battery_pct;
    int16_t temperature_deci_c;
} TelemetryData_t;

/**
 * @brief Serializes telemetry struct into a compact 32-bit word
 */
uint32_t Telemetry_Pack(const TelemetryData_t *data)
{
    uint32_t packet = 0U;

    packet |= ((uint32_t)(data->device_id & MASK_DEVICE_ID))      << SHIFT_DEVICE_ID;
    packet |= ((uint32_t)(data->has_error ? 1U : 0U))             << SHIFT_ERROR_FLAG;
    packet |= ((uint32_t)(data->is_calibrated ? 1U : 0U))         << SHIFT_CALIB_FLAG;
    packet |= ((uint32_t)(data->power_mode & MASK_POWER_MODE))    << SHIFT_POWER_MODE;
    packet |= ((uint32_t)(data->battery_pct & MASK_BATTERY))      << SHIFT_BATTERY;
    packet |= ((uint32_t)((uint16_t)data->temperature_deci_c))    << SHIFT_TEMP;

    return packet;
}

/**
 * @brief Deserializes a 32-bit word back into individual struct fields
 */
void Telemetry_Unpack(uint32_t packet, TelemetryData_t *out_data)
{
    out_data->device_id          = (uint8_t)((packet >> SHIFT_DEVICE_ID) & MASK_DEVICE_ID);
    out_data->has_error          = ((packet >> SHIFT_ERROR_FLAG) & MASK_ERROR_FLAG) != 0U;
    out_data->is_calibrated      = ((packet >> SHIFT_CALIB_FLAG) & MASK_CALIB_FLAG) != 0U;
    out_data->power_mode         = (uint8_t)((packet >> SHIFT_POWER_MODE) & MASK_POWER_MODE);
    out_data->battery_pct        = (uint8_t)((packet >> SHIFT_BATTERY) & MASK_BATTERY);
    out_data->temperature_deci_c = (int16_t)((packet >> SHIFT_TEMP) & MASK_TEMP);
}

int main(void)
{
    printf("============================================================\n");
    printf("  Embedded Telemetry Packet Packing / Unpacking (Bitwise)\n");
    printf("============================================================\n\n");

    /* 1. Original Sensor Data */
    TelemetryData_t tx_data = {
        .device_id          = 11U,
        .has_error          = false,
        .is_calibrated      = true,
        .power_mode         = 2U,       /* Normal Mode */
        .battery_pct        = 87U,      /* 87% */
        .temperature_deci_c = -45       /* -4.5 degrees C */
    };

    printf("[1] Transmitted Sensor Fields:\n");
    printf("  Device ID   : %u\n", tx_data.device_id);
    printf("  Error Flag  : %s\n", tx_data.has_error ? "TRUE" : "FALSE");
    printf("  Calibrated  : %s\n", tx_data.is_calibrated ? "YES" : "NO");
    printf("  Power Mode  : %u (Normal)\n", tx_data.power_mode);
    printf("  Battery     : %u%%\n", tx_data.battery_pct);
    printf("  Temperature : %.1f deg C\n\n", (float)tx_data.temperature_deci_c / 10.0f);

    /* 2. Pack into 32-bit Word */
    uint32_t packed_word = Telemetry_Pack(&tx_data);
    printf("[2] Packed 32-bit Binary Representation:\n");
    printf("  Hex Value   : 0x%08X (Single 4-byte transfer over bus!)\n\n", packed_word);

    /* 3. Unpack on Receiver Node */
    TelemetryData_t rx_data;
    Telemetry_Unpack(packed_word, &rx_data);

    printf("[3] Received and Unpacked Sensor Fields:\n");
    printf("  Device ID   : %u\n", rx_data.device_id);
    printf("  Error Flag  : %s\n", rx_data.has_error ? "TRUE" : "FALSE");
    printf("  Calibrated  : %s\n", rx_data.is_calibrated ? "YES" : "NO");
    printf("  Power Mode  : %u\n", rx_data.power_mode);
    printf("  Battery     : %u%%\n", rx_data.battery_pct);
    printf("  Temperature : %.1f deg C\n\n", (float)rx_data.temperature_deci_c / 10.0f);

    /* 4. Verification Check */
    if ((tx_data.device_id == rx_data.device_id) &&
        (tx_data.temperature_deci_c == rx_data.temperature_deci_c) &&
        (tx_data.battery_pct == rx_data.battery_pct)) {
        printf("VERIFICATION: SUCCESS! Bit packing & unpacking perfectly preserved all data.\n");
    } else {
        printf("VERIFICATION: FAILED! Data corruption occurred.\n");
    }

    return EXIT_SUCCESS;
}
