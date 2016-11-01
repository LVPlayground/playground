// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/**
 * External services can communicate with the Grand Theft Auto server by issuing commands to a SA-MP
 * system called "rcon", short for remote control. We intercept given commands and add functionality
 * specific to Las Venturas Playground.
 *
 * @author Russell Krupke <russell@sa-mp.nl>
 */
class RemoteCommand {
    /**
     * Invoked when a command has been issued. The source of the command is unknown, and as such it
     * should be treated as untrusted. Don't process something unless all parameters are correct.
     *
     * @param commandText The command that has been issued.
     * @return boolean Were we able to successfully handle the command?
     */
    public bool: onCommand(commandText[]) {
        if (strlen(commandText) == 0)
            return false;

        new command[16],
            parameterOffset = 0;

        Command->stringParameter(commandText, 0, command, sizeof(command));
        parameterOffset = min(strlen(commandText), Command->startingIndexForParameter(commandText, 0) + strlen(command) + 1);

        // See if any method is listening to the operation given by the player. If so, bail out.
        if (Annotation::ExpandSwitch<RemoteCommand>(command, commandText[parameterOffset]) != -1)
            return true;

        // Check the deprecated IRC commands as well to see if we can handle it in there.
        return !!RunDeprecatedIrcCommand(commandText);
    }
};
