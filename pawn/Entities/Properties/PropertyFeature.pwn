// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/**
 * Properties can have special features associated with them, which will be activated when they have
 * an owner. Each of these features needs to be documented in the PropertyManager class, and the
 * features they describe need to be implemented elsewhere in the code.
 *
 * @author Manuele "Kase" Macchia <kaseify@gmail.com>
 * @author Max "Cake" Blokker <cake@sa-mp.nl>
 */
enum PropertyFeature {
    // To be used when a property does not have a special feature. This is the default value of the
    // m_propertyFeature field in the Property class. This is exposed to users as "no-feature".
    NoPropertyFeature,

    // Grants owners of the property which curates this feature the ability to read conversations
    // happening in group and gang chats. This is exposed to users as "read-group-chat".
    ReadGroupConversationsFeature,

    // The owner of the property with this flag will get some money every time a player modifies
    // their vehicle, which could be a new paintjob or other modifications.
    VehicleModificationsFeature,

    // Owners of this property should be able to modify the so called 'custom tax' and have free
    // access themselves to the airport this property belongs to.
    CustomTaxAirportFeature,

    // LVP features a bombshop property, which will keep the owner up to date of every bomb sale
    // that is being made.
    BombshopFeature,

    // Buyers of this property will be able to keep track of teleports all around LVP, while having
    // the ability to teleport for free.
    FreeTeleportFeature,

    // Owners of the bank property are able to make money with so called loans: money borrowed by
    // players that has to be paid back with a certain interest. The property owner is able to change
    // this interest and keep track of every loan made.
    LoansFeature,

    // Bar owners will receive a certain amount of money for every drink a player bought.
    BarFeature,

    // LVP has one taxi company called: Kaufman Cabs. The owner of this company is able to change
    // the taxi price, have free taxi rides and track taxi usage of other players.
    TaxiCompanyFeature,

    // Owners of the police property receive money for every shot criminal.
    PoliceFeature,

    // Exporting players will let the owner of the export property receive money for every export.
    ExportFeature,

    // Owners of this property will receive a certain amount of armour every now and then.
    ArmourFeature,

    // Owners of this property will receive a certain amount of health every now and then.
    HealthFeature,

    // Owners of this property will receive a certain amount of weapons and ammo every now and then.
    WeaponsAmmoFeature,

    // Owners of this property will receive a certain amount of health every now and then. In
    // addition, if owners are nearby this property, nobody will be able to buy it from them.
    HealthProtectionFeature,

    // The following entry should be last, as it can be used to identify the number of special
    // property features which are available in Las Venturas Playground (plus one for no feature).
    PropertyFeatureCount,

    // This entry defines an invalid feature, and it is used in utility methods.
    InvalidPropertyFeature
};

class PropertyFeature {
    /**
     * Convert the given string to the property feature enum, if the string exactly matches a valid
     * special property feature.
     *
     * @param string String to match a special property feature.
     * @return PropertyFeature The matched property feature.
     */
    public PropertyFeature: stringToEnum(string[]) {
        if (!strcmp(string, "no-feature", false))
            return NoPropertyFeature;
        if (!strcmp(string, "read-group-chat", false))
            return ReadGroupConversationsFeature;
        if (!strcmp(string, "vehicle-modifications", false))
            return VehicleModificationsFeature;
        if (!strcmp(string, "customtax-airport", false))
            return CustomTaxAirportFeature;
        if (!strcmp(string, "bombshop", false))
            return BombshopFeature;
        if (!strcmp(string, "free-teleport", false))
            return FreeTeleportFeature;
        if (!strcmp(string, "loans", false))
            return LoansFeature;
        if (!strcmp(string, "bar", false))
            return BarFeature;
        if (!strcmp(string, "kaufman-cabs", false))
            return TaxiCompanyFeature;
        if (!strcmp(string, "police", false))
            return PoliceFeature;
        if (!strcmp(string, "export", false))
            return ExportFeature;
        if (!strcmp(string, "armour", false))
            return ArmourFeature;
        if (!strcmp(string, "health", false))
            return HealthFeature;
        if (!strcmp(string, "weapons-ammo", false))
            return WeaponsAmmoFeature;
        if (!strcmp(string, "health-protection", false))
            return HealthProtectionFeature;

        return InvalidPropertyFeature;
    }

    /**
     * Convert the given property feature to a string, and store it in the buffer.
     *
     * @param feature Property feature to be converted to a string.
     * @param buffer String to store the property feature in.
     * @param bufferSize Size of the string to store the property feature in.
     */
    public enumToString(PropertyFeature: feature, buffer[], bufferSize) {
        switch (feature) {
            case NoPropertyFeature: strins(buffer, "no-feature", 0, bufferSize);
            case ReadGroupConversationsFeature: strins(buffer, "read-group-chat", 0, bufferSize);
            case VehicleModificationsFeature: strins(buffer, "vehicle-modifications", 0, bufferSize);
            case CustomTaxAirportFeature: strins(buffer, "customtax-airport", 0, bufferSize);
            case BombshopFeature: strins(buffer, "bombshop", 0, bufferSize);
            case FreeTeleportFeature: strins(buffer, "free-teleport", 0, bufferSize);
            case LoansFeature: strins(buffer, "loans", 0, bufferSize);
            case BarFeature: strins(buffer, "bar", 0, bufferSize);
            case TaxiCompanyFeature: strins(buffer, "kaufman-cabs", 0, bufferSize);
            case PoliceFeature: strins(buffer, "police", 0, bufferSize);
            case ExportFeature: strins(buffer, "export", 0, bufferSize);
            case ArmourFeature: strins(buffer, "armour", 0, bufferSize);
            case HealthFeature: strins(buffer, "health", 0, bufferSize);
            case WeaponsAmmoFeature: strins(buffer, "weapons-ammo", 0, bufferSize);
            case HealthProtectionFeature: strins(buffer, "health-protection", 0, bufferSize);
        }
    }
};
