// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

describe('Settings', (it, beforeEach) => {
    let settings = null;

    beforeEach(() => settings = server.featureManager.loadFeature('settings'));

    it('should be able to read settings of different types', assert => {
        assert.throws(() => settings.getValue());
        assert.throws(() => settings.getValue('invalid/value'));
        assert.throws(() => settings.getValue(42));

        const numberValue = settings.getValue('abuse/blocker_damage_issued_time');
        assert.equal(typeof numberValue, 'number');

        const booleanValue = settings.getValue('abuse/spawn_vehicle_admin_override');
        assert.equal(typeof booleanValue, 'boolean');
    });

    it('should be able to update the values of settings', assert => {
        assert.throws(() => settings.setValue());
        assert.throws(() => settings.setValue('invalid/value', ''));
        assert.throws(() => settings.setValue(42, 1337));

        // Numbers
        {
            const numberValue = settings.getValue('abuse/blocker_damage_issued_time');
            assert.equal(typeof numberValue, 'number');

            assert.throws(() => settings.setValue('abuse/blocker_damage_issued_time', true));
            assert.throws(() => settings.setValue('abuse/blocker_damage_issued_time', 'yesplz'));
            assert.throws(() => settings.setValue('abuse/blocker_damage_issued_time', [ 123 ]));

            settings.setValue('abuse/blocker_damage_issued_time', numberValue + 42);

            const updatedValue = settings.getValue('abuse/blocker_damage_issued_time');
            assert.equal(typeof updatedValue, 'number');

            assert.equal(updatedValue, numberValue + 42);
        }

        // Booleans
        {
            const booleanValue = settings.getValue('abuse/spawn_vehicle_admin_override');
            assert.equal(typeof booleanValue, 'boolean');

            assert.throws(() => settings.setValue('abuse/spawn_vehicle_admin_override', 424));
            assert.throws(() => settings.setValue('abuse/spawn_vehicle_admin_override', 'yesplz'));
            assert.throws(() => settings.setValue('abuse/spawn_vehicle_admin_override', [ true ]));

            settings.setValue('abuse/spawn_vehicle_admin_override', !booleanValue);

            const updatedValue = settings.getValue('abuse/spawn_vehicle_admin_override');
            assert.equal(typeof updatedValue, 'boolean');

            assert.notEqual(updatedValue, booleanValue);
        }
    });

    it('should be able to support change observers for the settings', assert => {
        let invocations = 0;

        let newValue = null;
        let oldValue = null;
        let defaultValue = null;

        class MyObserver {
            onDamageIssuedTimeChange(identifier, inNewValue, inOldValue, inDefaultValue) {
                assert.equal(identifier, 'abuse/blocker_damage_issued_time');

                ++invocations;

                newValue = inNewValue;
                oldValue = inOldValue;
                defaultValue = inDefaultValue;
            }
        }

        const observer = new MyObserver();

        settings.addSettingObserver('abuse/blocker_damage_issued_time', observer,
                                    MyObserver.prototype.onDamageIssuedTimeChange);

        assert.equal(invocations, 0);

        const original = settings.getValue('abuse/blocker_damage_issued_time');
        assert.equal(typeof original, 'number');

        assert.equal(invocations, 0);

        settings.setValue('abuse/blocker_damage_issued_time', 42);

        assert.equal(invocations, 1);
        assert.equal(newValue, 42);
        assert.equal(oldValue, original);
        assert.equal(defaultValue, original);

        settings.setValue('abuse/blocker_damage_issued_time', 1337);

        assert.equal(invocations, 2);
        assert.equal(newValue, 1337);
        assert.equal(oldValue, 42);
        assert.equal(defaultValue, original);

        settings.removeSettingObserver('abuse/blocker_damage_issued_time', observer);
        settings.setValue('abuse/blocker_damage_issued_time', original);

        assert.equal(invocations, 2);
    });

    it('should interact with the database in the expected manner', async(assert) => {
        await Promise.resolve();  // asynchronous part of the constructor

        assert.equal(settings.database_.loadCalls, 1);

        const original = settings.getValue('abuse/blocker_damage_issued_time');
        assert.equal(typeof original, 'number');

        assert.equal(settings.database_.writeCalls, 0);
        assert.equal(settings.database_.deleteCalls, 0);

        // (1) Update a setting to something that's not its default value.
        {
            settings.setValue('abuse/blocker_damage_issued_time', 42);

            await Promise.resolve();

            assert.equal(settings.database_.writeCalls, 1);
            assert.equal(settings.database_.deleteCalls, 0);
        }

        // (2) Update a setting back to its default value.
        {
            settings.setValue('abuse/blocker_damage_issued_time', original);

            await Promise.resolve();

            assert.equal(settings.database_.writeCalls, 1);
            assert.equal(settings.database_.deleteCalls, 1);
        }
    });
});
