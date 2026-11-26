import assert from 'node:assert/strict'
import test from 'node:test'
import { PendingTransactionDeletes } from '../lib/pending-transaction-deletes.ts'

test('undo cancels the request and other rows commit at five seconds', (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] })
  const queue = new PendingTransactionDeletes()
  const sent = []
  queue.schedule(1, () => sent.push(1))
  queue.schedule(2, () => sent.push(2))
  t.mock.timers.tick(4999)
  assert.deepEqual(sent, [])
  assert.equal(queue.cancel(1), true)
  t.mock.timers.tick(1)
  assert.deepEqual(sent, [2])
  assert.equal(queue.cancel(2), false)
})

for (const persisted of [true, false]) {
  test('pagehide flushes outstanding deletes once, persisted=' + persisted, (t) => {
    t.mock.timers.enable({ apis: ['setTimeout'] })
    const page = new EventTarget()
    const queue = new PendingTransactionDeletes()
    const unmount = queue.listen(page)
    const sent = []
    for (const id of [1, 2, 3]) queue.schedule(id, () => sent.push(id))
    queue.cancel(2)
    const hide = Object.assign(new Event('pagehide'), { persisted })
    page.dispatchEvent(hide)
    assert.deepEqual(sent, [1, 3])
    page.dispatchEvent(new Event('pageshow'))
    page.dispatchEvent(hide)
    unmount()
    t.mock.timers.tick(5000)
    assert.deepEqual(sent, [1, 3])
  })
}

test('SPA unmount flushes once and detaches the old listener', (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] })
  const page = new EventTarget()
  const queue = new PendingTransactionDeletes()
  const unmount = queue.listen(page)
  const sent = []
  queue.schedule(1, () => sent.push(1))
  unmount()
  assert.deepEqual(sent, [1])
  queue.schedule(2, () => sent.push(2))
  page.dispatchEvent(new Event('pagehide'))
  assert.deepEqual(sent, [1])
  t.mock.timers.tick(5000)
  assert.deepEqual(sent, [1, 2])
})
