const { MongoClient } = require('mongodb');

/**
 * Represents a MongoDB Client.
 */
class DBClient {
  /**
     * Creates a new DBClient instance.
     */
  constructor() {
    const host = process.env.DB_HOST || 'localhost';
    const port = process.env.DB_PORT || 27017;
    const database = process.env.DB_DATABASE || 'files_manager';

    this.mongoUri = `mongodb://${host}:${port}/${database}`;
    this.client = new MongoClient(this.mongoUri, { useUnifiedTopology: true });

    this.db = null; // Placeholder for the MongoDB database connection
  }

  async connect() {
    // eslint-disable-next-line no-useless-catch
    try {
      await this.client.connect();
      this.db = this.client.db(); // Establish the database connection
    } catch (error) {
      throw error;
    }
  }

  async isAlive() {
    try {
      // Check if the client is connected to the MongoDB server
      return this.client.isConnected();
    } catch (error) {
      return false;
    }
  }

  /**
   * Retrieves the number of users in the database.
   * @returns {Promise<Number>}
   */
  async nbUsers() {
    return this.client.db().collection('users').countDocuments();
  }

  /**
   * Retrieves the number of files in the database.
   * @returns {Promise<Number>}
   */
  async nbFiles() {
    try {
      if (!this.db) {
        throw new Error();
      }
      // Count the number of documents in the 'files' collection
      return await this.db.collection('files').countDocuments();
    } catch (error) {
      return -1;
    }
  }
}

// Create a singleton instance of the DBClient
const dbClient = new DBClient();

// Connect to the database when the module is loaded
dbClient.connect().catch(() => {
  process.exit(1); // Exit the process if unable to connect to the database
});

export default dbClient;
