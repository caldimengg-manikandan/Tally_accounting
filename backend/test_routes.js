async function test() {
  const companyId = '00000000-0000-0000-0000-000000000000'; // dummy UUID
  const endpoints = [
    `/api/sales/orders/${companyId}`,
    `/api/ledgers/${companyId}`,
    `/api/inventory/${companyId}?type=sales`,
    `/api/projects/${companyId}`
  ];

  for (let ep of endpoints) {
    try {
      const res = await fetch(`http://localhost:5000${ep}`);
      // Wait, these endpoints might be protected by passport-jwt, returning 401.
      // But if they return 401, axios interceptor on frontend would redirect to login.
      // If it returns 500, we know it's a backend crash.
      console.log(`Endpoint ${ep}: Status ${res.status}`);
      if (res.status === 500) {
        const text = await res.text();
        console.log(`Error body for ${ep}:`, text);
      }
    } catch(err) {
      console.log(`Fetch error for ${ep}:`, err.message);
    }
  }
}
test();
