interface IStorageModule<TState, TEffects> {
  effects: TEffects;
  initialState: TState;
}

type GlobalEffectUnion<T> = T extends unknown ? (s: T, p: any) => T : never;

interface IGlobalStorage<TState, TEffects extends Record<keyof TEffects, any>> {
  effects: TEffects;
  initialState: TState;
}

type UnionToIntersection<T> = (T extends unknown
  ? ((p: T) => void)
  : never) extends ((p: infer U) => void)
  ? U
  : never;

type GlobalState<T extends Record<keyof T, IStorageModule<any, any>>> = {
  [P in keyof T]: T[P]['initialState']
};

type GlobalEffects<
  T extends Record<keyof T, IStorageModule<any, any>>
> = UnionToIntersection<{ [P in keyof T]: T[P]['effects'] }[keyof T]>;

type Id<T> = {} & { [P in keyof T]: T[P] };

export declare function createSystemStorage<
  T extends Record<keyof T, IStorageModule<any, any>>
>(
  storageEntitiesObj: T
): IGlobalStorage<Id<GlobalState<T>>, Id<GlobalEffects<T>>>;

type ActionPayload<TEffects, E extends keyof TEffects> = TEffects[E] extends ((
  s: any,
  p: infer P
) => void)
  ? {
      payload: P;
    }
  : {};

export type Dispatch<TGlobalStorage extends IGlobalStorage<any, any>> = <
  T extends keyof TGlobalStorage['effects']
>(
  action: { type: T } & ActionPayload<TGlobalStorage['effects'], T>
) => void;

export declare function createStore<T extends IGlobalStorage<any, any>>(
  systemStorage: T
): {
  state: T['initialState'];
  dispatch: Dispatch<T>;
};

type Omit<T, K extends PropertyKey> = Pick<T, Exclude<keyof T, K>>;

export declare function connect<TState, TMapped>(
  mapStateToProps: (state: TState) => TMapped
): <TProps extends TMapped>(
  fn: React.ComponentType<TProps>
) => React.ComponentType<Omit<TProps, keyof TMapped | 'dispatch'>>;

export declare function createProvider<T extends IGlobalStorage<any, any>>(
  systemStorage: T
): React.FunctionComponent;
