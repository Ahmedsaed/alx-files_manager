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

    this.client.connect();
    this.db = this.client.db();
  }

  isAlive() {
    return this.client.isConnected();
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

export default dbClient;
