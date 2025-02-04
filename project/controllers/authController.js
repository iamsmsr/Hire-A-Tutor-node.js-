// authController.js

const fs = require('fs');
const userModel = require('../models/userModel');
const requestModel = require('../models/requestModel');
const querystring = require('querystring');

// Show login page
exports.showLoginPage = (req, res) => {
  fs.readFile('views/login.html', 'utf-8', (err, data) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Error loading login page.');
      return;
    }
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(data);
  });
};

// Handle login logic
exports.handleLogin = (req, res, db) => {
  let body = '';

  req.on('data', chunk => {
    body += chunk;
  });

  req.on('end', () => {
    const { username, password } = querystring.parse(body);

    if (!username || !password) {
      res.writeHead(400, { 'Content-Type': 'text/plain' });
      res.end('Username and password are required.');
      return;
    }

    // Check user credentials using model
    userModel.validateUser(db, username, password, (err, user) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Error validating user.');
        return;
      }

      if (!user) {
        res.writeHead(401, { 'Content-Type': 'text/plain' });
        res.end('Invalid username or password.');
        return;
      }

      // Create a session object
      const session = {
        id: user.id,  // User's ID from the database
        name: user.username,  // User's name from the database
        type: 'student'  // Set user type as 'student'
      };

      // Set session in a cookie (you can use any cookie parser here)
      res.setHeader('Set-Cookie', `session=${JSON.stringify(session)}; HttpOnly`);

      // Print the session to the terminal for debugging
      console.log('Session created:', session);

      // Redirect to the dashboard on successful login
      res.writeHead(302, {
        'Location': '/dashboard',  // Redirect to dashboard
      });
      res.end();
    });
  });
};



// Handle the form submission for creating a new request
exports.submitRequest = (req, res, db) => {
    let body = '';

    req.on('data', chunk => {
        body += chunk;
    });

    req.on('end', () => {
        const { subject, remarks } = querystring.parse(body);

        if (!subject || !remarks) {
            res.writeHead(400, { 'Content-Type': 'text/plain' });
            res.end('Subject and remarks are required.');
            return;
        }

        // Get user data from the session
        const session = req.headers.cookie ? JSON.parse(req.headers.cookie.split('=')[1]) : null;

        if (!session || !session.id) {
            res.writeHead(401, { 'Content-Type': 'text/plain' });
            res.end('User is not logged in.');
            return;
        }

        // Insert the request into the database using the model
        requestModel.createRequest(db, session.id, session.name, subject, remarks, (err, results) => {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Error submitting request.');
                return;
            }
        
            // Redirect to the dashboard after successfully submitting the request
            res.writeHead(302, {
                'Location': '/dashboard',  // Redirect to the dashboard
            });
            res.end();
        });
        
    });
};
const messageModel = require('../models/messageModel');
// Handle fetching messages for a student
// Handle fetching messages for a student
exports.showDashboard = (req, res, db) => {
  const session = req.headers.cookie ? JSON.parse(req.headers.cookie.split('=')[1]) : null;

  if (!session || !session.id) {
    res.writeHead(401, { 'Content-Type': 'text/plain' });
    res.end('User is not logged in.');
    return;
  }

  messageModel.getMessagesByUserId(db, session.id, (err, messages) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Error fetching messages.');
      return;
    }

    let messageList = '';
    messages.forEach(msg => {
      messageList += `
        <div class="message">
          <p><strong>Sender ID:</strong> ${msg.sender_id}</p>
          <p><strong>Message:</strong> ${msg.message}</p>
          <p><strong>Date:</strong> ${msg.created_at}</p>
          <form class="reply-form" action="/reply-message" method="POST">
            <input type="hidden" name="message_id" value="${msg.id}">
            <input type="hidden" name="receiver_id" value="${msg.sender_id}">
            <textarea name="reply" placeholder="Write your reply here..." required></textarea><br>
            <input type="submit" value="Send Reply">
          </form>
        </div>
      `;
    });

    fs.readFile('views/dashboard.html', 'utf-8', (err, data) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Error loading dashboard.');
        return;
      }

      const pageContent = data.replace('{{messages}}', messageList);
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(pageContent);
    });
  });
};

// Handle reply to a message
exports.replyMessage = (req, res, db) => {
  let body = '';

  req.on('data', chunk => {
    body += chunk;
  });

  req.on('end', () => {
    const { receiver_id, reply } = querystring.parse(body);

    if (!receiver_id || !reply) {
      res.writeHead(400, { 'Content-Type': 'text/plain' });
      res.end('Receiver ID and reply are required.');
      return;
    }

    const session = req.headers.cookie ? JSON.parse(req.headers.cookie.split('=')[1]) : null;

    if (!session || !session.id) {
      res.writeHead(401, { 'Content-Type': 'text/plain' });
      res.end('User is not logged in.');
      return;
    }

    const sender_id = session.id;

    // Save the reply in the database
    messageModel.createMessage(db, sender_id, receiver_id, reply, (err, result) => {
      if (err) {
        console.error('Error saving reply:', err);
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Error saving reply.');
        return;
      }

      // Redirect back to the dashboard
      res.writeHead(302, { 'Location': '/dashboard' });
      res.end();
    });
  });
};

