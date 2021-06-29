import axios from 'axios';

export namespace CustomResource {
  export interface EventProps {
    RequestType: string;
    ServiceToken: string;
    ResponseURL: string;
    StackId: string;
    RequestId: string;
    LogicalResourceId: string;
    PhysicalResourceId: string;
    ResourceType: string;
    ResourceProperties: {
      [key: string]: any;
    };
    OldResourceProperties?: {
      [key: string]: any;
    };
  }

  export class Request {

    public readonly _event: EventProps;

    constructor(event: { [key: string]: any }) {
      this._event = event as EventProps;
    }

    public on(types: string | string[]): boolean {
      if (typeof types === 'string') {
        types = [types];
      }
      return types.map(type => {
        return type.toLowerCase();
      }).indexOf(
        this._event.RequestType.toLowerCase(),
      ) > -1;
    }

    public requestType(): string {
      return this._event.RequestType;
    }

    public properties(): { [key: string]: string } {
      return this._event.ResourceProperties ?? {};
    }

    public property(key: string): string | null {
      return this.properties()[key] ?? null;
    }

    public oldProperties(): { [key: string]: string } {
      return this._event.OldResourceProperties ?? {};
    }

    public oldProperty(key: string): string | null {
      return this.oldProperties()[key] ?? null;
    }
  }

  export class Response {

    private readonly _event: EventProps;

    constructor(event: { [key: string]: any }) {
      this._event = event as EventProps;
    }

    public async success(data: { [key: string]: string }): Promise<{}> {
      return this.send(data, null);
    }

    public async failed(error: Error): Promise<{}> {
      return this.send(null, error);
    }

    public send(data: { [key: string]: string } | null, error: Error | null): Promise<{}> {
      const responseBody = JSON.stringify({
        Status: error ? 'FAILED' : 'SUCCESS',
        Reason: error ? error.toString() : 'Success',
        PhysicalResourceId: this._event.PhysicalResourceId ?? this._event.RequestId,
        StackId: this._event.StackId,
        RequestId: this._event.RequestId,
        LogicalResourceId: this._event.LogicalResourceId,
        Data: data,
      });
      return axios.put(this._event.ResponseURL, responseBody);
    }
  }
}