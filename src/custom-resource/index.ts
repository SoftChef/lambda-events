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

    public readonly event: { [key: string]: any };

    constructor(event: EventProps) {
      this.event = event;
    }

    public on(types: string | string[]): boolean {
      if (typeof types === 'string') {
        types = [types];
      }
      return types.map(type => {
        return type.toLowerCase();
      }).indexOf(
        this.event.RequestType.toLowerCase(),
      ) > -1;
    }

    public requestType(): string {
      return this.event.RequestType;
    }

    public properties(): { [key: string]: string } {
      return this.event.ResourceProperties ?? {};
    }

    public property(key: string): string | null {
      return this.properties()[key] ?? null;
    }

    public oldProperties(): { [key: string]: string } {
      return this.event.OldResourceProperties ?? {};
    }

    public oldProperty(key: string): string | null {
      return this.oldProperties()[key] ?? null;
    }
  }

  export class Response {

    public readonly event: { [key: string]: any };

    constructor(event: { [key: string]: any }) {
      this.event = event;
    }

    public success(data: { [key: string]: string }): Promise<{}> {
      return this.send(data, null);
    }

    public async failed(error: Error): Promise<{}> {
      return this.send(null, error);
    }

    public send(data: { [key: string]: string } | null, error: Error | null): Promise<{}> {
      const responseBody = JSON.stringify({
        Status: error ? 'FAILED' : 'SUCCESS',
        Reason: error ? error.toString() : 'Success',
        PhysicalResourceId: this.event.PhysicalResourceId ?? this.event.RequestId,
        StackId: this.event.StackId,
        RequestId: this.event.RequestId,
        LogicalResourceId: this.event.LogicalResourceId,
        Data: data,
      });
      return axios.put(this.event.ResponseURL, responseBody);
    }
  }
}