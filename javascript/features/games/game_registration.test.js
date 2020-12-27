// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { GameActivity } from 'features/games/game_activity.js';
import { GameDescription } from 'features/games/game_description.js';
import { GameRegistration } from 'features/games/game_registration.js';
import { Game } from 'features/games/game.js';

describe('GameRegistration', (it, beforeEach) => {
    let gunther = null;
    let lucy = null;
    let manager = null;
    let russell = null;

    beforeEach(() => {
        const feature = server.featureManager.loadFeature('games');

        manager = feature.manager_;

        gunther = server.playerManager.getById(/* Gunther= */ 0);
        russell = server.playerManager.getById(/* Russell= */ 1);
        lucy = server.playerManager.getById(/* Lucy= */ 2);
    });

    const kContribution = 250;

    it('is able to determine the theoretical number of participants', assert => {
        assert.equal(GameRegistration.getTheoreticalNumberOfParticipants(manager), 3);

        gunther.setIsNonPlayerCharacterForTesting(true);

        assert.equal(GameRegistration.getTheoreticalNumberOfParticipants(manager), 2);

        const registeredActivity = new class extends GameActivity {
            getActivityState() { return GameActivity.kStateRegistered; }
            getActivityName() { return 'Bubble'; }
        };

        const engagedActivity = new class extends GameActivity {
            getActivityState() { return GameActivity.kStateEngaged; }
            getActivityName() { return 'Bubble'; }
        };
        
        manager.setPlayerActivity(russell, registeredActivity);

        // Players still have plenty of time to type `/leave` and join another activity instead when
        // they've only signed up for one, and aren't engaged in that game yet.
        assert.equal(GameRegistration.getTheoreticalNumberOfParticipants(manager), 2);

        manager.setPlayerActivity(russell, engagedActivity);

        // But once they're engaged, they'll stop getting invites for new activities.
        assert.equal(GameRegistration.getTheoreticalNumberOfParticipants(manager), 1);
    });

    it('is strict about not signing up or removing players multiple times', assert => {
        class BubbleGame extends Game {}

        const description = new GameDescription(BubbleGame, { name: 'Bubble', goal: '' });
        const registration =
            new GameRegistration(description, new Map(), GameRegistration.kTypePublic, 1, manager);

        assert.doesNotThrow(() => registration.registerPlayer(gunther, kContribution));
        assert.throws(() => registration.registerPlayer(gunther, kContribution));

        assert.equal(registration.getPlayerContribution(gunther), kContribution);

        assert.doesNotThrow(() => registration.removePlayer(gunther));
        assert.throws(() => registration.removePlayer(gunther));
    });

    it('should start the game immediately when it is a continuous game', assert => {
        class BubbleGame extends Game {}

        const description = new GameDescription(BubbleGame, {
            name: 'Bubble',
            goal: 'Start the game when there are enough players',
            continuous: true,
            minimumPlayers: 1,
            maximumPlayers: 8,
        });

        const registration =
            new GameRegistration(description, new Map(), GameRegistration.kTypePublic, 1, manager);

        assert.isFalse(registration.hasFinished());

        registration.registerPlayer(gunther, kContribution);  // first player
        assert.isTrue(registration.hasFinished());
    });

    it('should start the game when the maximum number of players have signed up', assert => {
        class BubbleGame extends Game {}

        const description = new GameDescription(BubbleGame, {
            name: 'Bubble',
            goal: 'Start the game when there are enough players',
            minimumPlayers: 2,
            maximumPlayers: 2,
        });

        const registration =
            new GameRegistration(description, new Map(), GameRegistration.kTypePublic, 1, manager);
        
        assert.isFalse(registration.hasFinished());

        registration.registerPlayer(gunther, kContribution);  // first player
        assert.isFalse(registration.hasFinished());

        registration.registerPlayer(russell, kContribution);  // second (& maximum) player
        assert.isTrue(registration.hasFinished());
    });

    it('should start the game when all available players have signed up', assert => {
        class BubbleGame extends Game {}

        const description = new GameDescription(BubbleGame, {
            name: 'Bubble',
            goal: 'Start the game when everyone is in!',
            minimumPlayers: 2,
            maximumPlayers: 8,
        });

        const registration =
            new GameRegistration(description, new Map(), GameRegistration.kTypePublic, 1, manager);
        
        assert.isFalse(registration.hasFinished());

        registration.registerPlayer(gunther, kContribution);
        registration.registerPlayer(russell, kContribution);
        assert.isFalse(registration.hasFinished());

        registration.registerPlayer(lucy, kContribution);  // final available player on the server
        assert.isTrue(registration.hasFinished());
    });

    it('should automatically cancel the game if the last participant leaves', assert => {
        class BubbleGame extends Game {}

        const description = new GameDescription(BubbleGame, { name: 'Bubble', goal: '' });
        const registration =
            new GameRegistration(description, new Map(), GameRegistration.kTypePublic, 1, manager);

        registration.registerPlayer(gunther, kContribution);
        assert.isFalse(registration.hasFinished());

        registration.removePlayer(gunther);
        assert.isTrue(registration.hasFinished());
    });

    it('is able to stringify to something sensible', assert => {
        class BubbleGame extends Game {}

        const description = new GameDescription(BubbleGame, { name: 'Bubble', goal: '' });
        const registration =
            new GameRegistration(description, new Map(), GameRegistration.kTypePublic, 1, manager);

        assert.equal(String(registration), '[GameActivity: Bubble (registered)]');

        const customDescription = new GameDescription(BubbleGame, {
            name: (settings) => {
                if (settings.has('bubble/difficulty'))
                    return 'Extreme Bubble';
                
                return 'Bubble';
            },
            goal: ''
        });

        const customRegistration =
            new GameRegistration(customDescription, new Map([ [ 'bubble/difficulty', 'extreme' ] ]),
                                 GameRegistration.kTypePublic, 1, manager);

        assert.equal(String(customRegistration), '[GameActivity: Extreme Bubble (registered)]');
    });
});
