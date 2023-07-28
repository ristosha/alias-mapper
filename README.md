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
