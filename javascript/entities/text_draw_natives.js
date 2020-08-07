// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Global, ever-incrementing ID to give mocked text draws a unique ID.
let gMockedTextDrawId = 0;

// The interface an implementation of either global or per-player text draws has to support. Does
// nothing by default. Also used by the mocked TextDrawNatives, which mimick behaviour.
class TextDrawNativesInterface {
    create(x, y, text) {}
    destroy(id) {}

    setAlignment(id, alignment) {}
    setBackgroundColor(id, color) {}
    setBoxColor(id, color) {}
    setBox(id, enabled) {}
    setColor(id, color) {}
    setFont(id, font) {}
    setLetterSize(id, x, y) {}
    setOutline(id, size) {}
    setPreviewModel(id, modelIndex) {}
    setPreviewRotation(id, rotation, scale) {}
    setPreviewVehicleColors(id, primaryColor, secondaryColor) {}
    setProportional(id, proportional) {}
    setSelectable(id, selectable) {}
    setShadow(id, size) {}
    setString(id, text) {}
    setTextSize(id, x, y) {}

    displayForAll(id) {}
    displayForPlayer(id, player) {}

    hideForAll(id) {}
    hideForPlayer(id, player) {}
}

// Interface through which player-specific text-draws can be created. These have a different set of
// native functions compared to global text-draws. Each player can have 256 text draws.
export class PlayerTextDrawNatives extends TextDrawNativesInterface {
    #playerId_ = null;

    constructor(player) {
        super();

        this.#playerId_ = player.id;
    }

    // TextDrawNativesInterface implementation:
    create(x, y, text) {
        return pawnInvoke('CreatePlayerTextDraw', 'iffs', this.#playerId_, x, y, text);
    }
    destroy(id) {
        pawnInvoke('PlayerTextDrawDestroy', 'ii', this.#playerId_, id);
    }
    setAlignment(id, alignment) {
        pawnInvoke('PlayerTextDrawAlignment', 'iii', this.#playerId_, id, alignment);
    }
    setBackgroundColor(id, color) {
        pawnInvoke(
            'PlayerTextDrawBackgroundColor', 'iii', this.#playerId_, id, color.toNumberRGBA());
    }
    setBoxColor(id, color) {
        pawnInvoke('PlayerTextDrawBoxColor', 'iii', this.#playerId_, id, color.toNumberRGBA());
    }
    setBox(id, enabled) {
        pawnInvoke('PlayerTextDrawUseBox', 'iii', this.#playerId_, id, !!enabled ? 1 : 0);
    }
    setColor(id, color) {
        pawnInvoke('PlayerTextDrawColor', 'iii', this.#playerId_, id, color.toNumberRGBA());
    }
    setFont(id, font) {
        pawnInvoke('PlayerTextDrawFont', 'iii', this.#playerId_, id, font);
    }
    setLetterSize(id, x, y) {
        pawnInvoke('PlayerTextDrawLetterSize', 'iiff', this.#playerId_, id, x, y);
    }
    setOutline(id, size) {
        pawnInvoke('PlayerTextDrawSetOutline', 'iii', this.#playerId_, id, size);
    }
    setPreviewModel(id, modelIndex) {
        pawnInvoke('PlayerTextDrawSetPreviewModel', 'iii', this.#playerId_, id, modelIndex);
    }
    setPreviewRotation(id, rotation, scale) {
        pawnInvoke(
            'PlayerTextDrawSetPreviewRot', 'iiffff', this.#playerId_, id, rotation.x, rotation.y,
            rotation.z, scale);
    }
    setPreviewVehicleColors(id, primaryColor, secondaryColor) {
        pawnInvoke(
            'PlayerTextDrawSetPreviewVehCol', 'iiii', this.#playerId_, id, primaryColor,
            secondaryColor);
    }
    setProportional(id, proportional) {
        pawnInvoke(
            'PlayerTextDrawSetProportional', 'iii', this.#playerId_, id, !!proportional ? 1 : 0);
    }
    setSelectable(id, selectable) {
        pawnInvoke('PlayerTextDrawSetSelectable', 'iii', this.#playerId_, id, !!selectable ? 1 : 0);
    }
    setShadow(id, size) {
        pawnInvoke('PlayerTextDrawSetShadow', 'iii', this.#playerId_, id, size);
    }
    setString(id, text) {
        pawnInvoke('PlayerTextDrawSetString', 'iis', this.#playerId_, id, text);
    }
    setTextSize(id, x, y) {
        pawnInvoke('PlayerTextDrawTextSize', 'iiff', this.#playerId_, id, x, y);
    }

    displayForAll(id) { throw new Error(`Invalid operation for per-player text-draws.`); }
    displayForPlayer(id, player) {
        if (player.id !== this.#playerId_)
            throw new Error(`Invalid operation for per-player text-draws.`);

        pawnInvoke('PlayerTextDrawShow', 'ii', this.#playerId_, id);
    }

    hideForAll(id) { throw new Error(`Invalid operation for per-player text-draws.`);}
    hideForPlayer(id, player) {
        if (player.id !== this.#playerId_)
            throw new Error(`Invalid operation for per-player text-draws.`);

        pawnInvoke('PlayerTextDrawHide', 'ii', this.#playerId_, id);
    }
}

// Interface through which global text-draws can be created. All players share state for them, but
// only 2,048 can be created for the server as a whole.
export class TextDrawNatives extends TextDrawNativesInterface {
    create(x, y, text) { return pawnInvoke('TextDrawCreate', 'ffs', x, y, text); }
    destroy(id) { pawnInvoke('TextDrawDestroy', 'i', id); }
    setAlignment(id, alignment) { pawnInvoke('TextDrawAlignment', 'ii', id, alignment); }
    setBackgroundColor(id, color) {
        pawnInvoke('TextDrawBackgroundColor', 'ii', id, color.toNumberRGBA());
    }
    setBoxColor(id, color) { pawnInvoke('TextDrawBoxColor', 'ii', id, color.toNumberRGBA()); }
    setBox(id, enabled) { pawnInvoke('TextDrawUseBox', 'ii', id, !!enabled ? 1 : 0); }
    setColor(id, color) { pawnInvoke('TextDrawColor', 'ii', id, color.toNumberRGBA()); }
    setFont(id, font) { pawnInvoke('TextDrawFont', 'ii', id, font); }
    setLetterSize(id, x, y) { pawnInvoke('TextDrawLetterSize', 'iff', id, x, y); }
    setOutline(id, size) { pawnInvoke('TextDrawSetOutline', 'ii', id, size); }
    setPreviewModel(id, modelIndex) { pawnInvoke('TextDrawSetPreviewModel', 'ii', id, modelIndex); }
    setPreviewRotation(id, rotation, scale) {
        pawnInvoke('TextDrawSetPreviewRot', 'iffff', id, rotation.x, rotation.y, rotation.z, scale);
    }
    setPreviewVehicleColors(id, primaryColor, secondaryColor) {
        pawnInvoke('TextDrawSetPreviewVehCol', 'iii', id, primaryColor, secondaryColor);
    }
    setProportional(id, proportional) {
        pawnInvoke('TextDrawSetProportional', 'ii', id, !!proportional ? 1 : 0);
    }
    setSelectable(id, selectable) {
        pawnInvoke('TextDrawSetSelectable', 'ii', id, !!selectable ? 1 : 0);
    }
    setShadow(id, size) { pawnInvoke('TextDrawSetShadow', 'ii', id, size); }
    setString(id, text) { pawnInvoke('TextDrawSetString', 'is', id, text); }
    setTextSize(id, x, y) { pawnInvoke('TextDrawTextSize', 'iff', id, x, y); }

    displayForAll(id) { pawnInvoke('TextDrawShowForAll', 'i', id); }
    displayForPlayer(id, player) { pawnInvoke('TextDrawShowForPlayer', 'ii', player.id, id); }

    hideForAll(id) { pawnInvoke('TextDrawHideForAll', 'i', id); }
    hideForPlayer(id, player) { pawnInvoke('TextDrawHideForPlayer', 'ii', player.id, id); }
}

// Interface through which text draws can be tested. Mocks behaviour of the server in a way that
// tests are able to validate that text draws do what they're expected to do.
export class MockTextDrawNatives extends TextDrawNativesInterface {
    create(x, y, text) { return gMockedTextDrawId++; }
}
