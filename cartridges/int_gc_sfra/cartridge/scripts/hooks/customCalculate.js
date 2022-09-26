'use strict';

var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');

/**
 * Check if there have been any updates that would require a pending Clutch checkout setup to be invalidated.
 *
 * @param {Object} basket The basket to be calculated
 */
exports.calculate = function (basket) {
    // Update payment methods, to ensure gift card payments get reduced as needed
    COHelpers.calculatePaymentTransaction(basket);
};
