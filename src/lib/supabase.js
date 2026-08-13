import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yvqfnrszcjlgzdqtgafr.supabase.co';
const supabaseKey = 'sb_publishable_B9630kcdsUpCAjUyngRpSQ_mMtlj4Te';

export const supabase = createClient(supabaseUrl, supabaseKey);
