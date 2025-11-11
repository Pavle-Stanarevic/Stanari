import React from "react";
import "../styles/userTypeSelect.css";
import { useNavigate } from "react-router-dom";

/**
 * UserTypeSelect komponenta — omogućuje odabir vrste korisnika.
 *
 * Props:
 * - value: string — trenutno odabrani tip korisnika
 * - onChange: function — funkcija koja se poziva pri promjeni
 * - label: string (opcionalno) — tekst iznad dropdowna
 *
 * Primjer korištenja:
 * <UserTypeSelect value={values.userType} onChange={handleChange} />
 */

export default function UserTypeSelect({ value, onChange}) {
  const navigate = useNavigate();

  const handleSelectChange = (event) => {
    const selectedValue = event.target.value; //cita vrijednost iz selecta
    onChange(event); //javlja da se vrijednost promjenila

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
