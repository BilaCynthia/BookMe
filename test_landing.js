fetch("http://localhost:3000/")
.then(res => res.text())
.then(text => {
  if (text.includes("Error")) {
    console.log(text.substring(0, 1000));
  } else {
    console.log("Success, length:", text.length);
  }
})
.catch(console.error);
