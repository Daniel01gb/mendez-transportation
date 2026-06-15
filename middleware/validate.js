const { body, validationResult } = require('express-validator');

/* Returns 400 with first validation error if any */
function handleValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg });
  }
  next();
}

const loginRules = [
  body('email')
    .isEmail().withMessage('Invalid email address.')
    .normalizeEmail()
    .isLength({ max: 254 }).withMessage('Email too long.'),
  body('password')
    .isString().withMessage('Password required.')
    .isLength({ min: 1, max: 128 }).withMessage('Invalid password length.')
    .trim()
];

const verify2faRules = [
  body('code')
    .isString().withMessage('Code required.')
    .matches(/^\d{6}$/).withMessage('Code must be 6 digits.')
];

const verifyTripRules = [
  body('tripNumber')
    .isString().withMessage('Trip number required.')
    .trim()
    .isLength({ min: 1, max: 32 }).withMessage('Invalid trip number.'),
  body('confirmCode')
    .isString().withMessage('Confirmation code required.')
    .trim()
    .isLength({ min: 1, max: 16 }).withMessage('Invalid confirmation code.')
];

module.exports = { handleValidation, loginRules, verify2faRules, verifyTripRules };
