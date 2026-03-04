const app = require('../server');

module.exports = app;

// Disable Vercel's default body parser so multer can read the raw multipart stream
module.exports.config = {
    api: {
        bodyParser: false,
    },
};
