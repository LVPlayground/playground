// Copyright 2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

let Feature = require('components/feature_manager/feature.js'),
    FeatureManager = require('components/feature_manager/feature_manager.js');

describe('FeatureManager', it => {
  class FakePlayground {
    constructor() {
      this.featureManager = new FeatureManager(this);
    }
  };

  it('initializes the features', assert => {
    let counter = 0;

    class MySimpleFeature extends Feature {
      constructor(playground) { super(playground); counter += 1; }
    };

    class MySecondFeature extends Feature {
      constructor(playground) { super(playground); counter += 10; }
    };

    let playground = new FakePlayground(),
        manager = playground.featureManager;
    
    manager.load({
      simple: MySimpleFeature,
      second: MySecondFeature
    });

    assert.equal(counter, 11);
  });

  it('should allow declaring dependencies', assert => {
    let value = 0;

    class MySimpleFeature extends Feature {
      constructor(playground) {
        super(playground);
        value = this.defineDependency('second').value;
      }
    };

    class MySecondFeature extends Feature {
      constructor(playground) { super(playground); this.value = 42; }
    };

    let playground = new FakePlayground(),
        manager = playground.featureManager;
    
    manager.load({
      simple: MySimpleFeature,
      second: MySecondFeature
    });

    assert.equal(value, 42);
  });

  it('should throw on invalid dependencies', assert => {
    class MySimpleFeature extends Feature {
      constructor(playground) {
        super(playground);
        this.defineDependency('fakeFeature');
      }
    };

    let playground = new FakePlayground(),
        manager = playground.featureManager;

    assert.throws(() =>
        manager.load({ simple: MySimpleFeature }));
  });


  it('should throw on circular dependencies', assert => {
    class MySimpleFeature extends Feature {
      constructor(playground) {
        super(playground);
        this.defineDependency('second');
      }
    };

    class MySecondFeature extends Feature {
      constructor(playground) {
        super(playground);
        this.defineDependency('simple');
      }
    };

    let playground = new FakePlayground(),
        manager = playground.featureManager;

    assert.throws(() => {
      manager.load({
        simple: MySimpleFeature,
        second: MySecondFeature
      });
    });
  });
});
