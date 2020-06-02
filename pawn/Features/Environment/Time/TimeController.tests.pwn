// Copyright 2006-2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

#pragma testcase TimeControllerTestSuite

TimeControllerTestSuite() {
    // Make sure that the total duration of an in-game day cycle is within 10% of the intended
    // duration of said cycle.

    new Float: totalDuration = 0;
    for (new hour = 0; hour < 24; ++hour)
        totalDuration += TimeController->resolveDurationForHour(hour);

    new Float: allowedDeviation = TimeController::DayCycleDuration / 10,
        Float: allowedMinimum = TimeController::DayCycleDuration - allowedDeviation,
        Float: allowedMaximum = TimeController::DayCycleDuration + allowedDeviation;

    assert_less_than(totalDuration, allowedMaximum, "The total day duration exceeds 10% deviation (+)");
    assert_greater_than(totalDuration, allowedMinimum, "The total day duration exceeds 10% deviation (-)");

    // Make sure that the routines for converting to and from a timestamp are accurate.
    for (new hour = 0; hour < 24; ++hour) {
        for (new minute = 0; minute < 60; ++minute) {
            new timestamp = TimeController->toTimestamp(hour, minute);
            new restoredHour, restoredMinute;

            TimeController->fromTimestamp(timestamp, restoredHour, restoredMinute);

            assert_equals(restoredHour, hour, "The deserialized hour should match.");
            assert_equals(restoredMinute, minute, "The deserialized minute should match.");
        }
    }
}
