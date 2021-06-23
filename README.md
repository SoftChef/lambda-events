## Installation

```
// NPM
npm install @softchef/lambda-events

// Yarn
yarn add @softchef/lambda-events
```

## RestApi

_JavaScript require_

```
const { RestApi } = require('@softchef/lambda-events');
or
const { Request, Response } = require('@softchef/lambda-events');
```

_TypeScript import_

```
import { RestApi } from '@softchef/lambda-events';
or
import { Request, Response } from '@softchef/lambda-events';
```

### RestApi.Request / Request class:

```
const request = new RestApi.Request(event);
or
const request = new Request(event);
```

***Methods***

_Get Parameters_

```
const value = request.parameter(key);

// Get URL path paramter, ex: /Users/{username}, 

const username = request.parameter('username');
```

_Get QueryStrings_

```
const value = request.get(key, defaultValue);

// Get query string, ex: ?filter=hello

const value = request.get('filter', null);
```

_Get Post data / Body_

```
const value = request.input(key, defaultValue);

// Get post field data, ex: name=John

const name = request.input('name', 'Who');

const inputs = request.inputs(keys);

// Get post mulitple fields data, ex: name=John&enabled=true,

const inputs = request.inputs(['name', 'enabled']);

// inputs: { name: 'John', enabled: true }
```

_Validate Inputs or QueryStrings_

```
const validated = request.validate(keysProvider);

// Validate input data, keysProvider is an callback, keysProvider(joi) please return a Joi schemas
```

### RestApi.Response / Response class:

```
const response = new RestApi.Response();
or
const response = new Response();
```

***Methods***

_Response JSON_

```
response.json(data, httpStatusCode);

// If the API request are success, use response.json and give a JSON object data to return client. ex:

response.json({ hello: "world"}, 200);
```

_Response error_

```
response.error(error, httpStatusCode);

// If the API request are failure, use response.error and give a Error object to return client. ex:

response.error(
  new Error('Invalid input data'),
  422
)
```

## CustomResource

CloudFormation can use CustomResource to invoke a Lambda function. You will get request type, properties from event, and response to stacks when process success/failure.

```
// JavaScript require
const { CustomResource } = require('@softchef/lambda-events');

// TypeScript import
import { CustomResource } from '@softchef/lambda-events';
```

### CustomResource.Request class:

```
const request = new CustomResource.Request(event);
```

***Methods***

_Get Properties_

```
const value = request.property(key);

// Get the CustomResource property by key. ex:

const tableName = request.property('DynamoDbTableName');

// Will return the reference table name from stacks.
```

_Get RequestType_

```
const isOn = request.on(requestType);

// The request type is the stacks process status, allow: Create / Update / Delete. ex:

const isCreate = request.on('create');

// When stacks has first time to create will be true

const isCreateOrUpdate = request.on(['create', 'update']);

// When stacks has first time to create or any update will be true
```

### CustomResource.Response class:

```
const response = new CustomResource.Response(event);
```

***Methods***

_Response success to stacks_
```
response.success(returnData): Promise;

// You can return data to stacks. ex:

await response.success({
  time: Date.now()
});

// In the stacks can reference. CDK ex:

new CfnOutput(stack, id, {
  value: customResource.getAtt('time')
});
```

_Response failure to stacks_

```
response.failed(error): Promise;

// If process has any error, you can report the error message to response stacks. ex:

await response.failed(
  new Error('Something wrong.')
);

// The stacks will rollback and display your error message.

```

## Future

- Support more lambda events
  - Cognito Trigger
  - S3 Trigger
  - EventBridge event source
  - SQS event source
  - Kinesis Data Firehose event source
  - more...
