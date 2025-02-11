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

checkTokenGoToHome();

function goToHome() {
  window.location.href = "/";
}

document
  .getElementById("uploadForm")
  .addEventListener("submit", function (event) {
    event.preventDefault();

    const nameInput = document.getElementById("name").value.trim();
    const files = document.getElementById("upload").files;

    if (nameInput === "" || files.length < 2) {
      alert(
        "Please provide a folder name and select exactly 2 images, only 2 images required."
      );
      return;
    }

    const formData = new FormData();
    formData.append("folderName", nameInput);
    for (let i = 0; i < files.length; i++) {
      formData.append("images", files[i]);
    }

    fetch("http://localhost:5000/upload", {
      method: "POST",
      body: formData,
    })
      .then((response) => response.json())
      .then((data) => {
        document.getElementById("name").value = "";
        document.getElementById("upload").value = "";
        alert(data.message);
      })
      .catch((error) => console.error("Error:", error));
  });
