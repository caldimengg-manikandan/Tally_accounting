const ReminderService = require('./services/ReminderService');

(async () => {
    console.log("Starting test...");
    try {
        await ReminderService.processPaymentReminders();
        console.log("Success");
    } catch(e) {
        console.error("CAUGHT ERROR:", e.message);
        console.error(e.stack);
    }
    process.exit(0);
})();
