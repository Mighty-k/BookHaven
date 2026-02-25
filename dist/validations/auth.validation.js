"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailValidation = exports.resetPasswordValidation = exports.changePasswordValidation = exports.loginValidation = exports.registerValidation = void 0;
const express_validator_1 = require("express-validator");
// Export validation arrays
exports.registerValidation = [
    (0, express_validator_1.body)("email").isEmail().withMessage("Please enter a valid email"),
    (0, express_validator_1.body)("password")
        .isLength({ min: 6 })
        .withMessage("Password must be at least 6 characters"),
    (0, express_validator_1.body)("name")
        .isLength({ min: 2 })
        .withMessage("Name must be at least 2 characters"),
];
exports.loginValidation = [
    (0, express_validator_1.body)("email").isEmail().withMessage("Please enter a valid email"),
    (0, express_validator_1.body)("password").notEmpty().withMessage("Password is required"),
];
exports.changePasswordValidation = [
    (0, express_validator_1.body)("currentPassword")
        .notEmpty()
        .withMessage("Current password is required"),
    (0, express_validator_1.body)("newPassword")
        .isLength({ min: 6 })
        .withMessage("New password must be at least 6 characters"),
];
exports.resetPasswordValidation = [
    (0, express_validator_1.body)("password")
        .isLength({ min: 6 })
        .withMessage("Password must be at least 6 characters"),
];
exports.emailValidation = [
    (0, express_validator_1.body)("email").isEmail().withMessage("Please enter a valid email"),
];
