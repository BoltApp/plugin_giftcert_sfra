'use strict';

var server = require('server');    // the server module is used by all controllers
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
var formErrors = require('*/cartridge/scripts/formErrors');

var Logger = dw.system.Logger.getLogger('GC');

server.get('Purchase',
    server.middleware.https,
    csrfProtection.generateToken,
    consentTracking.consent,
    function (req, res, next) {
        var gcOrderForm = server.forms.getForm('gcorder');
        gcOrderForm.clear();
        res.render('giftcards/giftCardOrder', {
            gcOrderForm: gcOrderForm
        });
        next();
    }
);

/**
 * Remove a gift card payment instrument from a basket.
 * @param {Object} basket Basket object from which to remove the gift card payment instrument
 * @param {Object} giftCard The gift card payment instrument to remove
 */
function removePaymentInstrument(basket, giftCard) {
    var Transaction = require('dw/system/Transaction');
    var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');
    Transaction.wrap(function () {
        basket.removePaymentInstrument(giftCard);
        basketCalculationHelpers.calculateTotals(basket);
    });
}

server.post('PurchaseResult',
    server.middleware.https,
    csrfProtection.generateToken,
    csrfProtection.validateRequest,
    consentTracking.consent,
    function (req, res, next) {

        var BasketMgr = require('dw/order/BasketMgr');
        var Transaction = require('dw/system/Transaction');
        var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
        // Unrelated: var giftCerts = basket.getGiftCertificatePaymentInstruments();
        // Maybe related: cart.object.getGiftCertificateLineItems()

        // SFRA mention: https://github.com/SalesforceCommerceCloud/storefront-reference-architecture/blob/master/cartridges/app_storefront_base/cartridge/scripts/hooks/cart/calculate.js#L184-L190
        // Uses: var giftCertificates = basket.getGiftCertificateLineItems().iterator()

        var gcOrderForm = server.forms.getForm('gcorder');
        var gcOrderFormErrors = formErrors.getFormErrors(gcOrderForm);
        if (Object.keys(gcOrderFormErrors).length > 0) {
            Logger.debug('Purchase form errors');
            // errors in the user supplied data
            res.render('giftcards/giftCardOrder', {
                gcOrderForm: gcOrderForm
            });
            next();
            return;
        }

        var value = parseInt(gcOrderForm.amount.value, 10);
        var currentBasket = BasketMgr.getCurrentOrNewBasket();

        // Before actually adding the gift card line item, make sure to remove any gift card payment methods that might have been applied already
        if (currentBasket.getGiftCertificatePaymentInstruments().length > 0) {
            var giftPayments = currentBasket.getGiftCertificatePaymentInstruments().iterator();
            while (giftPayments.hasNext()) {
                var giftCard = giftPayments.next();
                removePaymentInstrument(currentBasket, giftCard);
            }
            // Re-calculate the payments.
            COHelpers.calculatePaymentTransaction(
                currentBasket
            );
        }

        // continue and create the gift certificate line item
        Transaction.wrap(function () {
            var giftCertLineItem = currentBasket.createGiftCertificateLineItem(value, gcOrderForm.recipientEmail.value);
            giftCertLineItem.setMessage(gcOrderForm.message.value);
            giftCertLineItem.setRecipientName(gcOrderForm.recipient.value);
            giftCertLineItem.setSenderName(gcOrderForm.from.value);
        });

        // success
        var URLUtils = require('dw/web/URLUtils');
        res.redirect(URLUtils.url('Cart-Show'));
        next();
    }
);


module.exports = server.exports();
