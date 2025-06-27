import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { GoogleOAuthProvider } from "@react-oauth/google";

// Vérifier que l'élément root existe
const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Impossible de trouver l'élément #root dans le DOM !");
}

// Récupérer le Client ID depuis .env"""
const GOOGLE_CLIENT_ID = "212550472673-t284aqtqhbtcs80oflf6e35mck2hjkpb.apps.googleusercontent.com"


createRoot(rootElement).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <App />
    </GoogleOAuthProvider>
  </StrictMode>
);
