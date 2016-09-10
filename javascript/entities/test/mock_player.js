// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Mocked player. Has the same interface and abilities as a real Player object, except that it does
// not rely on the SA-MP server to be available, nor communicates with Pawn.
class MockPlayer {
    constructor(playerId, event) {
        this.id_ = playerId;

        this.name_ = event.name || 'Player' + playerId;
        this.level_ = event.level || Player.LEVEL_PLAYER;
        this.vip_ = false;
        this.gangId_ = null;

        this.interiorId_ = 0;
        this.virtualWorld_ = 0;
        this.userId_ = null;
        this.ipAddress_ = event.ipAddress || '127.0.0.1';
        this.position_ = new Vector(0, 0, 0);
        this.specialAction_ = Player.SPECIAL_ACTION_NONE;

        this.dialogPromiseResolve_ = null;
        this.dialogPromise_ = new Promise(resolve => {
            this.dialogPromiseResolve_ = resolve;
        });

        this.lastDialogMessage_ = null;
        this.lastDialogId_ = null;
        this.lastPlayedSound_ = null;

        this.messages_ = [];

        this.gangColor_ = null;
        this.vehicleCollisionsEnabled_ = true;
        this.removedObjectCount_ = 0;
        this.messageLevel_ = 0;

        this.streamerObjectsUpdated_ = false;

        this.connected_ = true;
        this.disconnecting_ = false;
    }

    get id() { return this.id_; }

    isConnected() { return this.connected_; }

    isDisconnecting() { return this.disconnecting_; }

    notifyDisconnecting() {
        this.disconnecting_ = true;
    }

    notifyDisconnected() {
        this.connected_ = false;
        this.disconnecting_ = false;
    }

    get name() { return this.name_; }
    set name(value) { this.name_ = value; }

    get ipAddress() { return this.ipAddress_; }

    get level() { return this.level_; }
    set level(value) { this.level_ = value; }

    isAdministrator() {
        return this.level_ == Player.LEVEL_ADMINISTRATOR ||
               this.level_ == Player.LEVEL_MANAGEMENT;
    }

    isManagement() { return this.level_ == Player.LEVEL_MANAGEMENT; }

    isRegistered() { return this.userId_ != null; }

    get userId() { return this.userId_; }

    // Returns whether this player is a VIP member of Las Venturas Playground.
    isVip() { return this.vip_; }

    // Gets or sets the Id of the gang this player is part of.
    get gangId() { return this.gangId_; }
    set gangId(value) { this.gangId_ = value; }

    // Gets or sets the interior the player is part of. Moving them to the wrong interior will mess up
  // their visual state significantly, as all world objects may disappear.
  get interiorId() { return this.interiorId_; }
  set interiorId(value) { this.interiorId_ = value; }

    // Gets or sets the virtual world the player is part of.
    get virtualWorld() { return this.virtualWorld_; }
    set virtualWorld(value) { this.virtualWorld_ = value; }

    // Gets or sets the position of this player.
    get position() { return this.position_; }
    set position(value) {
        this.position_ = value;

        // Fake pickup events if the player happened to have stepped in a pickup.
        server.pickupManager.onPlayerPositionChanged(this);
    }

    // Gets or sets the special action the player is currently engaged in. The values must be one of
    // the Player.SPECIAL_ACTION_* constants static to this class.
    get specialAction() { return this.specialAction_; }
    set specialAction(value) { this.specialAction_ = value; }

    // Clears the animations applied to the player.
    clearAnimations() {}

    // Gets or sets whether vehicle collisions should be enabled for this player.
    get vehicleCollisionsEnabled() { return this.vehicleCollisionsEnabled_; }
    set vehicleCollisionsEnabled(value) { this.vehicleCollisionsEnabled_ = value; }

    // Fake implementation of the ShowPlayerDialog() native. Used to be able to mock responses to
    // dialogs and make that entire sub-system testable as well.
    showDialog(dialogId, style, caption, message, leftButton, rightButton) {
        this.lastDialogId_ = dialogId;
        this.lastDialogMessage_ = message;

        this.dialogPromiseResolve_();
    }

    // Gets the most recent message that has been displayed in a dialog to the player.
    get lastDialog() { return this.lastDialogMessage_; }

    // Sends |message| to the player. It will be stored in the local messages array and can be
    // retrieved through the |messages| getter.
    sendMessage(message, ...args) {
        if (message instanceof Message)
            message = Message.format(message, ...args);

        this.messages_.push(message.toString());
    }

    // Clears the messages that have been sent to this player.
    clearMessages() { this.messages_ = []; }

    // Gets the messages that have been sent to this player.
    get messages() { return this.messages_; }

    // Sets whether the player should be in spectator mode. Disabling spectator mode will force them
    // to respawn immediately after, which may be an unintended side-effect.
    setSpectating(spectating) {}

    // Sets the player's camera to |position| and |target|, both of which must be vectors.
    setCamera(position, target) {}

    // Interpolates the player's camera from |positionFrom|, |targetFrom| to |positionTo|, |targetTo|,
    // which must be vectors, in |duration| milliseconds.
    interpolateCamera(positionFrom, positionTo, targetFrom, targetTo, duration) {}

    // Resets the player camera to its default behaviour.
    resetCamera() {}

    // Serializes the player's current state into a buffer.
    serializeState() {}

    // Restores the player's previous state from a buffer.
    restoreState() {}

    // Fake playing a sound for this player. Stores the soundId in |lastPlayedSound_|.
    playSound(soundId) {
        this.lastPlayedSound_ = soundId;
    }

    // Removes default game objects from the map of model |modelId| that are within |radius| units
    // of the |position|. Should be called while the player is connecting to the server.
    removeGameObject(modelId, position, radius) {
        this.removedObjectCount_++;
    }

    // Gets the number of objects that have been removed from the map for this player.
    get removedObjectCount() { return this.removedObjectCount_; }

    // Gets the most recently played sound for this player.
    get lastPlayedSound() { return this.lastPlayedSound_; }

    // Gets or sets the message level at which this player would like to receive messages.
    get messageLevel() { return this.messageLevel_; }
    set messageLevel(value) { this.messageLevel_ = value; }

    // Returns the vehicle the player is currently driving in, when the player is in a vehicle and
    // the vehicle is owned by the JavaScript code.
    currentVehicle() { return null; }

    // Gets or sets the gang color of this player. May be NULL when no color has been defined.
    get gangColor() { return this.gangColor_; }
    set gangColor(value) { this.gangColor_ = value; }

    // Identifies the player to a fake account. The options can be specified optionally.
    identify({ userId = 42, gangId = 0 } = {}) {
        server.playerManager.onPlayerLogin({
            playerid: this.id_,
            userid: userId,
            gangid: gangId
        });
    }

    // Issues |message| as if it has been said by this user. Returns whether the event with which
    // the chat message had been issues was prevented.
    issueMessage(message) {
        let defaultPrevented = false;

        // TODO(Russell): Should this talk directly to the CommunicationManager?
        self.dispatchEvent('playertext', {
            preventDefault: () => defaultPrevented = true,

            playerid: this.id_,
            text: message
        });

        return defaultPrevented;
    }

    // Issues |commandText| as if it had been send by this player. Returns whether the event with
    // which the command had been issued was prevented.
    async issueCommand(commandText) {
        let defaultPrevented = false;

        await server.commandManager.onPlayerCommandText({
            preventDefault: () => defaultPrevented = true,

            playerid: this.id_,
            cmdtext: commandText
        });

        return defaultPrevented;
    }

    // Responds to an upcoming dialog with the given values. The dialog Id that has been shown
    // for the player will be inserted automatically. Responses are forcefully asynchronous.
    respondToDialog({ response = 1 /* left button */, listitem = 0, inputtext = '' } = {}) {
        return this.dialogPromise_.then(() => {
            global.dispatchEvent('dialogresponse', {
                playerid: this.id_,
                dialogid: this.lastDialogId_,
                response: response,
                listitem: listitem,
                inputtext: inputtext
            });

            return this.dialogPromise_ = new Promise(resolve => {
                this.dialogPromiseResolve_ = resolve;
            });
        });
    }

    // Changes the player's state from |oldState| to |newState|.
    changeState({ oldState, newState } = {}) {
        global.dispatchEvent('playerstatechange', {
            playerid: this.id_,
            oldstate: oldState,
            newstate: newState
        });
    }

    // Triggers an event indicating that the player died.
    die(killerPlayer = null, reason = 0) {
        global.dispatchEvent('playerdeath', {
            playerid: this.id_,
            killerid: killerPlayer ? killerPlayer.id
                                   : Player.INVALID_ID,
            reason: reason
        });
    }

    // Triggers an event indicating that the player has respawned. Returns whether the event has
    // been cancelled by something that handled it.
    spawn() {
        let defaultPrevented = false;

        global.dispatchEvent('playerspawn', {
            preventDefault: () => defaultPrevented = true,
            playerid: this.id_
        });

        return defaultPrevented;
    }

    // Disconnects the player from the server. They will be removed from the PlayerManager too.
    disconnect(reason = 0) {
        server.playerManager.onPlayerDisconnect({
            playerid: this.id_,
            reason: reason
        });
    }

    // Tells the test whether the player is in a vehicle
    isInVehicle() {
        return this.currentVehicle() != null;
    }

    updateStreamerObjects() { this.streamerObjectsUpdated_ = true; }
    streamerObjectsUpdated() { return this.streamerObjectsUpdated_; }

    // TODO: Add new getters and setters as required.
}

exports = MockPlayer;
