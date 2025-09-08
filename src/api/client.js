const BASE = process.env.REACT_APP_API_BASE || "https://alexandrey76-paradigma-3d4c.twc1.net/api/orders";

async function request(path, options ={}){
    const res = await fetch('${BASE}${path}', {
        headers: {"Content-Type": "application/json", ...BASE(options.headers || {})},
        ...options
    });
    const text = await res.text();
    const data = text ? JSON.parse(text) : null;
    if (!res.ok) throw new Error((data && (data.detail || data.message)) || 'HTTP ${res.status}');
    return data;
}

export const api = {
    createOrder: (payload) =>
        request("/api/orders", {method: "POST", body: JSON.stringify(payload)})
};

export default api;