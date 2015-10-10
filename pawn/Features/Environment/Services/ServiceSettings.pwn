// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

// How many trains will we have driving around Las Venturas Playground?
const NumberOfTrainDrivers = 3;

// How many planes will we have flying around San Andreas?
const NumberOfPlanePilots = 3;

/**
 * Rather than referring to each service instance using a number, we'll refer to them with textual
 * names as defined in this enumeration. Numbers may be re-used for several services.
 */
enum _: ServiceDescription {
    // Which trains will be driving around San Andreas?
    TrainDriverLasVenturas = 0,
    TrainDriverLosSantos = 1,
    TrainDriverSanFierro = 2,

    // Which planes will we have flying around San Andreas?
    PlanePilotLasVenturas = 0,
    PlanePilotLosSantos = 1,
    PlanePilotSanFierro = 2
};
