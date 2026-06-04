function _supabaseHeaders(key) {
    return {
        'apikey': key,
        'Authorization': 'Bearer ' + key,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
    };
}

function _supabaseUrl(path) {
    const url = localStorage.getItem('supabase_url');
    return url ? url.replace(/\/+$/, '') + '/rest/v1/' + path : null;
}

function getSupabaseConfig() {
    return {
        url: localStorage.getItem('supabase_url') || '',
        anonKey: localStorage.getItem('supabase_anon_key') || '',
        serviceKey: localStorage.getItem('supabase_service_key') || ''
    };
}

function postResult(data) {
    const cfg = getSupabaseConfig();
    if (!cfg.url || !cfg.anonKey) {
        console.log('[Supabase] postResult skipped — not configured');
        return Promise.resolve();
    }
    const body = {
        test_id: data.testId || '',
        test_name: data.testName || '',
        participant: data.participant || '',
        dept: data.dept || '',
        phone: data.phone || '',
        score: data.score || '',
        answers: data.answers || '',
        date: data.date || new Date().toLocaleDateString('id-ID', { weekday:'long', year:'numeric', month:'long', day:'numeric', hour:'2-digit', minute:'2-digit' })
    };
    console.log('[Supabase] Posting result for', body.participant);
    return fetch(_supabaseUrl('results'), {
        method: 'POST',
        headers: _supabaseHeaders(cfg.anonKey),
        body: JSON.stringify(body)
    }).then(r => {
        if (!r.ok) return r.text().then(t => { throw new Error(r.status + ' ' + t); });
        console.log('[Supabase] Insert OK');
    }).catch(e => {
        console.error('[Supabase] Insert failed:', e.message);
    });
}

async function fetchResults() {
    const cfg = getSupabaseConfig();
    if (!cfg.url || !cfg.serviceKey) return [];
    try {
        const r = await fetch(_supabaseUrl('results') + '?order=id.desc', {
            headers: _supabaseHeaders(cfg.serviceKey)
        });
        if (!r.ok) throw new Error(r.status);
        return await r.json();
    } catch (e) {
        console.error('[Supabase] fetchResults error:', e.message);
        return [];
    }
}

async function sbDeleteResult(id) {
    const cfg = getSupabaseConfig();
    if (!cfg.url || !cfg.serviceKey) return false;
    try {
        const r = await fetch(_supabaseUrl('results') + '?id=eq.' + id, {
            method: 'DELETE',
            headers: _supabaseHeaders(cfg.serviceKey)
        });
        return r.ok;
    } catch (e) {
        console.error('[Supabase] sbDeleteResult error:', e.message);
        return false;
    }
}

async function sbClearAllResults() {
    const cfg = getSupabaseConfig();
    if (!cfg.url || !cfg.serviceKey) return false;
    try {
        const r = await fetch(_supabaseUrl('results') + '?id=gte.0', {
            method: 'DELETE',
            headers: _supabaseHeaders(cfg.serviceKey)
        });
        return r.ok;
    } catch (e) {
        console.error('[Supabase] sbClearAllResults error:', e.message);
        return false;
    }
}

async function getKeys() {
    const cfg = getSupabaseConfig();
    if (!cfg.url || !cfg.serviceKey) return {};
    try {
        const r = await fetch(_supabaseUrl('api_keys') + '?select=provider,key_value', {
            headers: _supabaseHeaders(cfg.serviceKey)
        });
        if (!r.ok) return {};
        const data = await r.json();
        const keys = {};
        (data || []).forEach(row => keys[row.provider] = row.key_value);
        return keys;
    } catch (e) {
        console.error('[Supabase] getKeys error:', e.message);
        return {};
    }
}

async function saveKeys(payload) {
    const cfg = getSupabaseConfig();
    if (!cfg.url || !cfg.serviceKey) return false;
    try {
        const promises = Object.entries(payload).map(([provider, key_value]) =>
            fetch(_supabaseUrl('api_keys'), {
                method: 'POST',
                headers: Object.assign(_supabaseHeaders(cfg.serviceKey), { 'Prefer': 'resolution=merge-duplicates' }),
                body: JSON.stringify({ provider, key_value, updated_at: new Date().toISOString() })
            })
        );
        const results = await Promise.all(promises);
        return results.every(r => r.ok);
    } catch (e) {
        console.error('[Supabase] saveKeys error:', e.message);
        return false;
    }
}
