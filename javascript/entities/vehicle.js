// Copyright 2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

let Extendable = require('base/extendable.js'),
    Vector = require('base/vector.js');

class Vehicle extends Extendable {
  constructor(options) {
    super();

    this.id_ = 0;
    this.interior_ = 0;
    this.modelId_ = 0;

    if (typeof options === 'number') {
      // Initialize the vehicle with |options| being the vehicle's Id.
      this.id_ = options;
      this.modelId_ = pawnInvoke('GetVehicleModel', 'i', options);

      if (this.modelId_ === 0)
        throw new Error('There is no vehicle with Id ' + options + '.');

    } else if (typeof options === 'object') {
      // Creates a new vehicle based on the options defined in |options|.
      let modelId = options.modelId || 411;
      let position = options.position || new Vector(0, 0, 0);
      let rotation = options.rotation || 0;
      let colors = options.colors || [-1, -1];

      this.modelId_ = modelId;
      this.id_ = pawnInvoke('CreateVehicle', 'iffffiiii', modelId, position.x, position.y, position.z,
                            rotation, colors[0], colors[1], -1 /* respawn_delay */, 0 /* addsiren */);
      
      if (this.id_ == Vehicle.INVALID_ID)
        throw new Error('The vehicle could not be created on the SA-MP server.');
    }
  }

  // Returns the id by which this vehicle is identified in the SA-MP server.
  get id() { return this.id_; }

  // Disposes of the vehicle, and removes it from the world entirely.
  dispose() {
    pawnInvoke('DestroyVehicle', 'i', this.id_);
  }

  // Gets or sets the virtual world in which this vehicle resides.
  get virtualWorld() { return pawnInvoke('GetVehicleVirtualWorld', 'i', this.id_); }
  set virtualWorld(value) { pawnInvoke('SetVehicleVirtualWorld', 'ii', this.id_, value); }

  // Gets or sets the interior in which this vehicle resides. Vehicles will be invisible to players
  // (but might still influence colission) if they are in the wrong interior.
  get interior() { return this.interior_; }
  set interior(value) {
    if (this.interior_ == value)
      return;

    pawnInvoke('LinkVehicleToInterior', 'ii', this.id_, value);
    this.interior_ = value;
  }

  // Gets or sets the health of the vehicle. This is a floating point number generally between a
  // zero (exploded) and a thousand (in perfect condition). Does not reflect the damage state of
  // the vehicle, which has to be maintained separately.
  get health() { return pawnInvoke('GetVehicleHealth', 'iF', this.id_); }
  set health(value) { pawnInvoke('SetVehicleHealth', 'ii', this.id_, value); }

  // Gets or sets the facing angle (among the Z-axis) of the vehicle.
  get angle() { return pawnInvoke('GetVehicleZAngle', 'iF', this.id_); }
  set angle(value) { pawnInvoke('SetVehicleZAngle', 'if', this.id_, value); }

  // Gets the rotation of the vehicle as a quaternion. The order of the quaternion returned by the
  // San Andreas: Multiplayer server is incorrect - it gives us {w, x, z, y}. Compensate for this.
  get rotationQuat() {
    let quat = pawnInvoke('GetVehicleRotationQuat', 'iFFFF', this.id_);
    return [quat[0], quat[1], quat[3], quat[2]];
  }

  // Gets or sets the velocity of the vehicle. These must be instances of the Vector class.
  get velocity() { return new Vector(...pawnInvoke('GetVehicleVelocity', 'iFFF', this.id_)); }
  set velocity(value) { pawnInvoke('SetVehicleVelocity', 'ifff', this.id_, value.x, value.y, value.z); }

  // Repairs the vehicle. This sets the health of the vehicle to its maximum, and reset and visual
  // damage that may have been done to the vehicle since the last repair.
  repair() { pawnInvoke('RepairVehicle', 'i', this.id_); }

  // Adds |componentId| to this vehicle. No verification will be done on whether the component is
  // valid for this vehicle. Components can be added multiple times.
  addComponent(componentId) {
    pawnInvoke('AddVehicleComponent', 'ii', this.id_, componentId);
  }
};

// The Id that is used to represent invalid vehicles.
Vehicle.INVALID_ID = 65535;

// Commonly used components that can be added to vehicles, e.g. NOS.
Vehicle.COMPONENT_NOS_SINGLE_SHOT = 1009;
Vehicle.COMPONENT_NOS_FIVE_SHOTS = 1008;
Vehicle.COMPONENT_NOS_TEN_SHOTS = 1010;

// Expose the Vehicle object globally since it will be commonly used.
global.Vehicle = Vehicle;

exports = Vehicle;
