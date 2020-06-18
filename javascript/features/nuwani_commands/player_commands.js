// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { CommandBuilder } from 'components/command_manager/command_builder.js';

// Implementation of a series of commands that allow interaction with the state of in-game players,
// change their status, find them, and so on.
export class PlayerCommands {
    commandManager_ = null;

    checksumAddress_ = null;
    checksumPending_ = null;
    checksumResolver_ = null;
    checksumResponses_ = null;

    constructor(commandManager) {
        this.commandManager_ = commandManager;

        // !checksum [address] [offset] [bytes]
        this.commandManager_.buildCommand('checksum')
            .restrict(Player.LEVEL_MANAGEMENT)
            .parameters([
                { name: 'address', type: CommandBuilder.NUMBER_PARAMETER },
                { name: 'offset', type: CommandBuilder.NUMBER_PARAMETER },
                { name: 'bytes', type: CommandBuilder.NUMBER_PARAMETER }
            ])
            .build(PlayerCommands.prototype.onChecksumCommand.bind(this));

        // !getid [nickname]
        this.commandManager_.buildCommand('getid')
            .parameters([{ name: 'nickname', type: CommandBuilder.PLAYER_PARAMETER }])
            .build(PlayerCommands.prototype.onGetPlayerCommand.bind(this));

        // !getname [id]
        this.commandManager_.buildCommand('getname')
            .parameters([{ name: 'id', type: CommandBuilder.PLAYER_PARAMETER }])
            .build(PlayerCommands.prototype.onGetPlayerCommand.bind(this));
    }

    // !checksum [address] [offset] [bytes]
    //
    // Requests all online players to send a checksum of the given memory area. The command will
    // reply after all players have replied, or a set timeout has expired.
    onChecksumCommand(context, address, offset, bytes) {
        this.checksumAddress_ = address;
        this.checksumResponses_ = new Map();

        // Request all online players to send a checksum of the memory area.
        for (const player of server.playerManager) {
            if (player.isNonPlayerCharacter())
                continue;

            pawnInvoke('SendClientCheck', 'iiiii', player.id, /* type */ 5, address, offset, bytes);
            this.checksumResponses_.set(player, null);
        }

        // If no requests were sent, tell the |context| about this immediately.
        if (!this.checksumResponses_.size) {
            context.respond('4Error: There are no players available to request checksums from.');
            return;
        }

        this.checksumPending_ = this.checksumResponses_.size;

        // Create a resolver that, once resolved, will send the response for the current request.
        new Promise((resolve) => this.checksumResolver_ = resolve).then(() => {
            this.sendChecksumResponse(context);
        });
        
        // Wait for five seconds. If not everybody replied by then, we'll send the response anyway.
        wait(5000).then(() => {
            if (!this.checksumResolver_)
                return;  // all responses were obtained
            
            this.checksumResolver_();
            this.checksumResolver_ = null;
        });
    }

    // Called when a player has sent a response for a checksum request.
    onChecksumResponse(event) {
        const player = server.playerManager.getById(event.playerid);
        if (!player)
            return;  // the |event| was received for a player who has since disconnected
        
        if (event.address !== this.checksumAddress_)
            return;  // the |event| was received for a different request
        
        this.checksumResponses_.set(player, event.checksum);
        this.checksumPending_--;

        if (this.checksumPending_ > 0)
            return;  // we're still waiting on further answers for the request
        
        this.checksumResolver_();
        this.checksumResolver_ = null;
    }

    // Shares the results of a checksum request with the |context|.
    sendChecksumResponse(context) {
        const checksums = new Map();

        for (let [ player, checksum ] of this.checksumResponses_) {
            if (!checksum)
                checksum = 'no response';

            if (!checksums.has(checksum))
                checksums.set(checksum, new Set([ player ]));
            else
                checksums.get(checksum).add(player);
        }

        // Transform the |checksums| in an array, sorted by frequency of response.
        const results = [ ...checksums ].sort((lhs, rhs) => {
            if (typeof lhs[0] === 'string')
                return -1;  // 'no response' case
            
            if (lhs[1].size === rhs[1].size)
                return lhs[0] > rhs[0] ? 1 : -1;
            
            return lhs[1].size > rhs[1].size ? -1 : 1;
        });

        // Compose the message.
        const response = [];

        for (const [ checksum, players ] of results) {
            let message = String(checksum) + ' 14(' + players.size + ' player';
            if (players.size != 1)
                message + 's';
            
            if (players.size <= 3)
                message += ': ' + [ ...players ].map(player => player.name).join(', ');
            
            message += ')';

            response.push(message);
        }

        context.respond('5Result: ' + response.join(', '));

        this.checksumAddress_ = null;
        this.checksumPending_ = null;
        this.checksumResolver_ = null;
        this.checksumResponses_ = null;
    }

    // !getid [nickname]
    // !getname [id]
    //
    // Finds a specific player by either their nickname or assigned player Id. Both commands will
    // share an identical output, so we only have to implement this once.
    onGetPlayerCommand(context, player) {
        context.respond(`10*** 05${player.name} (Id:${player.id})`);
    }

    dispose() {
        this.commandManager_.removeCommand('getname');
        this.commandManager_.removeCommand('getid');
        this.commandManager_.removeCommand('checksum');
    }
}
