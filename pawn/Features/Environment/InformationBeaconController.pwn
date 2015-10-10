// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/**
 * It is essential to inform new- and old players about key components in the online world of GTA.
 * The difficulty here is to not spam the main chat with a big pile of text, but to keep things
 * compact and minimalistic. That's why we've chosen to use so called information beacons to enhance
 * the online player experience, icons around GTA which are pickup-able and will show some important
 * information upon activation.
 *
 * @author Max "Cake" Blokker <cake@sa-mp.nl>
 */
class InformationBeaconController {
    // In which file have the beacon locations and text been stored?
    const BeaconDataFile = "data/information_beacons.json";

    // We are a category of pickups and thus need to have our own Id with the pickup controller.
    public const BeaconHandlerId = @counter(PickupHandler);

    // How many beacons are there?
    const MaximumAmountOfBeacons = 1;

    // bla
    new m_beaconIconId[MaximumAmountOfBeacons];

    // The titles of the beacons, which will float above the beacon.
    new m_beaconTitle[MaximumAmountOfBeacons][24];

    // A list of coordinates at which the beacons are positioned at.
    new Float: m_beaconPosition[MaximumAmountOfBeacons][3];

    // The help text of the beacons, which will be displayed when a beacon is entered.
    new m_beaconHelpText[MaximumAmountOfBeacons][254];

    // How many beacons have been registered with the gamemode?
    new m_beaconCount = 0;

    /**
     * bla
     */
    public __construct() {
        new Node: beaconRootNode = JSON->parse(BeaconDataFile);
        if (beaconRootNode == JSON::InvalidNode) {
            printf("[InformationBeaconController] ERROR: Unable to load the information-beacon data.");
            return;
        }

        new Node: beaconPositionList = JSON->find(beaconRootNode, "beacons");
        if (beaconPositionList == JSON::InvalidNode || JSON->getType(beaconPositionList) != JSONArray) {
            printf("   ERROR: Unable to read the beacons coordinates list.");
            return;
        }

        m_beaconCount = 0;
        for (new Node: currentBeacon = JSON->firstChild(beaconPositionList); currentBeacon != JSON::InvalidNode; currentBeacon = JSON->next(currentBeacon)) {
            if (m_beaconCount >= MaximumAmountOfBeacons)
                break;

            this->addBeacon(m_beaconCount++, currentBeacon);
        }

        if (m_beaconCount == 0)
            printf("[InformationBeaconController] ERROR: Could not load any beacons.");

        JSON->close();
    }

    /**
     * bla
     *
     * @param weaponNode JSON node to the Information beacon details array.
     */
    private addBeacon(beaconId, Node: beaconNode) {
        // Title
        new Node: beaconTitle = JSON->find(beaconNode, "title");
        if (beaconTitle == JSON::InvalidNode || JSON->getType(beaconTitle) != JSONString)
            return;

        JSON->readString(beaconTitle, m_beaconTitle[beaconId], 24);

        // Coordinates
        new Node: beaconLocation = JSON->find(beaconNode, "location"),
            Node: beaconLocationSetting = JSON->firstChild(beaconLocation);
        if (beaconLocationSetting == JSON::InvalidNode || JSON->getType(beaconLocationSetting) != JSONFloat)
            return;

        JSON->readFloat(beaconLocationSetting, m_beaconPosition[beaconId][0]); // Coordinate X
        beaconLocationSetting = JSON->next(beaconLocationSetting);

        JSON->readFloat(beaconLocationSetting, m_beaconPosition[beaconId][1]); // Coordinate Y
        beaconLocationSetting = JSON->next(beaconLocationSetting);

        JSON->readFloat(beaconLocationSetting, m_beaconPosition[beaconId][2]); // Coordinate Z

        // Text
        new Node: beaconText = JSON->find(beaconNode, "text");
        if (beaconText == JSON::InvalidNode || JSON->getType(beaconText) != JSONString)
            return;

        JSON->readString(beaconText, m_beaconHelpText[beaconId], 254);

        m_beaconIconId[beaconId] = PickupController->createPickup(InformationBeaconController::BeaconHandlerId,
           InformationBeaconPickupId, PersistentPickupType, m_beaconPosition[beaconId][0],
            m_beaconPosition[beaconId][1], m_beaconPosition[beaconId][2], -1);
    }
};
