import { assertEquals } from 'https://deno.land/std@0.196.0/testing/asserts.ts'
import { compositeAliases } from '../src/mod.ts'

interface Pos {
  x: 'left' | 'center' | 'right'
  y: 'bottom' | 'center' | 'top'
  marginTop: number
  marginRight: number
  marginBottom: number
  marginLeft: number
}

Deno.test('compositeAliases color compute', () => {
  const comp = compositeAliases({
    color: {
      _aliases: ['c'],
      _compute: (value) => { // parse colors like '#ff0000' or 'rgb(255, 0, 0)'
        if (value.startsWith('rgb(')) {
          const [r, g, b] = value.slice(4, -1).split(',').map(Number);
          return { color: { r, g, b } };
        } else if (value.startsWith('#')) {
          const r = parseInt(value.slice(1, 3), 16);
          const g = parseInt(value.slice(3, 5), 16);
          const b = parseInt(value.slice(5, 7), 16);
          return { color: { r, g, b } };
        }
        return {}
      }
    }
  });

  assertEquals(comp.build({ c: '#ff0000' }), { color: { r: 255, g: 0, b: 0} })
})

Deno.test('compositeAliases with one _computed functions', () => {


  const comp = compositeAliases<Pos>({
    margin: { // format like css: '40' or '40:20' or '40:10:20:30' (top-right-bottom-left)
      _aliases: ['m'],
      _compute: value => {
        const values = value.split(':').map(Number)
        let [marginTop, marginRight, marginBottom, marginLeft] = values
        if (values.length === 1) {
          marginLeft = marginRight = marginBottom = marginTop
        } else if (values.length === 2) {
          marginBottom = marginTop
          marginLeft = marginRight
        }

        return { marginTop, marginRight, marginBottom, marginLeft }
      }
    }
  })

  const obj = {
    margin: '40'
  }

  assertEquals<Partial<Pos>>(comp.build(obj), {
    marginTop: 40,
    marginBottom: 40,
    marginLeft: 40,
    marginRight: 40
  })
})

Deno.test('compositeAliases without computed', () => {
  const comp = compositeAliases<Pos>({
    center: {
      _aliases: ['c'],
      x: 'center',
      y: 'center'
    }
  })

  const obj = {
    center: true
  }

  assertEquals<Partial<Pos>>(comp.build(obj), {
    x: 'center',
    y: 'center'
  })
})
