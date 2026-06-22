fetch("http://localhost:3000/api/auth/register", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ name: "Test User 9", email: "test999@example.com", password: "Password123!" })
})
.then(res => res.text())
.then(console.log)
.catch(console.error);
