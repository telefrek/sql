/**
 * An query that can be submitted to an engine
 */
export interface SubmittableQuery<
  _RowType extends object | number = object | number
> {
  readonly name: string
  readonly queryString: string
}

/**
 * A query that has parameters bound to it
 */
export interface BoundQuery<
  RowType extends object | number = object | number,
  Parameters extends object = object
> extends SubmittableQuery<RowType> {
  readonly parameters: Parameters
}

/**
 * A query that requires parameters to be provided
 */
export interface ParameterizedQuery<
  RowType extends object | number = object | number,
  Parameters extends object = object
> extends SubmittableQuery<RowType> {
  /**
   *
   * @param parameters The parameters to bind to a new submittable query
   */
  bind(parameters: Parameters): BoundQuery<RowType, Parameters>
}

/**
 * Default query class to use for simple cases
 */
export class DefaultSubmittableQuery<RowType extends object | number>
  implements SubmittableQuery<RowType>
{
  constructor(readonly name: string, readonly queryString: string) {}
}

/**
 * Default query class that requires parameters either on execute or during bind
 */
export class DefaultParameterizedQuery<
  RowType extends object | number,
  Parameters extends object
> implements ParameterizedQuery<RowType, Parameters>
{
  constructor(readonly name: string, readonly queryString: string) {}

  bind(parameters: Parameters): BoundQuery<RowType, Parameters> {
    return new DefaultBoundQuery(this.name, this.queryString, parameters)
  }
}

/**
 * Default implementation of a bound query
 */
export class DefaultBoundQuery<
  RowType extends object | number,
  Parameters extends object
> implements BoundQuery<RowType, Parameters>
{
  constructor(
    readonly name: string,
    readonly queryString: string,
    readonly parameters: Parameters
  ) {}
}
