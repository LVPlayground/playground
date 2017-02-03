# Feature: Killtime
The killtime feature is responsible for handling the killtime-minigame for the mainworld. Everyone in that
world is automatically signed up/involved in it and they can even win an interesting amount of prizemoney
with it.

## Command and options
This feature provides 1 simple command for this option, which is `/killtime`. With that command killtime
is a bit controlable by the administrator with the options.[]()

  * **/killtime**: Executing solely this command shows the different available options; start and stop.
    * **start [minutes]?**: Start the killtime. When not giving up minutes the duration will standard be 2
    minutes.
    * **stop**: Stops the killtime. The prizemoney will still be handed out to the winner.

## FAQ: What is the prizemoney-amount when the killitme is over.
This calculation can be found in the last paragraph of the [economyfeature](../economy).


## FAQ: Why did we remove the option for a specific weapon?
Since LVP is rewritten to another programminglanguage, from Pawn to JavaScript, the anticheatfeatures are
still in the Pawn-portion. To lower the complexity of the feature and to have this feature released
soon we choose to built this in later.
