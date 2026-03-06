import Joi from 'joi';

export const validators = {
  // Auth validators
  login: Joi.object({
    username: Joi.string().min(3).max(100).required().messages({
      'string.empty': 'Username is required',
    }),
    password: Joi.string().min(6).required().messages({
      'string.empty': 'Password is required',
    }),
  }),

  register: Joi.object({
    full_name: Joi.string().min(2).max(100).required(),
    email: Joi.string().email().required(),
    mobile: Joi.string().pattern(/^\d{10,15}$/).required(),
    password: Joi.string()
      .min(8)
      .pattern(/[A-Z]/)
      .pattern(/[0-9]/)
      .pattern(/[!@#$%^&*]/)
      .required()
      .messages({
        'string.pattern.base': 'Password must include uppercase, number, and special character',
      }),
  }),

  // Flight search validator
  flightSearch: Joi.object({
    origin_id: Joi.number().required(),
    destination_id: Joi.number().required(),
    travel_date: Joi.date().iso().required(),
    return_date: Joi.date().iso().allow(null),
    trip_type: Joi.string().valid('ONE_WAY', 'RETURN').default('ONE_WAY'),
    adults: Joi.number().min(1).max(9).required(),
    children: Joi.number().min(0).max(8).required(),
    newborns: Joi.number().min(0).max(4).required(),
  }),

  // Passenger validator
  passenger: Joi.object({
    full_name: Joi.string().min(2).max(100).required(),
    date_of_birth: Joi.date().iso().required(),
    gender: Joi.string().valid('MALE', 'FEMALE', 'OTHER').required(),
    nationality: Joi.string().max(100).required(),
    passport_id: Joi.string().max(50).allow(null),
    age_category: Joi.string().valid('ADULT', 'CHILD', 'NEWBORN').required(),
  }),

  // Payment validator
  payment: Joi.object({
    payment_method: Joi.string().valid('CREDIT_CARD', 'DEBIT_CARD', 'PAYPAL', 'UPI').required(),
    card_number: Joi.string()
      .pattern(/^\d{16}$/)
      .when('payment_method', {
        is: Joi.string().valid('CREDIT_CARD', 'DEBIT_CARD'),
        then: Joi.required(),
      }),
    expiry: Joi.string()
      .pattern(/^\d{2}\/\d{2}$/)
      .when('payment_method', {
        is: Joi.string().valid('CREDIT_CARD', 'DEBIT_CARD'),
        then: Joi.required(),
      }),
    cvv: Joi.string()
      .pattern(/^\d{3,4}$/)
      .when('payment_method', {
        is: Joi.string().valid('CREDIT_CARD', 'DEBIT_CARD'),
        then: Joi.required(),
      }),
    upi_id: Joi.string()
      .pattern(/^[a-zA-Z0-9._-]+@[a-zA-Z]+$/)
      .when('payment_method', {
        is: 'UPI',
        then: Joi.required(),
      }),
  }),
};

export const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        details: error.details.map((d) => ({
          field: d.path.join('.'),
          message: d.message,
        })),
      },
    });
  }
  req.validated = value;
  next();
};
