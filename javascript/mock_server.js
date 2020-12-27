// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { ActorManager } from 'entities/actor_manager.js';
import { AreaManager } from 'entities/area_manager.js';
import { CheckpointManager } from 'components/checkpoints/checkpoint_manager.js';
import { CommandManager } from 'components/commands/command_manager.js';
import { DialogManager } from 'components/dialogs/dialog_manager.js';
import { FeatureManager } from 'components/feature_manager/feature_manager.js';
import { MapIconManager } from 'entities/map_icon_manager.js';
import { MockDeferredEventManager } from 'components/events/mock_deferred_event_manager.js';
import { MockPickupManager } from 'entities/test/mock_pickup_manager.js';
import { NpcManager } from 'entities/npc_manager.js';
import { ObjectManager } from 'entities/object_manager.js';
import { PlayerManager } from 'entities/player_manager.js';
import { TextDrawManager as DeprecatedTextDrawManager } from 'components/text_draw/text_draw_manager.js';
import { TextDrawManager } from 'entities/text_draw_manager.js';
import { TextLabelManager } from 'entities/text_label_manager.js';
import { VehicleManager } from 'entities/vehicle_manager.js';
import { VirtualWorldManager } from 'entities/virtual_world_manager.js';

import { MockActor } from 'entities/test/mock_actor.js';
import { MockArea } from 'entities/test/mock_area.js';
import { MockClock } from 'base/test/mock_clock.js';
import { MockGameObject } from 'entities/test/mock_game_object.js';
import { MockMapIcon } from 'entities/test/mock_map_icon.js';
import { MockNpc } from 'entities/test/mock_npc.js';
import { MockPawnInvoke } from 'base/test/mock_pawn_invoke.js';
import { MockPickup } from 'entities/test/mock_pickup.js';
import { MockPlayer } from 'entities/test/mock_player.js';
import { MockTextLabel } from 'entities/test/mock_text_label.js';
import { MockVehicle } from 'entities/test/mock_vehicle.js';

import Abuse from 'features/abuse/abuse.js';
import Account from 'features/account/account.js';
import AccountProvider from 'features/account_provider/account_provider.js';
import Animations from 'features/animations/animations.js';
import Announce from 'features/announce/announce.js';
import Collectables from 'features/collectables/collectables.js';
import Communication from 'features/communication/communication.js';
import CommunicationCommands from 'features/communication_commands/communication_commands.js';
import Decorations from 'features/decorations/decorations.js';
import Derbies from 'features/derbies/derbies.js';
import Economy from 'features/economy/economy.js';
import Fights from 'features/fights/fights.js';
import Finance from 'features/finance/finance.js';
import Friends from 'features/friends/friends.js';
import Games from 'features/games/games.js';
import GamesDeathmatch from 'features/games_deathmatch/games_deathmatch.js';
import GamesVehicles from 'features/games_vehicles/games_vehicles.js';
import Gangs from 'features/gangs/gangs.js';
import Gunther from 'features/gunther/gunther.js';
import Haystack from 'features/haystack/haystack.js';
import Instrumentation from 'features/instrumentation/instrumentation.js';
import Leaderboard from 'features/leaderboard/leaderboard.js';
import Limits from 'features/limits/limits.js';
import { MockNuwani } from 'features/nuwani/test/mock_nuwani.js';
import NuwaniDiscord from 'features/nuwani_discord/nuwani_discord.js';
import PirateShip from 'features/pirate_ship/pirate_ship.js';
import PlayerColors from 'features/player_colors/player_colors.js';
import PlayerCommands from 'features/player_commands/player_commands.js';
import PlayerDecorations from 'features/player_decorations/player_decorations.js';
import PlayerSettings from 'features/player_settings/player_settings.js';
import PlayerStats from 'features/player_stats/player_stats.js';
import Playground from 'features/playground/playground.js';
import Punishments from 'features/punishments/punishments.js';
import Races from 'features/races/races.js';
import Radio from 'features/radio/radio.js';
import ReactionTests from 'features/reaction_tests/reaction_tests.js';
import Sampcac from 'features/sampcac/sampcac.js';
import Settings from 'features/settings/settings.js';
import Spectate from 'features/spectate/spectate.js';
import Streamer from 'features/streamer/streamer.js';
import Teleportation from 'features/teleportation/teleportation.js';
import Vehicles from 'features/vehicles/vehicles.js';

// The MockServer is a mocked implementation of the Server class that creates a mocked environment
// having mocked connected players. It will automatically be created before running a test, and
// will be disposed afterwards. There should not be any need to instantiate this class manually.
class MockServer {
    // Constructs the MockServer instance, and creates a mocked scenario on the server.
    constructor() {
        this.clock_ = new MockClock();
        this.pawnInvoke_ = new MockPawnInvoke();

        this.commandManager_ = new CommandManager();
        this.deferredEventManager_ = new MockDeferredEventManager();
        this.featureManager_ = new FeatureManager();

        this.checkpointManager_ = new CheckpointManager(CheckpointManager.kNormalCheckpoints);
        this.dialogManager_ = new DialogManager();
        this.raceCheckpointManager_ = new CheckpointManager(CheckpointManager.kRaceCheckpoints);
        this.deprecatedTextDrawManager_ = new DeprecatedTextDrawManager();

        this.actorManager_ = new ActorManager(MockActor /* actorConstructor */);
        this.areaManager_ = new AreaManager(MockArea /* areaConstructor */);
        this.mapIconManager_ = new MapIconManager(MockMapIcon /* mapIconConstructor= */);
        this.objectManager_ = new ObjectManager(MockGameObject /* objectConstructor */);
        this.pickupManager_ = new MockPickupManager(MockPickup /* pickupConstructor */);
        this.playerManager_ = new PlayerManager(MockPlayer /* playerConstructor */);
        this.textDrawManager_ = new TextDrawManager();
        this.textLabelManager_ = new TextLabelManager(MockTextLabel /* textLabelConstructor */);
        this.vehicleManager_ = new VehicleManager(MockVehicle /* vehicleConstructor */);
        this.virtualWorldManager_ = new VirtualWorldManager();

        this.npcManager_ = new NpcManager(MockNpc /* npcConstructor */, this.playerManager_);

        // Register features whose production versions are suitable for testing.
        this.featureManager_.registerFeaturesForTests({
            abuse: Abuse,
            account: Account,
            account_provider: AccountProvider,
            announce: Announce,  // TODO: Move functionality to |communication|. See #309.
            animations: Animations,
            collectables: Collectables,
            communication: Communication,
            communication_commands: CommunicationCommands,
            decorations: Decorations,
            derbies: Derbies,
            economy: Economy,
            fights: Fights,
            finance: Finance,
            friends: Friends,
            games: Games,
            games_deathmatch: GamesDeathmatch,
            games_vehicles: GamesVehicles,
            gangs: Gangs,
            gunther: Gunther,
            haystack: Haystack,
            instrumentation: Instrumentation,
            leaderboard: Leaderboard,
            limits: Limits,
            nuwani: MockNuwani,
            nuwani_discord: NuwaniDiscord,
            pirate_ship: PirateShip,
            player_colors: PlayerColors,
            player_commands: PlayerCommands,
            player_decorations: PlayerDecorations,
            player_settings: PlayerSettings,
            player_stats: PlayerStats,
            playground: Playground,
            punishments: Punishments,
            races: Races,
            radio: Radio,
            reaction_tests: ReactionTests,
            sampcac: Sampcac,
            settings: Settings,
            spectate: Spectate,
            streamer: Streamer,
            teleportation: Teleportation,
            vehicles: Vehicles
        });

        // Connect a series of fake players to the server.
        [
            { playerid: 0, name: 'Gunther' },
            { playerid: 1, name: 'Russell' },
            { playerid: 2, name: 'Lucy' }

        ].forEach(event => this.playerManager_.onPlayerConnect(event));
    }

    // Initialize the features that are required for the system to operate. In general this should
    // be limited to foundational features that have no dependencies of their own.
    initialize() {
        this.featureManager_.loadFeature('account_provider');
        this.featureManager_.loadFeature('player_colors');
    }

    // ---------------------------------------------------------------------------------------------

    // Gets the database. Will throw an exception because it's not available in tests.
    get database() { throw new Error('The database is not available in tests.'); }

    // Gets the clock. Returns real values, but has additional methods available for testing.
    get clock() { return this.clock_; }

    // ---------------------------------------------------------------------------------------------

    // Gets the command manager which is responsible for routing player-issued commands.
    get commandManager() { return this.commandManager_; }

    // Gets the deferred event manager, which dispatches deferred events.
    get deferredEventManager() { return this.deferredEventManager_; }

    // Gets the feature manager. This is a real instance.
    get featureManager() { return this.featureManager_; }

    // ---------------------------------------------------------------------------------------------

    // Gets the manager that's responsible for checkpoints.
    get checkpointManager() { return this.checkpointManager_; }

    // Gets the manager that's responsible for managing dialogs.
    get dialogManager() { return this.dialogManager_; }

    // Gets the manager that's responsible for race checkpoints on the server.
    get raceCheckpointManager() { return this.raceCheckpointManager_; }

    // Gets the manager that's responsible for text draws.
    get deprecatedTextDrawManager() { return this.deprecatedTextDrawManager_; }

    // ---------------------------------------------------------------------------------------------

    // Gets the real actor manager that maintains mocked actors.
    get actorManager() { return this.actorManager_; }

    // Gets the global area manager, responsible for all areas in the game.
    get areaManager() { return this.areaManager_; }

    // Gets the map icon manager, through which icons can be added to the map.
    get mapIconManager() { return this.mapIconManager_; }

    // Gets the global NPC manager, responsible for creating NPCs on the server.
    get npcManager() { return this.npcManager_; }

    // Gets the real object manager that maintains mocked objects.
    get objectManager() { return this.objectManager_; }

    // Gets the real pickup manager that maintains mocked pickups, but also has a number of utility
    // methods useful for testing purposes.
    get pickupManager() { return this.pickupManager_; }

    // Gets the real player manager that maintains mocked players.
    get playerManager() { return this.playerManager_; }

    // Gets the manager that's responsible for text draws.
    get textDrawManager() { return this.textDrawManager_; }

    // Gets the real text label manager that maintains mocked text labels.
    get textLabelManager() { return this.textLabelManager_; }

    // Gets the real vehicle manager that maintains mocked vehicles.
    get vehicleManager() { return this.vehicleManager_; }

    // Gets the Virtual World manager, responsible for allocating virtual worlds.
    get virtualWorldManager() { return this.virtualWorldManager_; }

    // ---------------------------------------------------------------------------------------------

    // Returns whether the Server instance is used to drive tests.
    isTest() { return true; }

    // ---------------------------------------------------------------------------------------------

    // Disposes the MockServer and uninitializes all owned objects.
    async dispose() {
        this.featureManager_.dispose();
        this.deferredEventManager_.dispose();
        this.commandManager_.dispose();

        this.checkpointManager_.dispose();
        this.dialogManager_.dispose();
        this.raceCheckpointManager_.dispose();
        this.deprecatedTextDrawManager_.dispose();

        await this.npcManager_.dispose();

        this.virtualWorldManager_.dispose();
        this.vehicleManager_.dispose();
        this.textLabelManager_.dispose();
        this.textDrawManager_.dispose();
        this.playerManager_.dispose();
        this.pickupManager_.dispose();
        this.objectManager_.dispose();
        this.mapIconManager_.dispose();
        this.areaManager_.dispose();
        this.actorManager_.dispose();

        this.pawnInvoke_.dispose();
        this.clock_.dispose();
    }

    // If dispose() fails for any reason, then the `safeDispose` method will be called to remove any
    // left-over global state. This avoids hundreds of tests from failing in succession.
    async safeDispose() {
        Player.provideSupplement('account', null);
        Player.provideSupplement('colors', null);
        Player.provideSupplement('settings', null);
        Player.provideSupplement('stats', null);
    }
}

export default MockServer;
