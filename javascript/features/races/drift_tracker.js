// Copyright 2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Keeps track of the drift currently applying to a given vehicle, and is able to translate that to
// a certain number of points. All races will track drift points by default.
//
// TODO: Calculate the current drifting angle of the vehicle based on the pitch ([0, 90]?)
// TODO: Calculate points to be awarded based on {direction, dritft angle, velocity}.
// TODO: Keep track of whether a vehicle is currently in drift.
// TODO: Integrate an increasing (exponential-like) multiplier for drift duration.
// TODO: Have an "ondrift" listener that gets called with a promise for each drift. The promise will
//       be resolved when the drift has ended. (Multiplier change = new drift.)
// TODO: Award extra points for drifting on an angular surface.
class DriftTracker {
  constructor(vehicle) {
    this.vehicle_ = vehicle;
  }

  // Called 10+ times per second to update the drift status of the |vehicle_|. Will calculate
  // whether the |vehicle_| is currently in a drift, and if so, award points accordingly.
  update(currentTime) {
    let [yaw, pitch, roll] = this.readPrincipalAxes();

    // TODO: Determine where the momentum is headed based on the vehicle's velocity, and use it to
    //       decide whether the vehicle is currently drifting.
    // TODO: Determine whether the vehicle is moving forwards or backwards.
  }

  // Calculates the three principal axes for the vehicle: yaw (normal), pitch (lateral) and roll
  // (longitudal) of the current vehicle in degrees corrected for the horizontally inverted cardinal
  // directions in Grand Theft Auto: San Andreas, as well as having the pitch and the roll swapped.
  readPrincipalAxes() {
    // NOTE: These parameters are deliberately listed in the wrong order.
    let [yaw, roll, pitch] = DriftTracker.quaternionToTaitBryan(...this.vehicle_.rotationQuat);

    // The multiplication factor for converting radian values to degrees.
    const radianToDegreeMultiplicationFactor = 180 / Math.PI;

    // Return the {yaw, pitch, roll} in degrees. Only the yaw will be capped to [0, 360] accounting
    // for the inverted cardinal directions in the game.
    return [ DriftTracker.invertGameAngle(yaw * radianToDegreeMultiplicationFactor),
             -1 * pitch * radianToDegreeMultiplicationFactor,
             -1 * roll * radianToDegreeMultiplicationFactor ];
  }

  // Calculates the three principal axes for the vehicle: yaw (normal), pitch (lateral) and roll
  // (longitudal) for the given quaternion {w, x, y, z} in radians. This implementation is aware of
  // and accounts for singularities in the represented orientation.
  static quaternionToTaitBryan(w, x, y, z) {
    let yaw = 0, pitch = 0, roll = 0;

    // Determine whether the quaternion {w, x, y, z} has a singularity, that is, when the the
    // orientation can be fully defined without having to use the |roll| value.
    const singularityValue = x * y + z * w,
          singularity = Math.abs(Math.abs(singularityValue) - 0.5) < 0.001;

    // Since an arctangent over {0, 0} is not useful and the orientation can be stored without using
    // the |roll| in case of a singularity, optimize by calculating the yaw over |x| and |w|.
    if (singularity) {
      yaw = (singularityValue > 0 ? 2 : -2) * Math.atan2(x, w);
      pitch = Math.asin(2 * singularityValue);
      roll = 0;
    } else {
      yaw = Math.atan2(2 * (y * w - x * z), 1 - 2 * (y * y) - 2 * (z * z));
      pitch = Math.asin(2 * singularityValue);
      roll = Math.atan2(2 * (x * w - y * z), 1 - 2 * (x * x) - 2 * (z * z));
    }

    return [yaw, pitch, roll];
  }

  // The angles representing east and west in Grand Theft Auto: San Andreas are inverted (i.e. west
  // maps to an angle of 90 degrees). Apply |360 - a| % 360 over the angle |a| to compensate.
  static invertGameAngle(angle) {
    return Math.abs(360 - angle) % 360;
  }
};

export default DriftTracker;
