import browser from './browser-api'
import AsyncLock from 'async-lock'

const storageLock = new AsyncLock()

export default class AccountStorage {
  constructor (id) {
    this.accountId = id
  }

  static async changeEntry (entryName, fn) {
    await storageLock.acquire(entryName, async () => {
      const d = await browser.storage.local.get({[entryName]: {}}) // default: {}
      var entry = d[entryName]
      entry = fn(entry)
      await browser.storage.local.set({[entryName]: entry})
    })
  }

  static getEntry (entryName) {
    return browser.storage.local.get({[entryName]: {}}) // default: {}
      .then(d => {
        return d[entryName]
      })
  }

  getAccountData () {
    return AccountStorage.getEntry(`accounts`).then((accounts) => {
      return accounts[this.accountId]
    })
  }

  setAccountData (data) {
    return AccountStorage.changeEntry(`accounts`, (accounts) => {
      accounts = accounts || {}
      accounts[this.accountId] = data
      return accounts
    })
  }

  deleteAccountData () {
    return AccountStorage.changeEntry(`accounts`, (accounts) => {
      delete accounts[this.accountId]
      return accounts
    })
  }

  initCache () {
    return browser.storage.local.set({[`bookmarks[${this.accountId}].cache`]: {} })
  }

  getCache () {
    return AccountStorage.getEntry(`bookmarks[${this.accountId}].cache`)
  }

  removeFromCache (localId) {
    return AccountStorage.changeEntry(`bookmarks[${this.accountId}].cache`, (cache) => {
      delete cache[localId]
      return cache
    })
  }

  addToCache (localId, hash) {
    return AccountStorage.changeEntry(`bookmarks[${this.accountId}].cache`, (cache) => {
      cache[localId] = hash
      return cache
    })
  }

  initMappings () {
    return browser.storage.local.set({[`bookmarks[${this.accountId}].mappings`]: {
      ServerToLocal: {}
      , LocalToServer: {}
      , UrlToLocal: {}
      , LocalToUrl: {}
    }})
  }

  getMappings () {
    return AccountStorage.getEntry(`bookmarks[${this.accountId}].mappings`)
  }

  removeFromMappings (localId) {
    return AccountStorage.changeEntry(`bookmarks[${this.accountId}].mappings`, (mappings) => {
      delete mappings.ServerToLocal[mappings.LocalToServer[localId]]
      delete mappings.LocalToServer[localId]
      delete mappings.UrlToLocal[mappings.LocalToUrl[localId]]
      delete mappings.LocalToUrl[localId]
      return mappings
    })
  }

  addToMappings (bookmark) {
    return AccountStorage.changeEntry(`bookmarks[${this.accountId}].mappings`, (mappings) => {
      mappings.LocalToServer[bookmark.localId] = bookmark.id
      mappings.ServerToLocal[bookmark.id] = bookmark.localId
      mappings.UrlToLocal[bookmark.url] = bookmark.localId
      mappings.LocalToUrl[bookmark.localId] = bookmark.url
      return mappings
    })
  }
}
