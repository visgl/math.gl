/* eslint-disable import/no-extraneous-dependencies */
import fs from 'fs/promises';
import {fileURLToPath} from 'url';
import {defineConfig} from 'vite';

const projectRoot = fileURLToPath(new URL('../..', import.meta.url));

export default defineConfig(async () => ({
  base: './',
  resolve: {alias: await getAliases('@math.gl', projectRoot)},
  server: {open: true}
}));

/** Resolves math.gl packages directly to local source. */
async function getAliases(
  frameworkName: string,
  frameworkRootDir: string
): Promise<Record<string, string>> {
  const modules = await fs.readdir(`${frameworkRootDir}/modules`);
  const aliases: Record<string, string> = {};
  for (const moduleName of modules) {
    aliases[`${frameworkName}/${moduleName}`] = `${frameworkRootDir}/modules/${moduleName}/src`;
  }
  return aliases;
}
