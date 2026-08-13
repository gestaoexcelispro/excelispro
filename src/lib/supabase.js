import { createClient } from '@supabase/supabase-js';

// Tenta pegar do cofre da Vercel. Se falhar, usa as chaves diretamente (Plano B seguro).
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://yvqfnrszcjlgzdqtgafr.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_B9630kcdsUpCAjUyngRpSQ_mMtlj4Te';

export const supabase = createClient(supabaseUrl, supabaseKey);
