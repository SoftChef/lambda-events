import { RestApi } from '../src';

test('Verify request parameter with path parameters expect success', () => {
  const request = new RestApi.Request({
    pathParameters: {
      id: '123',
    },
  });
  expect(
    request.parameter('id'),
  ).toEqual('123');
});

test('Verify request get with query string parameters expect success', () => {
  const request = new RestApi.Request({
    queryStringParameters: {
      search: 'value',
    },
  });
  expect(
    request.get('search'),
  ).toEqual('value');
  expect(
    request.get('keyword', 'nodejs'),
  ).toEqual('nodejs');
});

test('Verify request input with body expect success', () => {
  const request = new RestApi.Request({
    queryStringParameters: {
      query: 'value',
    },
    body: JSON.stringify(
      {
        name: 'John',
      },
    ),
  });
  expect(
    request.input('name'),
  ).toEqual('John');
  expect(
    request.input('age', 18),
  ).toEqual(18);
  expect(
    request.input('query'),
  ).toEqual('value');
});

test('Verify request inputs with body expect success', () => {
  const request = new RestApi.Request({
    queryStringParameters: {
      query: 'value',
    },
    body: JSON.stringify(
      {
        name: 'John',
      },
    ),
  });
  expect(
    request.inputs([
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

test('Verify request inputs with invalid body expect failure', () => {
  const request = new RestApi.Request({
    body: 'Invalid JSON string',
  });
  expect(request.body).toEqual({});
});

test('Verify request has key expect success', () => {
  const request = new RestApi.Request({
    queryStringParameters: {
      search: 'hello',
    },
    body: JSON.stringify(
      {
        name: 'John',
      },
    ),
  });
  expect(
    request.has('search'),
  ).toEqual(true);
  expect(
    request.has('name'),
  ).toEqual(true);
  expect(
    request.has('xxx'),
  ).toEqual(false);
});

test('Verify request header expect success', () => {
  const request = new RestApi.Request({
    headers: {
      'content-type': 'application/json',
    },
  });
  expect(
    request.header('content-type'),
  ).toEqual('application/json');
});

test('Verify request validate with body expect success', () => {
  const expectedData = {
    name: 'John',
    description: 'This is a John',
  };
  const request = new RestApi.Request({
    body: JSON.stringify(expectedData),
  });
  const validated = request.validate(joi => {
    return {
      name: joi.string().required(),
      description: joi.string().required(),
    };
  });
  expect(validated.error).toEqual(false);
});

test('Verify request validate failure', () => {
  const request = new RestApi.Request();
  const validated = request.validate(joi => {
    return {
      name: joi.string().required(),
      description: joi.string().required(),
    };
  });
  expect(validated.error).toEqual(true);
  expect(Array.isArray(validated.details)).toEqual(true);
  expect(validated.details).toEqual([
    {
      label: 'name',
      value: null,
      key: 'name',
      message: expect.any(String),
    },
    {
      label: 'description',
      value: null,
      key: 'description',
      message: expect.any(String),
    },
  ]);
});

test('Verify response json success', () => {
  const response = new RestApi.Response();
  const expectJsonData = {
    tested: true,
  };
  let responseSuccess = response.json(expectJsonData);
  expect(responseSuccess.statusCode).toEqual(200);
  expect(responseSuccess.body).toEqual(
    JSON.stringify(expectJsonData),
  );
});

test('Verify response json error', () => {
  const response = new RestApi.Response();
  const expectJsonErrorData = {
    error: true,
  };
  let responseError = response.json(expectJsonErrorData, 422);
  expect(responseError.statusCode).toEqual(422);
  expect(responseError.body).toEqual(
    JSON.stringify(expectJsonErrorData),
  );
});

test('Verify response error', () => {
  const response = new RestApi.Response();
  const expectErrorMessage = 'error';
  let responseError = response.error(expectErrorMessage, 500);
  expect(responseError.statusCode).toEqual(500);
  expect(responseError.body).toEqual(
    JSON.stringify({
      error: expectErrorMessage,
    }),
  );
});

test('Verify response not found', () => {
  const response = new RestApi.Response();
  let responseNotFound = response.notFound();
  expect(responseNotFound.statusCode).toEqual(404);
});

test('Verify response has cors', () => {
  const response = new RestApi.Response();
  response.setCors(true);
  let responseSuccess = response.json({}, 200);
  expect(
    responseSuccess.headers.hasOwnProperty('Access-Control-Allow-Origin'),
  ).toEqual(true);
  expect(
    responseSuccess.headers.hasOwnProperty('Access-Control-Allow-Headers'),
  ).toEqual(true);
  expect(
    responseSuccess.headers.hasOwnProperty('Access-Control-Allow-Methods'),
  ).toEqual(true);
});

test('Verify response not cors', () => {
  const response = new RestApi.Response();
  response.setCors(false);
  let responseSuccess = response.json({}, 200);
  expect(
    responseSuccess.headers.hasOwnProperty('Access-Control-Allow-Origin'),
  ).toEqual(false);
  expect(
    responseSuccess.headers.hasOwnProperty('Access-Control-Allow-Headers'),
  ).toEqual(false);
  expect(
    responseSuccess.headers.hasOwnProperty('Access-Control-Allow-Methods'),
  ).toEqual(false);
});