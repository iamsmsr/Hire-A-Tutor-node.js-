// models/requestModel.js
const mysql = require('mysql');

// Function to insert a new request into the requests table
exports.createRequest = (db, studentId, name, subject, remarks, callback) => {
    const query = 'INSERT INTO requests (studentid, name, subject, remarks) VALUES (?, ?, ?, ?)';

    console.log(`Inserting request into the database with studentId: ${studentId}, name: ${name}, subject: ${subject}, remarks: ${remarks}`);

    db.query(query, [studentId, name, subject, remarks], (err, results) => {
        if (err) {
            console.error('Error inserting request into database:', err);
            callback(err, null);
            return;
        }

        // Log the results of the insertion
        console.log('Request inserted successfully:', results);

        callback(null, results);
    });
};

// Function to fetch requests where session.type matches the subject
exports.getRequestsByRoleAsSubject = (db, role, callback) => {
    const query = `
        SELECT id, subject, remarks, created_at 
        FROM requests 
        WHERE subject = ?`;

    db.query(query, [role], (err, results) => {
        if (err) {
            console.error('Error fetching requests:', err);
            callback(err, null);
            return;
        }

        callback(null, results);
    });
};

// Fetch a request by its ID
exports.getRequestById = (db, id, callback) => {
    const query = `SELECT * FROM requests WHERE id = ?`;
    db.query(query, [id], (err, results) => {
        callback(err, results[0]);
    });
};

// Delete a request by its ID
exports.deleteRequest = (db, id, callback) => {
    const query = `DELETE FROM requests WHERE id = ?`;
    db.query(query, [id], callback);
};
