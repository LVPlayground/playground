// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import Minigame from 'features/minigames/minigame.js';
import RaceDatabase from 'features/races/race_database.js';
import RaceMinigame from 'features/races/race_minigame.js';

// The race manager is in charge of meditating between the race database, the commands and the
// minigame feature that will drive the actual races.
class RaceManager {
    constructor(database, minigames) {
        this.database_ = new RaceDatabase(database);

        this.minigameCategory_ = minigames().createCategory('races');
        this.minigames_ = minigames;

        // Catalogue containing all races that can be started by players.
        this.raceCatalogue_ = new Map();
    }

    // ---------------------------------------------------------------------------------------------

    // Registers the |race| with the race catalogue maintained by the manager. Will throw when a
    // race having the same Id has already been registered.
    registerRace(race) {
        if (this.raceCatalogue_.has(race.id))
            throw new Error('A race with Id #' + race.id + ' has already been registered.');

        this.raceCatalogue_.set(race.id, race);
    }

    // Returns whether a race has been registered that has |raceId|.
    isValid(raceId) {
        return this.raceCatalogue_.has(raceId);
    }

    // ---------------------------------------------------------------------------------------------

    // Loads the all-time records for the races stored in the race catalogue from the database. Only
    // has to be called once for the lifetime of this feature, usually after registering all races.
    loadRecordTimes() {
        return this.database_.loadRecordTimes().then(times => {
            for (let race of this.raceCatalogue_.values()) {
                if (!times.has(race.id))
                    continue;

                const record = times.get(race.id);
                race.bestRace = {
                    time: record.time,
                    name: record.name
                };
            }
        });
    }

    // Loads an overview of all created races in the catalogue that also contains the high-scores
    // for the given |player|. The data will be loaded from the database. Returns a promise that
    // will be resolved with an array containing all races, all-time records and personal records.
    loadRecordTimesForPlayer(player) {
        return this.database_.loadRecordTimesForPlayer(player).then(times => {
            let races = [];

            for (let race of this.raceCatalogue_.values()) {
                races.push({
                    id: race.id,
                    name: race.name,
                    bestRace: race.bestRace,
                    personalBestTime: times.get(race.id) || null
                });
            }

            return races;
        });
    }

    // ---------------------------------------------------------------------------------------------

    // Starts the race identified by |raceId| for the |player|. If a race having that Id is already
    // in the sign-up phase they will be invited to join that one, otherwise a new race will be
    // created to cater for the player's preferences.
    startRace(player, raceId) {
        const race = this.raceCatalogue_.get(raceId);
        if (!race)
            throw new Error('Cannot start race for invalid Id: ' + raceId + '.');

        // Announce to the player that they have signed up for the given race.
        player.sendMessage(Message.RACE_COMMAND_JOIN, race.name);

        // First try to join the player in an existing race of their choice.
        for (let minigame of this.minigames_().getMinigamesForCategory(this.minigameCategory_)) {
            if (minigame.state != Minigame.STATE_SIGN_UP)
                continue;  // the minigame is not accepting sign-ups anymore

            if (minigame.race !== race)
                continue;  // the minigame is hosting another race

            // The current |minigame| represents the race the player would like to participate in
            // and is still accepting sign-ups, so make it happen.
            this.minigames_().addPlayerToMinigame(this.minigameCategory_, minigame, player);
            return;
        }

        const raceMinigame = new RaceMinigame(race, this.database_);

        // Alternatively we create a new race that the player will be invited to join in to.
        this.minigames_().createMinigame(this.minigameCategory_, raceMinigame, player);
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        this.raceCatalogue_ = null;

        this.minigames_().deleteCategory(this.minigameCategory_);
        this.minigames_ = null;

        this.database_.dispose();
    }
}

export default RaceManager;
