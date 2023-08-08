# alias-mapper

A small utility for mapping aliases in JavaScript/Typescript objects.

## Usage

alias-mapper provides two types of alias mapping:

#### Composite Aliases

Map source keys to a composite target object:

```js
import { compositeAliases } from 'alias-mapper'

const { build } = compositeAliases({
  center: {
    _aliases: ['c'],
    x: 'center',
    y: 'middle'
  }
})

const source = {
  c: true
}

const result = build(source) // -> { x: 'center', y: 'middle' }
```

You can also compute a value with compositeAliases using `_compute`.
In a single alias, normal key-values can be used together with `_compute`,
but note that `_compute` is executed after the entire map has been computed.
This way you can target the already generated static mapping results in your computation function.

```typescript
const comp = compositeAliases({
  color: {
    _aliases: ['c'],
    _compute: (value, context) => { // parse colors like '#ff0000' or 'rgb(255, 0, 0)'
      if (value.startsWith('rgb(')) {
        const [r, g, b] = value.slice(4, -1).split(',').map(Number)
        return { color: { r, g, b } }
      } else if (value.startsWith('#')) {
        const r = parseInt(value.slice(1, 3), 16)
        const g = parseInt(value.slice(3, 5), 16)
        const b = parseInt(value.slice(5, 7), 16)
        return { color: { r, g, b } }
      }
      return {}
    }
  }
})

comp.build({ c: '#ff0000' }) // -> { color: { r: 255, g: 0, b: 0 }}
```


#### Key-Value Aliases

Map source keys/values to aliased target keys/values:

```js
import { keyValueAliases } from 'alias-mapper'

const { build } = keyValueAliases({
  firstName: {
    _aliases: ['fn'],
  },
  status: {
    active: ['a'],
    inactive: ['i']
  }
})

const source = {
  fn: 'John',
  s: 'a'  
}

const result = build(source)

// result
{
  firstName: 'John'
  status: 'active'
}
```

##### Cast your types in key-value maps (> 1.0.3)
The `_castTo` feature was added in version 1.0.3.
This feature allows you to specify the type to which a value should be cast when applying key-value aliases.
You can do this by adding an optional `_castTo` field to the alias map object for a given key.

The `_castTo` field can take the values `boolean` or `number`,
indicating that the value should be cast to a boolean or a number, respectively.

_Boolean example_:
```typescript
interface Switch {
  enabled: boolean
}

const kv = keyValueAliases<Switch>({
  enabled: {
    _aliases: ['status'],
    _castTo: 'boolean',
    true: ['on'],
    false: ['off']
  }
})

const result = kv.build({ status: 'on' })

// result
{
  enabled: true
}
```
The check is for a match with `true` in any regex. So if the conversion is impossible, the result will be `false`.


_Number example:_

```typescript
interface Counter {
  value: number
}

const kv = keyValueAliases<Counter>({
  value: {
    _castTo: 'number',
    0: ['reset']
  }
})

const result = kv.build({ value: '5' })
// result
{
  value: 5
}

const result2 = kv.build({ value: 'reset '})
{
  value: 0
}
```
Casting to `number` uses the built-in `Number()` constructor. So if conversion is not possible, the value will be `NaN`.

### Typescript support

You can improve your development experience by using Typescript interfaces as generics to functions. This will give you an autocomplete for more convenient schema completion.

```typescript
interface Pos {
  x: 'left' | 'center' | 'right',
  y: 'bottom' | 'middle' | 'top'
}

const { build: comp } = compositeAliases<Pos>({
  center: {
    _aliases: ['c'],
    x: 'center', // autocomplete your interface variables
    y: 'middle'
  }
})

const { build: kv } = keyValueAliases<Pos>({
  x: {
    _aliases: ['horizontal'],
    center: ['c'], // autocomplete your enum values
    right: ['r'],
    left: ['l']
  }
})
```

However, `build()` will still return any. It is assumed that a library like [zod](https://github.com/colinhacks/zod) will be used for parsing values.

## Contributing

Contributions are welcome! Please open an issue or PR on GitHub.

## License

MIT
