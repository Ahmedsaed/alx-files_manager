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
    this.connected = false;

    this.mongoUri = `mongodb://${host}:${port}/${database}`;
    this.client = new MongoClient(this.mongoUri, { useUnifiedTopology: true });

    this.client.connect().then(() => {
      this.db = this.client.db(database);
      this.connected = true;
    })
      .catch((error) => {
        console.log(error.message);
      });
  }

  isAlive() {
    return this.connected;
  }

  /**
   * Retrieves the number of users in the database.
   * @returns {Promise<Number>}
   */
  async nbUsers() {
    const users = await this.db.collection('users').countDocuments();
    return users;
  }

  /**
   * Retrieves the number of files in the database.
   * @returns {Promise<Number>}
   */
  async nbFiles() {
    const files = await this.db.collection('files').countDocuments();
    return files;
  }
}

const dbClient = new DBClient();

module.exports = dbClient;
