// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/**
 * All commands associated with properties will be defined in this class, including administrative
 * commands and sub-commands on the "/p(layer)" command.
 *
 * @author Manuele "Kase" Macchia <kaseify@gmail.com>
 * @author Max "Cake" Blokker <cake@sa-mp.nl>
 */
class PropertyCommands {
    // What is the default percentage of a property's price which the earnings should be?
    const DefaultEarningsPercentage = 10;

    // What is the default percentage a player will receive after their property got bought?
    const RefundPercentage = 20;

    // ---- PROPERTY COMMANDS FOR ADMINISTRATORS ---------------------------------------------------

    /**
     * Show information on a certain property, such as its name, price, earnings, whether it's got
     * a special feature (and, if so, which one) and who is the current owner of the property.
     * Administrators can also edit property details and create or delete a property.
     *
     * If the player is near a property and doesn't state any specific property Id, the issued
     * command will affect the property he's near.
     * 
     * @param playerId Id of the player who typed the command.
     * @param params Any further text that the player typed after the command.
     * @command /property [Id]? [create/delete/earnings/feature/goto/move/name/owner/price/save]
     */
    @command("property")
    public onPropertyCommand(playerId, params[]) {
        if (Command->parameterCount(params) == 0 && Player(playerId)->isAdministrator() == false) {
            SendClientMessage(playerId, Color::Information, "Usage: /property search [name/Id]");
            return 1;
        }

        if (Command->parameterCount(params) == 0 && Player(playerId)->isAdministrator() == true) {
            SendClientMessage(playerId, Color::Information,
                "Usage: /property [Id]? [create/delete/earnings/feature/goto/move/name/owner/price/save/search]");
            SendClientMessage(playerId, Color::Information,
                "  Some subcommands might require a propertyId when you're not near a property.");
            return 1;
        }

        new propertyId = Command->integerParameter(params, 0), operationName[16], parameterOffset = 0;
        if (propertyId != -1 && Command->parameterCount(params) >= 2 && Player(playerId)->isAdministrator() == true) {
            Command->stringParameter(params, 1, operationName, sizeof(operationName));
            parameterOffset = min(strlen(params), Command->startingIndexForParameter(params, 1)
                + strlen(operationName) + 1);
        } else {
            Command->stringParameter(params, 0, operationName, sizeof(operationName));
            if (strcmp(operationName, "search", true) && Player(playerId)->isAdministrator() == false)
                return 0;

            parameterOffset = min(strlen(params), Command->startingIndexForParameter(params, 0)
                + strlen(operationName) + 1);
        }

        // See if any method is listening to the operation given by the player. If so, bail out.
        if (Annotation::ExpandSwitch<PropertyCommand>(operationName, playerId, propertyId, params[parameterOffset]) == 1)
            return 1;

        return 1;
    }

    /**
     * Administrators may create a property at the position they're at. They should specify the
     * property name, its price, and how many percent of its price will the player earn as revenue.
     * This method ignores the propertyId parameter, as it will be automatically assigned by the
     * Property Manager.
     *
     * @param playerId Id of the player who typed the command.
     * @param propertyId Id of the specified property or the nearest property to the player. Unused.
     * @param price The price between $1 - $500,000,000 to be set for the new property.
     * @param name The name to be set for the new property. This must not be longer than 16 chars.
     * @command /property create [price] [name]
     */
    @switch(PropertyCommand, "create")
    public onPropertyCreateCommand(playerId, propertyId, params[]) {
        if (Command->parameterCount(params) < 2) {
            SendClientMessage(playerId, Color::Information, "Usage: /property create [price] [name]");
            return 1;
        }

        new price = Command->integerParameter(params, 0);
        if (price <= 0 || price > Property::MaximumPropertyPrice) {
            SendClientMessage(playerId, Color::Error, "You should enter a price between $1 - $500,000,000.");
            return 1;
        }

        new offset = Command->startingIndexForParameter(params, 1), message[128];
        if (strlen(params[offset]) > Property::MaximumNameLenght) {
            format(message, sizeof(message), "The property name shouldn't be longer than %d characters.",
                Property::MaximumNameLenght);
            SendClientMessage(playerId, Color::Error, message);
            return 1;
        }

        new interiorId = GetPlayerInterior(playerId), Float: positionVector[3];
        GetPlayerPos(playerId, positionVector[0], positionVector[1], positionVector[2]);

        new property = PropertyManager->create(params[offset], price, DefaultEarningsPercentage,
            positionVector[0], positionVector[1], positionVector[2], interiorId);
        if (property == Property::InvalidId) {
            SendClientMessage(playerId, Color::Error, "All property slots are filled! Delete a property to free up a slot.");
            return 1;
        }

        format(message, sizeof(message), "A new property, \"%s\" (Id:%d), was created! Remember to use /property save to save it.",
            params[offset], property);
        SendClientMessage(playerId, Color::Success, message);

        format(message, sizeof(message), "%s (Id:%d) has created the property \"%s\" (Id:%d), available for $%s.",
            Player(playerId)->nicknameString(), playerId, params[offset], property, formatPrice(price));
        Admin(playerId, message);

        return 1;
        #pragma unused propertyId
    }

    /**
     * Administrators can delete a certain property, freeing its slot.
     *
     * @param playerId Id of the player who typed the command.
     * @param propertyId Id of the specified property or the nearest property to the player.
     * @param params Any further text that the player passed to the command. Unused.
     * @command /property [Id]? delete
     */
    @switch(PropertyCommand, "delete")
    public onPropertyDeleteCommand(playerId, propertyId, params[]) {
        if (propertyId < 0 || propertyId >= MAX_PROPERTIES || !Property(propertyId)->isPropertySlotInUse()) {
            if (PropertyManager->currentPropertyIdForPlayer(playerId) == Property::InvalidId) {
                SendClientMessage(playerId, Color::Error,
                "You should specify a valid property Id if you're not standing near a property!");
                return 1;
            } else propertyId = PropertyManager->currentPropertyIdForPlayer(playerId);
        }

        Property(propertyId)->destroy();

        // Fix for have a non-existing propertyId set as currentPropertyIdForPlayer.
        if (PropertyManager->currentPropertyIdForPlayer(playerId) != Property::InvalidId)
            PropertyManager->resetPropertyIdForPlayer(playerId);

        new message[128];
        format(message, sizeof(message), "The specified property, \"%s\" (Id:%d), has been deleted!",
            Property(propertyId)->nameString(), propertyId);
        SendClientMessage(playerId, Color::Success, message);

        format(message, sizeof(message), "%s (Id:%d) has removed the property \"%s\" (Id:%d).",
            Player(playerId)->nicknameString(), playerId, Property(propertyId)->nameString(), propertyId);
        Admin(playerId, message);

        return 1;
        #pragma unused params
    }

    /**
     * Show the specified property's earnings revenue, and change it if specified.
     *
     * @param playerId Id of the player who typed the command.
     * @param propertyId Id of the specified property or the nearest property to the player.
     * @param earnings Percentage between 1 - 100 to be set as the new earnings percentage. Optional.
     * @command /property [Id]? earnings [1-100]?
     */
    @switch(PropertyCommand, "earnings")
    public onPropertyEarningsCommand(playerId, propertyId, params[]) {
        if (propertyId < 0 || propertyId >= MAX_PROPERTIES || !Property(propertyId)->isPropertySlotInUse()) {
            if (PropertyManager->currentPropertyIdForPlayer(playerId) == Property::InvalidId) {
                SendClientMessage(playerId, Color::Error,
                    "You should specify a valid property Id if you're not standing near a property!");
                return 1;
            } else propertyId = PropertyManager->currentPropertyIdForPlayer(playerId);
        }

        new message[256];
        if (Command->parameterCount(params) != 1) {
            format(message, sizeof(message), "The earning percentage of this property, \"%s\" (Id:%d), is %d.",
                Property(propertyId)->nameString(), propertyId, Property(propertyId)->earningsPercentage());
            SendClientMessage(playerId, Color::Information, message);

            SendClientMessage(playerId, Color::Information, "  Use \"/property [Id]? earnings [1-100]\" to set the earnings.");
            return 1;
        }

        new earningsPercentage = Command->integerParameter(params, 0);
        if (earningsPercentage <= 0 || earningsPercentage > 100) {
            SendClientMessage(playerId, Color::Information, "Usage: /property [Id]? earnings [1-100]");
            return 1;
        }

        Property(propertyId)->setEarningsPercentage(earningsPercentage);
        Property(propertyId)->save();

        format(message, sizeof(message), "The earnings percentage of the specified property (Id:%d) has been changed to %d.", 
            propertyId, earningsPercentage);
        SendClientMessage(playerId, Color::Success, message);

        format(message, sizeof(message), "%s (Id:%d) has set the earnings percentage of property \"%s\" (Id:%d) to %d.",
            Player(playerId)->nicknameString(), playerId, Property(propertyId)->nameString(), propertyId, earningsPercentage);
        Admin(playerId, message);

        return 1;
    }

    /**
     * Show the specified property's feature, and change it if specified.
     *
     * @param playerId Id of the player who typed the command.
     * @param propertyId Id of the specified property or the nearest property to the player.
     * @param feature Name of the feature that should be tied to the property. Optional.
     * @command /property [Id]? feature [feature]?
     */
    @switch(PropertyCommand, "feature")
    public onPropertyFeatureCommand(playerId, propertyId, params[]) {
        if (propertyId < 0 || propertyId >= MAX_PROPERTIES || !Property(propertyId)->isPropertySlotInUse()) {
            if (PropertyManager->currentPropertyIdForPlayer(playerId) == Property::InvalidId) {
                SendClientMessage(playerId, Color::Error,
                    "You should specify a valid property Id if you're not standing near a property!");
                return 1;
            } else propertyId = PropertyManager->currentPropertyIdForPlayer(playerId);
        }

        new message[128], PropertyFeature: feature, featureString[32];
        if (Command->parameterCount(params) != 1) {
            feature = Property(propertyId)->specialFeature();
            if (feature != NoPropertyFeature) {
                PropertyFeature->enumToString(feature, featureString, sizeof(featureString));
                format(message, sizeof(message), "This property has the following special feature: {40CCFF}%s{FFFFFF}.",
                    featureString);
           } else format(message, sizeof(message), "This property has no special feature.");
            SendClientMessage(playerId, Color::Information, message);

            SendClientMessage(playerId, Color::Information,
                "  The following features are available: no-feature, read-group-chat, vehicle-modifications, customtax-airport, bombshop");
            SendClientMessage(playerId, Color::Information,
                "  free-teleport, loans, bar, kaufman-cabs, police, export, armour, health, weapons-ammo, health-protection");

            SendClientMessage(playerId, Color::Information, "  Use \"/property [Id]? feature [feature]\" to set the feature.");
            return 1;
        }

        Command->stringParameter(params, 0, featureString, sizeof(featureString));
        feature = PropertyFeature->stringToEnum(featureString);

        new currentFeatureOwner = PropertyManager->propertyForSpecialFeature(feature);
        if (feature != InvalidPropertyFeature) { /* valid feature */
            if (currentFeatureOwner != Property::InvalidId && GetPVarInt(playerId, "featureOverwrite") == 0) {
                SetPVarInt(playerId, "featureOverwrite", 1);
                ShowPlayerDialog(playerId, PropertyManager::DialogId, DIALOG_STYLE_MSGBOX, "Property Feature",
                    "This feature is already set on another property.\r\nRe-enter the command to set it on this property!", "Continue", "");
                return 1;
            }

            Property(propertyId)->setSpecialFeature(feature);
            Property(propertyId)->save();
            DeletePVar(playerId, "featureOverwrite");

            if (currentFeatureOwner != Property::InvalidId)
                format(message, sizeof(message),
                    "Property \"%s\" (Id:%d) has lost its feature \"%s\", which has now been set on this property.",
                    Property(currentFeatureOwner)->nameString(), currentFeatureOwner, featureString);
            else
                format(message, sizeof(message), "This property now has the following feature: \"%s\".",
                    featureString);
            SendClientMessage(playerId, Color::Information, message);
        } else { /* invalid feature */
            SendClientMessage(playerId, Color::Error, "You have entered an invalid special property feature.");
            SendClientMessage(playerId, Color::Information,
                "  The following features are available: no-feature, read-group-chat, vehicle-modifications, customtax-airport, bombshop");
            SendClientMessage(playerId, Color::Information,
                "  free-teleport, loans, bar, kaufman-cabs, police, export, armour, health, weapons-ammo, health-protection");
        }

        return 1;
    }

    /**
     * Teleport the player to the specified property.
     *
     * @param playerId Id of the player who typed the command.
     * @param propertyId Id of the specified property or the nearest property to the player.
     * @param params Any further text that the player passed to the command. Unused.
     * @command /property [Id] goto
     */
    @switch(PropertyCommand, "goto")
    public onPropertyGotoCommand(playerId, propertyId, params[]) {
        if (propertyId < 0 || propertyId >= MAX_PROPERTIES || !Property(propertyId)->isPropertySlotInUse()) {
            SendClientMessage(playerId, Color::Error, "You should specify a valid property Id!");
            return 1;
        }

        Property(propertyId)->teleportPlayerToProperty(playerId);

        return 1;
        #pragma unused params
    }
    /**
     * Move an existing property to the player's position, without destroying any of the property
     * information.
     *
     * @param playerId Id of the player who typed the command.
     * @param propertyId Id of the specified property or the nearest property to the player.
     * @param params Any further text that the player passed to the command. Unused.
     * @command /property [Id] move
     */
    @switch(PropertyCommand, "move")
    public onPropertyMoveCommand(playerId, propertyId, params[]) {
        if (propertyId < 0 || propertyId >= MAX_PROPERTIES || !Property(propertyId)->isPropertySlotInUse()) {
            SendClientMessage(playerId, Color::Error, "You should specify a valid property Id!");
            return 1;
        }

        if (GetPlayerVirtualWorld(playerId) != World::MainWorld) {
            SendClientMessage(playerId, Color::Error, "You should only issue this command in the main world.");
            return 1;
        }

        // Gather information regarding the new location.
        new Float: newPosition[3], message[128];
        GetPlayerPos(playerId, newPosition[0], newPosition[1], newPosition[2]);
        new interiorId = GetPlayerInterior(playerId);

        Property(propertyId)->move(newPosition[0], newPosition[1], newPosition[2], interiorId);
        Property(propertyId)->save();

        format(message, sizeof(message), "The specified property, \"%s\" (Id:%d) has been moved to your position.",
            Property(propertyId)->nameString(), propertyId);
        SendClientMessage(playerId, Color::Success, message);

        format(message, sizeof(message), "%s (Id:%d) has moved the property \"%s\" (Id:%d).",
            Player(playerId)->nicknameString(), playerId, Property(propertyId)->nameString(), propertyId);
        Admin(playerId, message);

        return 1;
        #pragma unused params
    }

    /**
     * Show the specified property's name, and change it if specified.
     *
     * @param playerId Id of the player who typed the command.
     * @param propertyId Id of the specified property or the nearest property to the player.
     * @param name The new name to be set for the property. Optional.
     * @command /property [Id]? name [name]?
     */
    @switch(PropertyCommand, "name")
    public onPropertyNameCommand(playerId, propertyId, params[]) {
        if (propertyId < 0 || propertyId >= MAX_PROPERTIES || !Property(propertyId)->isPropertySlotInUse()) {
            if (PropertyManager->currentPropertyIdForPlayer(playerId) == Property::InvalidId) {
                SendClientMessage(playerId, Color::Error,
                    "You should specify a valid property Id if you're not standing near a property!");
                return 1;
            } else propertyId = PropertyManager->currentPropertyIdForPlayer(playerId);
        }

        new message[196], oldName[Property::MaximumNameLenght + 1];
        if (Command->parameterCount(params) == 0) {
            format(message, sizeof(message), "This property is called \"%s\" (Id:%d).", Property(propertyId)->nameString(),
                propertyId);
            SendClientMessage(playerId, Color::Information, message);

            SendClientMessage(playerId, Color::Information, "  Use \"/property [Id]? name [name]\" to rename it.");
            return 1;
        }

        new offset = Command->startingIndexForParameter(params, 0);
        if (strlen(params[offset]) > Property::MaximumNameLenght) {
            format(message, sizeof(message), "The property name shouldn't be longer than %d characters.",
                Property::MaximumNameLenght);
            SendClientMessage(playerId, Color::Error, message);
            return 1;
        }

        format(oldName, sizeof(oldName), "%s", Property(propertyId)->nameString());
        Property(propertyId)->setName(params[offset]);
        Property(propertyId)->save();

        format(message, sizeof(message), "The name of this property has been changed to \"%s\" (Id:%d).",
            params[offset], propertyId);
        SendClientMessage(playerId, Color::Success, message);

        format(message, sizeof(message), "%s (Id:%d) has renamed the \"%s\" property to \"%s\".",
            Player(playerId)->nicknameString(), playerId, oldName, params[offset]);
        Admin(playerId, message);

        return 1;
    }

    /**
     * Show the specified property's owner, and change it if specified.
     *
     * @param playerId Id of the player who typed the command.
     * @param propertyId Id of the specified property or the nearest property to the player.
     * @param player Id or name of the new specified owner. Optional.
     * @command /property [Id]? owner [player]?
     */
    @switch(PropertyCommand, "owner")
    public onPropertyOwnerCommand(playerId, propertyId, params[]) {
        if (propertyId < 0 || propertyId >= MAX_PROPERTIES || !Property(propertyId)->isPropertySlotInUse()) {
            if (PropertyManager->currentPropertyIdForPlayer(playerId) == Property::InvalidId) {
                SendClientMessage(playerId, Color::Error,
                    "You should specify a valid property Id if you're not standing near a property!");
                return 1;
            } else propertyId = PropertyManager->currentPropertyIdForPlayer(playerId);
        }

        new message[256];
        if (Command->parameterCount(params) != 1) {
            new ownerId = Property(propertyId)->ownerId();
            if (ownerId != Player::InvalidId)
                format(message, sizeof(message), "The current owner of this property, \"%s\" (Id:%d), is %s (Id:%d).", 
                    Property(propertyId)->nameString(), propertyId, Player(ownerId)->nicknameString(), ownerId);
            else
                format(message, sizeof(message), "This property, \"%s\" (Id:%d), currently has no owner.",
                    Property(propertyId)->nameString(), propertyId);

            SendClientMessage(playerId, Color::Information, message);
            SendClientMessage(playerId, Color::Information, "  Use \"/property [Id]? owner [player]\" to set the owner.");

            return 1;
        }

        new newOwnerId = Command->playerParameter(params, 0, playerId);
        if (newOwnerId == Player::InvalidId)
            return 1;

        Property(propertyId)->setOwnerId(newOwnerId);
        Property(propertyId)->setPropertyAvailability(0);
        format(message, sizeof(message), "The owner of the specified property (Id:%d) has changed to %s (Id:%d).", 
            propertyId, Player(newOwnerId)->nicknameString(), newOwnerId);
        SendClientMessage(playerId, Color::Success, message);

        format(message, sizeof(message), "%s (Id:%d) has given you the property \"%s\" (Id:%d).",
            Player(playerId)->nicknameString(), playerId, Property(propertyId)->nameString(), propertyId);
        SendClientMessage(newOwnerId, Color::Information, message);

        format(message, sizeof(message), "%s (Id:%d) has given %s (Id:%d) the property \"%s\" (Id:%d).",
            Player(playerId)->nicknameString(), playerId, Player(newOwnerId)->nicknameString(),
            newOwnerId, Property(propertyId)->nameString(), propertyId);
        Admin(playerId, message);

        return 1;
    }

    /**
     * Show the specified property's price, and change it if specified.
     *
     * @param playerId Id of the player who typed the command.
     * @param propertyId Id of the specified property or the nearest property to the player.
     * @param price The new price to be set for the property, between $1 and $500,000,000. Optional.
     * @command /property [Id]? price [1-500,000,000]?
     */
    @switch(PropertyCommand, "price")
    public onPropertyPriceCommand(playerId, propertyId, params[]) {
        if (propertyId < 0 || propertyId >= MAX_PROPERTIES || !Property(propertyId)->isPropertySlotInUse()) {
            if (PropertyManager->currentPropertyIdForPlayer(playerId) == Property::InvalidId) {
                SendClientMessage(playerId, Color::Error,
                    "You should specify a valid property Id if you're not standing near a property!");
                return 1;
            } else propertyId = PropertyManager->currentPropertyIdForPlayer(playerId);
        }

        new message[128], price[12];
        if (Command->parameterCount(params) != 1) {
            FinancialUtilities->formatPrice(Property(propertyId)->price(), price, sizeof(price));
            format(message, sizeof(message),
                "This property, \"%s\" (Id:%d), costs %s. Use \"/property [Id]? price [1-500,000,000]\" to set the price.",
                Property(propertyId)->nameString(), propertyId, price);

            SendClientMessage(playerId, Color::Information, message);
            return 1;
        }

        new priceAmount = Command->integerParameter(params, 0);
        if (priceAmount <= 0 || priceAmount > Property::MaximumPropertyPrice) {
            SendClientMessage(playerId, Color::Information, "Usage: /property [Id]? price [1-500,000,000]");
            return 1;
        }

        Property(propertyId)->setPrice(priceAmount);
        Property(propertyId)->save();

        FinancialUtilities->formatPrice(priceAmount, price, sizeof(price));
        format(message, sizeof(message), "The price of the specified property, \"%s\" (Id:%d), has changed to %s.", 
            Property(propertyId)->nameString(), propertyId, price);
        SendClientMessage(playerId, Color::Success, message);

        format(message, sizeof(message), "%s (Id:%d) has set the price of property \"%s\" (Id:%d) to %s.",
            Player(playerId)->nicknameString(), playerId, Property(propertyId)->nameString(), propertyId, price);
        Admin(playerId, message);

        return 1;
    }

    /**
    * When a property is created it is not saved to the database by default. Using this command,
    * the property will save beyond the gamemode's session.
    *
    * @param playerId Id of the player typing the command.
    * @param propertyId Id of the specified property or the nearest property to the player.
    * @param params Any further text that the player passed to the command. Unused.
    * @command /property [Id]? save
    */
    @switch(PropertyCommand, "save")
    public onPropertySaveCommand(playerId, propertyId, params[]) {
        if (propertyId < 0 || propertyId >= MAX_PROPERTIES || !Property(propertyId)->isPropertySlotInUse()) {
            if (PropertyManager->currentPropertyIdForPlayer(playerId) == Property::InvalidId) {
                SendClientMessage(playerId, Color::Error,
                    "You should specify a valid property Id if you're not standing near a property!");
                return 1;
            } else propertyId = PropertyManager->currentPropertyIdForPlayer(playerId);
        }

        Property(propertyId)->save();

        new message[128];
        format(message, sizeof(message), "The specified property, \"%s\" (Id:%d) has been saved to the database.",
            Property(propertyId)->nameString(), propertyId);
        SendClientMessage(playerId, Color::Success, message);

        format(message, sizeof(message), "%s (Id:%d) has saved \"%s\" (Id:%d) to the database.",
            Player(playerId)->nicknameString(), playerId, Property(propertyId)->nameString(), propertyId);
        Admin(playerId, message);

        return 1;
        #pragma unused params
    }

    /**
    * Searching for property names or Ids can make it easier to find a property you're looking for.
    * This is the only /property command that is available for non-crew members as well.
    *
    * @param playerId Id of the player typing the command.
    * @param propertyId Id of the specified property or the nearest property to the player. Unused
    * @param params Any further text that the player passed to the command.
    * @command /property search [name/Id]
    */
    @switch(PropertyCommand, "search")
    public onPropertySearchCommand(playerId, propertyId, params[]) {
        if (!strlen(params)) {
            SendClientMessage(playerId, Color::Information, "Usage: /property search [name/Id]");
            return 1;
        }

        new message[128], payout[16], foundPropertyId = Property::InvalidId;
        if (IsNumeric(params)) {
            foundPropertyId = strval(params);
            if (foundPropertyId < 0 || foundPropertyId >= MAX_PROPERTIES
                || Property(foundPropertyId)->isPropertySlotInUse() == false) {
                SendClientMessage(playerId, Color::Error, "Invalid propertyId. See /properties for all properties.");
                return 1;
            }

            FinancialUtilities->formatPrice(Property(foundPropertyId)->earningsPercentage() *
                (Property(foundPropertyId)->price() / 100), payout, sizeof(payout));
            format(message, sizeof(message), "Property found: {FFFFFF}%s (Id:%d) - Earnings: %s",
                Property(foundPropertyId)->nameString(), foundPropertyId, payout);

            SendClientMessage(playerId, Color::Success, message);

            return 1;
        }

        if (strlen(params) < 3) {
            SendClientMessage(playerId, Color::Error, "Name too short, needs to be at least 3 characters.");
            return 1;
        }

        new matchedPropertyCount = 0;
        for (new propId = 0; propId < MAX_PROPERTIES; propId++) {
            if (matchedPropertyCount >= 5)
                break; // too much properties have already been found.

            if (Property(propId)->isPropertySlotInUse() == false)
                continue;

            if (strfind(Property(propId)->nameString(), params, true) == -1)
                continue;

            FinancialUtilities->formatPrice(Property(propId)->earningsPercentage() *
                (Property(propId)->price() / 100), payout, sizeof(payout));
            format(message, sizeof(message), "Property found: {FFFFFF}%s (Id:%d) - Earnings: %s",
                Property(propId)->nameString(), propId, payout);

            SendClientMessage(playerId, Color::Success, message);
            matchedPropertyCount++;
        }

        if (matchedPropertyCount == 0) {
            SendClientMessage(playerId, Color::Error, "No properties found.");
            return 1;
        }

        return 1;
        #pragma unused propertyId
    }

    /**
     * Display a dialog which lists the properties currently owned by the subject.
     *
     * @param playerId Id of the player who issued this command.
     * @param subjectId Id of the player who this command should be applied to.
     * @param params Any further text that the player passed to the command. Unused.
     * @command /p [player] properties
     * @command /my properties
     */
    @switch(PlayerCommand, "properties")
    public onPlayerPropertiesCommand(playerId, subjectId, params[]) {
        if (subjectId != playerId && Player(playerId)->isAdministrator() == false) 
            return 0;

        new properties[MAX_PROPERTIES], dialogCaption[64], dialogMessage[3000], payout[16];
        PropertyManager->getPropertiesForPlayer(subjectId, properties, sizeof(properties));

        if (properties[0] == Property::InvalidId) {
            if (subjectId != playerId)
                SendClientMessage(playerId, Color::Error, "This player doesn't own any properties.");
            else
                SendClientMessage(playerId, Color::Error, "You don't own any properties.");
            return 1;
        }

        format(dialogCaption, sizeof(dialogCaption), "Properties of %s (Id:%d) - Earnings",
            Player(subjectId)->nicknameString(), subjectId);

        for (new propertyIndex = 0; propertyIndex < sizeof(properties); propertyIndex++) {
            if (properties[propertyIndex] == Property::InvalidId)
                break; /* all properties have been listed */

            FinancialUtilities->formatPrice(Property(properties[propertyIndex])->earningsPercentage() *
                (Property(properties[propertyIndex])->price() / 100), payout, sizeof(payout));

            format(dialogMessage, sizeof(dialogMessage), "%s#%d %s - {FF8E02}%s\r\n", dialogMessage,
                properties[propertyIndex], Property(properties[propertyIndex])->nameString(), payout);
        }

        ShowPlayerDialog(playerId, PropertyManager::DialogId, DIALOG_STYLE_LIST, dialogCaption, dialogMessage, "Okay", "");

        return 1;
        #pragma unused params
    }

    // ---- PROPERTY COMMANDS FOR REGULAR PLAYERS --------------------------------------------------

    /**
     * If a player is standing near a property, he's given the option to buy it, if he's got enough
     * money. Once the property has been bought, the player will receive a certain amount of
     * earnings every few minutes.
     *
     * @param playerId Id of the player who typed the command.
     * @param params Any further text that the player passed to the command. Unused.
     * @command /buy
     */
    @command("buy")
    public onBuyCommand(playerId, params[]) {
        if (PropertyManager->currentPropertyIdForPlayer(playerId) == Property::InvalidId) {
            SendClientMessage(playerId, Color::Error, "You're not standing near any property!");
            return 1;
        }

        new propertyId = PropertyManager->currentPropertyIdForPlayer(playerId);
        if (GetPlayerMoney(playerId) < Property(propertyId)->price()) {
            SendClientMessage(playerId, Color::Error, "You don't have enough money to buy this property.");
            return 1;
        }

        new properties[MAX_PROPERTIES],
            numberOfPropertiesOwned = PropertyManager->getPropertiesForPlayer(playerId, properties, sizeof(properties)),
            propertyLimit = PropertyManager->propertyLimitForPlayer(playerId), message[256];
        if (numberOfPropertiesOwned >= propertyLimit) {
            format(message, sizeof(message), "You've reached your property limit of %d.", propertyLimit);
            SendClientMessage(playerId, Color::Error, message);

            if (Player(playerId)->isVip() == false)
                SendClientMessage(playerId, Color::Error, "VIPs are able to buy infinite properties. For more information, check out \"/donate\"!");

            return 1;
        }

        new availability[10], payback[15],
            time = Time->currentTime() - Property(propertyId)->propertyAvailability(),
            currentPropertyOwner = Property(propertyId)->ownerId();

        if (time < PropertyManager::PropertyAvailabilityAfterSale && currentPropertyOwner != Player::InvalidId) {
            Time->formatRemainingTime(PropertyManager::PropertyAvailabilityAfterSale - time,
                availability, sizeof(availability), true);

            format(message, sizeof(message),
                "This property has just been bought, it'll be available in {40CCFF}%s{FFFFFF} minutes!",
                availability);

            SendClientMessage(playerId, Color::Information, message);
            return 1;
        }

        if (Property(propertyId)->specialFeature() == HealthProtectionFeature) {
            new ownerId = Property(propertyId)->ownerId(), Float: propertyPosition[3];
            Property(propertyId)->positionVectors(propertyPosition[0], propertyPosition[1], propertyPosition[2]);

            if (ownerId != Player::InvalidId && IsPlayerInRangeOfPoint(ownerId, 80.0 /* range */,
                propertyPosition[0], propertyPosition[1], propertyPosition[2])) {
                SendClientMessage(playerId, Color::Error,
                    "This property has the protection feature! The current owner is too close, therefore the property has been locked.");

                return 1;
            }
        }

        if (currentPropertyOwner != Player::InvalidId) {
            FinancialUtilities->formatPrice((Property(propertyId)->price() / 100) * RefundPercentage, payback, sizeof(payback));
            format(message, sizeof(message), "Your property, \"%s\", has been bought by %s (Id:%d)! You received %s.",
                Property(propertyId)->nameString(), Player(playerId)->nicknameString(), playerId, payback);

            SendClientMessage(currentPropertyOwner, Color::Error, message);
            GivePlayerMoney(currentPropertyOwner, (Property(propertyId)->price() / 100) * RefundPercentage);  // XXXXXXXXXXXXXXXXXX Property Refunds
        }

        GivePlayerMoney(playerId, -Property(propertyId)->price());
        Property(propertyId)->setOwnerId(playerId);
        Property(propertyId)->setPropertyAvailability(Time->currentTime());
        Instrumentation->recordActivity(PropertyBoughtActivity, Property(propertyId)->price());

        new price[16];
        FinancialUtilities->formatPrice(Property(propertyId)->price(), price, sizeof(price));
        format(message, sizeof(message), "You've bought the property \"%s\" (Id:%d) for %s!",
            Property(propertyId)->nameString(), propertyId, price);
        SendClientMessage(playerId, Color::Success, message);

        format(message, sizeof(message), "~r~~h~%s~w~ has invested in the property: ~y~%s",
            Player(playerId)->nicknameString(), Property(propertyId)->nameString());
        NewsController->show(message);

        format(message, sizeof(message), "%d %s %s", Property(propertyId)->price(),
            Player(playerId)->nicknameString(), Property(propertyId)->nameString());
        IRC->broadcast(BuyPropertyIrcMessage, message);

        return 1;
        #pragma unused params
    }

    /**
     * Sell a certain property or all the properties which belong to the player. Upon selling a
     * property, the player receives a percent of the overall price of the properties he's sold.
     *
     * @param playerId Id of the player who typed the command.
     * @param params Any further text that the player passed to the command. Optional.
     * @command /sell [all/propertyId]?
     */
    @command("sell")
    public onSellCommand(playerId, params[]) {
        new currentPropertyId = PropertyManager->currentPropertyIdForPlayer(playerId);

        if (Command->parameterCount(params) == 0 && currentPropertyId == Property::InvalidId) {
            SendClientMessage(playerId, Color::Information, "Usage: /sell [all/propertyId]");
            return 1;
        }

        new message[128], earnings[16], parameterValue[4];
        Command->stringParameter(params, 0, parameterValue, sizeof(parameterValue));

        if (strcmp(parameterValue, "all", true) == 0 && strlen(parameterValue) > 0) {
            new playerProperties[MAX_PROPERTIES], overallPrice;

            PropertyManager->getPropertiesForPlayer(playerId, playerProperties, sizeof(playerProperties));
            if (playerProperties[0] == Property::InvalidId) {
                SendClientMessage(playerId, Color::Error, "You don't own any property to sell!");
                return 1;
            }

            for (new propertyIndex = 0; propertyIndex < sizeof(playerProperties); ++propertyIndex) {
                if (playerProperties[propertyIndex] == Property::InvalidId)
                    break; /* all properties have been sold */

                Property(playerProperties[propertyIndex])->setOwnerId(Player::InvalidId);
                Property(playerProperties[propertyIndex])->setPropertyAvailability(0);
                Instrumentation->recordActivity(PropertySoldActivity, Property(playerProperties[propertyIndex])->price());
                overallPrice += Property(playerProperties[propertyIndex])->price();
            }

            GivePlayerMoney(playerId, (overallPrice / 100) * Property::EarningOnPropertySellPercent);  // XXXXXXXXXXXXXXXXXX Properties Sell

            FinancialUtilities->formatPrice((overallPrice / 100) * Property::EarningOnPropertySellPercent, 
                earnings, sizeof(earnings));
            format(message, sizeof(message), "You've successfully sold all of your properties, and earned %s!", earnings);
            SendClientMessage(playerId, Color::Success, message);

            format(message, sizeof(message), "%d %s %s", playerId, Player(playerId)->nicknameString(), earnings);
            IRC->broadcast(SellAllPropertiesIrcMessage, message);

            return 1;
        }

        new propertyId = Command->integerParameter(params, 0);
        if (propertyId == -1) /* parameter not supplied */
            propertyId = currentPropertyId;

        if (propertyId < 0 || propertyId >= MAX_PROPERTIES || !Property(propertyId)->isPropertySlotInUse()) {
            if (PropertyManager->currentPropertyIdForPlayer(playerId) == Property::InvalidId) {
                SendClientMessage(playerId, Color::Error,
                    "You should specify a valid property to sell (or \"all\") if you're not standing near a property!");
                return 1;
            } else propertyId = currentPropertyId;
        }

        if (Property(propertyId)->ownerId() != playerId) {
            SendClientMessage(playerId, Color::Error, "You don't own this property!");
            return 1;
        }

        Property(propertyId)->setOwnerId(Player::InvalidId);
        Property(propertyId)->setPropertyAvailability(0);
        Instrumentation->recordActivity(PropertySoldActivity, Property(propertyId)->price());
        GivePlayerMoney(playerId, (Property(propertyId)->price() / 100) * Property::EarningOnPropertySellPercent);  // XXXXXXXXXXXXXXXXXX Properties Sell

        FinancialUtilities->formatPrice((Property(propertyId)->price() / 100) * Property::EarningOnPropertySellPercent, 
            earnings, sizeof(earnings));
        format(message, sizeof(message), "You've successfully sold the property \"%s\" (Id:%d) for %s!", Property(propertyId)->nameString(), propertyId, earnings);
        SendClientMessage(playerId, Color::Success, message);

        format(message, sizeof(message), "%d %s %s",
            Property(propertyId)->price(), Player(playerId)->nicknameString(), Property(propertyId)->nameString());
        IRC->broadcast(SellPropertyIrcMessage, message);

        return 1;
    }

    /**
     * Players can use the /properties command to get shown a list of 50 properties. With help of
     * buttons the previous/next 50 properties can be loaded depending on the page they're viewing.
     * The list is made up of: property Ids, names and owners.
     *
     * @param playerId Id of the player who issued this command.
     * @param params Any further text that the player passed to the command. Unused.
     * @command /properties
     */
    @command("properties")
    public onPropertiesCommand(playerId, params[]) {
        // We handle OnDialogResponse in the PropertyManager.
        ShowPlayerDialog(playerId, PropertyManager::DialogIdList, DIALOG_STYLE_TABLIST, "Property - Earnings - Owner",
            PropertyManager->assemblePropertyList(playerId), "Close", "50 >>>");

        return 1;
        #pragma unused params
    }
};
