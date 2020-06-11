// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Represents a 3D text-label that exists in the world. These are great at conveying smaller amounts
// of information to players who are in range of them. Powered by the streamer plugin.
export class TextLabel {
    // Id to represent an invalid text label. Maps to INVALID_STREAMER_ID, which is (0).
    static kInvalidId = 0;

    #id_ = null;
    #manager_ = null;

    #text_ = null;
    #color_ = null;
    #position_ = null;

    #attachedPlayer_ = null;
    #attachedVehicle_ = null;

    #testLineOfSight_ = null;
    #virtualWorlds_ = null;
    #interiors_ = null;
    #players_ = null;

    constructor(manager) {
        this.#manager_ = manager;
    }

    initialize(options) {
        this.#text_ = options.text;
        this.#color_ = options.color;
        this.#position_ = options.position;

        if (options.attachedPlayerId)
            this.#attachedPlayer_ = server.playerManager.getById(options.attachToPlayerId);
        
        if (options.attachedVehicleId)
            this.#attachedVehicle_ = server.vehicleManager.getById(options.attachedVehicleId);
        
        this.#testLineOfSight_ = options.testLineOfSight;

        this.#virtualWorlds_ = options.virtualWorlds;
        this.#interiors_ = options.interiors;
        this.#players_ = options.players;

        this.#id_ = this.createInternal(options);
        if (this.#id_ === TextLabel.kInvalidId)
            throw new Error('Unable to create the object with text: ' + options.text);
    }

    // Creates the actual text label on the server. May be overridden for testing purposes.
    createInternal(options) {
        return pawnInvoke('CreateDynamic3DTextLabelEx', 'siffffiiifaaaaiiiii',
            /* text= */ options.text,
            /* color= */ options.color.toNumberRGBA(),
            /* x= */ options.position.x,
            /* y= */ options.position.y,
            /* z= */ options.position.z,
            /* drawdistance= */ options.drawDistance,
            /* attachedplayer= */ options.attachedPlayerId,
            /* attachedvehicle= */ options.attachedVehicleId,
            /* testlos= */ options.testLineOfSight ? 1 : 0,
            /* streamdistance= */ options.streamDistance,
            /* worlds= */ options.virtualWorlds,
            /* interiors= */ options.interiors,
            /* players= */ options.players,
            /* areas= */ options.areas,
            /* priority= */ options.priority,
            /* maxworlds= */ options.virtualWorlds.length,
            /* maxinteriors= */ options.interiors.length,
            /* maxplayers= */ options.players.length,
            /* maxareas= */ options.areas.length);
    }

    // Destroys the actual text label on the server. May be overridden for testing purposes.
    destroyInternal() { pawnInvoke('DestroyDynamic3DTextLabel', 'i', this.#id_); }

    // Changes the text to |text| on the actual server. May be overridden for testing purposes.
    updateInternal(color, text) {
        pawnInvoke('UpdateDynamic3DTextLabelText', 'iis', this.#id_, color, text);
    }

    // ---------------------------------------------------------------------------------------------

    get id() { return this.#id_; }

    isConnected() { return this.#id_ !== TextLabel.kInvalidId; }

    get text() { return this.#text_; }
    set text(value) {
        this.updateInternal(this.#color_, value);
        this.#text_ = value;
    }

    get color() { return this.#color_; }
    set color(value) {
        this.updateInternal(value, this.#text_);
        this.#color_ = value;
    }

    get position() { return this.#position_; }

    get attachedPlayer() {
        if (this.#attachedPlayer_ && !this.#attachedPlayer_.isConnected())
            this.#attachedPlayer_ = null;

        return this.#attachedPlayer_;
    }

    get attachedVehicle() {
        if (this.#attachedVehicle_ && !this.#attachedVehicle_.isConnected())
            this.#attachedVehicle_ = null;

        return this.#attachedVehicle_;
    }

    get testsLineOfSight() { return this.#testLineOfSight_; }

    get virtualWorlds() { return this.#virtualWorlds_; }
    get interiors() { return this.#interiors_; }
    get players() { return this.#players_; }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        this.destroyInternal();

        this.#id_ = TextLabel.kInvalidId;

        this.#manager_.didDisposeTextLabel(this);
        this.#manager_ = null;
    }

    // ---------------------------------------------------------------------------------------------

    toString() { return `[object TextLabel(${this.#id_}, ${this.#text_})]`; }
}

// Expose the TextLabel object globally since it is an entity.
global.TextLabel = TextLabel;
