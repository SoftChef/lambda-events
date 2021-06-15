## Request

```
const request = new Request(event)
```

Methods:

```
request.parameter(key)
// Get URL path paramter, ex: /Users/{username}, request.parameter('username')

request.get(key, defaultValue)
// Get query string, ex: ?filter=hello, request.get('filter', null)

request.input(key, defaultValue)
// Get post field data, ex: name=Josh, request.input('name', 'Who')

request.inputs(keys)
// Get post mulitple fields data, ex: name=Josh&enabled=true, request.inputs(['name', 'enabled'])

request.validate(keysProvider)
// Validate input data, keysProvider is an callback, keysProvider(joi) please return a Joi rules
```

## Todo

- Support more lambda events
- UnitTest