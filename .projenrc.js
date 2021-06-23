const { TypeScriptAppProject, NpmAccess, ProjectType } = require('projen');

const project = new TypeScriptAppProject({
  author: 'softchef-iot-lab',
  authorName: 'MinChe Tsai',
  authorEmail: 'poke@softchef.com',
  npmAccess: NpmAccess.PUBLIC,
  projectType: ProjectType.LIB,
  projenVersion: '0.24.11',
  majorVersion: 1,
  defaultReleaseBranch: 'main',
  jsiiFqn: 'projen.TypeScriptAppProject',
  name: '@softchef/lambda-events',
  repositoryUrl: 'https://github.com/SoftChef/lambda-events.git',
  release: true,
  releaseToNpm: true,
  package: true,
  entrypoint: 'lib/index.js',
  deps: [
    '@aws-sdk/client-cognito-identity-provider',
    '@types/node@15.12.2',
    '@types/semver',
    'joi',
    'semver',
    'sinon',
    '@types/sinon',
    'axios',
  ],
  tsconfig: {
    compilerOptions: {
      moduleResolution: 'node',
    },
  },
});

project.synth();