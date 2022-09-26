'use strict';

/**
 * This model extends the default totals model, adding a giftCardTotal property for display in
 * various areas where order totals are displayed.
 */

var formatMoney = require('dw/util/StringUtils').formatMoney;

/**
 * Override for customization of totals object, adding custom logic.
 * @param {Object} lineItemContainer Line item container object used in the construction of a regular totals model
 * @returns {module.superModule} Customized totals model, with the added custom methods
 */
function customTotals(lineItemContainer) {
    var ParentTotals = module.superModule;
    var totals = new ParentTotals(lineItemContainer);

    if (lineItemContainer) {
        var gcTotalPrice = lineItemContainer.getGiftCertificateTotalPrice();

        // Calculate and format the sub total including gift card purchases
        var subTotalWithGiftPurchases = '-';
        var subTotal = lineItemContainer.getAdjustedMerchandizeTotalPrice(false);
        if (subTotal.available) {
            var totalMoney = subTotal;
            if (gcTotalPrice != null) {
                totalMoney = totalMoney.add(gcTotalPrice);
            }
            subTotalWithGiftPurchases = formatMoney(totalMoney);
        }

        Object.defineProperty(totals, 'giftCardTotal', {
            value: {
                value: gcTotalPrice.value,
                formatted: formatMoney(gcTotalPrice)
            },
            writable: false,
            enumerable: true
        });

        totals.subTotal = subTotalWithGiftPurchases;// Update the regular subtotal as well
        Object.defineProperty(totals, 'subTotalWithGiftPurchases', {
            value: subTotalWithGiftPurchases,
            writable: false,
            enumerable: true
        });
        Object.defineProperty(totals, 'subTotalWithoutGiftPurchases', {
            value: formatMoney(subTotal),
            writable: false,
            enumerable: true
        });
    } else {
        Object.defineProperty(totals, 'giftCardTotal', {
            value: {
                value: 0,
                formatted: '0'
            },
            writable: false,
            enumerable: true
        });
        Object.defineProperty(totals, 'subTotalWithGiftPurchases', {
            value: '-',
            writable: false,
            enumerable: true
        });
        Object.defineProperty(totals, 'subTotalWithoutGiftPurchases', {
            value: '-',
            writable: false,
            enumerable: true
        });
    }

    return totals;
}

module.exports = customTotals;
