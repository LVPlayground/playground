// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const MockTextLabel = require('entities/test/mock_text_label.js');
const Vector = require('base/vector.js');

describe('MockTextLabel', (it, beforeEach, afterEach) => {
    let textLabel = null;

    beforeEach(() => {
        textLabel = new MockTextLabel({ didDisposeTextLabel: () => 1 }, {
            text: 'Hello, world!',
            color: Color.fromRGB(255, 255, 0),
            position: new Vector(1000, 1500, 10),
            drawDistance: 50,
            virtualWorld: 42,
            testLineOfSight: true
        });
    });

    afterEach(() => {
        if (textLabel.isConnected())
            textLabel.dispose();
    });

    it('should allow getting and setting the color for the text', assert => {
        assert.equal(typeof textLabel.color, 'object');
        assert.isTrue(textLabel.color instanceof Color);
        assert.deepEqual(textLabel.color, Color.fromRGB(255, 255, 0));

        [Color.RED, Color.GREEN, Color.BLUE].forEach(color => {
            assert.doesNotThrow(() => textLabel.color = color);
            assert.deepEqual(textLabel.color, color);
        });

        assert.throws(() => textLabel.color = null);
        assert.throws(() => textLabel.color = [255, 255, 0]);
        assert.throws(() => textLabel.color = 'red');
    });

    it('should allow getting the draw distance of the text label', assert => {
        assert.equal(typeof textLabel.drawDistance, 'number');
        assert.equal(textLabel.drawDistance, 50);

        assert.throws(() => textLabel.drawDistance = null);
        assert.throws(() => textLabel.drawDistance = 100);
    });

    it('should allow getting the position of the text label', assert => {
        assert.equal(typeof textLabel.position, 'object');
        assert.isTrue(textLabel.position instanceof Vector);
        assert.deepEqual(textLabel.position, new Vector(1000, 1500, 10));

        assert.throws(() => textLabel.position = null);
        assert.throws(() => textLabel.position = new Vector(2000, 3000, 20));
    });

    it('should allow getting or setting the text displayed on the label', assert => {
        assert.equal(typeof textLabel.text, 'string');
        assert.equal(textLabel.text, 'Hello, world!');

        assert.doesNotThrow(() => textLabel.text = 'Today is Saturday?');

        assert.equal(textLabel.text, 'Today is Saturday?');

        assert.throws(() => textLabel.text = '');
        assert.throws(() => textLabel.text = null);
        assert.throws(() => textLabel.text = 100);
        assert.throws(() => textLabel.text = ['Hello', 'World']);
    });

    it('should allow getting the virtual world in which the label is displayed', assert => {
        assert.equal(typeof textLabel.virtualWorld, 'number');
        assert.equal(textLabel.virtualWorld, 42);

        assert.throws(() => textLabel.virtualWorld = null);
        assert.throws(() => textLabel.virtualWorld = 100);
    });

    it('should allow text labels to be attached to a player at an offset', assert => {
        const russell = server.playerManager.getById(0 /* Russell */);
        const offset = new Vector(5, 5, 0);

        assert.isFalse(textLabel.isAttached());

        assert.doesNotThrow(() => textLabel.attachToPlayer(russell, offset));

        assert.isTrue(textLabel.isAttached());

        assert.throws(() => textLabel.attachToPlayer(null, offset));
        assert.throws(() => textLabel.attachToPlayer(0 /* Russell */, offset));
        assert.throws(() => textLabel.attachToPlayer('Russell', offset));

        assert.throws(() => textLabel.attachToPlayer(russell, null));
        assert.throws(() => textLabel.attachToPlayer(russell, [5, 5, 0]));
        assert.throws(() => textLabel.attachToPlayer(russell, 'just above him plz'));
    });

    it('should allow text labels to be attached to a vehicle at an offset', assert => {
        const infernus = server.vehicleManager.createVehicle({
            modelId: 411,
            position: new Vector(2000, 2500, 10)
        });

        const offset = new Vector(5, 5, 0);

        assert.isFalse(textLabel.isAttached());

        assert.doesNotThrow(() => textLabel.attachToVehicle(infernus, offset));

        assert.isTrue(textLabel.isAttached());

        assert.throws(() => textLabel.attachToVehicle(null, offset));
        assert.throws(() => textLabel.attachToVehicle(13 /* vehicle Id */, offset));
        assert.throws(() => textLabel.attachToVehicle('Infernus', offset));

        assert.throws(() => textLabel.attachToVehicle(infernus, null));
        assert.throws(() => textLabel.attachToVehicle(infernus, [5, 5, 0]));
        assert.throws(() => textLabel.attachToVehicle(infernus, 'just above the car plz'));
    });

    it('should allow getting whether a text label tests line of sight', assert => {
        assert.equal(typeof textLabel.testsLineOfSight(), 'boolean');
        assert.isTrue(textLabel.testsLineOfSight());
    });

    it('should allow disposing of the text label', assert => {
        assert.isTrue(textLabel.isConnected());

        textLabel.dispose();

        assert.isFalse(textLabel.isConnected());
    });

    it('should not be possible to add or delete properties from a text label', assert => {
        assert.isTrue(Object.isSealed(textLabel));

        assert.throws(() => textLabel.hat = null);
        assert.throws(() => textLabel.shadow = true);

        assert.equal(textLabel.drawDistance, 50);

        delete textLabel.drawDistance;

        assert.equal(textLabel.drawDistance, 50);
    });

    it('should have an interface identical to that of a real TextLabel', assert => {
        const textLabelProperties = Object.getOwnPropertyNames(TextLabel.prototype).sort();
        const mockTextLabelProperties = Object.getOwnPropertyNames(MockTextLabel.prototype).sort();

        assert.deepEqual(mockTextLabelProperties, textLabelProperties);
    });
});
