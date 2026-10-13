import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

Deno.serve(async request => {
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };
  if (request.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: cors });
  const authorization = request.headers.get('Authorization');
  if (!authorization?.startsWith('Bearer ')) return new Response('Unauthorized', { status: 401, headers: cors });
  const url = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !serviceKey) return new Response('Server is not configured', { status: 500, headers: cors });
  const userClient = createClient(url, Deno.env.get('SUPABASE_ANON_KEY') || '', {
    global: { headers: { Authorization: authorization } }, auth: { persistSession: false }
  });
  const { data: { user }, error: userError } = await userClient.auth.getUser(authorization.slice(7));
  if (userError || !user) return new Response('Unauthorized', { status: 401, headers: cors });
  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) return new Response('No se pudo eliminar la cuenta.', { status: 500, headers: cors });
  return new Response(null, { status: 204, headers: cors });
});
