'use strict';

/**
 * NOTE: This is mostly a copy of the existing validateBasket.js file, except it also adds a check for presence of gift cards
 */

var Resource = require('dw/web/Resource');
var validationHelpers = require('*/cartridge/scripts/helpers/basketValidationHelpers');

/**
 * validates the current users basket
 * @param {dw.order.Basket} basket - The current user's basket
 * @param {boolean} validateTax - boolean that determines whether or not to validate taxes
 * @returns {Object} an error object
 */
function validateBasket(basket, validateTax) {
    var result = { error: false, message: null };

    if (!basket) {
        result.error = true;
        result.message = Resource.msg('error.cart.expired', 'cart', null);
    } else {
        var productExistence = validationHelpers.validateProducts(basket);
        var validCoupons = validationHelpers.validateCoupons(basket);
        var totalTax = true;

        if (validateTax) {
            totalTax = basket.totalTax.available;
        }

        if (productExistence.error || !productExistence.hasInventory) {
            result.error = true;
            result.message = Resource.msg('error.cart.or.checkout.error', 'cart', null);
        } else if (validCoupons.error) {
            result.error = true;
            result.message = Resource.msg('error.invalid.coupon', 'cart', null);
        } else if (basket.productLineItems.getLength() === 0 && basket.getGiftCertificateLineItems().getLength() === 0) { // Clutch customization: also checking gift certicates structure
            result.error = true;
        } else if (!basket.merchandizeTotalPrice.available) {
            result.error = true;
            result.message = Resource.msg('error.cart.or.checkout.error', 'cart', null);
        } else if (!totalTax) {
            result.error = true;
            result.message = Resource.msg('error.invalid.tax', 'cart', null);
        }
    }

    return result;
}

exports.validateBasket = validateBasket;
