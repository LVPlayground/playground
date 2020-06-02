// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

#pragma testcase PlayerTestSuite

PlayerTestSuite() {
    new playerId;

    // Test that players default to unconnected, even when overflows occur.
    assert_equals(Player(playerId = 0)->isConnected(), false, "Player 0 should not be connected yet.");
    assert_equals(Player(playerId = 9000)->isConnected(), false, "Player 9000 should not be connected.");
    assert_equals(Player(playerId = -500)->isConnected(), false, "Player -500 should not be connected.");

    // Test that isConnected works correctly, considering the gamemode will already rely on this.
    assert_equals(Player(0)->isConnected(), false, "Player 0 should not be connected yet.");
    Player(0)->onConnect();
    assert_equals(Player(0)->isConnected(), true, "Player 0 should now be connected.");
    Player(0)->onDisconnect();
    assert_equals(Player(0)->isConnected(), false, "Player 0 should be disconnected again.");

    assert_equals(Player(50)->isConnected(), false, "Player 50 should not be connected yet.");
    Player(50)->onConnect();
    assert_equals(Player(50)->isConnected(), true, "Player 50 should now be connected.");
    Player(50)->onDisconnect();
    assert_equals(Player(50)->isConnected(), false, "Player 50 should be disconnected again.");

    // The other flags, for example isNonPlayerCharacter, must be working correctly as well.
    Player(50)->onConnect();
    assert_equals(Player(50)->isConnected(), true, "Player 50 should be connected.");
    assert_equals(Player(50)->isNonPlayerCharacter(), false, "Player 50 shouldn't be a non player character.");
    Player(50)->enableFlagForTests(IsNonPlayerCharacterFlag);
    assert_equals(Player(50)->isNonPlayerCharacter(), true, "Player 50 should now be a non player character.");
    Player(50)->disableFlagForTests(IsNonPlayerCharacterFlag);
    assert_equals(Player(50)->isNonPlayerCharacter(), false, "Player 50 shouldn't be a non player character anymore.");
    Player(50)->onDisconnect();

    // Verify that the toggleFlag method works as espected as well.
    Player(50)->onConnect();
    assert_equals(Player(50)->isRegistered(), false, "The player should not be registered by default.");
    Player(50)->toggleFlagForTests(IsRegisteredFlag, 1);
    assert_equals(Player(50)->isRegistered(), true, "The player should now be registered (toggleFlag).");
    Player(50)->toggleFlagForTests(IsRegisteredFlag, 0);
    assert_equals(Player(50)->isRegistered(), false, "The player should not be registered anymore (toggleFlag).");
    Player(50)->onDisconnect();

    // Test some of the flags, as we should be able to toggle them.
    assert_equals(Player(50)->isInClassSelection(), false, "Player 0 should not be in the class selection yet.");
    Player(50)->setIsInClassSelection(true);
    assert_equals(Player(50)->isInClassSelection(), true, "Player 0 should be in the class selection.");
    Player(50)->setIsInClassSelection(false);
    assert_equals(Player(50)->isInClassSelection(), false, "Player 0 should not be in the class selection.");

    // Make sure that the is{Administrator,Management} methods work as they should.
    Player(50)->onConnect();
    assert_equals(Player(50)->isAdministrator(), false, "Player 50 should not be an administrator.");
    assert_equals(Player(50)->isManagement(), false, "Player 50 should not be a management member.");

    Player(50)->setLevel(AdministratorLevel, /* isTemporary= */ false);
    assert_equals(Player(50)->isAdministrator(), true, "Player 50 should be an administrator.");
    assert_equals(Player(50)->isManagement(), false, "Player 50 should not be a management member.");

    Player(50)->setLevel(ManagementLevel, /* isTemporary= */ false);
    assert_equals(Player(50)->isManagement(), true, "Player 50 should be a management member.");
    Player(50)->onDisconnect();

    // Surpress the warning about playerId not being used.
    #pragma unused playerId
}
