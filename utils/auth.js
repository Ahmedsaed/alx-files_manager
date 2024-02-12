const redisClient = require('./redis');
const dbClient = require('./db');

class AuthClient {
  static async authenticateUser(token) {
    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) {
      return null;
    }

    const user = await dbClient.db.collection('users').findOne({ _id: userId });
    return user;
  }
}

const authClient = new AuthClient();

module.exports = { authClient };
