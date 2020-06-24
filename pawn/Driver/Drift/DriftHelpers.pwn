// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

#define M_PI 3.141592653

// Every how many updates should the drift status for a player be calculated? Given an |incar_rate|
// of 40 in "server.cfg", this roughly equates every ((1000/40)*|value|)ms, currently ~100ms
#define DRIFT_UPDATE_INTERVAL 4

new g_playerDriftUpdateCounter[MAX_PLAYERS];

new Float: g_playerDriftPoints[MAX_PLAYERS];
new Float: g_playerDriftPosition[MAX_PLAYERS][3];
new Float: g_playerDriftStartHealth[MAX_PLAYERS];
new g_playerDriftStartTime[MAX_PLAYERS] = { 0, ... };
new g_playerDriftUpdateTime[MAX_PLAYERS] = { 0, ... };

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

// Calculates the expiration time of a drift, in milliseconds. The |timeDifference| details the
// number of milliseconds since their last drift, and the |driftDuration| details the time in
// milliseconds since the player started their drift.
//
// When starting a drift, the maximum time out of a drift is .8 seconds. As the drift goes on, this
// allotted time will decrease by 100ms for each 1.5s the drift lasts, down to 300ms at most. This
// means that it will become increasingly hard to maintain the drift.
CalculateDriftExpiration(driftDuration) {
    new multiplier = driftDuration >= 6000 ? 5 : ((driftDuration / 1500) + 1);  // [0-5]
    return 800 - multiplier * 100;
}

// Calculates the amount of drifting points to award as a bonus, given the vehicle's |pitch|, |roll|
// and |yaw| values, each of which make for harder circumstances to maintain a drift.
Float: CalculateDriftBonus(timeDifference, Float: pitch, Float: roll, Float: yaw) {
    return 0.0;
    #pragma unused timeDifference, pitch, roll, yaw
}

// Calculates the amount of drifting points to award for a drift at the given |driftSpeed| and the
// |driftAngle|, which took place in the given |timeDifference| in milliseconds.
//
// For this function we've chosen the formula |driftSpeed| * |driftAngle| ^ 0.4, which, using normal
// parameters, will yield a number of points in range of [143.5, 759.49] based on complexity of the
// drift. In the future we might want to factor in continuous drifting as well.
Float: CalculateDriftPoints(timeDifference, Float: driftSpeed, Float: driftAngle) {
    return floatmul(driftSpeed, floatpower(driftAngle, 0.4));
    #pragma unused timeDifference
}

// Calculates the drift score for the current drift that the given |playerId| is engaged in. This
// takes the duration of their drift, the amount of points awarded, and a multiplier thereof.
//
// Right now we divide the total amount of drift points (~1.5k - 7.5k per second) with a configured
// divider, to make a more sensible value out of it. Ideally drift scores would cap around 20k for
// most people, Luce and Lithirm excluded.
CalculateDriftScore(playerId) {
    new const Float: score = floatdiv(g_playerDriftPoints[playerId], g_driftPointDivider);
    return floatround(score);
}

// Processes the end of a drift, calls the appropriate functions and resets state.
ProcessDriftEnd(playerId, currentTime, bool: successful) {
    new const duration = currentTime - g_playerDriftStartTime[playerId];
    OnDriftFinished(playerId, duration, CalculateDriftScore(playerId), successful);

    g_playerDriftPoints[playerId] = 0;
    g_playerDriftStartTime[playerId] = 0;
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

    // Flag to determine whether the |playerId| is currently drifting. It's fine to briefly slip out
    // of a drift whilst drifting, e.g. when throwing over one's steering wheel.
    new const bool: isDrifting =
        driftSpeed >= g_driftingMinSpeed &&
        driftAngle >= g_driftingMinAngle && driftAngle <= g_driftingMaxAngle &&
        !backwards;

    // If the player wasn't drifting, and isn't currently drifting, just bail out.
    if (g_playerDriftStartTime[playerId] == 0 && !isDrifting)
        return;

    new const currentTime = GetTickCount();
    new Float: vehicleHealth;

    GetVehicleHealth(vehicleId, vehicleHealth);

    // (1) If the player is drifting, but the vehicle's health decreased, we nullify the attempt.
    if (g_playerDriftStartTime[playerId] > 0 && g_playerDriftStartHealth[playerId]> vehicleHealth) {
        ProcessDriftEnd(playerId, currentTime, /* successful= */ false);
        return;
    }

    // (1) The player is currently drifting, and was drifting during the previous tick as well.
    if (g_playerDriftStartTime[playerId] > 0 && isDrifting) {
        new const difference = currentTime - g_playerDriftUpdateTime[playerId];
        new const Float: distance = GetVehicleDistanceFromPoint(
            vehicleId, g_playerDriftPosition[playerId][0], g_playerDriftPosition[playerId][1],
            g_playerDriftPosition[playerId][2]);

        // If the maximum distance for a single-tick update has been exceeded, we abort the drift as
        // they might have teleported. No score is awarded for that.
        if (distance > g_driftingMaxDistance) {
            ProcessDriftEnd(playerId, currentTime, /* successful= */ false);
            return;
        }

        g_playerDriftUpdateTime[playerId] = currentTime;
        g_playerDriftPoints[playerId] +=
            CalculateDriftBonus(difference, pitch, roll, yaw) +
            CalculateDriftPoints(difference, driftSpeed, driftAngle);

        OnDriftUpdate(playerId, CalculateDriftScore(playerId));

    } else if (g_playerDriftStartTime[playerId] == 0 && isDrifting) {
        // (2) The player is currently drifting, but wasn't yet drifting during their previous tick.
        g_playerDriftPoints[playerId] = 0;
        g_playerDriftStartHealth[playerId] = vehicleHealth;
        g_playerDriftStartTime[playerId] = currentTime;
        g_playerDriftUpdateTime[playerId] = currentTime;

        OnDriftStart(playerId);

    } else {
        // (3) The player is currently in a drift, but missed the thresholds for this tick.
        new const difference = currentTime - g_playerDriftUpdateTime[playerId];
        new const duration = currentTime - g_playerDriftStartTime[playerId];

        // If the |difference| is larger than the expiration we'd award for this moment in the drift
        // then we'll mark the drift as having finished.
        if (difference > CalculateDriftExpiration(duration))
            ProcessDriftEnd(playerId, currentTime, /* successful= */ true);
    }

    // Store the position so that we can calculate the moved drift distance during the next tick.
    GetVehiclePos(
        vehicleId, g_playerDriftPosition[playerId][0], g_playerDriftPosition[playerId][1],
        g_playerDriftPosition[playerId][2]);
}

// Called when a drift has started for the |playerId|.
OnDriftStart(playerId) {
    printf("[%d] Drift started", playerId);
}

// Called when a drift has been updated for the given |playerId|, now at the given |score|.
OnDriftUpdate(playerId, score) {
    printf("[%d] Drift: %d", playerId, score);
}

// Called when a drift has finished for the |player|.
OnDriftFinished(playerId, duration, score, bool: successful) {
    printf("[%d] Drift finished (%dms): %d", playerId, duration, score);
}
