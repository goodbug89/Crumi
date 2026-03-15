const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('node:path');

dotenv.config({ path: path.join(__dirname, '../apps/web/.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

async function checkTables() {
  console.log('Checking database content...');

  const {
    data: workspaces,
    count: wsCount,
    error: wsError,
  } = await supabase.from('workspaces').select('*', { count: 'exact' });

  if (wsError) {
    console.log('Workspaces error:', wsError.message);
  } else {
    console.log(`Workspaces: ${wsCount} rows`);
    workspaces.forEach((ws) => console.log(`- ${ws.name} (${ws.slug})`));
  }

  const { count: memberCount, error: memberError } = await supabase
    .from('workspace_members')
    .select('*', { count: 'exact', head: true });

  if (memberError) {
    console.log('Members error:', memberError.message);
  } else {
    console.log(`Workspace Members: ${memberCount} rows`);
  }
}

checkTables();
