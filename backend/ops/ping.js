async function test() {
  try {
    const res = await fetch('http://localhost:5000/api/ping');
    const text = await res.text();
    console.log("Ping:", text);
  } catch (err) {
    console.log("Ping Error:", err.message);
  }
}
test();
