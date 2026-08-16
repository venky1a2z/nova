const NOVA_SUPABASE_URL =
    "https://jiiidaywnckvnxttfcuu.supabase.co";


const NOVA_SUPABASE_KEY =
    "sb_publishable_GaBo2LSnt5QOjdAveDDa7g_uWNV7XLJ";


const NovaSupabase =
    window.supabase.createClient(
        NOVA_SUPABASE_URL,
        NOVA_SUPABASE_KEY,
        {
            auth: {

                persistSession: true,

                autoRefreshToken: true,

                detectSessionInUrl: true

            }
        }
    );


window.NovaSupabase =
    NovaSupabase;