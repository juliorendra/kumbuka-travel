import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const ADMIN_PASSWORD = Deno.env.get('ADMIN_PASSWORD')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { password, action, id, videoUrl } = await req.json()

    if (password !== ADMIN_PASSWORD) {
      return new Response(JSON.stringify({ error: 'Senha incorreta' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

    if (action === 'list') {
      const { data, error } = await supabase
        .from('depoimentos')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return new Response(JSON.stringify({ data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    } else if (action === 'approve') {
      const { error } = await supabase.from('depoimentos').update({ status: 'approved' }).eq('id', id)
      if (error) throw error
    } else if (action === 'delete') {
      if (videoUrl) {
        const path = videoUrl.match(/public\/videos-depoimentos\/(.+)$/)?.[1]
        if (path) await supabase.storage.from('videos-depoimentos').remove([path])
      }
      const { error } = await supabase.from('depoimentos').delete().eq('id', id)
      if (error) throw error
    } else {
      return new Response(JSON.stringify({ error: 'Ação inválida' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})