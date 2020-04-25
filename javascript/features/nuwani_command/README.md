# The `/nuwani` command
In-game staff is able to inspect and manage the IRC bots through the `/nuwani` command. Access to
this command is restricted to Management members by default, but that can be configured through
the `/lvp access` command.

The command will show a menu with a variety of options available to choose from.

# Inspect bot status
Displays a list of the configured bots, each with their connectivity status and recent command
rates. Command rates are not available for bots not currently connected to the network.

# Request an increase in bots...
Requests one of the available bots to connect to the network and start assuming some of the message
load. Useful when in-game staff is aware of an upcoming change in player volume. Selecting this
option will display a confirmation dialog before committing the action.

# Request a decrease in bots...
Requests one of the optional connected bots to disconnect from the network. This should only be
rarely necessary as the system can load balance itself, but for symmetry we've included it.
Selecting this option will display a confirmation dialog before committing the action.
