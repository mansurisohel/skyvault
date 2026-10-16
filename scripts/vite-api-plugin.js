// Serves the files in api/ during `npm run dev` and `npm run preview`, mirroring
// how Vercel serves them in production. Handlers read keys from process.env, so
// secrets stay server-side and are never injected into the client bundle.
import { existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

function toQuery(searchParams) {
  const query = {};
  for (const key of new Set(searchParams.keys())) {
    const all = searchParams.getAll(key);
    query[key] = all.length > 1 ? all : all[0];
  }
  return query;
}

function json(res, status, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(payload));
}

export default function apiPlugin({ root = process.cwd(), env = {} } = {}) {
  const apiDir = path.resolve(root, 'api');

  // Make values from .env files visible to the handlers (never to the browser:
  // only variables matching `envPrefix` are exposed to client code).
  for (const [name, value] of Object.entries(env)) {
    if (process.env[name] === undefined) process.env[name] = value;
  }

  async function middleware(req, res) {
    const url = new URL(req.url ?? '/', 'http://localhost');
    const name = url.pathname.replace(/^\/+|\/+$/g, '');
    const file = path.join(apiDir, `${name}.js`);

    // "_"-prefixed files (shared helpers) and unknown names are not routes.
    if (!/^[a-z][a-z0-9-]*$/i.test(name) || !existsSync(file)) {
      return json(res, 404, { error: { code: 'NOT_FOUND', message: `No API route named "${name}".` } });
    }

    req.query = toQuery(url.searchParams);
    try {
      const mod = await import(`${pathToFileURL(file).href}?v=${statSync(file).mtimeMs}`);
      await mod.default(req, res);
    } catch (err) {
      console.error(`[api/${name}]`, err?.message ?? err);
      if (!res.headersSent) json(res, 500, { error: { code: 'INTERNAL', message: 'Something went wrong on the server.' } });
    }
  }

  return {
    name: 'skyvault-api',
    configureServer(server) {
      server.middlewares.use('/api', middleware);
    },
    configurePreviewServer(server) {
      server.middlewares.use('/api', middleware);
    },
  };
}
