document.addEventListener("DOMContentLoaded", () => {
  const loadingScreen = document.getElementById("loading");
  const loginPage = document.getElementById("loginPage");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const loginButton = document.getElementById("loginButton");
  const errorMessage = document.getElementById("error-message");

  let isLoading = false;

  function base64UrlDecode(base64Url) {
    let base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    base64 = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      "="
    );
    const decoded = atob(base64);
    return decoded;
  }

  // Function to decode a JWT token
  function decodeJwt(token) {
    const [header, payload, signature] = token.split(".");
    const decodedHeader = JSON.parse(base64UrlDecode(header));
    const decodedPayload = JSON.parse(base64UrlDecode(payload));
    return { header: decodedHeader, payload: decodedPayload };
  }

  //   // Check if user is already authenticated
  function checkTokenGoToHome() {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decodedUser = decodeJwt(token);
        if (decodedUser.payload.auth) {
          window.location.href = "/";
        }
      } catch (error) {
        console.error("Token decoding failed", error);
      }
    } else {
    }

    setTimeout(checkTokenGoToHome, 200);
  }

  checkTokenGoToHome();

  // Enable/Disable login button based on form data
  function updateLoginButton() {
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    loginButton.disabled = !email || !password;
    errorMessage.style.display = "block";
    errorMessage.textContent =
      email && password ? "" : "Please fill in both fields.";
    0;
  }

  // Handle form submission (Login)
  async function loginHandler(event) {
    event.preventDefault();
    isLoading = true;
    loadingScreen.style.display = "flex";
    loginPage.style.display = "none";

    const formData = {
      email: emailInput.value,
      password: passwordInput.value,
    };

    try {
      console.log(formData);
      const response = await fetch("http://localhost:5000/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      localStorage.setItem("token", data.token);
      window.location.href = "/";
    } catch (error) {
      errorMessage.style.display = "block";
      errorMessage.textContent = error.message;
    } finally {
      isLoading = false;
      loadingScreen.style.display = "none";
      loginPage.style.display = "flex";
    }
  }

  // Event Listeners
  emailInput.addEventListener("input", updateLoginButton);
  passwordInput.addEventListener("input", updateLoginButton);
  document.getElementById("loginForm").addEventListener("submit", loginHandler);

  updateLoginButton();
});
