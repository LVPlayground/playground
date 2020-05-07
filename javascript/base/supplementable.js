// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Supplementable & Supplement
//
// Las Venturas Playground has quite strict layering in its architecture. This means that entities,
// like Player and Vehicle, are not able to access features, such as player accounts and vehicle
// management. Features can depend on each other, but sometimes that's overkill for having the
// ability to access a single piece of data.
//
// When such data is strongly associated with a particular class, they will be able to Supplement
// it. Imagine the player's account: many features will want to access account data, and will want
// the ability to amend that data. Having everything depend on the Account feature is not feasible.
//
// To that end, we've introduced Supplements. This enables the Account feature to define an
// "account" supplement on the Player object, which is accessible throughout the code:
//
// [Account feature]
//     Player.provideSupplement('account', PlayerAccountSupplement, ...);
//
// [Finance feature]
//     if (gunther.account)
//         gunther.account.currentDebt = 12500;
//
// When the Finance feature uses this, a player-specific instance of the PlayerAccountSupplement
// will be created on first access. This same instance will continue to be used for the lifetime
// of the supplemented object. (In this case, the Player, tied to their playing session.) It
// will have its constructor invoked with the following arguments:
//
// [Account feature]
//     class PlayerAccountSupplement {
//         constructor(player, ...) {}
//
//         get currentDebt() { /* code */ }
//         set currentDebt(debt) { /* code */ }
//     }
//
// All extra arguments passed to the `provideSupplement` call will be included when constructing a
// new instance of the supplement. This is useful to provide access to e.g. the database or
// manager of the feature that's providing the supplement.
//
// After construction, the `currentDebt` setter will be invoked on the new instance. The supplement
// is now free to do as it pleases. Methods may be provided and called this way too.
//
// It is important to note that supplements will return NULL when they haven't been provided yet,
// or are temporarily unavailable, for example because the feature providing the supplement is
// being reloaded. Features should continue to define dependencies on the features that provide
// the supplements they depend on. In this case, that means that the Finance feature should
// define a dependency on the Account feature, even if the public API is not otherwise used.
//
// Supplements should only be used for data that is:
//     (a) strongly associated with the Supplementable and its state, and,
//     (b) required frequently throughout various features, making explicit dependencies with an
//         exported API on the `Feature` instance untenable or otherwise undesirable.
//
// Examples of good supplements:
//     (1) Player.account, provided by the Account feature,
//     (2) Player.achievements, provided by the Achievement feature,
//     (3) Player.settings, providing configurable settings for each person on the server.
//
// Examples of bad supplements:
//     (1) Player.raceMetrics, provided by the Races feature and only used therein,
//     (2) Pickup.statistics, provided by the HousePickups feature, but only applicable to a small
//                            portion of pickups that exist on the server.
//
// Please be wary when adding a new supplement.

// Base class for any supplement that provides functionality to a Supplementable.
export class Supplement {}

// Base class for any type that wishes to be supplementable.
export class Supplementable {
    static provideSupplement(accessorName, supplementConstructor, ...constructorArgs) {
        if (this.name === Supplementable.name)
            throw new Error('provideSupplement() must be called on the supplementable type');
        
        if (supplementConstructor !== null && this.prototype.hasOwnProperty(accessorName))
            throw new Error(`${this.name}.${accessorName} has already been defined.`);

        if (supplementConstructor !== null && !Supplement.isPrototypeOf(supplementConstructor))
            throw new Error(`The instance for ${this.name}.${accessorName} must be a supplement.`);
        
        if (!supplementConstructor) {
            delete this.prototype[accessorName];
        } else {
            const supplementInstanceCache = new WeakMap();

            Object.defineProperty(this.prototype, accessorName, {
                configurable: true,
                enumerable: true,
                get: function() {
                    let supplementInstance = supplementInstanceCache.get(this);
                    if (!supplementInstance) {
                        supplementInstance = new supplementConstructor(this, ...constructorArgs);
                        supplementInstanceCache.set(this, supplementInstance);
                    }

                    return supplementInstance;
                }
            });
        }
    }
}
