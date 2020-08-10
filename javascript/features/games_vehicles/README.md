# Games Vehicles API
This feature contains extended functionality on top of the [Games API](../games/) that makes it
easier to build vehicles-based games for Las Venturas Playground, by providing well considered
options and implementations that apply to most sort of vehicle-based games.

## How to use the Games Vehicles API?
Where you would normally register a game with the `Games.registerGame()` function, you will be using
the `GamesVehicles.registerGame()` function instead. Pass in a class that extends
[VehicleGame](vehicle_game.js), and you'll be able to use all of the extra functionality and
[options][1] provided by this feature.

Your feature must depend on the `games_vehicles` instead of the `games` feature.

