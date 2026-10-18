class YupSchema {
  required(_msg?: string) { return this }
  min(_val: number, _msg?: string) { return this }
  max(_val: number, _msg?: string) { return this }
  default(_val: any) { return this }
  oneOf(_vals: any[], _msg?: string) { return this }
  trim() { return this }
  uppercase() { return this }
  integer(_msg?: string) { return this }
  validateSync(val: any, _opts?: any) { return val }
  validate(val: any, _opts?: any) { return Promise.resolve(val) }
}

export const string = () => new YupSchema()
export const number = () => new YupSchema()
export const boolean = () => new YupSchema()
export const object = (_shape?: Record<string, any>) => new YupSchema()
export class ValidationError extends Error {
  inner: Array<{ path?: string; message: string }> = []
}
export type InferType<T> = any
export default {
  string,
  number,
  boolean,
  object,
  ValidationError,
}

