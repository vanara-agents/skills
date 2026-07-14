// commitlint configuration enforcing Conventional Commits.
//
// Setup (install dev deps in your own project — this skill ships zero deps):
//   npm i -D @commitlint/cli @commitlint/config-conventional husky
//   npx husky init
//   echo 'npx --no -- commitlint --edit "$1"' > .husky/commit-msg
//
// With the commit-msg hook in place, every `git commit` is validated locally.
// In CI, also lint PR titles for squash-merge workflows (see ci-pipeline-design).

/** @type {import('@commitlint/types').UserConfig} */
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Restrict types to the agreed set (mirrors this skill's "Allowed types").
    'type-enum': [
      2,
      'always',
      ['feat', 'fix', 'docs', 'style', 'refactor', 'perf', 'test', 'build', 'ci', 'chore', 'revert'],
    ],
    // Scope is optional, but when present must be one of these known areas.
    // Drop this rule, or extend the list, to match your repo's modules.
    'scope-enum': [2, 'always', ['api', 'web', 'auth', 'orders', 'payments', 'deps', 'ci', 'release']],
    'subject-case': [2, 'never', ['sentence-case', 'start-case', 'pascal-case', 'upper-case']],
    'subject-empty': [2, 'never'],
    'subject-full-stop': [2, 'never', '.'],
    'header-max-length': [2, 'always', 72],
    'body-leading-blank': [2, 'always'],
    'footer-leading-blank': [2, 'always'],
  },
};
