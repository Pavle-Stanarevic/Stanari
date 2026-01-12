import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/placanje.css";

export default function Placanje() {
  return(
    <div>
      <div className="nacin-placanja">
        <h1 className="h1-plan">Odaberi način plaćanja</h1>
        <p>Izmjenite svoje plaćanje bilokad</p>
      </div>

      <h2 className="Vaša pretplata"></h2>
      <div className="vas-plan-container">

      </div>
    </div>
  )
}