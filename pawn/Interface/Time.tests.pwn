// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

#pragma testcase TimeTestSuite

TimeTestSuite() {
    // String we'll use for testing purposes.
    new timeString[8];

    // Test second value < 0
    Time->formatRemainingTime(-30, timeString, sizeof(timeString));
    assert_string_equals(timeString, "0", "Remaining time should show 0 when second value is negative.");

    // Test second value == 0
    Time->formatRemainingTime(0, timeString, sizeof(timeString));
    assert_string_equals(timeString, "0", "Remaining time should show 0 when second value is 0");

    // Test second value > 0 && value < 60
    Time->formatRemainingTime(30, timeString, sizeof(timeString));
    assert_string_equals(timeString, "30", "Remaining time shouldn't show minute units when second value > 0 && value < 60");

    // Test second value == 60
    Time->formatRemainingTime(60, timeString, sizeof(timeString));
    assert_string_equals(timeString, "1:00", "Remaining time should show 1:00 when second value is 60");

    // Test second value > 60 && value < 3600
    Time->formatRemainingTime(121, timeString, sizeof(timeString));
    assert_string_equals(timeString, "2:01", "Remaining time should show minute units when second value > 60 && value < 3600");

    // Test second value > 3600
    Time->formatRemainingTime(3601, timeString, sizeof(timeString));
    assert_string_equals(timeString, "1:00:01", "Remaining time should show hour units when second value > 3600");
}
