const { createClient } = require('@supabase/supabase-js');

let client;

function bucket() {
  if (!client) {
    if (!process.env.SUPABASE_URL ||
        !process.env.SUPABASE_SERVICE_KEY) {
      throw new Error('Thieu cau hinh Supabase trong .env');
    }

    client = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false
        }
      }
    );
  }

  return client.storage.from('attachments');
}

module.exports = { bucket };