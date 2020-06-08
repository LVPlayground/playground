// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

export class DeathMatchStats {
    constructor() {
        this.kills_ = 0;
        this.deaths_ = 0;
        this.damage_ = 0;

        this.bulletsHit_ = 0;
        this.bulletsMissed_ = 0;
    }

    get kills() { return this.kills_; }
    get deaths() { return this.deaths_; }
    get kdRatio() { return this.deaths === 0 ? this.kills : Math.round(this.kills / this.deaths * 100) / 100; }
    get damage() { return this.damage_; }
    get bulletsHit() { return this.bulletsHit_; }
    get bulletsMissed() { return this.bulletsMissed_; }
    get accuracy() {
        const bulletsShot = this.bulletsHit + this.bulletsMissed;
        return bulletsShot === 0 ? 100 : Math.round((this.bulletsHit / bulletsShot * 100));
    }

    addKill() { this.kills_++; }
    addDeath() { this.deaths_++ }
    addDamage(damage) { this.damage_ += damage; }
    addBulletHit() { this.bulletsHit_++ }
    addBulletMissed() { this.bulletsMissed_++ }

}