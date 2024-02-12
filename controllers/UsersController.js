const dbClient = require('../utils/db');

class UsersController {
  static async postNew(req, res) {
    const { email, password } = req.body;

    if (!email) return res.status(400).send({ error: 'Missing email' });
    if (!password) return res.status(400).send({ error: 'Missing password' });

    const userExists = await dbClient.userExists(email);
    if (userExists) return res.status(400).send({ error: 'Already exist' });

    console.log(password);

    const user = await dbClient.createUser(email, password);
    const id = `${user.insertedId}`;
    res.status(201).json({ id, email });
    res.end();

    return res.send();
  }
}

module.exports = UsersController;
