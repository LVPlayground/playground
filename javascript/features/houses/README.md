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

## Command: /houses
The `/houses` command is available to administrators for administrating the available houses. It has
the following options:

  - **/houses create**: Creates a new house location. The price range of houses on this location is
    predetermined by an algorithm, and cannot be modified.
  - **/houses**: Displays information about the command.
