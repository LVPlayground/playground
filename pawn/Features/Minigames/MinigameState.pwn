// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/**
 * An enumerations for the valid states a minigame can be in at any given time. By default, most
 * will be idle, but when a player starts it it'll go to the signup phase. Then there's a brief
 * state for loading the environment, countdown (if applicable) and then actual runtime of the game
 * itself, which allows players to interact with it.
 *
 * @author Russell Krupke <russell@sa-mp.nl>
 */
enum MinigameState {
    // Idle indicates that the minigame is currently not being played.
    IdleMinigameState,

    // The signup state indicates that players now have the opportunity to sign up for this game. An
    // announcement about it has already been distributed to all available players.
    SignupMinigameState,

    // Indicates that the minigame is currently in progress. Signing up for the game will not be
    // possible anymore, and any player in the minigame is definitely participating.
    ActiveMinigameState
};
