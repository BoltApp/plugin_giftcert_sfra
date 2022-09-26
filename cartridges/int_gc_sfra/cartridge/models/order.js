'use strict';

/**
 * This model extends the default order model, adding a gift card resource data for display in JS/ajax logic.
 */

var Resource = require('dw/web/Resource');

/**
 * Override for customization of order object, adding custom logic.
 * @param {Object} lineItemContainer Line item container used in the construction of the parent order model
 * @param {Object} options Options used in the construction of the parent order model
 * @returns {module.superModule} Custom order model
 */
function customOrder(lineItemContainer, options) {
    var ParentOrder = module.superModule;
    var order = new ParentOrder(lineItemContainer, options);

    Object.defineProperty(order.resources, 'giftCardTypeLabel', {
        value: Resource.msg('label.giftCardType', 'checkout', null),
        writable: false,
        enumerable: true
    });

    var customMessages = (typeof options !== 'undefined') && (typeof options.cardMessages !== 'undefined') ? options.cardMessages : [];
    Object.defineProperty(order, 'customLoyaltyMessages', {
        value: customMessages,
        writable: true,
        enumerable: true
    });

    return order;
}

module.exports = customOrder;
