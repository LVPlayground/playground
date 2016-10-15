// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Private symbol ensuring that the FightStrategy constructor won't be used.
const PrivateSymbol = Symbol('Please use the static methods.');

// Represents the strategy that should be followed during the lifetime of the fight. This means the
// way players will be fighting each other and how much.
class FightStrategy {
    // Creates a new continuous fighting strategy, where players will respawn immediately after they
    // die. Players will receive |lives| lives during the match. The match ends when the other
    // players or teams have exhausted their lives.
    static createContinuousStrategy(lives = 1) {
        return new FightStrategy(
            PrivateSymbol, FightStrategy.TYPE_CONTINUOUS, lives, null /* rounds */);
    }

    // Creates a new deathmatch fighting strategy, where players will all spawn at the same time.
    // Players that die will have to wait until the round's winner has been decided.
    static createDeathmatchStrategy(rounds = 1) {
        return new FightStrategy(
            PrivateSymbol, FightStrategy.TYPE_DEATHMATCH, null /* lives */, rounds);
    }

    // ---------------------------------------------------------------------------------------------

    constructor(privateSymbol, type, lives, rounds) {
        if (privateSymbol !== PrivateSymbol)
            throw new TypeError('Illegal constructor. Use the static methods instead.');

        this.type_ = type;
        this.lives_ = lives;
        this.rounds_ = rounds;

        // Freeze and seal this object to prevent any modifications from being made.
        Object.freeze(this);
        Object.seal(this);
    }

    // Returns whether this strategy represents a continuous fight.
    isContinuous() { return this.type_ === FightStrategy.TYPE_CONTINUOUS; }

    // Returns whether this strategy represents a deathmatch fight.
    isDeathmatch() { return this.type_ === FightStrategy.TYPE_DEATHMATCH; }

    // Gets the number of lives each player receives in continuous fights. May be NULL.
    get lives() { return this.lives_; }

    // Gets the number of rounds player will fight in deathmatch fights. May be NULL.
    get rounds() { return this.rounds_; }
}

// The two different kinds of strategies that fights can have.
FightStrategy.TYPE_CONTINUOUS = 0;
FightStrategy.TYPE_DEATHMATCH = 1;

exports = FightStrategy;
