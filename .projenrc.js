const { typescript, AUTOMATION_TOKEN } = require('projen');

const project = new typescript.TypeScriptAppProject({
  authorName: 'SoftChef',
  authorEmail: 'poke@softchef.com',
  name: '@softchef/lambda-events',
  repositoryUrl: 'https://github.com/SoftChef/lambda-events.git',
  defaultReleaseBranch: 'main',
  release: true,
  releaseToNpm: true,
  package: true,
  entrypoint: 'lib/index.js',
  deps: [
    '@aws-sdk/client-cognito-identity-provider',
    '@types/semver',
    '@types/sinon',
    'axios',
    'joi',
    'semver',
    'sinon',
    '@types/busboy',
    'busboy',
    '@types/lodash',
    'lodash',
  ],
  devDeps: [
    'aws-sdk-client-mock',
  ],
  depsUpgradeOptions: {
    ignoreProjen: false,
    workflowOptions: {
      labels: ['auto-approve', 'auto-merge'],
      secret: AUTOMATION_TOKEN,
    },
  },
  autoApproveOptions: {
    secret: 'GITHUB_TOKEN',
    allowedUsernames: ['MinCheTsai'],
  },
  tsconfig: {
    compilerOptions: {
      lib: [
        'ES2020',
        'DOM',
      ],
      moduleResolution: 'node',
    },
  },
});

project.synth();