// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import TextLabelManager from 'entities/text_label_manager.js';
import { MockTextLabel } from 'entities/test/mock_text_label.js';

describe('TextLabelManager', (it, beforeEach, afterEach) => {
    let manager = null;

    beforeEach(() => manager = new TextLabelManager(MockTextLabel /* textLabelConstructor */));
    afterEach(() => {
        if (manager)
            manager.dispose();
    });

    it('should enable creation of text labels', assert => {
        const textLabel = manager.createTextLabel({ text: 'Hello', position: new Vector(0, 0, 0) });
        assert.isNotNull(textLabel);

        assert.isTrue(textLabel.isConnected());

        assert.equal(textLabel.text, 'Hello');
        assert.deepEqual(textLabel.position, new Vector(0, 0, 0));
    });

    it('should count the number of created actors, and dispose of them appropriately', assert => {
        const labels = [
            manager.createTextLabel({ text: 'Foo', position: new Vector(10, 40, 70) }),
            manager.createTextLabel({ text: 'Bar', position: new Vector(20, 50, 80) }),
            manager.createTextLabel({ text: 'Baz', position: new Vector(30, 60, 90) })
        ];

        assert.equal(manager.count, labels.length);

        manager.dispose();
        manager = null;

        labels.forEach(textLabel => assert.isFalse(textLabel.isConnected()));
    });

    it('should unregister actors when they get disposed of', assert => {
        const textLabel = manager.createTextLabel({ text: 'Hello', position: new Vector(0, 0, 0) });

        assert.equal(manager.count, 1);

        textLabel.dispose();

        assert.equal(manager.count, 0);
    });

    it('should throw on disposing invalid actors', assert => {
        const textLabel = manager.createTextLabel({ text: 'Hello', position: new Vector(0, 0, 0) });

        assert.equal(manager.count, 1);

        textLabel.dispose();

        assert.equal(manager.count, 0);

        assert.throws(() => textLabel.dispose());
        assert.throws(() => manager.didDisposeActor(textLabel));
    });
});
