// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Interface for an observer that can be passed when creating a minigame category, that will be
// informed about all created, started and finished minigames within the category.
class MinigameObserver {
    // Will be called when the |minigame| has been created.
    onMinigameCreated(minigame) {}

    // Will be called when the |minigame| has finished.
    onMinigameFinished(minigame) {}
}

exports = MinigameObserver;
