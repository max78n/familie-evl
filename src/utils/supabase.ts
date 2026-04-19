import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://lkxfmouyutctehbydwsj.supabase.co'
const SUPABASE_KEY = 'sb_publishable_MjLQIJwR1tQq5gXEhblVVA_0tIS05Zw'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)