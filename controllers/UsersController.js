const { ObjectID } = require('mongodb');
const dbClient = require('../utils/db');
const redisClient = require('../utils/redis');

class UsersController {
  static async postNew(req, res) {
    const { email, password } = req.body;

    if (!email) return res.status(400).send({ error: 'Missing email' });
    if (!password) return res.status(400).send({ error: 'Missing password' });

    const userExists = await dbClient.userExists(email);
    if (userExists) return res.status(400).send({ error: 'Already exist' });

    const user = await dbClient.createUser(email, password);
    const id = `${user.insertedId}`;
    return res.status(201).json({ id, email }).end();
  }

  static async getMe(request, response) {
    const token = request.header('X-Token');
    const key = `auth_${token}`;
    const userId = await redisClient.get(key);
    if (userId) {
      const users = dbClient.db.collection('users');
      const idObject = new ObjectID(userId);
      users.findOne({ _id: idObject }, (err, user) => {
        if (user) {
          response.status(200).json({ id: userId, email: user.email });
        } else {
          response.status(401).json({ error: 'Unauthorized' });
        }
      });
    } else {
      response.status(401).json({ error: 'Unauthorized' });
    }
  }
}

module.exports = UsersController;
