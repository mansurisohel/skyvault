export function mockReq(query = {}, method = 'GET') {
  return { method, query };
}

export function mockRes() {
  const res = {
    statusCode: 200,
    headers: {},
    body: undefined,
    setHeader(k, v) { this.headers[k.toLowerCase()] = v; },
    end(b) { this.body = b; },
  };
  res.json = () => JSON.parse(res.body);
  return res;
}

export function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
}

/** Routes stubbed fetch calls by URL substring. */
export function routeFetch(routes) {
  const calls = [];
  const impl = async (url) => {
    calls.push(String(url));
    for (const [match, responder] of routes) {
      if (String(url).includes(match)) return typeof responder === 'function' ? responder(String(url)) : responder;
    }
    throw new Error(`Unrouted fetch: ${String(url).split('?')[0]}`);
  };
  impl.calls = calls;
  return impl;
}
