async function test() {
  try {
    const apiBase = process.env.PUBLIC_BASE_URL || 'http://localhost:5000';
    const res = await fetch(`${apiBase}/api/ping`);
    const text = await res.text();
    console.log("Ping:", text);
  } catch (err) {
    console.log("Ping Error:", err.message);
  }
}
test();
