import { assertEquals } from 'https://deno.land/std@0.196.0/testing/asserts.ts'
import { keyValueAliases } from '../src/mod.ts'

interface Bio {
  firstName: 'Adam' | 'John' | 'Sylphiette'
  lastName: string
}

Deno.test('keyValueAliases', () => {
  const kv = keyValueAliases<Bio>({
    firstName: {
      _aliases: ['name'],
      Sylphiette: ['Sylphy', 'Fitts']
    },
    lastName: {
      _aliases: ['surname']
    }
  })

  const obj = {
    name: 'Sylphy',
    surname: 'Gureiratto'
  }

  assertEquals(kv.build(obj), {
    firstName: 'Sylphiette',
    lastName: 'Gureiratto'
  })
})
