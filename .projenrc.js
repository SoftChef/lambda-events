const { TypeScriptAppProject, NpmAccess, ProjectType } = require('projen');

const AUTOMATION_TOKEN = 'PROJEN_GITHUB_TOKEN';

const project = new TypeScriptAppProject({
  author: 'SoftChef',
  authorName: 'MinChe Tsai',
  authorEmail: 'poke@softchef.com',
  npmAccess: NpmAccess.PUBLIC,
  projectType: ProjectType.LIB,
  projenVersion: '0.27.0',
  majorVersion: 1,
  defaultReleaseBranch: 'main',
  name: '@softchef/lambda-events',
  repositoryUrl: 'https://github.com/SoftChef/lambda-events.git',
  release: true,
  releaseToNpm: true,
  package: true,
  entrypoint: 'lib/index.js',
  minNodeVersion: '14.15.0',
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
      moduleResolution: 'node',
    },
  },
});

project.synth();