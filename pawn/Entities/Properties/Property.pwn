// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

// How many properties should Las Venturas Playground support?
#define MAX_PROPERTIES 400

/**
 * Each individual property has charateristics, i.e. location and price, which will be encapsulated
 * in this class. The Property Manager is responsible for controlling these, including loading and
 * storing them to and from the database.
 *
 * @author Russell Krupke <russell@sa-mp.nl>
 */
class Property <propertyId (MAX_PROPERTIES)> {
    // The Id which will be returned for invalid properties.
    public const InvalidId = 0xFFFF;

    // What is the maximum lenght of the property name?
    public const MaximumNameLenght = 31;

    // What is the maximum expense required to buy a property?
    public const MaximumPropertyPrice = 500000000;

    // How many percent of the property price does the player receive for selling a property?
    public const EarningOnPropertySellPercent = 70;

    // Has a property been created for this propertyId? Implicitly initialized to false (0).
    new bool: m_propertySlotInUse;

    // What is the Id of this property as it's been stored in the database?
    new m_databaseId;

    // What is the name of this property? This can be 31 characters long at maximum, but can be
    // changed at any time by administrators.
    new m_name[Property::MaximumNameLenght+1];

    // What is the base price of this property?
    new m_price;

    // How many percent of this property's price will the player earn as revenue every few minutes?
    new m_earningsPercentage;

    // At which position in San Andreas is this property located? Properties are only visible in
    // the first Virtual World, but can reside in different interiors.
    new Float: m_positionVector[3];

    // In which interior is this property located?
    new m_interiorId;

    // Are there any special features associated with this property? These are defined in the
    // PropertyFeature.pwn file, but implemented throughout the gamemode.
    new PropertyFeature: m_specialFeature;

    // What is the pickup Id associated with this property?
    new m_pickupId;

    // What is the textlabel Id associated with this property?
    new Text3D: m_labelId = Text3D: INVALID_3DTEXT_ID;

    // Which player does currently own this property?
    new m_ownerId;

    // At what time (in seconds) did the owner purchase this property?
    new m_purchaseTime;

    // Track the availability for each property by saving the timestamp of sale.
    new m_propertyAvailability;

    // ---- MAIN FUNCTIONS REGARDING PROPERTIES ----------------------------------------------------

    /**
     * Initializes a property given all the data known in the database. When a new property is being
     * created in the game itself, the PropertyManager will first insert it in the database and only
     * initialize it in the world if it was successfully stored.
     *
     * @param name Name of the property, may be 31 characters long at most.
     * @param price Base price of this property, in dollars.
     * @param earningsPercentage Percentage of the price the owner will earn per few minutes.
     * @param positionX X-coordinate in the main world where this property is located.
     * @param positionY Y-coordinate in the main world where this property is located.
     * @param positionZ Z-coordinate in the main world where this property is located.
     * @param interiorId Id of the interior in which the property is located.
     */
    public initialize(name[], price, earningsPercentage, Float: positionX, Float: positionY, Float: positionZ, interiorId) {
        new priceString[15], payout[15], labelText[256];

        m_propertySlotInUse = true;
        m_databaseId = Property::InvalidId;
        strncpy(m_name, name, sizeof(m_name));
        m_price = price;
        m_earningsPercentage = earningsPercentage;
        m_positionVector[0] = positionX;
        m_positionVector[1] = positionY;
        m_positionVector[2] = positionZ;
        m_interiorId = interiorId;
        m_specialFeature = NoPropertyFeature;
        m_ownerId = Player::InvalidId;
        m_purchaseTime = 0;

        // Create a pickup for this property. A green house indicates that it's available.
        m_pickupId = this->createPropertyPickupWithModel(GreenHousePickupId);

        // Create the additional 3D textlabel floating above the property pickup.
        FinancialUtilities->formatPrice(m_price, priceString, sizeof(priceString));
        FinancialUtilities->formatPrice(m_earningsPercentage * (m_price / 100), payout, sizeof(payout));

        format(labelText, sizeof(labelText),
            "{FF8C13}%s{FFFFFF} (%d){33AA33}\r\n[ Price: {FFFFFF}%s{33AA33} ]\r\n[ Income: {FFFFFF}%s{33AA33} every 3 minutes ]\r\n[ Owner: {FFFFFF}none{33AA33} ]",
            m_name, propertyId, priceString, payout);

        m_labelId = Create3DTextLabel(labelText, Color::PropertyTextLabel, m_positionVector[0], m_positionVector[1],
            m_positionVector[2] + 1 /* float above the property pickup */, 10 /* draw distance */, 0 /* main world */, 1);
    }

    /**
     * Saves the data of this property to the database. If a database Id has been associated with this
     * property we'll update the existing entry, otherwise we'll create a new entry. Saving data
     * is asynchronous, so it may take up to a second for the database to have the latest info.
     */
    public save() {
        if (m_databaseId == Property::InvalidId) {
            PropertyStorageManager->create(propertyId, m_name, m_price, m_earningsPercentage,
                m_positionVector, m_interiorId, m_specialFeature);
            return;
        }

        PropertyStorageManager->update(m_databaseId, m_name, m_price, m_earningsPercentage,
            m_positionVector, m_interiorId, m_specialFeature);
    }

    /**
     * Removes this property from Las Venturas Playground, and request a removal from the database
     * in case it was stored in the database (which it should be). We then remove the essential
     * information from this class, to make sure no other sub-systems get confused.
     */
    public destroy() {
        if (m_databaseId != Property::InvalidId)
            PropertyStorageManager->destroy(m_databaseId);

        m_propertySlotInUse = false;
        m_databaseId = Property::InvalidId;
        m_ownerId = Player::InvalidId;
        m_purchaseTime = 0;

        if (m_pickupId != PickupController::InvalidId)
            PickupController->destroyPickup(PropertyManager->pickupHandlerId(), m_pickupId);

        if (m_labelId != Text3D: INVALID_3DTEXT_ID)
            Delete3DTextLabel(m_labelId);
    }

    /**
     * Move the property to a new specified position and interior (if needed). In order to achieve
     * this, we redo the property pickup and 3D textlabel without altering anything else.
     *
     * @param positionX X-coordinate in the main world where this property is going to be located.
     * @param positionY Y-coordinate in the main world where this property is going to be located.
     * @param positionZ Z-coordinate in the main world where this property is going to be located.
     * @param interiorId Id of the interior in which the property is located.
     */
    public move(Float: positionX, Float: positionY, Float: positionZ, interiorId) {
        // Remove the pickup and 3D textlabel.
        if (m_pickupId != PickupController::InvalidId)
            PickupController->destroyPickup(PropertyManager->pickupHandlerId(), m_pickupId);

        if (m_labelId != Text3D: INVALID_3DTEXT_ID)
            Delete3DTextLabel(m_labelId);

        // Update the property position and interior.
        m_positionVector[0] = positionX;
        m_positionVector[1] = positionY;
        m_positionVector[2] = positionZ;
        m_interiorId = interiorId;

        new price[15], payout[15], textLabel[256];
        // Create a pickup for this property. If the property has an owner, we use a blue house pickup,
        // else, a green house pickup.
        if (m_ownerId != Player::InvalidId)
            m_pickupId = this->createPropertyPickupWithModel(BlueHousePickupId);
        else
            m_pickupId = this->createPropertyPickupWithModel(GreenHousePickupId);

        // Create the additional 3D textlabel floating above the property pickup.
        FinancialUtilities->formatPrice(m_price, price, sizeof(price));
        FinancialUtilities->formatPrice(m_earningsPercentage * (m_price / 100), payout, sizeof(payout));

        if (m_ownerId != Player::InvalidId)
            format(textLabel, sizeof(textLabel),
                "{FF8C13}%s{FFFFFF} (%d){33AA33}\r\n[ Price: {FFFFFF}%s{33AA33} ]\r\n[ Income: {FFFFFF}%s{33AA33} every 3 minutes ]\r\n[ Owner: {FFFFFF}%s{33AA33} ]",
                m_name, propertyId, price, payout, Player(m_ownerId)->nicknameString());
        else
            format(textLabel, sizeof(textLabel),
                "{FF8C13}%s{FFFFFF} (%d){33AA33}\r\n[ Price: {FFFFFF}%s{33AA33} ]\r\n[ Income: {FFFFFF}%s{33AA33} every 3 minutes ]\r\n[ Owner: {FFFFFF}none{33AA33} ]",
                m_name, propertyId, price, payout);

        m_labelId = Create3DTextLabel(textLabel, Color::PropertyTextLabel, m_positionVector[0], m_positionVector[1],
            m_positionVector[2] + 1 /* float above the property pickup */, 10 /* draw distance */, 0 /* main world */, 1);
    }

    /**
     * A conveniance method for creating an icon for this property with the given model Id. We'll
     * return the Id of the created model, so don't forget to save it somewhere.
     *
     * @param modelId Id of the model which should be used for creating the property.
     * @return integer Id of the pickup which has been created in the handler.
     */
    private createPropertyPickupWithModel(modelId) {
        return PickupController->createPickup(PropertyManager->pickupHandlerId(), modelId,
            PersistentPickupType, m_positionVector[0], m_positionVector[1], m_positionVector[2], 0, propertyId);
    }

    /**
     * Used to move a player to the designated property.
     *
     * @param playerId Id of the player to teleport.
     */
    public teleportPlayerToProperty(playerId) {
        new vehicleId = GetPlayerVehicleID(playerId);
        if (vehicleId == 0) {
            SetPlayerInterior(playerId, m_interiorId);
            SetPlayerPos(playerId, m_positionVector[0], m_positionVector[1], m_positionVector[2]);
            SetPlayerVirtualWorld(playerId, 0);
        } else {
            LinkVehicleToInterior(vehicleId, m_interiorId);
            SetVehiclePos(vehicleId, m_positionVector[0], m_positionVector[1], m_positionVector[2]);
            SetVehicleVirtualWorld(vehicleId, 0);
        }

        SendClientMessage(playerId, Color::Success, "You've been teleported!");
    }

    // ---- GETTERS AND SETTERS REGARDING PROPERTIES -----------------------------------------------

    /**
     * Returns whether the current property slot is storing an active property.
     *
     * @return boolean Is the current property slot being used?
     */
    public inline bool: isPropertySlotInUse() {
        return (m_propertySlotInUse);
    }

    /**
     * Updates the database Id of this property with the given value. This method should only ever
     * be called by the Property Storage Manager when loading or saving this property.
     *
     * @param databaseId Id of this property as stored in the database.
     */
    public inline setDatabaseId(databaseId) {
        m_databaseId = databaseId;
    }

    /**
     * Retrieves direct access to the name buffer of this property. Do NOT modify the returned
     * value, as you'll cause our internal state to get out of sync with the database's.
     *
     * @return string Name of this property.
     */
    public inline nameString() {
        return (m_name);
    }

    /**
     * Updates the name of this property to the given value. The name will be changed in all the
     * places where it's being referred to.
     *
     * @param name The new name of this property.
     */
    public setName(name[]) {
        strncpy(m_name, name, sizeof(m_name));

        // Update the 3D text label.
        PropertyManager->update3DTextLabel(propertyId, m_labelId);
    }

    /**
     * Retrieves the price of this property.
     *
     * @return integer The price of this property.
     */
    public inline price() {
        return (m_price);
    }

    /**
     * Updates the price of this property. We advice to keep the price in a sane range, though the
     * hard limit would be over 2 billion dollars (INT_MAX).
     *
     * @param price The price this property should have.
     */
    public setPrice(price) {
        m_price = price;

        // Update the 3D text label.
        PropertyManager->update3DTextLabel(propertyId, m_labelId);
    }

    /**
     * Retrieve the earnings percentage which owners of this property should receive for each
     * periodic update.
     *
     * @return integer Percentage of the property's price which owners should receive.
     */
    public inline earningsPercentage() {
        return (m_earningsPercentage);
    }

    /**
     * Changes the earnings percentage of this property to the indicated amount. We strongly advice
     * to keep this value below ten percent in order to not blow up the economy.
     *
     * @param earningsPercentage Percentage of the property's price the periodic earnings amount to.
     */
    public setEarningsPercentage(earningsPercentage) {
        m_earningsPercentage = earningsPercentage;

        // Update the 3D text label.
        PropertyManager->update3DTextLabel(propertyId, m_labelId);
    }

    /**
     * Retrieve the position vectors of this property.
     *
     * @param positionX Float to store the x-position in.
     * @param positionY Float to store the y-position in.
     * @param positionZ Float to store the z-position in.
     */
    public positionVectors(&Float: positionX, &Float: positionY, &Float: positionZ) {
        positionX = m_positionVector[0];
        positionY = m_positionVector[1];
        positionZ = m_positionVector[2];
    }

    /**
     * Returns the special feature associated with this property, or the default NoPropertyFeature
     * value in case it has none.
     *
     * @return PropertyFeature The special feature associated with this property.
     */
    public inline PropertyFeature: specialFeature() {
        return (m_specialFeature);
    }

    /**
     * Updates the special feature associated with this property and reports so to the Property
     * Manager. Any former property which had this feature assigned will loose that ability.
     *
     * @param specialFeature The feature which should be associated with this property.
     */
    public setSpecialFeature(PropertyFeature: specialFeature) {
        new currentFeatureOwner = PropertyManager->propertyForSpecialFeature(specialFeature);
        if (currentFeatureOwner != Property::InvalidId)
            Property(currentFeatureOwner)->setSpecialFeature(NoPropertyFeature);

        PropertyManager->registerPropertyForSpecialFeature(propertyId, specialFeature);
        m_specialFeature = specialFeature;
    }

    /**
     * Returns true when this property owns the pickup Id indicated in the first argument. We don't
     * want to expose the pickup Id outside of this class, so return a boolean instead.
     *
     * @param pickupId Id of the pickup to test against.
     * @return boolean A boolean indicating whether this property has the given pickup Id.
     */
    public inline bool: hasPickupId(pickupId) {
        return (m_pickupId == pickupId);
    }

    /**
     * Returns the Id of the player who currently owns this property, or the Player::InvalidId
     * constant if it's not owned by anyone at this time.
     *
     * @return integer Id of the player who owns this property, or Player::InvalidId.
     */
    public inline ownerId() {
        return (m_ownerId);
    }

    /**
     * Updates the owner of this property to another player. This could happen when that player
     * buys this property, or when an administrator assigns it to them. We do various checks here
     * to see if we need to update the pickup which has been associated with this property.
     *
     * @param playerId Id of the player who should own this property.
     */
    public setOwnerId(playerId) {
        if (playerId != Player::InvalidId && m_ownerId == Player::InvalidId) {
            // We need to update the property's pickup to be blue -- it's no longer available!
            if (m_pickupId != PickupController::InvalidId)
                PickupController->destroyPickup(PropertyManager->pickupHandlerId(), m_pickupId);

            m_pickupId = this->createPropertyPickupWithModel(BlueHousePickupId);

        } else if (playerId == Player::InvalidId && m_ownerId != Player::InvalidId) {
            // The property is available again, so update the pickup to be green.
            if (m_pickupId != PickupController::InvalidId)
                PickupController->destroyPickup(PropertyManager->pickupHandlerId(), m_pickupId);

            m_pickupId = this->createPropertyPickupWithModel(GreenHousePickupId);
        }

        // Record the duration that the previous owner, if any, owned the property.
        if (m_ownerId != Player::InvalidId && m_databaseId != Property::InvalidId) {
            new const ownershipDuration = Time->currentTime() - m_purchaseTime;

            PropertyStorageManager->recordPropertyOwnership(m_databaseId, m_ownerId, ownershipDuration);
        }

        // Check for a special feature, we might have to do something special.
        if (m_specialFeature != NoPropertyFeature)
            PropertyEvents->handleFeatureInformation(playerId, m_specialFeature);

        // Now update the actual owner of the property to the new value.
        m_ownerId = playerId;
        m_purchaseTime = Time->currentTime();

        // Update the 3D text label.
        PropertyManager->update3DTextLabel(propertyId, m_labelId);
    }

    /**
     * Retrieve the UNIX timestamp this property was bought.
     *
     * @return integer Timestamp in seconds.
     */
    public inline propertyAvailability() {
        return (m_propertyAvailability);
    }

    /**
     * Set the UNIX timestamp this property was bought.
     *
     * @param timestamp UNIX timestamp in seconds.
     */
    public setPropertyAvailability(timestamp) {
        m_propertyAvailability = timestamp;
    }
};
