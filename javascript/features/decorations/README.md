# Decorations
Manages the various decoration sets that can be enabled on Las Venturas Playground. Each is defined
in a JSON file in the [//data/decorations](../../../data/decorations) directory, added to the top
of [decorations.js](decorations.js), and with a setting in
[setting_list.js](../settings/setting_list.js) to make it controlable during server runtime.

The decoration system currently supports actors, NPCs and objects.

## Actors
We support up to a thousand actors on the server, which will be streamed client-side on player
computers and thus won't cause a significant lag when out of range. Each actor supports a model Id,
position and rotation, and can be animated through an animation object.

```json
{
    "actors": [
        {
            "modelId": 171,
            "position": [ 1600, 1550, 12 ],
            "rotation": 90,
            "animation": {
                "animlib": "RAPPING",
                "animname": "LAUGH_01",
                "delta": 4.1,
                "loop": false,
                "lock": true,
                "freeze": false,
                "time": 0
            }
        }
    ]
}
```

## NPCs
Non-player characters are more advanced Actors that do take up server slots, have their own mode
and following a prerecorded set of keys powering their behaviour. They have a name, script, position
and rotation, and optionally a skin, vehicle and 3D text label.

```json
{
    "npcs": [
        {
            "name": "Gunther",
            "script": "gunther",
            "position": [ 1520, 1850, 10 ],
            "rotation": 90,

            "appearance": {
                "label": {
                    "color": "FFFF00",
                    "text": "Ich bin Gunther"
                },

                "vehicle": {
                    "modelId": 411,
                    "position": [ 1000, 800, 20.5 ],
                    "rotation": 180,
                    "name": "Gunther"
                }
            }
        }
    ]
}
```

## Objects
There is no limit to the amount of objects created on Las Venturas Playground, but excessive numbers
might cause lag for players with poor computers. Each object has a model Id, a position and a
rotation, and optionally an effect which is one of the following:

  * **snow**: Amends the object's textures to that of snow.

```json
{
    "objects": [
        { "modelId": 1225, "position": [ 1500, 2000, 15 ], "rotation": [ 0, 0, 0 ] }
    ]
}
```
