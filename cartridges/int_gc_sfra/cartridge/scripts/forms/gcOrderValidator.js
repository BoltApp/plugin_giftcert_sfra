'use strict';

var Resource = require('dw/web/Resource');
var Logger = dw.system.Logger.getLogger('GC');
var FormElementValidationResult = require('dw/web/FormElementValidationResult');

/**
 * Validates that the provided amount falls within the configured limits.
 *
 * @param {FormField} formField form field to validate
 * @returns {Object} Form element validation result
 */
exports.validateAmount = function (formField) {
    try {
        if (formField.value < 5 || formField.value > 5000) {
            var errorMessage = Resource.msgf('error.amount.outOfRange', 'giftCardOrder', null, 5, 5000);
            // Throw an error, value is outside the allowed limits
            return new FormElementValidationResult(false, errorMessage);
        }
    } catch (e) {
        Logger.error('Error while validating formField ' + formField.getHtmlName(), e);
    }
    return new FormElementValidationResult(true);
};

/**
 * Validates whether the email confirmation values line up.
 *
 * @param {Form} form object to validate
 * @returns {Object} Form element validation result
 */
exports.validateForm = function (form) {
    try {
        if (form.recipientEmail.value.toLowerCase() !== form.confirmRecipientEmail.value.toLowerCase()) {
            var errorMessage = Resource.msg('error.confirmation.mismatch', 'giftCardOrder', 'missing translation');
            // Throw an error, value is outside the allowed limits
            form.confirmRecipientEmail.invalidateFormElement(errorMessage);
        }
    } catch (e) {
        Logger.error('Error while validating form due to ' + e);
    }

    return new FormElementValidationResult(true);
};
