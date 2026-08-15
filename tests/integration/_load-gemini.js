// api/gemini.js is written as an ES module (export function ...) for Metro/
// Expo's bundler. To unit-test its pure logic under plain Node (which this
// project runs as CommonJS), we transpile it on the fly with the same
// @babel/plugin-transform-modules-commonjs already used by babel-preset-expo,
// then execute it as a fresh CommonJS module. No source files are modified.
const path = require('path');
const Module = require('module');
const babel = require('@babel/core');

function loadGeminiModule() {
  const filePath = path.join(__dirname, '..', '..', 'api', 'gemini.js');
  const { code } = babel.transformFileSync(filePath, {
    plugins: [require.resolve('@babel/plugin-transform-modules-commonjs')],
    babelrc: false,
    configFile: false,
  });
  const m = new Module(filePath, module);
  m.filename = filePath;
  m.paths = Module._nodeModulePaths(path.dirname(filePath));
  m._compile(code, filePath);
  return m.exports;
}

module.exports = { loadGeminiModule };
