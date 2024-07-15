//Ensure that you replace 'your_username', 'your_database', and 'your_password' with your actual PostgreSQL credentials.
const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const { Pool,Client } = require('pg');
const path=require('path');
const cors=require('cors');
const { error } = require('console');
// const Customer = require('./models/customer');
const { passwordPolicy, loginAttempts, emailSettings } = require('./config');
//const sanitize = require('sanitize-html');
// const xss = require('xss');
// const validator = require('validator');


const app = express();
const port = process.env.PORT || 3000;
app.use(cors());


const pool = new Client({
  user: 'postgres',
  host: 'localhost',
  database: 'communication_LTD',
  password: '123456',
  port: 5432,
});



pool.connect();

//app.use(bodyParser.json());
app.use(express.json());
app.use(express.static(__dirname, {
  setHeaders: (res, path) => {
    if (path.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    }
  }
}));
app.use(express.static("html"));
app.use(express.static("style.css"));


app.get('/', (req, res) => {
  res.redirect('/login.html');
});
function sanitize(input) {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    
    .replace(/#/g, "&#35;")
    .replace(/%/g, "&#37;")
    .replace(/\(/g, "&#40;")
    .replace(/\)/g, "&#41;")
    
    .replace(/\//g, "&#47;")
}


// Route handler to serve register.html
app.get('/register', async (req, res) => {
  try {
    res.sendFile(path.join(__dirname, 'html', 'register.html'));
  } catch (error) {
    console.error('Error serving register.html:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Route handler to serve change-password.html
app.get('/change-password', async (req, res) => {
  try {
    res.sendFile(path.join(__dirname, 'html', 'change-password.html'));
  } catch (error) {
    console.error('Error serving change-password.html:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Route handler to serve login.html
app.get('/login', async (req, res) => {
  try {
    res.sendFile(path.join(__dirname, 'html', 'login.html'));
  } catch (error) {
    console.error('Error serving login.html:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Route handler to serve new-customer.html
app.get('/new-customer', async (req, res) => {
  try {
    res.sendFile(path.join(__dirname, 'html', 'new-customer.html'));
  } catch (error) {
    console.error('Error serving new-customer.html:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Route handler to serve forgot-password.html
app.get('/forgot-password', async (req, res) => {
  try {
    res.sendFile(path.join(__dirname, 'html', 'forgot-password.html'));
  } catch (error) {
    console.error('Error serving forgot-password.html:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

function validatePassword(password) {
  const policy =passwordPolicy;
  let regexString = '^';

  // Check for lowercase letters
  if (policy.requireLowerCase) {
    regexString += '(?=.*[a-z])';
  }

  // Check for uppercase letters
  if (policy.requireUpperCase) {
    regexString += '(?=.*[A-Z])';
  }

  // Check for digits
  if (policy.requireDigits) {
    regexString += '(?=.*\\d)';
  }

  // Check for special characters
  if (policy.requireSpecialCharacters) {
    regexString += '(?=.*[!@#$%^&*()\\-_=+[\\]{}|;:\'",<.>/?])';
  }

  // Minimum length
  regexString += `[A-Za-z\\d!@#$%^&*()\\-_=+[\\]{}|;:'",<.>/?]{${policy.minLength},}$`;

  const regex = new RegExp(regexString);

  return regex.test(password);
}
// 1. Register screen for new users
app.post('/register', async (req, res) => {
  try {
    const { username, password, email } = req.body;

    // Validate password complexity
    if (!validatePassword(password)) {
      return res.status(400).json({ error: 'Password does not meet complexity requirements' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    sanitizedUsername=sanitize(username);
    sanitizedEmail=sanitize(email);
    // Insert user data into the database
    const result = await pool.query(
      "INSERT INTO users (username, password, email) VALUES ($1, $2, $3) RETURNING *",
      [sanitizedUsername, hashedPassword, sanitizedEmail]
    );
    
      console.log(result);
    res.status(201).json({ message: 'User registered successfully', user: result.rows[0] });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// 2. Screen for changing a password for a user
app.put('/change-password', async (req, res) => {
  try {
    const { username, existingPassword, newPassword } = req.body;

    // Query the database to fetch user details
    const user = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    
    // Check if user exists
    if (!user.rows[0]) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Compare existing password with the stored hash
    const passwordMatch = await bcrypt.compare(existingPassword, user.rows[0].password);
    if (!passwordMatch) {
      return res.status(400).json({ error: 'Invalid existing password' });
    }

    // Validate the new password against password complexity requirements
    if (!validatePassword(newPassword)) {
      return res.status(400).json({ error: 'New password does not meet complexity requirements' });
    }

    // Hash the new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Get the user's current password history
    const passwordHistory = user.rows[0].password_History_Attempts || [];

    // Add the current password to the password history array
    passwordHistory.unshift(user.rows[0].password);

    const truncatedHistory = passwordHistory.slice(0, 3);

    // Update the user's password and password history in the database
    await pool.query('UPDATE users SET password = $1, "password_History_Attempts" = $2 WHERE username = $3', [hashedNewPassword, truncatedHistory, username]);

    res.status(200).json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 3. Login screen for Comunication_LTD information system
app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const userResult = await pool.query(
      "SELECT * FROM users WHERE username = $1",
      [username]
    );   

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];
    const currentTime = new Date();

    // Check if the user account is locked due to too many failed login attempts
    if (user.login_attempts >= loginAttempts.maxAttempts && user.lockout_time > currentTime) {
      return res.status(403).json({ error: 'Account temporarily locked. Please try again later.' });
    }
    
    // Reset login attempts and lockout time if lockout time is not null and has passed
    if (user.lockout_time && user.lockout_time <= currentTime) {
      console.log("Login Attempts Reseted");
      await pool.query('UPDATE users SET login_attempts = 0, lockout_time = NULL WHERE username = $1', [username]);
      user.login_attempts = 0;  // Also reset in the current context to avoid further checks in this session
      user.lockout_time = null;
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    console.log(userResult);
    if (!passwordMatch) {
      // Increment login attempts if login fails
      const incrementedAttempts = user.login_attempts + 1;
      await pool.query('UPDATE users SET login_attempts = $1 WHERE username = $2', [incrementedAttempts, username]);

      // Set lockout time if login attempts reach the maximum
      if (incrementedAttempts >= loginAttempts.maxAttempts) {
        const lockoutTime = new Date();
        lockoutTime.setMinutes(lockoutTime.getMinutes() + 3); // Lockout for 3 minutes
        await pool.query('UPDATE users SET lockout_time = $1 WHERE username = $2', [lockoutTime, username]);
      }

      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Reset login attempts if login successful
    await pool.query('UPDATE users SET login_attempts = 0, lockout_time = NULL WHERE username = $1', [username]);

    res.status(200).json({ message: 'Login successful', user });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/new-customer', async (req, res) => {
  const { id,firstName, lastName } = req.body;


  sanitizedId=sanitize(id);
  sanitizedFirstName=sanitize(firstName);
  sanitizedLastName=sanitize(lastName);


  try {
    const result = await pool.query(
      "INSERT INTO customers (id,firstName,lastName) VALUES ($1, $2, $3) RETURNING *",
      [sanitizedId, sanitizedFirstName, sanitizedLastName]);
      console.log(result);
        
        res.status(201).json({ message: 'New customer added successfully', customer: result.rows[0] });
  } catch (error) {
    console.error('Error adding new customer:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Endpoint to fetch all customers
//'<script> alert("Hello, world!")</script>'
app.get('/customers', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, firstName, lastName FROM customers');
    res.status(200).json({ customers: result.rows });
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 5. "Forgot password" screen
app.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];
    console.log(user);

    // Generate a random token
    const token = crypto.randomBytes(20).toString('hex'); 
    const hashedToken = await bcrypt.hash(token, 10); 

    const expires = new Date(Date.now() + 3600000); // 1 hour

    // Update the user with the reset token and expiration time
    await pool.query('UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE email = $3', [hashedToken, expires, email]);

    // Configure nodemailer
    const transporter = nodemailer.createTransport({
      service: "Gmail",
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: "chentempuse@gmail.com",
        pass: "xhun etlp dpam cmse",
      },
    });

    const mailOptions = {
      from: 'chentempuse@gmail.com',
      to: email, 
      subject: 'Password Reset',
      text: `Your password reset token is ${token}` // Use 'token' here instead of 'randomToken'
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: 'Password reset token sent to email' });
  } catch (error) {
    console.error('Error sending password reset token:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/verify-token', async (req, res) => {
  try {
    const { email, token } = req.body;

    // Retrieve user data by email
    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    console.log('User Result:', userResult.rows);

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];
    console.log('User:', user);

    // Compare provided token with stored hashed token
    const tokenMatch = await bcrypt.compare(token, user.reset_token);
    console.log('Token Match:', tokenMatch);

    if (!tokenMatch || new Date(user.reset_token_expires) < new Date()) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }

    // Delete the token from the database after it has been verified
    const updateResult = await pool.query('UPDATE users SET reset_token = NULL, reset_token_expires = NULL WHERE email = $1', [email]);
    console.log('Update Result:', updateResult);

    res.status(200).json({ message: 'Token verified', userId: user.id });
  } catch (error) {
    console.error('Error verifying token:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/new-password', async (req, res) => {
  try {
    const { username, newPassword } = req.body;

    // Query the database to fetch user details
    const user = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    
    // Check if user exists
    if (!user.rows[0]) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Validate the new password against password complexity requirements
    if (!validatePassword(newPassword)) {
      return res.status(400).json({ error: 'New password does not meet complexity requirements' });
    }

    // Hash the new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Get the user's current password history
    const passwordHistory = user.rows[0].password_History_Attempts || [];

    passwordHistory.unshift(user.rows[0].password);

    // Truncate the password history array to keep only the last 3 passwords
    const truncatedHistory = passwordHistory.slice(0, 3);

    // Update the user's password and password history in the database
    await pool.query('UPDATE users SET password = $1, "password_History_Attempts" = $2 WHERE username = $3', [hashedNewPassword, truncatedHistory, username]);

    // Respond with success message
    res.status(200).json({ message: 'Password changed successfully' });
   

  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/customer/:id', async (req, res) => {
  try {
    const customerId = req.params.id;

    const query = {
      text: "SELECT * FROM customers WHERE id = $1",
      values: [customerId],
    };
    const result = await pool.query(query);
    console.log(result);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const customer = result.rows[0]; 

    res.json({ customer }); // Send customer data as JSON
  } catch (error) {
    console.error('Error fetching customer:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});




app.listen(port, () => console.log(`Server running on port ${port}`));
