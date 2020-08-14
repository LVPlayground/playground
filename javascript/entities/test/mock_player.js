// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { MockVehicle } from 'entities/test/mock_vehicle.js';
import { Player } from 'entities/player.js';
import { Vector } from 'base/vector.js';

import { format } from 'base/format.js';
import { murmur3hash } from 'base/murmur3hash.js';

// MockPlayer
//
// Implementation of the Player interface that specifically exists to enable running tests on the
// server because the Player does not actually exist. No Pawn calls will be made. Additional
// functionality has been added for testing purposes, to allow for modifications and inspection
// that would otherwise be infeasible.
export class MockPlayer extends Player {
    #name_ = null;
    #gpci_ = null;
    #serial_ = null;
    #packetLossPercentage_ = 0;
    #ping_ = 30;
    #ipAddress_ = null;
    #isNpc_ = null;
    #version_ = null;

    #isServerAdmin_ = false;

    #weapons_ = new Map();

    #position_ = new Vector(0, 0, 0);
    #rotation_ = 0;
    #interiorId_ = 0;
    #virtualWorld_ = 0;
    #velocity_ = new Vector(0, 0, 0);

    #color_ = Color.WHITE;
    #colorOverrides_ = new Map();
    #controllable_ = true;
    #health_ = 100.0;
    #armour_ = 0.0;
    #nameTagInvisible_ = new Set();
    #skin_ = 308;  // San Fierro Paramedic (EMT)
    #specialAction_ = Player.kSpecialActionNone;
    #state_ = Player.kStateOnFoot;
    #isMinimized_ = false;

    #drunkLevel_ = 0;
    #fightingStyle_ = Player.kFightingStyleNormal;
    #gravity_ = 0.008;
    #score_ = 0;
    #team_ = Player.kNoTeam;
    #time_ = [0, 0];
    #wantedLevel_ = 0;
    #weather_ = 0;

    #messages_ = [];
    #lastDialogId_ = null;
    #lastDialogTitle_ = null;
    #lastDialogStyle_ = null;
    #lastDialogLabel_ = null;
    #lastDialogMessage_ = null;
    #lastDialogPromise_ = null;
    #lastDialogPromiseResolve_ = null;

    #spectating_ = false;
    #spectateTarget_ = null;

    #streamUrl_ = null;
    #soundId_ = null;

    #lastAnimation_ = null;

    #hasBeenSerializedForTesting_ = false;
    #isSurfingVehicle_ = false;

    // To be removed:
    #streamerObjectsUpdated_ = false;

    // Initializes the mock player with static information that generally will not change for the
    // duration of the player's session. The |params| object is available.
    initialize(params) {
        this.#name_ = params.name || 'Player' + this.id;
        this.#gpci_ = params.gpci || 'FAKELONGHASHOF40CHARACTERSHEH';
        this.#serial_ = murmur3hash(this.#gpci_ || 'npc');
        this.#ipAddress_ = params.ip || '127.0.0.1';
        this.#isNpc_ = params.npc || false;
        this.#version_ = params.version || '0.3.7-R4-mock';

        this.#lastDialogPromiseResolve_ = null;
        this.#lastDialogPromise_ = new Promise(resolve => {
            this.#lastDialogPromiseResolve_ = resolve;
        });
    }

    // ---------------------------------------------------------------------------------------------
    // Section: Identity
    // ---------------------------------------------------------------------------------------------

    get name() { return this.#name_; }
    set name(value) { this.#name_ = value; }

    get ip() { return this.#ipAddress_; }

    get gpci() { return this.#gpci_; }

    get serial() { return this.#serial_; }

    get version() { return this.#version_; }

    get packetLossPercentage() { return this.#packetLossPercentage_; }
    set packetLossPercentageForTesting(value) { this.#packetLossPercentage_ = value; }

    get ping() { return this.#ping_; }
    set pingForTesting(value) { this.#ping_ = value; }

    isServerAdmin() { return this.#isServerAdmin_; }
    setServerAdminForTesting(value) { this.#isServerAdmin_ = value; }

    isNonPlayerCharacter() { return this.#isNpc_; }

    kick() { this.disconnectForTesting(/* reason= */ 2); }

    setIpForTesting(ip) { this.#ipAddress_ = ip; }
    setIsNonPlayerCharacterForTesting(value) { this.#isNpc_ = value; }
    setSerialForTesting(serial) { this.#serial_ = serial; }

    updateName() { this.#name_ += 'a'; /* any change will do */ }

    disconnectForTesting(reason = 0) {
        dispatchEvent('playerdisconnect', {
            playerid: this.id,
            reason: reason
        });
    }

    // ---------------------------------------------------------------------------------------------
    // Section: Weapons
    // ---------------------------------------------------------------------------------------------

    giveSpawnWeapon(weaponId, multiplier) {
        pawnInvoke('OnGiveSpawnWeapon', 'iii', this.id, weaponId, multiplier);
    }

    giveSpawnArmour() {
        pawnInvoke('OnGiveSpawnArmour', 'i', this.id);
    }

    giveWeapon(weaponId, ammo) {
        pawnInvoke('OnGiveWeapon', 'iii', this.id, weaponId, ammo);
        this.#weapons_.set(weaponId, ammo);
    }

    removeWeapon(weaponId) {
        pawnInvoke('OnRemovePlayerWeapon', 'ii', this.id, weaponId);
        this.#weapons_.delete(weaponId);
    }

    resetWeapons() {
        pawnInvoke('OnResetPlayerWeapons', 'i', this.id);
        this.#weapons_.clear();
    }

    getWeaponsForTesting() { return this.#weapons_; }

    // ---------------------------------------------------------------------------------------------
    // Section: Physics
    // ---------------------------------------------------------------------------------------------

    get position() { return this.#position_; }
    set position(value) {
        this.#position_ = value;

        // Testing behaviour: using SetPlayerPos() while the player is in a vehicle will eject them
        // from the vehicle. Emulate this behaviour by issuing a state change event.
        if (this.vehicle !== null) {
            dispatchEvent('playerstatechange', {
                playerid: this.id,
                oldstate: this.vehicleSeat == Vehicle.kSeatDriver ? Player.kStateVehicleDriver
                                                                  : Player.kStateVehiclePassenger,
                newstate: Player.kStateOnFoot,
            });

            this.vehicle_ = null;
            this.vehicleSeat_ = null;
        }

        // Testing behaviour: players moving around will naturally cause them to be near pickups,
        // which are events that aren't naturally generated in a test setup. Fake it.
        server.pickupManager.onPlayerPositionChanged(this);
    }

    get rotation() { return this.#rotation_; }
    set rotation(value) { this.#rotation_ = value; }

    get velocity() { return this.#velocity_; }
    set velocity(value) { this.#velocity_ = value; }

    get interiorId() { return this.#interiorId_; }
    set interiorId(value) { this.#interiorId_ = value; }

    get virtualWorld() { return this.#virtualWorld_; }
    set virtualWorld(value) {
        if (this.syncedData.isIsolated())
            return;

        this.#virtualWorld_ = value;
    }

    // ---------------------------------------------------------------------------------------------
    // Section: State
    // ---------------------------------------------------------------------------------------------

    get armour() { return this.#armour_; }
    set armour(value) { this.#armour_ = value; }

    get color() { return this.#color_; }
    set rawColor(value) { this.#color_ = value; this.#colorOverrides_.clear(); }

    get controllable() { throw new Error('Unable to get whether the player is controllable.'); }
    set controllable(value) { this.#controllable_ = value; }

    get controllableForTesting() { return this.#controllable_; }

    get health() { return this.#health_; }
    set health(value) { this.#health_ = value; }

    get skin() { return this.#skin_; }
    set skin(value) { this.#skin_ = value; }

    get specialAction() { return this.#specialAction_; }
    set specialAction(value) { this.#specialAction_ = value; }

    get state() { return this.#state_; }

    isMinimized() { return this.#isMinimized_; }
    setMinimizedForTesting(value) { this.#isMinimized_ = value; }

    respawn() {
        let defaultPrevented = false;

        // Testing behaviour: returns whether another part of Las Venturas Playground is handling
        // the spawn, which is indicated by them preventing the event's default behaviour.
        dispatchEvent('playerspawn', {
            preventDefault: () => defaultPrevented = true,
            playerid: this.id
        });

        return defaultPrevented;
    }

    getColorForPlayerForTesting(player) { return this.#colorOverrides_.get(player) ?? this.color; }
    setColorForPlayer(player, color) { this.#colorOverrides_.set(player, color); }

    isNameTagShownForPlayerForTesting(player) { return !this.#nameTagInvisible_.has(player); }
    showNameTagForPlayer(player, visible) {
        visible ? this.#nameTagInvisible_.delete(player)
                : this.#nameTagInvisible_.add(player);
    }

    // ---------------------------------------------------------------------------------------------
    // Section: Environment
    // ---------------------------------------------------------------------------------------------

    get drunkLevel() { return this.#drunkLevel_; }
    set drunkLevel(value) { this.#drunkLevel_ = value; }

    get fightingStyle() { return this.#fightingStyle_; }
    set fightingStyle(value) { this.#fightingStyle_ = value; }

    get gravity() { return this.#gravity_; }
    set gravity(value) { this.#gravity_ = value; }

    get score() { return this.#score_; }
    set score(value) { this.#score_ = value; }

    get team() { return this.#team_; }
    set team(value) { this.#team_ = value; }

    get time() { return this.#time_; }
    set time(value) { this.#time_ = value; }

    get wantedLevel() { return this.#wantedLevel_; }
    set wantedLevel(value) { this.#wantedLevel_ = value; }

    get weather() { throw new Error('Unable to get the current weather for players.'); }
    set weather(value) { this.#weather_ = value; }

    get weatherForTesting() { return this.#weather_; }

    // ---------------------------------------------------------------------------------------------
    // Section: Appearance
    // ---------------------------------------------------------------------------------------------

    attachObjectInternal() {}
    removeAttachedObjectInternal() {}

    // ---------------------------------------------------------------------------------------------
    // Section: Interaction
    // ---------------------------------------------------------------------------------------------

    async cancelEdit() {}

    async selectObjectInternal() {}

    showDialog(dialogId, style, caption, message, leftButton, rightButton) {
        const oldMessage = this.#lastDialogMessage_;

        this.#lastDialogId_ = dialogId;
        this.#lastDialogTitle_ = caption;
        this.#lastDialogStyle_ = style;
        this.#lastDialogLabel_ = rightButton;
        this.#lastDialogMessage_ = message;

        this.#lastDialogPromiseResolve_(oldMessage);
    }

    // Gets the most recent message that has been displayed in a dialog to the player.
    get lastDialog() { return this.#lastDialogMessage_; }
    get lastDialogTitle() { return this.#lastDialogTitle_; }
    get lastDialogStyle() { return this.#lastDialogStyle_; }
    get lastDialogLabel() { return this.#lastDialogLabel_; }

    // Advanced method to get the last dialog as a menu table.
    getLastDialogAsTable(hasColumns = true) {
        if (!this.#lastDialogMessage_)
            throw new Error('No last message is available to output as a table.');

        const lines = this.#lastDialogMessage_.split('\n');
        if (!hasColumns)
            return lines;

        return {
            columns: lines.shift().split('\t'),
            rows: lines.map(line => line.split('\t'))
        };
    }

    // Clears the last dialog that has been shown to this player.
    clearLastDialog() {
        this.#lastDialogId_ = null;
        this.#lastDialogTitle_ = null;
        this.#lastDialogStyle_ = null;
        this.#lastDialogLabel_ = null;
        this.#lastDialogMessage_ = null;
    }

    // Sends |message| to the player. It will be stored in the local messages array and can be
    // retrieved through the |messages| getter.
    sendMessage(message, ...args) {
        if (typeof message === 'function')
            message = message(null, ...args);
        else if (args.length)
            message = format(message, ...args);

        if (message.length <= 144) // SA-MP-implementation does not send longer messages
            this.#messages_.push(message.toString());
    }

    // Clears the messages that have been sent to this player.
    clearMessages() { this.#messages_ = []; }

    // Gets the messages that have been sent to this player.
    get messages() { return this.#messages_; }

    // ---------------------------------------------------------------------------------------------
    // Section: Spectating
    // ---------------------------------------------------------------------------------------------

    spectatePlayer(player, mode = Player.kSpectateNormal) {
        if (!this.#spectating_)
            throw new Error('The player must be spectating before picking a target.');

        this.#spectateTarget_ = player;
    }

    spectateVehicle(vehicle, mode = Player.kSpectateNormal) {
        if (!this.#spectating_)
            throw new Error('The player must be spectating before picking a target.');

        this.#spectateTarget_ = vehicle;
    }

    get spectating() { /* this is a read-only value on the server */ }
    set spectating(value) {
        this.#spectating_ = !!value;
        if (!this.#spectating_)
            this.#spectateTarget_ = null;
    }

    get spectatingForTesting() { return this.#spectating_; }
    get spectateTargetForTesting() { return this.#spectateTarget_; }

    // ---------------------------------------------------------------------------------------------
    // Section: Audio
    // ---------------------------------------------------------------------------------------------

    playAudioStream(url) { this.#streamUrl_ = url; }

    playSound(soundId) { this.#soundId_ = soundId; }

    stopAudioStream() { this.#streamUrl_ = null; }

    get soundIdForTesting() { return this.#soundId_; }
    set soundIdForTesting(value) { return this.#soundId_ = value; }

    get streamUrlForTesting() { return this.#streamUrl_; }

    // ---------------------------------------------------------------------------------------------
    // Section: Visual
    // ---------------------------------------------------------------------------------------------

    animate(options) { this.#lastAnimation_ = options.library + ':' + options.name; }

    get animationIndex() { return 0; }

    clearAnimations() {}

    get cameraPosition() { return new Vector(0, 0, 0); }
    get cameraFrontVector() { return new Vector(0, 0, 0); }

    interpolateCamera(positionFrom, positionTo, targetFrom, targetTo, duration) {}

    resetCamera() {}

    setCamera(position, target) {}

    setSpectating(value) {}

    getLastAnimationForTesting() { return this.#lastAnimation_; }

    // ---------------------------------------------------------------------------------------------
    // Section: Vehicles
    // ---------------------------------------------------------------------------------------------

    get vehicleCollisionsEnabled() { throw new Error('Unable to read this setting.'); }
    set vehicleCollisionsEnabled(value) { /* no need to mock write-only values */ }

    enterVehicle(vehicle, seat = 0) {
        this.vehicle = vehicle;
        this.vehicleSeat = seat;

        dispatchEvent('playerstatechange', {
            playerid: this.id,
            oldstate: Player.kStateOnFoot,
            newstate: seat === 0 ? Player.kStateVehicleDriver
                                 : Player.kStateVehiclePassenger
        });
    }

    isSurfingVehicle() { return this.#isSurfingVehicle_; }
    setSurfingVehicleForTesting(value) { this.#isSurfingVehicle_ = value; }

    leaveVehicleWithAnimation() { this.leaveVehicle(); }

    // ---------------------------------------------------------------------------------------------
    // Stuff that needs a better home
    // ---------------------------------------------------------------------------------------------

    restoreState() { this.#hasBeenSerializedForTesting_ = false; }
    serializeState() { this.#hasBeenSerializedForTesting_ = true; }

    updateStreamerObjects() { this.#streamerObjectsUpdated_ = true; }
    updateStreamer(position, virtualWorld, interiorId, type) {}

    get hasBeenSerializedForTesting() { return this.#hasBeenSerializedForTesting_; }

    streamerObjectsUpdatedForTesting() { return this.#streamerObjectsUpdated_; }

    // ---------------------------------------------------------------------------------------------
    // Instrumentation for testing purposes
    // ---------------------------------------------------------------------------------------------

    // Identifies the player to a fake account. The options can be specified optionally.
    async identify({ userId = 42, vip = 0, gangId = 0, undercover = 0 } = {}) {
        let resolver = null;

        const observerPromise = new Promise(resolve => resolver = resolve);
        const observer = new class {
            onPlayerLogin(player) {
                server.playerManager.removeObserver(observer);
                resolver();
            }
        };

        server.playerManager.addObserver(observer);
        dispatchEvent('playerlogin', {
            playerid: this.id,
            userid: userId,
            gangid: gangId,
            undercover, vip,
        });

        await observerPromise;
    }

    // Issues |message| as if it has been said by this user. Returns whether the event with which
    // the chat message had been issues was prevented.
    async issueMessage(message) {
        let resolver = null;

        const observerPromise = new Promise(resolve => resolver = resolve);

        dispatchEvent('playertext', {
            playerid: this.id,
            text: message,

            // Injected for tests, should be called when processing the message is complete.
            resolver,
        });

        await observerPromise;
    }

    // Issues |commandText| as if it had been send by this player. Returns whether the event with
    // which the command had been issued was prevented.
    async issueCommand(commandText) {
        let defaultPrevented = false;

        await server.commandManager.onPlayerCommandText({
            preventDefault: () => defaultPrevented = true,

            playerid: this.id,
            cmdtext: commandText
        });

        return defaultPrevented;
    }

    // Responds to an upcoming dialog with the given values. The dialog Id that has been shown
    // for the player will be inserted automatically. Responses are forcefully asynchronous.
    respondToDialog({ response = 1 /* left button */, listitem = 0, inputtext = '' } = {}) {
        return this.#lastDialogPromise_.then(() => {
            dispatchEvent('dialogresponse', {
                playerid: this.id,
                dialogid: this.#lastDialogId_,
                response: response,
                listitem: listitem,
                inputtext: inputtext
            });

            return this.#lastDialogPromise_ = new Promise(resolve => {
                this.#lastDialogPromiseResolve_ = resolve;
            });
        });
    }

    // Changes the player's state from |oldState| to |newState|.
    changeState({ oldState, newState } = {}) {
        dispatchEvent('playerstatechange', {
            playerid: this.id,
            oldstate: oldState,
            newstate: newState
        });
    }

    // Triggers an event indicating that the player died.
    die(killerPlayer = null, reason = 0) {
        dispatchEvent('playerdeath', {
            playerid: this.id,
            killerid: killerPlayer ? killerPlayer.id
                                   : Player.kInvalidId,
            reason: reason
        });

        dispatchEvent('playerresolveddeath', {
            playerid: this.id,
            killerid: killerPlayer ? killerPlayer.id
                                   : Player.kInvalidId,
            reason: reason
        });
    }

    // Makes this player fire a shot. All related events will be fired. The |target| may either be
    // a Player or a Vehicle instance, or NULL when the shot didn't hit anything.
    shoot({ target = null, weaponid = 28 /* Uzi */, hitOffset = null, damageAmount = null,
            bodypart = 3 /* BODY_PART_CHEST */ } = {}) {
        let hitType = 0 /* BULLET_HIT_TYPE_NONE */;

        if (target instanceof MockPlayer)
            hitType = 1 /* BULLET_HIT_TYPE_PLAYER */;
        else if (target instanceof MockVehicle)
            hitType = 2 /* BULLET_HIT_TYPE_VEHICLE */;

        hitOffset = hitOffset || new Vector(5, 5, 2);

        dispatchEvent('playerweaponshot', {
            playerid: this.id,
            weaponid: weaponid,
            hittype: hitType,
            hitid: target ? target.id : -1,
            fX: hitOffset.x,
            fY: hitOffset.y,
            fZ: hitOffset.z
        });

        if (!(target instanceof MockPlayer))
            return;

        let damage = damageAmount || Math.floor(Math.random() * 100) + 10;

        dispatchEvent('playergivedamage', {
            playerid: this.id,
            damagedid: target.id,
            amount: damage,
            weaponid: weaponid,
            bodypart: bodypart
        });

        dispatchEvent('playertakedamage', {
            playerid: target.id,
            issuerid: this.id,
            amount: damage,
            weaponid: weaponid,
            bodypart: bodypart
        });
    }
}
