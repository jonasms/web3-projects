import React from 'react';
import { Routes, Route } from "react-router-dom";
import Login from "./Login";
import InvestorPortal from "./InvestorPortal";


const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/investor" element={<InvestorPortal />} />
    </Routes>
  )
}

export default App;
