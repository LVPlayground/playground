// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Represents a 3D text-label that exists in the world. These are great at conveying smaller amounts
// of information to players who are in range of them.
class TextLabel {
    constructor(manager, options) {
        this.manager_ = manager;

        this.text_ = options.text;
        this.color_ = options.color;
        this.position_ = options.position;
        this.drawDistance_ = options.drawDistance;
        this.virtualWorld_ = options.virtualWorld;
        this.testLineOfSight_ = options.testLineOfSight;

        this.attached_ = false;

        this.id_ = pawnInvoke('Create3DTextLabel', 'siffffii', options.text,
                              options.color.toNumberRGBA(), options.position.x, options.position.y,
                              options.position.z, options.drawDistance, options.virtualWorld,
                              options.testLineOfSight ? 1 : 0);
    }

    // Returns whether the text label still exists on the server.
    isConnected() { return this.id_ !== null; }

    // Returns whether the text label is attached to another entity.
    isAttached() { return this.attached_; }

    // Gets or sets the text that's being displayed using this text label.
    get text() { return this.text_; }
    set text(value) {
        this.text_ = text;
        pawnInvoke(
            'Update3DTextLabelText', 'iis', this.id_, this.color_.toNumberRGBA(), this.text_);
    }

    // Gets or sets the color in which the text on the text label is being drawn.
    get color() { return this.color_; }
    set color(value) {
        this.color_ = color;
        pawnInvoke(
            'Update3DTextLabelText', 'iis', this.id_, this.color_.toNumberRGBA(), this.text_);
    }

    // Gets the position of the text label. This will be irrelevant if the text label has been
    // attached to another entity in the world, which isAttached() will tell you.
    get position() { return this.position_; }

    // Gets the draw distance of the label, i.e. the distance from which players will see it.
    get drawDistance() { return this.drawDistance_; }

    // Gets the virtual world in which the text label is being shown.
    get virtualWorld() { return this.virtualWorld_; }

    // Returns whether the text draw tests for having a clear line-of-sight from the player.
    testsLineOfSight() { return this.testLineOfSight_; }

    // Attaches the text label to the |player| at |offset|.
    attachToPlayer(player, offset) {
        this.attached_ = true;

        pawnInvoke('Attach3DTextLabelToPlayer', 'iifff', this.id_, player.id, offset.x,
                   offset.y, offset.z);
    }

    // Attaches the text label to the |vehicle| at |offset|.
    attachToVehicle(vehicle, offset) {
        this.attached_ = true;

        pawnInvoke('Attach3DTextLabelToVehicle', 'iifff', this.id_, vehicle.id, offset.x,
                   offset.y, offset.z);
    }

    dispose() {
        pawnInvoke('Delete3DTextLabel', 'i', this.id_);

        this.manager_.didDisposeTextLabel(this);
        this.manager_ = null;

        this.id_ = null;
    }
}

// Expose the TextLabel object globally since it is an entity.
global.TextLabel = TextLabel;
