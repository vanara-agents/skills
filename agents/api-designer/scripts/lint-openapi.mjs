#!/usr/bin/env node
// Runnable check: validates that an OpenAPI document (supplied as JSON) has the
// load-bearing required fields. Zero dependencies — JSON in, no YAML parser — so it
// runs anywhere Node does. Demonstrates an *executed*, verifiable asset for the
// api-designer agent.
//
// Checks:
//   - "openapi" version string is present
//   - info.title and info.version are non-empty strings
//   - "paths" is an object
//   - every operation's responses object is non-empty and each response carries a
//     schema or a description (so the contract documents its outcomes)
//
// Usage:
//   node lint-openapi.mjs path/to/openapi.json     # lint a JSON file
//   cat openapi.json | node lint-openapi.mjs        # lint from stdin
//   node lint-openapi.mjs --selftest                # run built-in cases (exit 0/1)

import { readFile } from 'node:fs/promises';

const HTTP_METHODS = ['get', 'put', 'post', 'delete', 'patch', 'options', 'head', 'trace'];

function isNonEmptyString(v) {
  return typeof v === 'string' && v.trim().length > 0;
}

function isObject(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

export function lintOpenApi(doc) {
  const errors = [];

  if (!isObject(doc)) {
    return { ok: false, errors: ['document is not a JSON object'] };
  }

  if (!isNonEmptyString(doc.openapi)) {
    errors.push('missing "openapi" version string');
  }

  if (!isObject(doc.info)) {
    errors.push('missing "info" object');
  } else {
    if (!isNonEmptyString(doc.info.title)) errors.push('missing "info.title"');
    if (!isNonEmptyString(doc.info.version)) errors.push('missing "info.version"');
  }

  if (!isObject(doc.paths)) {
    errors.push('missing "paths" object');
  } else {
    for (const [path, item] of Object.entries(doc.paths)) {
      if (!isObject(item)) {
        errors.push(`path "${path}" is not an object`);
        continue;
      }
      const operations = Object.entries(item).filter(([m]) => HTTP_METHODS.includes(m));
      for (const [method, op] of operations) {
        const where = `${method.toUpperCase()} ${path}`;
        if (!isObject(op.responses) || Object.keys(op.responses).length === 0) {
          errors.push(`operation "${where}" has no responses`);
          continue;
        }
        for (const [code, res] of Object.entries(op.responses)) {
          if (!isObject(res)) {
            errors.push(`response ${code} on "${where}" is not an object`);
            continue;
          }
          const hasSchema = isObject(res.content) || '$ref' in res;
          const hasDescription = isNonEmptyString(res.description);
          if (!hasSchema && !hasDescription) {
            errors.push(`response ${code} on "${where}" lacks a schema or description`);
          }
        }
      }
    }
  }

  return { ok: errors.length === 0, errors };
}

function report(label, doc) {
  const { ok, errors } = lintOpenApi(doc);
  if (ok) {
    console.log(`✓ ${label}: valid OpenAPI document (required fields present)`);
  } else {
    console.error(`✗ ${label}: ${errors.length} problem(s):`);
    errors.forEach((e) => console.error(`    - ${e}`));
  }
  return ok;
}

function parse(label, text) {
  try {
    return JSON.parse(text);
  } catch {
    console.error(`✗ ${label}: invalid JSON`);
    return undefined;
  }
}

function selftest() {
  const valid = {
    openapi: '3.1.0',
    info: { title: 'Orders API', version: '1.0.0' },
    paths: {
      '/orders': {
        get: {
          summary: 'List orders',
          responses: {
            200: { description: 'A page of orders' },
            401: { $ref: '#/components/responses/Error' },
          },
        },
        post: {
          summary: 'Create an order',
          responses: { 201: { content: { 'application/json': {} } } },
        },
      },
    },
  };

  const invalidNoInfoVersion = {
    openapi: '3.1.0',
    info: { title: 'Orders API' }, // missing version
    paths: {},
  };

  const invalidNoOpenapi = {
    info: { title: 'X', version: '1.0.0' },
    paths: { '/x': { get: { responses: { 200: { description: 'ok' } } } } },
  };

  const invalidEmptyResponses = {
    openapi: '3.1.0',
    info: { title: 'X', version: '1.0.0' },
    paths: { '/x': { get: { summary: 'no responses', responses: {} } } },
  };

  const invalidResponseNoSchema = {
    openapi: '3.1.0',
    info: { title: 'X', version: '1.0.0' },
    paths: { '/x': { get: { responses: { 200: {} } } } }, // no schema or description
  };

  const cases = [
    ['valid full doc', valid, true],
    ['missing info.version', invalidNoInfoVersion, false],
    ['missing openapi field', invalidNoOpenapi, false],
    ['empty responses', invalidEmptyResponses, false],
    ['response without schema/description', invalidResponseNoSchema, false],
  ];

  let allExpected = true;
  for (const [name, doc, shouldPass] of cases) {
    const { ok } = lintOpenApi(doc);
    const correct = ok === shouldPass;
    allExpected = allExpected && correct;
    console.log(
      `${correct ? '✓' : '✗'} selftest ${name}: ${ok ? 'valid' : 'invalid'} (expected ${shouldPass ? 'valid' : 'invalid'})`,
    );
  }
  process.exit(allExpected ? 0 : 1);
}

const arg = process.argv[2];
if (arg === '--selftest') {
  selftest();
} else if (arg) {
  const text = await readFile(arg, 'utf8');
  const doc = parse(arg, text);
  process.exit(doc !== undefined && report(arg, doc) ? 0 : 1);
} else {
  let buf = '';
  process.stdin.on('data', (c) => (buf += c));
  process.stdin.on('end', () => {
    const doc = parse('stdin', buf);
    process.exit(doc !== undefined && report('stdin', doc) ? 0 : 1);
  });
}
