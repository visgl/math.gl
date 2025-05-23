import fs from 'fs/promises';
import {defineConfig} from 'vite';

/** @see https://vitejs.dev/config/ */
export default defineConfig(async () => ({
  resolve: {alias: await getAliases('@math.gl', `${__dirname}/../..`)},
  server: {open: true}
}));

/** Run against local source */
const getAliases = async (frameworkName, frameworkRootDir) => {
  const modules = await fs.readdir(`${frameworkRootDir}/modules`);
  const aliases = {};
  for (const module of modules) {
    aliases[`${frameworkName}/${module}`] = `${frameworkRootDir}/modules/${module}/src`;
  }
  return aliases;
};
