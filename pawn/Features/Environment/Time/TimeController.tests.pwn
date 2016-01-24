// Copyright 2006-2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

#pragma testcase TimeControllerTestSuite

stock TimeControllerTestSuite() {
    // Make sure that the total duration of an in-game day cycle is within 10% of the intended
    // duration of said cycle.

    new totalDuration = 0;
    for (new hour = 0; hour < 24; ++hour)
        totalDuration += TimeController->resolveDurationForHour(hour);

    new allowedDeviation = floatround(TimeController::DayCycleDuration / 10),
        allowedMinimum = floatround(TimeController::DayCycleDuration - allowedDeviation),
        allowedMaximum = floatround(TimeController::DayCycleDuration + allowedDeviation);

    assert_less_than(totalDuration, allowedMaximum, "The total day duration exceeds 10% deviation (+)");
    assert_greater_than(totalDuration, allowedMinimum, "The total day duration exceeds 10% deviation (-)");
}
