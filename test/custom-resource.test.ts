import axios from 'axios';
import {
  CustomResource,
} from '../src';

jest.mock('axios');

const expected = {
  event: {
    ServiceToken: 'functionArn',
    RequestType: 'Create',
    ResponseURL: 'https://localhost',
    StackId: 'xxx',
    RequestId: 'xxx',
    ResourceType: 'Custom::Resource',
    PhysicalResourceId: 'TestResource1',
    LogicalResourceId: 'xxx',
    ResourceProperties: {
      accountId: '123456789',
      region: 'xxx',
      appName: 'xxx',
      list: [
        'a', 'b', 'c',
      ],
    },
  },
  successResponse: {
    status: 'SUCCESS',
    reason: 'Success',
    data: {
      xxx: 'yyy',
    },
  },
  failedResponse: {
    status: 'FAILED',
    reason: 'Error: failed test',
    data: null,
    error: new Error('failed test'),
  },
  cfnResponse: {
    resolves: {
      result: true,
    },
    rejects: {
      error: 'Network error: Something went wrong',
    },
  },
};

test('Verify get request type expect success', () => {
  const customResourceRequest = new CustomResource.Request(expected.event);
  expect(customResourceRequest.requestType()).toEqual(expected.event.RequestType);
  expect(customResourceRequest.on('create')).toEqual(true);
  expect(customResourceRequest.on('delete')).toEqual(false);
  expect(customResourceRequest.on(['create', 'update'])).toEqual(true);
});

test('Verify get property expect success', () => {
  const customResourceRequest = new CustomResource.Request(expected.event);
  expect(customResourceRequest.properties()).toEqual(expected.event.ResourceProperties);
  expect(customResourceRequest.property('accountId')).toEqual(expected.event.ResourceProperties.accountId);
  expect(customResourceRequest.property('region')).toEqual(expected.event.ResourceProperties.region);
  expect(customResourceRequest.property('appName')).toEqual(expected.event.ResourceProperties.appName);
});

test('Verify response success', async() => {
  const mockedAxios = axios as jest.Mocked<typeof axios>;
  mockedAxios.put.mockResolvedValue(expected.cfnResponse.resolves);
  const response = new CustomResource.Response(expected.event);
  const result = await response.success({});
  expect(result).toEqual(expected.cfnResponse.resolves);
});

test('Verify response failed', async() => {
  const mockedAxios = axios as jest.Mocked<typeof axios>;
  mockedAxios.put.mockRejectedValue(expected.cfnResponse.rejects);
  const response = new CustomResource.Response(expected.event);
  try {
    await response.success({});
  } catch (error) {
    expect(error).toEqual(expected.cfnResponse.rejects);
  }
});