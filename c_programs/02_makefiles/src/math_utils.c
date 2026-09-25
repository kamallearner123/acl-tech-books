#include "math_utils.h"

int32_t Math_Clamp(int32_t value, int32_t min, int32_t max)
{
    if (value < min) {
        return min;
    }
    if (value > max) {
        return max;
    }
    return value;
}

int32_t Math_MovingAverage(const int32_t *samples, uint32_t count)
{
    if (samples == (const int32_t *)0 || count == 0U) {
        return 0;
    }

    int64_t sum = 0;
    for (uint32_t i = 0U; i < count; ++i) {
        sum += samples[i];
    }
    return (int32_t)(sum / (int64_t)count);
}

uint32_t Math_FastSqrt(uint32_t n)
{
    if (n == 0U) return 0U;
    
    uint32_t low = 1U;
    uint32_t high = n;
    uint32_t ans = 1U;

    while (low <= high) {
        uint32_t mid = low + (high - low) / 2U;
        /* Protect against overflow during mid * mid */
        if ((uint64_t)mid * (uint64_t)mid <= (uint64_t)n) {
            ans = mid;
            low = mid + 1U;
        } else {
            high = mid - 1U;
        }
    }
    return ans;
}
