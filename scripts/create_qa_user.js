const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('node:path');

dotenv.config({ path: path.join(__dirname, '../apps/web/.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

async function createQAUser() {
  const { data, error } = await supabase.auth.admin.createUser({
    email: 'qa_full@example.com',
    password: 'qa_password_123!',
    email_confirm: true,
    user_metadata: { display_name: 'QA Tester Full' },
  });
  if (error) {
    console.error('Error:', error.message);
  } else {
    console.log('User created:', data.user.id);
  }
}

createQAUser();
