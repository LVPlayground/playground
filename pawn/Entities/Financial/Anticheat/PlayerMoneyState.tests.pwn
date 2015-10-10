// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

#pragma testcase PlayerMoneyStateTests

// Helper method to more easily lay out the tests we want to run.
stock PlayerMoneyStateTest(current, amount, expected, text[]) {
    PlayerMoneyState(0)->reset();
    PlayerMoneyState(0)->increase(current, true);
    PlayerMoneyState(0)->increase(amount, true);

    assert_equals(PlayerMoneyState(0)->current(), expected, text);
}

stock PlayerMoneyStateTests() {
    PlayerMoneyStateTest(0, 50, 50, "Basic money increments work.");
    PlayerMoneyStateTest(0, -50, -50, "Basic money decrements work.");

    PlayerMoneyStateTest(1000000, 2147483647, 2147483647, "Clamping of money upwards works.");
    PlayerMoneyStateTest(1000000, -2147483647, -2146483647, "Big decreases in money work.");

    PlayerMoneyStateTest(-1000000, 2147483647, 2146483647, "Big increases in money work.");
    PlayerMoneyStateTest(-1000000, -2147483647, -2147483648, "Clamping of money downwards works.");

    PlayerMoneyStateTest(2147483647, 2147483647, 2147483647, "Adding the maximum to the maximum should be the maximum.");
    PlayerMoneyStateTest(-2147483648, -2147483648, -2147483648, "Adding the minimum to the minimum should be the minimum.");
}
