// Copyright 2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import PlayerSyncedData from 'entities/player_synced_data.js';
import PlayerSettings from 'entities/player_settings.js';
import { Supplementable } from 'base/supplementable.js';

import { murmur3hash } from 'base/murmur3hash.js';
import { toFloat } from 'base/float.js';

// Player
//
// Represents a player connected to the SA-MP server, usually a human. They are the most advanced
// entity in the game, and feature everything from identity, to physics, state and interaction. The
// abilities are therefore grouped in a series of sections:
//
//   * Identity
//     Contains information on who the player is: their ID, nickname, IP address and serial. Most
//     of this information is constant, and will have been cached by the `initialize()` method.
//
//   * Physics
//     Where in the world are they? In which interior ID and virtual world? How fast are they
//     going? All of these properties have both getters and setters.
//
//   * State
//     What are their health and armour values?
//
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
class Player extends Supplementable {
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
    #connected_ = null;

    #name_ = null;
    #gpci_ = null;
    #serial_ = null;
    #ipAddress_ = null;
    #isNpc_ = null;

    constructor(id) {
        super();

        this.#id_ = id;
        this.#connected_ = true;

        this.initialize();
        this.initializeDeprecated();
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

    // ---------------------------------------------------------------------------------------------
    // Section: Identity
    // ---------------------------------------------------------------------------------------------

    get id() { return this.#id_; }

    get name() { return this.#name_; }
    set name(value) {
        pawnInvoke('SetPlayerName', 'is', this.#id_, value);
        pawnInvoke('OnPlayerNameChange', 'i', this.#id_);

        this.#name_ = value;    
    }

    get ip() { return this.#ipAddress_; }

    get gpci() { return this.#gpci_; }
  
    get serial() { return this.#serial_; }

    isServerAdmin() { return !!pawnInvoke('IsPlayerAdmin', 'i', this.#id_); }

    isConnected() { return this.#connected_; }

    isNonPlayerCharacter() { return this.#isNpc_; }

    setNameForGuestLogin(value) { this.#name_ = value; }

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
        if (this.syncedData_.isIsolated())
            return;

        pawnInvoke('SetPlayerVirtualWorld', 'ii', this.#id_, value);
    }

    // ---------------------------------------------------------------------------------------------
    // Section: State
    // ---------------------------------------------------------------------------------------------

    get health() { return pawnInvoke('GetPlayerHealth', 'iF', this.#id_); }
    set health(value) { pawnInvoke('SetPlayerHealth', 'if', this.#id_, value); }

    get armour() { return pawnInvoke('GetPlayerArmour', 'iF', this.#id_); }
    set armour(value) { pawnInvoke('SetPlayerArmour', 'if', this.#id_, value); }

    get controllable() { throw new Error('Unable to get whether the player is controllable.'); }
    set controllable(value) {
        pawnInvoke('TogglePlayerControllable', 'ii', this.#id_, value ? 1 : 0);
    }

    get specialAction() { return pawnInvoke('GetPlayerSpecialAction', 'i', this.#id_); }
    set specialAction(value) { pawnInvoke('SetPlayerSpecialAction', 'ii', this.#id_, value); }

    get state() { return pawnInvoke('GetPlayerState', 'i', this.#id_); }

    isMinimized() { return isPlayerMinimized(this.#id_); }

    // ---------------------------------------------------------------------------------------------





    



  // Creates a new instance of the Player class for |playerId|.
  initializeDeprecated() {
    const playerId = this.#id_;

    this.id_ = playerId;
    this.syncedData_ = new PlayerSyncedData(playerId);

    this.disconnecting_ = false;

    this.level_ = Player.LEVEL_PLAYER;
    this.levelIsTemporary_ = false;
    
    this.vip_ = false;
    this.undercover_ = false;

    this.userId_ = null;
    this.gangId_ = null;

    this.vehicleCollisionsEnabled_ = true;
    this.activity_ = Player.PLAYER_ACTIVITY_NONE;
    this.messageLevel_ = 0;

    this.vehicle_ = null;
    this.vehicleSeat_ = null;

    this.playerSettings_ = new PlayerSettings();
  }


  // Returns whether the player is currently in process of disconnecting.
  isDisconnecting() { return this.disconnecting_; }

  // Marks the player as being in process of disconnecting from the server.
  notifyDisconnecting() {
    this.disconnecting_ = true;
  }

  // Marks the player as having disconnected from the server.
  notifyDisconnected() {
    this.#connected_ = false;
    this.disconnecting_ = false;
  }

  // Gets the level of this player. Synchronized with the gamemode using the `levelchange` event.
  get level() { return this.level_; }

  // Gets whether the player's level is temporary. Certain restrictions might apply in that case.
  get levelIsTemporary() { return this.levelIsTemporary_; }

  // Gets the PlayerSynchedData object, representing data that's synchronized between the Pawn and
  // JavaScript implementations of Las Venturas Playground.
  get syncedData() { return this.syncedData_; }

  // Returns whether the player is an administrator on Las Venturas Playground.
  isAdministrator() {
    return this.level_ == Player.LEVEL_ADMINISTRATOR ||
           this.level_ == Player.LEVEL_MANAGEMENT;
  }

  // Returns whether the player is a temporary administrator.
  isTemporaryAdministrator() {
    return this.isAdministrator() && this.levelIsTemporary_;
  }

  // Returns whether the player is a Management member on Las Venturas Playground.
  isManagement() { return this.level_ == Player.LEVEL_MANAGEMENT; }

  // Returns whether the player is undercover, i.e. does not use their own account.
  isUndercover() { return this.undercover_; }

  // Returns whether the player is registered and logged in to their account.
  isRegistered() { return this.userId_ !== null; }

  // Gets the user Id of the player's account if they have identified to it.
  get userId() { return this.userId_; }

  // Returns whether this player is a VIP member of Las Venturas Playground.
  isVip() { return this.vip_; }

  // Gets or sets the Id of the gang this player is part of.
  get gangId() { return this.gangId_; }
  set gangId(value) { this.gangId_ = value; }


  // Gets the vehicle the player is currently driving in. May be NULL.
  get vehicle() { return this.vehicle_; }

  // Gets the seat in the |vehicle| the player is currently sitting in. May be NULL when the player
  // is not driving a vehicle. May be one of the Vehicle.SEAT_* constants.
  get vehicleSeat() { return this.vehicleSeat_; }

  // Returns the Id of the vehicle the player is currently driving in, or the ID of the seat in
  // which the player is sitting whilst driving the vehicle. Should only be used by the manager.
  findVehicleId() { return pawnInvoke('GetPlayerVehicleID', 'i', this.id_) || null; }
  findVehicleSeat() { return pawnInvoke('GetPlayerVehicleSeat', 'i', this.id_); }

  // Makes the player enter the given |vehicle|, optionally in the given |seat|.
  enterVehicle(vehicle, seat = 0 /* driver */) {
    if (this.syncedData_.isIsolated() && vehicle.virtualWorld != this.virtualWorld_)
      return;

    pawnInvoke('PutPlayerInVehicle', 'iii', this.id_, vehicle.id, seat);
  }

  // Makes the player leave the vehicle they're currently in.
  leaveVehicle() { this.position = this.position; }

  // Gets or sets the time for this player. It will be returned, and must be set, as an array having
  // two entries: hours and minutes.
  get time() { return pawnInvoke('GetPlayerTime', 'iII', this.id); }
  set time(value) { pawnInvoke('SetPlayerTime', 'iii', this.id, value[0], value[1]); }

  // Sets the player's weather. We cannot provide a getter for this, given that SA-MP does not
  // expose whatever weather is current for the player. Silly.
  set weather(value) { pawnInvoke('SetPlayerWeather', 'ii', this.id_, value); }

  // Gets or sets the drunk level of this player.
  get drunkLevel() { return pawnInvoke('GetPlayerDrunkLevel', 'i', this.id_); }
  set drunkLevel(value) { pawnInvoke('SetPlayerDrunkLevel', 'ii', this.id_, value); }

  // Kicks the player from the server. The user of this function is responsible for making sure
  // that the reason for the kick is properly recorded.
  kick() { pawnInvoke('Kick', 'i', this.id_); }

  // Returns an object with the keys that the player is currently pressing.
  getKeys() {
    const [keys, updown, leftright] = pawnInvoke('GetPlayerKeys', 'iIII', this.id_);
    return {
      aim: keys & 128 /* KEY_AIM */,
      crouch: keys & 2 /* KEY_CROUCH */,
      fire: keys & 4 /* KEY_JUMP */,
      jump: keys & 32 /* SNEAK_ABOUT */,
      sprint: keys & 8 /* PED_SPRINT */,

      up: updown === -128 /* KEY_UP */,
      down: updown === 128 /* KEY_DOWN */,
      left: leftright === -128 /* KEY_LEFT */,
      right: leftright === 128 /* KEY_RIGHT */
    };
  }

  // Applies the animation from |library| and |name| to the player. The |loop| argument decides
  // whether it should loop until the |time| runs out. |lock| determines whether the player should
  // be returned to their position after the animation finishes, and |freeze| determines whether
  // the player should be frozen after the animation finishes.
  animate({ library, name, delta = 4.1, loop = false, lock = false, freeze = false,
            time = 0, forceSync = false } = {}) {
    pawnInvoke('ApplyAnimation', 'issfiiiiii', this.id_, library, name, delta, loop ? 1 : 0,
                                              lock ? 1 : 0, lock ? 1 : 0, freeze ? 1 : 0,
                                              time, forceSync ? 1 : 0);
  }

  // Gets the current animation index applying to this player.
  get animationIndex() { return pawnInvoke('GetPlayerAnimationIndex', 'i', this.id_); }

  // Clears the animations applied to the player.
  clearAnimations() { pawnInvoke('ClearAnimations', 'i', this.id_); }

  // Gets or sets whether vehicle collisions should be enabled for this player.
  get vehicleCollisionsEnabled() { return this.vehicleCollisionsEnabled_; }
  set vehicleCollisionsEnabled(value) {
    pawnInvoke('DisableRemoteVehicleCollisions', 'ii', this.id_, value ? 0 : 1);
    this.vehicleCollisionsEnabled_ = !!value;
  }

  // Returns whether the player is currently surfing a vehicle.
  isSurfingVehicle() {
    return pawnInvoke('GetPlayerSurfingVehicleID', 'i', this.id_) !== Player.INVALID_ID;
  }

  // Returns the vehicle the player is currently driving in, when the player is in a vehicle and
  // the vehicle is owned by the JavaScript code.
  currentVehicle() {
    return server.vehicleManager.getById(pawnInvoke('GetPlayerVehicleID', 'i', this.id_));
  }

  // Returns whether the player is in an vehicle. If |vehicle| is provided, this method will check
  // whether the player is in that particular vehicle. Otherwise any vehicle will do.
  isInVehicle(vehicle) {
    if (typeof vehicle === 'number')
      return pawnInvoke('GetPlayerVehicleID', 'i') == vehicle;

    // TODO: Handle Vehicle instances for |vehicle|.

    return pawnInvoke('IsPlayerInAnyVehicle', 'i', this.id_);
  }

  // Removes the player from the vehicle they're currently in.
  removeFromVehicle() { pawnInvoke('RemovePlayerFromVehicle', 'i', this.id_); }

  // Puts the player in |vehicle|, optionally defining |seat| as the seat they should sit in. If the
  // player already is in a vehicle, they will be removed from that before being put in the other in
  // order to work around a SA-MP bug where they may show up in the wrong vehicle for some players.
  putInVehicle(vehicle, seat = 0) {
    if (this.isInVehicle())
      this.removeFromVehicle();

    if (typeof vehicle === 'number')
      pawnInvoke('PutPlayerInVehicle', 'iii', this.id_, vehicle, seat);
    else if (vehicle instanceof Vehicle)
      pawnInvoke('PutPlayerInVehicle', 'iii', this.id_, vehicle.id, seat);
    else
      throw new Error('Unknown vehicle to put the player in: ' + vehicle);
  }

  // Gets the player's current packet loss, as a percentage.
  get packetLossPercent() {
    return toFloat(pawnInvoke('NetStats_PacketLossPercent', 'i', this.id_));
  }

  // Gets the player's current ping, in milliseconds.
  get ping() {
    return pawnInvoke('GetPlayerPing', 'i', this.id_);
  }

  // Gets or sets the gang color of this player. May be NULL when no color has been defined.
  get gangColor() { throw new Error('Player.gangColor() has not been implemented yet.'); }
  set gangColor(value) {
    pawnInvoke('OnUpdatePlayerGangColor', 'ii', this.id_, value ? value.toNumberRGBA() : 0);
  }

  // Gets the color applied to this player.
  get color() { return Color.fromNumberRGBA(pawnInvoke('GetPlayerColor', 'i', this.id_)); }

  // Respawns the player.
  respawn() { pawnInvoke('SpawnPlayer', 'i', this.id_); }

  // Sets whether the player should be in spectator mode. Disabling spectator mode will force them
  // to respawn immediately after, which may be an unintended side-effect.
  setSpectating(spectating) {
    pawnInvoke('TogglePlayerSpectating', 'ii', this.id_, spectating ? 1 : 0);
  }

  // Sets whether the player is currently selecting a text draw on their screen. If so, the
  // |hoverColor| can be supplied to highlight the selected text draws.
  setSelectTextDraw(selecting, hoverColor = null) {
    if (selecting)
      pawnInvoke('SelectTextDraw', 'ii', this.id_, (hoverColor || Color.WHITE).toNumberRGBA());
    else
      pawnInvoke('CancelSelectTextDraw', 'i', this.id_);
  }

  // Returns the player's last shot vectors as two vectors: source and target.
  getLastShotVectors() {
    const positions = pawnInvoke('GetPlayerLastShotVectors', 'iFFFFFF', this.id_);
    return {
      source: new Vector(positions[0], positions[1], positions[2]),
      target: new Vector(positions[3], positions[4], positions[5]),
    };
  }

  // Returns a vector of the position of the player's camera.
  get cameraPosition() {
    return new Vector(...pawnInvoke('GetPlayerCameraPos', 'iFFF', this.id_));
  }

  // Returns a vector of the front-vector of the player's camera.
  get cameraFrontVector() {
    return new Vector(...pawnInvoke('GetPlayerCameraFrontVector', 'iFFF', this.id_));
  }

  // Sets the player's camera to |position| and |target|, both of which must be vectors. The camera
  // position is interpolated becaue this makes it play nice with spectating and camera streaming.
  setCamera(position, target) {
    pawnInvoke('SetPlayerCameraPos', 'ifff', this.id_, position.x, position.y, position.z);
    pawnInvoke('SetPlayerCameraLookAt', 'ifffi', this.id_, target.x, target.y, target.z, 2);
  }

  // Interpolates the player's camera from |positionFrom|, |targetFrom| to |positionTo|, |targetTo|,
  // which must be vectors, in |duration| milliseconds.
  interpolateCamera(positionFrom, positionTo, targetFrom, targetTo, duration) {
    pawnInvoke('InterpolateCameraPos', 'iffffffii', this.id_, positionFrom.x, positionFrom.y,
               positionFrom.z, positionTo.x, positionTo.y, positionTo.z, duration, 1);
    pawnInvoke('InterpolateCameraLookAt', 'iffffffii', this.id_, targetFrom.x, targetFrom.y,
               targetFrom.z, targetTo.x, targetTo.y, targetTo.z, duration, 1);
  }

  // Resets the player's camera to be positioned behind them.
  resetCamera() {
    pawnInvoke('SetCameraBehindPlayer', 'i', this.id_);
  }

  // Plays the audio stream at |streamUrl| for the player.
  playAudioStream(streamUrl) {
    pawnInvoke('PlayAudioStreamForPlayer', 'isffffi', this.id_, streamUrl, 0, 0, 0, 50, 0);
  }

  // Stops the playback of any audio stream for the player.
  stopAudioStream() { pawnInvoke('StopAudioStreamForPlayer', 'i', this.id_); }

  // Plays |soundId| for the player at their current position.
  playSound(soundId) {
    pawnInvoke('PlayerPlaySound', 'iifff', this.id_, soundId, 0, 0, 0);
  }

  serializeState(restoreOnSpawn = false) {
    pawnInvoke('OnSerializePlayerState', 'iii', this.id_, 1 /* serialize */, restoreOnSpawn ? 1 :0);
  }

  restoreState() {
    pawnInvoke('OnSerializePlayerState', 'iii', this.id_, 0 /* serialize */, -1);
  }

  // Returns or updates the activity of this player. Updating the activity will be propagated to
  // the Pawn part of the gamemode as well.
  get activity() { return this.activity_; }
  set activity(activity) {
    this.activity_ = activity;

    // Asynchronously inform the Pawn script of the activity change.
    Promise.resolve().then(() =>
        pawnInvoke('OnPlayerActivityChange', 'ii', this.id_, activity));
  }

  // Gets the message level at which this player would like to receive messages. Only applicable
  // to administrators on the server.
  get messageLevel() { return this.messageLevel_; }

  // Displays the dialog for |caption| explained by |message| to the player.
  showDialog(dialogId, style, caption, message, leftButton, rightButton) {
    pawnInvoke('ShowPlayerDialog', 'iiissss', this.id_, dialogId, style, caption, message,
               leftButton, rightButton);
  }

  // Sends |message| to the player. The |message| can either be a scalar JavaScript value or an
  // instance of the Message class that exists in //base if you wish to use colors.
  sendMessage(message, ...args) {
    // TODO: Verify that any formatting used in |message| is valid.

    if (message instanceof Message)
      message = Message.format(message, ...args);

    pawnInvoke('SendClientMessage', 'iis', this.id_, 0xFFFFFFFF, message.toString());
  }

  // Removes default game objects from the map of model |modelId| that are within |radius| units
  // of the |position|. Should be called while the player is connecting to the server.
  removeGameObject(modelId, position, radius) {
    pawnInvoke('RemoveBuildingForPlayer', 'iiffff', this.id_, modelId, position.x, position.y,
               position.z, radius);
  }

  // Toggles display of the statistics display in the player's bottom-right corner.
  toggleStatisticsDisplay(enabled) {
    Promise.resolve().then(() =>
        pawnInvoke('OnToggleStatisticsDisplay', 'ii', this.id_, enabled ? 1 : 0));
  }

  // -----------------------------------------------------------------------------------------------
  // TODO: The following methods should not be on the common Player object, but rather provided by
  // a feature of sorts.

  updateStreamerObjects() {
    pawnInvoke('Streamer_Update', 'ii', this.id_, 0 /* STREAMER_TYPE_OBJECT */);
  }

  updateStreamer(position, virtualWorld, interiorId, type) {
    pawnInvoke('Streamer_UpdateEx', 'ifffiii', this.id_, position.x, position.y, position.z,
               virtualWorld, interiorId, type);
  }

  // Settings for the player stored inside the database.
  get settings() {
    return this.playerSettings_;
  }
};

// Invalid player id. Must be equal to SA-MP's INVALID_PLAYER_ID definition.
Player.INVALID_ID = 0xFFFF;

// The level of a player. Can be accessed using the `level` property on a Player instance.
Player.LEVEL_PLAYER = 0;
Player.LEVEL_ADMINISTRATOR = 1;
Player.LEVEL_MANAGEMENT = 2;

// The states a player can be in. Used by Player.state and `playerstatechange` events.
Player.STATE_NONE = 0;
Player.STATE_ON_FOOT = 1;
Player.STATE_DRIVER = 2;
Player.STATE_PASSENGER = 3;
Player.STATE_EXIT_VEHICLE = 4;
Player.STATE_ENTER_VEHICLE_DRIVER = 5;
Player.STATE_ENTER_VEHICLE_PASSENGER = 6;
Player.STATE_WASTED = 7;
Player.STATE_SPAWNED = 8;
Player.STATE_SPECTATING = 9;

// The special actions that a player can be engaged in. Used by Player.specialAction.
Player.SPECIAL_ACTION_NONE = 0;
Player.SPECIAL_ACTION_DUCK = 1;
Player.SPECIAL_ACTION_USEJETPACK = 2;
Player.SPECIAL_ACTION_ENTER_VEHICLE = 3;
Player.SPECIAL_ACTION_EXIT_VEHICLE = 4;
Player.SPECIAL_ACTION_DANCE1 = 5;
Player.SPECIAL_ACTION_DANCE2 = 6;
Player.SPECIAL_ACTION_DANCE3 = 7;
Player.SPECIAL_ACTION_DANCE4 = 8;
Player.SPECIAL_ACTION_HANDSUP = 10;
Player.SPECIAL_ACTION_USECELLPHONE = 11;
Player.SPECIAL_ACTION_SITTING = 12;
Player.SPECIAL_ACTION_STOPUSECELLPHONE = 13;
Player.SPECIAL_ACTION_DRINK_BEER = 20;
Player.SPECIAL_ACTION_SMOKE_CIGGY = 21;
Player.SPECIAL_ACTION_DRINK_WINE = 22;
Player.SPECIAL_ACTION_DRINK_SPRUNK = 23;
Player.SPECIAL_ACTION_CUFFED = 24;
Player.SPECIAL_ACTION_CARRY = 25;

// DO NOT ADD NEW VALUES TO THIS ENUMERATION WITHOUT ALSO ADDING THEM TO PAWN.
//     //pawn/Entities/Players/PlayerActivity.pwn
Player.PLAYER_ACTIVITY_NONE = 0;
Player.PLAYER_ACTIVITY_JS_RACE = 1;

// Called when a player's activity changes. This event is custom to Las Venturas Playground.
self.addEventListener('playeractivitychange', event => {
  const player = server.playerManager.getById(event.playerid);
  if (!player)
    return;

  player.activity_ = event.activity;
});

// Called when a player's message level changes. This event is custom to Las Venturas Playground.
self.addEventListener('messagelevelchange', event => {
  const player = server.playerManager.getById(event.playerid);
  if (!player)
    return;

  player.messageLevel_ = event.messagelevel;
});

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
