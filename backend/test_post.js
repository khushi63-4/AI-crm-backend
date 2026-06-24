const payload = {
  object: "page",
  entry: [
    {
      id: "1098376730014578",
      time: 1600000000,
      changes: [
        {
          field: "leadgen",
          value: {
            leadgen_id: "test_lead_id_123",
            page_id: "1098376730014578"
          }
        }
      ]
    }
  ]
};

fetch("http://localhost:5000/api/leads/facebook/webhook", {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify(payload)
})
  .then(async (res) => {
    console.log("Status:", res.status);
    console.log("Text:", await res.text());
  })
  .catch((err) => {
    console.error("Fetch error:", err);
  });
