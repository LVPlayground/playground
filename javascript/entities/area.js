// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// An area represents an area in the world of San Andreas. It can have a variety of sizes, exist in
// all or a portion of {interiors, virtual worlds}, and will trigger events when a player enters or
// leaves the area. Players can be in any number of areas at once.
export class Area {
    // Id to represent an invalid area. Maps to INVALID_STREAMER_ID, which is (0).
    static kInvalidId = 0;

    // Types of areas that can be represented on the server.
    static kTypeCircle = 0;
    static kTypeCube = 1;
    static kTypeCylinder = 3;
    static kTypePolygon = 4;
    static kTypeRectangle = 5;
    static kTypeSphere = 6;

    #id_ = null;
    #manager_ = null;
    #observers_ = null;
    #type_ = null;

    #typeOptions_ = null;
    #virtualWorlds_ = null;
    #interiors_ = null;
    #players_ = null;

    constructor(manager) {
        this.#manager_ = manager;
        this.#observers_ = new Set();
    }

    // Initializes the area on the server. The appropriate create{$type}Internal() method will be
    // called by this function to create the actual area with the streamer plugin.
    initialize(type, typeOptions, options) {
        this.#type_ = type;

        this.#typeOptions_ = typeOptions;
        this.#virtualWorlds_ = options.virtualWorlds;
        this.#interiors_ = options.interiors;
        this.#players_ = options.players;

        switch (type) {
            case Area.kTypeCircle:
                this.#id_ = this.createCircularAreaInternal(...typeOptions);
                break;

            case Area.kTypeCube:
                this.#id_ = this.createCubicalAreaInternal(...typeOptions);
                break;

            case Area.kTypeCylinder:
                this.#id_ = this.createCylindricalAreaInternal(...typeOptions);
                break;

            case Area.kTypePolygon:
                this.#id_ = this.createPolygonalAreaInternal(...typeOptions);
                break;

            case Area.kTypeRectangle:
                this.#id_ = this.createRectangularAreaInternal(...typeOptions);
                break;

            case Area.kTypeSphere:
                this.#id_ = this.createSphericalAreaInternal(...typeOptions);
                break;

            default:
                throw new Error('Invalid area type given: ' + type);
        }

        if (this.#id_ === Area.kInvalidId)
            throw new Error('Unable to create the area on the server.');
    }

    // Creates each of the named areas on the server. May be overridden for testing.
    createCircularAreaInternal(center, radius) {
        return pawnInvoke('CreateDynamicCircleEx', 'fffaaaiiii',
            /* x= */ center.x,
            /* y= */ center.y,
            /* size= */ radius,
            /* worlds= */ this.#virtualWorlds_,
            /* interiors= */ this.#interiors_,
            /* players= */ this.#players_,
            /* priority= */ 0,
            /* maxworlds= */ this.#virtualWorlds_.length,
            /* maxinteriors= */ this.#interiors_.length,
            /* maxplayers= */ this.#players_.length);
    }

    createCubicalAreaInternal(rectangle, minimumZ, maximumZ) {
        return pawnInvoke('CreateDynamicCubeEx', 'ffffffaaaiiii',
            /* minx= */ rectangle.minX,
            /* miny= */ rectangle.minY,
            /* minz= */ minimumZ,
            /* maxx= */ rectangle.maxX,
            /* maxy= */ rectangle.maxY,
            /* maxz= */ maximumZ,
            /* worlds= */ this.#virtualWorlds_,
            /* interiors= */ this.#interiors_,
            /* players= */ this.#players_,
            /* priority= */ 0,
            /* maxworlds= */ this.#virtualWorlds_.length,
            /* maxinteriors= */ this.#interiors_.length,
            /* maxplayers= */ this.#players_.length);
    }

    createCylindricalAreaInternal(center, radius, minimumZ, maximumZ) {
        return pawnInvoke('CreateDynamicCylinderEx', 'fffffaaaiiii',
            /* x= */ center.x,
            /* y= */ center.y,
            /* minz= */ minimumZ,
            /* maxz= */ maximumZ,
            /* size= */ radius,
            /* worlds= */ this.#virtualWorlds_,
            /* interiors= */ this.#interiors_,
            /* players= */ this.#players_,
            /* priority= */ 0,
            /* maxworlds= */ this.#virtualWorlds_.length,
            /* maxinteriors= */ this.#interiors_.length,
            /* maxplayers= */ this.#players_.length);
    }

    createPolygonalAreaInternal(points, minimumZ, maximumZ) {
        const flatPoints = points.flat(Infinity);

        return pawnInvoke('CreateDynamicPolygonEx', 'affiaaaiiii',
            /* points= */ flatPoints,
            /* minz= */ minimumZ,
            /* maxz= */ maximumZ,
            /* maxpoints= */ flatPoints.length,
            /* worlds= */ this.#virtualWorlds_,
            /* interiors= */ this.#interiors_,
            /* players= */ this.#players_,
            /* priority= */ 0,
            /* maxworlds= */ this.#virtualWorlds_.length,
            /* maxinteriors= */ this.#interiors_.length,
            /* maxplayers= */ this.#players_.length);
    }

    createRectangularAreaInternal(rectangle) {
        return pawnInvoke('CreateDynamicRectangleEx', 'ffffaaaiiii',
            /* minx= */ rectangle.minX,
            /* minx= */ rectangle.minY,
            /* maxx= */ rectangle.maxX,
            /* maxy= */ rectangle.maxY,
            /* worlds= */ this.#virtualWorlds_,
            /* interiors= */ this.#interiors_,
            /* players= */ this.#players_,
            /* priority= */ 0,
            /* maxworlds= */ this.#virtualWorlds_.length,
            /* maxinteriors= */ this.#interiors_.length,
            /* maxplayers= */ this.#players_.length);
    }

    createSphericalAreaInternal(center, radius) {
        return pawnInvoke('CreateDynamicSphereEx', 'ffffaaaiiii',
            /* x= */ center.x,
            /* y= */ center.y,
            /* z= */ center.z,
            /* size= */ radius,
            /* worlds= */ this.#virtualWorlds_,
            /* interiors= */ this.#interiors_,
            /* players= */ this.#players_,
            /* priority= */ 0,
            /* maxworlds= */ this.#virtualWorlds_.length,
            /* maxinteriors= */ this.#interiors_.length,
            /* maxplayers= */ this.#players_.length);
    }

    // Destroys the current object on the server. May be overridden for testing.
    destroyInternal() { pawnInvoke('DestroyDynamicArea', 'i', this.#id_); }

    // ---------------------------------------------------------------------------------------------

    // Adds the |observer| to be invoked when a player enters or leaves this area. Will receive
    // calls on two methods: `onPlayerEnterArea` and `onPlayerLeaveArea`.
    addObserver(observer) {
        this.#observers_.add(observer);
    }

    // Removes the |observer| from the list of objects that care about this area.
    removeObserver(observer) {
        this.#observers_.delete(observer);
    }

    // ---------------------------------------------------------------------------------------------

    get id() { return this.#id_; }

    isConnected() { return this.#id_ !== Area.kInvalidId; }

    get type() { return this.#type_; }

    get observers() { return this.#observers_; }

    get virtualWorlds() { return this.#virtualWorlds_; }
    get interiors() { return this.#interiors_; }
    get players() { return this.#players_; }

    // ---------------------------------------------------------------------------------------------

    // Gets the area's center point. Applicable for kTypeCircle, kTypeCylinder and kTypeSphere.
    get center() {
        switch (this.#type_) {
            case Area.kTypeCircle:
            case Area.kTypeCylinder:
            case Area.kTypeSphere:
                return this.#typeOptions_[0];
        }

        return undefined;
    }

    // Gets the area's radius. Applicable for kTypeCircle, kTypeCylinder and kTypeSphere.
    get radius() {
        switch (this.#type_) {
            case Area.kTypeCircle:
            case Area.kTypeCylinder:
            case Area.kTypeSphere:
                return this.#typeOptions_[1];
        }

        return undefined;
    }

    // Gets the area's rectangle. Applicable for kTypeCube and kTypeRectangle.
    get rectangle() {
        switch (this.#type_) {
            case Area.kTypeCube:
            case Area.kTypeRectangle:
                return this.#typeOptions_[0];
        }

        return undefined;
    }

    // Gets the area's points. Applicable for kTypePolygon only.
    get points() {
        if (this.#type_ === Area.kTypePolygon)
            return this.#typeOptions_[0];
        
        return undefined;
    }

    // Gets the area's minimum Z coord. Applicable for kTypeCube, kTypeCylinder and kTypePolygon.
    get minimumZ() {
        switch (this.#type_) {
            case Area.kTypeCube:
            case Area.kTypePolygon:
                return this.#typeOptions_[1];
            case Area.kTypeCylinder:
                return this.#typeOptions_[2];
        }

        return undefined;
    }

    // Gets the area's maximum Z coord. Applicable for kTypeCube, kTypeCylinder and kTypePolygon.
    get maximumZ() {
        switch (this.#type_) {
            case Area.kTypeCube:
            case Area.kTypePolygon:
                return this.#typeOptions_[2];
            case Area.kTypeCylinder:
                return this.#typeOptions_[3];
        }

        return undefined;
    }

    // ---------------------------------------------------------------------------------------------

    attachToObject(object) {
        pawnInvoke(
            'AttachDynamicAreaToObject', 'iiiifff', this.#id_, object.id, 2, Player.kInvalidId,
            /* offsetx= */ 0, /* offsety= */ 0, /* offsetz= */ 0);
    }

    attachToPlayer(player) {
        pawnInvoke(
            'AttachDynamicAreaToPlayer', 'iifff', this.#id_, player.id, /* offsetx= */ 0,
            /* offsety= */ 0, /* offsetz= */ 0);
    }

    attachToVehicle(vehicle) {
        pawnInvoke(
            'AttachDynamicAreaToVehicle', 'iifff', this.#id_, vehicle.id, /* offsetx= */ 0,
            /* offsety= */ 0, /* offsetz= */ 0);
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        this.#manager_.didDisposeArea(this);
        this.#manager_ = null;

        this.#observers_.clear();

        this.destroyInternal();

        this.#id_ = Area.kInvalidId;
    }

    // ---------------------------------------------------------------------------------------------

    toString() { return `[object Area(${this.#id_}, ${this.#type_})]`; }
}
