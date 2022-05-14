import {
  Parameters,
} from '../../src/restapi/models';

test('Verify parameters has key expect success', () => {
  const parameters = new Parameters({
    search: 'hello',
    name: 'John',
  });
  expect(
    parameters.has('search'),
  ).toEqual(true);
  expect(
    parameters.has('name'),
  ).toEqual(true);
  expect(
    parameters.has('xxx'),
  ).toEqual(false);
});
test('Verify parameters gets expect success', () => {
  const parameters = new Parameters({
    name: 'John',
    age: null,
    query: 'value',
  });
  expect(
    parameters.gets([
      'name',
      'age',
      'query',
    ]),
  ).toEqual({
    name: 'John',
    age: null,
    query: 'value',
  });
});
test('Verify parameters get expect success', () => {
  const parameters = new Parameters({
    search: 'value',
  });
  expect(
    parameters.get('search'),
  ).toEqual('value');
  expect(
    parameters.get('keyword', 'nodejs'),
  ).toEqual('nodejs');
});
test('Verify parameters set expect success', () => {
  const parameters = new Parameters({
    search: 'value',
  });
  expect(
    parameters.set('search', 'value2'),
  ).toEqual(new Parameters({
    search: 'value2',
  }));
});
test('Verify parameters validate expect success', () => {
  const expectedData = {
    name: 'John',
    description: 'This is a John',
  };
  const parameters = new Parameters(expectedData);
  const validated = parameters.validate(joi => {
    return {
      name: joi.string().required(),
      description: joi.string().required(),
    };
  });
  expect(validated.error).toEqual(false);
  expect(validated.details).toEqual([]);
});
test('Verify parameters validate with incorrect data expect failure', () => {
  const expectedData = {
    name: 'John',
    description: 'This is a John',
  };
  const parameters = new Parameters(expectedData);
  const validated = parameters.validate(joi => {
    return {
      name: joi.string().required(),
    };
  });
  expect(validated.error).toEqual(true);
  expect(validated.details).toEqual([
    {
      key: 'description',
      label: 'description',
      message: '"description" is not allowed',
      value: expectedData.description,
    },
  ]);
});

