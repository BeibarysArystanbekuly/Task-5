import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import vm from 'node:vm'
import { transformWithOxc } from 'vite'

// Exercise the actual components with controlled API promises, without adding
// browser/test dependencies. Each editor instance models React's selected-ID key.
let rendering
const apiCalls = []
const api = Object.fromEntries(['getItem', 'getItemsList', 'createItem', 'updateItem', 'deleteItem'].map((name) => [name, (...args) => {
  let resolve, reject
  const promise = new Promise((yes, no) => { resolve = yes; reject = no })
  apiCalls.push({ name, args, resolve, reject })
  return promise
}]))

function useState(initial) {
  const owner = rendering
  const index = owner.cursor++
  if (!(index in owner.states)) owner.states[index] = typeof initial === 'function' ? initial() : initial
  return [owner.states[index], (update) => {
    assert.equal(owner.disposed, false, 'No state updates after unmount')
    const next = typeof update === 'function' ? update(owner.states[index]) : update
    if (!Object.is(next, owner.states[index])) { owner.states[index] = next; owner.dirty = true }
  }]
}

function useEffect(callback, dependencies) {
  const owner = rendering
  const index = owner.cursor++
  const previous = owner.effects[index]
  if (!previous || dependencies.some((entry, i) => !Object.is(entry, previous.dependencies[i]))) {
    owner.pending.push(() => {
      previous?.cleanup?.()
      owner.effects[index] = { dependencies, cleanup: callback() }
    })
  }
}

const jsx = (type, props, key) => ({ type, props, key })
const { code } = await transformWithOxc(
  (await readFile(new URL('../src/App.jsx', import.meta.url), 'utf8')) + '\nexport { ItemEditor }',
  'App.jsx', { jsx: { runtime: 'automatic' } },
)
const modules = {
  react: { useState, useEffect },
  'react/jsx-runtime': { jsx, jsxs: jsx, Fragment: 'fragment' },
  './api/fakeApi': api,
  './App.css': {},
}
const componentModule = new vm.SourceTextModule(code)
await componentModule.link((specifier) => {
  const exports = modules[specifier]
  assert.ok(exports, `Unexpected import: ${specifier}`)
  return new vm.SyntheticModule(Object.keys(exports), function () {
    for (const [key, value] of Object.entries(exports)) this.setExport(key, value)
  })
})
await componentModule.evaluate()
const { default: App, ItemEditor } = componentModule.namespace

function mount(Component, props = {}) {
  const owner = { states: [], effects: [], pending: [], cursor: 0, dirty: true, disposed: false }
  owner.flush = () => {
    while (owner.dirty) {
      owner.dirty = false
      owner.cursor = 0
      rendering = owner
      owner.tree = Component(props)
      for (const effect of owner.pending.splice(0)) effect()
    }
  }
  owner.dispose = () => {
    owner.disposed = true
    for (const effect of owner.effects) effect?.cleanup?.()
  }
  owner.flush()
  return owner
}

function elements(tree) {
  if (!tree || typeof tree !== 'object') return []
  if (Array.isArray(tree)) return tree.flatMap(elements)
  return [tree, ...elements(tree.props?.children)]
}
function text(tree) {
  if (Array.isArray(tree)) return tree.map(text).join('')
  return typeof tree === 'object' && tree ? text(tree.props?.children) : String(tree ?? '')
}
const field = (owner, id) => elements(owner.tree).find((node) => node.props?.id === id)
const button = (owner, label) => elements(owner.tree).find((node) => node.type === 'button' && text(node) === label)
const calls = (name) => apiCalls.filter((call) => call.name === name)
const record = (id, overrides = {}) => ({ id, name: `Item ${id}`, description: `Details ${id}`, category: 'General', status: 'Planned', priority: 'Normal', owner: 'Team', dueDate: '2026-12-01', ...overrides })
const response = (data) => ({ data, total: data.length, page: 1, limit: 10, totalPages: data.length ? 1 : 0 })
async function settle(...owners) {
  for (let i = 0; i < 8; i++) {
    await Promise.resolve()
    for (const owner of owners) if (!owner.disposed) owner.flush()
  }
}
function editorProps(id) {
  const events = { busy: [], saved: [], completed: [] }
  return {
    events, id, onClose() {},
    onBusy: (value) => events.busy.push(value),
    onSaved: (value) => events.saved.push(value),
    onCompleted: (value) => events.completed.push(value),
  }
}

test('switching selected IDs ignores late details and late errors', async () => {
  for (const rejectLate of [false, true]) {
    const first = mount(ItemEditor, editorProps(1))
    const firstRequest = calls('getItem').at(-1)
    first.dispose()
    const second = mount(ItemEditor, editorProps(2))
    calls('getItem').at(-1).resolve(record(2))
    await settle(second)
    if (rejectLate) firstRequest.reject(new Error('Late error'))
    else firstRequest.resolve(record(1))
    await settle(second)
    assert.equal(field(second, 'item-name').props.value, 'Item 2')
    assert.ok(!text(second.tree).includes('Late error'))
    second.dispose()
  }
})

test('search and reload ignore superseded list responses and recover from errors', async () => {
  const app = mount(App)
  const initial = calls('getItemsList').at(-1)
  elements(app.tree).find((node) => node.props?.type === 'search').props.onChange({ target: { value: 'Item 2' } })
  app.flush()
  const search = calls('getItemsList').at(-1)
  assert.match(search.args[0], /search=Item\+2/)
  search.resolve(response([record(2)]))
  await settle(app)
  initial.resolve(response([record(1)]))
  await settle(app)
  assert.ok(text(app.tree).includes('Item 2'))
  assert.ok(!text(app.tree).includes('Item 1'))
  elements(app.tree).find((node) => node.type === 'button' && text(node).includes('Reload')).props.onClick()
  app.flush()
  calls('getItemsList').at(-1).reject(new Error('Offline'))
  await settle(app)
  assert.ok(text(app.tree).includes('Offline'))
  button(app, 'Try again').props.onClick()
  app.flush()
  calls('getItemsList').at(-1).resolve(response([]))
  await settle(app)
  assert.ok(text(app.tree).includes('No matching items'))
  app.dispose()
})

test('detail failures can be retried and unmount cleans up completion callbacks', async () => {
  const props = editorProps(9)
  const editor = mount(ItemEditor, props)
  calls('getItem').at(-1).reject(new Error('Details unavailable'))
  await settle(editor)
  assert.ok(text(editor.tree).includes('Details unavailable'))
  button(editor, 'Try again').props.onClick()
  editor.flush()
  calls('getItem').at(-1).resolve(record(9))
  await settle(editor)
  button(editor, 'Mark complete').props.onClick()
  editor.flush()
  const completion = calls('updateItem').at(-1)
  editor.dispose()
  completion.resolve(record(9, { status: 'Completed' }))
  await settle()
  assert.equal(props.events.completed.length, 0)
  assert.equal(completion.args[0], 9)
})

test('reloading an emptied last page loads the new last page', async () => {
  const app = mount(App)
  calls('getItemsList').at(-1).resolve({ ...response([record(1)]), total: 11, totalPages: 2 })
  await settle(app)
  elements(app.tree).find((node) => node.props?.['aria-label'] === 'Next page').props.onClick()
  app.flush()
  assert.match(calls('getItemsList').at(-1).args[0], /page=2/)
  calls('getItemsList').at(-1).resolve({ ...response([record(11)]), total: 11, page: 2, totalPages: 2 })
  await settle(app)
  elements(app.tree).find((node) => node.type === 'button' && text(node).includes('Reload')).props.onClick()
  app.flush()
  calls('getItemsList').at(-1).resolve({ ...response([]), total: 10, page: 2, totalPages: 1 })
  await settle(app)
  assert.match(calls('getItemsList').at(-1).args[0], /page=1/)
  calls('getItemsList').at(-1).resolve(response([record(1)]))
  await settle(app)
  assert.ok(text(app.tree).includes('Page 1 of 1'))
  app.dispose()
})

test('completion captures the ID, preserves unsaved edits, and handles failure and retry', async () => {
  const props = editorProps(7)
  const editor = mount(ItemEditor, props)
  calls('getItem').at(-1).resolve(record(7))
  await settle(editor)
  field(editor, 'item-name').props.onChange({ target: { value: 'Unsaved name' } })
  editor.flush()
  button(editor, 'Mark complete').props.onClick()
  editor.flush()
  const request = calls('updateItem').at(-1)
  assert.equal(request.args[0], 7)
  assert.equal(JSON.stringify(request.args[1]), JSON.stringify({ status: 'Completed' }))
  assert.equal(elements(editor.tree).find((node) => node.type === 'fieldset').props.disabled, true)
  const before = calls('updateItem').length
  elements(editor.tree).find((node) => node.type === 'form').props.onSubmit({ preventDefault() {} })
  editor.flush()
  assert.equal(calls('updateItem').length, before)
  request.reject(new Error('Temporary failure'))
  await settle(editor)
  assert.ok(text(editor.tree).includes('Temporary failure'))
  assert.equal(props.events.busy.at(-1), false)
  button(editor, 'Mark complete').props.onClick()
  editor.flush()
  calls('updateItem').at(-1).resolve(record(7, { status: 'Completed' }))
  await settle(editor)
  assert.equal(field(editor, 'item-name').props.value, 'Unsaved name')
  assert.equal(field(editor, 'item-status').props.value, 'Completed')
  assert.equal(props.events.completed[0].id, 7)
  assert.equal(button(editor, 'Completed').props.disabled, true)
  editor.dispose()
})

test('parent blocks conflicting selection and creation, and applies completion by response ID', async () => {
  const app = mount(App)
  calls('getItemsList').at(-1).resolve(response([record(1), record(2)]))
  await settle(app)
  let rows = elements(app.tree).filter((node) => node.props?.className?.startsWith('item-row'))
  rows[0].props.onClick()
  app.flush()
  const editor = elements(app.tree).find((node) => node.type === ItemEditor)
  editor.props.onBusy(true)
  app.flush()
  rows = elements(app.tree).filter((node) => node.props?.className?.startsWith('item-row'))
  assert.ok(rows.every((node) => node.props.disabled))
  assert.equal(elements(app.tree).find((node) => node.type === 'button' && text(node).includes('New item')).props.disabled, true)
  editor.props.onCompleted(record(1, { status: 'Completed' }))
  editor.props.onBusy(false)
  app.flush()
  assert.ok(text(app.tree).includes('Item #1 marked complete.'))
  calls('getItemsList').at(-1).resolve(response([record(1, { status: 'Completed' }), record(2)]))
  await settle(app)
  app.dispose()
})

test('create retries a failed extra-details save on the same ID, then edits and removes', async () => {
  const props = editorProps('new')
  const editor = mount(ItemEditor, props)
  for (const [id, value] of [['item-name', 'New item'], ['item-description', 'Description'], ['item-owner', 'Owner']]) {
    field(editor, id).props.onChange({ target: { value } })
    editor.flush()
  }
  const createCount = calls('createItem').length
  elements(editor.tree).find((node) => node.type === 'form').props.onSubmit({ preventDefault() {} })
  editor.flush()
  calls('createItem').at(-1).resolve(record(20))
  await settle(editor)
  calls('updateItem').at(-1).reject(new Error('Extra details failed'))
  await settle(editor)
  assert.ok(text(editor.tree).includes('Item #20 was created'))
  elements(editor.tree).find((node) => node.type === 'form').props.onSubmit({ preventDefault() {} })
  editor.flush()
  assert.equal(calls('createItem').length, createCount + 1)
  const retry = calls('updateItem').at(-1)
  assert.equal(retry.args[0], 20)
  for (const key of ['name', 'description', 'category', 'status', 'priority', 'owner', 'dueDate']) assert.ok(key in retry.args[1])
  retry.resolve(record(20))
  await settle(editor)
  assert.equal(props.events.saved.length, 1)
  button(editor, 'Delete item').props.onClick()
  editor.flush()
  button(editor, 'Yes, delete item').props.onClick()
  editor.flush()
  const remove = calls('deleteItem').at(-1)
  assert.equal(remove.args[0], 20)
  remove.resolve({ success: true, id: 20 })
  await settle(editor)
  assert.equal(props.events.saved.at(-1), 'Item deleted.')
  editor.dispose()
})
