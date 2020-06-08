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

    get kills() { return kills_; }
    get deaths() { return deaths_; }
    get kdRatio() { return Math.round(this.kills / this.deaths * 100) / 100; }
    get damage() { return damage_; }
    get bulletsHit() { return bulletsHit_; }
    get bulletsMissed() { return bulletsMissed_; }
    get accuracy() {
        const bulletsShot = this.bulletsHit + this.bulletsMissed;
        return Math.round((this.bulletsHit / bulletsShot * 100));
    }

    addKill() { kills_++; }
    addDeath() { deaths_++ }
    addDamage(damage) { damage_ += damage; }
    addBulletHit() { bulletsHit_++ }
    addBulletMissed() { this.bulletsMissed_++ }

}