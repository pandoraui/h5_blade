
// 本地缓存 localStorage
// 设定生命期

define([], function(){
  "use strict";

  // Store.js
  var store = {},
    cache = {},   // 缓存在内存内，避免IO
    win = (typeof window != 'undefined' ? window : global),
    localStorageName = 'localStorage',
    storage;

  store.set = function(key, value) {}
  store.get = function(key, defaultVal) {}
  store.has = function(key) { return store.get(key) !== undefined }
  store.remove = function(key) {}
  store.clear = function() {}
  store.transact = function(key, defaultVal, transactionFn) {
    if (transactionFn == null) {
      transactionFn = defaultVal
      defaultVal = null
    }
    if (defaultVal == null) {
      defaultVal = {}
    }
    var val = store.get(key, defaultVal)
    transactionFn(val)
    store.set(key, val)
  }
  store.getAll = function() {}
  store.forEach = function() {}

  store.serialize = function(value) {
    return JSON.stringify(value)
  }
  store.deserialize = function(value) {
    if (typeof value != 'string') { return undefined }
    try { return JSON.parse(value) }
    catch(e) { return value || undefined }

    // try {
    //   return JSON.parse(value)
    // } catch(e){
    //   throw "[ERROR] key("+key+") in localStorage is not a valid JSON format."
    // }
  }

  // Functions to encapsulate questionable FireFox 3.6.13 behavior
  // when about.config::dom.storage.enabled === false
  // See https://github.com/marcuswestin/store.js/issues#issue/13
  function isLocalStorageNameSupported() {
    try { return (localStorageName in win && win[localStorageName]) }
    catch(err) { return false }
  }

  if (isLocalStorageNameSupported()) {
    //内存cache 和 localStorage同步操作，若内存没有值，则去 localStorage 取

    storage = win[localStorageName]
    store.set = function(key, val) {
      if (val === undefined) { return store.remove(key) }

      //mobile safari private模式（无痕浏览）无法 setItem
      storage.setItem(key, store.serialize(val))

      return val
    }
    store.get = function(key, defaultVal) {
      if(!key) throw "[ERROR] key("+key+") is not valid."

      var originVal = cache[key] || storage.getItem(key);
      var val = store.deserialize(storage.getItem(key))
      return (val === undefined ? defaultVal : val)
    }
    store.remove = function(key) { storage.removeItem(key) }
    store.clear = function() { storage.clear() }
    store.getAll = function() {
      var ret = {}
      store.forEach(function(key, val) {
        ret[key] = val
      })
      return ret
    }
    store.forEach = function(callback) {
      for (var i=0; i<storage.length; i++) {
        var key = storage.key(i)
        callback(key, store.get(key))
      }
    }
  } else {
    console.warn('你的浏览器不支持 localStorage');
  }

  try {
    var testKey = '__storejs__'
    store.set(testKey, testKey)
    if (store.get(testKey) != testKey) { store.disabled = true }
    store.remove(testKey)
  } catch(e) {
    store.disabled = true
  }
  store.enabled = !store.disabled

  return store

});
