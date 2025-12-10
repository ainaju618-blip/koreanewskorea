const fs = require('fs');
const path = 'd:\\cbt\\koreanews\\.env';
const content = `NEXT_PUBLIC_SUPABASE_URL=https://xdcxfaoucvzfryhczmy.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhkY3hmYW91Y3Z6ZnJyeWhjem15Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4NjA5MjAsImV4cCI6MjA4MDQzNjkyMH0.mc_IQ_CrmR4djs7f7lkI8qHh9p3ozwwJ8tzkreMLask
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhkY3hmYW91Y3Z6ZnJyeWhjem15Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4NjA5MjAsImV4cCI6MjA4MDQzNjkyMH0.mc_IQ_CrmR4djs7f7lkI8qHh9p3ozwwJ8tzkreMLask
OPENAI_API_KEY=
`;

fs.writeFileSync(path, content, { encoding: 'utf8' });
console.log('.env file updated successfully');
