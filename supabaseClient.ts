import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://iyvahxqltsnqlafycpwa.supabase.co';
const supabaseAnonKey = 'sb_publishable_054LDVgC6aUmGsd5OCPHYA_4qX3Hko6';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
