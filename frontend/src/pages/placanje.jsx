import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../styles/placanje.css";

export default function Placanje() {
  const navigate = useNavigate();
  const location = useLocation();

  const subscriptionId = location.state?.subscriptionId; // 🆕
  const [subscription, setSubscription] = useState(null); // 🆕
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // 🆕 dohvat pretplate s backenda
  useEffect(() => {
    if (!subscriptionId) {
      navigate("/plan");
      return;
    }

    async function loadSubscription() {
      try {
        const res = await fetch(`/api/subscriptions/${subscriptionId}`);
        if (!res.ok) throw new Error("Ne mogu dohvatiti pretplatu.");
        const data = await res.json();
        setSubscription(data);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }

    loadSubscription();
  }, [subscriptionId, navigate]);

  if (loading) return <p>Učitavanje...</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <div>
      <div className="placanje-header">
        <h1 className="h1-plan">Odaberi način plaćanja</h1>
        <p>Izmijenite svoju pretplatu bilo kad</p>
      </div>

      <div className="placanje-container">
        <h2 className="placanje-h2">Vaša pretplata</h2>

        <div className="vas-plan-container">
          <p>Vaš trenutni plan</p>

          {/* 🆕 PODACI DOLAZE IZ BACKENDA */}
          <h3>{subscription.title}</h3>
          <p>
            {subscription.amount} € ({subscription.billing})
          </p>
        </div>

        <h2 className="placanje-h2">Odaberite način plaćanja</h2>
        <div className="button-container-payment">
          <button className="payment-btn">Kartica</button>
          <button className="payment-btn">PayPal</button>
          <button className="payment-btn">Apple Pay</button>
        </div>
      </div>
    </div>
  );
}
