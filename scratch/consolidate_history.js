const fs = require('fs');
const path = require('path');

const appDataDir = 'C:\\Users\\Admin\\.gemini\\antigravity';
const brainDir = path.join(appDataDir, 'brain');
const outputDir = 'c:\\Users\\Admin\\Desktop\\webdoan\\gemini_chat_history';

// Create output directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Conversation titles mapping from prompt
const conversationTitles = {
  "524ab482-ab85-4b2e-a8f6-8fadaf2d3953": "Explaining Web Request Lifecycle",
  "e452c005-4a85-494e-a738-e480e9a7586f": "Drafting Backend Course Report",
  "b698eb45-b551-45d2-8d7b-5ea940242a34": "Implementing Product Pagination Support",
  "84c0acc3-77f2-4623-933c-bd5eb6967ed8": "Explaining Backend Architecture Flow",
  "782d7825-e43b-4108-be5e-7ce335c2c386": "Defining Order Status Transitions",
  "cbbf6a35-e0b1-4794-9718-67e81a1ffc24": "Verifying Order Status Updates",
  "267f6809-3bf3-4842-92d9-2af9a99c4166": "Fixing Order Lifecycle Transitions",
  "681b0165-fafe-404c-b2a4-81b4616721d2": "Filtering Expired Discount Codes",
  "7090cfce-655c-4ab0-90c4-e1e082308888": "Analyzing Backend Architecture and Operations"
};

if (!fs.existsSync(brainDir)) {
  console.error("Brain directory not found at " + brainDir);
  process.exit(1);
}

const folders = fs.readdirSync(brainDir);
let count = 0;

for (const folder of folders) {
  const logFile = path.join(brainDir, folder, '.system_generated', 'logs', 'overview.txt');
  if (fs.existsSync(logFile)) {
    const fileContent = fs.readFileSync(logFile, 'utf8');
    
    // Check if the log is related to webdoan
    if (fileContent.toLowerCase().includes('webdoan')) {
      const lines = fileContent.trim().split('\n');
      let markdownContent = '';
      let firstDate = null;
      let firstRequestText = '';
      
      const title = conversationTitles[folder] || '';
      markdownContent += `# Conversation: ${title || folder}\n`;
      markdownContent += `*Conversation ID: ${folder}*\n\n---\n\n`;
      
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const entry = JSON.parse(line);
          const dateStr = entry.created_at ? new Date(entry.created_at).toLocaleString('vi-VN') : 'Unknown';
          if (!firstDate && entry.created_at) {
            firstDate = entry.created_at;
          }
          
          if (entry.content) {
            const isUser = entry.source === 'USER_EXPLICIT' || entry.type === 'USER_INPUT';
            let text = entry.content;
            
            if (isUser) {
              if (text.includes('<USER_REQUEST>')) {
                const match = text.match(/<USER_REQUEST>([\s\S]*?)<\/USER_REQUEST>/);
                if (match) text = match[1].trim();
              }
              if (!firstRequestText) {
                firstRequestText = text.replace(/[\r\n]+/g, ' ').substring(0, 40).trim();
              }
              markdownContent += `### 👤 User (${dateStr})\n\n${text}\n\n`;
            } else {
              markdownContent += `### 🤖 Assistant (${dateStr})\n\n${text}\n\n`;
            }
            markdownContent += `---\n\n`;
          }
        } catch (e) {
          // ignore parsing error for single malformed line
        }
      }
      
      // Determine file name
      let fileNameDate = '';
      if (firstDate) {
        const d = new Date(firstDate);
        fileNameDate = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}_`;
      }
      
      let safeSubject = firstRequestText
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // remove Vietnamese diacritics
        .replace(/[^a-z0-9\s-]/g, '') // remove special chars
        .replace(/\s+/g, '_') // spaces to underscores
        .substring(0, 45);
        
      if (!safeSubject) safeSubject = 'conversation';
      
      const fileName = `${fileNameDate}${safeSubject}_${folder.substring(0, 8)}.md`;
      fs.writeFileSync(path.join(outputDir, fileName), markdownContent, 'utf8');
      count++;
    }
  }
}

console.log(`Successfully compiled ${count} conversations to ${outputDir}`);
