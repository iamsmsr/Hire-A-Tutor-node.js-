// authController2.js

const fs = require('fs');
const userModel = require('../models/userModel2');
const requestModel = require('../models/requestModel');
const querystring = require('querystring');

// Show login page
exports.showLoginPage = (req, res) => {
  fs.readFile('views/login2.html', 'utf-8', (err, data) => {
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
        type: user.role  // Set user role in the session
      };

      // Set session in a cookie (you can use any cookie parser here)
      res.setHeader('Set-Cookie', `session=${JSON.stringify(session)}; HttpOnly`);

      // Print the session to the terminal for debugging
      console.log('Session created:', session);

      // Redirect to the dashboard on successful login
      res.writeHead(302, {
        'Location': '/dashboard2',  // Redirect to dashboard
      });
      res.end();
    });
  });
};
// Show dashboard2 with filtered requests
const messageModel = require('../models/messageModel');

exports.showDashboard2 = (req, res, db) => {
  // Get session from cookie
  const cookies = req.headers.cookie || '';
  const sessionCookie = cookies.split('; ').find(row => row.startsWith('session='));
  if (!sessionCookie) {
    res.writeHead(302, { 'Location': '/admin' });
    res.end('No session found.');
    return;
  }

  // Parse the session data
  const session = JSON.parse(decodeURIComponent(sessionCookie.split('=')[1]));

  // If the role is 'admin', redirect to a different page (if required)
  if (session.type === 'admin') {
    res.writeHead(302, { 'Location': '/dashboard' });
    res.end();
    return;
  }

  // Fetch requests for non-admin users
  requestModel.getRequestsByRoleAsSubject(db, session.type, (err, requests) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Error loading dashboard2.');
      return;
    }

    // Fetch messages for the user
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

      // Read and send the dashboard2 HTML
      fs.readFile('views/dashboard2.html', 'utf-8', (err, data) => {
        if (err) {
          res.writeHead(500, { 'Content-Type': 'text/plain' });
          res.end('Error loading dashboard2.');
          return;
        }

        // Prepare the table rows dynamically
        const tableRows = requests.map(request => `
          <tr>
            <td>${request.id}</td>
            <td>${request.subject}</td>
            <td>${request.remarks}</td>
            <td>${request.created_at}</td>
            <td>
              <button onclick="showAcceptDialog('${request.id}', '${request.subject}')">Accept</button>
            </td>
          </tr>
        `).join('');

        // Inject the rows and messages into the HTML
        const updatedContent = data
          .replace('{{tableRows}}', tableRows)
          .replace('{{messages}}', messageList);

        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(updatedContent);
      });
    });
  });
};







exports.acceptRequest = (req, res, db) => {
  let body = '';

  req.on('data', chunk => {
    body += chunk;
  });

  req.on('end', () => {
    const { requestId, message } = JSON.parse(body);

    // // Simulate session check
    // const session = { id: 1, role: 'teacher' }; // Mock session for now
    // if (!session || !session.id) {
    //   res.writeHead(401, { 'Content-Type': 'text/plain' });
    //   res.end('Unauthorized access.');
    //   return;
    // }
      // Get session from cookie
  const cookies = req.headers.cookie || '';
  const sessionCookie = cookies.split('; ').find(row => row.startsWith('session='));
  if (!sessionCookie) {
    res.writeHead(302, { 'Location': '/admin' });
    res.end('No session found.');
    return;
  }

    const session = JSON.parse(decodeURIComponent(sessionCookie.split('=')[1]));

    const senderId = session.id;

    requestModel.getRequestById(db, requestId, (err, request) => {
      if (err || !request) {
        console.error('Error retrieving request:', err || 'Request not found.');
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Request not found.');
        return;
      }

      const receiverId = request.studentid;

      // Save the message in the messages table
      messageModel.createMessage(db, senderId, receiverId, message, (err, results) => {
        if (err) {
          console.error('Error saving message:', err);
          res.writeHead(500, { 'Content-Type': 'text/plain' });
          res.end('Error saving message.');
          return;
        }

        console.log('Message saved successfully:');
        console.log(`Sender ID: ${senderId}`);
        console.log(`Receiver ID: ${receiverId}`);
        console.log(`Message: ${message}`);

        // Delete the request after saving the message
        requestModel.deleteRequest(db, requestId, (err) => {
          if (err) {
            console.error('Error deleting request:', err);
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('Message saved, but error deleting request.');
            return;
          }

          console.log(`Request with ID ${requestId} deleted successfully.`);
          res.writeHead(200, { 'Content-Type': 'text/plain' });
          res.end('Request accepted, message saved, and request deleted.');
        });
      });
    });
  });
};
