import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.https://zvnxhasgnokghfskpukw.supabase.co;

const supabaseAnonKey = import.meta.env.sb_publishable_sntDqpTDDontLjXbSw5fJQ_jVw7ILyG;

export const supabase = createClient(
    supabaseUrl,
    supabaseAnonKey
);