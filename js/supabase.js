function getSupabaseConfig() {
    const url = localStorage.getItem('supabase_url');
    const anonKey = localStorage.getItem('supabase_anon_key');
    return { url, anonKey };
}

function getServiceKey() {
    return localStorage.getItem('supabase_service_key') || '';
}

function initSupabase() {
    const { url, anonKey } = getSupabaseConfig();
    if (!url || !anonKey || typeof supabase === 'undefined') return null;
    return supabase.createClient(url, anonKey);
}

function initSupabaseService() {
    const { url } = getSupabaseConfig();
    const serviceKey = getServiceKey();
    if (!url || !serviceKey || typeof supabase === 'undefined') return null;
    return supabase.createClient(url, serviceKey);
}

function postResult(data) {
    const sb = initSupabase();
    if (!sb) return Promise.resolve();
    return sb.from('results').insert({
        test_id: data.testId || '',
        test_name: data.testName || '',
        participant: data.participant || '',
        dept: data.dept || '',
        phone: data.phone || '',
        score: data.score || '',
        answers: data.answers || '',
        date: data.date || new Date().toLocaleDateString('id-ID', { weekday:'long', year:'numeric', month:'long', day:'numeric', hour:'2-digit', minute:'2-digit' })
    }).catch(() => {});
}

async function fetchResults() {
    const sb = initSupabaseService();
    if (!sb) return [];
    const { data, error } = await sb.from('results').select('*').order('id', { ascending: false });
    if (error) return [];
    return data || [];
}

async function sbDeleteResult(id) {
    const sb = initSupabaseService();
    if (!sb) return false;
    const { error } = await sb.from('results').delete().eq('id', id);
    return !error;
}

async function sbClearAllResults() {
    const sb = initSupabaseService();
    if (!sb) return false;
    const { error } = await sb.from('results').delete().neq('id', 0);
    return !error;
}

async function getKeys() {
    const sb = initSupabaseService();
    if (!sb) return {};
    const { data, error } = await sb.from('api_keys').select('*');
    if (error) return {};
    const keys = {};
    (data || []).forEach(row => keys[row.provider] = row.key_value);
    return keys;
}

async function saveKeys(payload) {
    const sb = initSupabaseService();
    if (!sb) return false;
    const upserts = Object.entries(payload).map(([provider, key_value]) =>
        sb.from('api_keys').upsert({ provider, key_value, updated_at: new Date().toISOString() }, { onConflict: 'provider' })
    );
    const results = await Promise.all(upserts);
    return results.every(r => !r.error);
}
