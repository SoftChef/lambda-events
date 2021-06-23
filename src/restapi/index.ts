import { RestApiRequest } from './request';
import { RestApiResponse } from './response';

export namespace RestApi {
  export class Request extends RestApiRequest {};
  export class Response extends RestApiResponse {};
}

export class Request extends RestApiRequest {};
export class Response extends RestApiResponse {};