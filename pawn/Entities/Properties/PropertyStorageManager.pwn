// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/**
 * When the database replied to our property data request, this callback will be invoked allowing us
 * to tell the property storage manager. Be sure to free the result set after we're done with it.
 *
 * @param resultId Id of the result in which the data is stored.
 * @param dataId Additional data Id. Unused.
 */
forward PropertyInfoRequestCallback(resultId, dataId);
public PropertyInfoRequestCallback(resultId, dataId) {
    PropertyStorageManager->onReceivedPropertyInfo(resultId);
    DatabaseResult(resultId)->free();
}

/**
 * This callback will be invoked by the MySQL plugin when the query creating a property has been
 * executed successfully. We inform the property storage manager about this with both the internal
 * property Id and the Id of the row which was just added to the database.
 *
 * @param resultId Id of the database result in which our data is stored.
 * @param internalId Id of the property which has been created.
 */
forward PropertyCreateRequestCallback(resultId, internalId);
public PropertyCreateRequestCallback(resultId, internalId) {
    PropertyStorageManager->onFinishedPropertyCreate(internalId, DatabaseResult(resultId)->insertId());
    DatabaseResult(resultId)->free();
}

/**
 * The property storage manager is responsible for loading properties in the database, removing them
 * and updating them whenever the in-game state changes. The PropertyManager will request a load of
 * the properties during gamemode start-up, whereas the administrative commands to control the
 * properties will request a property to be updated.
 *
 * @author Russell Krupke <russell@sa-mp.nl>
 */
class PropertyStorageManager {
    // Id of the prepared statement which we use to store ownership information.
    new m_recordOwnershipStatementId;

    // Id of the prepared statement which we use to create new properties.
    new m_createPropertyStatementId;

    // Id of the prepared statement which we use to update existing properties.
    new m_updatePropertyStatementId;

    // Id of the prepared statement which we use to delete existing properties.
    new m_destroyPropertyStatementId;

    /**
     * During gamemode start-up, we'd like to create stored queries for a few operations we'll
     * execute various times. This makes sure that we don't have to fiddle with queries ourselves.
     */
    public __construct() {
        m_recordOwnershipStatementId = Database->prepare("INSERT INTO properties_ownership " ...
            "(property_id, user_id, ownership_date, ownership_duration) VALUES (?, ?, NOW(), ?)", "iii");
        m_createPropertyStatementId = Database->prepare("INSERT INTO properties (property_id, name, " ...
            "price, earnings_percentage, position_x, position_y, position_z, interior_id, special_feature_id) " ...
            "VALUES (NULL, ?, ?, ?, ?, ?, ?, ?, ?)", "siifffii");
        m_updatePropertyStatementId = Database->prepare("UPDATE properties SET name = ?, price = ?, " ...
            "earnings_percentage = ?, position_x = ?, position_y = ?, position_z = ?, interior_id = ?, " ...
            "special_feature_id = ? WHERE property_id = ?", "siifffiii");
        m_destroyPropertyStatementId = Database->prepare("DELETE FROM properties WHERE property_id = ?", "i");
    }

    /**
     * Records in the database that the property identified by |databaseId| was owned by the player
     * with |playerId| for |ownershipDuration| seconds.
     *
     * @param databaseId Id the property is represented with in the database.
     * @param playerId Id of the player who owned the property.
     * @param ownershipDuration Number of seconds that the player owned the property.
     */
    public recordPropertyOwnership(databaseId, playerId, ownershipDuration) {
        new userId = 0; /* would ideally be NULL, but meh */
        if (Player(playerId)->isLoggedIn())
            userId = Account(playerId)->userId();

        Database->execute(m_recordOwnershipStatementId, "", 0, databaseId, userId, ownershipDuration);
    }

    /**
     * Sent an asynchronous query to the database requesting all the properties which should be
     * loaded in Las Venturas Playground. We store them in the primary MySQL database.
     */
    public requestPropertiesFromDatabase() {
        Database->query("SELECT property_id, name, price, earnings_percentage, position_x, position_y, " ...
            "position_z, interior_id, special_feature_id FROM properties", "PropertyInfoRequestCallback");
    }

    /**
     * We received property information from the database, so we should now apply this information
     * and create properties for every persistent property out there.
     *
     * @param resultId Id of the result in which the data is stored.
     */
    public onReceivedPropertyInfo(resultId) {
        if (DatabaseResult(resultId)->count() == 0)
            return; // no properties are available in the database.

        new propertyName[32], loadedCounter = 0;
        while (DatabaseResult(resultId)->next()) {
            new databaseId = DatabaseResult(resultId)->readInteger("property_id"),
                price = DatabaseResult(resultId)->readInteger("price"),
                earningsPercentage = DatabaseResult(resultId)->readInteger("earnings_percentage"),
                Float: positionX = DatabaseResult(resultId)->readFloat("position_x"),
                Float: positionY = DatabaseResult(resultId)->readFloat("position_y"),
                Float: positionZ = DatabaseResult(resultId)->readFloat("position_z"),
                interiorId = DatabaseResult(resultId)->readInteger("interior_id"),
                specialFeatureId = DatabaseResult(resultId)->readInteger("special_feature_id");

            DatabaseResult(resultId)->readString("name", propertyName);

            new propertyId = PropertyManager->create(propertyName, price, earningsPercentage, positionX, positionY, positionZ, interiorId);
            if (propertyId == Property::InvalidId) {
                printf("[Properties] Unable to create a property entry for \"%s\" (Id:%d).", propertyName, databaseId);
                continue; // we don't have an Id, so there's no point in continuing here.
            }

            // Register any special feature associated with this property, if any.
            if (specialFeatureId != _: NoPropertyFeature)
                Property(propertyId)->setSpecialFeature(PropertyFeature: specialFeatureId);

            Property(propertyId)->setDatabaseId(databaseId);
            ++loadedCounter;
        }

        // Output an error to the console if no properties were retrieved.
        if (loadedCounter == 0)
            printf("[PropertyController] ERROR: Could not load any properties.");
    }

    /**
     * Stores the given property information as a new property in the database. After this query has
     * finished executing, we'll separately update the internal state of the property so it stores
     * the database Id correctly, ensuring that we don't save it twice.
     *
     * @param internalId Id of the property as it exists in the current Property Manager.
     * @param name Name of the property.
     * @param price Price of the property.
     * @param earningsPercentage Percentage of the price which the player periodicly receives.
     * @param positionVector A vector containing the position of this property.
     * @param interiorId Id of the interior in which this property exists.
     * @param specialFeature The special feature which this property encapsulates.
     */
    public create(internalId, name[], price, earningsPercentage, Float: positionVector[3], interiorId, PropertyFeature: specialFeature) {
        // TODO remove temp supression of compliation warnings and fix them 
        #pragma unused internalId, name, price, earningsPercentage, positionVector, interiorId, specialFeature
        printf("property->create - internalId: %d - Name: %s", internalId, name);
        Database->execute(m_createPropertyStatementId, "PropertyCreateRequestCallback", internalId, name, price, \
            earningsPercentage, positionVector[0], positionVector[1], positionVector[2], interiorId, _: specialFeature);
    }

    /**
     * When a property has been stored in the database, we need to update the property's internal
     * status with the database Id to make sure it can be updated accordingly.
     *
     * @param internalId Id of the property in the current Property Manager.
     * @param databaseId Id of this property in the database.
     */
    public onFinishedPropertyCreate(internalId, databaseId) {
        if (internalId < 0 || internalId >= MAX_PROPERTIES)
            return;

        if (Property(internalId)->isPropertySlotInUse() == false)
            return;

        Property(internalId)->setDatabaseId(databaseId);
    }

    /**
     * Updates the property's data in the database to make sure it persists across restarts of the
     * Las Venturas Playground gamemode. No feedback will be provided to the caller.
     *
     * @param databaseId Id of the property in the database which we'll be updating.
     * @param name Name of the property.
     * @param price Price of the property.
     * @param earningsPercentage Percentage of the price which the player periodicly receives.
     * @param positionVector A vector containing the position of this property.
     * @param interiorId Id of the interior in which this property exists.
     * @param specialFeature The special feature which this property encapsulates.
     */
    public update(databaseId, name[], price, earningsPercentage, Float: positionVector[3], interiorId, PropertyFeature: specialFeature) {
        Database->execute(m_updatePropertyStatementId, "", 0, name, price, earningsPercentage, positionVector[0], \
            positionVector[1], positionVector[2], interiorId, _: specialFeature, databaseId);
    }

    /**
     * Fire off a MySQL query to remove the given property from the database. This action cannot
     * be reversed, so removing properties should be done with care.
     *
     * @param databaseId Id of the property in the database.
     */
    public destroy(databaseId) {
        Database->execute(m_destroyPropertyStatementId, "", 0, databaseId);
    }
};
