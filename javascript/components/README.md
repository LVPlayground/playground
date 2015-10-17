# Components
Components are smaller collections of functionality that translate an in-game concept to a idiomatic
and convenient interface for usage in JavaScript. They avoid much of the limitations and complexity
found in Pawn scripts, due to JavaScript's dynamic nature.

Components should be well documented, and, ideally, tested, given that they provide common
functionality that may be used by several features.

## List of components
The following components are available in Las Venturas Playground.

  - **[Command Manager component](command_manager/)**
    - [CommandManager](command_manager/command_manager.js): Registry and dispatcher of available in-game commands.

  - **[Dialogs component](dialogs/)**
    - [Message](dialogs/message.js): Displays a simple message box to the player.

  - **[Feature Manager component](feature_manager/)**
    - [Feature](feature_manager/feature.js): Base class for all JavaScript-powered features.
    - [FeatureManager](feature_manager/feature_manager.js): Registry for all available features.

  - **[Menu component](menu/)**
    - [Menu](menu/menu.js): Creates either simple or complicated multiple-choice menu dialogs.

