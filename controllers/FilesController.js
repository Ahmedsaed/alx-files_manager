const fs = require('fs');
const mime = require('mime-types');
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

  static async getShow(req, res) {
    const authorization = req.header('X-Token');
    const fileId = req.params.id;

    console.log(req.params);

    const user = await AuthClient.authenticateUser(authorization);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const file = await dbClient.getFileById(fileId);
    if (!file || file.userId !== user._id) {
      return res.status(404).json({ error: 'Not found' });
    }

    return res.status(200).json(file);
  }

  static async getIndex(req, res) {
    const authorization = req.header('X-Token');
    const { parentId = 0, page = 0 } = req.query;

    const user = await AuthClient.authenticateUser(authorization);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const files = await dbClient.getFilesByParentId(user._id, parentId, page);

    const responseFiles = files.map((file) => ({
      id: file._id,
      userId: file.userId,
      name: file.name,
      type: file.type,
      isPublic: file.isPublic,
      parentId: file.parentId,
    }));

    return res.status(201).json(responseFiles);
  }

  static async putPublish(req, res) {
    const authorization = req.header('X-Token');
    const fileId = req.params.id;

    const user = await AuthClient.authenticateUser(authorization);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const file = await dbClient.getFileById(fileId);
    if (!file || file.userId !== user._id) {
      return res.status(404).json({ error: 'Not found' });
    }

    file.isPublic = true;
    await dbClient.updateFile(fileId, file);

    return res.status(200).json(file);
  }

  static async putUnpublish(req, res) {
    const authorization = req.header('X-Token');
    const fileId = req.params.id;

    const user = await AuthClient.authenticateUser(authorization);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const file = await dbClient.getFileById(fileId);
    if (!file || file.userId !== user._id) {
      return res.status(404).json({ error: 'Not found' });
    }

    file.isPublic = false;
    await dbClient.updateFile(fileId, file);

    return res.status(200).json(file);
  }

  static async getFile(req, res) {
    const authorization = req.header('X-Token');
    const fileId = req.params.id;

    const user = await AuthClient.authenticateUser(authorization);
    const file = await dbClient.getFileById(fileId);

    if (!file) {
      return res.status(404).json({ error: 'Not found' });
    }

    if (!file.isPublic && (!user || user._id !== file.userId)) {
      return res.status(404).json({ error: 'Not found' });
    }

    if (file.type === 'folder') {
      return res.status(400).json({ error: "A folder doesn't have content" });
    }

    if (!file.localPath || !fs.existsSync(file.localPath)) {
      return res.status(404).json({ error: 'Not found' });
    }

    const mimeType = mime.contentType(file.name);

    const data = fs.readFileSync(file.localPath);

    res.setHeader('Content-Type', mimeType);
    return res.send(data);
  }
}

module.exports = FilesController;
