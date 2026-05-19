async function run() {
    try {
        const res = await fetch('http://127.0.0.1:5000/api/purchases/payments-made/all?companyId=1');
        const payments = await res.json();
        console.log("Found", payments.length, "payments");
        if(payments.length > 0) {
            const id = payments[0].id;
            const detail = await fetch(`http://127.0.0.1:5000/api/purchases/payment/${id}`); // wait the route is /payments-made/payment/:id
            const detail2 = await fetch(`http://127.0.0.1:5000/api/purchases/payments-made/payment/${id}`);
            const data = await detail2.json();
            console.log("Allocations for", id, ":", data.billAllocations);
            console.log("Transactions:", data.Transactions.map(t => t.description));
        }
    } catch(err) { console.error(err); }
}
run();
