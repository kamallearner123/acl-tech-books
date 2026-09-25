/**
 * ==============================================================================
 * Topic 2: Makefiles - Multi-File Modular Project
 * ==============================================================================
 */

#include <stdio.h>
#include <stdlib.h>
#include "math_utils.h"

int main(void)
{
    printf("============================================================\n");
    printf("  Makefile Modular C Build Demonstration\n");
    printf("============================================================\n\n");

    /* 1. Clamp Demo */
    int32_t raw_sensor_val = 1450;
    int32_t clamped = Math_Clamp(raw_sensor_val, 0, 1000);
    printf("[1] Math_Clamp:\n");
    printf("    Raw Sensor Value: %d -> Clamped (0 to 1000): %d\n\n", raw_sensor_val, clamped);

    /* 2. Moving Average Demo */
    int32_t adc_samples[] = { 512, 518, 509, 523, 515 };
    uint32_t num_samples = sizeof(adc_samples) / sizeof(adc_samples[0]);
    int32_t avg = Math_MovingAverage(adc_samples, num_samples);
    printf("[2] Math_MovingAverage:\n");
    printf("    Calculated average of 5 ADC samples: %d\n\n", avg);

    /* 3. Fast Integer Square Root Demo */
    uint32_t number = 144;
    uint32_t sqrt_val = Math_FastSqrt(number);
    printf("[3] Math_FastSqrt:\n");
    printf("    Square root of %u = %u\n", number, sqrt_val);

    printf("\n============================================================\n");
    printf("Build Success! Check 'make' output to see how separate .o\n");
    printf("object files were compiled and linked together.\n");
    printf("============================================================\n");

    return EXIT_SUCCESS;
}
