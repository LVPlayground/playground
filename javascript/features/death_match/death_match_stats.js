// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

export class DeathMatchStats {
    kills = 0;
    deaths = 0;

    damage = 0;

    bulletsHit = 0;
    bulletsMissed = 0;

    get kdRatio() { return this.deaths === 0 ? this.kills : Math.round(this.kills / this.deaths * 100) / 100; }

    get accuracyPercentage() {
        const bulletsShot = this.bulletsHit + this.bulletsMissed;
        return bulletsShot === 0 ? 100 : Math.round((this.bulletsHit / bulletsShot * 100));
    }
}