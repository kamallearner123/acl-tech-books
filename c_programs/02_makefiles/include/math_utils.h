#ifndef MATH_UTILS_H
#define MATH_UTILS_H

#include <stdint.h>
#include <stdbool.h>

/**
 * @brief Clamps an integer between min and max boundaries.
 */
int32_t Math_Clamp(int32_t value, int32_t min, int32_t max);

/**
 * @brief Computes a rolling moving average for sensor smoothing.
 */
int32_t Math_MovingAverage(const int32_t *samples, uint32_t count);

/**
 * @brief Fast integer square root using binary search.
 */
uint32_t Math_FastSqrt(uint32_t n);

#endif /* MATH_UTILS_H */
