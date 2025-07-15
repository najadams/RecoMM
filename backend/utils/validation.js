const Joi = require('joi');

// User registration validation
const validateRegister = (data) => {
  const schema = Joi.object({
    username: Joi.string()
      .alphanum()
      .min(3)
      .max(30)
      .required()
      .messages({
        'string.alphanum': 'Username must contain only letters and numbers',
        'string.min': 'Username must be at least 3 characters long',
        'string.max': 'Username cannot exceed 30 characters',
        'any.required': 'Username is required'
      }),
    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required'
      }),
    password: Joi.string()
      .min(6)
      .max(128)
      .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)'))
      .required()
      .messages({
        'string.min': 'Password must be at least 6 characters long',
        'string.max': 'Password cannot exceed 128 characters',
        'string.pattern.base': 'Password must contain at least one lowercase letter, one uppercase letter, and one number',
        'any.required': 'Password is required'
      }),
    confirmPassword: Joi.string()
      .valid(Joi.ref('password'))
      .required()
      .messages({
        'any.only': 'Passwords do not match',
        'any.required': 'Password confirmation is required'
      })
  });

  return schema.validate(data);
};

// User login validation
const validateLogin = (data) => {
  const schema = Joi.object({
    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required'
      }),
    password: Joi.string()
      .required()
      .messages({
        'any.required': 'Password is required'
      })
  });

  return schema.validate(data);
};

// User profile update validation
const validateProfileUpdate = (data) => {
  const schema = Joi.object({
    username: Joi.string()
      .alphanum()
      .min(3)
      .max(30)
      .optional(),
    email: Joi.string()
      .email()
      .optional(),
    avatar: Joi.string()
      .uri()
      .optional()
      .allow(null, ''),
    preferences: Joi.object({
      favoriteGenres: Joi.array()
        .items(Joi.string().valid('fiction', 'non-fiction', 'mystery', 'romance', 'sci-fi', 'fantasy', 'biography', 'history', 'self-help', 'business', 'other'))
        .optional(),
      readingGoal: Joi.number()
        .integer()
        .min(1)
        .max(365)
        .optional(),
      preferredLanguage: Joi.string()
        .length(2)
        .optional()
    }).optional()
  });

  return schema.validate(data);
};

// Password change validation
const validatePasswordChange = (data) => {
  const schema = Joi.object({
    currentPassword: Joi.string()
      .required()
      .messages({
        'any.required': 'Current password is required'
      }),
    newPassword: Joi.string()
      .min(6)
      .max(128)
      .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)'))
      .required()
      .messages({
        'string.min': 'New password must be at least 6 characters long',
        'string.max': 'New password cannot exceed 128 characters',
        'string.pattern.base': 'New password must contain at least one lowercase letter, one uppercase letter, and one number',
        'any.required': 'New password is required'
      }),
    confirmNewPassword: Joi.string()
      .valid(Joi.ref('newPassword'))
      .required()
      .messages({
        'any.only': 'New passwords do not match',
        'any.required': 'New password confirmation is required'
      })
  });

  return schema.validate(data);
};

// Book rating validation
const validateBookRating = (data) => {
  const schema = Joi.object({
    bookId: Joi.string()
      .required()
      .messages({
        'any.required': 'Book ID is required'
      }),
    title: Joi.string()
      .required()
      .messages({
        'any.required': 'Book title is required'
      }),
    author: Joi.string()
      .required()
      .messages({
        'any.required': 'Book author is required'
      }),
    rating: Joi.number()
      .integer()
      .min(1)
      .max(5)
      .required()
      .messages({
        'number.min': 'Rating must be between 1 and 5',
        'number.max': 'Rating must be between 1 and 5',
        'any.required': 'Rating is required'
      }),
    status: Joi.string()
      .valid('want-to-read', 'currently-reading', 'read')
      .required()
      .messages({
        'any.only': 'Status must be one of: want-to-read, currently-reading, read',
        'any.required': 'Reading status is required'
      }),
    review: Joi.string()
      .max(1000)
      .optional()
      .allow(''),
    dateCompleted: Joi.date()
      .optional()
      .allow(null)
  });

  return schema.validate(data);
};

// Generic validation middleware
const validate = (validator) => {
  return (req, res, next) => {
    const { error } = validator(req.body);
    
    if (error) {
      const errorMessage = error.details[0].message;
      return res.status(400).json({
        success: false,
        message: errorMessage
      });
    }
    
    next();
  };
};

module.exports = {
  validateRegister,
  validateLogin,
  validateProfileUpdate,
  validatePasswordChange,
  validateBookRating,
  validate
};