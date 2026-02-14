const app = require('../../backend/app');
const { connectDB } = require('../../backend/config/database');

let mongoConnPromise;

async function ensureMongo() {
  if (!mongoConnPromise) {
    mongoConnPromise = connectDB();
  }
  await mongoConnPromise;
}

module.exports = async function handler(req, res) {
  try {
    await ensureMongo();
    return app(req, res);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('API handler failed:', err);
    res.status(500).json({ success: false, error: 'Server initialization failed' });
  }
};

module.exports.config = {
  api: {
    bodyParser: false,
    externalResolver: true,
  },
};


