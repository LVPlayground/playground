// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Time after which we consider a memory read to have timed out.
export const kMemoryReadTimeoutMs = 3500;

// Manages the SAMPCAC detectors that are available on the server. Will load its information from
// a configuration file, unless tests are active, in which case they can be injected.
export class DetectorManager {
    natives_ = null;
    responseResolvers_ = null;

    constructor(natives) {
        this.natives_ = natives;
        this.responseResolvers_ = new Map();

        server.playerManager.addObserver(this);
    }

    // ---------------------------------------------------------------------------------------------

    // Requests a memory read from the |player| at the given |address| (in GTA_SA.exe address space)
    // for the given number of |bytes|. Returns either a number, a Uint8Array, or NULL When failed.
    async requestMemoryRead(player, address, bytes) {
        if (!this.responseResolvers_.has(player))
            this.responseResolvers_.set(player, new Map());

        const resolvers = this.responseResolvers_.get(player);
        const request = resolvers.get(address);

        // If |request| is already live, then another request for the |address| is in flight. We
        // piggy back on that request rather than issuing a new one here.
        if (request) return request.promise;

        // Create a unique |token| to avoid race conditions in subsequent requests.
        let token = Symbol('resolver token');
        let resolver = null;

        const promise = new Promise(async (resolve) => {
            resolver = resolve;

            // Wait for the configured |kMemoryReadTimeoutMs|, after which we'll resolve the request
            // with NULL, as the |player| has not provided us with an answer.
            await wait(kMemoryReadTimeoutMs);

            // Verify that the |token| is still actual to avoid overriding another request.
            if (resolvers.has(address) && resolvers.get(address).token === token)
                resolvers.get(address).resolver(/* result= */ null);
        });

        resolvers.set(address, { promise, resolver, token });

        // Request a checksum for GTA_SA.exe's .text section as the contents are well known, so we
        // don't need the granularity and can reduce the data being transfered.
        address < 0x856A00 ? this.natives_.readMemoryChecksum(player, address, bytes)
                           : this.natives_.readMemory(player, address, bytes);

        const result = await promise;
        
        // Delete the |address| request from the resolvers, and clean up the entire map in cache
        // when there are no further requests in flight for the |player|.
        resolvers.delete(address);

        if (!resolvers.size)
            this.responseResolvers_.delete(player);

        // Now simply return the |result|, and we're done.
        return result;
    }

    // ---------------------------------------------------------------------------------------------

    // Called when the |response| has been received from the |player|, following a read request for
    // the given |address|. When known, the Promise waiting for the response will be settled.
    onMemoryResponse(player, address, response) {
        if (!this.responseResolvers_.has(player))
            return;  // the |player| does not have any pending requests
        
        const resolvers = this.responseResolvers_.get(player);
        if (!resolvers.has(address))
            return;  // the |player| does not have any pending requests for the |address|
        
        // Resolve the appropriate resolver with the |response|.
        resolvers.get(address).resolver(response);
    }

    // Called when the |player| is disconnecting from the server. Any in-flight memory requests will
    // immediately be cancelled, as we won't be receiving a response anymore.
    onPlayerDisconnect(player) {
        if (this.responseResolvers_.has(player)) {
            for (const { resolver } of this.responseResolvers_.get(player).values())
                resolver(/* response= */ null);
            
            this.responseResolvers_.delete(player);
        }
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        server.playerManager.removeObserver(this);

        this.responseResolvers_.clear();
    }
}
