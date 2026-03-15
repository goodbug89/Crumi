const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('node:path');

dotenv.config({ path: path.join(__dirname, '../apps/web/.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

async function setupTestData() {
  const userId = '26a0390c-a8d3-40ab-9490-31ca78809cd9'; // The QA user created above

  // 1. Create Profile
  const { error: profileError } = await supabase.from('user_profiles').upsert({
    id: userId,
    display_name: 'QA Tester Full',
    email: 'qa_full@example.com',
  });

  if (profileError) {
    console.error('Profile Error:', profileError.message);
    return;
  }
  console.log('Profile created/updated');

  // 2. Create Workspace
  const { data: workspace, error: wsError } = await supabase
    .from('workspaces')
    .insert({
      name: 'QA Workspace',
      slug: 'qa-ws',
      plan: 'free',
    })
    .select()
    .single();

  if (wsError) {
    console.error('Workspace Error:', wsError.message);
    return;
  }
  console.log('Workspace created:', workspace.id);

  // 3. Create Member
  const { error: memberError } = await supabase.from('workspace_members').insert({
    workspace_id: workspace.id,
    user_id: userId,
    role: 'owner',
    status: 'active',
  });

  if (memberError) {
    console.error('Member Error:', memberError.message);
  } else {
    console.log('Member created');
  }
}

setupTestData();
