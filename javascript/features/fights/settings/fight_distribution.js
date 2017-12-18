// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Private symbol ensuring that the FightDistribution constructor won't be used.
const PrivateSymbol = Symbol('Please use the static methods.');

// Represents the way players should be distributed in a particular fight.
class FightDistribution {
    // Creates a distribution where each player fights for their own sake.
    static createIndividualDistribution(forceSkin = null) {
        return new FightDistribution(
            PrivateSymbol, FightDistribution.TYPE_INDIVIDUAL, [ forceSkin ]);
    }

    // Creates a distribution where players will be divided in teams, where the division will happen
    // based on the player's statistics to ensure that not all good players stick together.
    static createBalancedTeamDistribution(forceSkins = []) {
        return new FightDistribution(
            PrivateSymbol, FightDistribution.TYPE_BALANCED_TEAMS, forceSkins);
    }

    // Creates a distribution where players will be divided in teams, where the division will happen
    // based on randomness. Good players may be put together by chance.
    static createRandomTeamDistribution(forceSkins = []) {
        return new FightDistribution(
            PrivateSymbol, FightDistribution.TYPE_RANDOM_TEAMS, forceSkins);
    }

    // ---------------------------------------------------------------------------------------------

    constructor(privateSymbol, type, forceSkins) {
        if (privateSymbol !== PrivateSymbol)
            throw new TypeError('Illegal constructor. Use the static methods instead.');

        this.type_ = type;
        this.forceSkins_ = forceSkins;

        // Freeze and seal this object to prevent any modifications from being made.
        Object.freeze(this);
        Object.seal(this);
    }

    // Returns whether this distribution treats players as individual parties.
    isIndividual() { return this.type_ === FightDistribution.TYPE_INDIVIDUAL; }

    // Returns whether this distribution is based on balanced teams.
    isBalancedTeams() { return this.type_ === FightDistribution.TYPE_BALANCED_TEAMS; }

    // Returns whether this distribution is based on randomized teams.
    isRandomTeams() { return this.type_ === FightDistribution.TYPE_RANDOM_TEAMS; }

    // Returns whether this distribution will be based on gangs.
    isGangs() { return this.type_ === FightDistribution.TYPE_GANGS; }

    // Gets the type of distribution to apply to the fight.
    get type() { return this.type_; }

    // Gets an array of the skins that should be applied to the parties.
    get forceSkins() { return this.forceSkins_; }
}

// The different kinds of player distributions that can be given to a fight.
FightDistribution.TYPE_INDIVIDUAL = 0;
FightDistribution.TYPE_BALANCED_TEAMS = 1;
FightDistribution.TYPE_RANDOM_TEAMS = 2;
FightDistribution.TYPE_GANGS = 3;

export default FightDistribution;
