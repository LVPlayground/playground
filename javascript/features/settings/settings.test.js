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

        const numberValue = settings.getValue('account/nickname_limit_days');
        assert.equal(typeof numberValue, 'number');

        const booleanValue = settings.getValue('abuse/announce_admin_animation');
        assert.equal(typeof booleanValue, 'boolean');
    });

    it('should be able to update the values of settings', assert => {
        assert.throws(() => settings.setValue());
        assert.throws(() => settings.setValue('invalid/value', ''));
        assert.throws(() => settings.setValue(42, 1337));

        // Numbers
        {
            const numberValue = settings.getValue('account/nickname_limit_days');
            assert.equal(typeof numberValue, 'number');

            assert.throws(() => settings.setValue('account/nickname_limit_days', true));
            assert.throws(() => settings.setValue('account/nickname_limit_days', 'yesplz'));
            assert.throws(() => settings.setValue('account/nickname_limit_days', [ 123 ]));

            settings.setValue('account/nickname_limit_days', numberValue + 42);

            const updatedValue = settings.getValue('account/nickname_limit_days');
            assert.equal(typeof updatedValue, 'number');

            assert.equal(updatedValue, numberValue + 42);
        }

        // Booleans
        {
            const booleanValue = settings.getValue('abuse/announce_admin_animation');
            assert.equal(typeof booleanValue, 'boolean');

            assert.throws(() => settings.setValue('abuse/announce_admin_animation', 424));
            assert.throws(() => settings.setValue('abuse/announce_admin_animation', 'yesplz'));
            assert.throws(() => settings.setValue('abuse/announce_admin_animation', [ true ]));

            settings.setValue('abuse/announce_admin_animation', !booleanValue);

            const updatedValue = settings.getValue('abuse/announce_admin_animation');
            assert.equal(typeof updatedValue, 'boolean');

            assert.notEqual(updatedValue, booleanValue);
        }

        // Strings
        {
            const stringValue = settings.getValue('radio/default_channel');
            assert.equal(typeof stringValue, 'string');

            assert.throws(() => settings.setValue('radio/default_channel', 424));
            assert.throws(() => settings.setValue('radio/default_channel', true));
            assert.throws(() => settings.setValue('radio/default_channel', [ true ]));

            settings.setValue('radio/default_channel', 'Hello, world!');

            const updatedValue = settings.getValue('radio/default_channel');
            assert.equal(typeof updatedValue, 'string');

            assert.notEqual(updatedValue, stringValue);
        }
    });

    it('should be able to support change observers for the settings', assert => {
        let invocations = 0;

        let newValue = null;
        let oldValue = null;
        let defaultValue = null;

        class MyObserver {
            onDamageIssuedTimeChange(identifier, inNewValue, inOldValue, inDefaultValue) {
                assert.equal(identifier, 'account/nickname_limit_days');

                ++invocations;

                newValue = inNewValue;
                oldValue = inOldValue;
                defaultValue = inDefaultValue;
            }
        }

        const observer = new MyObserver();

        settings.addSettingObserver('account/nickname_limit_days', observer,
                                    MyObserver.prototype.onDamageIssuedTimeChange);

        assert.equal(invocations, 0);

        const original = settings.getValue('account/nickname_limit_days');
        assert.equal(typeof original, 'number');

        assert.equal(invocations, 0);

        settings.setValue('account/nickname_limit_days', 42);

        assert.equal(invocations, 1);
        assert.equal(newValue, 42);
        assert.equal(oldValue, original);
        assert.equal(defaultValue, original);

        settings.setValue('account/nickname_limit_days', 1337);

        assert.equal(invocations, 2);
        assert.equal(newValue, 1337);
        assert.equal(oldValue, 42);
        assert.equal(defaultValue, original);

        settings.removeSettingObserver('account/nickname_limit_days', observer);
        settings.setValue('account/nickname_limit_days', original);

        assert.equal(invocations, 2);
    });

    it('should interact with the database in the expected manner', async(assert) => {
        await Promise.resolve();  // asynchronous part of the constructor

        assert.equal(settings.database_.loadCalls, 1);

        const original = settings.getValue('account/nickname_limit_days');
        assert.equal(typeof original, 'number');

        assert.equal(settings.database_.writeCalls, 0);
        assert.equal(settings.database_.deleteCalls, 0);

        // (1) Update a setting to something that's not its default value.
        {
            settings.setValue('account/nickname_limit_days', 42);

            await Promise.resolve();

            assert.equal(settings.database_.writeCalls, 1);
            assert.equal(settings.database_.deleteCalls, 0);
        }

        // (2) Update a setting back to its default value.
        {
            settings.setValue('account/nickname_limit_days', original);

            await Promise.resolve();

            assert.equal(settings.database_.writeCalls, 1);
            assert.equal(settings.database_.deleteCalls, 1);
        }
    });
});
