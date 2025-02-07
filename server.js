const { use } = require("chai");
const express = require("express");
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json()); 

// ------ WRITE YOUR SOLUTION HERE BELOW ------//

// Your solution should be written here


// ------------------ User Registration Endpoint ----------------------------------------------



// Define the user signup endpoint
app.post("/signup", (req, res) => {

  const userHandle = req.body.userHandle;
  const password = req.body.password;

  if (!userHandle || !password) {
    res.status(400).send("Invalid request payload");
  } 

  // Reject if userHandle is shorter than 6 characters
  // Reject if password is shorter than 6 characters
  if (userHandle.length < 6 || password.length < 6) {
    res.status(400).send("Invalid request payload");
  } 

  res.status(201).send("User successfully registered");  
});


// ------------------ User Authentication Endpoint ----------------------------------------------


const jwt = require("jsonwebtoken");
const JWTSECRET = "123";

// Example user data for validation
const users = [
  { userHandle: "DukeNukem", password: "123456" },
  { userHandle: "DukeNukem1", password: "correctpassword" }
];

// Endpoint for user login
app.post("/login", (req, res) => {

  const { userHandle, password, ...extraFields } = req.body;

  // Validate that no additional fields exist (only userHandle and password are allowed)
  if (Object.keys(extraFields).length > 0) {
    return res.status(400).send("Invalid request payload: contains extra fields");
  }

  if (!userHandle || !password) {
    return res.status(400).send("Invalid request payload: Missing username or password");
  } 

  // Ensure userHandle and password are of string type
  if (typeof userHandle !== "string" || typeof password !== "string") {
    return res.status(400).send("Invalid request payload: Username and password must be strings");
  }

  // Reject if userHandle is fewer than 6 characters
  // Reject if password is fewer than 6 characters
  if (userHandle.length < 6 || password.length < 6) {
    return res.status(400).send("Invalid request payload: userHandle and password must be at least 6 characters long");
  } 
  
  // Check if the provided username and password match any stored user
  const user = users.find(element => element.userHandle === userHandle && element.password === password);

  if (!user) {
    return res.status(401).send("Unauthorized: Incorrect username or password");
  }
  
  try {
    const token = jwt.sign(
      // Token payload
      { userHandle: userHandle }, 
      // Secret key
      JWTSECRET
    );
    res.status(200).send({ jsonWebToken: token });
  } 
  catch (error) {
    res.status(500).send("Internal server error");
  }  
});



// ------------------ Submit a High Score for a Level (JWT Authentication Required) ----------------------------------------------



const highScores = []; // Temporary storage for high scores

// Middleware to verify JWT authentication
function authenticateJWT(req, res, next) {

  // Verify presence of Authorization header
  const authHeader = req.headers.authorization;

  // If Authorization header or token is missing
  if (!authHeader || !authHeader.split(" ")[1]) {
    return res.status(401).send("Unauthorized: Missing JWT token");
  }

  // Retrieve token from Authorization header
  const token = authHeader.split(" ")[1];

  // Authenticate token
  try 
  {
    const decoded = jwt.verify(token, JWTSECRET);

    // Attach userHandle to request for future reference
    req.userHandle = decoded.userHandle;
    next();
  } 
  
  catch (error) 
  {
    return res.status(401).send("Unauthorized: Invalid token");
  }
}

// POST /high-scores - Record a high score
app.post("/high-scores", authenticateJWT, (req, res) => {
  const { level, userHandle, score, timestamp, ...extraFields } = req.body;

  // Ensure no unexpected fields are included
  if (Object.keys(extraFields).length > 0) {
    return res.status(400).send("Invalid request payload: contains extra fields");
  }

  // Validate required fields
  if (!level || !userHandle || !score || !timestamp) {
    return res.status(400).send("Invalid request payload: Missing required fields");
  }

  // Confirm data types are correct
  if (
    typeof level !== "string" ||
    typeof userHandle !== "string" ||
    typeof score !== "number" ||
    typeof timestamp !== "string"
  ) {
    return res.status(400).send("Invalid request payload: Incorrect data types");
  }

  // Verify timestamp format (must follow ISO 8601 standard)
  if (isNaN(Date.parse(timestamp))) {
    return res.status(400).send("Invalid request payload: Incorrect timestamp format");
  }

  // Ensure the userHandle in request matches the JWT userHandle (Prevents users from submitting scores on behalf of others)
  if (userHandle !== req.userHandle) {
    return res.status(401).send("Unauthorized: You may only submit scores for yourself");
  }

  // Save the high score entry
  highScores.push({ level, userHandle, score, timestamp });

  return res.status(201).send("High score recorded successfully");
});



// ------------------ Retrieve High Scores ----------------------------------------------


// GET /high-scores - Retrieve high scores for a given level (with pagination support)
app.get("/high-scores", (req, res) => {

  // Extract level and page parameters from query
  const level = req.query.level;
  const page = req.query.page;
  
  // Ensure the `level` parameter is provided
  if (!level) {
    return res.status(400).send("Invalid request: 'level' is required");
  }

  // Handle `page` parameter
  let pageNumber;
  if (page) {
    pageNumber = parseInt(page); // Convert page value to a number
  } else {
    pageNumber = 1; // Default to first page if none provided
  }

  // Validate page number format
  if (page && (isNaN(pageNumber) || pageNumber < 1)) {
    return res.status(400).send("Invalid request: 'page' must be a positive integer");
  }

  // Extract scores for the specified level
  const scoresForLevel = highScores.filter(element => element.level === level);

  // Sort scores in descending order (highest score first)
  scoresForLevel.sort((firstScore, secondScore) => {
    return secondScore.score - firstScore.score;
  });
  
  // Paginate results (20 entries per page)
  const pageSize = 20;
  const startIndex = (pageNumber - 1) * pageSize;
  const paginatedScores = scoresForLevel.slice(startIndex, startIndex + pageSize);

  return res.status(200).json(paginatedScores);
});

//------ WRITE YOUR SOLUTION ABOVE THIS LINE ------//

let serverInstance = null;
module.exports = {
  start: function () {
    serverInstance = app.listen(port, () => {
      console.log(`Example app listening at http://localhost:${port}`);
    });
  },
  close: function () {
    serverInstance.close();
  },
};
