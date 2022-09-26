'use strict';

var server = require('server');
server.extend(module.superModule);
var Resource = require('dw/web/Resource');

/**
 * Append to the regular MiniCart display, to make sure the correct quantityTotal value is returned
 */
server.append('MiniCart', server.middleware.include, function (req, res, next) {
    var BasketMgr = require('dw/order/BasketMgr');

    var currentBasket = BasketMgr.getCurrentBasket();
    var quantityTotal;

    if (currentBasket) {
        quantityTotal = currentBasket.productQuantityTotal;
        if (currentBasket.giftCertificateLineItems) {
            quantityTotal += currentBasket.giftCertificateLineItems.length;
        }
    } else {
        quantityTotal = 0;
    }

    res.render('/components/header/miniCart', { quantityTotal: quantityTotal });
    next();
});

/**
 * Append the AddProduct route to make sure the right cart totals are returned.
 */
server.append('AddProduct', function (req, res, next) {
    var BasketMgr = require('dw/order/BasketMgr');
    var ProductLineItemsModel = require('*/cartridge/models/productLineItems');

    var currentBasket = BasketMgr.getCurrentBasket();
    var quantityTotal;

    if (currentBasket) {
        quantityTotal = ProductLineItemsModel.getTotalQuantity(currentBasket.productLineItems);
        if (currentBasket.giftCertificateLineItems) {
            quantityTotal += currentBasket.giftCertificateLineItems.length;
        }
    } else {
        quantityTotal = 0;
    }

    var viewData = res.getViewData();
    viewData.quantityTotal = quantityTotal;
    viewData.minicartCountOfItems = Resource.msgf('minicart.count', 'common', null, quantityTotal);

    res.setViewData(viewData);
    next();
});

/**
 * Custom route for removal of gift certificate line items, similar to the method used to remove regular line items.
 */
server.get('RemoveGiftCertificateLineItem', server.middleware.https, function (req, res, next) {
    var BasketMgr = require('dw/order/BasketMgr');
    var Transaction = require('dw/system/Transaction');
    var URLUtils = require('dw/web/URLUtils');
    var CartModel = require('*/cartridge/models/cart');
    var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');

    var currentBasket = BasketMgr.getCurrentBasket();
    if (!currentBasket) {
        res.setStatusCode(500);
        res.json({
            error: true,
            redirectUrl: URLUtils.url('Cart-Show').toString()
        });

        next();
        return;
    }

    var giftCertToRemove = null;

    Transaction.wrap(function () {
        var giftCertificates = currentBasket.getGiftCertificateLineItems().iterator();
        while (giftCertificates.hasNext()) {
            var giftCertificate = giftCertificates.next();
            if (req.querystring.uuid && req.querystring.uuid === giftCertificate.UUID) {
                giftCertToRemove = giftCertificate;
                currentBasket.removeGiftCertificateLineItem(giftCertToRemove);
                break;
            }
        }

        basketCalculationHelpers.calculateTotals(currentBasket);
    });

    if (giftCertToRemove != null) {
        // The gift certificate item to remove was found
        var basketModel = new CartModel(currentBasket);
        var basketModelPlus = {
            basket: basketModel,
            toBeDeletedUUIDs: []
        };
        res.json(basketModelPlus);
    } else {
        res.setStatusCode(500);
        res.json({ errorMessage: Resource.msg('error.cannot.remove.product', 'cart', null) });
    }

    next();
});

module.exports = server.exports();
