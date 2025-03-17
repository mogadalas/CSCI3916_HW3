require('dotenv').config(); // Load environment variables from .env file
const express = require('express');
const bodyParser = require('body-parser');
const passport = require('passport');
const authJwtController = require('./auth_jwt'); // You're not using authController, consider removing it
const jwt = require('jsonwebtoken');
const cors = require('cors');
const User = require('./Users');
const Movie = require('./Movies'); // You're not using Movie, consider removing it

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(passport.initialize());

const router = express.Router();

// Removed getJSONObjectForMovieRequirement as it's not used


router.post('/signup', async (req, res) => { // Use async/await
  if (!req.body.username || !req.body.password) {
    return res.status(400).json({ success: false, msg: 'Please include both username and password to signup.' }); // 400 Bad Request
  }

  try {
    const user = new User({ // Create user directly with the data
      name: req.body.name,
      username: req.body.username,
      password: req.body.password,
    });

    await user.save(); // Use await with user.save()

    res.status(201).json({ success: true, msg: 'Successfully created new user.' }); // 201 Created
  } catch (err) {
    if (err.code === 11000) { // Strict equality check (===)
      return res.status(409).json({ success: false, message: 'A user with that username already exists.' }); // 409 Conflict
    } else {
      console.error(err); // Log the error for debugging
      return res.status(500).json({ success: false, message: 'Something went wrong. Please try again later.' }); // 500 Internal Server Error
    }
  }
});

router.post('/signin', async (req, res) => { // Use async/await
  try {
    const user = await User.findOne({ username: req.body.username }).select('name username password');

    if (!user) {
      return res.status(401).json({ success: false, msg: 'Authentication failed. User not found.' }); // 401 Unauthorized
    }

    const isMatch = await user.comparePassword(req.body.password); // Use await

    if (isMatch) {
      const userToken = { id: user._id, username: user.username }; // Use user._id (standard Mongoose)
      const token = jwt.sign(userToken, process.env.SECRET_KEY, { expiresIn: '1h' }); // Add expiry to the token (e.g., 1 hour)
      res.json({ success: true, token: 'JWT ' + token });
    } else {
      res.status(401).json({ success: false, msg: 'Authentication failed. Incorrect password.' }); // 401 Unauthorized
    }
  } catch (err) {
    console.error(err); // Log the error
    res.status(500).json({ success: false, message: 'Something went wrong. Please try again later.' }); // 500 Internal Server Error
  }
});

/*
router.route('/movies')
  .get((req, res) => {
    // HTTP GET Method
    // Requires no authentication.
    // Returns a JSON object with status, message, headers, query, and env.
    o.status = 200;
    o.message = "GET movies";
    res.json(o);
  })
  .post(authJwtController.isAuthenticated, async (req, res) => {

    Movie.create(req.body, (err, movie) => { // Use Movie.create for cleaner code

      if (err) {

        console.error(err); // Log the error for debugging

        return res.status(500).json({ success: false, message: 'Something went wrong. Please try again later.' }); // 500 Internal Server Error

      }

      res.status(201).json({ success: true, movie: movie }); // 201 Created

    });

  })

  */

  router.route('/movies')
    .get(authJwtController.isAuthenticated, async (req, res) => {
        try {
            const movies = await Movie.find({}); // Fetch all movies from the database
            res.json(movies);
        } catch (err) {
            console.error(err); // Log the error for debugging
            res.status(500).json({ success: false, message: 'Something went wrong. Please try again later.' }); // 500 Internal Server Error
        }
    })
    .post(authJwtController.isAuthenticated, async (req, res) => {
      const movie = new Movie(req.body); // Create a new movie instance with the request body
      try { 
          await movie.save(); // Save the movie to the database
      }
      catch (err) {
          console.error(err); // Log the error for debugging
          return res.status(500).json({ success: false, message: 'Something went wrong. Please try again later.' }); // 500 Internal Server Error
      }

      res.status(201).json({ success: true, movie: movie }); // 201 Created
    });

  .put(authJwtController.isAuthenticated, (req, res) => {
    // HTTP PUT Method
    // Requires JWT authentication.
    // Returns a JSON object with status, message, headers, query, and env.
    o.status = 200;
    o.message = "movie updated";
    res.json(o);
  })
  
  /*
  .delete(authController.isAuthenticated, (req, res) => {
      // HTTP DELETE Method
      // Requires Basic authentication.
      // Returns a JSON object with status, message, headers, query, and env.
      o.status = 200;
      o.message = "movie deleted";
      res.json(o);
  })
  */

  .all((req, res) => {
    // Any other HTTP Method
    // Returns a message stating that the HTTP method is unsupported.
    res.status(405).send({ message: 'HTTP method not supported.' });
  });

app.use('/', router);

const PORT = process.env.PORT || 8080; // Define PORT before using it
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app; // for testing only