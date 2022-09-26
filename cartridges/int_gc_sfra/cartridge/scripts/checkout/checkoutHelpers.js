'use strict';

/**
 * This model extends the default checkoutHelpers helpers and adds logic to properly set order total amounts.
 */

var Transaction = require('dw/system/Transaction');
var PaymentInstrument = require('dw/order/PaymentInstrument');
var Money = require('dw/value/Money');
var Site = require('dw/system/Site');
var Logger = dw.system.Logger.getLogger('GC');

var ParentModule = module.superModule;

/**
 * Get the order total for a basket that is not paid yet with gift card payment methods
 * This will take [checkout total, with all purchased items + possible gift card purchase] and
 * subtract the total of all gift card payment methods.
 *
 * @param {dw.order.Basket} basket Basket object
 * @returns {number|(function(Object, (Array|string), *=): *)|*} The amount that is left to be paid
 */
function getOrderTotalAfterGiftPayments(basket) {
    var appliedGiftCards = basket.getGiftCertificatePaymentInstruments();
    var paidWithGiftAmount = new Money(0, Site.getCurrent().getDefaultCurrency());
    appliedGiftCards.toArray().forEach(function (x) {
        paidWithGiftAmount = paidWithGiftAmount.add(x.paymentTransaction.amount);
    });
    Logger.debug('Paid {0} with gift cards on this order', paidWithGiftAmount);
    var orderBalance = basket.getTotalGrossPrice().subtract(paidWithGiftAmount);
    return orderBalance;
}

/**
 * Completely remove a gift card payment method, also releasing the Clutch gift card hold.
 * @param {dw.order.Basket} currentBasket Basket from which the gift card payment should be removed
 * @param {dw.order.OrderPaymentInstrument} giftCard Gift card payment instrument to remove
 */
function removeGiftCardPayment(currentBasket, giftCard) {
    var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');
    Transaction.wrap(function () {
        currentBasket.removePaymentInstrument(giftCard);
        basketCalculationHelpers.calculateTotals(currentBasket);
    });
}

ParentModule.calculatePaymentTransaction = function (currentBasket) {
    var result = { error: false };


    try {
        Transaction.wrap(function () {
            var orderTotalAfterGiftPayments = getOrderTotalAfterGiftPayments(currentBasket);
            Logger.debug('Order total after gift payments is {0}', orderTotalAfterGiftPayments);
            if (orderTotalAfterGiftPayments.value < 0) {
                // The gift card payment methods on this order exceed the order total
                var orderTotal = currentBasket.getTotalGrossPrice();// Total amount
                var giftCards = currentBasket.getGiftCertificatePaymentInstruments().iterator();
                while (giftCards.hasNext()) {
                    var giftCard = giftCards.next();
                    if (orderTotal.value <= 0) {
                        // The order doesn't require any more payments, so remove this gift card payment method completely
                        removeGiftCardPayment(currentBasket, giftCard);
                    }

                    if (giftCard.paymentTransaction.amount.value > orderTotal.value) {
                        // This gift card payment exceeds the remaining order total, so set GC payment to remaining order total and remaining order total to $0
                        giftCard.paymentTransaction.setAmount(orderTotal);
                        orderTotal = new Money(0, Site.getCurrent().getDefaultCurrency());
                    } else {
                        // This gift card payment doesn't exceed the remaining order total, so leave it as is
                        // and remove the gift card payment from the remaining order total
                        orderTotal = orderTotal.subtract(giftCard.paymentTransaction.amount);
                    }
                }
                orderTotalAfterGiftPayments = orderTotal;
            }

            var paymentInstruments = currentBasket.getPaymentInstruments().iterator();

            while (paymentInstruments.hasNext()) {
                var paymentInstrument = paymentInstruments.next();
                if (paymentInstrument.paymentMethod !== PaymentInstrument.METHOD_GIFT_CERTIFICATE) {
                    paymentInstrument.paymentTransaction.setAmount(orderTotalAfterGiftPayments);

                    // Set this to 0 money, so any other subsequent non-gift payment methods get set to 0
                    orderTotalAfterGiftPayments = new Money(0, Site.getCurrent().getDefaultCurrency());
                }
            }
        });
    } catch (e) {
        result.error = true;
        Logger.error('Error while calculating transaction {0}', e.message);
    }

    return result;
};

module.exports = ParentModule;
