import { RestApiRequest } from './request';
import {
  RestApiResponseOutput,
  RestApiResponse,
} from './response';

export namespace RestApi {
  export class Request extends RestApiRequest {};
  export class Response extends RestApiResponse {};
  export interface ResponseOutput extends RestApiResponseOutput {};
}

export class Request extends RestApiRequest {};
export class Response extends RestApiResponse {};
export interface ResponseOutput extends RestApiResponseOutput {};