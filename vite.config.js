// The optional dependency location lets a restricted worker build without
// creating a node_modules directory in the submission. Normal npm installs
// need no environment setting.
const dependencyRoot = process.env.IMD_DEPENDENCY_ROOT;

export default {
  base: './',
  esbuild: { jsx: 'automatic' },
  resolve: dependencyRoot ? {
    alias: [
      { find: /^react-dom(\/.*)?$/, replacement: `${dependencyRoot}/react-dom$1` },
      { find: /^react(\/.*)?$/, replacement: `${dependencyRoot}/react$1` },
    ],
  } : {},
  build: { target: 'es2022' },
};
