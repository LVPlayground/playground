// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { Supplementable, Supplement } from 'base/supplementable.js';

describe('Supplementable', it => {
    it('is able to provide supplements to types', assert => {
        let constructorCalls = 0;

        class MySupplementable extends Supplementable {
            value_ = 42;

            get value() { return this.value_; }
            set value(value) { this.value_ = value; }

            method() { return 84; }
        }

        class MySupplement extends Supplement {
            constructor(supplementable, multiplier) {
                super();

                constructorCalls++;

                this.supplementable_ = supplementable;
                this.multiplier_ = multiplier;
            }

            get multiplicationResult() {
                return this.supplementable_.value * this.multiplier_;
            }
        }

        // It's not valid to call provideSupplement on the Supplementable constructor.
        assert.throws(() =>
            Supplementable.provideSupplement('supplement', MySupplement));
        
        // The property must not exist yet on the prototype of the Supplementable.
        assert.throws(() =>
            MySupplementable.provideSupplement('value', MySupplement));

        assert.throws(() =>
            MySupplementable.provideSupplement('method', MySupplement));

        // The instance must be either a Supplement, or null when being removed.
        assert.throws(() =>
            MySupplementable.provideSupplement('supplement', class {}));
        assert.throws(() =>
            MySupplementable.provideSupplement('supplement', 3.1415));
        assert.throws(() =>
            MySupplementable.provideSupplement('supplement', undefined));
        
        const existingInstance = new MySupplementable;
        assert.equal(typeof existingInstance.double, 'undefined');

        existingInstance.value = 24;

        // The supplement can be provided.
        assert.doesNotThrow(() =>
            MySupplementable.provideSupplement('double', MySupplement, 2));
        assert.doesNotThrow(() =>
            MySupplementable.provideSupplement('triple', MySupplement, 3));
        
        assert.equal(constructorCalls, 0);

        const newInstance = new MySupplementable;
        assert.notEqual(typeof newInstance.double, 'undefined');
        assert.notEqual(typeof existingInstance.double, 'undefined');

        assert.throws(() => existingInstance.double = 'hello');

        assert.equal(constructorCalls, 2);

        assert.isTrue(newInstance.double instanceof MySupplement);
        assert.isTrue(existingInstance.double instanceof MySupplement);

        assert.equal(newInstance.double.multiplicationResult, 84);
        assert.equal(newInstance.triple.multiplicationResult, 126);
        assert.equal(existingInstance.double.multiplicationResult, 48);
        assert.equal(existingInstance.triple.multiplicationResult, 72);

        assert.equal(constructorCalls, 4);

        // The supplement can be removed.
        assert.doesNotThrow(() =>
            MySupplementable.provideSupplement('double', null));
        
        const finalInstance = new MySupplementable;
        assert.equal(typeof newInstance.double, 'undefined');
        assert.equal(typeof existingInstance.double, 'undefined');
        assert.equal(typeof finalInstance.double, 'undefined');
    });
});
