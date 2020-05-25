// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { StructuredGameDescription } from 'components/games/structured_game_description.js';

describe('StructuredGameDescription', it => {
    it('is able to deal with scalar data types', assert => {
        const types = [
            [ StructuredGameDescription.kTypeNumber, 'number', 'noNumber', 9001, 25 ],
            [ StructuredGameDescription.kTypeBoolean, 'boolean', 'noBool', true, false ],
            [ StructuredGameDescription.kTypeString, 'string', 9001, 'yay', 'nay' ],
        ];

        for (const [ type, typeName, invalidValue, explicitValue, defaultValue ] of types) {
            assert.setContext(typeName);

            assert.throws(() => {
                new StructuredGameDescription('game', {
                    // missing `value`
                }, [
                    { name: 'value', type }
                ]);
            });

            assert.throws(() => {
                new StructuredGameDescription('game', {
                    value: invalidValue,
                }, [
                    { name: 'value', type }
                ]);
            });

            assert.throws(() => {
                new StructuredGameDescription('game', {
                    // missing `value`, falling back to default value
                }, [
                    { name: 'value', type, defaultValue: invalidValue }
                ]);
            });

            const valuedDescription = new StructuredGameDescription('game', {
                value: explicitValue
            }, [
                { name: 'value', type }
            ]);

            assert.isTrue(valuedDescription.hasOwnProperty('value'));
            assert.typeOf(valuedDescription.value, typeName);
            assert.strictEqual(valuedDescription.value, explicitValue);

            assert.deepEqual(Object.getOwnPropertyNames(valuedDescription), [ 'value' ]);

            const defaultDescription = new StructuredGameDescription('game', {
                // missing `value`, falling back to default value
            }, [
                { name: 'value', type, defaultValue }
            ]);

            assert.isTrue(defaultDescription.hasOwnProperty('value'));
            assert.typeOf(defaultDescription.value, typeName);
            assert.strictEqual(defaultDescription.value, defaultValue);
        }
    });
});
