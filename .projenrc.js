const { typescript } = require('projen');

const AUTOMATION_TOKEN = 'PROJEN_GITHUB_TOKEN';

const project = new typescript.TypeScriptAppProject({
  author: 'SoftChef',
  authorName: 'MinChe Tsai',
  authorEmail: 'poke@softchef.com',
  defaultReleaseBranch: 'main',
  name: '@softchef/lambda-events',
  repositoryUrl: 'https://github.com/SoftChef/lambda-events.git',
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
  ],
  depsUpgradeOptions: {
    ignoreProjen: true,
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