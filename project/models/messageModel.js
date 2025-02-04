// models/messageModel.js
const mysql = require('mysql');


// Save a message
exports.createMessage = (db, senderId, receiverId, message, callback) => {
    const query = `
        INSERT INTO messages (sender_id, receiver_id, message) 
        VALUES (?, ?, ?)`;
    db.query(query, [senderId, receiverId, message], callback);
};

// Fetch messages for a user
exports.getMessagesByUserId = (db, userId, callback) => {
    const query = `
        SELECT * FROM messages 
        WHERE sender_id = ? OR receiver_id = ? 
        ORDER BY created_at DESC`;
    db.query(query, [userId, userId], callback);
};
