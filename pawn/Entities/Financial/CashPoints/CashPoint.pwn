// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/// @todo Fix the class-instance-count parsing error in the PreCompiler and remove this hack.
#define CashPointCount CashPointController::MaximumNumberOfCashPoints

/**
 * A single cash-point holds the data and procedures required in order for the controller to
 * interact with it. This should be considered a private class owned by the CashPointController.
 *
 * @author Russell Krupke <russell@sa-mp.nl>
 */
class CashPoint <pointId (CashPointCount)> {
    // Resource Id of the dynamic map icon.
    new DynamicMapIcon: m_mapIconId;

    // Resource Id of the object for the point.
    new DynamicObject: m_objectId;

    /**
     * Initialize this cash-point with the data as supplied to the method. It will be created
     * immediately, also making sure that it's functional for players within the gamemode.
     *
     * @param positionX The x-coordinate of the position of the cash-point.
     * @param positionY The y-coordinate of the position of the cash-point.
     * @param positionZ The z-coordinate of the position of the cash-point.
     * @param rotation The rotation to apply to the cash-point.
     * @param interiorId The interior Id this cash-point belongs to.
     */
    public initialize(Float: positionX, Float: positionY, Float: positionZ, Float: rotation, interiorId) {
        m_mapIconId = CreateDynamicMapIcon(positionX, positionY, positionZ, 52, 0, 0, 0);
        m_objectId = CreateDynamicObject(2942, positionX, positionY, positionZ, 0, 0, rotation, -1, interiorId);
    }
}
