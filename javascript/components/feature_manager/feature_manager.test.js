// Copyright 2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const Feature = require('components/feature_manager/feature.js');
const FeatureManager = require('components/feature_manager/feature_manager.js');
const MockServer = require('test/mock_server.js');

describe('FeatureManager', (it, beforeEach, afterEach) => {
  MockServer.bindTo(beforeEach, afterEach);

  it('initializes the features', assert => {
    let counter = 0;

    class MySimpleFeature extends Feature {
      constructor() { super(); counter += 1; }
    };

    class MySecondFeature extends Feature {
      constructor() { super(); counter += 10; }
    };

    server.featureManager.load({
      simple: MySimpleFeature,
      second: MySecondFeature
    });

    assert.equal(counter, 11);
  });

  it('should allow declaring dependencies', assert => {
    let value = 0;

    class MySimpleFeature extends Feature {
      constructor() { super(); value = this.defineDependency('second').value; }
    };

    class MySecondFeature extends Feature {
      constructor() { super(); this.value = 42; }
    };

    server.featureManager.load({
      simple: MySimpleFeature,
      second: MySecondFeature
    });

    assert.equal(value, 42);
  });

  it('should throw on invalid dependencies', assert => {
    class MySimpleFeature extends Feature {
      constructor() {
        super();

        this.defineDependency('fakeFeature');
      }
    };

    assert.throws(() =>
        server.featureManager.load({ simple: MySimpleFeature }));
  });

  it('should throw on circular dependencies', assert => {
    class MySimpleFeature extends Feature {
      constructor() { super(); this.defineDependency('second'); }
    };

    class MySecondFeature extends Feature {
      constructor() { super(); this.defineDependency('simple'); }
    };

    assert.throws(() => {
      server.featureManager.load({
        simple: MySimpleFeature,
        second: MySecondFeature
      });
    });
  });
});
