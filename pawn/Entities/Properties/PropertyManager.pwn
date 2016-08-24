// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/**
 * In order to create a reasonable balance between prices of properties in the region, bubbling of
 * property related events and controlling any special features properties may have, the property
 * manager owns and controls all individual real estate opportunities.
 *
 * @author Russell Krupke <russell@sa-mp.nl>
 */
class PropertyManager {
    // What is the dialog Id to be used across the properties dialogs?
    public const DialogId = @counter(OnDialogResponse);

    // What is the dialog Id to be used with the /properties list?
    public const DialogIdList = @counter(OnDialogResponse);

    // We are a category of pickups and thus need to have our own Id with the pickup controller, in
    // order to make sure that we only get pickup notifications for ones we own.
    public const PickupHandlerId = @counter(PickupHandler);

    // How many seconds should the fresh owner of a property be able to enjoy the earnings?
    public const PropertyAvailabilityAfterSale = 600;

    // After how many seconds should the owners of properties get paid for owning them? We process
    // all properties at once, so it's possible that owners get paid right after buying it.
    //
    // NOTE: Please update the announcement in Announcements::announcePropertyTycoon if you change
    // this value, as it refers to duration in the message.
    const PropertyPayoutCycleDuration = 180;

    // How many properties can a normal player own at the same time?
    const MaximumPropertiesForNormalPlayer = 25;

    // A map to find the property associated with a special feature with O(1) complexity.
    new m_featureToPropertyMap[PropertyFeature];

    // A map to find the property which a player is currently standing at with O(1) complexity.
    new m_propertyForPlayer[MAX_PLAYERS];

    // When was the last property pay-out cycle?
    new m_lastPropertyPayoutCycle = 0;

    // Keep track of the page number a player requested when using /properties.
    new m_propertyListPage[MAX_PLAYERS] = 0;

    // Id of the player who currently is the Property Tycoon.
    new m_propertyTycoonId = Player::InvalidId;

    // The amount of money they made in a single payment-cycle whilst being Property Tycoon.
    new m_propertyTycoonAmount = 0;

    // ---- MAIN FUNCTIONS REGARDING PROPERTY MANAGEMENT -------------------------------------------

    /**
     * Initializes the special feature to property map in this class, by setting all property Ids
     * to Invalid Properties. This makes sure propertyForSpecialFeature() doesn't break. We then
     * request the property storage manager to read all properties from the database.
     */
    public __construct() {
        for (new featureId = 0; featureId < sizeof(m_featureToPropertyMap); ++featureId)
            m_featureToPropertyMap[PropertyFeature: featureId] = Property::InvalidId;

        PropertyStorageManager->requestPropertiesFromDatabase();
        m_lastPropertyPayoutCycle = Time->currentTime();
    }

    /**
     * Creates a new property with the given settings in the world of San Andreas. If no available
     * property slot could be found, this method will abort and return an invalid property Id.
     *
     * @param name Name of the property, may be 31 characters long at most.
     * @param price Base price of this property, in dollars.
     * @param earningsPercentage Percentage of the price the owner will earn per few minutes.
     * @param positionX X-coordinate in the main world where this property is located.
     * @param positionX X-coordinate in the main world where this property is located.
     * @param positionX X-coordinate in the main world where this property is located.
     * @return boolean Whether the new property has been created.
     */
    public create(name[], price, earningsPercentage, Float: positionX, Float: positionY, Float: positionZ, interiorId) {
        new propertyId = Property::InvalidId;
        for (new currentPropertyId = 0; currentPropertyId < MAX_PROPERTIES; ++currentPropertyId) {
            if (Property(currentPropertyId)->isPropertySlotInUse())
                continue;

            propertyId = currentPropertyId;
            break;
        }

        if (propertyId == Property::InvalidId)
            return Property::InvalidId; // no property slot available.

        Property(propertyId)->initialize(name, price, earningsPercentage, positionX, positionY, positionZ, interiorId);

        return propertyId;
    }

    /**
     * When a player touches a property icon, we need to indicate to them that it's possible to use
     * property commands now. We also mark them as standing at that property, so the optional Id
     * parameter for the /property commands is no longer required.
     *
     * @param playerId Id of the player who just entered an icon.
     * @param pickupId Id of the pickup which they're touching.
     * @param propertyId Id of the property associated with this icon.
     */
    @switch(OnPlayerEnterPickup, PropertyManager::PickupHandlerId)
    public onPlayerEnterPropertyPickup(playerId, pickupId, propertyId) {
        if (propertyId < 0 || propertyId >= MAX_PROPERTIES || Property(propertyId)->isPropertySlotInUse() == false)
            return;

        this->announcePlayerStandingAtProperty(playerId, propertyId);
        m_propertyForPlayer[playerId] = propertyId;

        #pragma unused pickupId
    }

    /**
     * After a player leaves the property icon again, we'll get another notification from the pickup
     * controller at which we make sure that they're no longer marked as standing at a property.
     *
     * @param playerId Id of the player who just left an icon.
     * @param pickupId Id of the pickup which they were previously touching.
     * @parma propertyId Id of the property associated with this icon.
     */
    @switch(OnPlayerLeavePickup, PropertyManager::PickupHandlerId)
    public onPlayerLeavePropertyIcon(playerId, pickupId, propertyId) {
        m_propertyForPlayer[playerId] = Property::InvalidId;
        #pragma unused pickupId, propertyId
    }

    /**
     * Quickly retrieve the Id of the property the player is currently standing at, if any.
     *
     * @param playerId Id of the player to get the current property Id for.
     * @return integer Id of the property they're standing at, or Property::InvalidId.
     */
    public inline currentPropertyIdForPlayer(playerId) {
        return (m_propertyForPlayer[playerId]);
    }

    /**
     * Reset the Id of the property the player is currently standing at, in case the player stood on
     * one if the property got deleted.
     *
     * @param playerId Id of the player to reset the current property Id for.
     */
    public resetPropertyIdForPlayer(playerId) {
        m_propertyForPlayer[playerId] = Property::InvalidId;
    }

    /**
     * Check whether the PropertySavedStateController will be able to load the previously owned
     * properties of this player when they re-connect to the server. This will ensure that players
     * don't loose their property information when they have a crash or timeout.
     *
     * @param playerId Id of the player who just connected to the server.
     */
    @list(OnPlayerConnect)
    public onPlayerConnect(playerId) {
        m_propertyForPlayer[playerId] = Property::InvalidId;
        m_propertyListPage[playerId] = 0;

        new propertiesOwnedByPlayer[MAX_PROPERTIES];
        if (PropertySavedStateController->retrieveForPlayer(playerId, propertiesOwnedByPlayer) == false)
            return;

        new propertyIndex = 0, propertiesRestored = 0, propertyId;
        while (propertiesOwnedByPlayer[propertyIndex] != Property::InvalidId) {
            propertyId = propertiesOwnedByPlayer[propertyIndex++];
            if (Property(propertyId)->ownerId() != Player::InvalidId)
                continue; // this property is now owned by another player.

            Property(propertyId)->setOwnerId(playerId);
            ++propertiesRestored;
        }

        if (propertiesRestored > 0)
            this->announcePropertiesRestoredForPlayer(playerId, propertiesRestored);
    }

    /**
     * When a player disconnects from Las Venturas Playground, we need to free up all the properties
     * they previously owned. The previously owned properties will be stored in a Property Saved
     * State Controller allowing them to be re-assigned if the player reconnects in a short period
     * of time, to make sure that they survive crashes and timeouts.
     *
     * @param playerId Id of the player who disconnected from the server.
     */
    @list(OnPlayerDisconnect)
    public onPlayerDisconnect(playerId) {
        m_propertyForPlayer[playerId] = Property::InvalidId;

        if (m_propertyTycoonId == playerId) {
            m_propertyTycoonId = Player::InvalidId;
            m_propertyTycoonAmount = 0;
        }

        new propertiesOwnedByPlayer[MAX_PROPERTIES];
        if (this->getPropertiesForPlayer(playerId, propertiesOwnedByPlayer, sizeof(propertiesOwnedByPlayer)) == 0)
            return; // this player doesn't have properties, there's nothing to store.

        PropertySavedStateController->storeForPlayer(playerId, propertiesOwnedByPlayer);

        // Set the owner of this player's properties to Player::InvalidId.
        for (new propertyId = 0; propertyId < MAX_PROPERTIES; ++propertyId) {
            if (Property(propertyId)->isPropertySlotInUse() == false)
                continue; // this property slot is not in use.

            if (Property(propertyId)->ownerId() != playerId)
                continue; // this property is not owned by the given player.

            Property(propertyId)->setOwnerId(Player::InvalidId);
        }
    }

    /**
     * When someone owns a property, they would of course like to get paid. This method gets called
     * every ten seconds, and we iterate through all properties and decide how much owners should
     * get paid. A separate announcement will be fired to tell the players.
     */
    @list(TenSecondTimer)
    public processPropertyPayCycle() {
        if (Time->currentTime() < (m_lastPropertyPayoutCycle + PropertyPayoutCycleDuration))
            return 0;

        m_lastPropertyPayoutCycle = Time->currentTime();

        new payoutAmount[MAX_PLAYERS], bool: needPayoutCycle = false;
        for (new currentPropertyId = 0; currentPropertyId < MAX_PROPERTIES; ++currentPropertyId) {
            if (Property(currentPropertyId)->isPropertySlotInUse() == false)
                continue; // this property is not in use.

            if (Property(currentPropertyId)->ownerId() == Player::InvalidId)
                continue; // no one owns this property.

            payoutAmount[Property(currentPropertyId)->ownerId()] +=
                Property(currentPropertyId)->earningsPercentage() * (Property(currentPropertyId)->price() / 100);
            needPayoutCycle = true;
        }

        if (needPayoutCycle == false)
            return 0;

        // The Property Tycoon is the player who is benefiting most from the property system. Their
        // name will be announced if it changes from the last pay-out cycle.
        new tycoonId = Player::InvalidId,
            tycoonAmount = 0;

        new message[128];

        // Now iterate through all the players and give them their money if they're entitled to any.
        for (new playerId = 0; playerId <= PlayerManager->highestPlayerId(); ++playerId) {
            if (payoutAmount[playerId] == 0)
                continue; // this player doesn't own any properties.

            if (payoutAmount[playerId] > tycoonAmount) {
                tycoonId = playerId;
                tycoonAmount = payoutAmount[playerId];
            }

            // Players with a normal bank account, or who disabled receiving earnings in their bank
            // account, will receive the earnings in cash.
            if (BankAccount(playerId)->type() != PremierBankAccount || PlayerSettings(playerId)->areEarningsToBankAccountDisabled() == true) {
                GivePlayerMoney(playerId, payoutAmount[playerId]);

                format(message, sizeof(message),
                    "You have earned {40CCFF}$%s{FFFFFF} with your properties, which you've now received as cash.",
                    formatPrice(payoutAmount[playerId]));
                SendClientMessage(playerId, Color::Information, message);

                continue;
            }

            // Players with a Premier bank account will have the money deposited in their bank account
            // automatically, but again with a certain percentage of costs for the bank.
            new actualPayout = Math->round(float(payoutAmount[playerId]) * (100.0 - BankAccount::PremierDepositTransactionCostPercentage) / 100.0);
            if (BankAccount(playerId)->availableBalance() >= actualPayout) {
                // The player has sufficient balance available to receive this sum on their bank.
                BankAccount(playerId)->setBalance(BankAccount(playerId)->balance() + actualPayout);

                format(message, sizeof(message),
                    "You have earned {40CCFF}$%s{FFFFFF} with your properties, which has been deposited into your bank account.",
                    formatPrice(payoutAmount[playerId]));
                SendClientMessage(playerId, Color::Information, message);

                format(message, sizeof(message),
                    "The bank has taken {40CCFF}%.0f%%{FFFFFF} commission because of your Premier account.",
                    BankAccount::PremierDepositTransactionCostPercentage);
                SendClientMessage(playerId, Color::Information, message);

            } else {
                // The player's bank account is full or does not have enough balance available
                // to receive this sum. Give it to the player instead.
                GivePlayerMoney(playerId, payoutAmount[playerId]);

                format(message, sizeof(message),
                    "You have earned {40CCFF}$%s{FFFFFF} with your properties. We tried to deposit this into your bank account,",
                    formatPrice(payoutAmount[playerId]));
                SendClientMessage(playerId, Color::Information, message);
                SendClientMessage(playerId, Color::Information,
                    "but your account does not allow for thus sum to be stored. You've received it in cash instead.");
            }
        }

        if (m_propertyTycoonAmount < tycoonAmount) {
            m_propertyTycoonAmount = tycoonAmount;

            if (m_propertyTycoonId != tycoonId) {
                m_propertyTycoonId = tycoonId;

                // Announce the new property tycoon to all other players.
                Announcements->announcePropertyTycoon(tycoonId, tycoonAmount);
            }
        }

        return 1;
    }

    /**
     * This method gets called when a player is standing at a property. We should offer them an
     * overview of what they can do with the property.
     *
     * @param playerId Id of the player who's standing at a property.
     * @param propertyId Id of the property which they're standing at.
     */
    private announcePlayerStandingAtProperty(playerId, propertyId) {
        new notice[256], price[15], payout[15];

        // Format a line of property information.
        FinancialUtilities->formatPrice(Property(propertyId)->price(), price, sizeof(price));
        FinancialUtilities->formatPrice(Property(propertyId)->earningsPercentage() * (Property(propertyId)->price() / 100),
            payout, sizeof(payout));

        format(notice, sizeof(notice), "{FF8C13}%s{FFFFFF} (%d){33AA33} - Price: {FFFFFF}%s{33AA33} - Income: {FFFFFF}%s",
            Property(propertyId)->nameString(), propertyId, price, payout);
        SendClientMessage(playerId, Color::Success, notice);

        if (Property(propertyId)->ownerId() == playerId) {
            new sellPrice[16];
            FinancialUtilities->formatPrice(Property::EarningOnPropertySellPercent *
                (Property(propertyId)->price() / 100), sellPrice, sizeof(sellPrice));
            format(notice, sizeof(notice),
                "You're the owner of this property! If you want to sell it for {40CCFF}%s{FFFFFF}, use {26BB16}/sell{FFFFFF}.",
                sellPrice);

        } else if (Property(propertyId)->ownerId() != Player::InvalidId) {
            new ownerId = Property(propertyId)->ownerId(), availabilityTime[10];

            if (Time->currentTime() - Property(propertyId)->propertyAvailability() > PropertyManager::PropertyAvailabilityAfterSale)
                format(notice, sizeof(notice),
                    "This property is currently owned by %s (Id:%d). Wanna buy it? Use {26BB16}/buy{FFFFFF}.", 
                    Player(ownerId)->nicknameString(), ownerId);

            else { /* property not available yet */
                Time->formatRemainingTime(PropertyManager::PropertyAvailabilityAfterSale - (Time->currentTime()
                    - Property(propertyId)->propertyAvailability()), availabilityTime, sizeof(availabilityTime), true);
                format(notice, sizeof(notice),
                    "This property is currently owned by %s (Id:%d). It'll be available in {40CCFF}%s{FFFFFF} minutes.", 
                    Player(ownerId)->nicknameString(), ownerId, availabilityTime);
            }
        } else // no one owns this property
            format(notice, sizeof(notice), "This property is available for sale! Wanna buy it? Use {26BB16}/buy{FFFFFF}.");

        SendClientMessage(playerId, Color::Information, notice);
        PlayerPlaySound(playerId, 1058, 0, 0, 0);
    }

    /**
     * When a player connects to Las Venturas Playground, we check whether we have any stored
     * properties for their nickname and IP address combination. This allows them to reconnect
     * after a time-out without loosing all their properties.
     *
     * @param playerId Id of the player for whom we were able to restore properties.
     * @param propertiesRestored Number of properties which were restored.
     */
    private announcePropertiesRestoredForPlayer(playerId, propertiesRestored) {
        new notice[128];

        format(notice, sizeof(notice),
            "Since you reconnected within {40CCFF}10 minutes{FFFFFF}, we were able to restore {40CCFF}%d {FFFFFF}of your properties!",
            propertiesRestored);
        SendClientMessage(playerId, Color::Information, notice);

        Instrumentation->recordActivity(PropertiesRestoredActivity, propertiesRestored);
    }

    // ---- GETTERS AND SETTERS REGARDING PROPERTY MANAGEMENT --------------------------------------

    /**
     * Returns the maximum number of properties a certain player can own. This is different for very
     * important players as opposed to normal players, given that Las Venturas Playground intends
     * to give them additional benefits.
     *
     * @param playerId Id of the player to check the limit for.
     * @return integer Maximum number of properties they can own.
     */
    public propertyLimitForPlayer(playerId) {
        if (Player(playerId)->isVip() == true || Player(playerId)->isAdministrator() == true)
            return MAX_PROPERTIES;

        return MaximumPropertiesForNormalPlayer;
    }

    /**
     * Stores the properties owned by the given player in the passed properties array. When no more
     * properties can be found, the next slot will be filled with Property::InvalidId. There will
     * *always* be a slot filled with Property::InvalidId, so the properties[] array's size should
     * be the player's property limit + 1.
     *
     * @param playerId Id of the player to retrieve the properties for.
     * @param properties Array to store the properties in.
     * @param sizeofProperties Maximum properties which can be stored in the properties array.
     * @return integer The number of properties which are owned by this player.
     */
    public getPropertiesForPlayer(playerId, properties[], sizeofProperties) {
        new propertiesForPlayer = 0;
        for (new propertyId = 0; propertyId < MAX_PROPERTIES; ++propertyId) {
            if (Property(propertyId)->isPropertySlotInUse() == false)
                continue; // this property slot is not in use.

            if (Property(propertyId)->ownerId() != playerId)
                continue; // this property is not owned by the given player.

            if (propertiesForPlayer < (sizeofProperties - 1))
                properties[propertiesForPlayer] = propertyId;

            ++propertiesForPlayer;
        }

        // There should always be an entry with Property::InvalidId in this array.
        properties[min(sizeofProperties - 1, propertiesForPlayer)] = Property::InvalidId;

        return propertiesForPlayer;
    }

    /**
     * Returns the property Id which has been associated with a certain extra feature. Based on this
     * Id it's possible to query the Property class for its name, price and owner.
     *
     * @param feature The feature for which we'd like to know the associated property.
     * @return integer Id of the property which "owns" this feature.
     */
    public propertyForSpecialFeature(PropertyFeature: feature) {
        return m_featureToPropertyMap[feature];
    }

    /**
     * Register that a special feature is now owned by the given property, identified by its Id. Any
     * former property which owned this feature will no longer be considered.
     *
     * @param propertyId Id of the property to register the special feature for.
     * @param feature The special feature to be associated with that property.
     */
    public registerPropertyForSpecialFeature(propertyId, PropertyFeature: feature) {
        if (feature == NoPropertyFeature)
            return;

        m_featureToPropertyMap[feature] = propertyId;
    }

    /**
     * Provides access to the pickup handler Id of the property manager, to which the relevant
     * pickup notifications will be distributed.
     *
     * @return integer The handler Id we've got available for the pickup controller.
     */
    public pickupHandlerId() {
        return PropertyManager::PickupHandlerId;
    }

    /**
     * On regular occasions we'll have to update the 3D textlabel for a property. Think of:
     * new price/earning settings by crew and new ownership.
     *
     * @param propertyId Id of the property to update the 3D textlabel for.
     * @param labelId Id of the property's textlabel.
     */
    public update3DTextLabel(propertyId, Text3D: labelId) {
        new price[15], payout[15], ownerId = Property(propertyId)->ownerId(), textLabel[256];

        // Format the price and income to a correct value.
        FinancialUtilities->formatPrice(Property(propertyId)->price(), price, sizeof(price));
        FinancialUtilities->formatPrice(Property(propertyId)->earningsPercentage()
            * (Property(propertyId)->price() / 100), payout, sizeof(payout));

        if (ownerId == Player::InvalidId) { // The ownerId equals Player::InvalidId meaning this property is for sale.
            format(textLabel, sizeof(textLabel),
                "{%s}%s{FFFFFF} (%d){33AA33}\r\n[ Price: {FFFFFF}%s{33AA33} ]\r\n[ Income: {FFFFFF}%s{33AA33} every 3 minutes ]\r\n[ Owner: {FFFFFF}none{33AA33} ]",
                (Property(propertyId)->specialFeature() == TotalEpicFailureFeature ? "DC143C" : "FF8C13"),
                Property(propertyId)->nameString(), propertyId, price, payout);
        } else { // The property has an owner!
            format(textLabel, sizeof(textLabel),
                "{%s}%s{FFFFFF} (%d){33AA33}\r\n[ Price: {FFFFFF}%s{33AA33} ]\r\n[ Income: {FFFFFF}%s{33AA33} every 3 minutes ]\r\n[ Owner: {FFFFFF}%s{33AA33} ]",
                (Property(propertyId)->specialFeature() == TotalEpicFailureFeature ? "DC143C" : "FF8C13"),
                Property(propertyId)->nameString(), propertyId, price, payout, Player(ownerId)->nicknameString());
        }

        Update3DTextLabelText(labelId, Color::PropertyTextLabel, textLabel);
    }

    /**
     * TEF is a cool guy. We like him. Players like him. What players also like, is to hunt for
     * his property. He hides it, and they get to find it. Let's make it more challenging by
     * (almost) hiding the 3D text label above the TEF property!
     *
     * @param propertyId Id of the property to update the 3D textlabel for.
     * @param labelId Id of the property's textlabel.
     */
    public update3DTextLabelTEF(propertyId, Text3D: labelId) {
        new Float: propertyPosition[3], price[15], payout[15], ownerId = Property(propertyId)->ownerId(),
            textLabel[256], Text3D: newLabelId = Text3D: INVALID_3DTEXT_ID;

        Property(propertyId)->positionVectors(propertyPosition[0], propertyPosition[1], propertyPosition[2]);

        // Format the price and income to a correct value.
        FinancialUtilities->formatPrice(Property(propertyId)->price(), price, sizeof(price));
        FinancialUtilities->formatPrice(Property(propertyId)->earningsPercentage()
            * (Property(propertyId)->price() / 100), payout, sizeof(payout));

        if (ownerId == Player::InvalidId) { // The ownerId equals Player::InvalidId meaning this property is for sale.
            format(textLabel, sizeof(textLabel),
                "{DC143C}%s{FFFFFF} (%d){33AA33}\r\n[ Price: {FFFFFF}%s{33AA33} ]\r\n[ Income: {FFFFFF}%s{33AA33} every 3 minutes ]\r\n[ Owner: {FFFFFF}none{33AA33} ]",
                Property(propertyId)->nameString(), propertyId, price, payout);
        } else { // The property has an owner!
            format(textLabel, sizeof(textLabel),
                "{DC143C}%s{FFFFFF} (%d){33AA33}\r\n[ Price: {FFFFFF}%s{33AA33} ]\r\n[ Income: {FFFFFF}%s{33AA33} every 3 minutes ]\r\n[ Owner: {FFFFFF}%s{33AA33} ]",
                Property(propertyId)->nameString(), propertyId, price, payout, Player(ownerId)->nicknameString());
        }

        // Delete the old label and create the new one.
        Delete3DTextLabel(labelId);
        newLabelId = Create3DTextLabel(textLabel, Color::PropertyTextLabel, propertyPosition[0], propertyPosition[1],
            propertyPosition[2] + 1 /* float above the property pickup */, 4 /* draw distance */, 0 /* main world */, 1);

        Property(propertyId)->setLabelId(newLabelId);
    }

    // ---- SUPPORTIVE FUNCTIONS REGARDING PROPERTY MANAGEMENT -------------------------------------

    /**
     * Assemble a list of properties depending on the page number requested. We list the property Id,
     * name and owner.
     *
     * @param pageNumber Number of the page the /properties list should show.
     */
    public assemblePropertyList(playerId) {
        new propertiesList[3452],
            pageNumber = m_propertyListPage[playerId],
            maxProperties = (pageNumber * 50) + 50,
            propertyId = pageNumber * 50,
            property[Property::MaximumNameLenght+1],
            payout[16],
            ownerId,
            owner[MAX_PLAYER_NAME+1];

        if (pageNumber == (MAX_PROPERTIES / 50) - 1)
            maxProperties = MAX_PROPERTIES - 1; /* 400 properties: 0 - 399 */

        for (; propertyId <= maxProperties; propertyId++) {
            format(owner, sizeof(owner), "-");

            if (Property(propertyId)->isPropertySlotInUse() == false) {
                format(property, sizeof(property), "FREE-SLOT");
                FinancialUtilities->formatPrice(0, payout, sizeof(payout));
            } else {
                format(property, sizeof(property), "%s", Property(propertyId)->nameString());

                ownerId = Property(propertyId)->ownerId();
                if (ownerId != Player::InvalidId)
                    format(owner, sizeof(owner), "%s", Player(ownerId)->nicknameString());

                FinancialUtilities->formatPrice(Property(propertyId)->earningsPercentage() *
                    (Property(propertyId)->price() / 100), payout, sizeof(payout));
            }

            if (propertyId == pageNumber * 50)
                format(propertiesList, sizeof(propertiesList),
                    "Id\tName\tEarnings\tOwner\r\n#%d\t%s\t{FF8E02}%s\t{FFFFFF}%s\r\n",
                    propertyId, property, payout, owner);
            else
                format(propertiesList, sizeof(propertiesList), "%s#%d\t%s\t{FF8E02}%s\t{FFFFFF}%s\r\n",
                    propertiesList, propertyId, property, payout, owner);
        }

        return propertiesList;
    }

    /**
     * Depending on the buttom clicked when a player used /properties, we can 1) close the dialog,
     * 2) show the next 50 properties or 3) show the previous properties.
     *
     * @param playerId Id of the player who is scrolling the properties list.
     * @param button The button which was clicked, see the DialogButton enumeration.
     * @param listItem Index of the selected item in the list, which starts at zero.
     * @param inputText The text which was inserted, if any.
     * @return integer Were we able to correctly handle this callback?
     */
    @switch(OnDialogResponse, PropertyManager::DialogIdList)
    public onDialogResponse(playerId, DialogButton: response, listItem, inputText[]) {
        if (response == LeftButton && m_propertyListPage[playerId] == 0) {
            m_propertyListPage[playerId] = 0;
            return 1; /* dialog closed */
        } else if (response == LeftButton && m_propertyListPage[playerId] != 0) {
            m_propertyListPage[playerId]--;

            if (m_propertyListPage[playerId] == 0)
                ShowPlayerDialog(playerId, PropertyManager::DialogIdList, DIALOG_STYLE_TABLIST, "Properties",
                    this->assemblePropertyList(playerId), "Close", "50 >>>");
            else
                ShowPlayerDialog(playerId, PropertyManager::DialogIdList, DIALOG_STYLE_TABLIST, "Properties",
                    this->assemblePropertyList(playerId), "<<< 50", "50 >>>");

            return 1; /* previous 50 properties loaded */
        }

        if (response == RightButton && m_propertyListPage[playerId] == (MAX_PROPERTIES / 50) - 1) {
            m_propertyListPage[playerId] = 0;
            return 1; /* dialog closed */
        } else if (response == RightButton && m_propertyListPage[playerId] != (MAX_PROPERTIES / 50) - 1) {
            m_propertyListPage[playerId]++;

            if (m_propertyListPage[playerId] == (MAX_PROPERTIES / 50) - 1)
                ShowPlayerDialog(playerId, PropertyManager::DialogIdList, DIALOG_STYLE_TABLIST, "Properties",
                    this->assemblePropertyList(playerId), "<<< 50", "Close");
            else
                ShowPlayerDialog(playerId, PropertyManager::DialogIdList, DIALOG_STYLE_TABLIST, "Properties",
                    this->assemblePropertyList(playerId), "<<< 50", "50 >>>");

            return 1; /* next 50 properties loaded */
        }

        m_propertyListPage[playerId] = 0;

        return 1;
        #pragma unused listItem, inputText
    }
};
