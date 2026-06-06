import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainScreen from "./pages/MainScreen.jsx";
import VotePage from "./pages/VotePage.jsx";
import "./index.css";

// Strip the trailing slash from Vite's BASE_URL ("/hg_score_poll/" -> "/hg_score_poll",
// "/" -> "") so the router resolves routes under the subpath.
const basename = import.meta.env.BASE_URL.replace(/\/$/, "");

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter basename={basename}>
      <Routes>
        <Route path="/" element={<MainScreen />} />
        <Route path="/2k" element={<MainScreen big={false} />} />
        <Route path="/4k" element={<MainScreen big={true} />} />
        <Route path="/vote" element={<VotePage />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
