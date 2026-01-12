import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PlanCard from "../components/planCard";
import "../styles/plan.css";

export default function Plan() {
  const [selectedPlan, setSelectedPlan] = useState("basic");
  const navigate = useNavigate();

const plans = [
  {
    id: "basic",
    title: "Basic",
    price: 5,
    features: [
      "Javni profil organizatora radionica",
      "Objava do 3 aktivne radionice",
      "Pregled prijava polaznika",
      "Rezervacije termina putem kalendara",
      "Email podrška",
    ],
  },
  {
    id: "standard",
    title: "Standard",
    price: 10,
    features: [
      "Sve iz Basic paketa",
      "Neograničen broj radionica",
      "Online plaćanje radionica (PayPal i kartice)",
      "Dodavanje galerije slika s radionica",
      "Prioritetna email podrška",
    ],
  },
  {
    id: "premium",
    title: "Premium",
    price: 20,
    features: [
      "Sve iz Standard paketa",
      "Prodaja keramičkih proizvoda u webshopu",
      "Sudjelovanje i organizacija izložbi",
      "Recenzije i ocjene kupaca i polaznika",
      "Istaknuti profil i prioritetna podrška",
    ],
  },
];


  return (
    <div className="plan-container">
      <h1 className="h1-plan">Odaberi plan</h1>

      <div className="plans">
        {plans.map((plan) => (
          <div 
            className="planItem"
            key={plan.id}
            onClick={() => setSelectedPlan(plan.id)}
          >
            <PlanCard
              key={plan.id}
              title={plan.title}
              price={plan.price}
              features={plan.features}
              selected={selectedPlan === plan.id}
              onClick={() => setSelectedPlan(plan.id)}
            />
          </div>
        ))}
      </div>

      <button
        className="continue-btn"
        onClick={() => navigate(`/checkout/${selectedPlan}`)}
      >
        Nastavi s plaćanjem
      </button>
    </div>
  );
}
