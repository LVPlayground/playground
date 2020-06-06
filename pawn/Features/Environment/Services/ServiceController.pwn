// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/**
 * The service controller owns the trains which run around Las Venturas Playground, as well as the
 * planes which fly around on the server. We create all the necessary NPCs in here.
 *
 * @author Russell Krupke <russell@sa-mp.nl>
 */
class ServiceController {
    // What is the dialog Id that will be used for the respawning warning?
    public const WarningDialogId = @counter(OnDialogResponse);

    /**
     * Initializes all the services by requesting them to be connected to the server. The services
     * themselves have a feature which keeps them connected to the server, even if they time out or
     * accidentially get kicked by an administrator.
     */
    public __construct() {
        // Initialize the train drivers.
#if ReleaseSettings::CreateTrainDrivers == 1
        TrainDriver(TrainDriverLasVenturas)->initialize("TrainDriverLV", "train_lv", 1462.0745, 2630.8787, 10.8203);
        TrainDriver(TrainDriverLosSantos)->initialize("TrainDriverLS", "train_ls", -1942.7950, 168.4164, 27.0006);
        TrainDriver(TrainDriverSanFierro)->initialize("TrainDriverSF", "train_sf", 1700.7551, -1953.6531, 14.8756);
#endif
    }

    /**
     * Resets all services which are currently active on Las Venturas Playground. This basically
     * means that we'll iterate through all players, kick all NPCs, and then restart the ones by
     * re-invoking the constructor of this class.
     */
    public resetServices() {
#if ReleaseSettings::CreateTrainDrivers == 1
        NPCManager->requestDisconnectForFeature(TrainDriver::TrainDriverHandlerId);
#endif

        // Now that all bots have disconnected, we simply re-invoke the constructor again which will
        // restart the processes. Disconnecting NPCs will disconnect them immediately.
        this->__construct();
    }

    /**
     * Administrators have the ability to restart the services by typing the /fixservices command.
     * This will show them a dialog, informing them of the possible consequences, first.
     *
     * @param playerId Id of the player who executed this command.
     * @param params Additional parameters passed on to this command. Unused.
     * @command /fixservices
     */
    @command("fixservices")
    public onFixNpcsCommand(playerId, params[]) {
        if (Player(playerId)->isAdministrator() == false)
            return 0; // only administrators may use this command.

        ShowPlayerDialog(playerId, ServiceController::WarningDialogId, DIALOG_STYLE_MSGBOX, "Las Venturas Playground",
            "Warning: Fixing NPCs will force them to reconnect to the\n" ...
            "server. THIS DOES NOT INCLUDE GUNTHER AND PLANE PILOTS ANYMORE.\n\n" ...
            "Are you sure you wish to reconnect the Non Playing Characters?",
            "Yes", "Cancel");

        return 1;
        #pragma unused params
    }

    /**
     * After the administrator chose an option in the dialog -- either Yes or Cancel, we may have to
     * reset the actual services and announce this to other administrators.
     *
     * @param playerId Id of the player who we received a reply from.
     * @param button The button on the dialog which was clicked by the administrator.
     * @param listItem Index of the item in the list, if applicable.
     * @param inputText Text which has been entered in the dialog, if applicable.
     */
    @switch(OnDialogResponse, ServiceController::WarningDialogId)
    public onWarningDialogResponse(playerId, DialogButton: button, listItem, inputText[]) {
        if (button != LeftButton)
            return; // we only reset in case the admin clicked on "Yes".

        new message[128];
        format(message, sizeof(message), "%s (Id:%d) has reset the environmental services.",
            Player(playerId)->nicknameString(), playerId);
        Admin(playerId, message);

        // Now actually reset the services.
        this->resetServices();

        #pragma unused listItem, inputText
    }
};
