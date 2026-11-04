import * as api from '../api/fakeApi.js'

// Pages and hooks use this boundary; the fake API remains the data provider.
export function getItemsList(query = '') {
  return api.getItemsList(query)
}

export function getDashboard(query = '') {
  return api.getDashboard(query)
}

export function getItem(id) {
  return api.getItem(id)
}

export function createItem(values) {
  return api.createItem(values)
}

export function updateItem(id, changes) {
  return api.updateItem(id, changes)
}

export function deleteItem(id) {
  return api.deleteItem(id)
}
