// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Signals for the `Instrumentation.recordSignal()` method. Each is defined with a unique ID and a
// name & description, for easier presentation. It's important that, when changing signals, you
// do not (ever!) reuse a previously used ID, as the old data will still exist.

// NEXT ID: 8

// -------------------------------------------------------------------------------------------------
// Section: Account signals
// -------------------------------------------------------------------------------------------------

export const kAccountNameChange = {
    id: 1,
    name: '[Account] Nickname change',
    description: 'Recorded when a player changes their nickname using /account.',
};

export const kAccountPasswordChange = {
    id: 2,
    name: '[Account] Password change',
    description: 'Recorded when a player changes their password using /account.',
};

export const kAccountAliasCreated = {
    id: 3,
    name: '[Account] Alias created',
    description: 'Recorded when a player creates an alias using /account.',
};

export const kAccountAliasDeleted = {
    id: 4,
    name: '[Account] Alias deleted',
    description: 'Recorded when a player deletes an alias using /account.',
};

export const kAccountViewInformation = {
    id: 5,
    name: '[Account] View information',
    description: 'Recorded when a player views account information using /account.',
};

export const kAccountViewRecord = {
    id: 6,
    name: '[Account] View record',
    description: 'Recorded when a player views account information using /account.',
};

export const kAccountViewSessions = {
    id: 7,
    name: '[Account] View sessions',
    description: 'Recorded when a player views their session history using /account.',
};

// -------------------------------------------------------------------------------------------------
