// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

#define M_PI 3.141592653

// Every how many updates should the drift status for a player be calculated? Given an |incar_rate|
// of 40 in "server.cfg", this roughly equates every ((1000/40)*|value|)ms, currently ~150ms
#define DRIFT_UPDATE_INTERVAL 6

new g_playerDriftUpdateCounter[MAX_PLAYERS];

// Calculates the vehicle's principal axes based on it's rotation quaternion, which allows us to
// determine the vehicle's orientation during a drift. Drifts on a flat plane are great, but they
// become a lot more interesting when exercised on e.g. a hill.
// https://en.wikipedia.org/wiki/Conversion_between_quaternions_and_Euler_angles
GetVehiclePrincipalAxes(vehicleId, &Float:pitch, &Float:roll, &Float:yaw) {
    new Float: w, Float: x, Float: y, Float: z;
    if (!GetVehicleRotationQuat(vehicleId, w, x, z, y))
        return 0;  // invalid |vehicleId|

    new Float: squaredW = w * w;
    new Float: squaredX = x * x;
    new Float: squaredY = y * y;
    new Float: squaredZ = z * z;

    new Float: normalized = squaredW + squaredX + squaredY + squaredZ;
    new Float: magnitude = x * y + z * w;

    if (magnitude >= 0.5 * normalized) {
        yaw = 2 * atan2(x, w);
        roll = M_PI / 2;
        pitch = 0;
    } else if (magnitude <= -0.5 * normalized) {
        yaw = -2 * atan2(x, w);
        roll = -M_PI / 2;
        pitch = 0;
    } else {
        yaw = atan2(2 * y * w - 2 * x * z, squaredX - squaredY - squaredZ + squaredW);
        roll = asin(2 * magnitude / normalized);
        pitch = -1 * atan2(2 * x * w - 2 * y * z, -squaredX + squaredY - squaredZ + squaredW);
    }

    return 1;
}

// Calculates the current drift angle and speed for the given |vehicleId|, which can be used to
// determine whether the driver is drifting. This is done by comparing the vehicle's velocity
// against its facing direction, and calculating the 2-argument arctangent between them.
GetVehicleDriftValues(vehicleId, &bool: backwards, &Float: driftAngle, &Float: driftSpeed) {
    new Float: vx, Float: vy, Float: vz, Float: facingDirection;
    if (!GetVehicleVelocity(vehicleId, vx, vy, vz))
        return 0;  // invalid |vehicleId|

    GetVehicleZAngle(vehicleId, facingDirection);

    // Calculate whether the vehicle is driving backwards based on its velocity and direction.
    backwards = (facingDirection < 90 && vx > 0 && vy < 0) ||
                (facingDirection >= 90 && facingDirection < 180 && vx > 0 && vy > 0) ||
                (facingDirection >= 180 && facingDirection < 270 && vx < 0 && vy > 0) ||
                (facingDirection >= 270 && vx < 0 && vy < 0);

    // Calculate the speed in ~km/h based from the velocity vector's magnitude, which is normalized.
    driftSpeed = floatsqroot(vx * vx + vy * vy + vz * vz) * 181.46;

    // Calculate the direction in which the vehicle is moving horizontally.
    new Float: velocityDirection = atan2(vy, vx);

    velocityDirection -= 90.0;
    if (velocityDirection < 0)
        velocityDirection += 360.0;

    // Calculate the actual drifting |angle|, and clamp the resulting angle within a sensible range,
    // taking away 90 to compensate for the calculations determining east-bound values. Then correct
    // for negative values, and store the absolute value.
    driftAngle = facingDirection - velocityDirection;

    if (driftAngle > 270.0)
        driftAngle -= 270.0;
    if (driftAngle < -270.0)
        driftAngle += 270.0;

    driftAngle = floatabs(driftAngle);
    return 1;
}

// Processes drift updates for the given |playerId|. Only works when they're in a vehicle, and only
// processed a certain ratio of player updates as this method is called a lot.
ProcessDriftUpdateForPlayer(playerId) {
    new const vehicleId = GetPlayerVehicleID(playerId);
    if (!vehicleId)
        return;  // the |playerId| is not currently in a vehicle

    if ((++g_playerDriftUpdateCounter[playerId] % DRIFT_UPDATE_INTERVAL) != 0)
        return;  // this tick will be ignored to decrease server load

    g_playerDriftUpdateCounter[playerId] = 0;

    new Float: pitch, Float: roll, Float: yaw;
    new Float: driftAngle, Float: driftSpeed;
    new bool: backwards;

    GetVehiclePrincipalAxes(vehicleId, pitch, roll, yaw);
    GetVehicleDriftValues(vehicleId, backwards, driftAngle, driftSpeed);

    printf("[%d] P:[%.f4] R:[%.4f] Y:[%.f4] A:[%.4f] S:[%.f4] B:[%d]",
        playerId, pitch, roll, yaw, driftAngle, driftSpeed, backwards ? 1 : 0);
}
