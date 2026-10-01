const { createClient } = require('@supabase/supabase-js');

const supabaseurl = process.env.SUPABASE_URL;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

const supabaseadmin = createClient(
    supabaseurl,
    supabaseSecretKey
);

console.log("supabase URL: https://fewnqkqrjlpxxztmedgy.supabase.co", process.env.SUPABASE_URL);

module.exports = supabaseadmin;