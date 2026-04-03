/** @type {import('@remix-run/dev').AppConfig} */
module.exports = {
  server: './server.ts',
  serverModuleFormat: 'esm',
  serverPlatform: 'neutral',
  serverConditions: ['workerd', 'worker'],
};
