import {
  CognitoIdentityProviderClient,
  ListUsersCommand,
  ListUsersCommandOutput,
} from '@aws-sdk/client-cognito-identity-provider';
import busboy from 'busboy';
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
    isBase64Encoded?: boolean;
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
  public readonly isMultipartFormData: boolean;

  public readonly busboy;

  public readonly files: {
    [key: string]: any;
  };


  constructor(event?: { [key: string]: any } ) {
    this.event = (event ?? {});
    this.headers = this.event.headers ?? {};
    this.parameters = this.event.pathParameters ?? {};
    this.queries = this.event.queryStringParameters ?? {};
    this.requestContext = this.event.requestContext ?? {};
    this.isMultipartFormData = /^multipart\/form-data.*$/.test(this.headers['Content-Type'] || this.headers['content-type']);
    this.files = {};


    if (this.isMultipartFormData) {
      this.busboy = busboy({
        headers: {
          'content-type': this.headers['Content-Type'] || this.headers['content-type'],
        },
      });
    }
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
  async file(key: string) {
    const processIsFinished = await this.processFiles();
    if (processIsFinished) {
      return Promise.resolve(this.files[key].binary || null);
    }
  }

  header(key: string): string {
    return this.headers[key] ?? null;
  }
  user(): Promise<{ [key: string]: any } | null> {
    return new Promise((resolve, _reject): void => {
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
          getCognitoUser(userPoolId, userSub).then(resolve).catch((error) => {
            console.log(error);
            resolve(null);
          });
        } else {
          resolve(null);
        }
      } else if (identity) {
        if (identity.cognitoAuthenticationType === 'authenticated') {
          const [_authProvider, userPoolId, userSub] = (identity.cognitoAuthenticationProvider ?? '').match(/^.*,[\w.-]*\/([\w-_]*):CognitoSignIn:([\w-]*)/) ?? [];
          getCognitoUser(userPoolId, userSub).then(resolve).catch((error) => {
            console.log(error);
            resolve(null);
          });
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
  processFiles(): Promise<boolean | null> {
    return new Promise((resolve, reject) => {
      try {
        this.busboy?.on('field', (fieldName: any, value: any) => {
          this.body[fieldName] = value;
        });
        this.busboy?.on('file', (fieldName: any, file: any, filename: any, encoding: any, mimeType: any) => {
          if (!this.files[fieldName]) {
            this.files[fieldName] = {
              binary: Buffer.from(''),
              filename,
              encoding,
              mimeType,
            };
          }
          file.on('data', (data: any) => {
            this.files[fieldName].binary = Buffer.concat([this.files[fieldName].binary, data]);
          });
          file.on('end', () => { });
        });
        this.busboy?.on('error', error => {
          return reject(
            new Error(`Parse error: ${error}`),
          );
        });
        this.busboy?.on('finish', () => {
          resolve(true);
        });
        this.busboy?.write(this.event.body, this.event.isBase64Encoded ? 'base64': 'binary');
        this.busboy?.end();
      } catch (error) {
        reject(error);
      }
    });
  }
}

function getCognitoUser(userPoolId: string, username: string): Promise<{ [key: string]: any }> {
  return new Promise((resolve, reject) => {
    let user: { [key: string]: any } = {};
    const cognitoIdentityProviderClient = new CognitoIdentityProviderClient({});
    cognitoIdentityProviderClient.send(
      new ListUsersCommand({
        UserPoolId: userPoolId,
        Filter: `sub = \"${username}\"`,
      }),
    ).then((result: ListUsersCommandOutput) => {
      const firstUser = result.Users!.shift()!;
      user.username = firstUser.Username;
      user.enabled = firstUser.Enabled;
      user.status = firstUser.UserStatus;
      for (const attribute of firstUser.Attributes!) {
        Object.assign(user, {
          [attribute.Name!]: attribute.Value,
        });
      }
      resolve(user);
    }).catch(reject);
  });
}