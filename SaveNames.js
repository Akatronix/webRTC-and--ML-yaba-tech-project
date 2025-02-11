const fs = require("fs");
const path = require("path");

const foldersFile = path.join(__dirname, "./public/folders.json");

const loadFolders = () => {
  try {
    if (!fs.existsSync(foldersFile)) {
      fs.writeFileSync(foldersFile, "[]", "utf8");
      return [];
    }

    const data = fs.readFileSync(foldersFile, "utf8");
    return data.trim() ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Error reading folders.json:", error);
    return [];
  }
};

const saveFolderName = (folderName) => {
  const folders = loadFolders();
  if (!folders.includes(folderName)) {
    folders.push(folderName);
    try {
      fs.writeFileSync(foldersFile, JSON.stringify(folders, null, 2), "utf8");
    } catch (error) {
      console.error("Error writing to folders.json:", error);
    }
  }
};

module.exports = { loadFolders, saveFolderName };
