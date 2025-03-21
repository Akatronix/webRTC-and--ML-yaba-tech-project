const socket = io.connect(window.location.origin);




let myStream;
let peer;
const myVideo = document.getElementById("myVideo");
const remoteVideo = document.getElementById("remoteVideo");
const noVideo = document.getElementById("noVideo");
const loadInfo = document.getElementById("loadInfo");
let mediaRecorder;
let recordedChunks = [];
let labels = [];
let isMuted = false;

// Load models
Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
  faceapi.nets.ssdMobilenetv1.loadFromUri("/models"),
  faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
  faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
  faceapi.nets.faceExpressionNet.loadFromUri("/models"),
]).then(async () => {
  labels = await fetchFolders();
  startVideo();
});


// Detect if another user disconnects
socket.on("userDisconnected", (userId) => {
    noVideo.style.display = "flex";
    loadInfo.innerText = "Camera Disconnected, still want to continue refresh the page to connect";
  
});

function base64UrlDecode(base64Url) {
  let base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  base64 = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
  return atob(base64);
}

// Function to decode a JWT token
function decodeJwt(token) {
  try {
    const [header, payload] = token.split(".").map(base64UrlDecode);
    return { header: JSON.parse(header), payload: JSON.parse(payload) };
  } catch (error) {
    console.error("Error decoding token:", error);
    return null;
  }
}

// Check if user is authenticated
function checkTokenGoToHome() {
  const token = localStorage.getItem("token");
  const decodedUser = token ? decodeJwt(token) : null;
  if (!decodedUser || !decodedUser.payload.auth) {
    window.location.href = "/login";
  }
}



// const muterFN = () => {
//   console.log("clicked");
//   let textInfo = document.getElementById("muter");
//     if (!remoteVideo || !remoteVideo.srcObject) return;
  

//     isMuted = !isMuted;
//     remoteVideo.srcObject.getAudioTracks().forEach(track => track.enabled = !isMuted);
//     textInfo.innerText = isMuted ? "Unmute" : "Mute";

// };


const muterFN = () => {
    console.log("clicked");

    let textInfo = document.getElementById("muter");
    if (!remoteVideo || !remoteVideo.srcObject) {
        console.warn("No remote video stream available.");
        return;
    }

    isMuted = !isMuted;

    remoteVideo.srcObject.getAudioTracks().forEach(track => {
        track.enabled = !isMuted;
    });

    if (textInfo) {
        textInfo.innerText = isMuted ? "Unmute" : "Mute";
    } else {
        console.warn("Mute button element not found.");
    }
};





async function fetchFolders() {
  try {
    const response = await fetch("./folders.json");
    if (!response.ok) throw new Error("Failed to load folders.json");

    const data = await response.json();
    console.log("Folders:", data);

    const folderList = document.getElementById("folderList");
    if (folderList) {
      folderList.innerHTML = "";
      data.forEach((folder) => {
        const li = document.createElement("li");
        li.textContent = folder;
        folderList.appendChild(li);
      });
    }

    return data;
  } catch (error) {
    console.error("Error fetching data:", error);
    return [];
  }
}

// Logout functions
function logout() {
  localStorage.removeItem("token");
  window.location.href = "/login";
}
function goToUpload() {
  window.location.href = "/upload";
}

checkTokenGoToHome();

function startVideo() {
  navigator.mediaDevices
    .getUserMedia({ video: true, audio: true })
    .then((stream) => {
      myStream = stream;
      myVideo.srcObject = stream;
      myVideo.muted = true;
      socket.emit("joinRoom");

      socket.on("userConnected", (otherUserId) => {
        console.log("New user connected:", otherUserId);
        peer = new SimplePeer({
          initiator: true,
          trickle: false,
          stream: myStream,
        });

        peer.on("signal", (data) => {
          socket.emit("sendOffer", { target: otherUserId, signalData: data });
        });

        peer.on("stream", (userStream) => {
          remoteVideo.srcObject = userStream;
        });

        peer.on("error", (err) => console.error("Peer Error:", err));
      });

      socket.on("offerReceived", ({ from, signal }) => {
        console.log("Offer received from:", from);
        peer = new SimplePeer({
          initiator: false,
          trickle: false,
          stream: myStream,
        });

        peer.on("signal", (data) => {
          socket.emit("sendAnswer", { target: from, signalData: data });
        });

        peer.on("stream", (userStream) => {
          remoteVideo.srcObject = userStream;
        });

        peer.on("error", (err) => console.error("Peer Error:", err));
        peer.signal(signal);
      });

      socket.on("answerReceived", (signal) => {
        console.log("Answer received, completing connection");
        peer.signal(signal);
      });
    })
    .catch((error) => {
      console.error("Error accessing media devices:", error);
    });
}

async function getLabeledFaceDescriptions() {
  if (!labels || labels.length === 0) {
    console.error("No labels available for face recognition.");
    return [];
  }

  console.log("Loaded Labels:", labels);

  return Promise.all(
    labels.map(async (label) => {
      const descriptions = [];
      for (let i = 1; i <= 2; i++) {
        try {
          const img = await faceapi.fetchImage(`./labels/${label}/${i}.jpg`);
          const detections = await faceapi
            .detectSingleFace(img)
            .withFaceLandmarks()
            .withFaceDescriptor();
          if (detections) {
            descriptions.push(detections.descriptor);
          } else {
            console.warn(`No face detected in ${label}/${i}.jpg`);
          }
        } catch (error) {
          console.error(`Error processing image ${label}/${i}.jpg`, error);
        }
      }
      return new faceapi.LabeledFaceDescriptors(label, descriptions);
    })
  );
}

remoteVideo.onplay = async () => {

  console.log("Remote video started playing, initializing face recognition.");
  noVideo.style.display = "none";
  const labeledFaceDescriptors = await getLabeledFaceDescriptions();
  const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors);

  const canvas = faceapi.createCanvasFromMedia(remoteVideo);
  remoteVideo.parentNode.appendChild(canvas);

  canvas.style.position = "absolute";
  canvas.style.top = "0";
  canvas.style.left = "0";
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  canvas.style.pointerEvents = "none";

  const displaySize = {
    width: remoteVideo.clientWidth,
    height: remoteVideo.clientHeight,
  };
  faceapi.matchDimensions(canvas, displaySize);

  setInterval(async () => {
    if (remoteVideo.videoWidth === 0 || remoteVideo.videoHeight === 0) return;

    const detections = await faceapi
      .detectAllFaces(remoteVideo, new faceapi.SsdMobilenetv1Options())
      .withFaceLandmarks()
      .withFaceDescriptors();

    const resizedDetections = faceapi.resizeResults(detections, displaySize);

    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);

    const results = resizedDetections.map((d) =>
      faceMatcher.findBestMatch(d.descriptor)
    );

    results.forEach((result, i) => {
      const box = resizedDetections[i].detection.box;
      const drawBox = new faceapi.draw.DrawBox(box, {
        label: result.toString(),
      });
      drawBox.draw(canvas);
    });
  }, 100);
};




