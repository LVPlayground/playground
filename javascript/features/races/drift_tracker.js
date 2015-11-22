// Copyright 2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Keeps track of the drift currently applying to a given vehicle, and is able to translate that to
// a certain number of points. All races will track drift points by default.
//
// TODO: Determine whether the vehicle is moving forwards or backwards.
// TODO: Calculate the current drifting angle of the vehicle based on the pitch ([0, 90]?)
// TODO: Calculate points to be awarded based on {direction, dritft angle, velocity}.
// TODO: Keep track of whether a vehicle is currently in drift.
// TODO: Integrate an increasing (exponential-like) multiplier for drift duration.
// TODO: Have an "ondrift" listener that gets called with a promise for each drift. The promise will
//       be resolved when the drift has ended. (Multiplier change = new drift.)
class DriftTracker {
  constructor(vehicle) {
    this.vehicle_ = vehicle;
  }

  // Called 10+ times per second to update the drift status of the |vehicle_|. Will calculate
  // whether the |vehicle_| is currently in a drift, and if so, award points accordingly.
  update(currentTime) {

  }
};

exports = DriftTracker;
