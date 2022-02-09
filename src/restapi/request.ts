import {
  CognitoIdentityProviderClient,
  AdminGetUserCommand,
  AdminGetUserCommandOutput,
} from '@aws-sdk/client-cognito-identity-provider';
import * as Joi from 'joi';
import {
  extensions,
} from './validator';

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
  };

  public readonly queries: {
    [key: string]: string;
  };

  public readonly body: {
    [key: string]: any;
  };

  public readonly requestContext: {
    [key: string]: any;
  };

  constructor(event?: { [key: string]: any }) {
    this.event = (event ?? {});
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
  user(): Promise<{ [key: string]: any } | null> {
    return new Promise((resolve, reject): void => {
      const requestContext = this.requestContext ?? {};
      const authorizer = requestContext.authorizer ?? {};
      const identity = requestContext.identity ?? null;
      const claims = authorizer.claims ?? null;
      const iam = authorizer.iam ?? null;
      if (claims) {
        let user: { [key: string]: any } = {};
        if (typeof claims === 'string') {
          user = JSON.parse(claims);
        } else {
          user = claims;
        }
        user.identity = authorizer.identity ?? 'default';;
        user.username = user['cognito:username'] ?? user.sub;
        resolve(user);
      } else if (iam) {
        const cognitoIdentity = iam.cognitoIdentity ?? {};
        const amr = cognitoIdentity.amr ?? [];
        const [authenticated, _userPool, identityString] = amr;
        if (authenticated === 'authenticated') {
          const [_authProvider, userPoolId, userSub] = identityString.match(/^[\w.-]*\/([\w-_]*):CognitoSignIn:([\w-]*)/) ?? [];
          getCognitoUser(userPoolId, userSub).then(resolve).catch(reject);
        } else {
          resolve(null);
        }
      } else if (identity) {
        if (identity.cognitoAuthenticationType === 'authenticated') {
          const [_authProvider, userPoolId, userSub] = (identity.cognitoAuthenticationProvider ?? {}).match(/^.*,[\w.-]*\/([\w-_]*):CognitoSignIn:([\w-]*)/) ?? [];
          getCognitoUser(userPoolId, userSub).then(resolve).catch(reject);
        } else {
          resolve(null);
        }
      } else {
        resolve(null);
      }
    });
  }

  validate(keysProvider: (Joi: Joi.Root) => any, options: Object = {}): {
    error: boolean;
    details: {
      key: string;
      label: string;
      value: any;
      message: string;
    }[];
  } {
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
      key: string;
      label: string;
      value: any;
      message: string;
    }[] = [];
    if (result.error) {
      for (let detail of result.error.details) {
        details.push({
          key: detail.context?.key ?? '',
          label: detail.context?.label ?? '',
          value: detail.context?.value ?? null,
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

function getCognitoUser(userPoolId: string, username: string): Promise<{ [key: string]: any }> {
  return new Promise((resolve, reject) => {
    let user: { [key: string]: any } = {};
    const cognitoIdentityProviderClient = new CognitoIdentityProviderClient({});
    cognitoIdentityProviderClient.send(
      new AdminGetUserCommand({
        UserPoolId: userPoolId,
        Username: username,
      }),
    ).then((result: AdminGetUserCommandOutput) => {
      user.username = result.Username;
      user.enabled = result.Enabled;
      user.status = result.UserStatus;
      for (const attribute of result.UserAttributes!) {
        Object.assign(user, {
          [attribute.Name!]: attribute.Value,
        });
      }
      resolve(user);
    }).catch(reject);
  });
}