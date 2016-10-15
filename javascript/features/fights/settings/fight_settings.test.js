// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const FightLocation = require('features/fights/fight_location.js');
const FightSettings = require('features/fights/fight_settings.js');
const FightSettingsBuilder = require('features/fights/fight_settings_builder.js');
const FightSignUp = require('features/fights/fight_sign_up.js');
const FightStrategy = require('features/fights/fight_strategy.js');

describe('FightSettings', it => {
    it('should be an immutable object', assert => {
        const settings = (new FightSettingsBuilder()).build();

        assert.isTrue(settings instanceof FightSettings);

        assert.isTrue(Object.isFrozen(settings));
        assert.isTrue(Object.isSealed(settings));

        const immutableObjects = [
            FightSignUp.createInvitationForPlayer(null /* player */, 30 /* expire time */),
            FightSignUp.createPublicChallenge(30 /* expire time */),
            FightSignUp.createPublicAnnouncement('Name', '/command', 30 /* seconds */),
            FightStrategy.createContinuousStrategy(1 /* lives */),
            FightStrategy.createDeathmatchStrategy(1 /* rounds */)
        ];

        immutableObjects.forEach(object => {
            assert.isTrue(Object.isFrozen(object));
            assert.isTrue(Object.isSealed(object));
        });
    });

    it('should reflect the options passed in to the builder', assert => {
        const builder = new FightSettingsBuilder();

        builder.location = FightLocation.getById(1 /* LV FightClub */);
        builder.strategy = FightStrategy.createContinuousStrategy(4 /* lives */);
        builder.signUp = FightSignUp.createPublicAnnouncement('Name', '/command', 30 /* seconds */);
        builder.teams = true;
        builder.addWeapon(24 /* Desert Eagle */, 64);
        builder.addWeapon(28 /* Micro UZI */, 320);
        builder.health = 50;
        builder.armour = 75;
        builder.timeHours = 18;
        builder.timeMinutes = 15;
        builder.weather = 8;  // rainy
        builder.mainWorld = true;
        builder.teamDamagePolicy = FightSettings.TEAM_DAMAGE_POLICY_PREVENT;
        builder.visibilityPolicy = FightSettings.VISIBILITY_POLICY_TEAM;
        builder.recording = true;

        const settings = builder.build();

        assert.equal(settings.location, builder.location);
        {
            assert.isTrue(settings.strategy.isContinuous());
            assert.equal(settings.strategy.type, FightStrategy.TYPE_CONTINUOUS);
            assert.equal(settings.strategy.lives, 4);
            assert.isNull(settings.strategy.rounds);
        }
        {
            assert.isTrue(settings.signUp.isPublicAnnouncement());
            assert.equal(settings.signUp.type, FightSignUp.TYPE_PUBLIC_ANNOUNCE);
            assert.isNull(settings.signUp.player);
            assert.equal(settings.signUp.name, 'Name');
            assert.equal(settings.signUp.command, '/command');
        }
        assert.isTrue(settings.isTeamBased());
        {
            const weapons = settings.weapons;
            assert.deepEqual(weapons.next(), { done: false, value: [ 24, 64 ] });
            assert.deepEqual(weapons.next(), { done: false, value: [ 28, 320 ] });
            assert.deepEqual(weapons.next(), { done: true });
        }
        assert.equal(settings.health, builder.health);
        assert.equal(settings.armour, builder.armour);
        assert.equal(settings.time.hours, builder.timeHours);
        assert.equal(settings.time.minutes, builder.timeMinutes);
        assert.equal(settings.weather, builder.weather);
        assert.isTrue(settings.inMainWorld());
        assert.equal(settings.teamDamagePolicy, builder.teamDamagePolicy);
        assert.equal(settings.visibilityPolicy, builder.visibilityPolicy);
        assert.isTrue(settings.shouldRecord());
    });
});
