function getApiBaseUrl() {
    const stored = localStorage.getItem('api_server_url');
    if (stored) return stored.replace(/\/+$/, '');
    const origin = window.location.origin;
    if (origin && !origin.startsWith('file://')) return origin;
    return '';
}

function postResult(data) {
    const base = getApiBaseUrl();
    if (!base) return Promise.resolve();
    return fetch(base + '/api/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    }).catch(() => {});
}
