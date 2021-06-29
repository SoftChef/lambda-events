import { CognitoIdentityProviderClient, AdminGetUserCommand } from '@aws-sdk/client-cognito-identity-provider';
import * as Joi from 'joi';
import { extensions } from './validator';

/**
 * API Gateway Request
 */
export class RestApiRequest {

  public readonly event: {
    headers?: { [key: string]: string };
    pathParameters?: { [key: string]: string };
    queryStringParameters?: { [key: string]: string };
    body?: { [key: string]: any };
    requestContext?: { [key: string]: any };
  };

  public readonly headers: {
    [key: string]: string;
  };

  public readonly parameters: {
    [key: string]: string;
  }

  public readonly queries: {
    [key: string]: string;
  }

  public readonly body: {
    [key: string]: any;
  };

  public readonly requestContext: {
    [key: string]: any;
  };

  constructor(event?: { [key: string]: any }) {
    this.event = event ?? {};
    this.headers = this.event.headers ?? {};
    this.parameters = this.event.pathParameters ?? {};
    this.queries = this.event.queryStringParameters ?? {};
    this.requestContext = this.event.requestContext ?? {};
    if (typeof this.event.body === 'string') {
      try {
        this.body = JSON.parse(this.event.body) ?? {};
      } catch (error) {
        this.body = {};
      }
    } else {
      this.body = this.event.body ?? {};
    }
    for (const extension of extensions) {
      Joi.extend(extension);
    }
  }

  public parameter(key: string): string {
    let parameter = this.parameters[key] ?? null;
    if (parameter) {
      parameter = decodeURI(parameter);
    }
    return parameter;
  }

  public get(key: string, defaultValue?: any): any {
    let result = this.queries[key];
    if (result === undefined) {
      result = defaultValue ?? null;
    }
    return result;
  }
  input(key: string, defaultValue?: any): any {
    let result = this.body[key];
    if (result === undefined) {
      result = this.queries[key];
    }
    if (result === undefined) {
      result = defaultValue ?? null;
    }
    return result;
  }
  inputs(keys: string[]): { [key: string]: any } {
    const inputs: {
      [key: string]: any;
    } = {};
    for (let key of keys) {
      let input = this.input(key);
      if (input === null) {
        input = this.get(key);
      }
      inputs[key] = input;
    }
    return inputs;
  }
  has(key: string): boolean {
    if (this.queries[key] !== undefined) {
      return true;
    } else if (this.body[key] !== undefined) {
      return true;
    }
    return false;
  }
  header(key: string): string {
    return this.headers[key] ?? null;
  }
  async user() {
    const requestContext = this.requestContext ?? {};
    let user: { [key: string]: any };
    try {
      if (requestContext.authorizer) {
        const authorizer = requestContext.authorizer ?? {};
        const claims = authorizer.claims ?? {};
        const identity = authorizer.identity ?? 'default';
        if (typeof claims === 'string') {
          user = JSON.parse(claims);
        } else {
          user = claims;
        }
        user.identity = identity;
        user.username = user['cognito:username'] ?? user.sub;
        return user;
      } else {
        const identity = requestContext.identity ?? {};
        let authProvider, userPoolId, userSub;
        authProvider = identity.cognitoAuthenticationProvider ?? {};
        if (/^.*,[\w.-]*\/(.*):.*:(.*)/.test(authProvider)) {
          [authProvider, userPoolId, userSub] = authProvider.match(/^.*,[\w.-]*\/(.*):.*:(.*)/);
          const cognitoIdentityProviderClient = new CognitoIdentityProviderClient({});
          const cognitoUser = await cognitoIdentityProviderClient.send(
            new AdminGetUserCommand({
              UserPoolId: userPoolId,
              Username: userSub,
            }),
          );
          return cognitoUser;
          // const attributes: { [key: string]: any } = {};
          // if (Array.isArray(cognitoUser.UserAttributes)) {
          //   for (const attribute of cognitoUser.UserAttributes) {
          //     attributes[attribute.Name] = attribute.Value;
          //   }
          // }
          // return {
          //   enabled: user.Enabled ?? null,
          //   createdAt: user.UserCreateDate ?? null,
          //   updatedAt: user.UserLastModifiedDate ?? null,
          //   status: user.UserStatus ?? null,
          //   username: user.Username ?? null,
          //   ...attributes,
          // };
        }
      }
    } catch (error) {
      return error;
    }
  }

  validate(keysProvider: (Joi: Joi.Root) => any, options: Object = {}) {
    const keys: {
      [key: string]: Joi.Schema<any>;
    } = keysProvider(Joi);
    const schema: Joi.ObjectSchema<any> = Joi.object().keys(keys);
    const result: Joi.ValidationResult = schema.validate(
      this.inputs(
        Object.keys(keys),
      ),
      {
        abortEarly: false,
        ...options,
      },
    );
    let details: {
      [key: string]: string;
    }[] = [];
    if (result.error) {
      for (let detail of result.error.details) {
        details.push({
          ...detail.context,
          message: detail.message,
        });
      }
    }
    return {
      error: details.length > 0,
      details: details,
    };
  }
}