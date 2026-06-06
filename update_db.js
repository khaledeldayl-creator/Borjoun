require('dotenv').config({ path: './backend/.env' });
const fs = require('fs');
const db = require('./backend/db');
const schema = fs.readFileSync('schema.sql', 'utf8');

db.query(schema)
  .then(() => {
    console.log('Schema updated successfully');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Error updating schema:', err);
    process.exit(1);
  });
