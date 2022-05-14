import {
  CognitoIdentityProviderClient,
  ListUsersCommand,
  ListUsersCommandOutput,
} from '@aws-sdk/client-cognito-identity-provider';
import busboy from 'busboy';
import * as Joi from 'joi';
import {
  ValidationOptions,
} from 'joi';
import {
  Parameters,
  validate,
} from './models';
import {
  PathParameters,
} from './models/pathParameters';
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
    body?: { [key: string]: any } | string;
    requestContext?: { [key: string]: any };
    isBase64Encoded?: boolean;
  };

  public readonly headers: Parameters;

  public readonly parameters: PathParameters;

  public readonly queries: Parameters;

  public readonly body: Parameters;

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
    this.headers = new Parameters(this.event.headers);
    this.parameters = new PathParameters(this.event.pathParameters);
    this.queries = new Parameters(this.event.queryStringParameters);
    this.requestContext = this.event.requestContext ?? {};
    const contentType = this.headers.get('Content-Type') || this.headers.get('content-type');
    this.isMultipartFormData = /^multipart\/form-data.*$/.test(contentType);
    this.files = {};

    if (this.isMultipartFormData) {
      this.busboy = busboy({
        headers: {
          'content-type': contentType,
        },
      });
    }

    if (typeof this.event.body === 'string') {
      try {
        this.body = new Parameters(JSON.parse(this.event.body));
      } catch (error) {
        this.body = new Parameters(undefined);
      }
    } else if (this.event.body) {
      this.body =new Parameters(this.event.body);
    } else {
      this.body = new Parameters(undefined);
    }

    for (const extension of extensions) {
      Joi.extend(extension);
    }
  }
  public has(key: string): boolean {
    return this.queries.has(key) || this.body.has(key) || false;
  }
  public parameter(key: string): string | null {
    return this.parameters.get(key) ?? null;
  }
  public get(key: string, defaultValue?: any): any {
    return this.queries.get(key, defaultValue) ?? defaultValue;
  }
  public inputs(keys: string[]): { [key: string]: any } {
    let queryResult = this.queries.gets(keys);
    let bodyResult = this.body.gets(keys);
    if (bodyResult) {
      bodyResult = filterEntries(bodyResult, ([_, value]) => value !== null);
    }
    return Object.assign({}, queryResult, bodyResult);
  }
  public input(key: string, defaultValue: any = null): any {
    return this.queries.get(key, defaultValue) ??
      this.body.get(key, defaultValue) ??
      defaultValue;
  }
  public validate(
    keysProvider: (Joi: Joi.Root) => { [key: string]: Joi.Schema },
    options: Omit<ValidationOptions, 'abortEarly'> = {},
  ) {
    const inputs = this.inputs(Object.keys(keysProvider(Joi)));
    return validate(inputs, keysProvider, options);
  }
  public header(key: string): string | null {
    return this.headers.get(key) ?? null;
  }
  public async file(key: string) {
    const processIsFinished = await this.processFiles();
    if (processIsFinished) {
      return Promise.resolve(this.files[key].binary || null);
    }
  }
  public user(): Promise<{ [key: string]: any } | null> {
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
  public processFiles(): Promise<boolean | null> {
    return new Promise((resolve, reject) => {
      try {
        this.busboy?.on('field', (fieldName: any, value: any) => {
          this.body.set(fieldName, value);
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

function filterEntries(obj: { [key: string]: any }, cb: ([key, value]: [string, any]) => boolean): any {
  return Object.fromEntries(Object.entries(obj).filter(cb));
}