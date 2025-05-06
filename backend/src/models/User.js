/**
 * User Model
 * 
 * Represents a user in the system with authentication and profile information.
 * Includes validation for username, email, password, and other user properties.
 */
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * List of allowed email domains for user registration
 * @constant {string[]}
 */
const VALID_EMAIL_DOMAINS = [
  "gmail.com",
  "yahoo.com",
  "outlook.com",
  "hotmail.com",
  "live.com",
  "aol.com",
  "icloud.com",
  "protonmail.com",
  "mail.com",
  "zoho.com",
  "yandex.com",
  "gmx.com"
];

/**
 * Validates that the email is from an allowed domain
 * @param {string} email - Email address to validate
 * @returns {boolean} True if email domain is valid
 */
const validateEmail = function(email) {
  try {
    // Basic format validation is handled by the match property
    const parts = email.split('@');
    if (parts.length !== 2) return false;
    
    // Domain validation
    const domain = parts[1].toLowerCase();
    return VALID_EMAIL_DOMAINS.includes(domain);
  } catch (error) {
    return false;
  }
};

/**
 * Validates password strength requirements
 * @param {string} password - Password to validate
 * @returns {boolean} True if password meets all requirements
 */
const validatePassword = function(password) {
  // Null or undefined check
  if (!password) return false;
  
  // Length check
  if (password.length < 8 || password.length > 20) return false;
  
  // Uppercase letter check
  if (!/[A-Z]/.test(password)) return false;
  
  // Lowercase letter check
  if (!/[a-z]/.test(password)) return false;
  
  // Number check
  if (!/[0-9]/.test(password)) return false;
  
  // Special character check
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) return false;
  
  return true;
};

/**
 * User Schema Definition
 */
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      minlength: [3, 'Username must be at least 3 characters'],
      validate: {
        validator: function(v) {
          return /^[a-zA-Z0-9_]+$/.test(v);
        },
        message: 'Username can only contain letters, numbers, and underscores'
      }
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address'],
      validate: [
        validateEmail,
        'Please use a common email provider (gmail.com, yahoo.com, etc.)'
      ]
    },
    phone: {
      type: String,
      trim: true,
      validate: {
        validator: function(v) {
          return v ? /^\+?[0-9]{10,15}$/.test(v) : true; // Phone is optional
        },
        message: 'Please provide a valid phone number'
      }
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      validate: [
        validatePassword,
        'Password must be 8-20 characters and include uppercase, lowercase, number, and special character'
      ],
      select: false, // Don't include password in query results by default
    },
    avatar: {
      type: String,
      default: '',
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    energyLevels: [{
      date: {
        type: Date,
        default: Date.now
      },
      level: {
        type: Number,
        min: 1,
        max: 10
      },
      notes: String
    }],
    activities: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Activity'
    }],
    resetPasswordToken: String,
    resetPasswordExpire: Date,
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields
  }
);

/**
 * Pre-save middleware to hash user passwords before saving to database
 */
userSchema.pre('save', async function (next) {
  // Only hash the password if it has been modified
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    // Generate a salt and hash the password
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

/**
 * Method to check if provided password matches the stored hashed password
 * @param {string} enteredPassword - The password to check
 * @returns {Promise<boolean>} True if password matches
 */
userSchema.methods.matchPassword = async function (enteredPassword) {
  try {
    return await bcrypt.compare(enteredPassword, this.password);
  } catch (error) {
    console.error('Error comparing passwords');
    throw error;
  }
};

const User = mongoose.model('User', userSchema);

module.exports = User; 