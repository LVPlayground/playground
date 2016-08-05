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

        class MySimpleFeature extends Feature {}
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
        class MyDependencyLessFeature extends Feature {}

        class MyFeatureWithReferenceDependencies extends Feature {
            constructor() {
                super();

                this.defineDependency('dependents_references');
            }
        }

        class MyFeatureWithFunctionalDependencies extends Feature {
            constructor() {
                super();

                this.defineDependency('dependents_functional', true /* isFunctional */);
            }
        }

        class MyReferenceDependency extends Feature {}
        class MyFunctionalDependency extends Feature {}

        server.featureManager.registerFeaturesForTests({
            dependencies_none: MyDependencyLessFeature,
            dependencies_references: MyFeatureWithReferenceDependencies,
            dependencies_functional: MyFeatureWithFunctionalDependencies,

            dependents_references: MyReferenceDependency,
            dependents_functional: MyFunctionalDependency
        });

        server.featureManager.loadFeature('dependencies_none');

        // Features without dependencies can always be live reloaded.
        assert.isTrue(server.featureManager.isEligibleForLiveReload('dependencies_none'));

        // Features can be live reloaded if they haven't been loaded for the first time yet.
        assert.isTrue(server.featureManager.isEligibleForLiveReload('dependencies_references'));
        assert.isTrue(server.featureManager.isEligibleForLiveReload('dependents_references'));

        server.featureManager.loadFeature('dependencies_references');

        // Features cannot be live reloaded when they have reference-based dependen{ts,sies}.
        assert.isFalse(server.featureManager.isEligibleForLiveReload('dependencies_references'));
        assert.isFalse(server.featureManager.isEligibleForLiveReload('dependents_references'));

        server.featureManager.loadFeature('dependents_functional');

        assert.isTrue(server.featureManager.isEligibleForLiveReload('dependents_functional'));

        server.featureManager.loadFeature('dependencies_functional');

        // Features can be live reloaded if they only have functional dependen{ts,sies}.
        assert.isTrue(server.featureManager.isEligibleForLiveReload('dependencies_functional'));
        assert.isTrue(server.featureManager.isEligibleForLiveReload('dependents_functional'));
    });

    it('should be able to live reload features', assert => {
        let constructorCounter = 0;
        let disposeCounter = 0;

        class MyCounter extends Feature {
            constructor() {
                super();

                this.counter_ = 0;

                constructorCounter++;
            }

            count() { return ++this.counter_; }

            dispose() {
                disposeCounter++;
            }
        }

        class MyFeature extends Feature {
            constructor() {
                super();

                this.counterFn_ = this.defineDependency('counter', true /* isFunctional */);
            }

            count() {
                return this.counterFn_().count();
            }
        }

        server.featureManager.registerFeaturesForTests({
            counter: MyCounter,
            feature: MyFeature
        });

        server.featureManager.loadFeatures(['counter', 'feature']);

        assert.isTrue(server.featureManager.isEligibleForLiveReload('counter'));

        assert.equal(constructorCounter, 1);
        assert.equal(disposeCounter, 0);

        const feature = server.featureManager.getFeatureForTests('feature');

        assert.equal(feature.count(), 1);
        assert.equal(feature.count(), 2);
        assert.equal(feature.count(), 3);

        assert.isTrue(server.featureManager.liveReload('counter'));

        assert.equal(constructorCounter, 2);
        assert.equal(disposeCounter, 1);

        assert.equal(feature.count(), 1);
        assert.equal(feature.count(), 2);
        assert.equal(feature.count(), 3);
    });
});
