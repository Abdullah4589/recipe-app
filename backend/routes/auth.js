const router = require('express').Router();
const jwt    = require('jsonwebtoken');
const User   = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const { badRequest, HttpError } = require('../middleware/errorHandler');

const sign = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });

// Deliberately permissive: something@something.tld. Stricter regexes reject
// valid addresses far more often than they catch typos, and the only real
// proof an address works is sending mail to it.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Mirrors the client-side rule in screens/RegisterScreen.js. The client check
// is for feedback speed; this one is the one that actually enforces it.
const MIN_PASSWORD_LENGTH = 6;

// POST /api/auth/register
router.post('/register', asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) throw badRequest('Email and password required');
  const normalised = String(email).trim().toLowerCase();
  if (!EMAIL_RE.test(normalised)) throw badRequest('Enter a valid email address');
  if (String(password).length < MIN_PASSWORD_LENGTH) {
    throw badRequest(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
  }
  if (await User.findOne({ email: normalised })) {
    throw badRequest('Email already registered');
  }

  const user = await User.create({ email: normalised, password });
  res.status(201).json({ token: sign(user._id), userId: user._id, email: user.email });
}));

// POST /api/auth/login
router.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Guard before touching bcrypt: compare(undefined, hash) throws, which used
  // to surface as a 500 on a request that is simply missing a field.
  if (!email || !password) throw new HttpError(401, 'Invalid email or password');

  const user = await User.findOne({ email: String(email).trim().toLowerCase() });
  if (!user || !(await user.comparePassword(password))) {
    // Same message and status for "no such user" and "wrong password" — telling
    // them apart lets an attacker enumerate registered addresses.
    throw new HttpError(401, 'Invalid email or password');
  }

  res.json({ token: sign(user._id), userId: user._id, email: user.email });
}));

module.exports = router;
