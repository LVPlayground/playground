// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/**
 * The irc-command-class contains various methods so Nuwani can request the available commands and
 * we can inform her of them.
 * Also we should be having less maintenance at Nuwani with, for example adding new commands or
 * changed code of it slightly.
 *
 * @author Xander "Xanland" Hoogland <home@xanland.nl>
 */
class IrcCommand {
    // We need to know if Nuwani requested the commands. If she didn't we also shouldn't announce
    // them to her. This member variable will take care of it. Standard it is disabled. On a re-
    // quest it will be enabled.
    new bool: m_receivedRequestFromNuwani = false;

    /**
     * To have less maintenance, Nuwani (the LVP IRC Bot) requests the commands automatically from
     * the gamemode on a "Gamemode Initialization". Nuwani only checks if the trigger is used if it
     * matches the type, integer - string, asked.
     */
    @switch(RemoteCommand, "requestcommands")
    public onRemoteNuwaniRequestingCommands(params[]) {
        m_receivedRequestFromNuwani = true;
        printf("[IrcCommand] Nuwani requested all the available commands to process.");
        IrcCommand->OnIrcRequestCommandsList();

        #pragma unused params
    }

    /**
     * To register a command in Nuwani every class with a RemoteCommand-switch has to call this
     * method in a @list(OnIrcRequestCommandsList). If Nuwani requested for the commands this method
     * will be executed, else nothing will happen.
     *
     * @param trigger On which piece of text should the command react on.
     * @param paramTypes Every parameter a user can type has specific requirements so the gamemode
                         can handle it. The following modifiers are available:
                          - i     Integer, such as a playerId or a number.
                          - s     String, just some text. Most likely a reason or name.
                          - ?     This makes the preceding modifier optional.
     * @param userRight The minimum right the user needs to execute this command: +, %, @, &, ~ or
                        leave it empty.
     * @param usage If the player only types the trigger we show the available parameters.
     */
    public addCommand(trigger[], paramTypes[], userRight[], usage[]) {
        if (m_receivedRequestFromNuwani == true) {
            new tagLine [255];

            format(tagLine, sizeof(tagLine), "%s %s %s %s", trigger,
                                                            paramTypes,
                                                            userRight,
                                                            usage);

            IRC->broadcast(AddCommandIrcMessage, tagLine);
        }
    }

    /**
     * Every class which wants to register irc-commands within Nuwani needs to @list this method in
     * the class. In there for every command available in the class there needs to be a
     * IrcCommand->addCommand-line. This will register the commands into Nuwani for use.
     */
    public OnIrcRequestCommandsList() {
        Annotation::ExpandList<OnIrcRequestCommandsList>();
    }
};
