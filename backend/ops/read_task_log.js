const fs = require('fs');
const path = require('path');
const taskId = process.argv[2];

if (!taskId) {
  console.error('Usage: node read_task_log.js <taskId_or_log_filename>');
  process.exit(1);
}

const logDir = 'C:/Users/loges/.gemini/antigravity-ide/brain/11383197-075d-4deb-8e10-1cafe191b675/.system_generated/tasks';
const logPath = path.join(logDir, taskId.endsWith('.log') ? taskId : `${taskId}.log`);

const outputFilePath = path.join(__dirname, 'log_output.txt');
let logContent = `Reading log from: ${logPath}\n`;

try {
  if (fs.existsSync(logPath)) {
    const content = fs.readFileSync(logPath, 'utf8');
    logContent += '--- LOG CONTENT ---\n' + content + '\n--- END OF LOG ---\n';
  } else {
    logContent += `Log file not found at: ${logPath}\n`;
  }
} catch (err) {
  logContent += `Error reading log file: ${err.message}\n`;
}

fs.writeFileSync(outputFilePath, logContent, 'utf8');
console.log('Result written to log_output.txt');
