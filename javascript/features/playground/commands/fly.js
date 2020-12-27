// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { Command } from 'features/playground/command.js';
import { CommandBuilder } from 'components/commands/command_builder.js';
import { ScopedCallbacks } from 'base/scoped_callbacks.js';

// How many frames per second should be checked for directionality updates?
const kFramesPerSecond = 20;

// Command: /fly [player]?
export default class FlyCommand extends Command {
    constructor(...args) {
        super(...args);

        // Map containing all the players who are currently flying, and whether they should continue
        // to fly (typing /fly on a player twice will stop them from flying further).
        this.flying_ = new Map();

        // Listen to onPlayerDeath events in case a flying player dies.
        this.callbacks_ = new ScopedCallbacks();
        this.callbacks_.addEventListener(
            'playerspawn', FlyCommand.prototype.stopFlight.bind(this));
        this.callbacks_.addEventListener(
            'playerdeath', FlyCommand.prototype.stopFlight.bind(this));
    }

    get name() { return 'fly'; }
    get defaultPlayerLevel() { return Player.LEVEL_MANAGEMENT; }
    get description() { return `Fly around in the world of San Andreas.`; }

    build(commandBuilder) {
        commandBuilder
            .parameters([
                { name: 'target', type: CommandBuilder.kTypePlayer, optional: true }
            ])
            .build(FlyCommand.prototype.onFlyCommand.bind(this));
    }

    async onFlyCommand(player, target) {
        const subject = target || player;
        const name = subject === player ? 'You' : subject.name;

        if (this.flying_.has(subject)) {
            this.flying_.set(subject, false);

            player.sendMessage(Message.COMMAND_SUCCESS, name + ' will momentarily stop flying.');
            return;
        }

        if (subject.interiorId != 0 && !player.isManagement()) {
            player.sendMessage(Message.COMMAND_ERROR, name + ' is currently in an interior, ' +
                               'but you can only fly outside!');
            return;
        }

        if(subject.virtualWorld != 0 && !player.isManagement()) {
            player.sendMessage(Message.COMMAND_ERROR, name + ' are currently not in the mainworld, ' +
                               'flying is only possible over there!');
            return;
        }

        if (subject === player)
            player.sendMessage(Message.COMMAND_SUCCESS, 'You are about to take off, enjoy!');
        else
            player.sendMessage(Message.COMMAND_SUCCESS, name + ' is about to take off.');

        this.flying_.set(subject, true);

        subject.position = subject.position.translate({ z: 5 });

        this.applyFlightAnimation(subject, false /* moving */);

        let velocityFactor = 1;
        while (this.flying_.get(subject) && subject.isConnected()) {
            const keys = this.getPlayerKeys(subject);

            let cameraFrontVector = null;

            let velocityX = 0;
            let velocityY = 0;
            let velocityZ = 0;

            // Move forward.
            if (keys.up) {
                cameraFrontVector = subject.cameraFrontVector;

                velocityX = 0.05 + cameraFrontVector.x;
                velocityY = 0.05 + cameraFrontVector.y;
            }

            // Speed up.
            if (keys.sprint)
                velocityFactor += 0.25;

            // Slow down.
            if (keys.jump)
                velocityFactor = Math.max(0.25, velocityFactor - 0.25);

            // Go up, go down, or remain stationary.
            if (keys.fire)
                velocityZ = 0.5;
            else if (keys.aim)
                velocityZ = -0.3;
            else
                velocityZ = 0.0152 / velocityFactor;

            subject.velocity = new Vector(velocityX * velocityFactor,
                                          velocityY * velocityFactor,
                                          velocityZ * velocityFactor);

            const moving = Math.abs(velocityX) > 0.01 || Math.abs(velocityY) > 0.01;
            if (moving) {
                cameraFrontVector = cameraFrontVector || subject.cameraFrontVector;

                const position = subject.position;
                const targetPosition = subject.cameraPosition.translate({
                    x: 522.48 * cameraFrontVector.x,
                    y: 522.48 * cameraFrontVector.y
                });

                let rotation = Math.abs(Math.atan((targetPosition.y - position.y) /
                                                  (targetPosition.x - position.x)) * 180 / Math.PI);

                if (targetPosition.x <= position.x && targetPosition.y >= position.y)
                    rotation = 180 - rotation;
                else if (targetPosition.x < position.x && targetPosition.y < position.y)
                    rotation = 180 + rotation;
                else if (targetPosition.x >= position.x && targetPosition.y <= position.y)
                    rotation = 360 - rotation;

                subject.rotation = (rotation - 90) % 360;
            }

            // Update the animation with whatever is most recent for the player.
            this.applyFlightAnimation(subject, moving);

            await wait(1000 / kFramesPerSecond);
        }

        this.flying_.delete(subject);

        if (!subject.isConnected())
            return;

        // Nudge them to reset any animations and make sure they can control themselves again.
        subject.position = subject.position.translate({ z: 0.1 });
    }

    // Applies the appropriate animation to the |player|  for their current state of flight.
    applyFlightAnimation(player, moving) {
        const animationIndex = player.animationIndex;

        let animationName = null;
        if (!moving && animationIndex != 978 /* PARA_steerR */)
            animationName = 'PARA_steerR';
        else if (moving && animationIndex != 959 /* FALL_SkyDive_Accel */)
            animationName = 'FALL_SkyDive_Accel';

        if (!animationName)
            return;

        player.animate({
            library: 'PARACHUTE',
            name: animationName,
            loop: true,
            lock: true,
            freeze: true,
            forceSync: true
        });
    }

    // Utility function to get a labelled version of the keys the player is pressing.
    getPlayerKeys(player) {
        const [keys, updown, leftright] = pawnInvoke('GetPlayerKeys', 'iIII', player.id);

        return {
            aim: keys & 128 /* KEY_AIM */,
            crouch: keys & 2 /* KEY_CROUCH */,
            fire: keys & 4 /* KEY_JUMP */,
            jump: keys & 32 /* SNEAK_ABOUT */,
            sprint: keys & 8 /* PED_SPRINT */,

            up: updown === -128 /* KEY_UP */,
            down: updown === 128 /* KEY_DOWN */,
            left: leftright === -128 /* KEY_LEFT */,
            right: leftright === 128 /* KEY_RIGHT */
        };
    }

    // Called when a player respawns or dies. They have to stop flying in these situations.
    stopFlight(event) {
        const player = server.playerManager.getById(event.playerid);
        if (!player || !this.flying_.has(player))
            return;  // invalid player, or not currently flying

        // Make them stop flying on the next iteration.
        this.flying_.set(player, false);
    }

    dispose() {
        this.callbacks_.dispose();
        this.callbacks_ = null;
    }
}
