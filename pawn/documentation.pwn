// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/**
 * Because the quality and availability of the SA-MP function documentation is sub-optimal, we've
 * started our own project towards documenting all the provided native functions. The created
 * pages will automatically be available on http://development.sa-mp.nl/natives/.
 */
class SampNativeDocumentation {
    // ---
    // --- a_http.inc ------------------------------------------------------------------------------
    // ---

    /**
     *
     *
     * @param index
     * @param type
     * @param url
     * @param data
     * @param callback
     * @category a_http.inc
     */
    public HTTP(index, type, url[], data[], callback[]) {}


    // ---
    // --- a_objects.inc ---------------------------------------------------------------------------
    // ---

    /**
     *
     *
     * @param modelid
     * @param X
     * @param Y
     * @param Z
     * @param rX
     * @param rY
     * @param rZ
     * @param DrawDistance
     * @category a_objects.inc
     */
    public CreateObject(modelid, Float:X, Float:Y, Float:Z, Float:rX, Float:rY, Float:rZ, Float:DrawDistance = 0.0) {}

    /**
     *
     *
     * @param objectid
     * @param vehicleid
     * @param OffsetX
     * @param OffsetY
     * @param OffsetZ
     * @param RotX
     * @param RotY
     * @param RotZ
     * @category a_objects.inc
     */
    public AttachObjectToVehicle(objectid, vehicleid, Float:OffsetX, Float:OffsetY, Float:OffsetZ, Float:RotX, Float:RotY, Float:RotZ) {}

    /**
     *
     *
     * @param objectid
     * @param attachtoid
     * @param OffsetX
     * @param OffsetY
     * @param OffsetZ
     * @param RotX
     * @param RotY
     * @param RotZ
     * @param SyncRotation
     * @category a_objects.inc
     */
    public AttachObjectToObject(objectid, attachtoid, Float:OffsetX, Float:OffsetY, Float:OffsetZ, Float:RotX, Float:RotY, Float:RotZ, SyncRotation = 1) {}

    /**
     *
     *
     * @param objectid
     * @param playerid
     * @param OffsetX
     * @param OffsetY
     * @param OffsetZ
     * @param RotX
     * @param RotY
     * @param RotZ
     * @category a_objects.inc
     */
    public AttachObjectToPlayer(objectid, playerid, Float:OffsetX, Float:OffsetY, Float:OffsetZ, Float:RotX, Float:RotY, Float:RotZ) {}

    /**
     *
     *
     * @param objectid
     * @param X
     * @param Y
     * @param Z
     * @category a_objects.inc
     */
    public SetObjectPos(objectid, Float:X, Float:Y, Float:Z) {}

    /**
     *
     *
     * @param objectid
     * @param X
     * @param Y
     * @param Z
     * @category a_objects.inc
     */
    public GetObjectPos(objectid, &Float:X, &Float:Y, &Float:Z) {}

    /**
     *
     *
     * @param objectid
     * @param RotX
     * @param RotY
     * @param RotZ
     * @category a_objects.inc
     */
    public SetObjectRot(objectid, Float:RotX, Float:RotY, Float:RotZ) {}

    /**
     *
     *
     * @param objectid
     * @param RotX
     * @param RotY
     * @param RotZ
     * @category a_objects.inc
     */
    public GetObjectRot(objectid, &Float:RotX, &Float:RotY, &Float:RotZ) {}

    /**
     *
     *
     * @param objectid
     * @category a_objects.inc
     */
    public IsValidObject(objectid) {}

    /**
     *
     *
     * @param objectid
     * @category a_objects.inc
     */
    public DestroyObject(objectid) {}

    /**
     *
     *
     * @param objectid
     * @param X
     * @param Y
     * @param Z
     * @param Speed
     * @param RotX
     * @param RotY
     * @param RotZ
     * @category a_objects.inc
     */
    public MoveObject(objectid, Float:X, Float:Y, Float:Z, Float:Speed, Float:RotX = -1000.0, Float:RotY = -1000.0, Float:RotZ = -1000.0) {}

    /**
     *
     *
     * @param objectid
     * @category a_objects.inc
     */
    public StopObject(objectid) {}

    /**
     *
     *
     * @param objectid
     * @category a_objects.inc
     */
    public IsObjectMoving(objectid) {}

    /**
     *
     *
     * @param playerid
     * @param objectid
     * @category a_objects.inc
     */
    public EditObject(playerid, objectid) {}

    /**
     *
     *
     * @param playerid
     * @param objectid
     * @category a_objects.inc
     */
    public EditPlayerObject(playerid, objectid) {}

    /**
     *
     *
     * @param playerid
     * @category a_objects.inc
     */
    public SelectObject(playerid) {}

    /**
     *
     *
     * @param playerid
     * @category a_objects.inc
     */
    public CancelEdit(playerid) {}

    /**
     *
     *
     * @param playerid
     * @param modelid
     * @param X
     * @param Y
     * @param Z
     * @param rX
     * @param rY
     * @param rZ
     * @param DrawDistance
     * @category a_objects.inc
     */
    public CreatePlayerObject(playerid, modelid, Float:X, Float:Y, Float:Z, Float:rX, Float:rY, Float:rZ, Float:DrawDistance = 0.0) {}

    /**
     *
     *
     * @param playerid
     * @param objectid
     * @param vehicleid
     * @param fOffsetX
     * @param fOffsetY
     * @param fOffsetZ
     * @param fRotX
     * @param fRotY
     * @param RotZ
     * @category a_objects.inc
     */
    public AttachPlayerObjectToVehicle(playerid, objectid, vehicleid, Float:fOffsetX, Float:fOffsetY, Float:fOffsetZ, Float:fRotX, Float:fRotY, Float:RotZ) {}

    /**
     *
     *
     * @param playerid
     * @param objectid
     * @param X
     * @param Y
     * @param Z
     * @category a_objects.inc
     */
    public SetPlayerObjectPos(playerid, objectid, Float:X, Float:Y, Float:Z) {}

    /**
     *
     *
     * @param playerid
     * @param objectid
     * @param X
     * @param Y
     * @param Z
     * @category a_objects.inc
     */
    public GetPlayerObjectPos(playerid, objectid, &Float:X, &Float:Y, &Float:Z) {}

    /**
     *
     *
     * @param playerid
     * @param objectid
     * @param RotX
     * @param RotY
     * @param RotZ
     * @category a_objects.inc
     */
    public SetPlayerObjectRot(playerid, objectid, Float:RotX, Float:RotY, Float:RotZ) {}

    /**
     *
     *
     * @param playerid
     * @param objectid
     * @param RotX
     * @param RotY
     * @param RotZ
     * @category a_objects.inc
     */
    public GetPlayerObjectRot(playerid, objectid, &Float:RotX, &Float:RotY, &Float:RotZ) {}

    /**
     *
     *
     * @param playerid
     * @param objectid
     * @category a_objects.inc
     */
    public IsValidPlayerObject(playerid, objectid) {}

    /**
     *
     *
     * @param playerid
     * @param objectid
     * @category a_objects.inc
     */
    public DestroyPlayerObject(playerid, objectid) {}

    /**
     *
     *
     * @param playerid
     * @param objectid
     * @param X
     * @param Y
     * @param Z
     * @param Speed
     * @param RotX
     * @param RotY
     * @param RotZ
     * @category a_objects.inc
     */
    public MovePlayerObject(playerid, objectid, Float:X, Float:Y, Float:Z, Float:Speed, Float:RotX = -1000.0, Float:RotY = -1000.0, Float:RotZ = -1000.0) {}

    /**
     *
     *
     * @param playerid
     * @param objectid
     * @category a_objects.inc
     */
    public StopPlayerObject(playerid, objectid) {}

    /**
     *
     *
     * @param playerid
     * @param objectid
     * @category a_objects.inc
     */
    public IsPlayerObjectMoving(playerid, objectid) {}

    /**
     *
     *
     * @param objectplayer
     * @param objectid
     * @param attachplayer
     * @param OffsetX
     * @param OffsetY
     * @param OffsetZ
     * @param rX
     * @param rY
     * @param rZ
     * @category a_objects.inc
     */
    public AttachPlayerObjectToPlayer(objectplayer, objectid, attachplayer, Float:OffsetX, Float:OffsetY, Float:OffsetZ, Float:rX, Float:rY, Float:rZ) {}

    /**
     *
     *
     * @param objectid
     * @param materialindex
     * @param modelid
     * @param txdname
     * @param texturename
     * @param materialcolor
     * @category a_objects.inc
     */
    public SetObjectMaterial(objectid, materialindex, modelid, txdname[], texturename[], materialcolor=0) {}

    /**
     *
     *
     * @param playerid
     * @param objectid
     * @param materialindex
     * @param modelid
     * @param txdname
     * @param texturename
     * @param materialcolor
     * @category a_objects.inc
     */
    public SetPlayerObjectMaterial(playerid, objectid, materialindex, modelid, txdname[], texturename[], materialcolor=0) {}

    /**
     *
     *
     * @param objectid
     * @param text
     * @param materialindex
     * @param materialsize
     * @param fontface
     * @param fontsize
     * @param bold
     * @param fontcolor
     * @param backcolor
     * @param textalignment
     * @category a_objects.inc
     */
    public SetObjectMaterialText(objectid, text[], materialindex = 0, materialsize = OBJECT_MATERIAL_SIZE_256x128, fontface[] = "Arial", fontsize = 24, bold = 1, fontcolor = 0xFFFFFFFF, backcolor = 0, textalignment = 0) {}

    /**
     *
     *
     * @param playerid
     * @param objectid
     * @param text
     * @param materialindex
     * @param materialsize
     * @param fontface
     * @param fontsize
     * @param bold
     * @param fontcolor
     * @param backcolor
     * @param textalignment
     * @category a_objects.inc
     */
    public SetPlayerObjectMaterialText(playerid, objectid, text[], materialindex = 0, materialsize = OBJECT_MATERIAL_SIZE_256x128, fontface[] = "Arial", fontsize = 24, bold = 1, fontcolor = 0xFFFFFFFF, backcolor = 0, textalignment = 0) {}

    // ---
    // --- a_players.inc ---------------------------------------------------------------------------
    // ---

    /**
     *
     *
     * @param playerid
     * @param team
     * @param skin
     * @param x
     * @param y
     * @param z
     * @param rotation
     * @param weapon1
     * @param weapon1_ammo
     * @param weapon2
     * @param weapon2_ammo
     * @param weapon3
     * @param weapon3_ammo
     * @category a_players.inc
     */
    public SetSpawnInfo(playerid, team, skin, Float:x, Float:y, Float:z, Float:rotation, weapon1, weapon1_ammo, weapon2, weapon2_ammo, weapon3, weapon3_ammo) {}

    /**
     *
     *
     * @param playerid
     * @category a_players.inc
     */
    public SpawnPlayer(playerid) {}

    /**
     *
     *
     * @param playerid
     * @param x
     * @param y
     * @param z
     * @category a_players.inc
     */
    public SetPlayerPos(playerid, Float:x, Float:y, Float:z) {}

    /**
     *
     *
     * @param playerid
     * @param x
     * @param y
     * @param z
     * @category a_players.inc
     */
    public SetPlayerPosFindZ(playerid, Float:x, Float:y, Float:z) {}

    /**
     *
     *
     * @param playerid
     * @param x
     * @param y
     * @param z
     * @category a_players.inc
     */
    public GetPlayerPos(playerid, &Float:x, &Float:y, &Float:z) {}

    /**
     *
     *
     * @param playerid
     * @param ang
     * @category a_players.inc
     */
    public SetPlayerFacingAngle(playerid,Float:ang) {}

    /**
     *
     *
     * @param playerid
     * @param ang
     * @category a_players.inc
     */
    public GetPlayerFacingAngle(playerid,&Float:ang) {}

    /**
     *
     *
     * @param playerid
     * @param range
     * @param x
     * @param y
     * @param z
     * @category a_players.inc
     */
    public IsPlayerInRangeOfPoint(playerid, Float:range, Float:x, Float:y, Float:z) {}

    /**
     *
     *
     * @param playerid
     * @param X
     * @param Y
     * @param Z
     * @category a_players.inc
     */
    public Float: GetPlayerDistanceFromPoint(playerid, Float:X, Float:Y, Float:Z) {}

    /**
     *
     *
     * @param playerid
     * @param forplayerid
     * @category a_players.inc
     */
    public IsPlayerStreamedIn(playerid, forplayerid) {}

    /**
     *
     *
     * @param playerid
     * @param interiorid
     * @category a_players.inc
     */
    public SetPlayerInterior(playerid,interiorid) {}

    /**
     *
     *
     * @param playerid
     * @category a_players.inc
     */
    public GetPlayerInterior(playerid) {}

    /**
     *
     *
     * @param playerid
     * @param health
     * @category a_players.inc
     */
    public SetPlayerHealth(playerid, Float:health) {}

    /**
     *
     *
     * @param playerid
     * @param health
     * @category a_players.inc
     */
    public GetPlayerHealth(playerid, &Float:health) {}

    /**
     *
     *
     * @param playerid
     * @param armour
     * @category a_players.inc
     */
    public SetPlayerArmour(playerid, Float:armour) {}

    /**
     *
     *
     * @param playerid
     * @param armour
     * @category a_players.inc
     */
    public GetPlayerArmour(playerid, &Float:armour) {}

    /**
     *
     *
     * @param playerid
     * @param weaponslot
     * @param ammo
     * @category a_players.inc
     */
    public SetPlayerAmmo(playerid, weaponslot, ammo) {}

    /**
     *
     *
     * @param playerid
     * @category a_players.inc
     */
    public GetPlayerAmmo(playerid) {}

    /**
     *
     *
     * @param playerid
     * @category a_players.inc
     */
    public GetPlayerWeaponState(playerid) {}

    /**
     *
     *
     * @param playerid
     * @category a_players.inc
     */
    public GetPlayerTargetPlayer(playerid) {}

    /**
     *
     *
     * @param playerid
     * @param teamid
     * @category a_players.inc
     */
    public SetPlayerTeam(playerid, teamid) {}

    /**
     *
     *
     * @param playerid
     * @category a_players.inc
     */
    public GetPlayerTeam(playerid) {}

    /**
     *
     *
     * @param playerid
     * @param score
     * @category a_players.inc
     */
    public SetPlayerScore(playerid,score) {}

    /**
     *
     *
     * @param playerid
     * @category a_players.inc
     */
    public GetPlayerScore(playerid) {}

    /**
     *
     *
     * @param playerid
     * @category a_players.inc
     */
    public GetPlayerDrunkLevel(playerid) {}

    /**
     *
     *
     * @param playerid
     * @param level
     * @category a_players.inc
     */
    public SetPlayerDrunkLevel(playerid, level) {}

    /**
     *
     *
     * @param playerid
     * @param color
     * @category a_players.inc
     */
    public SetPlayerColor(playerid,color) {}

    /**
     *
     *
     * @param playerid
     * @category a_players.inc
     */
    public GetPlayerColor(playerid) {}

    /**
     *
     *
     * @param playerid
     * @param skinid
     * @category a_players.inc
     */
    public SetPlayerSkin(playerid, skinid) {}

    /**
     *
     *
     * @param playerid
     * @category a_players.inc
     */
    public GetPlayerSkin(playerid) {}

    /**
     *
     *
     * @param playerid
     * @param weaponid
     * @param ammo
     * @category a_players.inc
     */
    public GivePlayerWeapon(playerid, weaponid, ammo) {}

    /**
     *
     *
     * @param playerid
     * @category a_players.inc
     */
    public ResetPlayerWeapons(playerid) {}

    /**
     *
     *
     * @param playerid
     * @param weaponid
     * @category a_players.inc
     */
    public SetPlayerArmedWeapon(playerid, weaponid) {}

    /**
     *
     *
     * @param playerid
     * @param slot
     * @param &weapons
     * @param &ammo
     * @category a_players.inc
     */
    public GetPlayerWeaponData(playerid, slot, &weapons, &ammo) {}

    /**
     *
     *
     * @param playerid
     * @param money
     * @category a_players.inc
     */
    public GivePlayerMoney(playerid,money) {}

    /**
     *
     *
     * @param playerid
     * @category a_players.inc
     */
    public ResetPlayerMoney(playerid) {}

    /**
     *
     *
     * @param playerid
     * @param name
     * @category a_players.inc
     */
    public SetPlayerName(playerid, const name[]) {}

    /**
     *
     *
     * @param playerid
     * @category a_players.inc
     */
    public GetPlayerMoney(playerid) {}

    /**
     *
     *
     * @param playerid
     * @category a_players.inc
     */
    public GetPlayerState(playerid) {}

    /**
     *
     *
     * @param playerid
     * @param name
     * @param len
     * @category a_players.inc
     */
    public GetPlayerIp(playerid, name[], len) {}

    /**
     *
     *
     * @param playerid
     * @category a_players.inc
     */
    public GetPlayerPing(playerid) {}

    /**
     *
     *
     * @param playerid
     * @category a_players.inc
     */
    public GetPlayerWeapon(playerid) {}

    /**
     *
     *
     * @param playerid
     * @param &keys
     * @param &updown
     * @param &leftright
     * @category a_players.inc
     */
    public GetPlayerKeys(playerid, &keys, &updown, &leftright) {}

    /**
     *
     *
     * @param playerid
     * @param name
     * @param len
     * @category a_players.inc
     */
    public GetPlayerName(playerid, const name[], len) {}

    /**
     *
     *
     * @param playerid
     * @param hour
     * @param minute
     * @category a_players.inc
     */
    public SetPlayerTime(playerid, hour, minute) {}

    /**
     *
     *
     * @param playerid
     * @param &hour
     * @param &minute
     * @category a_players.inc
     */
    public GetPlayerTime(playerid, &hour, &minute) {}

    /**
     *
     *
     * @param playerid
     * @param toggle
     * @category a_players.inc
     */
    public TogglePlayerClock(playerid, toggle) {}

    /**
     *
     *
     * @param playerid
     * @param weather
     * @category a_players.inc
     */
    public SetPlayerWeather(playerid, weather) {}

    /**
     *
     *
     * @param playerid
     * @category a_players.inc
     */
    public ForceClassSelection(playerid) {}

    /**
     *
     *
     * @param playerid
     * @param level
     * @category a_players.inc
     */
    public SetPlayerWantedLevel(playerid, level) {}

    /**
     *
     *
     * @param playerid
     * @category a_players.inc
     */
    public GetPlayerWantedLevel(playerid) {}

    /**
     *
     *
     * @param playerid
     * @param style
     * @category a_players.inc
     */
    public SetPlayerFightingStyle(playerid, style) {}

    /**
     *
     *
     * @param playerid
     * @category a_players.inc
     */
    public GetPlayerFightingStyle(playerid) {}

    /**
     *
     *
     * @param playerid
     * @param X
     * @param Y
     * @param Z
     * @category a_players.inc
     */
    public SetPlayerVelocity(playerid, Float:X, Float:Y, Float:Z) {}

    /**
     *
     *
     * @param playerid
     * @param X
     * @param Y
     * @param Z
     * @category a_players.inc
     */
    public GetPlayerVelocity( playerid, &Float:X, &Float:Y, &Float:Z ) {}

    /**
     *
     *
     * @param playerid
     * @param suspectid
     * @param crime
     * @category a_players.inc
     */
    public PlayCrimeReportForPlayer(playerid, suspectid, crime) {}

    /**
     *
     *
     * @param playerid
     * @param url
     * @param fposX
     * @param fPosY
     * @param fPosZ
     * @param distance
     * @param usepos
     * @category a_players.inc
     */
    public PlayAudioStreamForPlayer(playerid, url[], Float:fposX = 0.0, Float:fPosY = 0.0, Float:fPosZ = 0.0, Float:distance = 50.0, usepos = 0) {}

    /**
     *
     *
     * @param playerid
     * @category a_players.inc
     */
    public StopAudioStreamForPlayer(playerid) {}

    /**
     *
     *
     * @param playerid
     * @param shopname
     * @category a_players.inc
     */
    public SetPlayerShopName(playerid, shopname[]) {}

    /**
     *
     *
     * @param playerid
     * @param skill
     * @param level
     * @category a_players.inc
     */
    public SetPlayerSkillLevel(playerid, skill, level) {}

    /**
     *
     *
     * @param playerid
     * @category a_players.inc
     */
    public GetPlayerSurfingVehicleID(playerid) {}

    /**
     *
     *
     * @param playerid
     * @category a_players.inc
     */
    public GetPlayerSurfingObjectID(playerid) {}

    /**
     *
     *
     * @param playerid
     * @param modelid
     * @param fX
     * @param fY
     * @param fZ
     * @param fRadius
     * @category a_players.inc
     */
    public RemoveBuildingForPlayer(playerid, modelid, Float:fX, Float:fY, Float:fZ, Float:fRadius) {}

    /**
     *
     *
     * @param playerid
     * @param index
     * @param modelid
     * @param bone
     * @param fOffsetX
     * @param fOffsetY
     * @param fOffsetZ
     * @param fRotX
     * @param fRotY
     * @param fRotZ
     * @param fScaleX
     * @param fScaleY
     * @param fScaleZ
     * @param materialcolor1
     * @param materialcolor2
     * @category a_players.inc
     */
    public SetPlayerAttachedObject(playerid, index, modelid, bone, Float:fOffsetX = 0.0, Float:fOffsetY = 0.0, Float:fOffsetZ = 0.0, Float:fRotX = 0.0, Float:fRotY = 0.0, Float:fRotZ = 0.0, Float:fScaleX = 1.0, Float:fScaleY = 1.0, Float:fScaleZ = 1.0, materialcolor1 = 0, materialcolor2 = 0) {}

    /**
     *
     *
     * @param playerid
     * @param index
     * @category a_players.inc
     */
    public RemovePlayerAttachedObject(playerid, index) {}

    /**
     *
     *
     * @param playerid
     * @param index
     * @category a_players.inc
     */
    public IsPlayerAttachedObjectSlotUsed(playerid, index) {}

    /**
     *
     *
     * @param playerid
     * @param index
     * @category a_players.inc
     */
    public EditAttachedObject(playerid, index) {}

    /**
     *
     *
     * @param playerid
     * @param x
     * @param y
     * @param text
     * @category a_players.inc
     */
    public PlayerText: CreatePlayerTextDraw(playerid, Float:x, Float:y, text[]) {}

    /**
     *
     *
     * @param playerid
     * @param text
     * @category a_players.inc
     */
    public PlayerTextDrawDestroy(playerid, PlayerText:text) {}

    /**
     *
     *
     * @param playerid
     * @param text
     * @param x
     * @param y
     * @category a_players.inc
     */
    public PlayerTextDrawLetterSize(playerid, PlayerText:text, Float:x, Float:y) {}

    /**
     *
     *
     * @param playerid
     * @param text
     * @param x
     * @param y
     * @category a_players.inc
     */
    public PlayerTextDrawTextSize(playerid, PlayerText:text, Float:x, Float:y) {}

    /**
     *
     *
     * @param playerid
     * @param text
     * @param alignment
     * @category a_players.inc
     */
    public PlayerTextDrawAlignment(playerid, PlayerText:text, alignment) {}

    /**
     *
     *
     * @param playerid
     * @param text
     * @param color
     * @category a_players.inc
     */
    public PlayerTextDrawColor(playerid, PlayerText:text, color) {}

    /**
     *
     *
     * @param playerid
     * @param text
     * @param use
     * @category a_players.inc
     */
    public PlayerTextDrawUseBox(playerid, PlayerText:text, use) {}

    /**
     *
     *
     * @param playerid
     * @param text
     * @param color
     * @category a_players.inc
     */
    public PlayerTextDrawBoxColor(playerid, PlayerText:text, color) {}

    /**
     *
     *
     * @param playerid
     * @param text
     * @param size
     * @category a_players.inc
     */
    public PlayerTextDrawSetShadow(playerid, PlayerText:text, size) {}

    /**
     *
     *
     * @param playerid
     * @param text
     * @param size
     * @category a_players.inc
     */
    public PlayerTextDrawSetOutline(playerid, PlayerText:text, size) {}

    /**
     *
     *
     * @param playerid
     * @param text
     * @param color
     * @category a_players.inc
     */
    public PlayerTextDrawBackgroundColor(playerid, PlayerText:text, color) {}

    /**
     *
     *
     * @param playerid
     * @param text
     * @param font
     * @category a_players.inc
     */
    public PlayerTextDrawFont(playerid, PlayerText:text, font) {}

    /**
     *
     *
     * @param playerid
     * @param text
     * @param set
     * @category a_players.inc
     */
    public PlayerTextDrawSetProportional(playerid, PlayerText:text, set) {}

    /**
     *
     *
     * @param playerid
     * @param text
     * @param set
     * @category a_players.inc
     */
    public PlayerTextDrawSetSelectable(playerid, PlayerText:text, set) {}

    /**
     *
     *
     * @param playerid
     * @param text
     * @category a_players.inc
     */
    public PlayerTextDrawShow(playerid, PlayerText:text) {}

    /**
     *
     *
     * @param playerid
     * @param text
     * @category a_players.inc
     */
    public PlayerTextDrawHide(playerid, PlayerText:text) {}

    /**
     *
     *
     * @param playerid
     * @param text
     * @param string
     * @category a_players.inc
     */
    public PlayerTextDrawSetString(playerid, PlayerText:text, string[]) {}

    /**
     *
     *
     * @param playerid
     * @param text
     * @param modelindex
     * @category a_players.inc
     */
    public PlayerTextDrawSetPreviewModel(playerid, PlayerText:text, modelindex) {}

    /**
     *
     *
     * @param playerid
     * @param text
     * @param fRotX
     * @param fRotY
     * @param fRotZ
     * @param fZoom
     * @category a_players.inc
     */
    public PlayerTextDrawSetPreviewRot(playerid, PlayerText:text, Float:fRotX, Float:fRotY, Float:fRotZ, Float:fZoom = 1.0) {}

    /**
     *
     *
     * @param playerid
     * @param text
     * @param color1
     * @param color2
     * @category a_players.inc
     */
    public PlayerTextDrawSetPreviewVehCol(playerid, PlayerText:text, color1, color2) {}

    /**
     *
     *
     * @param playerid
     * @param varname
     * @param int_value
     * @category a_players.inc
     */
    public SetPVarInt(playerid, varname[], int_value) {}

    /**
     *
     *
     * @param playerid
     * @param varname
     * @category a_players.inc
     */
    public GetPVarInt(playerid, varname[]) {}

    /**
     *
     *
     * @param playerid
     * @param varname
     * @param string_value
     * @category a_players.inc
     */
    public SetPVarString(playerid, varname[], string_value[]) {}

    /**
     *
     *
     * @param playerid
     * @param varname
     * @param string_return
     * @param len
     * @category a_players.inc
     */
    public GetPVarString(playerid, varname[], string_return[], len) {}

    /**
     *
     *
     * @param playerid
     * @param varname
     * @param float_value
     * @category a_players.inc
     */
    public SetPVarFloat(playerid, varname[], Float:float_value) {}

    /**
     *
     *
     * @param playerid
     * @param varname
     * @category a_players.inc
     */
    public Float: GetPVarFloat(playerid, varname[]) {}

    /**
     *
     *
     * @param playerid
     * @param varname
     * @category a_players.inc
     */
    public DeletePVar(playerid, varname[]) {}

    /**
     *
     *
     * @param playerid
     * @category a_players.inc
     */
    public GetPVarsUpperIndex(playerid) {}

    /**
     *
     *
     * @param playerid
     * @param index
     * @param ret_varname
     * @param ret_len
     * @category a_players.inc
     */
    public GetPVarNameAtIndex(playerid, index, ret_varname[], ret_len) {}

    /**
     *
     *
     * @param playerid
     * @param varname
     * @category a_players.inc
     */
    public GetPVarType(playerid, varname[]) {}

    /**
     *
     *
     * @param playerid
     * @param text
     * @param color
     * @param drawdistance
     * @param expiretime
     * @category a_players.inc
     */
    public SetPlayerChatBubble(playerid, text[], color, Float:drawdistance, expiretime) {}

    /**
     *
     *
     * @param playerid
     * @param vehicleid
     * @param seatid
     * @category a_players.inc
     */
    public PutPlayerInVehicle(playerid, vehicleid, seatid) {}

    /**
     *
     *
     * @param playerid
     * @category a_players.inc
     */
    public GetPlayerVehicleID(playerid) {}

    /**
     *
     *
     * @param playerid
     * @category a_players.inc
     */
    public GetPlayerVehicleSeat(playerid) {}

    /**
     *
     *
     * @param playerid
     * @category a_players.inc
     */
    public RemovePlayerFromVehicle(playerid) {}

    /**
     *
     *
     * @param playerid
     * @param toggle
     * @category a_players.inc
     */
    public TogglePlayerControllable(playerid, toggle) {}

    /**
     *
     *
     * @param playerid
     * @param soundid
     * @param x
     * @param y
     * @param z
     * @category a_players.inc
     */
    public PlayerPlaySound(playerid, soundid, Float:x, Float:y, Float:z) {}

    /**
     *
     *
     * @param playerid
     * @param animlib
     * @param animname
     * @param fDelta
     * @param loop
     * @param lockx
     * @param locky
     * @param freeze
     * @param time
     * @param forcesync
     * @category a_players.inc
     */
    public ApplyAnimation(playerid, animlib[], animname[], Float:fDelta, loop, lockx, locky, freeze, time, forcesync = 0) {}

    /**
     *
     *
     * @param playerid
     * @param forcesync
     * @category a_players.inc
     */
    public ClearAnimations(playerid, forcesync = 0) {}

    /**
     *
     *
     * @param playerid
     * @category a_players.inc
     */
    public GetPlayerAnimationIndex(playerid) {}

    /**
     *
     *
     * @param index
     * @param animlib
     * @param len1
     * @param animname
     * @param len2
     * @category a_players.inc
     */
    public GetAnimationName(index, animlib[], len1, animname[], len2) {}

    /**
     *
     *
     * @param playerid
     * @category a_players.inc
     */
    public GetPlayerSpecialAction(playerid) {}

    /**
     *
     *
     * @param playerid
     * @param actionid
     * @category a_players.inc
     */
    public SetPlayerSpecialAction(playerid,actionid) {}

    /**
     *
     *
     * @param playerid
     * @param x
     * @param y
     * @param z
     * @param size
     * @category a_players.inc
     */
    public SetPlayerCheckpoint(playerid, Float:x, Float:y, Float:z, Float:size) {}

    /**
     *
     *
     * @param playerid
     * @category a_players.inc
     */
    public DisablePlayerCheckpoint(playerid) {}

    /**
     *
     *
     * @param playerid
     * @param type
     * @param x
     * @param y
     * @param z
     * @param nextx
     * @param nexty
     * @param nextz
     * @param size
     * @category a_players.inc
     */
    public SetPlayerRaceCheckpoint(playerid, type, Float:x, Float:y, Float:z, Float:nextx, Float:nexty, Float:nextz, Float:size) {}

    /**
     *
     *
     * @param playerid
     * @category a_players.inc
     */
    public DisablePlayerRaceCheckpoint(playerid) {}

    /**
     *
     *
     * @param playerid
     * @param x_max
     * @param x_min
     * @param y_max
     * @param y_min
     * @category a_players.inc
     */
    public SetPlayerWorldBounds(playerid,Float:x_max,Float:x_min,Float:y_max,Float:y_min) {}

    /**
     *
     *
     * @param playerid
     * @param showplayerid
     * @param color
     * @category a_players.inc
     */
    public SetPlayerMarkerForPlayer(playerid, showplayerid, color) {}

    /**
     *
     *
     * @param playerid
     * @param showplayerid
     * @param show
     * @category a_players.inc
     */
    public ShowPlayerNameTagForPlayer(playerid, showplayerid, show) {}

    /**
     *
     *
     * @param playerid
     * @param iconid
     * @param x
     * @param y
     * @param z
     * @param markertype
     * @param color
     * @param style
     * @category a_players.inc
     */
    public SetPlayerMapIcon(playerid, iconid, Float:x, Float:y, Float:z, markertype, color, style = MAPICON_LOCAL) {}

    /**
     *
     *
     * @param playerid
     * @param iconid
     * @category a_players.inc
     */
    public RemovePlayerMapIcon(playerid, iconid) {}

    /**
     * Toggles whether map teleportation for the given player is available. The player will be able
     * to use this functionality by going to the GTA menu, opening the map and right-clicking on the
     * location where they want to be teleported to.
     *
     * @param playerid The player to toggle map teleportation for.
     * @param allow Should this player be able to use map teleportation (1) or not (0)?
     *
     * @deprecated Use the OnPlayerClickMap callback instead.
     *
     * @example
     * public OnPlayerCommandText(playerid, cmdtext[]) {
     *     if (!strcmp("enable_teleport", cmdtext) && IsPlayerAdmin(playerid)) {
     *         AllowPlayerTeleport(playerid, 1);
     *
     *         SendClientMessage(playerId, COLOR_WHITE, "Teleportation has been enabled for you!");
     *         return 1;
     *     }
     * }
     *
     * @note
     * This function will only work if [AllowAdminTeleport] has been enabled, and the player for
     * whom teleportation is being toggled is an administrator.
     *
     * @related AllowAdminTeleport
     * @category a_players.inc
     */
    public AllowPlayerTeleport(playerid, allow) {}

    /**
     *
     *
     * @param playerid
     * @param x
     * @param y
     * @param z
     * @category a_players.inc
     */
    public SetPlayerCameraPos(playerid,Float:x, Float:y, Float:z) {}

    /**
     *
     *
     * @param playerid
     * @param x
     * @param y
     * @param z
     * @param cut
     * @category a_players.inc
     */
    public SetPlayerCameraLookAt(playerid, Float:x, Float:y, Float:z, cut = CAMERA_CUT) {}

    /**
     *
     *
     * @param playerid
     * @category a_players.inc
     */
    public SetCameraBehindPlayer(playerid) {}

    /**
     *
     *
     * @param playerid
     * @param x
     * @param y
     * @param z
     * @category a_players.inc
     */
    public GetPlayerCameraPos(playerid, &Float:x, &Float:y, &Float:z) {}

    /**
     *
     *
     * @param playerid
     * @param x
     * @param y
     * @param z
     * @category a_players.inc
     */
    public GetPlayerCameraFrontVector(playerid, &Float:x, &Float:y, &Float:z) {}

    /**
     *
     *
     * @param playerid
     * @category a_players.inc
     */
    public GetPlayerCameraMode(playerid) {}

    /**
     *
     *
     * @param playerid
     * @param objectid
     * @category a_players.inc
     */
    public AttachCameraToObject(playerid, objectid) {}

    /**
     *
     *
     * @param playerid
     * @param playerobjectid
     * @category a_players.inc
     */
    public AttachCameraToPlayerObject(playerid, playerobjectid) {}

    /**
     *
     *
     * @param playerid
     * @param FromX
     * @param FromY
     * @param FromZ
     * @param ToX
     * @param ToY
     * @param ToZ
     * @param time
     * @param cut
     * @category a_players.inc
     */
    public InterpolateCameraPos(playerid, Float:FromX, Float:FromY, Float:FromZ, Float:ToX, Float:ToY, Float:ToZ, time, cut = CAMERA_CUT) {}

    /**
     *
     *
     * @param playerid
     * @param FromX
     * @param FromY
     * @param FromZ
     * @param ToX
     * @param ToY
     * @param ToZ
     * @param time
     * @param cut
     * @category a_players.inc
     */
    public InterpolateCameraLookAt(playerid, Float:FromX, Float:FromY, Float:FromZ, Float:ToX, Float:ToY, Float:ToZ, time, cut = CAMERA_CUT) {}

    /**
     *
     *
     * @param playerid
     * @category a_players.inc
     */
    public IsPlayerConnected(playerid) {}

    /**
     *
     *
     * @param playerid
     * @param vehicleid
     * @category a_players.inc
     */
    public IsPlayerInVehicle(playerid, vehicleid) {}

    /**
     *
     *
     * @param playerid
     * @category a_players.inc
     */
    public IsPlayerInAnyVehicle(playerid) {}

    /**
     *
     *
     * @param playerid
     * @category a_players.inc
     */
    public IsPlayerInCheckpoint(playerid) {}

    /**
     *
     *
     * @param playerid
     * @category a_players.inc
     */
    public IsPlayerInRaceCheckpoint(playerid) {}

    /**
     *
     *
     * @param playerid
     * @param worldid
     * @category a_players.inc
     */
    public SetPlayerVirtualWorld(playerid, worldid) {}

    /**
     *
     *
     * @param playerid
     * @category a_players.inc
     */
    public GetPlayerVirtualWorld(playerid) {}

    /**
     *
     *
     * @param playerid
     * @param enable
     * @category a_players.inc
     */
    public EnableStuntBonusForPlayer(playerid, enable) {}

    /**
     *
     *
     * @param enable
     * @category a_players.inc
     */
    public EnableStuntBonusForAll(enable) {}

    /**
     *
     *
     * @param playerid
     * @param toggle
     * @category a_players.inc
     */
    public TogglePlayerSpectating(playerid, toggle) {}

    /**
     *
     *
     * @param playerid
     * @param targetplayerid
     * @param mode
     * @category a_players.inc
     */
    public PlayerSpectatePlayer(playerid, targetplayerid, mode = SPECTATE_MODE_NORMAL) {}

    /**
     *
     *
     * @param playerid
     * @param targetvehicleid
     * @param mode
     * @category a_players.inc
     */
    public PlayerSpectateVehicle(playerid, targetvehicleid, mode = SPECTATE_MODE_NORMAL) {}

    /**
     *
     *
     * @param playerid
     * @param recordtype
     * @param recordname
     * @category a_players.inc
     */
    public StartRecordingPlayerData(playerid, recordtype, recordname[]) {}

    /**
     *
     *
     * @param playerid
     * @category a_players.inc
     */
    public StopRecordingPlayerData(playerid) {}

    /**
     *
     *
     * @param playerid
     * @param hovercolor
     * @category a_players.inc
     */
    public SelectTextDraw(playerid, hovercolor) {}

    /**
     *
     *
     * @param playerid
     * @category a_players.inc
     */
    public CancelSelectTextDraw(playerid) {}

    // ---
    // --- a_sampdb.inc ----------------------------------------------------------------------------
    // ---

    /**
     *
     *
     * @param name
     * @category a_sampdb.inc
     */
    public DB: db_open(name[]) {}

    /**
     *
     *
     * @param db
     * @category a_sampdb.inc
     */
    public db_close(DB:db) {}

    /**
     *
     *
     * @param db
     * @param query
     * @category a_sampdb.inc
     */
    public DBResult: db_query(DB:db,query[]) {}

    /**
     *
     *
     * @param dbresult
     * @category a_sampdb.inc
     */
    public db_free_result(DBResult:dbresult) {}

    /**
     *
     *
     * @param dbresult
     * @category a_sampdb.inc
     */
    public db_num_rows(DBResult:dbresult) {}

    /**
     *
     *
     * @param dbresult
     * @category a_sampdb.inc
     */
    public db_next_row(DBResult:dbresult) {}

    /**
     *
     *
     * @param dbresult
     * @category a_sampdb.inc
     */
    public db_num_fields(DBResult:dbresult) {}

    /**
     *
     *
     * @param dbresult
     * @param field
     * @param result
     * @param maxlength
     * @category a_sampdb.inc
     */
    public db_field_name(DBResult:dbresult, field, result[], maxlength) {}

    /**
     *
     *
     * @param dbresult
     * @param field
     * @param result
     * @param maxlength
     * @category a_sampdb.inc
     */
    public db_get_field(DBResult:dbresult, field, result[], maxlength) {}

    /**
     *
     *
     * @param dbresult
     * @param field
     * @param result
     * @param maxlength
     * @category a_sampdb.inc
     */
    public db_get_field_assoc(DBResult:dbresult, const field[], result[], maxlength) {}

    // ---
    // --- a_samp.inc ------------------------------------------------------------------------------
    // ---

    /**
     * In general it can be quite useful to log specific paths, variables or if something is
     * initialized. This function provides the functionality to write something to the server
     * console and eventually to the log file.
     *
     * @param string The text to show in the server console and lot to the log file
     *
     * @example 
     * print("The gamemode has been initialized. Log in on the server to play.");
     *
     * @note
     * This function can only print strings without formatting. Use [printf] to log strings to the
     * console with formatting functionality.
     *
     * @related printf
     * @category a_samp.inc
     */
    public print(const string[]) {}

    /**
     *
     *
     * @param format
     * @param float
     * @param ...
     * @category a_samp.inc
     */
    public printf(const format[], {Float,_}:...) {}

    /**
     *
     *
     * @param output
     * @param len
     * @param format
     * @param {Float
     * @param ...
     * @category a_samp.inc
     */
    public format(output[], len, const format[], {Float,_}:...) {}

    /**
     *
     *
     * @param playerid
     * @param color
     * @param message
     * @category a_samp.inc
     */
    public SendClientMessage(playerid, color, const message[]) {}

    /**
     *
     *
     * @param color
     * @param message
     * @category a_samp.inc
     */
    public SendClientMessageToAll(color, const message[]) {}

    /**
     *
     *
     * @param playerid
     * @param senderid
     * @param message
     * @category a_samp.inc
     */
    public SendPlayerMessageToPlayer(playerid, senderid, const message[]) {}

    /**
     *
     *
     * @param senderid
     * @param message
     * @category a_samp.inc
     */
    public SendPlayerMessageToAll(senderid, const message[]) {}

    /**
     *
     *
     * @param killer
     * @param killee
     * @param weapon
     * @category a_samp.inc
     */
    public SendDeathMessage(killer,killee,weapon) {}

    /**
     *
     *
     * @param string
     * @param time
     * @param style
     * @category a_samp.inc
     */
    public GameTextForAll(const string[],time,style) {}

    /**
     *
     *
     * @param playerid
     * @param string
     * @param time
     * @param style
     * @category a_samp.inc
     */
    public GameTextForPlayer(playerid,const string[],time,style) {}

    /**
     *
     *
     * @param funcname
     * @param interval
     * @param repeating
     * @category a_samp.inc
     */
    public SetTimer(funcname[], interval, repeating) {}

    /**
     *
     *
     * @param funcname
     * @param interval
     * @param repeating
     * @param format
     * @param {Float
     * @param ...
     * @category a_samp.inc
     */
    public SetTimerEx(funcname[], interval, repeating, const format[], {Float,_}:...) {}

    /**
     *
     *
     * @param timerid
     * @category a_samp.inc
     */
    public KillTimer(timerid) {}

    public GetTickCount() {}
    public GetMaxPlayers() {}
    /**
     *
     *
     * @param function
     * @param format
     * @param {Float
     * @param ...
     * @category a_samp.inc
     */
    public CallRemoteFunction(const function[], const format[], {Float,_}:...) {}

    /**
     *
     *
     * @param function
     * @param format
     * @param {Float
     * @param ...
     * @category a_samp.inc
     */
    public CallLocalFunction(const function[], const format[], {Float,_}:...) {}

    /**
     *
     *
     * @param  value
     * @category a_samp.inc
     */
    public Float: asin(Float: value) {}

    /**
     *
     *
     * @param  value
     * @category a_samp.inc
     */
    public Float: acos(Float: value) {}

    /**
     *
     *
     * @param  value
     * @category a_samp.inc
     */
    public Float: atan(Float: value) {}

    /**
     *
     *
     * @param  x
     * @param  y
     * @category a_samp.inc
     */
    public Float: atan2(Float: x, Float: y) {}

    /**
     *
     *
     * @param string
     * @category a_samp.inc
     */
    public SetGameModeText(const string[]) {}

    /**
     *
     *
     * @param count
     * @category a_samp.inc
     */
    public SetTeamCount(count) {}

    /**
     *
     *
     * @param modelid
     * @param spawn_x
     * @param spawn_y
     * @param spawn_z
     * @param z_angle
     * @param weapon1
     * @param weapon1_ammo
     * @param weapon2
     * @param weapon2_ammo
     * @param weapon3
     * @param weapon3_ammo
     * @category a_samp.inc
     */
    public AddPlayerClass(modelid, Float:spawn_x, Float:spawn_y, Float:spawn_z, Float:z_angle, weapon1, weapon1_ammo, weapon2, weapon2_ammo, weapon3, weapon3_ammo) {}

    /**
     *
     *
     * @param teamid
     * @param modelid
     * @param spawn_x
     * @param spawn_y
     * @param spawn_z
     * @param z_angle
     * @param weapon1
     * @param weapon1_ammo
     * @param weapon2
     * @param weapon2_ammo
     * @param weapon3
     * @param weapon3_ammo
     * @category a_samp.inc
     */
    public AddPlayerClassEx(teamid, modelid, Float:spawn_x, Float:spawn_y, Float:spawn_z, Float:z_angle, weapon1, weapon1_ammo, weapon2, weapon2_ammo, weapon3, weapon3_ammo) {}

    /**
     *
     *
     * @param modelid
     * @param spawn_x
     * @param spawn_y
     * @param spawn_z
     * @param z_angle
     * @param color1
     * @param color2
     * @category a_samp.inc
     */
    public AddStaticVehicle(modelid, Float:spawn_x, Float:spawn_y, Float:spawn_z, Float:z_angle, color1, color2) {}

    /**
     *
     *
     * @param modelid
     * @param spawn_x
     * @param spawn_y
     * @param spawn_z
     * @param z_angle
     * @param color1
     * @param color2
     * @param respawn_delay
     * @category a_samp.inc
     */
    public AddStaticVehicleEx(modelid, Float:spawn_x, Float:spawn_y, Float:spawn_z, Float:z_angle, color1, color2, respawn_delay) {}

    /**
     *
     *
     * @param model
     * @param type
     * @param X
     * @param Y
     * @param Z
     * @param virtualworld
     * @category a_samp.inc
     */
    public AddStaticPickup(model, type, Float:X, Float:Y, Float:Z, virtualworld = 0) {}

    /**
     *
     *
     * @param model
     * @param type
     * @param X
     * @param Y
     * @param Z
     * @param virtualworld
     * @category a_samp.inc
     */
    public CreatePickup(model, type, Float:X, Float:Y, Float:Z, virtualworld = 0) {}

    /**
     *
     *
     * @param pickup
     * @category a_samp.inc
     */
    public DestroyPickup(pickup) {}

    /**
     *
     *
     * @param show
     * @category a_samp.inc
     */
    public ShowNameTags(show) {}

    /**
     *
     *
     * @param mode
     * @category a_samp.inc
     */
    public ShowPlayerMarkers(mode) {}

    public GameModeExit() {}
    /**
     *
     *
     * @param hour
     * @category a_samp.inc
     */
    public SetWorldTime(hour) {}

    /**
     *
     *
     * @param weaponid
     * @param weapon
     * @param len
     * @category a_samp.inc
     */
    public GetWeaponName(weaponid, const weapon[], len) {}

    /**
     *
     *
     * @param enable
     * @category a_samp.inc
     */
    public EnableTirePopping(enable) {}

    public EnableVehicleFriendlyFire() {}
    /**
     *
     *
     * @param allow
     * @category a_samp.inc
     */
    public AllowInteriorWeapons(allow) {}

    /**
     *
     *
     * @param weatherid
     * @category a_samp.inc
     */
    public SetWeather(weatherid) {}

    /**
     *
     *
     * @param gravity
     * @category a_samp.inc
     */
    public SetGravity(Float:gravity) {}

    /**
     *
     *
     * @param allow
     * @category a_samp.inc
     */
    public AllowAdminTeleport(allow) {}

    /**
     *
     *
     * @param amount
     * @category a_samp.inc
     */
    public SetDeathDropAmount(amount) {}

    /**
     *
     *
     * @param X
     * @param Y
     * @param Z
     * @param type
     * @param Radius
     * @category a_samp.inc
     */
    public CreateExplosion(Float:X, Float:Y, Float:Z, type, Float:Radius) {}

    /**
     *
     *
     * @param enable
     * @category a_samp.inc
     */
    public EnableZoneNames(enable) {}

    public UsePlayerPedAnims() {}
    public DisableInteriorEnterExits() {}
    /**
     *
     *
     * @param distance
     * @category a_samp.inc
     */
    public SetNameTagDrawDistance(Float:distance) {}

    public DisableNameTagLOS() {}
    /**
     *
     *
     * @param chat_radius
     * @category a_samp.inc
     */
    public LimitGlobalChatRadius(Float:chat_radius) {}

    /**
     *
     *
     * @param marker_radius
     * @category a_samp.inc
     */
    public LimitPlayerMarkerRadius(Float:marker_radius) {}

    /**
     *
     *
     * @param name
     * @param script
     * @category a_samp.inc
     */
    public ConnectNPC(name[], script[]) {}

    /**
     *
     *
     * @param playerid
     * @category a_samp.inc
     */
    public IsPlayerNPC(playerid) {}

    /**
     *
     *
     * @param playerid
     * @category a_samp.inc
     */
    public IsPlayerAdmin(playerid) {}

    /**
     *
     *
     * @param playerid
     * @category a_samp.inc
     */
    public Kick(playerid) {}

    /**
     *
     *
     * @param playerid
     * @category a_samp.inc
     */
    public Ban(playerid) {}

    /**
     *
     *
     * @param playerid
     * @param reason
     * @category a_samp.inc
     */
    public BanEx(playerid, const reason[]) {}

    /**
     *
     *
     * @param command
     * @category a_samp.inc
     */
    public SendRconCommand(command[]) {}

    /**
     *
     *
     * @param varname
     * @param buffer
     * @param len
     * @category a_samp.inc
     */
    public GetServerVarAsString(const varname[], buffer[], len) {}

    /**
     *
     *
     * @param varname
     * @category a_samp.inc
     */
    public GetServerVarAsInt(const varname[]) {}

    /**
     *
     *
     * @param varname
     * @category a_samp.inc
     */
    public GetServerVarAsBool(const varname[]) {}

    /**
     *
     *
     * @param playerid
     * @param retstr
     * @param retstr_size
     * @category a_samp.inc
     */
    public GetPlayerNetworkStats(playerid, retstr[], retstr_size) {}

    /**
     *
     *
     * @param retstr
     * @param retstr_size
     * @category a_samp.inc
     */
    public GetNetworkStats(retstr[], retstr_size) {}

    /**
     *
     *
     * @param playerid
     * @param version
     * @param len
     * @category a_samp.inc
     */
    public GetPlayerVersion(playerid, const version[], len) {}

    /**
     *
     *
     * @param title
     * @param columns
     * @param x
     * @param y
     * @param col1width
     * @param col2width
     * @category a_samp.inc
     */
    public Menu: CreateMenu(const title[], columns, Float:x, Float:y, Float:col1width, Float:col2width = 0.0) {}

    /**
     *
     *
     * @param menuid
     * @category a_samp.inc
     */
    public DestroyMenu(Menu:menuid) {}

    /**
     *
     *
     * @param menuid
     * @param column
     * @param menutext
     * @category a_samp.inc
     */
    public AddMenuItem(Menu:menuid, column, const menutext[]) {}

    /**
     *
     *
     * @param menuid
     * @param column
     * @param columnheader
     * @category a_samp.inc
     */
    public SetMenuColumnHeader(Menu:menuid, column, const columnheader[]) {}

    /**
     *
     *
     * @param menuid
     * @param playerid
     * @category a_samp.inc
     */
    public ShowMenuForPlayer(Menu:menuid, playerid) {}

    /**
     *
     *
     * @param menuid
     * @param playerid
     * @category a_samp.inc
     */
    public HideMenuForPlayer(Menu:menuid, playerid) {}

    /**
     *
     *
     * @param menuid
     * @category a_samp.inc
     */
    public IsValidMenu(Menu:menuid) {}

    /**
     *
     *
     * @param menuid
     * @category a_samp.inc
     */
    public DisableMenu(Menu:menuid) {}

    /**
     *
     *
     * @param menuid
     * @param row
     * @category a_samp.inc
     */
    public DisableMenuRow(Menu:menuid, row) {}

    /**
     *
     *
     * @param playerid
     * @category a_samp.inc
     */
    public Menu: GetPlayerMenu(playerid) {}

    /**
     *
     *
     * @param x
     * @param y
     * @param text
     * @category a_samp.inc
     */
    public Text: TextDrawCreate(Float:x, Float:y, text[]) {}

    /**
     *
     *
     * @param text
     * @category a_samp.inc
     */
    public TextDrawDestroy(Text:text) {}

    /**
     *
     *
     * @param text
     * @param x
     * @param y
     * @category a_samp.inc
     */
    public TextDrawLetterSize(Text:text, Float:x, Float:y) {}

    /**
     *
     *
     * @param text
     * @param x
     * @param y
     * @category a_samp.inc
     */
    public TextDrawTextSize(Text:text, Float:x, Float:y) {}

    /**
     *
     *
     * @param text
     * @param alignment
     * @category a_samp.inc
     */
    public TextDrawAlignment(Text:text, alignment) {}

    /**
     *
     *
     * @param text
     * @param color
     * @category a_samp.inc
     */
    public TextDrawColor(Text:text, color) {}

    /**
     *
     *
     * @param text
     * @param use
     * @category a_samp.inc
     */
    public TextDrawUseBox(Text:text, use) {}

    /**
     *
     *
     * @param text
     * @param color
     * @category a_samp.inc
     */
    public TextDrawBoxColor(Text:text, color) {}

    /**
     *
     *
     * @param text
     * @param size
     * @category a_samp.inc
     */
    public TextDrawSetShadow(Text:text, size) {}

    /**
     *
     *
     * @param text
     * @param size
     * @category a_samp.inc
     */
    public TextDrawSetOutline(Text:text, size) {}

    /**
     *
     *
     * @param text
     * @param color
     * @category a_samp.inc
     */
    public TextDrawBackgroundColor(Text:text, color) {}

    /**
     *
     *
     * @param text
     * @param font
     * @category a_samp.inc
     */
    public TextDrawFont(Text:text, font) {}

    /**
     *
     *
     * @param text
     * @param set
     * @category a_samp.inc
     */
    public TextDrawSetProportional(Text:text, set) {}

    /**
     *
     *
     * @param text
     * @param set
     * @category a_samp.inc
     */
    public TextDrawSetSelectable(Text:text, set) {}

    /**
     *
     *
     * @param playerid
     * @param text
     * @category a_samp.inc
     */
    public TextDrawShowForPlayer(playerid, Text:text) {}

    /**
     *
     *
     * @param playerid
     * @param text
     * @category a_samp.inc
     */
    public TextDrawHideForPlayer(playerid, Text:text) {}

    /**
     *
     *
     * @param text
     * @category a_samp.inc
     */
    public TextDrawShowForAll(Text:text) {}

    /**
     *
     *
     * @param text
     * @category a_samp.inc
     */
    public TextDrawHideForAll(Text:text) {}

    /**
     *
     *
     * @param text
     * @param string
     * @category a_samp.inc
     */
    public TextDrawSetString(Text:text, string[]) {}

    /**
     *
     *
     * @param text
     * @param modelindex
     * @category a_samp.inc
     */
    public TextDrawSetPreviewModel(Text:text, modelindex) {}

    /**
     *
     *
     * @param text
     * @param fRotX
     * @param fRotY
     * @param fRotZ
     * @param fZoom
     * @category a_samp.inc
     */
    public TextDrawSetPreviewRot(Text:text, Float:fRotX, Float:fRotY, Float:fRotZ, Float:fZoom = 1.0) {}

    /**
     *
     *
     * @param text
     * @param color1
     * @param color2
     * @category a_samp.inc
     */
    public TextDrawSetPreviewVehCol(Text:text, color1, color2) {}

    /**
     *
     *
     * @param minx
     * @param miny
     * @param maxx
     * @param maxy
     * @category a_samp.inc
     */
    public GangZoneCreate(Float:minx, Float:miny, Float:maxx, Float:maxy) {}

    /**
     *
     *
     * @param zone
     * @category a_samp.inc
     */
    public GangZoneDestroy(zone) {}

    /**
     *
     *
     * @param playerid
     * @param zone
     * @param color
     * @category a_samp.inc
     */
    public GangZoneShowForPlayer(playerid, zone, color) {}

    /**
     *
     *
     * @param zone
     * @param color
     * @category a_samp.inc
     */
    public GangZoneShowForAll(zone, color) {}

    /**
     *
     *
     * @param playerid
     * @param zone
     * @category a_samp.inc
     */
    public GangZoneHideForPlayer(playerid, zone) {}

    /**
     *
     *
     * @param zone
     * @category a_samp.inc
     */
    public GangZoneHideForAll(zone) {}

    /**
     *
     *
     * @param playerid
     * @param zone
     * @param flashcolor
     * @category a_samp.inc
     */
    public GangZoneFlashForPlayer(playerid, zone, flashcolor) {}

    /**
     *
     *
     * @param zone
     * @param flashcolor
     * @category a_samp.inc
     */
    public GangZoneFlashForAll(zone, flashcolor) {}

    /**
     *
     *
     * @param playerid
     * @param zone
     * @category a_samp.inc
     */
    public GangZoneStopFlashForPlayer(playerid, zone) {}

    /**
     *
     *
     * @param zone
     * @category a_samp.inc
     */
    public GangZoneStopFlashForAll(zone) {}

    /**
     *
     *
     * @param text
     * @param color
     * @param X
     * @param Y
     * @param Z
     * @param DrawDistance
     * @param virtualworld
     * @param testLOS
     * @category a_samp.inc
     */
    public Text3D: Create3DTextLabel(text[], color, Float:X, Float:Y, Float:Z, Float:DrawDistance, virtualworld, testLOS=0) {}

    /**
     *
     *
     * @param id
     * @category a_samp.inc
     */
    public Delete3DTextLabel(Text3D:id) {}

    /**
     *
     *
     * @param id
     * @param playerid
     * @param OffsetX
     * @param OffsetY
     * @param OffsetZ
     * @category a_samp.inc
     */
    public Attach3DTextLabelToPlayer(Text3D:id, playerid, Float:OffsetX, Float:OffsetY, Float:OffsetZ) {}

    /**
     *
     *
     * @param id
     * @param vehicleid
     * @param OffsetX
     * @param OffsetY
     * @param OffsetZ
     * @category a_samp.inc
     */
    public Attach3DTextLabelToVehicle(Text3D:id, vehicleid, Float:OffsetX, Float:OffsetY, Float:OffsetZ) {}

    /**
     *
     *
     * @param id
     * @param color
     * @param text
     * @category a_samp.inc
     */
    public Update3DTextLabelText(Text3D:id, color, text[]) {}

    /**
     *
     *
     * @param playerid
     * @param text
     * @param color
     * @param X
     * @param Y
     * @param Z
     * @param DrawDistance
     * @param attachedplayer
     * @param attachedvehicle
     * @param testLOS
     * @category a_samp.inc
     */
    public PlayerText3D: CreatePlayer3DTextLabel(playerid, text[], color, Float:X, Float:Y, Float:Z, Float:DrawDistance, attachedplayer=INVALID_PLAYER_ID, attachedvehicle=INVALID_VEHICLE_ID, testLOS=0) {}

    /**
     *
     *
     * @param playerid
     * @param id
     * @category a_samp.inc
     */
    public DeletePlayer3DTextLabel(playerid, PlayerText3D:id) {}

    /**
     *
     *
     * @param playerid
     * @param id
     * @param color
     * @param text
     * @category a_samp.inc
     */
    public UpdatePlayer3DTextLabelText(playerid, PlayerText3D:id, color, text[]) {}

    /**
     *
     *
     * @param playerid
     * @param dialogid
     * @param style
     * @param caption
     * @param info
     * @param button1
     * @param button2
     * @category a_samp.inc
     */
    public ShowPlayerDialog(playerid, dialogid, style, caption[], info[], button1[], button2[]) {}

    // ---
    // --- a_vehicles.inc --------------------------------------------------------------------------
    // ---

    /**
     *
     *
     * @param vehicletype
     * @param x
     * @param y
     * @param z
     * @param rotation
     * @param color1
     * @param color2
     * @param respawn_delay
     * @category a_vehicles.inc
     */
    public CreateVehicle(vehicletype, Float:x, Float:y, Float:z, Float:rotation, color1, color2, respawn_delay) {}

    /**
     *
     *
     * @param vehicleid
     * @category a_vehicles.inc
     */
    public DestroyVehicle(vehicleid) {}

    /**
     *
     *
     * @param vehicleid
     * @param forplayerid
     * @category a_vehicles.inc
     */
    public IsVehicleStreamedIn(vehicleid, forplayerid) {}

    /**
     *
     *
     * @param vehicleid
     * @param x
     * @param y
     * @param z
     * @category a_vehicles.inc
     */
    public GetVehiclePos(vehicleid, &Float:x, &Float:y, &Float:z) {}

    /**
     *
     *
     * @param vehicleid
     * @param x
     * @param y
     * @param z
     * @category a_vehicles.inc
     */
    public SetVehiclePos(vehicleid, Float:x, Float:y, Float:z) {}

    /**
     *
     *
     * @param vehicleid
     * @param z_angle
     * @category a_vehicles.inc
     */
    public GetVehicleZAngle(vehicleid, &Float:z_angle) {}

    /**
     *
     *
     * @param vehicleid
     * @param w
     * @param x
     * @param y
     * @param z
     * @category a_vehicles.inc
     */
    public GetVehicleRotationQuat(vehicleid, &Float:w, &Float:x, &Float:y, &Float:z) {}

    /**
     *
     *
     * @param vehicleid
     * @param X
     * @param Y
     * @param Z
     * @category a_vehicles.inc
     */
    public Float: GetVehicleDistanceFromPoint(vehicleid, Float:X, Float:Y, Float:Z) {}

    /**
     *
     *
     * @param vehicleid
     * @param z_angle
     * @category a_vehicles.inc
     */
    public SetVehicleZAngle(vehicleid, Float:z_angle) {}

    /**
     *
     *
     * @param vehicleid
     * @param playerid
     * @param objective
     * @param doorslocked
     * @category a_vehicles.inc
     */
    public SetVehicleParamsForPlayer(vehicleid,playerid,objective,doorslocked) {}

    public ManualVehicleEngineAndLights() {}
    /**
     *
     *
     * @param vehicleid
     * @param engine
     * @param lights
     * @param alarm
     * @param doors
     * @param bonnet
     * @param boot
     * @param objective
     * @category a_vehicles.inc
     */
    public SetVehicleParamsEx(vehicleid, engine, lights, alarm, doors, bonnet, boot, objective) {}

    /**
     *
     *
     * @param vehicleid
     * @param &engine
     * @param &lights
     * @param &alarm
     * @param &doors
     * @param &bonnet
     * @param &boot
     * @param &objective
     * @category a_vehicles.inc
     */
    public GetVehicleParamsEx(vehicleid, &engine, &lights, &alarm, &doors, &bonnet, &boot, &objective) {}

    /**
     *
     *
     * @param vehicleid
     * @category a_vehicles.inc
     */
    public SetVehicleToRespawn(vehicleid) {}

    /**
     *
     *
     * @param vehicleid
     * @param interiorid
     * @category a_vehicles.inc
     */
    public LinkVehicleToInterior(vehicleid, interiorid) {}

    /**
     *
     *
     * @param vehicleid
     * @param componentid
     * @category a_vehicles.inc
     */
    public AddVehicleComponent(vehicleid, componentid) {}

    /**
     *
     *
     * @param vehicleid
     * @param componentid
     * @category a_vehicles.inc
     */
    public RemoveVehicleComponent(vehicleid, componentid) {}

    /**
     *
     *
     * @param vehicleid
     * @param color1
     * @param color2
     * @category a_vehicles.inc
     */
    public ChangeVehicleColor(vehicleid, color1, color2) {}

    /**
     *
     *
     * @param vehicleid
     * @param paintjobid
     * @category a_vehicles.inc
     */
    public ChangeVehiclePaintjob(vehicleid, paintjobid) {}

    /**
     *
     *
     * @param vehicleid
     * @param health
     * @category a_vehicles.inc
     */
    public SetVehicleHealth(vehicleid, Float:health) {}

    /**
     *
     *
     * @param vehicleid
     * @param health
     * @category a_vehicles.inc
     */
    public GetVehicleHealth(vehicleid, &Float:health) {}

    /**
     *
     *
     * @param trailerid
     * @param vehicleid
     * @category a_vehicles.inc
     */
    public AttachTrailerToVehicle(trailerid, vehicleid) {}

    /**
     *
     *
     * @param vehicleid
     * @category a_vehicles.inc
     */
    public DetachTrailerFromVehicle(vehicleid) {}

    /**
     *
     *
     * @param vehicleid
     * @category a_vehicles.inc
     */
    public IsTrailerAttachedToVehicle(vehicleid) {}

    /**
     *
     *
     * @param vehicleid
     * @category a_vehicles.inc
     */
    public GetVehicleTrailer(vehicleid) {}

    /**
     *
     *
     * @param vehicleid
     * @param numberplate
     * @category a_vehicles.inc
     */
    public SetVehicleNumberPlate(vehicleid, numberplate[]) {}

    /**
     *
     *
     * @param vehicleid
     * @category a_vehicles.inc
     */
    public GetVehicleModel(vehicleid) {}

    /**
     *
     *
     * @param vehicleid
     * @param slot
     * @category a_vehicles.inc
     */
    public GetVehicleComponentInSlot(vehicleid, slot) {}

    /**
     *
     *
     * @param component
     * @category a_vehicles.inc
     */
    public GetVehicleComponentType(component) {}

    /**
     *
     *
     * @param vehicleid
     * @category a_vehicles.inc
     */
    public RepairVehicle(vehicleid) {}

    /**
     *
     *
     * @param vehicleid
     * @param X
     * @param Y
     * @param Z
     * @category a_vehicles.inc
     */
    public GetVehicleVelocity(vehicleid, &Float:X, &Float:Y, &Float:Z) {}

    /**
     *
     *
     * @param vehicleid
     * @param X
     * @param Y
     * @param Z
     * @category a_vehicles.inc
     */
    public SetVehicleVelocity(vehicleid, Float:X, Float:Y, Float:Z) {}

    /**
     *
     *
     * @param vehicleid
     * @param X
     * @param Y
     * @param Z
     * @category a_vehicles.inc
     */
    public SetVehicleAngularVelocity(vehicleid, Float:X, Float:Y, Float:Z) {}

    /**
     *
     *
     * @param vehicleid
     * @param &panels
     * @param &doors
     * @param &lights
     * @param &tires
     * @category a_vehicles.inc
     */
    public GetVehicleDamageStatus(vehicleid, &panels, &doors, &lights, &tires) {}

    /**
     *
     *
     * @param vehicleid
     * @param panels
     * @param doors
     * @param lights
     * @param tires
     * @category a_vehicles.inc
     */
    public UpdateVehicleDamageStatus(vehicleid, panels, doors, lights, tires) {}

    /**
     *
     *
     * @param vehiclemodel
     * @param infotype
     * @param X
     * @param Y
     * @param Z
     * @category a_vehicles.inc
     */
    public GetVehicleModelInfo(vehiclemodel, infotype, &Float:X, &Float:Y, &Float:Z) {}

    /**
     *
     *
     * @param vehicleid
     * @param worldid
     * @category a_vehicles.inc
     */
    public SetVehicleVirtualWorld(vehicleid, worldid) {}

    /**
     *
     *
     * @param vehicleid
     * @category a_vehicles.inc
     */
    public GetVehicleVirtualWorld(vehicleid) {}

    // ---
    // --- core.inc --------------------------------------------------------------------------------
    // ---

    public heapspace() {}
    /**
     *
     *
     * @param name
     * @category core.inc
     */
    public funcidx(const name[]) {}

    public numargs() {}
    /**
     *
     *
     * @param arg
     * @param index
     * @category core.inc
     */
    public getarg(arg, index=0) {}

    /**
     *
     *
     * @param arg
     * @param index
     * @param value
     * @category core.inc
     */
    public setarg(arg, index=0, value) {}

    /**
     *
     *
     * @param c
     * @category core.inc
     */
    public tolower(c) {}

    /**
     *
     *
     * @param c
     * @category core.inc
     */
    public toupper(c) {}

    /**
     *
     *
     * @param c
     * @category core.inc
     */
    public swapchars(c) {}

    /**
     *
     *
     * @param max
     * @category core.inc
     */
    public random(max) {}

    /**
     *
     *
     * @param value1
     * @param value2
     * @category core.inc
     */
    public min(value1, value2) {}

    /**
     *
     *
     * @param value1
     * @param value2
     * @category core.inc
     */
    public max(value1, value2) {}

    /**
     *
     *
     * @param value
     * @param min
     * @param max
     * @category core.inc
     */
    public clamp(value, min=cellmin, max=cellmax) {}

    /**
     *
     *
     * @param id
     * @param name
     * @param value
     * @param string
     * @category core.inc
     */
    public getproperty(id=0, const name[]="", value=cellmin, string[]="") {}

    /**
     *
     *
     * @param id
     * @param name
     * @param value
     * @param string
     * @category core.inc
     */
    public setproperty(id=0, const name[]="", value=cellmin, const string[]="") {}

    /**
     *
     *
     * @param id
     * @param name
     * @param value
     * @category core.inc
     */
    public deleteproperty(id=0, const name[]="", value=cellmin) {}

    /**
     *
     *
     * @param id
     * @param name
     * @param value
     * @category core.inc
     */
    public existproperty(id=0, const name[]="", value=cellmin) {}

    // ---
    // --- datagram.inc ----------------------------------------------------------------------------
    // ---

    /**
     *
     *
     * @param message
     * @param destination
     * @category datagram.inc
     */
    public sendstring(const message[], const destination[]="") {}

    /**
     *
     *
     * @param packet
     * @param size
     * @param destination
     * @category datagram.inc
     */
    public sendpacket(const packet[], size, const destination[]="") {}

    /**
     *
     *
     * @param port
     * @category datagram.inc
     */
    public listenport(port) {}

    // ---
    // --- file.inc --------------------------------------------------------------------------------
    // ---

    /**
     *
     *
     * @param name
     * @param  mode
     * @category file.inc
     */
    public File: fopen(const name[], filemode: mode = io_readwrite) {}

    /**
     *
     *
     * @param  handle
     * @category file.inc
     */
    public bool: fclose(File: handle) {}

    public File: ftemp() {}
    /**
     *
     *
     * @param name
     * @category file.inc
     */
    public bool: fremove(const name[]) {}

    /**
     *
     *
     * @param  handle
     * @param string
     * @category file.inc
     */
    public fwrite(File: handle, const string[]) {}

    /**
     *
     *
     * @param  handle
     * @param string
     * @param size
     * @param  pack
     * @category file.inc
     */
    public fread(File: handle, string[], size = sizeof string, bool: pack = false) {}

    /**
     *
     *
     * @param  handle
     * @param value
     * @param  utf8
     * @category file.inc
     */
    public bool: fputchar(File: handle, value, bool: utf8 = true) {}

    /**
     *
     *
     * @param  handle
     * @param value
     * @param  utf8
     * @category file.inc
     */
    public fgetchar(File: handle, value, bool: utf8 = true) {}

    /**
     *
     *
     * @param  handle
     * @param buffer
     * @param size
     * @category file.inc
     */
    public fblockwrite(File: handle, const buffer[], size = sizeof buffer) {}

    /**
     *
     *
     * @param  handle
     * @param buffer
     * @param size
     * @category file.inc
     */
    public fblockread(File: handle, buffer[], size = sizeof buffer) {}

    /**
     *
     *
     * @param  handle
     * @param position
     * @param  whence
     * @category file.inc
     */
    public fseek(File: handle, position = 0, seek_whence: whence = seek_start) {}

    /**
     *
     *
     * @param  handle
     * @category file.inc
     */
    public flength(File: handle) {}

    /**
     *
     *
     * @param pattern
     * @category file.inc
     */
    public fexist(const pattern[]) {}

    /**
     *
     *
     * @param name
     * @param pattern
     * @param index
     * @param size
     * @category file.inc
     */
    public bool: fmatch(name[], const pattern[], index = 0, size = sizeof name) {}

    // ---
    // --- float.inc -------------------------------------------------------------------------------
    // ---

    /**
     *
     *
     * @param value
     * @category float.inc
     */
    public Float: float(value) {}

    /**
     *
     *
     * @param string
     * @category float.inc
     */
    public Float: floatstr(const string[]) {}

    /**
     *
     *
     * @param oper1
     * @param oper2
     * @category float.inc
     */
    public Float: floatmul(Float:oper1, Float:oper2) {}

    /**
     *
     *
     * @param dividend
     * @param divisor
     * @category float.inc
     */
    public Float: floatdiv(Float:dividend, Float:divisor) {}

    /**
     *
     *
     * @param oper1
     * @param oper2
     * @category float.inc
     */
    public Float: floatadd(Float:oper1, Float:oper2) {}

    /**
     *
     *
     * @param oper1
     * @param oper2
     * @category float.inc
     */
    public Float: floatsub(Float:oper1, Float:oper2) {}

    /**
     *
     *
     * @param value
     * @category float.inc
     */
    public Float: floatfract(Float:value) {}

    /**
     *
     *
     * @param value
     * @param method
     * @category float.inc
     */
    public floatround(Float:value, floatround_method:method=floatround_round) {}

    /**
     *
     *
     * @param oper1
     * @param oper2
     * @category float.inc
     */
    public floatcmp(Float:oper1, Float:oper2) {}

    /**
     *
     *
     * @param value
     * @category float.inc
     */
    public Float: floatsqroot(Float:value) {}

    /**
     *
     *
     * @param value
     * @param exponent
     * @category float.inc
     */
    public Float: floatpower(Float:value, Float:exponent) {}

    /**
     *
     *
     * @param value
     * @param base
     * @category float.inc
     */
    public Float: floatlog(Float:value, Float:base=10.0) {}

    /**
     *
     *
     * @param value
     * @param mode
     * @category float.inc
     */
    public Float: floatsin(Float:value, anglemode:mode=radian) {}

    /**
     *
     *
     * @param value
     * @param mode
     * @category float.inc
     */
    public Float: floatcos(Float:value, anglemode:mode=radian) {}

    /**
     *
     *
     * @param value
     * @param mode
     * @category float.inc
     */
    public Float: floattan(Float:value, anglemode:mode=radian) {}

    /**
     *
     *
     * @param value
     * @category float.inc
     */
    public Float: floatabs(Float:value) {}

    // ---
    // --- string.inc ------------------------------------------------------------------------------
    // ---

    /**
     *
     *
     * @param string
     * @category string.inc
     */
    public strlen(const string[]) {}

    /**
     *
     *
     * @param dest
     * @param source
     * @param maxlength
     * @category string.inc
     */
    public strpack(dest[], const source[], maxlength=sizeof dest) {}

    /**
     *
     *
     * @param dest
     * @param source
     * @param maxlength
     * @category string.inc
     */
    public strunpack(dest[], const source[], maxlength=sizeof dest) {}

    /**
     *
     *
     * @param dest
     * @param source
     * @param maxlength
     * @category string.inc
     */
    public strcat(dest[], const source[], maxlength=sizeof dest) {}

    /**
     *
     *
     * @param dest
     * @param source
     * @param start
     * @param end
     * @param maxlength
     * @category string.inc
     */
    public strmid(dest[], const source[], start, end, maxlength=sizeof dest) {}

    /**
     *
     *
     * @param string
     * @param substr
     * @param pos
     * @param maxlength
     * @category string.inc
     */
    public bool: strins(string[], const substr[], pos, maxlength=sizeof string) {}

    /**
     *
     *
     * @param string
     * @param start
     * @param end
     * @category string.inc
     */
    public bool: strdel(string[], start, end) {}

    /**
     *
     *
     * @param string1
     * @param string2
     * @param ignorecase
     * @param length
     * @category string.inc
     */
    public strcmp(const string1[], const string2[], bool:ignorecase=false, length=cellmax) {}

    /**
     *
     *
     * @param string
     * @param sub
     * @param ignorecase
     * @param pos
     * @category string.inc
     */
    public strfind(const string[], const sub[], bool:ignorecase=false, pos=0) {}

    /**
     *
     *
     * @param string
     * @category string.inc
     */
    public strval(const string[]) {}

    /**
     *
     *
     * @param dest
     * @param value
     * @param pack
     * @category string.inc
     */
    public valstr(dest[], value, bool:pack=false) {}

    /**
     *
     *
     * @param string
     * @category string.inc
     */
    public bool: ispacked(const string[]) {}

    /**
     *
     *
     * @param dest
     * @param source
     * @param maxlength
     * @category string.inc
     */
    public uudecode(dest[], const source[], maxlength=sizeof dest) {}

    /**
     *
     *
     * @param dest
     * @param source
     * @param numbytes
     * @param maxlength
     * @category string.inc
     */
    public uuencode(dest[], const source[], numbytes, maxlength=sizeof dest) {}

    /**
     *
     *
     * @param dest
     * @param source
     * @param index
     * @param numbytes
     * @param maxlength
     * @category string.inc
     */
    public memcpy(dest[], const source[], index=0, numbytes, maxlength=sizeof dest) {}

    // ---
    // --- time.inc ------------------------------------------------------------------------------
    // ---

    /**
     *
     *
     * @param &hour
     * @param &minute
     * @param &second
     * @category time.inc
     */
    public gettime(&hour=0, &minute=0, &second=0) {}

    /**
     *
     *
     * @param &year
     * @param &month
     * @param &day
     * @category time.inc
     */
    public getdate(&year=0, &month=0, &day=0) {}

    /**
     *
     *
     * @param &granularity
     * @category time.inc
     */
    public tickcount(&granularity=0) {}
};