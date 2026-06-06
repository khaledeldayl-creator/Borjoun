require('dotenv').config();
const db = require('./db');

async function clearOfferwalls() {
  try {
    const result = await db.query('DELETE FROM offerwalls');
    console.log(`Successfully deleted ${result.rowCount} offerwalls.`);
  } catch (err) {
    console.error('Error deleting offerwalls:', err);
  } finally {
    process.exit();
  }
}

clearOfferwalls();
