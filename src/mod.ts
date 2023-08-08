type MaybePromise<T> = PromiseLike<T> | T

export type CompositeAliasMapFunction<T = any> =
  (value: any, context: Readonly<Record<string, any>>) =>
    MaybePromise<{ [K in keyof T | string]?: K extends keyof T ? T[K] : any }>

export type CompositeAliasMapValue<T> = {
  [K in keyof T | '_aliases' | '_compute']?: K extends '_aliases'
    ? string[]
    : K extends '_compute'
      ? CompositeAliasMapFunction<T>
      : K extends keyof T
        ? T[K]
        : never
}

/**
 * Type for a composite alias map.
 *
 * Maps source keys to a nested object with target mappings.
 *
 * It can optionally be generics-based for interfaces.
 *
 * @example
 * ```ts
 * // it also can be used without an interface, but it gives you autocomplete
 * interface User {
 *   firstName: string
 *   lastName: string
 * }
 *
 * const comp: CompositeAliasMap<User> = {
 *    anonymous: {
 *      firstName: 'Anonymous'
 *      lastName: 'Duck'
 *    }
 * }
 * */
export type CompositeAliasMap<T = any> = Record<string, CompositeAliasMapValue<T>>
/**
 * Type for a composite alias map.
 *
 * Maps source keys to a nested object with target mappings.
 *
 * It can optionally be generics-based for interfaces.
 *
 * @example
 * ```ts
 * // it also can be used without an interface, but it gives you autocomplete
 * interface User {
 *   firstName: string;
 *   lastName: string;
 * }
 *
 * const kv: KeyValueAliasMap<User> = {
 *   firstName: {
 *     _aliases: ['name']
 *     ad: 'Adam'
 *   }
 * }
 * */
type NumberKeys = { [K in number]: K };

export type KeyValueAliasMap<T = any> = {
  [K in keyof T]?: T[K] extends boolean
    ? { true?: string[]; false?: string[]; _aliases?: string[]; _castTo?: 'boolean' }
    : T[K] extends number
      ? { [V in keyof NumberKeys | '_aliases' | '_castTo']?: V extends '_castTo' ? 'number' : string[] }
      : {
        [V in Extract<T[K], string> | '_aliases' | '_castTo']?: V extends '_castTo'
          ? 'boolean' | 'number'
          : string[]
      }
}


export type CachedMapBuildFunction = (obj: Record<string, any>) => Record<string, any>// T extends CompositeAliasMap<infer U> | KeyValueAliasMap<infer U> ? U : any

export interface MapWithCachedKeys<T extends CompositeAliasMap | KeyValueAliasMap> {
  map: T
  keyCache: Map<string, string>
  build: CachedMapBuildFunction
}

export interface CachedMap<T extends CompositeAliasMap | KeyValueAliasMap> extends MapWithCachedKeys<T> {
  valueCache: Map<string, Map<string, string>>
}

/**
 * Caches key aliases for the provided map. (works with KeyValueAliasMap and CompositeAliasMap)
 *
 * @param map The map to cache aliases for
 * @return A Map mapping aliases to original keys
 *
 * @example
 * ```typescript
 * const map = {
 *   name: { _aliases: ['n'] }
 * }
 *
 * const cache = cacheKeyAliases(map)
 * // cache = Map(2) { 'name' => 'name', 'n' => 'name' }
 * ```
 */
export function cacheKeyAliases (map: KeyValueAliasMap | CompositeAliasMap) {
  const cached = new Map<string, string>()
  // @ts-expect-error false error
  for (const [key, { _aliases: aliases }] of Object.entries(map)) {
    cached.set(key, key)
    if (aliases === undefined || aliases.length === 0) continue
    for (const alias of aliases) {
      cached.set(alias, key)
    }
  }
  return cached
}

/**
 * Caches value aliases for the provided key-value alias map. (only works with KeyValueAliasMap)
 *
 * @param map The key-value alias map to cache value aliases for
 * @return A Map mapping keys to Maps of alias -> value
 *
 * @example
 * ```typescript
 * const map = {
 *   status: {
 *     active: ['a'],
 *     inactive: ['i']
 *   }
 * }
 *
 * const cache = cacheValueAliases(map)
 * // cache = Map(1) {
 * //   status: Map(2) { 'a' => 'active', 'i' => 'inactive' }
 * // }
 * ```
 */
export function cacheValueAliases (map: KeyValueAliasMap) {
  const valueAliasesMap = new Map<string, Map<string, string>>()
  for (const [key, opts] of Object.entries(map)) {
    if (opts == null) continue

    const valueMap = new Map<string, string>()
    for (const [value, aliases] of Object.entries(opts)) {
      if (value === '_aliases' || aliases == null || !Array.isArray(aliases)) continue
      for (const alias of aliases) {
        valueMap.set(alias, value)
      }
    }

    valueAliasesMap.set(key, valueMap)
  }
  return valueAliasesMap
}

/**
 * Applies composite aliases to the provided source object using the given alias map.
 *
 * This is intended for internal use within `compositeAliases`.
 *
 * @param source The source object to apply aliases to
 * @param aliasMap The composite alias map
 * @param keyAliasCache A pre-cached key alias Map (optional)
 * @return The source object with aliases applied
 *
 * @example
 * ```typescript
 * const source = { a: true }
 * const map = {
 *   active: {
 *     _aliases: ['a'],
 *     status: 'active'
 *   }
 * }
 *
 * const result = applyCompositeAliases(source, map)
 * // result = { status: 'active' }
 * ```
 */
export function applyCompositeAliases (
  source: Record<string, any>,
  aliasMap: CompositeAliasMap,
  keyAliasCache = cacheKeyAliases(aliasMap)
): any {
  const result: Record<string, any> = {}
  const computeFunctions: [CompositeAliasMapFunction, any][] = []
  for (const [sourceKey, sourceValue] of Object.entries(source)) {
    const destKey = keyAliasCache.get(sourceKey)
    if (destKey == null) {
      result[sourceKey] = sourceValue
      continue
    }

    const { _aliases, _compute, ...destMappings } = aliasMap[destKey]
    if (_compute != null && typeof _compute === 'function') {
      computeFunctions.push([_compute, sourceValue])
    }

    if (!(typeof sourceValue === 'boolean' && sourceValue)) {
      continue
    }

    for (const [mappedKey, mappedValue] of Object.entries(destMappings)) {
      result[mappedKey] = mappedValue
    }
  }

  if (computeFunctions.length > 0) {
    for (const [computeFunction, sourceValue] of computeFunctions) {
      const computedValues = computeFunction(sourceValue, result)
      Object.assign(result, computedValues)
    }
  }

  return result
}

/**
 * Creates a cached composite alias helper with map, caches, and application function.
 *
 * @param map The composite alias map
 * @return Object with map, caches and build function
 *
 * @example
 * ```js
 *
 * // using interface is not required, but it gives you autocomplete
 * interface Status {
 *    status: 'active' | 'offline'
 * }
 *
 * const { build } = compositeAliases<Status>({
 *   active: {
 *     _aliases: ['a'],
 *     status: 'active'
 *   }
 * })
 *
 * const result = build({ active: true })
 * // Applies aliases using cached maps
 * ```
 */
export function compositeAliases<T> (map: CompositeAliasMap<T>): MapWithCachedKeys<CompositeAliasMap<T>> {
  const keyCache = cacheKeyAliases(map)
  const result = {
    map,
    keyCache,
    build: (obj: Record<string, any>) => applyCompositeAliases(obj, result.map, result.keyCache)
  }
  return result
}

function castValue(value: any, castTo: 'boolean' | 'number'): string | boolean | number | undefined {
  let castedValue: string | boolean | number | undefined = value
  if (castTo === 'boolean') {
    castedValue = value.toLowerCase() === 'true' || String(value) === '1'
  } else if (castTo === 'number') {
    castedValue = Number(value)
  }
  return castedValue
}


/**
 * Applies key-value aliases to the provided source object using the given alias map and caches.
 *
 * This is intended for internal use within `keyValueAliases`.
 *
 * @param source The source object to apply aliases to
 * @param aliasMap The key-value alias map
 * @param keyAliasCache A pre-cached key alias Map
 * @param valueAliasCache A pre-cached value alias Map
 * @return The source object with key-value aliases applied
 *
 * @example
 * ```js
 * const source = { n: 'Ad' }
 * const map = { name: { _aliases: ['n'], Ad: 'Adam' } }
 *
 * const result = applyKeyValueAliases(source, map, keyCache, valueCache)
 * // result = { name: 'Adam' }
 * ```
 */
export function applyKeyValueAliases (
  source: Record<string, any>,
  aliasMap: KeyValueAliasMap,
  keyAliasCache = cacheKeyAliases(aliasMap),
  valueAliasCache = cacheValueAliases(aliasMap)
): any {
  const result: Record<string, any> = {}
  for (const [key, value] of Object.entries(source)) {
    const destKey = keyAliasCache.get(key)
    if (destKey == null) {
      result[key] = value
      continue
    }

    const castTo = aliasMap[destKey]?._castTo as 'number' | 'boolean' | undefined
    let destValue: string | boolean | number | undefined = valueAliasCache.get(destKey)?.get(value)
    if (castTo != null) {
      if (destValue != null) destValue = castValue(destValue, castTo)
      else destValue = castValue(value, castTo)
    }

    result[destKey] = destValue ?? value
  }

  return result
}

/**
 * Creates a cached key-value alias helper with map, caches, and application function.
 *
 * @param map The key-value alias map
 * @return CachedMap object with map, caches and build function
 *
 * @example
 * ```js
 * interface UserInfo {
 *   name: string
 * }
 * const { build } = keyValueAliases({ name: { _aliases: ['n'], Ad: 'Adam' } })
 *
 * const result = build({ n: 'Ad' })
 * // Applies aliases using cached maps
 * ```
 */
export function keyValueAliases<T> (map: KeyValueAliasMap<T>): CachedMap<KeyValueAliasMap<T>> {
  const keyCache = cacheKeyAliases(map)
  const valueCache = cacheValueAliases(map)
  const result = {
    map,
    keyCache,
    valueCache,
    build: (obj: Record<string, any>) => applyKeyValueAliases(obj, result.map, result.keyCache, result.valueCache)
  }
  return result
}
