import React, { useState } from "react";
import { register } from "../api/auth.js";
import useAuth from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import "../styles/profil.css"


export default function Profil(){
    
  const { isAuthenticated, user, signOut} = useAuth();
  console.log("USER:", user);

  

  return(
    <div>
      <p> Vaš profil </p>
      <div className = "container-profile">
        <p> { user.firstName } </p>
        <p> ej { user.lastName } </p>
        <p> { user.email} </p>

        {user.userType === 'organizator' &&
        <p> {user.studyName } </p>}
      </div>
    </div>
  );
}