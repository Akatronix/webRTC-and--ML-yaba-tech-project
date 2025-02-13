// require("dotenv").config();
// const express = require("express");
// const http = require("http");
// const socketIo = require("socket.io");
// const cors = require("cors");
// const multer = require("multer");
// const fs = require("fs");
// const path = require("path");
// const jwt = require("jsonwebtoken");
// const { saveFolderName } = require("./SaveNames");

// const app = express();
// const server = http.createServer(app);
// const io = socketIo(server, {
//   cors: { origin: "*", methods: ["GET", "POST"] },
// });

// app.use(cors());
// app.use(express.json());
// app.use(express.static("public"));

// app.get("/login", (req, res) => {
//   res.sendFile(path.join(__dirname, "public", "login/login.html"));
// });
// app.post("/login", (req, res) => {
//   const { email, password } = req.body;
//   console.log(req.body);
//   if (!email && !password)
//     return res.status(400).send({ message: "Wrong Crendetials" });


//   console.log(process.env.USER_EMAIL);
//   console.log(process.env.USER_PASSWORD);
  
//   if (
//     email !== process.env.USER_EMAIL ||
//     password !== process.env.USER_PASSWORD
//   )
//     return res.status(400).send({
//       message:
//         "Wrong Crendetials, please make sure you are putting the correct infomations",
//     });
//   const token = generateToken();

//   res.status(200).send({ message: "Successfully loggedIn", token: token });
// });

// app.get("/upload", (req, res) => {
//   res.sendFile(path.join(__dirname, "public", "upload/upload.html"));
// });

// const labelsFolder = path.join(__dirname, "./public/labels");
// if (!fs.existsSync(labelsFolder)) {
//   fs.mkdirSync(labelsFolder, { recursive: true });
// }

// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     const folderName = req.body.folderName;
//     if (!folderName) {
//       return cb(new Error("Folder name is required"), null);
//     }

//     const uploadPath = path.join(labelsFolder, folderName);
//     fs.mkdirSync(uploadPath, { recursive: true });

//     req.uploadPath = uploadPath;
//     cb(null, uploadPath);
//   },
//   filename: (req, file, cb) => {
//     if (!req.fileCount) req.fileCount = 0;
//     req.fileCount++;
//     cb(null, `${req.fileCount}.jpg`);
//   },
// });

// const upload = multer({ storage }).array("images", 2);

// app.post("/upload", (req, res) => {
//   upload(req, res, (err) => {
//     if (err) {
//       return res
//         .status(500)
//         .json({ message: "Upload failed", error: err.message });
//     }
//     const myLabelName = req.body.folderName;
//     saveFolderName(myLabelName);
//     res.json({
//       message: "Images uploaded successfully!",
//       folder: req.uploadPath,
//       files: req.files.map((file) => file.filename),
//     });
//   });
// });

// const generateToken = () => {
//   return jwt.sign({ auth: true }, process.env.JWT_SERCET_KEY, {
//     expiresIn: "1d",
//   });
// };

// let users = [];

// io.on("connection", (socket) => {
//   console.log("User connected:", socket.id);
//   users.push(socket.id);

//   if (users.length === 2) {
//     io.to(users[0]).emit("userConnected", users[1]);
//     io.to(users[1]).emit("userConnected", users[0]);
//   }

//   socket.on("sendOffer", ({ target, signalData }) => {
//     io.to(target).emit("offerReceived", {
//       from: socket.id,
//       signal: signalData,
//     });
//   });

//   socket.on("sendAnswer", ({ target, signalData }) => {
//     io.to(target).emit("answerReceived", signalData);
//   });

//   socket.on("disconnect", () => {
//     console.log("User disconnected:", socket.id);
//     users = users.filter((user) => user !== socket.id);
//   });













require("dotenv").config();
const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const jwt = require("jsonwebtoken");
const { saveFolderName } = require("./SaveNames");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login/login.html"));
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).send({ message: "Wrong Credentials" });
  }

  if (
    email !== process.env.USER_EMAIL ||
    password !== process.env.USER_PASSWORD
  ) {
    return res.status(400).send({
      message:
        "Wrong Credentials, please make sure you are putting the correct information.",
    });
  }

  const token = generateToken();
  res.status(200).send({ message: "Successfully logged in", token });
});

app.get("/upload", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "upload/upload.html"));
});

const labelsFolder = path.join(__dirname, "./public/labels");
if (!fs.existsSync(labelsFolder)) {
  fs.mkdirSync(labelsFolder, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const folderName = req.body.folderName;
    if (!folderName) {
      return cb(new Error("Folder name is required"), null);
    }

    try {
      const uploadPath = path.join(labelsFolder, folderName);
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
      }
      req.uploadPath = uploadPath;
      cb(null, uploadPath);
    } catch (error) {
      cb(error, null);
    }
  },
  filename: (req, file, cb) => {
    if (!req.fileCount) req.fileCount = 0;
    req.fileCount++;
    cb(null, `${req.fileCount}.jpg`);
  },
});

const upload = multer({ storage }).array("images", 2);

app.post("/upload", (req, res) => {
  upload(req, res, (err) => {
    if (err) {
      return res
        .status(500)
        .json({ message: "Upload failed", error: err.message });
    }
    const myLabelName = req.body.folderName;
    saveFolderName(myLabelName);
    res.json({
      message: "Images uploaded successfully!",
      folder: req.uploadPath,
      files: req.files.map((file) => file.filename),
    });
  });
});

const generateToken = () => {
  return jwt.sign({ auth: true }, process.env.JWT_SERCET_KEY, {
    expiresIn: "1d",
  });
};

let users = [];

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);
  users.push(socket.id);

  users.forEach((user) => {
    if (user !== socket.id) {
      io.to(user).emit("userConnected", socket.id);
      io.to(socket.id).emit("userConnected", user);
    }
  });

  socket.on("sendOffer", ({ target, signalData }) => {
    io.to(target).emit("offerReceived", {
      from: socket.id,
      signal: signalData,
    });
  });

  socket.on("sendAnswer", ({ target, signalData }) => {
    io.to(target).emit("answerReceived", signalData);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    users = users.filter((user) => user !== socket.id);

      io.emit("userDisconnected", socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// });

// const PORT = process.env.PORT || 5000;
// server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
