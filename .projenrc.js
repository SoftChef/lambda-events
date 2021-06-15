const { TypeScriptProject, NpmAccess, ProjectType } = require('projen');

const project = new TypeScriptProject({
  author: 'softchef-iot-lab',
  authorName: 'MinChe Tsai',
  authorEmail: 'poke@softchef.com',
  npmAccess: NpmAccess.PUBLIC,
  projectType: ProjectType.LIB,
  projenVersion: '0.24.7',
  initialVersion: '0.0.0',
  defaultReleaseBranch: 'main',
  jsiiFqn: 'projen.TypeScriptProject',
  name: '@softchef/lambda-events',
  repositoryUrl: 'https://github.com/SoftChef/lambda-events.git',
  deps: [
    '@aws-sdk/client-cognito-identity-provider',
    '@types/semver',
    'joi',
    'semver',
  ],
  gitignore: [
    'lib',
  ],
  npmignore: [
    '/src',
  ],
});

project.synth();
