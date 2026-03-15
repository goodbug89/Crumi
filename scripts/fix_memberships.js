const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('node:path');

dotenv.config({ path: path.join(__dirname, '../apps/web/.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

async function fixMemberships() {
  const userId = '26a0390c-a8d3-40ab-9490-31ca78809cd9';

  // Get all workspaces
  const { data: workspaces, error: wsError } = await supabase
    .from('workspaces')
    .select('id, name, slug');

  if (wsError) {
    console.error('Error fetching workspaces:', wsError.message);
    return;
  }

  for (const ws of workspaces) {
    // Check if membership exists
    const { data: member, error: memberError } = await supabase
      .from('workspace_members')
      .select('id')
      .eq('workspace_id', ws.id)
      .eq('user_id', userId)
      .maybeSingle();

    if (!member) {
      console.log(`Adding member for workspace: ${ws.name} (${ws.slug})`);
      const { error: insertError } = await supabase.from('workspace_members').insert({
        workspace_id: ws.id,
        user_id: userId,
        role: 'owner',
        status: 'active',
      });

      if (insertError) {
        console.error(`Error adding member for ${ws.name}:`, insertError.message);
      } else {
        console.log(`Successfully added member for ${ws.name}`);
      }
    } else {
      console.log(`Member already exists for ${ws.name}`);
    }
  }
}

fixMemberships();
