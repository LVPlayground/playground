// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// The text label manager is in control of all text labels created on Las Venturas Playground.
export class TextLabelManager {
    constructor(textLabelConstructor = TextLabel) {
        this.textLabelConstructor_ = textLabelConstructor;
        this.textLabels_ = new Set();
    }

    // Gets the number of text labels currently created on the server.
    get count() { return this.textLabels_.size; }

    // Creates a new text label with the given options.
    createTextLabel({ text, color = Color.WHITE, position, interiors = null, interiorId = -1,
                      virtualWorlds = null, virtualWorld = -1, players = null, playerId = -1,
                      testLineOfSight = false, drawDistance = 150,
                      attachedPlayer = null, attachedVehicle = null } = {}) {
        const textLabel = new this.textLabelConstructor_(this);
        
        // Initializes the |textLabel| with all the configuration passed to the manager.
        textLabel.initialize({
            text,
            color,
            position,

            attachedPlayerId: attachedPlayer ? attachedPlayer.id : Player.kInvalidId,
            attachedVehicleId: attachedVehicle ? attachedVehicle.id : Vehicle.kInvalidId,

            testLineOfSight,

            drawDistance,
            streamDistance: 200,
            priority: 0,

            virtualWorlds: virtualWorlds ?? [ virtualWorld ],
            interiors: interiors ?? [ interiorId ],
            players: players ?? [ playerId ],
            areas: [ -1 ],
        });

        this.textLabels_.add(textLabel);
        return textLabel;
    }

    // Removes the |textLabel| from the maintained set of text labels. Should only be used by the
    // TextLabel implementation to inform the manager about their disposal.
    didDisposeTextLabel(textLabel) {
        if (!this.textLabels_.has(textLabel))
            throw new Error('Attempting to dispose an invalid text label: ' + textLabel);

        this.textLabels_.delete(textLabel);
    }

    // Removes all existing text labels from the server.
    dispose() {
        this.textLabels_.forEach(textLabel => textLabel.dispose());

        if (this.textLabels_.size != 0)
            throw new Error('There are remaining text labels after disposing all of them.');
    }
}
