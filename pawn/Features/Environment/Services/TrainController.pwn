// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// How many trains will we have driving around Las Venturas Playground?
const NumberOfTrainDrivers = 3;

/**
 * Rather than referring to each train driver using a number, we'll refer to them with textual names
 * as defined in this enumeration. There will be three trains driving around Las Venturas Playground
 */
enum _: TrainDriverId {
    TrainDriverLasVenturas = 0,
    TrainDriverLosSantos = 1,
    TrainDriverSanFierro = 2
};

/**
 * The train controller owns the trains which run around Las Venturas Playground, and make sure that
 * they will be created with the right information attached to them.
 *
 * @author Russell Krupke <russell@sa-mp.nl>
 */
class TrainController {
    /**
     * Initializes the three trains by requesting them to be connected to the server. The trains
     * themselves have a feature which keeps them connected to the server, even if they time out or
     * accidentially get kicked by an administrator.
     */
    public __construct() {
        TrainDriver(TrainDriverLasVenturas)->initialize("TrainDriverLV", "train_lv", 1462.0745, 2630.8787, 10.8203);
        TrainDriver(TrainDriverLosSantos)->initialize("TrainDriverLS", "train_ls", -1942.7950, 168.4164, 27.0006);
        TrainDriver(TrainDriverSanFierro)->initialize("TrainDriverSF", "train_sf", 1700.7551, -1953.6531, 14.8756);
    }
};
