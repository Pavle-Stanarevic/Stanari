import React, { useState, useEffect } from "react";
import {
  PaymentElement,
  useStripe,
  useElements
} from "@stripe/react-stripe-js";

import { confirmPaymentSuccess } from "../api/subscriptions";
import useAuth from "../hooks/useAuth";
import { me } from "../api/auth";

export default function CheckoutForm({ clientSecret, paymentIntentId, userId, billing, onCancel }) {
  const stripe = useStripe();
  const elements = useElements();
  const { setUser } = useAuth();

  const [message, setMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!stripe) {
      return;
    }

    if (!clientSecret) {
      return;
    }

    stripe.retrievePaymentIntent(clientSecret).then(async ({ paymentIntent }) => {
      switch (paymentIntent.status) {
        case "succeeded":
          if (userId && paymentIntent.id) {
            try { 
              await confirmPaymentSuccess({ userId, paymentIntentId: paymentIntent.id, billing }); 
              await new Promise(resolve => setTimeout(resolve, 500));
              const u = await me();
              if (u) {
                setUser(u);
                sessionStorage.setItem("user", JSON.stringify(u));
              }
            } catch (err) { console.error(err); }
          }
          setMessage("Payment succeeded!");
          break;
        case "processing":
          setMessage("Your payment is processing.");
          break;
        case "requires_payment_method":
          break;
        default:
          setMessage("Something went wrong.");
          break;
      }
    });
  }, [stripe, clientSecret, userId]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin + "/placanje-uspjeh?userId=" + userId + "&paymentIntentId=" + paymentIntentId + (billing ? "&billing=" + billing : ""),
      },
    });

    if (error.type === "card_error" || error.type === "validation_error") {
      setMessage(error.message);
    } else {
      setMessage("An unexpected error occurred.");
    }

    setIsLoading(false);
  };

  const paymentElementOptions = {
    layout: "tabs",
  };

  return (
    <form id="payment-form" onSubmit={handleSubmit}>
      <PaymentElement id="payment-element" options={paymentElementOptions} />
      <button disabled={isLoading || !stripe || !elements} id="submit" className="cardpay-pay" style={{ marginTop: '20px' }}>
        <span id="button-text">
          {isLoading ? <div className="spinner" id="spinner"></div> : "Plati sada"}
        </span>
      </button>
      {message && <div id="payment-message" style={{ color: 'red', marginTop: '10px' }}>{message}</div>}
      <button type="button" onClick={onCancel} className="cardpay-back" style={{ marginTop: '10px' }}>
        Odustani
      </button>
    </form>
  );
}
