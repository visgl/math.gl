import {decode, encode} from '@jridgewell/sourcemap-codec';
import {access, readdir, readFile, writeFile} from 'node:fs/promises';
import path from 'node:path';
import ts from 'typescript';

/**
 * Adds runtime extensions to relative module specifiers after TypeScript emit.
 *
 * The native TypeScript 7 compiler does not load JavaScript custom transformers.
 * Keeping this narrow transformation outside the compiler lets source files retain
 * extensionless imports while still producing standards-compliant Node ESM.
 */
export async function rewriteModuleSpecifiers(moduleDirectories) {
  let rewrittenFileCount = 0;
  let rewrittenSpecifierCount = 0;

  for (const moduleDirectory of moduleDirectories) {
    const distDirectory = path.join(moduleDirectory, 'dist');
    const outputFiles = await findOutputFiles(distDirectory);

    for (const outputFile of outputFiles) {
      const result = await rewriteOutputFile(outputFile);
      if (result > 0) {
        rewrittenFileCount++;
        rewrittenSpecifierCount += result;
      }
    }
  }

  console.log(
    `Rewrote ${rewrittenSpecifierCount} relative module specifiers in ` +
      `${rewrittenFileCount} emitted files.`
  );
}

async function rewriteOutputFile(outputFile) {
  const source = await readFile(outputFile, 'utf8');
  const sourceFile = ts.createSourceFile(outputFile, source, ts.ScriptTarget.Latest, true);
  const isDeclaration = outputFile.endsWith('.d.ts');
  const insertionsByPosition = new Map();
  const pendingSpecifiers = [];

  visit(sourceFile);

  for (const {literal, specifier} of pendingSpecifiers) {
    const suffix = await resolveOutputSuffix(outputFile, specifier, isDeclaration);
    insertionsByPosition.set(literal.end - 1, suffix);
  }

  const insertions = [...insertionsByPosition]
    .map(([position, text]) => {
      const location = sourceFile.getLineAndCharacterOfPosition(position);
      return {position, text, line: location.line, column: location.character};
    })
    .sort((left, right) => right.position - left.position);

  if (insertions.length === 0) {
    return 0;
  }

  let rewrittenSource = source;
  for (const insertion of insertions) {
    rewrittenSource =
      rewrittenSource.slice(0, insertion.position) +
      insertion.text +
      rewrittenSource.slice(insertion.position);
  }

  await writeFile(outputFile, rewrittenSource);
  await shiftSourceMap(outputFile, insertions);
  return insertions.length;

  function visit(node) {
    if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) {
      record(node.moduleSpecifier);
    } else if (
      ts.isCallExpression(node) &&
      (node.expression.kind === ts.SyntaxKind.ImportKeyword ||
        (ts.isIdentifier(node.expression) && node.expression.text === 'require'))
    ) {
      record(node.arguments[0]);
    } else if (
      ts.isImportTypeNode(node) &&
      ts.isLiteralTypeNode(node.argument)
    ) {
      record(node.argument.literal);
    } else if (
      ts.isImportEqualsDeclaration(node) &&
      ts.isExternalModuleReference(node.moduleReference)
    ) {
      record(node.moduleReference.expression);
    }
    ts.forEachChild(node, visit);
  }

  function record(literal) {
    if (!literal || !ts.isStringLiteralLike(literal)) {
      return;
    }
    const specifier = literal.text;
    if (
      (specifier.startsWith('./') || specifier.startsWith('../')) &&
      path.posix.extname(specifier) === ''
    ) {
      pendingSpecifiers.push({literal, specifier});
    }
  }
}

async function resolveOutputSuffix(outputFile, specifier, isDeclaration) {
  const target = path.resolve(path.dirname(outputFile), specifier);
  const fileExtension = isDeclaration ? '.d.ts' : '.js';
  const candidates = [
    {target: `${target}${fileExtension}`, suffix: '.js'},
    {target: path.join(target, `index${fileExtension}`), suffix: '/index.js'}
  ];
  const matches = [];

  for (const candidate of candidates) {
    if (await pathExists(candidate.target)) {
      matches.push(candidate);
    }
  }

  if (matches.length !== 1) {
    const reason = matches.length === 0 ? 'does not resolve' : 'is ambiguous';
    throw new Error(
      `${path.relative(process.cwd(), outputFile)}: ${specifier} ${reason} in emitted output`
    );
  }
  return matches[0].suffix;
}

async function shiftSourceMap(outputFile, insertions) {
  const sourceMapFile = `${outputFile}.map`;
  if (!(await pathExists(sourceMapFile))) {
    return;
  }

  const sourceMap = JSON.parse(await readFile(sourceMapFile, 'utf8'));
  const decodedMappings = decode(sourceMap.mappings);
  const insertionsByLine = new Map();

  for (const insertion of insertions) {
    const lineInsertions = insertionsByLine.get(insertion.line) || [];
    lineInsertions.push({column: insertion.column, length: insertion.text.length});
    insertionsByLine.set(insertion.line, lineInsertions);
  }

  for (const [line, lineInsertions] of insertionsByLine) {
    lineInsertions.sort((left, right) => left.column - right.column);
    for (const segment of decodedMappings[line] || []) {
      const originalColumn = segment[0];
      for (const insertion of lineInsertions) {
        if (insertion.column <= originalColumn) {
          segment[0] += insertion.length;
        }
      }
    }
  }

  sourceMap.mappings = encode(decodedMappings);
  await writeFile(sourceMapFile, JSON.stringify(sourceMap));
}

async function findOutputFiles(directory) {
  const outputFiles = [];

  for (const entry of await readdir(directory, {withFileTypes: true})) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      outputFiles.push(...(await findOutputFiles(entryPath)));
    } else if (entry.name.endsWith('.js') || entry.name.endsWith('.d.ts')) {
      outputFiles.push(entryPath);
    }
  }
  return outputFiles.sort();
}

async function pathExists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}
