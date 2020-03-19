/* eslint-disable @typescript-eslint/explicit-member-accessibility */
import { buildQueryString, join, parseQueryString, relativeToFile } from '@aurelia/kernel';
import { assert, fact } from '@aurelia/testing';

export class RelativeToFileTests {
  @fact()
  'can make a dot path relative to a simple file'() {
    const file = 'some/file.html';
    const path = './other/module';

    assert.strictEqual(relativeToFile(path, file), 'some/other/module', `relativeToFile(path, file)`);
  }

  @fact()
  'can make a dot path relative to an absolute file'() {
    const file = 'http://aurelia.io/some/file.html';
    const path = './other/module';

    assert.strictEqual(relativeToFile(path, file), 'http://aurelia.io/some/other/module', `relativeToFile(path, file)`);
  }

  @fact()
  'can make a double dot path relative to an absolute file'() {
    const file = 'http://aurelia.io/some/file.html';
    const path = '../other/module';

    assert.strictEqual(relativeToFile(path, file), 'http://aurelia.io/other/module', `relativeToFile(path, file)`);
  }

  @fact()
  'returns path if null file provided'() {
    const file = null;
    const path = 'module';

    assert.strictEqual(relativeToFile(path, file), 'module', `relativeToFile(path, file)`);
  }

  @fact()
  'returns path if empty file provided'() {
    const file = '';
    const path = 'module';

    assert.strictEqual(relativeToFile(path, file), 'module', `relativeToFile(path, file)`);
  }
}

export class JoinTests {
  @fact()
  'can combine two simple paths'() {
    const path1 = 'one';
    const path2 = 'two';

    assert.strictEqual(join(path1, path2), 'one/two', `join(path1, path2)`);
  }

  @fact()
  'can combine an absolute path and a simple path'() {
    const path1 = '/one';
    const path2 = 'two';

    assert.strictEqual(join(path1, path2), '/one/two', `join(path1, path2)`);
  }

  @fact()
  'can combine an absolute path and a simple path with slash'() {
    const path1 = '/one';
    const path2 = '/two';

    assert.strictEqual(join(path1, path2), '/one/two', `join(path1, path2)`);
  }

  @fact()
  'can combine a single slash and a simple path'() {
    const path1 = '/';
    const path2 = 'two';

    assert.strictEqual(join(path1, path2), '/two', `join(path1, path2)`);
  }

  @fact()
  'can combine a single slash and a simple path with slash'() {
    const path1 = '/';
    const path2 = '/two';

    assert.strictEqual(join(path1, path2), '/two', `join(path1, path2)`);
  }

  @fact()
  'can combine an absolute path with protocol and a simple path'() {
    const path1 = 'http://aurelia.io';
    const path2 = 'two';

    assert.strictEqual(join(path1, path2), 'http://aurelia.io/two', `join(path1, path2)`);
  }

  @fact()
  'can combine an absolute path with protocol and a simple path with slash'() {
    const path1 = 'http://aurelia.io';
    const path2 = '/two';

    assert.strictEqual(join(path1, path2), 'http://aurelia.io/two', `join(path1, path2)`);
  }

  @fact()
  'can combine an absolute path and a simple path with a dot'() {
    const path1 = 'http://aurelia.io';
    const path2 = './two';

    assert.strictEqual(join(path1, path2), 'http://aurelia.io/two', `join(path1, path2)`);
  }

  @fact()
  'can combine a simple path and a relative path'() {
    const path1 = 'one';
    const path2 = '../two';

    assert.strictEqual(join(path1, path2), 'two', `join(path1, path2)`);
  }

  @fact()
  'can combine an absolute path and a relative path'() {
    const path1 = 'http://aurelia.io/somewhere';
    const path2 = '../two';

    assert.strictEqual(join(path1, path2), 'http://aurelia.io/two', `join(path1, path2)`);
  }

  @fact()
  'can combine a protocol independent path and a simple path'() {
    const path1 = '//aurelia.io';
    const path2 = 'two';

    assert.strictEqual(join(path1, path2), '//aurelia.io/two', `join(path1, path2)`);
  }

  @fact()
  'can combine a protocol independent path and a simple path with slash'() {
    const path1 = '//aurelia.io';
    const path2 = '/two';

    assert.strictEqual(join(path1, path2), '//aurelia.io/two', `join(path1, path2)`);
  }

  @fact()
  'can combine a protocol independent path and a simple path with a dot'() {
    const path1 = '//aurelia.io';
    const path2 = './two';

    assert.strictEqual(join(path1, path2), '//aurelia.io/two', `join(path1, path2)`);
  }

  @fact()
  'can combine a protocol independent path and a relative path'() {
    const path1 = '//aurelia.io/somewhere';
    const path2 = '../two';

    assert.strictEqual(join(path1, path2), '//aurelia.io/two', `join(path1, path2)`);
  }

  @fact()
  'can combine a complex path and a relative path'() {
    const path1 = 'one/three';
    const path2 = '../two';

    assert.strictEqual(join(path1, path2), 'one/two', `join(path1, path2)`);
  }

  @fact()
  'returns path2 if path1 null'() {
    const path1 = null;
    const path2 = 'two';

    assert.strictEqual(join(path1, path2), 'two', `join(path1, path2)`);
  }

  @fact()
  'returns path2 if path1 empty'() {
    const path1 = '';
    const path2 = 'two';

    assert.strictEqual(join(path1, path2), 'two', `join(path1, path2)`);
  }

  @fact()
  'returns path1 if path2 null'() {
    const path1 = 'one';
    const path2 = null;

    assert.strictEqual(join(path1, path2), 'one', `join(path1, path2)`);
  }

  @fact()
  'returns path1 if path2 empty'() {
    const path1 = 'one';
    const path2 = '';

    assert.strictEqual(join(path1, path2), 'one', `join(path1, path2)`);
  }

  @fact()
  'should respect a trailing slash'() {
    const path1 = 'one/';
    const path2 = 'two/';

    assert.strictEqual(join(path1, path2), 'one/two/', `join(path1, path2)`);
  }

  @fact()
  'should respect file:/// protocol with three slashes (empty host)'() {
    const path1 = 'file:///one';
    const path2 = '/two';

    assert.strictEqual(join(path1, path2), 'file:///one/two', `join(path1, path2)`);
  }

  @fact()
  'should respect file:// protocol with two slashes (host given)'() {
    const path1 = 'file://localhost:8080';
    const path2 = '/two';

    assert.strictEqual(join(path1, path2), 'file://localhost:8080/two', `join(path1, path2)`);
  }

  @fact()
  'should allow scheme-relative URL that uses colons in the path'() {
    const path1 = '//localhost/one:/';
    const path2 = '/two';

    assert.strictEqual(join(path1, path2), '//localhost/one:/two', `join(path1, path2)`);
  }

  @fact()
  'should not add more than two leading slashes to http:// protocol'() {
    const path1 = 'http:///';
    const path2 = '/two';

    assert.strictEqual(join(path1, path2), 'http://two', `join(path1, path2)`);
  }
}

export class QueryStringTests {
  @fact()
  'should build query strings'() {
    const gen = buildQueryString;

    assert.strictEqual(gen(), '', `gen()`);
    assert.strictEqual(gen(null), '', `gen(null)`);
    assert.strictEqual(gen({}), '', `gen({})`);
    assert.strictEqual(gen({ a: null }), '', `gen({ a: null })`);

    assert.strictEqual(gen({ '': 'a' }), '=a', `gen({ '': 'a' })`);
    assert.strictEqual(gen({ a: 'b' }), 'a=b', `gen({ a: 'b' })`);
    assert.strictEqual(gen({ a: 'b', c: 'd' }), 'a=b&c=d', `gen({ a: 'b', c: 'd' })`);
    assert.strictEqual(gen({ a: 'b', c: 'd' }, true), 'a=b&c=d', `gen({ a: 'b', c: 'd' }, true)`);
    assert.strictEqual(gen({ a: 'b', c: null }), 'a=b', `gen({ a: 'b', c: null })`);
    assert.strictEqual(gen({ a: 'b', c: null }, true), 'a=b', `gen({ a: 'b', c: null }, true)`);

    assert.strictEqual(gen({ a: ['b', 'c'] }), 'a%5B%5D=b&a%5B%5D=c', `gen({ a: ['b', 'c'] })`);
    assert.strictEqual(gen({ a: ['b', 'c'] }, true), 'a=b&a=c', `gen({ a: ['b', 'c'] }, true)`);
    assert.strictEqual(gen({ '&': ['b', 'c'] }), '%26%5B%5D=b&%26%5B%5D=c', `gen({ '&': ['b', 'c'] })`);
    assert.strictEqual(gen({ '&': ['b', 'c'] }, true), '%26=b&%26=c', `gen({ '&': ['b', 'c'] }, true)`);

    assert.strictEqual(gen({ a: '&' }), 'a=%26', `gen({ a: '&' })`);
    assert.strictEqual(gen({ '&': 'a' }), '%26=a', `gen({ '&': 'a' })`);
    assert.strictEqual(gen({ a: true }), 'a=true', `gen({ a: true })`);
    assert.strictEqual(gen({ '$test': true }), '$test=true', `gen({ '$test': true })`);

    assert.strictEqual(gen({ obj: { a: 5, b: 'str', c: false } }), 'obj%5Ba%5D=5&obj%5Bb%5D=str&obj%5Bc%5D=false', `gen({ obj: { a: 5, b: 'str', c: false } })`);
    assert.strictEqual(gen({ obj: { a: 5, b: 'str', c: false } }, true), 'obj=%5Bobject%20Object%5D', `gen({ obj: { a: 5, b: 'str', c: false } }, true)`);
    assert.strictEqual(gen({ obj: { a: 5, b: undefined}}), 'obj%5Ba%5D=5', `gen({ obj: { a: 5, b: undefined}})`);

    assert.strictEqual(gen({a: {b: ['c', 'd', ['f', 'g']]}}), 'a%5Bb%5D%5B%5D=c&a%5Bb%5D%5B%5D=d&a%5Bb%5D%5B2%5D%5B%5D=f&a%5Bb%5D%5B2%5D%5B%5D=g', `gen({a: {b: ['c', 'd', ['f', 'g']]}})`);
    assert.strictEqual(gen({a: {b: ['c', 'd', ['f', 'g']]}}, true), 'a=%5Bobject%20Object%5D', `gen({a: {b: ['c', 'd', ['f', 'g']]}}, true)`);
    assert.strictEqual(gen({a: ['c', 'd', ['f', 'g']]}, true), 'a=c&a=d&a=f%2Cg', `gen({a: ['c', 'd', ['f', 'g']]}, true)`);
    assert.strictEqual(gen({a: ['c', 'd', {f: 'g'}]}, true), 'a=c&a=d&a=%5Bobject%20Object%5D', `gen({a: ['c', 'd', {f: 'g'}]}, true)`);
  }

  @fact()
  'should parse query strings'() {
    const parse = parseQueryString;

    assert.deepStrictEqual(parse(''), {}, `parse('')`);
    assert.deepStrictEqual(parse('='), {}, `parse('=')`);
    assert.deepStrictEqual(parse('&'), {}, `parse('&')`);
    assert.deepStrictEqual(parse('?'), {}, `parse('?')`);

    assert.deepStrictEqual(parse('a'), { a: true }, `parse('a')`);
    assert.deepStrictEqual(parse('a&b'), { a: true, b: true }, `parse('a&b')`);
    assert.deepStrictEqual(parse('a='), { a: '' }, `parse('a=')`);
    assert.deepStrictEqual(parse('a=&b='), { a: '', b: '' }, `parse('a=&b=')`);

    assert.deepStrictEqual(parse('a=b'), { a: 'b' }, `parse('a=b')`);
    assert.deepStrictEqual(parse('a=b&c=d'), { a: 'b', c: 'd' }, `parse('a=b&c=d')`);
    assert.deepStrictEqual(parse('a=b&&c=d'), { a: 'b', c: 'd' }, `parse('a=b&&c=d')`);
    assert.deepStrictEqual(parse('a=b&a=c'), { a: ['b', 'c'] }, `parse('a=b&a=c')`);

    assert.deepStrictEqual(parse('a=b&c=d='), { a: 'b', c: 'd' }, `parse('a=b&c=d=')`);
    assert.deepStrictEqual(parse('a=b&c=d=='), { a: 'b', c: 'd' }, `parse('a=b&c=d==')`);

    assert.deepStrictEqual(parse('a=%26'), { a: '&' }, `parse('a=%26')`);
    assert.deepStrictEqual(parse('%26=a'), { '&': 'a' }, `parse('%26=a')`);
    assert.deepStrictEqual(parse('%26[]=b&%26[]=c'), { '&': ['b', 'c'] }, `parse('%26[]=b&%26[]=c')`);

    assert.deepStrictEqual(parse('a[b]=c&a[d]=e'), {a: {b: 'c', d: 'e'}}, `parse('a[b]=c&a[d]=e')`);
    assert.deepStrictEqual(parse('a[b][c][d]=e'), {a: {b: {c: {d: 'e'}}}}, `parse('a[b][c][d]=e')`);
    assert.deepStrictEqual(parse('a[b][]=c&a[b][]=d&a[b][2][]=f&a[b][2][]=g'), {a: {b: ['c', 'd', ['f', 'g']]}}, `parse('a[b][]=c&a[b][]=d&a[b][2][]=f&a[b][2][]=g')`);
    assert.deepStrictEqual(parse('a[0]=b'), {a: ['b']}, `parse('a[0]=b')`);
  }
}
