# Houses
Richer players on the server have the ability to purchase a house for themselves on Las Venturas
Playground. The house's interior can be decorated by the player with objects, there may be parking
spots for personalized vehicles available 

The prices for houses, as well as any of the possible accessories, will be determined by the
[economy algorithms](https://github.com/LVPlayground/playground/tree/master/javascript/features/economy)
as opposed to administrators. This enables us to keep control over pricing.

The following concepts are important for this feature:
  - **House locations** can be created by administrators around San Andreas. These define where
    players are able to purchase the houses of their liking.
  - **Houses** are the interiors linked to a _house location_. They are owned by a particular player
    and can only be accessed by a limited set of players.


## What happens when you enter a house?
There are several scenarios that may occur when a player enters a house marker.

  - The player is _not_ an administrator.
    - **The location is available**: Dialog inviting them to purchase the location.
    - **They've got access to the house**: Teleported to the house's interior.
    - **They don't have access to the house**: Error message.
  - The player is an administrator.
    - **The location is available**: Dialog inviting them to purchase or remove the location.
    - **They've got access to the house**: Teleported to the house's interior.
    - **They don't have access to the house**: Error message, with an option to force-enter.


## Command: /houses
The `/houses` command is available to administrators for administrating the available houses. It has
the following options:

  - **/houses create**: Creates a new house location. The price range of houses on this location is
    predetermined by an algorithm, and cannot be modified.
  - **/houses**: Displays information about the command.


## FAQ: Can I own multiple houses?
No.


## FAQ: Who's got access to a house?
The owner of a house and their [friends](../friends/). Administrators can always access a house.
Players who are not registered with Las Venturas Playground are not able to access houses.

In the future, houses may feature dedicated access lists configurable by the owner.
