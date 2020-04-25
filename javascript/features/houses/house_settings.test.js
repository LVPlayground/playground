
import HouseSettings from 'features/houses/house_settings.js';

describe('HouseSettings', (it, beforeEach, afterEach) => {
    
    it('should map access to unknown if it is not a known access', async(assert) => {
        const access = 4;
        var readableAccess = HouseSettings.getReadableAccess(access);

        assert.equal(readableAccess, 'unknown');
    });
    
    it('should map access to everybody if access is set to ACCESS_EVERYBODY', async(assert) => {
        const access = HouseSettings.ACCESS_EVERYBODY;
        var readableAccess = HouseSettings.getReadableAccess(access);

        assert.equal(readableAccess, 'everybody');
    });
    
    it('should map access to everybody if access is set to ACCESS_FRIENDS_AND_GANG', async(assert) => {
        const access = HouseSettings.ACCESS_FRIENDS_AND_GANG;
        var readableAccess = HouseSettings.getReadableAccess(access);

        assert.equal(readableAccess, 'friends and gang');
    });
    
    it('should map access to everybody if access is set to ACCESS_FRIENDS', async(assert) => {
        const access = HouseSettings.ACCESS_FRIENDS;
        var readableAccess = HouseSettings.getReadableAccess(access);

        assert.equal(readableAccess, 'friends');
    });
    
    it('should map access to everybody if access is set to ACCESS_PERSONAL', async(assert) => {
        const access = HouseSettings.ACCESS_PERSONAL;
        var readableAccess = HouseSettings.getReadableAccess(access);

        assert.equal(readableAccess, 'personal');
    });
});