import { assertEquals } from 'https://deno.land/std@0.196.0/testing/asserts.ts'
import { keyValueAliases } from '../src/mod.ts'

interface Bio {
  firstName: 'Adam' | 'John' | 'Sylphiette'
  lastName: string
  test: boolean
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

interface BooleanTest {
  test: boolean
}

Deno.test('boolean cast test', () => {
  const kv = keyValueAliases<BooleanTest>({
    test: {
      _aliases: ['t'],
      _castTo: 'boolean',
      true: ['yes', 'on'],
      false: ['no', 'off']
    }
  })

  assertEquals(kv.build({ t: 'yes' }), { test: true })
  assertEquals(kv.build({ t: 'whoa?'}), { test: false })
})

interface NumberTest {
  test: number
}

Deno.test('number cast test', () => {
  const kv = keyValueAliases<NumberTest>({
    test: {
      _aliases: ['t'],
      _castTo: 'number',
      5: ['five']
    }
  })

  assertEquals(kv.build({ t: 'five' }), { test: 5 })
  assertEquals(kv.build({ t: '10'}), { test: 10 })
  assertEquals(kv.build({ t: 'a' }), { test: NaN })
})

Deno.test('switcher', () => {
  interface Switch {
    enabled: boolean
  }

  const kv2 = keyValueAliases<Switch>({
    enabled: {
      _aliases: ['status'],
      _castTo: 'boolean',
      true: ['on'],
      false: ['off']
    }
  })

  assertEquals(kv2.build({ status: 'on' }), { enabled: true })
})

Deno.test('counter', () => {
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
  assertEquals(result, { value: 5 })

  const result2 = kv.build({ value: 'reset'})
  assertEquals(result2, { value: 0 })
})
