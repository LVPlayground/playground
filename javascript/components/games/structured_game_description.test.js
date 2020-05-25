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

            assert.deepEqual(Object.getOwnPropertyNames(defaultDescription), [ 'value' ]);
        }
    });

    it('is able to deal with nested objects in the structure', assert => {
        assert.doesNotThrow(() => {
            new StructuredGameDescription('game', {
                // missing `value`, which is implicitly accepted for objects
            }, [
                { name: 'value', type: StructuredGameDescription.kTypeObject }
            ]);
        });

        assert.throws(() => {
            new StructuredGameDescription('game', {
                // missing `value`, which is implicitly accepted for objects
            }, [
                { 
                    name: 'value',
                    type: StructuredGameDescription.kTypeObject,
                    structure: 3.14,  // invalid
                }
            ]);
        });

        assert.throws(() => {
            new StructuredGameDescription('game', {
                value: 'bananas',
            }, [
                { name: 'value', type: StructuredGameDescription.kTypeObject }
            ]);
        });
        
        const description = new StructuredGameDescription('game', {
            object: {
                second: true,
                first: 'string',
            }
        }, [
            {
                name: 'object',
                type: StructuredGameDescription.kTypeObject,
                structure: [
                    { name: 'first', type: StructuredGameDescription.kTypeString },
                    { name: 'second', type: StructuredGameDescription.kTypeBoolean },
                    { name: 'third', type: StructuredGameDescription.kTypeNumber, defaultValue: 1 },
                ]
            }
        ]);

        assert.isTrue(description.hasOwnProperty('object'));
        assert.typeOf(description.object, 'object');
        
        assert.deepEqual(Object.getOwnPropertyNames(description), [ 'object' ]);
        assert.deepEqual(
            Object.getOwnPropertyNames(description.object), [ 'first', 'second', 'third' ]);
        
        assert.strictEqual(description.object.first, 'string');
        assert.strictEqual(description.object.second, true);
        assert.strictEqual(description.object.third, 1);

        const defaultDescription = new StructuredGameDescription('game', {
            // all data missing, but default initialization should work
        }, [
            {
                name: 'object',
                type: StructuredGameDescription.kTypeObject,
                structure: [
                    { name: 'value', type: StructuredGameDescription.kTypeNumber, defaultValue: 1 },
                ]
            }
        ]);

        assert.isTrue(defaultDescription.hasOwnProperty('object'));
        assert.typeOf(defaultDescription.object, 'object');
        
        assert.deepEqual(Object.getOwnPropertyNames(defaultDescription), [ 'object' ]);
        assert.deepEqual(Object.getOwnPropertyNames(defaultDescription.object), [ 'value' ]);
        
        assert.strictEqual(defaultDescription.object.value, 1);
    });
});
