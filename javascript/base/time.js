// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// The Time module adds various utility methods to the global object for making timers look nicer
// when using asynchronous functions.

global.milliseconds = milliseconds => wait(milliseconds);
global.seconds = seconds => wait(seconds * 1000);
global.minutes = minutes => wait(minutes * 60 * 1000);
global.hours = hours => wait(hours * 60 * 60 * 1000);
