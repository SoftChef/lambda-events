import * as Joi from 'joi';
import {
  ValidationOptions,
} from 'joi';

export class Parameters {
  private readonly context?: { [key: string]: any };
  constructor(context: { [key: string]: any } | undefined) {
    this.context = context;
  }
  public has(key: string): boolean {
    return this.context?.[key] !== undefined;
  }
  public gets(keys: string[]): { [key: string]: any } {
    const inputs: { [key: string]: any } = {};
    for (let key of keys) {
      inputs[key] = this.get(key);
    }
    return inputs;
  }
  public get(key: string, defaultValue: any = null): any {
    return this.context?.[key] ?? defaultValue;
  }
  public set(key: string, value: any = null): this {
    this.context![key] = value;
    return this;
  }
  public validate(
    keysProvider: (Joi: Joi.Root) => { [key: string]: Joi.Schema },
    options: Omit<ValidationOptions, 'abortEarly'> = {},
  ) {
    return validate(this.context, keysProvider, options);
  }
}

export function validate(
  input: any,
  keysProvider: (Joi: Joi.Root) => { [key: string]: Joi.Schema },
  options: Omit<ValidationOptions, 'abortEarly'> = {},
): {
    error: boolean;
    details: {
      key: string;
      label: string;
      value: any;
      message: string;
    }[];
  } {
  const keys: { [key: string]: Joi.Schema } = keysProvider(Joi);
  const schema: Joi.ObjectSchema = Joi.object().keys(keys);
  const result: Joi.ValidationResult = schema.validate(
    input,
    {
      abortEarly: false,
      ...options,
    },
  );
  let details = result.error?.details.map(detail=>({
    key: detail.context?.key ?? '',
    label: detail.context?.label ?? '',
    value: detail.context?.value ?? null,
    message: detail.message,
  }));
  return {
    error: details !== undefined,
    details: details ?? [],
  };
}