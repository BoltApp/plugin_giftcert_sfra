'use strict';

var scrollAnimate = require('./components/scrollAnimate');
var formHelpers = require('./formErrors');

/**
 * Create an alert to display the error message
 * @param {Object} message - Error message to display
 */
function createErrorNotification(message) {
    var errorHtml = '<div class="alert alert-danger alert-dismissible valid-cart-error ' +
        'fade show" role="alert">' +
        '<button type="button" class="close" data-dismiss="alert" aria-label="Close">' +
        '<span aria-hidden="true">&times;</span>' +
        '</button>' + message + '</div>';

    $('.giftcard-error').append(errorHtml);
    scrollAnimate($('.giftcard-error'));
}

/**
 * Handle gift card payment instrument removal.
 *
 * @param {Object} e event
 * @returns {boolean} false
 */
function handleGiftCardRemove(e) {
    e.preventDefault();

    var link = $(this);
    var url = link.attr('href');

    var form = $('form#gift-card-form');
    form.spinner().start();
    $.ajax({
        url: url,
        type: 'get',
        dataType: 'json'
    })
        .done(function (response) {
            if (response.error) {
                if (response.serverErrors && response.serverErrors.length) {
                    $.each(response.serverErrors, function (index, element) {
                        createErrorNotification(element);
                    });
                }
            } else {
                link.parents('.giftcard-payment-instrument').remove();
            }

            var paymentMethodSection = $('#dwfrm_billing fieldset .payment-information').parent();
            if (response.remainingPaymentAmount > 0) {
                // The order still needs to be paid for with other payment methods
                paymentMethodSection.removeClass('d-none');
                var paymentMethod = $('.payment-information').data('payment-method-id');
                var previousPaymentMethod = $('.payment-information').data('clutch-previous-payment-method-id');
                if (paymentMethod === 'GIFT_CERTIFICATE' && previousPaymentMethod) {
                    $('.payment-information').data('clutch-previous-payment-method-id', '');
                    $('.payment-information').data('payment-method-id', previousPaymentMethod);
                }
            } else {
                // Hide the regular payment method section, gift card payments covered the entire transaction
                paymentMethodSection.removeClass('d-none').addClass('d-none');
                var oldPaymentMethod = $('.payment-information').data('payment-method-id');
                if (oldPaymentMethod !== 'GIFT_CERTIFICATE') {
                    // There is an existing payment method
                    $('.payment-information').data('clutch-previous-payment-method-id', oldPaymentMethod);
                    $('.payment-information').data('payment-method-id', 'GIFT_CERTIFICATE');
                }
            }

            form.spinner().stop();
        })
        .fail(function (err) {
            if (err.responseJSON.redirectUrl) {
                window.location.href = err.responseJSON.redirectUrl;
            }
            form.spinner().stop();
        });
    return false;
}

/**
 * Handle the form submit or button click
 * @param {Object} e event
 * @returns {boolean} false
 */
function handleGiftCardSubmit(e) {
    e.preventDefault();
    var form = $('form#gift-card-form');
    // Add the gift card to the checkout
    var data = $(form).serialize();
    var url = $(form).attr('action');
    if (typeof grecaptcha !== 'undefined') {
        grecaptcha.reset();
    }

    form.spinner().start();
    $.ajax({
        url: url,
        type: 'post',
        dataType: 'json',
        data: data
    })
        .done(function (response) {
            formHelpers.clearPreviousErrors(form);
            if (response.error) {
                if (response.fieldErrors && response.fieldErrors.length) {
                    response.fieldErrors.forEach(function (error) {
                        if (Object.keys(error).length) {
                            formHelpers.loadFormErrors(form, error);
                        }
                    });
                } else if (response.serverErrors && response.serverErrors.length) {
                    $.each(response.serverErrors, function (index, element) {
                        createErrorNotification(element);
                    });
                }
            } else {
                $('#gift-payment-methods').replaceWith(response.renderedPaymentInstruments);
                $('.remove-giftcard-paymentinstrument').on('click', handleGiftCardRemove);
            }

            // Clear the form
            form.find('#giftCertID').val('');
            form.find('#giftCertPin').val('');

            var paymentMethodSection = $('#dwfrm_billing fieldset .payment-information').parent();
            if (response.remainingPaymentAmount > 0) {
                // The order still needs to be paid for with other payment methods
                paymentMethodSection.removeClass('d-none');
                var paymentMethod = $('.payment-information').data('payment-method-id');
                var previousPaymentMethod = $('.payment-information').data('clutch-previous-payment-method-id');
                if (paymentMethod === 'GIFT_CERTIFICATE' && previousPaymentMethod) {
                    $('.payment-information').data('clutch-previous-payment-method-id', '');
                    $('.payment-information').data('payment-method-id', previousPaymentMethod);
                }
            } else {
                // Hide the regular payment method section, gift card payments covered the entire transaction
                paymentMethodSection.removeClass('d-none').addClass('d-none');
                var oldPaymentMethod = $('.payment-information').data('payment-method-id');
                if (oldPaymentMethod !== 'GIFT_CERTIFICATE') {
                    // There is an existing payment method
                    $('.payment-information').data('clutch-previous-payment-method-id', oldPaymentMethod);
                    $('.payment-information').data('payment-method-id', 'GIFT_CERTIFICATE');
                }
            }

            form.spinner().stop();
        })
        .fail(function (err) {
            if (err.responseJSON.redirectUrl) {
                window.location.href = err.responseJSON.redirectUrl;
            }
            form.spinner().stop();
        });
    return false;
}

/**
 * Updates the payment information in checkout, based on the supplied order model
 * NOTE: Based on logic from cartridges/app_storefront_base/cartridge/client/default/js/checkout/billing.js
 *
 * @param {Object} order - checkout model to use as basis of new truth
 */
function updatePaymentInformation(order) {
    // update payment details
    var $paymentSummary = $('.payment-details');
    var htmlToAppend = '';

    if (order.billing.payment && order.billing.payment.selectedPaymentInstruments
        && order.billing.payment.selectedPaymentInstruments.length > 0) {
        for (var i = 0; i < order.billing.payment.selectedPaymentInstruments.length; i++) {
            var paymentInstrument = order.billing.payment.selectedPaymentInstruments[i];
            if (paymentInstrument.paymentMethod === 'GIFT_CERTIFICATE') {
                // Render a gift card payment instrument
                htmlToAppend += '<span> ' + order.resources.giftCardTypeLabel
                    + '</span><div>'
                    + paymentInstrument.maskedGiftCertificateCode
                    + '</div><div><span>'
                    + '</span></div>';
            } else {
                // Assume the existing logic (always use CC) works here
                htmlToAppend += '<span> ' + order.resources.cardType + ' '
                    + paymentInstrument.type
                    + '</span><div>'
                    + paymentInstrument.maskedCreditCardNumber
                    + '</div><div><span>'
                    + order.resources.cardEnding + ' '
                    + paymentInstrument.expirationMonth
                    + '/' + paymentInstrument.expirationYear
                    + '</span></div>';
            }
        }
    }

    $paymentSummary.empty().append(htmlToAppend);
}

$(document).ready(function () {
    $('#gift-card-form').on('submit', handleGiftCardSubmit);
    $('#add-gift-card-btn').on('click', handleGiftCardSubmit);
    $('.remove-giftcard-paymentinstrument').on('click', handleGiftCardRemove);
    $('body').on('checkout:updateCheckoutView', function (e, data) {
        updatePaymentInformation(data.order, data.options);
    });
    $('body').on('checkout:updateRenderedPaymentInstruments', function (e, data) {
        $('#gift-payment-methods').replaceWith(data.renderedPaymentInstruments);
        $('.remove-giftcard-paymentinstrument').on('click', handleGiftCardRemove);
    });
});
