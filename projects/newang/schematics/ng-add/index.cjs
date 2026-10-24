/**
 * ng-add schematic for newang.
 * SCSS apps get the theme import; plain-CSS apps get the compiled
 * `newang/styles.css` entry in `angular.json` instead (no Sass required).
 * Plain JS with a `.cjs` extension so Node always parses it as
 * CommonJS, even when the published package sets `"type": "module"`.
 */
const { chain } = require('@angular-devkit/schematics');

const SCSS_IMPORT = `@use 'newang/styles' as na;
@include na.base();
`;
const CSS_ENTRY = 'node_modules/newang/styles.css';

function readWorkspace(tree) {
  for (const path of ['/angular.json', '/angular.jsonc']) {
    if (!tree.exists(path)) continue;
    try {
      return { path, workspace: JSON.parse(tree.read(path).toString('utf8')) };
    } catch {
      return { path, workspace: null };
    }
  }
  return null;
}

function resolveProject(workspace, projectName) {
  if (!workspace || !workspace.projects) return null;
  const name =
    projectName ||
    workspace.defaultProject ||
    Object.keys(workspace.projects).find(
      (key) => workspace.projects[key].projectType === 'application',
    ) ||
    Object.keys(workspace.projects)[0];
  return name ? { name, project: workspace.projects[name] } : null;
}

function resolveStylesPath(tree, project) {
  if (project) {
    const root = project.sourceRoot || `${project.root}/src`;
    for (const ext of ['scss', 'sass', 'css']) {
      const path = `/${root.replace(/^\//, '')}/styles.${ext}`;
      if (tree.exists(path)) return path;
    }
    // File may not exist yet but angular.json already names the entry.
    const styles = project.architect?.build?.options?.styles;
    if (Array.isArray(styles)) {
      const entry = styles.find(
        (value) =>
          typeof value === 'string' &&
          !value.startsWith('node_modules/') &&
          /(^|\/)styles\.(scss|sass|css)$/.test(value),
      );
      if (entry) return `/${entry.replace(/^\//, '')}`;
    }
    return `/${root.replace(/^\//, '')}/styles.scss`;
  }
  if (tree.exists('/src/styles.scss')) return '/src/styles.scss';
  return '/src/styles.scss';
}

function addCssEntry(tree, context, projectName) {
  const found = readWorkspace(tree);
  if (!found || !found.workspace) return false;
  const resolved = resolveProject(found.workspace, projectName);
  if (!resolved) return false;
  const build = resolved.project.architect?.build;
  if (!build) return false;
  build.options = build.options || {};
  const styles = Array.isArray(build.options.styles) ? build.options.styles : [];
  if (styles.includes(CSS_ENTRY)) {
    context.logger.info(`newang: angular.json already includes ${CSS_ENTRY}`);
    return true;
  }
  build.options.styles = [CSS_ENTRY, ...styles];
  tree.overwrite(found.path, `${JSON.stringify(found.workspace, null, 2)}\n`);
  context.logger.info(`newang: added ${CSS_ENTRY} to ${found.path}`);
  return true;
}

function addStyles() {
  return (tree, context) => {
    const opts = (context && context.options) || {};
    const found = readWorkspace(tree);
    const resolved = found ? resolveProject(found.workspace, opts.project) : null;
    const path = resolveStylesPath(tree, resolved && resolved.project);
    const isCss = path.endsWith('.css');

    if (isCss) {
      if (addCssEntry(tree, context, opts.project)) return tree;
      context.logger.warn(
        'newang: could not edit angular.json automatically — add "node_modules/newang/styles.css" to your styles array.',
      );
      return tree;
    }

    if (tree.exists(path)) {
      const current = tree.read(path).toString('utf8');
      if (!current.includes('newang/styles')) {
        const rec = tree.beginUpdate(path);
        rec.insertLeft(0, SCSS_IMPORT + (current.endsWith('\n') ? '' : '\n'));
        tree.commitUpdate(rec);
        context.logger.info(`newang: theme wired into ${path}`);
      } else {
        context.logger.info(`newang: ${path} already references newang/styles`);
      }
    } else {
      tree.create(path, SCSS_IMPORT);
      context.logger.info(`newang: created ${path} with theme import`);
    }
    return tree;
  };
}

function sayHello() {
  return (_tree, context) => {
    context.logger.info('');
    context.logger.info('newang installed — dark theme, pastel lime accent, zero CSS needed.');
    context.logger.info('Example: <na-app><na-page><na-button>Save</na-button></na-page></na-app>');
    context.logger.info('Docs: https://github.com/marxnoe/newang#readme');
    return _tree;
  };
}

function ngAdd() {
  return chain([addStyles(), sayHello()]);
}

module.exports = { ngAdd };
module.exports.default = ngAdd;
