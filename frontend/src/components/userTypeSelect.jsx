import React from "react";
import "../styles/userTypeSelect.css";

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
  return (
    <div className = "user-type-select">
      <select
        name="userType"
        value={value}
        onChange={onChange}
        required
      > 
        <option value="" disabled>Odaberi...</option>
        <option value="korisnik">Polaznik</option>
        <option value="organizator">Organizator</option>
      </select>
    </div>
  );
}
