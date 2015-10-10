// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

// How many cells do we need to store all handler Ids for pickups? We allow one byte per handler Id.
const PickupHandlerMapSizeInCells = MAX_PICKUPS / 4;

// How many cells do we need to store all the extra Ids? We allow two bytes per extra Id.
const PickupExtraMapSizeInCells = MAX_PICKUPS / 2;

/**
 * The Pickup Controller provides a convenient and fast way for features to register any pickup they
 * own, without having to iterate through all their owned pickups to find whether it's included.
 * This provides a serious performance improvement to the OnPlayerPickUpPickup handling, while also
 * normalizing the re-entry behavior San Andreas: Multiplayer forces upon us.
 *
 * @author Russell Krupke <russell@sa-mp.nl>
 */
class PickupController {
    // We need to be able to identify invalid pickups. This must always be Id 0.
    public const InvalidPickupHandlerId = @counter(PickupHandler);

    // The value of an invalid Pickup Id. This matches SA-MP's CreatePickup() return value.
    public const InvalidId = -1;

    // We use a single byte to store each handler Id, so there is a maximum value we can support
    // without overflowing the bytes next to it.
    const MaximumHandlerId = 255;

    // San Andreas: Multiplayer sends us notifications about a player standing in a pickup roughly
    // every second. If we haven't received an update for this number of milliseconds, we'll assume
    // that they have left the pickup, and fire the OnPlayerLeavePickup callback.
    const PickupNotificationExpirationTime = 3000;

    // A map for storing the handler of each pickup. We make use of the fact that each cell in Pawn
    // has four bytes, whereas we'll only use one byte to store the pickup handler Id.
    new m_pickupHandler[PickupHandlerMapSizeInCells];

    // A map for storing the extra Ids for each pickup. We make use of the fact that each cell in Pawn
    // has four bytes, whereas we'll only use two byte to store the pickup extra Id.
    new m_pickupExtra[PickupExtraMapSizeInCells];

    // A map for keeping track which player is currently standing in which pickup.
    new m_currentPickupForPlayer[MAX_PLAYERS];

    // A map for keeping track of when that player entered a certain pickup. We need this in order
    // to combat the continious stream of OnPlayerPickUpPickup events SA-MP is emitting.
    new m_currentLatestUpdateForPlayer[MAX_PLAYERS];

    /**
     * We need to verify that the invalid pickup Id in fact received Id 0. This may seem like an odd
     * check as we can just set it to zero, but it enforces that there are no uses of the Pickup
     * Handler counter before this class has been included in the gamemode.
     */
    public __construct() {
        if (PickupController::InvalidPickupHandlerId != 0) {
            printf("[Pickup Controller] ERROR: PickupController::InvalidPickupId does not equal 0, " ...
                "which means that many pickups will be broken.");
        }
    }

    /**
     * We need to reset a player's pickup state when they connect to the server, otherwise it may
     * be possible that void OnPlayerLeavePickup notices get distributed to listeners.
     *
     * @param playerId Id of the player who just connected to LVP.
     */
    @list(OnPlayerConnect)
    public onPlayerConnect(playerId) {
        m_currentPickupForPlayer[playerId] = PickupController::InvalidId;
        m_currentLatestUpdateForPlayer[playerId] = 0;
    }

    /**
     * Returns the set handler Id for a given pickup Id.
     *
     * @param pickupId Id of the pickup which you'd like to know the handler Id for.
     * @return integer Id of the handler who is responsible for this pickup.
     */
    private handlerForPickup(pickupId) {
        return Cell->getByteValue(m_pickupHandler[Math->floor(pickupId / 4)], pickupId % 4);
    }

    /**
     * Each pickup can have an extra Id to help features route pickups to specific instances of
     * whatever they are doing. This method is a helper for finding that value.
     *
     * @param pickupId Id of the pickup which you'd like to know the extra Id for.
     * @return integer Id unique to the feature of this property, for tracking.
     */
    private extraForPickup(pickupId) {
        return Cell->getShortValue(m_pickupExtra[Math->floor(pickupId / 2)], pickupId % 2);
    }

    /**
     * Updates the handler Id which is associated with a certain pickup Id.
     *
     * @param pickupId Id of the pickup for which the handler Id should be updated.
     * @param handlerId Id of the handler which should now own this pickup.
     * @param extraId Additional handler-specific Id allowing them to route this pickup.
     */
    private setHandlerForPickup(pickupId, handlerId, extraId) {
        Cell->setByteValue(m_pickupHandler[(pickupId / 4)], pickupId % 4, handlerId);
        Cell->setShortValue(m_pickupExtra[(pickupId / 2)], pickupId % 2, extraId);
    }

    /**
     * Creates a new pickup in San Andreas associated with the given handler Id. The rest of the
     * used to identify what the pickups appearance, behavior and position should be.
     *
     * @param handlerId Id of the handler which owns this pickup.
     * @param modelId Model Id of the model to spawn. Rather than passing an integer, consider
     *     adding your model to the PickupModelId enumeration.
     * @param type Type of pickup which defines the pickup's behavior.
     * @param positionX X-coordinate of the spawn position of the pickup.
     * @param positionY Y-coordinate of the spawn position of the pickup.
     * @param positionZ Z-coordinate of the spawn position of the pickup.
     * @param virtualWorld Virtual World in which the pickup should be spawned. The value -1 can be
     *     used to indicate that the pickup should be visible in all worlds.
     * @param extraId Additional handler-specific Id allowing them to route this pickup. The
     *     extra Id needs to be in the range of [0, 65535] in order to work correctly.
     * @return pickupId Id of the pickup which has been created, or PickupController::InvalidId.
     */
    public createPickup(handlerId, modelId, PickupType: type, Float: positionX, Float: positionY, Float: positionZ, virtualWorld, extraId = 0) {
        if (handlerId < 0 || handlerId > MaximumHandlerId)
            return PickupController::InvalidId; // handler Id is out of range [0, 255].

        new pickupId = CreatePickup(modelId, _: type, positionX, positionY, positionZ, virtualWorld);
        if (pickupId == PickupController::InvalidId || pickupId >= MAX_PICKUPS)
            return PickupController::InvalidId; // could not create a pick-up within the server.

        this->setHandlerForPickup(pickupId, handlerId, extraId);
        return pickupId;
    }

    /**
     * Destroys a pickup and removes it from the world completely. The OnPlayerLeavePickup switch
     * list will be invoked automatically if any handler has been associated with the pickup.
     *
     * @param handlerId Id of the handler who owns this pickup, for verification.
     * @param pickupId Id of the pickup which should be removed from the world.
     */
    public destroyPickup(handlerId, pickupId) {
        if (pickupId < 0 || pickupId >= MAX_PICKUPS)
            return; // invalid pickupId supplied, we won't be able to verify the handler.

        if (this->handlerForPickup(pickupId) != handlerId)
            return; // invalid handlerId supplied, the owner check failed.

        this->setHandlerForPickup(pickupId, PickupController::InvalidPickupHandlerId, 0);
        DestroyPickup(pickupId);
    }

    /**
     * Returns the pickup Id this player is currently standing in. This works regardless of whether
     * the pickup belongs to a handler or not.
     *
     * @param playerId Id of the player to retrieve the pickup Id for.
     */
    public inline currentPickupIdForPlayer(playerId) {
        return m_currentPickupForPlayer[playerId];
    }

    /**
     * Run through the online players every second to see if they're currently standing at a pickup,
     * and if so, the last update was longer than a certain threshold ago. This allows us to send
     * the OnPlayerLeavePickup callbacks much more accurately.
     */
    @list(SecondTimer)
    public onSecondTimerTick() {
        new earliestValidTime = Time->highResolution() - PickupNotificationExpirationTime;
        for (new playerId = 0; playerId <= PlayerManager->highestPlayerId(); ++playerId) {
            if (Player(playerId)->isConnected() == false)
                continue; // they're not connected to the server.

            if (m_currentPickupForPlayer[playerId] == PickupController::InvalidId)
                continue; // they're not standing in a pickup.

            if (m_currentLatestUpdateForPlayer[playerId] > earliestValidTime)
                continue; // we received an update recently enough.

            new pickupId = m_currentPickupForPlayer[playerId];
            new handlerId = this->handlerForPickup(pickupId),
                extraId   = this->extraForPickup(pickupId);

            m_currentPickupForPlayer[playerId] = PickupController::InvalidId;
            m_currentLatestUpdateForPlayer[playerId] = 0;

            if (handlerId == PickupController::InvalidPickupHandlerId)
                continue; // the pickup isn't owned by a handler.

            // Fire the OnPlayerLeavePickup callback so sub-systems know.
            Annotation::ExpandSwitch<OnPlayerLeavePickup>(handlerId, playerId, pickupId, extraId);
        }
    }

    /**
     * When a player picks up a pickup, this method will be invoked allowing us to check whether
     * it's in scope for us to handle. This is an O(1) operation due to the way this system has been
     * designed, so hopefully one day all pickups will be using the Pickup Controller.
     *
     * @param playerId Id of the player who picked up a pickup.
     * @param pickupId Id of the pickup which they picked up.
     * @return boolean Were we able to handle this pickup in the pickup controller?
     */
    public bool: onPlayerPickUpPickup(playerId, pickupId) {
        if (pickupId < 0 || pickupId >= MAX_PICKUPS)
            return true; // invalid pickup Id. block further processing too.

        if (Player(playerId)->isConnected() == false)
            return true; // invalid player Id. block further processing too.

        m_currentLatestUpdateForPlayer[playerId] = Time->highResolution();
        if (m_currentPickupForPlayer[playerId] == pickupId)
            return false; // they're already standing in this pick up, we're done.

        m_currentPickupForPlayer[playerId] = pickupId;

        // Now determine whether an handler has been associated with this pickup. If so, we'll want
        // to fire the OnPlayerEnterPickup callback, allowing them to handle it.
        new handlerId = this->handlerForPickup(pickupId);
        if (handlerId == PickupController::InvalidPickupHandlerId)
            return false; // nope -- this pickup isn't owned by a handler.

        new extraId = this->extraForPickup(pickupId);
        Annotation::ExpandSwitch<OnPlayerEnterPickup>(handlerId, playerId, pickupId, extraId);
        return true;
    }
};

/**
 * San Andreas: Multiplayer will invoke the OnPlayerPickUpPickup callback (mind the capitals) when a 
 * player touches a pickup. We add some of our own logic on top of this to handle these events in a
 * more sane way, and separate entering a pickup from the concept of leaving one. However, as many
 * systems haven't been updated yet to support that, we need to maintain the legacy behavior too.
 *
 * @param playerid Id of the player who is touching a pickup.
 * @param pickupid Id of the pickup which they are touching.
 */
public OnPlayerPickUpPickup(playerid, pickupid) {
    if (PickupController->onPlayerPickUpPickup(playerid, pickupid))
        return;

    LegacyOnPlayerPickUpPickup(playerid, pickupid);
}
