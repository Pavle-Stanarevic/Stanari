import React from "react";
import "../styles/userTypeSelect.css";
import { useNavigate } from "react-router-dom";



export default function UserTypeSelect({ value, onChange}) {
  const navigate = useNavigate();

  const handleSelectChange = (event) => {
    const selectedValue = event.target.value; 
    onChange(event); 

    if(selectedValue === "polaznik"){
      navigate("/registerPolaznik");

    }else if(selectedValue === "organizator"){
      navigate("/registerOrganizator");
    }
  };


  return (
    <div className = "user-type-select">
      <select
        name="userType"
        value={value}
        onChange={handleSelectChange}
        required
      > 
        <option value="" disabled>Odaberi...</option>
        <option value="polaznik">Polaznik</option>
        <option value="organizator">Organizator</option>
      </select>
    </div>
  );
}
