# Player Colors
Determining which colour will be assigned to a player is not an entirely straightforward task. It's
decided based on a hierarchy of needs:

  1. Base colour assigned based on their ID,
  1. Base colour assigned based on their level, when applicable,
  1. Custom colour that the player is able to pick themselves,
  1. Custom colour based on the gang that the player is part of, if they choose to use this,
  1. Custom colour applied based on their activity, e.g. while playing a minigame.

Some of these have additional complexities, for example because players can decide that they don't
want to use their gang's colour at all.

## Updating a player's color
Features are free to update colours through the `Player.prototype.colors` supplement, which has been
implemented by the [PlayerColorsSupplement](player_colors_supplement.js) class. Examples include:

### Usage for Games
```javascript
class MyGame extends Game {
    async onPlayerAdded(player) {
        player.colors.gameColor = Color.fromRGBA(255, 0, 0, 170);
    }

    async onPlayerRemoved(player) {
        player.colors.gameColor = null;
    }
}
```

### Usage from Pawn
```
stock StartGame() {
    SetPlayerGameColor(playerId, COLOR_RED);
}

stock StopGame() {
    ReleasePlayerGameColor(playerId);
}
```
