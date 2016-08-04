// Copyright 2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const Feature = require('components/feature_manager/feature.js');
const FeatureManager = require('components/feature_manager/feature_manager.js');

describe('FeatureManager', it => {
    it('initializes the features', assert => {
        let counter = 0;

        class MySimpleFeature extends Feature {
            constructor() { super(); counter += 1; }
        }

        class MySecondFeature extends Feature {
            constructor() { super(); counter += 10; }
        }

        server.featureManager.registerFeaturesForTests({
            simple: MySimpleFeature,
            second: MySecondFeature
        });

        server.featureManager.loadFeatures(['simple', 'second']);

        assert.equal(counter, 11);
    });

    it('should allow declaring dependencies', assert => {
        let value = 0;

        class MySimpleFeature extends Feature {
            constructor() {
                super();

                value = this.defineDependency('second').value;
            }
        }

        class MySecondFeature extends Feature {
            constructor() { super(); this.value = 42; }
        }

        server.featureManager.registerFeaturesForTests({
            simple: MySimpleFeature,
            second: MySecondFeature
        });

        server.featureManager.loadFeatures(['simple', 'second']);

        assert.equal(value, 42);
    });

    it('should throw on invalid dependencies', assert => {
        class MySimpleFeature extends Feature {
            constructor() {
                super();

                this.defineDependency('fakeFeature');
            }
        }

        server.featureManager.registerFeaturesForTests({ simple: MySimpleFeature });

        assert.throws(() =>
            server.featureManager.loadFeatures(['simple']));
    });

    it('should throw on circular dependencies', assert => {
        class MySimpleFeature extends Feature {
            constructor() {
                super();

                this.defineDependency('second');
            }
        }

        class MySecondFeature extends Feature {
            constructor() {
                super();

                this.defineDependency('simple');
            }
        }

        server.featureManager.registerFeaturesForTests({
            simple: MySimpleFeature,
            second: MySecondFeature
        });

        assert.throws(() =>
            server.featureManager.loadFeatures(['simple', 'second']));
    });

    it('should be able to hand out functional dependencies', assert => {
        let executed = false;

        class MySimpleFeature extends Feature {
            constructor() { super(); }
        }

        class MySecondFeature extends Feature {
            constructor() {
                super();

                const simple = this.defineDependency('simple', true /* isFunctional */);
                assert.equal(typeof simple, 'function');

                const instance = simple();
                assert.equal(typeof instance, 'object');

                assert.isTrue(instance instanceof MySimpleFeature);

                executed = true;
            }
        }

        server.featureManager.registerFeaturesForTests({
            simple: MySimpleFeature,
            second: MySecondFeature
        });

        server.featureManager.loadFeatures(['simple', 'second']);

        assert.isTrue(executed);
    });

    it('should be able to assess when features can be live reloaded', assert => {
        class MySimpleFeature extends Feature {
            constructor() { super(); }
        }

        server.featureManager.registerFeaturesForTests({
            simple: MySimpleFeature
        });

        // Features can be live reloaded if they haven't been loaded for the first time yet.
        assert.isTrue(server.featureManager.isEligibleForLiveReload('simple'));
        server.featureManager.loadFeature('simple');
        assert.isFalse(server.featureManager.isEligibleForLiveReload('simple'));
    });

});
