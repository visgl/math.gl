// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {existsSync, readdirSync, readFileSync, realpathSync, statSync} from 'node:fs';
import {builtinModules} from 'node:module';
import {dirname, join, relative, resolve, sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import ts from 'typescript';

const defaultExamplesRoot = fileURLToPath(new URL('../../examples/', import.meta.url));
const ignored = new Set(['node_modules', 'dist', 'build', '.git', '.vite']);
const sourceFile = /\.(?:[cm]?[jt]sx?|css|html)$/;
const builtins = new Set(
  builtinModules.flatMap(name => [name.replace(/^node:/, ''), `node:${name.replace(/^node:/, '')}`])
);
const within = (file, directory) => file === directory || file.startsWith(directory + sep);

function filesIn(directory) {
  return readdirSync(directory, {withFileTypes: true}).flatMap(entry => {
    if (ignored.has(entry.name)) return [];
    const file = join(directory, entry.name);
    return entry.isDirectory() ? filesIn(file) : [file];
  });
}

function codeReferences(file, text, lineOffset = 0) {
  const ast = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true);
  const bindings = new Map();
  const references = [];
  const traverse = (node, visit) => {
    visit(node);
    ts.forEachChild(node, child => traverse(child, visit));
    node.jsDoc?.forEach(doc => traverse(doc, visit));
  };
  const scopeOf = node => {
    while (
      node &&
      !ts.isSourceFile(node) &&
      !ts.isBlock(node) &&
      !ts.isFunctionLike(node) &&
      !ts.isForStatement(node) &&
      !ts.isForOfStatement(node) &&
      !ts.isForInStatement(node) &&
      !ts.isCatchClause(node)
    )
      node = node.parent;
    return node;
  };
  const bind = (scope, name, value) => {
    if (!bindings.has(scope)) bindings.set(scope, new Map());
    if (ts.isIdentifier(name)) bindings.get(scope).set(name.text, value);
    else if (ts.isObjectBindingPattern(name) || ts.isArrayBindingPattern(name)) {
      for (const element of name.elements)
        if (ts.isBindingElement(element)) bind(scope, element.name, value);
    }
  };
  // Only literal const bindings are trusted; local parameters and mutable bindings shadow them.
  traverse(ast, node => {
    if (ts.isVariableDeclaration(node) || ts.isParameter(node)) {
      const value =
        ts.isVariableDeclaration(node) &&
        ts.isVariableDeclarationList(node.parent) &&
        node.parent.flags & ts.NodeFlags.Const &&
        node.initializer &&
        ts.isStringLiteralLike(node.initializer)
          ? node.initializer.text
          : undefined;
      bind(scopeOf(node.parent), node.name, value);
    }
    if ((ts.isFunctionDeclaration(node) || ts.isClassDeclaration(node)) && node.name)
      bind(scopeOf(node.parent), node.name, undefined);
  });
  const constantValue = expression => {
    for (let scope = expression.parent; scope; scope = scope.parent) {
      if (bindings.get(scope)?.has(expression.text))
        return bindings.get(scope).get(expression.text);
    }
    return undefined;
  };
  const add = (node, expression, kind = 'import') => {
    const specifier = ts.isStringLiteralLike(expression)
      ? expression.text
      : ts.isIdentifier(expression)
        ? constantValue(expression)
        : undefined;
    references.push({
      specifier,
      kind,
      line: ast.getLineAndCharacterOfPosition(node.getStart(ast)).line + lineOffset + 1
    });
  };
  traverse(ast, node => {
    if (node.moduleSpecifier && ts.isStringLiteralLike(node.moduleSpecifier))
      add(node, node.moduleSpecifier);
    if (
      ts.isImportTypeNode(node) &&
      ts.isLiteralTypeNode(node.argument) &&
      ts.isStringLiteralLike(node.argument.literal)
    )
      add(node, node.argument.literal);
    if (ts.isExternalModuleReference(node) && node.expression) add(node, node.expression);
    if (ts.isCallExpression(node) && node.arguments[0]) {
      const target = node.expression;
      if (
        target.kind === ts.SyntaxKind.ImportKeyword ||
        (ts.isIdentifier(target) && target.text === 'require')
      )
        add(node, node.arguments[0]);
      if (
        ts.isPropertyAccessExpression(target) &&
        ts.isIdentifier(target.expression) &&
        target.expression.text === 'require' &&
        target.name.text === 'resolve'
      )
        add(node, node.arguments[0]);
    }
    if (
      ts.isNewExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === 'URL' &&
      node.arguments?.[0] &&
      ts.isStringLiteralLike(node.arguments[0]) &&
      node.arguments[1]?.getText(ast) === 'import.meta.url'
    )
      add(node, node.arguments[0], 'asset');
  });
  return references;
}

function referencesIn(file) {
  const text = readFileSync(file, 'utf8');
  if (/\.[cm]?[jt]sx?$/.test(file)) return codeReferences(file, text);
  const references = [];
  const line = position => text.slice(0, position).split('\n').length;
  if (file.endsWith('.css')) {
    for (const match of text.matchAll(
      /@import\s+(?:url\(\s*)?['"]([^'"]+)['"]|url\(\s*['"]?([^'"\s)]+)['"]?\s*\)/g
    )) {
      references.push({
        specifier: match[1] || match[2],
        kind: match[1] ? 'import' : 'asset',
        line: line(match.index)
      });
    }
  }
  if (file.endsWith('.html')) {
    for (const match of text.matchAll(
      /<(script|link)\b[^>]*(?:src|href)\s*=\s*['"]([^'"]+)['"][^>]*>/gi
    )) {
      references.push({
        specifier: match[2],
        kind:
          match[1].toLowerCase() === 'script' || /rel\s*=\s*['"]stylesheet['"]/i.test(match[0])
            ? 'import'
            : 'asset',
        line: line(match.index)
      });
    }
    for (const match of text.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
      if (/type\s*=\s*['"](?:importmap|application\/json)['"]/i.test(match[1])) continue;
      const offset = match.index + match[0].indexOf('>') + 1;
      references.push(...codeReferences(`${file}.js`, match[2], line(offset) - 1));
    }
  }
  return references;
}

function resolveLocal(file, specifier, project) {
  const target = specifier.startsWith('/')
    ? join(project, specifier)
    : resolve(dirname(file), specifier);
  const candidates = [
    target,
    ...['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs', '.json', '.css'].map(
      extension => target + extension
    ),
    ...['index.js', 'index.jsx', 'index.ts', 'index.tsx'].map(name => join(target, name))
  ];
  // Bundlers resolve explicit .js imports to workspace TypeScript sources too.
  if (target.endsWith('.js'))
    candidates.push(target.slice(0, -3) + '.ts', target.slice(0, -3) + '.tsx');
  const existing = candidates.find(
    candidate => existsSync(candidate) && statSync(candidate).isFile()
  );
  return existing ? realpathSync(existing) : target;
}

/** Check every project, including the dependencies its imported common helpers require. */
export function checkExampleBoundaries(examplesRoot = defaultExamplesRoot) {
  const root = realpathSync(examplesRoot);
  const common = join(root, 'common');
  const manifests = filesIn(root).filter(file => file.endsWith(`${sep}package.json`));
  const issues = [];
  const cache = new Map();
  for (const manifest of manifests) {
    const project = dirname(manifest);
    const pkg = JSON.parse(readFileSync(manifest, 'utf8'));
    const declared = new Set(
      Object.keys({
        ...pkg.dependencies,
        ...pkg.devDependencies,
        ...pkg.peerDependencies,
        ...pkg.optionalDependencies
      })
    );
    const queue = filesIn(project).filter(file => sourceFile.test(file));
    const visited = new Set();
    while (queue.length) {
      const file = queue.pop();
      if (visited.has(file)) continue;
      visited.add(file);
      if (!cache.has(file)) cache.set(file, referencesIn(file));
      for (const reference of cache.get(file)) {
        const report = reason =>
          issues.push({
            project: relative(root, project),
            file: relative(root, file),
            line: reference.line,
            specifier: reference.specifier,
            reason
          });
        if (!reference.specifier) {
          report('Cannot verify a computed module import');
          continue;
        }
        const specifier = reference.specifier.split('?')[0].split('#')[0];
        if (!specifier || builtins.has(specifier)) continue;
        if (/^(?:https?:|data:|blob:)/.test(specifier)) {
          if (reference.kind === 'import')
            report('Module URLs are not declared package dependencies');
          continue;
        }
        if (specifier.startsWith('.') || specifier.startsWith('/')) {
          const target = resolveLocal(file, specifier, project);
          if (!within(target, project) && !within(target, common))
            report('Import is outside this project and examples/common');
          else if (existsSync(target) && sourceFile.test(target)) queue.push(target);
        } else {
          const name = specifier.startsWith('@')
            ? specifier.split('/').slice(0, 2).join('/')
            : specifier.split('/')[0];
          if (!declared.has(name) && name !== pkg.name)
            report(`Package ${name} is not declared by this example`);
        }
      }
    }
  }
  return {projects: manifests.length, issues};
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = checkExampleBoundaries();
  for (const issue of result.issues) {
    // biome-ignore lint/suspicious/noConsole: This CLI identifies the offending project and import.
    console.error(
      `${issue.project}: ${issue.file}:${issue.line} ${issue.specifier ?? '(computed import)'}: ${issue.reason}`
    );
  }
  if (result.issues.length) process.exitCode = 1;
  else {
    // biome-ignore lint/suspicious/noConsole: A concise success summary makes the audit visible in CI.
    console.log(`Example import boundaries passed (${result.projects} projects).`);
  }
}
