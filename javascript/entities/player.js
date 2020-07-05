// Copyright 2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { PlayerSyncedData } from 'entities/player_synced_data.js';
import { Supplementable } from 'base/supplementable.js';

import { format } from 'base/format.js';
import { murmur3hash } from 'base/murmur3hash.js';
import { toFloat } from 'base/float.js';

// Player
//
// Represents a player connected to the SA-MP server, usually a human. They are the most advanced
// entity in the game, and feature everything from identity, to physics, state and interaction. The
// abilities are therefore grouped in a series of sections:
//
//   * Identity
//   * Physics
//   * State
//   * Environment
//
//   * Interaction
//
//   * Audio
//   * Visual
//   * Vehicles
//
// This class is not directly appropriate for testing, as the Pawn calls would fail. To that end, in
// tests a Player will be represented by the MockPlayer object, which overrides many of the routines
// that would end up making a Pawn call with mocked data.
//
// Different from most code, we've opted to use private properties in this class to aid in keeping
// the list of auto-complete suggestions in code editors as relevant as possible.
//
// If you are considering extending the Player object with additional functionality, take a look at
// the Supplementable system in //base/supplementable.js instead.
export class Player extends Supplementable {
    // ID indicating that a particular Player ID is explicitly not valid.
    static kInvalidId = 65535;

    // Constants applicable to the player's current connection to the server.
    static kConnectionEstablished = 1;
    static kConnectionClosing = 2;
    static kConnectionClosed = 3;

    // Constants applicable to the `Player.fightingStyle` property.
    static kFightingStyleNormal = 4;
    static kFightingStyleBoxing = 5;
    static kFightingStyleKungFu = 6;
    static kFightingStyleKneeHead = 7;
    static kFightingStyleGrabKick = 15;
    static kFightingStyleElbow = 16;

    // Constants applicable to the `Player.level` property.
    static LEVEL_PLAYER = 0;
    static LEVEL_ADMINISTRATOR = 1;
    static LEVEL_MANAGEMENT = 2;

    // Default value for not being in a team = 255 
    // https://wiki.sa-mp.com/wroot/index.php?title=SetPlayerTeam
    static kNoTeam = 255;

    // Default gravity value
    static kDefaultGravity = 0.008;

    // Default lag compensation mode.
    static kDefaultLagCompensationMode = 2;

    // Constants applicable to the `Player.specialAction` property.
    static kSpecialActionNone = 0;
    static kSpecialActionCrouching = 1;  // read-only
    static kSpecialActionJetpack = 2;
    static kSpecialActionEnterVehicle = 3;  // read-only
    static kSpecialActionLeaveVehicle = 4;  // read-only
    static kSpecialActionDance1 = 5;
    static kSpecialActionDance2 = 6;
    static kSpecialActionDance3 = 7;
    static kSpecialActionDance4 = 8;
    static kSpecialActionHandsUp = 10;
    static kSpecialActionCellphone = 11;
    static kSpecialActionSitting = 12;  // read-only
    static kSpecialActionCellphoneDiscard = 13;
    static kSpecialActionDrinkBeer = 20;
    static kSpecialActionSmokeCiggy = 21;
    static kSpecialActionDrinkWine = 22;
    static kSpecialActionDrinkSprunk = 23;
    static kSpecialActionCuffed = 24;  // does not work on skin 0 (CJ)
    static kSpecialActionCarry = 25;  // does not work on skin 0 (CJ)
    static kSpecialActionPissing = 68;

    // Constants applicable to the `Player.state` property.
    static kStateNone = 0;
    static kStateOnFoot = 1;
    static kStateVehicleDriver = 2;
    static kStateVehiclePassenger = 3;
    static kStateWasted = 7;
    static kStateSpawned = 8;
    static kStateSpectating = 9;

    // ---------------------------------------------------------------------------------------------

    #id_ = null;
    #manager_ = null;
    #level_ = null;
    #connectionState_ = null;

    // To be removed:
    #syncedData_ = null;
    #activity_ = Player.PLAYER_ACTIVITY_NONE;
    #gangId_ = null;
    #levelIsTemporary_ = false;
    #messageLevel_ = 0;
    #undercover_ = false;
    #vip_ = false;

    #name_ = null;
    #gpci_ = null;
    #serial_ = null;
    #ipAddress_ = null;
    #isNpc_ = null;

    #selectObjectResolver_ = null;

    #vehicle_ = null;
    #vehicleSeat_ = null;

    constructor(id, manager, ...paramsForTesting) {
        super();

        this.#id_ = id;
        this.#manager_ = manager;
        this.#level_ = Player.LEVEL_PLAYER;
        this.#connectionState_ = Player.kConnectionEstablished;

        this.#syncedData_ = new PlayerSyncedData(id);
    }

    // Initializes the player immediately after construction. Populates caches of static player
    // information to minimise the number of Pawn calls we need during operation.
    initialize() {
        this.#name_ = pawnInvoke('GetPlayerName', 'iS', this.#id_);
        this.#gpci_ = pawnInvoke('gpci', 'iS', this.#id_);
        this.#serial_ = murmur3hash(this.#gpci_ || 'npc');
        this.#ipAddress_ = pawnInvoke('GetPlayerIp', 'iS', this.#id_);
        this.#isNpc_ = !!pawnInvoke('IsPlayerNPC', 'i', this.#id_);
    }

    notifyDisconnecting() { this.#connectionState_ = Player.kConnectionClosing; }
    notifyDisconnected() { this.#connectionState_ = Player.kConnectionClosed; }

    // ---------------------------------------------------------------------------------------------
    // Section: Identity
    // ---------------------------------------------------------------------------------------------

    get id() { return this.#id_; }

    get name() { return this.#name_; }
    set name(value) {
        pawnInvoke('SetPlayerName', 'is', this.#id_, value);
        pawnInvoke('OnPlayerNameChange', 'i', this.#id_);

        this.#name_ = value;

        // Let other parts in the gamemode know about the name change.
        server.playerManager.onPlayerNameChange(this, /* update= */ false);
    }

    get ip() { return this.#ipAddress_; }

    get gpci() { return this.#gpci_; }
  
    get serial() { return this.#serial_; }

    get packetLossPercentage() {
        return toFloat(pawnInvoke('NetStats_PacketLossPercent', 'i', this.#id_))
    }

    get ping() { return pawnInvoke('GetPlayerPing', 'i', this.#id_); }

    isServerAdmin() { return !!pawnInvoke('IsPlayerAdmin', 'i', this.#id_); }

    isConnected() {
        return this.#connectionState_ === Player.kConnectionEstablished ||
               this.#connectionState_ === Player.kConnectionClosing;
    }

    isDisconnecting() { return this.#connectionState_ === Player.kConnectionClosing; }

    isNonPlayerCharacter() { return this.#isNpc_; }

    kick() { pawnInvoke('Kick', 'i', this.#id_); }

    updateName() { this.#name_ = pawnInvoke('GetPlayerName', 'iS', this.#id_); }

    // ---------------------------------------------------------------------------------------------
    // Section: Weapons
    // ---------------------------------------------------------------------------------------------

    giveSpawnWeapon(weaponId, multiplier) {
        wait(0).then(() => pawnInvoke('OnGiveSpawnWeapon', 'iii', this.#id_, weaponId, multiplier))
    }

    giveSpawnArmour() {
        wait(0).then(() => pawnInvoke('OnGiveSpawnArmour', 'i', this.#id_))
    }

    // Give a player a certain weapon with ammo.
    giveWeapon(weaponId, ammo) {
        wait(0).then(() => pawnInvoke('OnGiveWeapon', 'iii', this.#id_, weaponId, ammo));
    }

    removeWeapon(weaponId) {
        wait(0).then(() => pawnInvoke('OnRemovePlayerWeapon', 'ii', this.#id_, weaponId));
    }

    // Resets all the weapons a player has.
    resetWeapons() {
        wait(0).then(() => pawnInvoke('OnResetPlayerWeapons', 'i', this.#id_));
    }

    // ---------------------------------------------------------------------------------------------
    // Section: Physics
    // ---------------------------------------------------------------------------------------------

    get position() { return new Vector(...pawnInvoke('GetPlayerPos', 'iFFF', this.#id_)); }
    set position(value) {
        pawnInvoke('SetPlayerPos', 'ifff', this.#id_, value.x, value.y, value.z);
    }

    get rotation() { return pawnInvoke('GetPlayerFacingAngle', 'iF', this.#id_); }
    set rotation(value) { pawnInvoke('SetPlayerFacingAngle', 'if', this.#id_, value); }

    get velocity() { return new Vector(...pawnInvoke('GetPlayerVelocity', 'iFFF', this.#id_)); }
    set velocity(value) {
        pawnInvoke('SetPlayerVelocity', 'ifff', this.#id_, value.x, value.y, value.z);
    }

    get interiorId() { return pawnInvoke('GetPlayerInterior', 'i', this.#id_); }
    set interiorId(value) { pawnInvoke('SetPlayerInterior', 'ii', this.#id_, value); }

    get virtualWorld() { return pawnInvoke('GetPlayerVirtualWorld', 'i', this.#id_); }
    set virtualWorld(value) {
        if (this.#syncedData_.isIsolated())
            return;

        pawnInvoke('SetPlayerVirtualWorld', 'ii', this.#id_, value);
    }

    resetWorldBoundaries() { this.setWorldBoundaries(20000, -20000, 20000, -20000); }

    setWorldBoundaries(maxX, minX, maxY, minY) {
        pawnInvoke('SetPlayerWorldBounds', 'iffff', this.#id_, maxX, minX, maxY, minY);
    }

    // ---------------------------------------------------------------------------------------------
    // Section: State
    // ---------------------------------------------------------------------------------------------

    get color() { return Color.fromNumberRGBA(pawnInvoke('GetPlayerColor', 'i', this.#id_)); }
    set color(value) { pawnInvoke('SetPlayerColor', 'ii', this.#id_, value.toNumberRGBA()); }

    get health() { return pawnInvoke('GetPlayerHealth', 'iF', this.#id_); }
    set health(value) { pawnInvoke('SetPlayerHealth', 'if', this.#id_, value); }

    get armour() { return pawnInvoke('GetPlayerArmour', 'iF', this.#id_); }
    set armour(value) { pawnInvoke('SetPlayerArmour', 'if', this.#id_, value); }

    get controllable() { throw new Error('Unable to get whether the player is controllable.'); }
    set controllable(value) {
        pawnInvoke('TogglePlayerControllable', 'ii', this.#id_, value ? 1 : 0);
    }

    get level() { return this.#level_; }
    set level(value) { this.#level_ = value; }

    get skin() { return pawnInvoke('GetPlayerSkin', 'i', this.#id_); }
    set skin(value) { pawnInvoke('SetPlayerSkin', 'ii', this.#id_, value); }

    get specialAction() { return pawnInvoke('GetPlayerSpecialAction', 'i', this.#id_); }
    set specialAction(value) { pawnInvoke('SetPlayerSpecialAction', 'ii', this.#id_, value); }

    get state() { return pawnInvoke('GetPlayerState', 'i', this.#id_); }

    isAdministrator() { return this.#level_ >= Player.LEVEL_ADMINISTRATOR; }

    isManagement() { return this.#level_ >= Player.LEVEL_MANAGEMENT; }

    isMinimized() { return isPlayerMinimized(this.#id_); }

    respawn() { pawnInvoke('SpawnPlayer', 'i', this.#id_); }

    toggleVisibilityToPlayer(target, visible) {
        pawnInvoke('ShowPlayerNameTagForPlayer', 'iii', target.id, this.#id_, !!visible ? 1 : 0);
    }

    // ---------------------------------------------------------------------------------------------
    // Section: Environment
    // ---------------------------------------------------------------------------------------------

    get drunkLevel() { return pawnInvoke('GetPlayerDrunkLevel', 'i', this.#id_); }
    set drunkLevel(value) { pawnInvoke('SetPlayerDrunkLevel', 'ii', this.#id_, value); }

    get fightingStyle() { return pawnInvoke('GetPlayerFightingStyle', 'i', this.#id_); }
    set fightingStyle(value) { pawnInvoke('SetPlayerFightingStyle', 'ii', this.#id_, value); }

    get gravity() { return undefined; }
    set gravity(value) { pawnInvoke('SetPlayerGravity', 'if', this.#id_, value); }

    get score() { return pawnInvoke('GetPlayerScore', 'i', this.#id_); }
    set score(value) { pawnInvoke('SetPlayerScore', 'ii', this.#id_, value); }

    get team() { return pawnInvoke('GetPlayerTeam', 'i', this.#id_); }
    set team(value) { pawnInvoke('SetPlayerTeam', 'ii', this.#id_, value); }

    get time() { return pawnInvoke('GetPlayerTime', 'iII', this.#id_); }
    set time(value) { pawnInvoke('SetPlayerTime', 'iii', this.#id_, value[0], value[1]); }

    get wantedLevel() { return pawnInvoke('GetPlayerWantedLevel', 'i', this.#id_); }
    set wantedLevel(value) { pawnInvoke('SetPlayerWantedLevel', 'ii', this.#id_, value); }

    get weather() { throw new Error('Unable to get the current weather for players.'); }
    set weather(value) { pawnInvoke('SetPlayerWeather', 'ii', this.#id_, value); }

    // ---------------------------------------------------------------------------------------------
    // Section: Interaction
    // ---------------------------------------------------------------------------------------------

    async cancelEdit(resolveActive = true) {
        pawnInvoke('CancelEdit', 'i', this.#id_);

        if (this.#selectObjectResolver_ && resolveActive) {
            this.#selectObjectResolver_(null);
            this.#selectObjectResolver_ = null;
        }
    }

    async selectObjectInternal() { pawnInvoke('SelectObject', 'i', this.#id_); }
    async selectObject() {
        if (this.#selectObjectResolver_)
            this.cancelEdit();

        this.#manager_.didRequestSelectObject(this);
        this.selectObjectInternal();

        return new Promise(resolve => this.#selectObjectResolver_ = resolve);
    }

    isSelectingObject() { return this.#selectObjectResolver_ !== null; }

    onObjectSelected(object) {
        // Forcefully cancel the player's editing mode, which includes the ability to select an
        // object, as we never want them to be able to select multiple objects at once.
        this.cancelEdit(false);

        if (!this.#selectObjectResolver_)
            return;  // the |player| is not selecting an object

        this.#selectObjectResolver_(object);
        this.#selectObjectResolver_ = null;
    }

    showDialog(dialogId, style, caption, message, leftButton, rightButton) {
        pawnInvoke('ShowPlayerDialog', 'iiissss', this.#id_, dialogId, style, caption, message,
                                                  leftButton, rightButton);
    }

    sendMessage(message, ...args) {
        if (args.length)
            message = format(message, ...args);

        // Escape all percentage signs with double percentage signs, as the |message| parameter of
        // SendClientMessage is ran through vsprintf within the SA-MP server, which could crash.
        const escapedMessage = message.replace(/%/g, '%%');

        pawnInvoke('SendClientMessage', 'iis', this.#id_, 0xFFFFFFFF, escapedMessage);
    }

    gameText(message, time, style) {
        if(time === undefined || time === null || time <= 0) {
            return;
        }

        pawnInvoke('GameTextForPlayer', 'isii', this.id, message, time, style);
    }

    // ---------------------------------------------------------------------------------------------
    // Section: Audio
    // ---------------------------------------------------------------------------------------------

    playAudioStream(url) {
        pawnInvoke('PlayAudioStreamForPlayer', 'isffffi', this.#id_, url, 0, 0, 0, 50, 0);
    }

    playSound(soundId) { pawnInvoke('PlayerPlaySound', 'iifff', this.#id_, soundId, 0, 0, 0); }

    stopAudioStream() { pawnInvoke('StopAudioStreamForPlayer', 'i', this.#id_); }

    // ---------------------------------------------------------------------------------------------
    // Section: Visual
    // ---------------------------------------------------------------------------------------------

    animate({ library, name, delta = 4.1, loop = false, lock = false, freeze = false,
              time = 0, forceSync = false } = {}) {
        pawnInvoke('ApplyAnimation', 'issfiiiiii',
            this.#id_, library, name, delta, loop ? 1 : 0, lock ? 1 : 0, lock ? 1 : 0,
            freeze ? 1 : 0, time, forceSync ? 1 : 0);
    }

    get animationIndex() { return pawnInvoke('GetPlayerAnimationIndex', 'i', this.#id_); }

    clearAnimations() { pawnInvoke('ClearAnimations', 'i', this.#id_); }

    get cameraPosition() {
        return new Vector(...pawnInvoke('GetPlayerCameraPos', 'iFFF', this.#id_));
    }

    get cameraFrontVector() {
        return new Vector(...pawnInvoke('GetPlayerCameraFrontVector', 'iFFF', this.#id_));
    }

    interpolateCamera(positionFrom, positionTo, targetFrom, targetTo, duration) {
        pawnInvoke('InterpolateCameraPos', 'iffffffii', this.#id_, positionFrom.x, positionFrom.y,
                   positionFrom.z, positionTo.x, positionTo.y, positionTo.z, duration, 1);
        pawnInvoke('InterpolateCameraLookAt', 'iffffffii', this.#id_, targetFrom.x, targetFrom.y,
                   targetFrom.z, targetTo.x, targetTo.y, targetTo.z, duration, 1);
    }

    resetCamera() { pawnInvoke('SetCameraBehindPlayer', 'i', this.#id_); }

    setCamera(position, target) {
        pawnInvoke('SetPlayerCameraPos', 'ifff', this.#id_, position.x, position.y, position.z);
        pawnInvoke('SetPlayerCameraLookAt', 'ifffi', this.#id_, target.x, target.y, target.z, 2);
    }
  
    setSpectating(value) { pawnInvoke('TogglePlayerSpectating', 'ii', this.#id_, value ? 1 : 0); }

    // ---------------------------------------------------------------------------------------------
    // Section: Vehicles
    // ---------------------------------------------------------------------------------------------

    get vehicle() { return this.#vehicle_; }
    set vehicle(value) { this.#vehicle_ = value; }
  
    get vehicleSeat() { return this.#vehicleSeat_; }
    set vehicleSeat(value) { this.#vehicleSeat_ = value; }

    get vehicleCollisionsEnabled() { throw new Error('Unable to read this setting.'); }
    set vehicleCollisionsEnabled(value) {
        pawnInvoke('DisableRemoteVehicleCollisions', 'ii', this.#id_, value ? 0 : 1);
    }

    enterVehicle(vehicle, seat = 0) {
        if (this.#syncedData_.isIsolated() && vehicle.virtualWorld != this.virtualWorld)
            return;

        if (this.#vehicle_)
            this.leaveVehicleWithAnimation();

        if (typeof vehicle === 'number')
            pawnInvoke('PutPlayerInVehicle', 'iii', this.#id_, vehicle, seat);
        else if (vehicle instanceof Vehicle)
            pawnInvoke('PutPlayerInVehicle', 'iii', this.#id_, vehicle.id, seat);
        else
            throw new Error('Unknown vehicle to put the player in: ' + vehicle);
    }

    isSurfingVehicle() {
        return pawnInvoke('GetPlayerSurfingVehicleID', 'i', this.#id_) !== Vehicle.kInvalidId;
    }

    leaveVehicle() { this.position = this.position; }
    leaveVehicleWithAnimation() { pawnInvoke('RemovePlayerFromVehicle', 'i', this.#id_); }

    // ---------------------------------------------------------------------------------------------

    toString() { return `[object Player(${this.#id_}, ${this.#name_})]`; }

    // ---------------------------------------------------------------------------------------------
    // Stuff that needs a better home
    // ---------------------------------------------------------------------------------------------
    get syncedData() { return this.#syncedData_; }

    restoreState() { pawnInvoke('OnSerializePlayerState', 'iii', this.#id_, 0, -1); }
    serializeState(restoreOnSpawn = false) {
        pawnInvoke('OnSerializePlayerState', 'iii', this.#id_, 1, restoreOnSpawn ? 1 : 0);
    }

    get levelIsTemporary() { return this.#levelIsTemporary_; }
    set levelIsTemporary(value) { this.#levelIsTemporary_ = value; }

    isTemporaryAdministrator() { return this.isAdministrator() && this.#levelIsTemporary_; }

    updateStreamerObjects() { pawnInvoke('Streamer_Update', 'ii', this.#id_, 0); }
    updateStreamer(position, virtualWorld, interiorId, type) {
        pawnInvoke('Streamer_UpdateEx', 'ifffiiiii', this.#id_, position.x, position.y, position.z,
                   virtualWorld, interiorId, type, /* compensatedTime= */ -1,
                   /* freezePlayer= */ 1);
    }

    get activity() { return this.#activity_; }
    set activityInternal(value) { this.#activity_ = value; }
    set activity(activity) {
        this.#activity_ = activity;

        // Asynchronously inform the Pawn script of the activity change.
        Promise.resolve().then(() =>
            pawnInvoke('OnPlayerActivityChange', 'ii', this.#id_, activity));
    }

    get messageLevel() { return this.#messageLevel_; }
    set messageLevel(value) { this.#messageLevel_ = value; }

    get gangId() { return this.#gangId_; }
    set gangId(value) { this.#gangId_ = value; }

    isUndercover() { return this.#undercover_; }
    setUndercover(value) { this.#undercover_ = value; }

    isVip() { return this.#vip_; }
    setVip(value) { this.#vip_ = value; }
};

// DO NOT ADD NEW VALUES TO THIS ENUMERATION WITHOUT ALSO ADDING THEM TO PAWN.
//     //pawn/Entities/Players/PlayerActivity.pwn
Player.PLAYER_ACTIVITY_NONE = 0;
Player.PLAYER_ACTIVITY_JS_RACE = 1;
Player.PLAYER_ACTIVITY_JS_DM_ZONE = 2;


// Utility function: convert a player's level to a string.
global.playerLevelToString = (level, plural = false) => {
  switch (level) {
    case Player.LEVEL_PLAYER:
      return plural ? 'players' : 'player';
    case Player.LEVEL_ADMINISTRATOR:
      return plural ? 'administrators' : 'administrator';
    case Player.LEVEL_MANAGEMENT:
      return plural ? 'Management members' : 'Management member';
  }

  throw new Error('Invalid player level supplied: ' + level);
};

// Expose the Player object globally since it will be commonly used.
global.Player = Player;
