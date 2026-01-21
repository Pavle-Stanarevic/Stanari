import React from "react";
import { FaCheckCircle } from "react-icons/fa";
import "../styles/planCard.css";

export default function PlanCard({
  title,
  price,
  features,
  selected = false,
}) {
  return (
    <div className={`plan-card ${selected ? "selected" : ""}`}>
      <div className="plan-header">
        <h1 className="plan-title">{title}</h1>
        <h2 className="plan-price">{price}</h2>
      </div>

      <ul className="plan-features">
        {features.map((item, index) => (
          <li className="plan-feature" key={index}>
            <FaCheckCircle className="plan-check" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
