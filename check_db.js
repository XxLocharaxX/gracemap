import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gppwsnzwuazlqgpveqnm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdwcHdzbnp3dWF6bHFncHZlcW5tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1NjU4MTEsImV4cCI6MjA5NzE0MTgxMX0.Q14vPCsPyg9w4h9DVMt8GmPWcc_atAI32RnpiGU2KtU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase.from('profiles').select('*').limit(1);
  if (error) {
    console.error('Error fetching profiles:', error.message);
  } else {
    console.log('Profiles table exists. Data:', data);
  }
}

check();
