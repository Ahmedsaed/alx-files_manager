const { MongoClient, ObjectID } = require('mongodb');
const sha1 = require('sha1');

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

  async userExists(email) {
    const user = await this.db.collection('users').findOne({ email });
    return user;
  }

  async createUser(email, password) {
    const hashedPassword = sha1(password);
    const user = await this.db.collection('users').insertOne({ email, password: hashedPassword });
    return user;
  }

  async createFile(fileData) {
    const result = await this.db.collection('files').insertOne(fileData);
    return result.ops[0];
  }

  async getFileById(fileId) {
    const file = await this.db.collection('files').findOne({ _id: new ObjectID(fileId) });
    return file;
  }

  async getFilesByParentId(userId, parentId, page) {
    const pipeline = [
      { // Operation 1: Filter documents
        $match: { // Filters based on specific conditions
          userId, // Matches the userId
          parentId: parentId.toString(), // Matches the parentId
        },
      },
      { // Operation 2: Skip pages before reaching this page
        $skip: page * 20, // For pagination
      },
      { // Operation 3: Limits the number of items in a page
        $limit: 20, // Only a certain num of records returned
      },
    ];

    const files = await this.db.collection('files').aggregate(pipeline).toArray();
    return files;
  }

  async updateFile(fileId, updatedFile) {
    const result = await this.db.collection('files').updateOne(
      { _id: new ObjectID(fileId) },
      { $set: updatedFile },
    );

    return result.modifiedCount > 0;
  }
}

const dbClient = new DBClient();

module.exports = dbClient;
