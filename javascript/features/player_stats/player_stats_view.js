// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Provides an actual view on a player's statistics. Three variants of this object are possible: the
// statistics for the active playing session, a player's account statistics spanning multiple
// playing sessions, and a diff view when snapshots are taken.
export class PlayerStatsView {
    // ---------------------------------------------------------------------------------------------
    // Properties that should be ignored when serializing the view.
    static kIgnoredProperties = new Set([
        'accuracy', 'damageRatio', 'ratio', 'shots', 'shotsRatio'
    ]);

    #onlineTimeBase_ = 0;
    #onlineTimeStart_ = server.clock.monotonicallyIncreasingTime();

    // ---------------------------------------------------------------------------------------------

    reactionTests = 0;

    // Gets or sets the online time. This is decided based on a base value, and a start time to be
    // able to return live values without having to update data all the time.
    get onlineTime() {
        const difference = server.clock.monotonicallyIncreasingTime() - this.#onlineTimeStart_;
        return this.#onlineTimeBase_ + Math.floor(difference / 1000);
    }

    set onlineTime(value) {
        this.#onlineTimeBase_ = value;
        this.#onlineTimeStart_ = server.clock.monotonicallyIncreasingTime();
    }

    // ---------------------------------------------------------------------------------------------

    deathCount = 0;
    killCount = 0;

    // Gets the kills/deaths ratio based on the data in this view.
    get ratio() { return this.deathCount ? this.killCount / this.deathCount : this.killCount; }

    damageGiven = 0;
    damageTaken = 0;

    // Gets the ratio of giving damage vs. taking damage, when counting the damage amounts.
    get damageRatio() {
        return this.damageTaken ? this.damageGiven / this.damageTaken : this.damageGiven;
    }

    shotsHit = 0;
    shotsMissed = 0;
    shotsTaken = 0;

    // Gets the accuracy of this player's shooting behaviour.
    get accuracy() { return this.shots ? this.shotsHit / this.shots : 0; }

    // Gets the total number of shots fired by the player.
    get shots() { return this.shotsHit + this.shotsMissed; }

    // Gets the ratio of giving damage vs. taking damage when counting number of shots.
    get shotsRatio() { return this.shotsTaken ? this.shotsHit / this.shotsTaken : this.shotsHit; }
}
