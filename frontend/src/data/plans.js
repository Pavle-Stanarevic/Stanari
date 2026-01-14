  const plans = [
    {
      id: "basic",
      title: "Basic",
      priceMonthly: 5,
      priceYearly: 50,
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
      priceMonthly: 10,
      priceYearly: 100,
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
      priceMonthly: 20,
      priceYearly: 200,
      features: [
        "Sve iz Standard paketa",
        "Prodaja keramičkih proizvoda u webshopu",
        "Sudjelovanje i organizacija izložbi",
        "Recenzije i ocjene kupaca i polaznika",
        "Istaknuti profil i prioritetna podrška",
      ],
    },
  ];

  export default plans;