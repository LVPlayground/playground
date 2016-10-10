// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Private symbol ensuring that the AreaPolicy constructor won't be used.
const PrivateSymbol = Symbol('Please use the static methods.');

// An area policy defines what rules apply to certain locations in Las Venturas. For example, we
// apply stricter policies when players are in Las Venturas than when they're elsewhere.
class AreaPolicy {
    static getForPosition(position) {
        if (position.x > 1238 && position.x <= 2701 && position.y > 858 && position.y <= 2605)
            return LasVenturasPolicy;

        return SanAndreasPolicy;
    }

    // Constructor of the AreaPolicy class. Not to be used except by the static methods above.
    constructor(privateSymbol, policy) {
        if (privateSymbol !== PrivateSymbol)
            throw new TypeError('Illegal constructor. Use the static methods instead.');

        this.policy_ = policy;
    }

    // Gets whether time limits should be enforced for teleportation.
    get enforceTeleportationTimeLimit() { return this.policy_.enforceTeleportationTimeLimit; }

    // Gets whether firing your weapon should temporarily block the ability to teleport.
    get firingWeaponBlocksTeleporation() { return this.policy_.firingWeaponBlocksTeleporation; }

    // Gets whether issuing damage should temporarily block the ability to teleport.
    get issuingDamageBlocksTeleport() { return this.policy_.issuingDamageBlocksTeleport; }

    // Gets whether taking damage should temporarily block the ability to teleport.
    get takingDamageBlocksTeleport() { return this.policy_.takingDamageBlocksTeleport; }
}

// -------------------------------------------------------------------------------------------------

// Policy specific to the city of Las Venturas.
const LasVenturasPolicy = new AreaPolicy(PrivateSymbol, {
    enforceTeleportationTimeLimit: false,
    firingWeaponBlocksTeleporation: false,
    issuingDamageBlocksTeleport: true,
    takingDamageBlocksTeleport: true
});

// Policy that applies to all of San Andreas not covered by more specific policies.
const SanAndreasPolicy = new AreaPolicy(PrivateSymbol, {
    enforceTeleportationTimeLimit: false,
    firingWeaponBlocksTeleporation: false,
    issuingDamageBlocksTeleport: true,
    takingDamageBlocksTeleport: false
});

// -------------------------------------------------------------------------------------------------

exports = AreaPolicy;
