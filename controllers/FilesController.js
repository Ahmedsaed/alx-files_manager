const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const dbClient = require('../utils/db');
const AuthClient = require('../utils/auth');

class FilesController {
  static async postUpload(req, res) {
    const authorization = req.header('X-Token');
    const {
      name, type, parentId = 0, isPublic = false, data,
    } = req.body;

    const user = await AuthClient.authenticateUser(authorization);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!name) {
      return res.status(400).json({ error: 'Missing name' });
    }
    if (!type || !['folder', 'file', 'image'].includes(type)) {
      return res.status(400).json({ error: 'Missing type' });
    }
    if (type !== 'folder' && !data) {
      return res.status(400).json({ error: 'Missing data' });
    }

    if (parentId !== 0) {
      const parentFile = await dbClient.getFileById(parentId);
      if (!parentFile) {
        return res.status(400).json({ error: 'Parent not found' });
      }
      if (parentFile.type !== 'folder') {
        return res.status(400).json({ error: 'Parent is not a folder' });
      }
    }

    let localPath = null;
    if (type !== 'folder') {
      const folderPath = process.env.FOLDER_PATH || '/tmp/files_manager';
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
      }
      const fileName = uuidv4();
      localPath = `${folderPath}/${fileName}`;
      const fileData = Buffer.from(data, 'base64');
      fs.writeFileSync(localPath, fileData);
    }

    const newFile = {
      userId: user._id,
      name,
      type,
      isPublic,
      parentId,
    };
    if (localPath) {
      newFile.localPath = localPath;
    }

    const insertedFile = await dbClient.createFile(newFile);

    const responseFile = {
      id: insertedFile._id,
      userId: insertedFile.userId,
      name: insertedFile.name,
      type: insertedFile.type,
      isPublic: insertedFile.isPublic,
      parentId: insertedFile.parentId,
    };
    if (insertedFile.localPath) {
      responseFile.localPath = insertedFile.localPath;
    }

    return res.status(201).json(responseFile);
  }
}

module.exports = FilesController;
