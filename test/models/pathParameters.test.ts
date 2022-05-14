import {
  PathParameters,
} from '../../src/restapi/models/pathParameters';

test('Verify path parameters get expect success', () => {
  const pathParameters = new PathParameters({
    search: 'hello',
    name: '%E4%B8%AD%E6%96%87',
  });
  expect(
    pathParameters.get('search'),
  ).toEqual('hello');
  expect(
    pathParameters.get('name'),
  ).toEqual('中文');
});
