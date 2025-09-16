const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');
const { resolve } = require('path');

const projectRoot = __dirname;
const workspaceRoot = resolve(projectRoot, '..');

const config = getDefaultConfig(projectRoot);

// 1. Watch all files in the monorepo
config.watchFolders = [workspaceRoot];

// 2. Let Metro know where to resolve packages and in what order
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// 3. Force Metro to resolve (sub)dependencies from the `node_modules` folder
config.resolver.disableHierarchicalLookup = true;

// 4. Use TSConfig Paths for aliasing
const tsconfig = require('./tsconfig.json');
const { compilerOptions } = tsconfig;

const alias = Object.entries(compilerOptions.paths).reduce((acc, [key, values]) => {
  const aliasName = key.replace(/\/\*$/, '');
  const targetPath = path.resolve(projectRoot, values[0].replace(/\/\*$/, ''));
  acc[aliasName] = targetPath;
  return acc;
}, {});

config.resolver.alias = {
  ...config.resolver.alias,
  ...alias
};


config.resolver.extraNodeModules = {
  react: path.resolve(projectRoot, 'node_modules/react'),
  'react-dom': path.resolve(projectRoot, 'node_modules/react-dom'),
};

module.exports = config;
