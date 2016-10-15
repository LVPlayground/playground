// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Contains all the immutable details about a fight that's yet to be had. FightSettings objects can
// be stored to and created from database information.
class FightSettings {
    constructor({ location, strategy, weapons, health, armour, time, weather, mainWorld,
                  teamDamagePolicy, visibilityPolicy, recording }) {
        this.location_ = location;
        this.strategy_ = strategy;

        this.weapons_ = weapons;

        this.health_ = health;
        this.armour_ = armour;

        this.time_ = time;
        this.weather_ = weather;
        this.mainWorld_ = mainWorld;

        this.teamDamagePolicy_ = teamDamagePolicy;
        this.visibilityPolicy_ = visibilityPolicy;

        this.recording_ = recording;

        // Freeze and seal this object to prevent any modifications from being made.
        Object.freeze(this);
        Object.seal(this);
    }

    // Gets the FightLocation instance at which this fight will be taking place.
    get location() { return this.location_; }

    // Gets the FightStrategy instance that describes the strategy of this fight.
    get strategy() { return this.strategy_; }

    // Gets an iterator for weapon Ids to an amount of ammo that should be granted for this fight.
    get weapons() { return this.weapons_.entries(); }

    // Gets the amount of health players should receive on spawn.
    get health() { return this.health_; }

    // Gets the amount of armour players should receive on spawn.
    get armour() { return this.armour_; }

    // Gets the time at which the fight should take place. This is an object having both the hours
    // and minutes of the exact world time that should be applied.
    get time() { return this.time_; }

    // Gets the weather that should be applied during this fight.
    get weather() { return this.weather_; }

    // Returns whether the fight should take place in the main world.
    inMainWorld() { return this.mainWorld_; }

    // Gets the team damage policy that should apply to players shooting others in their own team
    // for the duration of the fight.
    get teamDamagePolicy() { return this.teamDamagePolicy_; }

    // Gets the visibility policy that should apply to players during the fight.
    get visibilityPolicy() { return this.visibilityPolicy_; }

    // Gets whether the fight should be recorded for future playback.
    shouldRecord() { return this.recording_; }
}

// Available team damage policies for players participating in a team-oriented fight.
FightSettings.TEAM_DAMAGE_POLICY_DEFAULT = 0;
FightSettings.TEAM_DAMAGE_POLICY_PREVENT = 1;

// Available visibility policies for players participating in the fight.
FightSettings.VISIBILITY_POLICY_VISIBLE = 0;
FightSettings.VISIBILITY_POLICY_TEAM = 1;
FightSettings.VISIBILITY_POLICY_HIDDEN = 2;

exports = FightSettings;
