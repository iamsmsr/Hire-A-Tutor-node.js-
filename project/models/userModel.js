const mysql = require('mysql');

// Validate user credentials
exports.validateUser = (db, username, password, callback) => {
  const query = 'SELECT * FROM users WHERE username = ? AND password = ?';

  console.log(`Querying database with username: ${username}, password: ${password}`);

  db.query(query, [username, password], (err, results) => {
    if (err) {
      console.error('Database query error:', err);
      callback(err, null);
      return;
    }

    // Log the full results of the query
    console.log('Database query result:', results);

    // If user exists and credentials match
    if (results.length > 0) {
      // Return the user details (e.g., id and username) in the callback
      callback(null, { id: results[0].id, username: results[0].username });
    } else {
      callback(null, false);
    }
  });
};
