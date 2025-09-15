import LineBreaker from 'linebreak';
import assert from 'assert';

describe('[Symbol.iterator]', function () {
  const text = 'Hello world...\n1.5, 2.\n(Hello, world?)\nfoo(bar), foo_bar, foo-bar.';

  it('works with `for...of` loop', () => {
    const log = [];
    const console = { log: (msg) => log.push(msg) };
    const breaker = new LineBreaker(text);

    for (const bk of breaker) {
      console.log(
        bk.substring.replace(/ $/, '~') + (bk.required ? '<brk>' : ''),
      );
    }

    assert.deepStrictEqual(log, [
      'Hello~',
      'world...\n<brk>',
      '1.5,~',
      '2.\n<brk>',
      '(Hello,~',
      'world?)\n<brk>',
      'foo(bar),~',
      'foo_bar,~',
      'foo-',
      'bar.',
    ]);

    // already consumed, so no more results
    assert.deepStrictEqual([...breaker], []);
  });

  it('iterates to array', () => {
    const expected = [
      {
        position: 6,
        required: false,
        substring: 'Hello '
      },
      {
        position: 15,
        required: true,
        substring: 'world...\n'
      },
      {
        position: 20,
        required: false,
        substring: '1.5, '
      },
      {
        position: 23,
        required: true,
        substring: '2.\n'
      },
      {
        position: 31,
        required: false,
        substring: '(Hello, '
      },
      {
        position: 39,
        required: true,
        substring: 'world?)\n'
      },
      {
        position: 49,
        required: false,
        substring: 'foo(bar), '
      },
      {
        position: 58,
        required: false,
        substring: 'foo_bar, '
      },
      {
        position: 62,
        required: false,
        substring: 'foo-'
      },
      {
        position: 66,
        required: false,
        substring: 'bar.'
      }
    ];

    const breaker = new LineBreaker(text);
    assert.deepStrictEqual([...breaker], expected);
    // already consumed, so no more results
    assert.deepStrictEqual([...breaker], []);
  });
});
