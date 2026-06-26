const router = require('express').Router();
const jwt    = require('jsonwebtoken');
const User   = require('../models/User');

const sign = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password required' });
    if (await User.findOne({ email })) return res.status(400).json({ message: 'Email already registered' });
    const user  = await User.create({ email, password });
    res.status(201).json({ token: sign(user._id), userId: user._id, email: user.email });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    res.json({ token: sign(user._id), userId: user._id, email: user.email });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

module.exports = router;
