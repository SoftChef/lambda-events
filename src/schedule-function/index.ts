export namespace ScheduleFunction {
  export interface EventProps {
    scheduleId: string;
    scheduledAt: string;
    id: string;
    targetType: string;
    description?: string;
    status: string;
    context: {
      [key: string]: any;
    };
  }

  export interface ResponseProps {
    scheduleId: string;
    success: boolean;
    result: {
      [key: string]: any;
    } | Error;
  }

  export class Request {

    private readonly _event: EventProps;

    constructor(event: EventProps) {
      this._event = event;
    }

    public context(key?: string): any {
      let result;
      if (key) {
        result = this._event.context[key];
      } else {
        result = this._event.context;
      }
      return result;
    }

    get scheduleId(): string {
      return this._event.scheduleId;
    }

    get scheduledAt(): string {
      return this._event.scheduledAt;
    }

    get id(): string {
      return this._event.id;
    }

    get description(): string | null {
      return this._event.description ?? null;
    }

    get targetType(): string {
      return this._event.targetType;
    }

    get status(): string {
      return this._event.status;
    }
  }

  export class Response {

    private readonly _event: EventProps;

    constructor(event: EventProps) {
      this._event = event;
    }

    public success(result: { [key: string]: any }): ResponseProps {
      return {
        scheduleId: this._event.scheduleId,
        success: true,
        result: result,
      };
    }

    public failed(error: { [key: string]: any } | Error): ResponseProps {
      return {
        scheduleId: this._event.scheduleId,
        success: false,
        result: error,
      };
    }
  }
}