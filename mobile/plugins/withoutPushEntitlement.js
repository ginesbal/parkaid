// Parking reminders are local notifications, scheduled on the phone — no
// push service involved. expo-notifications' config plugin still adds the
// APNs (push) entitlement by default, which a free Apple developer account
// can't sign, so building to a real iPhone would fail. Remove it.
//
// List this BEFORE "expo-notifications" in app.config.js. Each plugin's change
// runs before the ones registered earlier, so the first plugin in the list
// applies last — and gets the final say on the entitlements.
const { withEntitlementsPlist } = require('expo/config-plugins');

module.exports = function withoutPushEntitlement(config) {
    return withEntitlementsPlist(config, (config) => {
        delete config.modResults['aps-environment'];
        return config;
    });
};
