/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    // ── Circular dependency detection ─────────────────────────────────────────
    {
      name: 'no-circular',
      severity: 'warn',
      comment: 'Circular imports make refactoring harder and can cause runtime issues.',
      from: {},
      to: { circular: true },
    },

    // ── Hooks must not import components ──────────────────────────────────────
    {
      name: 'hooks-no-components',
      severity: 'error',
      comment: 'Hooks are pure logic — they must not depend on React components.',
      from: { path: '^src/hooks/' },
      to: { path: '^src/components/' },
    },

    // ── Contexts must not import components ───────────────────────────────────
    {
      name: 'contexts-no-components',
      severity: 'error',
      comment: 'Contexts are data providers — they must not depend on React components.',
      from: { path: '^src/contexts/' },
      to: { path: '^src/components/' },
    },

    // ── Contexts must not import hooks (hooks use contexts, not vice-versa) ────
    {
      name: 'contexts-no-hooks',
      severity: 'warn',
      comment: 'Contexts should not depend on hooks — hooks consume contexts.',
      from: { path: '^src/contexts/' },
      to: { path: '^src/hooks/' },
    },

    // ── No orphan modules ─────────────────────────────────────────────────────
    {
      name: 'no-orphans',
      severity: 'warn',
      comment: 'Modules not referenced anywhere — may be dead code.',
      from: {
        orphan: true,
        pathNot: [
          '\\.(test|spec)\\.jsx?$',
          '^src/index\\.js$',
          '\\.d\\.ts$',
        ],
      },
      to: {},
    },
  ],

  options: {
    doNotFollow: {
      path: 'node_modules',
    },
    exclude: {
      path: [
        'node_modules',
        'build',
        '\\.test\\.',
        '\\.spec\\.',
      ],
    },
    moduleSystems: ['es6', 'cjs'],
  },
};
