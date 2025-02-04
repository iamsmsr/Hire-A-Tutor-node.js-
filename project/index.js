// index.js

const http = require('http');
const fs = require('fs');
const mysql = require('mysql');
const url = require('url');
const querystring = require('querystring');
const userController = require('./controllers/authController');
const userController2 = require('./controllers/authController2');


// Create MySQL database connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',  // Your MySQL password
  database: 'login_app'  // Your database name
});

// Create HTTP server
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);

  // Home route (show login page)
  if (parsedUrl.pathname === '/' && req.method === 'GET') {
    userController.showLoginPage(req, res);
  }
  else if (parsedUrl.pathname === '/admin' && req.method === 'GET') {
    userController2.showLoginPage(req, res);
  }

  // Handle login submission
  else if (parsedUrl.pathname === '/login' && req.method === 'POST') {
    userController.handleLogin(req, res, db);
  }
  // Handle login submission for admin and teacher
  else if (parsedUrl.pathname === '/login2' && req.method === 'POST') {
    userController2.handleLogin(req, res, db);
  }

  // Dashboard route (show user dashboard)
  else if (parsedUrl.pathname === '/dashboard' && req.method === 'GET') {
    userController.showDashboard(req, res, db);  // Call the controller method instead
  }
  // Dashboard2 route (show user dashboard)
  else if (parsedUrl.pathname === '/dashboard2' && req.method === 'GET') {
    userController2.showDashboard2(req, res, db);
}

// Handle request form submission
else if (parsedUrl.pathname === '/submit-request' && req.method === 'POST') {
    userController.submitRequest(req, res, db);
  }


  else if (parsedUrl.pathname === '/accept-request' && req.method === 'POST') {
    userController2.acceptRequest(req, res, db);
}


// Handle reply to a message
else if (parsedUrl.pathname === '/reply-message' && req.method === 'POST') {
  userController.replyMessage(req, res, db);
}






  
  // 404 page
  else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Page not found.');
  }
});

// Start server
const port = 3000;
server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
