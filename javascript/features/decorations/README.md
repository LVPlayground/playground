# Decorations
Manages the various decoration sets that can be enabled on Las Venturas Playground. Each is defined
in a JSON file in the [//data/decorations](../../../data/decorations) directory, added to the top
of [decorations.js](decorations.js), and with a setting in
[setting_list.js](../settings/setting_list.js) to make it controlable during server runtime.

## JSON file format
```json
{
    "objects": [
        { "modelId": 100, "position": [ 0, 0, 0 ], "rotation": [ 0, 0, 0 ] }
    ]
}
```
