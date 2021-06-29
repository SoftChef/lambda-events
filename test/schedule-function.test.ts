import {
  ScheduleFunction,
} from '../src';

const expected = {
  event: {
    scheduleId: '209901011234-uuuu-uuuu-iiii-dddd-vvvv-44444',
    scheduledAt: '209901011234',
    id: 'uuuu-uuuu-iiii-dddd-vvvv-44444',
    targetType: 'TestTarget',
    description: 'test description',
    status: 'unprocess',
    context: {
      testString: '123',
      testNumber: 0,
      testBoolean: false,
      testNull: null,
      testArray: [1, 2, 3],
      testObject: {
        testObject1: {
          testObject11: 'object',
        },
        testObject2: 0,
      },
    },
  },
  responseSuccess: {
    created: true,
  },
  responseFailed: {
    created: false,
  },
  responseError: new Error('Test error'),
};

test('Verify get request type expect success', () => {
  const request = new ScheduleFunction.Request(expected.event);
  expect(request.scheduleId).toEqual(expected.event.scheduleId);
  expect(request.scheduledAt).toEqual(expected.event.scheduledAt);
  expect(request.id).toEqual(expected.event.id);
  expect(request.targetType).toEqual(expected.event.targetType);
  expect(request.description).toEqual(expected.event.description);
  expect(request.status).toEqual(expected.event.status);
  expect(request.context()).toEqual(expected.event.context);
  expect(request.context('testString')).toEqual(expect.any(String));
  expect(request.context('testNumber')).toEqual(expect.any(Number));
  expect(request.context('testBoolean')).toEqual(expect.any(Boolean));
  expect(request.context('testNull')).toEqual(null);
  expect(request.context('testArray')).toEqual(expect.any(Array));
  expect(request.context('testObject')).toEqual(expect.any(Object));
});

test('Verify response success', async() => {
  const response = new ScheduleFunction.Response(expected.event);
  const responseSuccess = response.success(expected.responseSuccess);
  expect(responseSuccess.scheduleId).toEqual(expected.event.scheduleId);
  expect(responseSuccess.success).toEqual(true);
  expect(responseSuccess.result).toEqual(expected.responseSuccess);
});

test('Verify response error', async() => {
  const response = new ScheduleFunction.Response(expected.event);
  const responseError = response.failed(expected.responseError);
  expect(responseError.scheduleId).toEqual(expected.event.scheduleId);
  expect(responseError.success).toEqual(false);
  expect(responseError.result).toEqual(expected.responseError);
});

test('Verify response failed with error', async() => {
  const response = new ScheduleFunction.Response(expected.event);
  const responseFailed = response.failed(expected.responseFailed);
  expect(responseFailed.scheduleId).toEqual(expected.event.scheduleId);
  expect(responseFailed.success).toEqual(false);
  expect(responseFailed.result).toEqual(expected.responseFailed);
});