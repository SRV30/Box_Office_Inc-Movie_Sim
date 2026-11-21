import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { GoogleOAuthProvider } from '@react-oauth/google';
import "./index.css";
import App from "./App.jsx";
import { Provider } from "react-redux";
import { store } from "./app/store";
import { ThemeProvider } from "./context/ThemeContext";
import { AccessibilityProvider } from "./context/AccessibilityContext";

const rawGoogleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const googleClientId =
  rawGoogleClientId &&
  rawGoogleClientId.trim() !== "" &&
  rawGoogleClientId !== "placeholder-client-id" &&
  !rawGoogleClientId.includes("placeholder")
    ? rawGoogleClientId.trim()
    : null;

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Provider store={store}>
      <ThemeProvider>
        <AccessibilityProvider>
          {googleClientId ? (
            <GoogleOAuthProvider clientId={googleClientId}>
              <App />
            </GoogleOAuthProvider>
          ) : (
            <App />
          )}
        </AccessibilityProvider>
      </ThemeProvider>
    </Provider>
  </StrictMode>,
);
