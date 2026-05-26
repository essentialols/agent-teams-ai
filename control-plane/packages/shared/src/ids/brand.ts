export type Brand<TBrand extends string> = {
  readonly __brand: TBrand;
};

export type OpaqueId<TBrand extends string> = string & Brand<TBrand>;
