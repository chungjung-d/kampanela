import { createServer } from './server.ts';

export { createServer, type KampanelaServer, type CreateServerOptions } from './server.ts';

const isMain = import.meta.main;
if (isMain) {
  const port = Number(process.env['KAMPANELA_PORT'] ?? 7357);
  const { server } = createServer({ port });
  console.log(JSON.stringify({ level: 'info', msg: 'kampanela server listening', port: server.port }));
}
