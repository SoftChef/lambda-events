import {
  Parameters,
} from './parameters';

export class PathParameters extends Parameters {
  constructor(context: { [key: string]: string } | undefined) {
    super(context);
  }
  public get(key: string): string {
    let parameter = super.get(key);
    if (parameter) {
      parameter = decodeURI(parameter);
    }
    return parameter;
  }
}