const router = require('express').Router();

const path = require('path');

if (true || process.env.NODE_ENV === 'production') {
// Handle React routing, return all requests to React app
  router.get('/', function(req, res) {
    res.sendFile(path.join(__dirname, '../../../client/build', 'index.html'));
  });
} else {
  router.get("/", (req, res) => {
    res.send({ response: "I am alive" }).status(200);
  });
}

module.exports = router;
