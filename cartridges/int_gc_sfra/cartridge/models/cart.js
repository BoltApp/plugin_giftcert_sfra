'use strict';

/**
 * This model extends the default cart model, adding a gift card items for display in the cart area.
 */

var Logger = dw.system.Logger.getLogger('GC');
var formatMoney = require('dw/util/StringUtils').formatMoney;
var URLUtils = require('dw/web/URLUtils');
var Resource = require('dw/web/Resource');

/**
 * Override for customization of cart object, adding custom logic.
 * @param {Object} basket Basket for which we should create a cart model
 * @returns {module.superModule|{actionUrls}} Custom cart model with additional property
 */
function customCart(basket) {
    var ParentCart = module.superModule;
    var cart = new ParentCart(basket);

    if (basket !== null) {
        var giftCertificates = basket.getGiftCertificateLineItems();
        if (giftCertificates.length > 0) {
            Logger.debug('Showing ' + giftCertificates.length + ' gift certificates in cart');
            cart.numItems += giftCertificates.length;
            cart.resources.numberOfItems = Resource.msgf('label.number.items.in.cart', 'cart', null, cart.numItems);
            cart.resources.minicartCountOfItems = Resource.msgf('minicart.count', 'common', null, cart.numItems);

            var iterator = giftCertificates.iterator();
            while (iterator.hasNext()) {
                var giftCertificate = iterator.next();
                var price = giftCertificate.basePrice.valueOrNull;
                cart.items.push({
                    UUID: giftCertificate.UUID,
                    productType: 'giftCertificate',
                    giftCertificate: true, // This indicates we should use the custom item card
                    isBonusProductLineItem: false,
                    productName: 'Gift Card Purchase',
                    price: price,
                    priceTotal: {
                        price: formatMoney(giftCertificate.basePrice)
                    },
                    pid: -1, // This is the product ID, but gift cards are not products
                    senderName: giftCertificate.senderName,
                    recipientName: giftCertificate.recipientName,
                    recipientEmail: giftCertificate.recipientEmail
                });
            }
        }
    }

    if (cart && cart.actionUrls) {
        Object.defineProperty(cart.actionUrls, 'removeGiftCertificateLineItem', {
            value: URLUtils.url('Cart-RemoveGiftCertificateLineItem').toString(),
            writable: false,
            enumerable: true
        });
    }

    return cart;
}

module.exports = customCart;
