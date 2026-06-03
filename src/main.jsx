import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainScreen from "./pages/MainScreen.jsx";
import VotePage from "./pages/VotePage.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainScreen />} />
        <Route path="/vote" element={<VotePage />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
