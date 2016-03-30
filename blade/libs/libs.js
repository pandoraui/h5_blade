/** vim: et:ts=4:sw=4:sts=4
* @license RequireJS 2.1.9 Copyright (c) 2010-2012, The Dojo Foundation All Rights Reserved.
* Available via the MIT or new BSD license.
* see: http://github.com/jrburke/requirejs for details
*/
//Not using strict: uneven strict support in browsers, #392, and causes
//problems with requirejs.exec()/transpiler plugins that may not be strict.
/*jslint regexp: true, nomen: true, sloppy: true */
/*global window, navigator, document, importScripts, setTimeout, opera */

var requirejs, require, define;
(function (global) {
  var req, s, head, baseElement, dataMain, src,
        interactiveScript, currentlyAddingScript, mainScript, subPath,
        version = '2.1.9',
        commentRegExp = /(\/\*([\s\S]*?)\*\/|([^:]|^)\/\/(.*)$)/mg,
        cjsRequireRegExp = /[^.]\s*require\s*\(\s*["']([^'"\s]+)["']\s*\)/g,
        jsSuffixRegExp = /\.js$/,
        currDirRegExp = /^\.\//,
        op = Object.prototype,
        ostring = op.toString,
        hasOwn = op.hasOwnProperty,
        ap = Array.prototype,
        apsp = ap.splice,
        isBrowser = !!(typeof window !== 'undefined' && typeof navigator !== 'undefined' && window.document),
        isWebWorker = !isBrowser && typeof importScripts !== 'undefined',
  //PS3 indicates loaded and complete, but need to wait for complete
  //specifically. Sequence is 'loading', 'loaded', execution,
  // then 'complete'. The UA check is unfortunate, but not sure how
  //to feature test w/o causing perf issues.
        readyRegExp = isBrowser && navigator.platform === 'PLAYSTATION 3' ?
                      /^complete$/ : /^(complete|loaded)$/,
        defContextName = '_',
  //Oh the tragedy, detecting opera. See the usage of isOpera for reason.
        isOpera = typeof opera !== 'undefined' && opera.toString() === '[object Opera]',
        contexts = {},
        cfg = {},
        globalDefQueue = [],
        useInteractive = false;

  function isFunction(it) {
    return ostring.call(it) === '[object Function]';
  }

  function isArray(it) {
    return ostring.call(it) === '[object Array]';
  }

  /**
  * Helper function for iterating over an array. If the func returns
  * a true value, it will break out of the loop.
  */
  function each(ary, func) {
    if (ary) {
      var i;
      for (i = 0; i < ary.length; i += 1) {
        if (ary[i] && func(ary[i], i, ary)) {
          break;
        }
      }
    }
  }

  /**
  * Helper function for iterating over an array backwards. If the func
  * returns a true value, it will break out of the loop.
  */
  function eachReverse(ary, func) {
    if (ary) {
      var i;
      for (i = ary.length - 1; i > -1; i -= 1) {
        if (ary[i] && func(ary[i], i, ary)) {
          break;
        }
      }
    }
  }

  function hasProp(obj, prop) {
    return hasOwn.call(obj, prop);
  }

  function getOwn(obj, prop) {
    return hasProp(obj, prop) && obj[prop];
  }

  /**
  * Cycles over properties in an object and calls a function for each
  * property value. If the function returns a truthy value, then the
  * iteration is stopped.
  */
  function eachProp(obj, func) {
    var prop;
    for (prop in obj) {
      if (hasProp(obj, prop)) {
        if (func(obj[prop], prop)) {
          break;
        }
      }
    }
  }

  /**
  * Simple function to mix in properties from source into target,
  * but only if target does not already have a property of the same name.
  */
  function mixin(target, source, force, deepStringMixin) {
    if (source) {
      eachProp(source, function (value, prop) {
        if (force || !hasProp(target, prop)) {
          if (deepStringMixin && typeof value !== 'string') {
            if (!target[prop]) {
              target[prop] = {};
            }
            mixin(target[prop], value, force, deepStringMixin);
          } else {
            target[prop] = value;
          }
        }
      });
    }
    return target;
  }

  //Similar to Function.prototype.bind, but the 'this' object is specified
  //first, since it is easier to read/figure out what 'this' will be.
  function bind(obj, fn) {
    return function () {
      return fn.apply(obj, arguments);
    };
  }

  function scripts() {
    return document.getElementsByTagName('script');
  }

  function defaultOnError(err) {
    throw err;
  }

  //Allow getting a global that expressed in
  //dot notation, like 'a.b.c'.
  function getGlobal(value) {
    if (!value) {
      return value;
    }
    var g = global;
    each(value.split('.'), function (part) {
      g = g[part];
    });
    return g;
  }

  /**
  * Constructs an error with a pointer to an URL with more information.
  * @param {String} id the error ID that maps to an ID on a web page.
  * @param {String} message human readable error.
  * @param {Error} [err] the original error, if there is one.
  *
  * @returns {Error}
  */
  function makeError(id, msg, err, requireModules) {
    var e = new Error(msg + '\nhttp://requirejs.org/docs/errors.html#' + id);
    e.requireType = id;
    e.requireModules = requireModules;
    if (err) {
      e.originalError = err;
    }
    return e;
  }

  if (typeof define !== 'undefined') {
    //If a define is already in play via another AMD loader,
    //do not overwrite.
    return;
  }

  if (typeof requirejs !== 'undefined') {
    if (isFunction(requirejs)) {
      //Do not overwrite and existing requirejs instance.
      return;
    }
    cfg = requirejs;
    requirejs = undefined;
  }

  //Allow for a require config object
  if (typeof require !== 'undefined' && !isFunction(require)) {
    //assume it is a config object.
    cfg = require;
    require = undefined;
  }

  function newContext(contextName) {
    var inCheckLoaded, Module, context, handlers,
            checkLoadedTimeoutId,
            config = {
              //Defaults. Do not set a default for map
              //config to speed up normalize(), which
              //will run faster if there is no default.
              waitSeconds: 7,
              baseUrl: './',
              paths: {},
              pkgs: {},
              shim: {},
              config: {}
            },
            registry = {},
    //registry of just enabled modules, to speed
    //cycle breaking code when lots of modules
    //are registered, but not activated.
            enabledRegistry = {},
            undefEvents = {},
            defQueue = [],
            defined = {},
            urlFetched = {},
            requireCounter = 1,
            unnormalizedCounter = 1;

    /**
    * Trims the . and .. from an array of path segments.
    * It will keep a leading path segment if a .. will become
    * the first path segment, to help with module name lookups,
    * which act like paths, but can be remapped. But the end result,
    * all paths that use this function should look normalized.
    * NOTE: this method MODIFIES the input array.
    * @param {Array} ary the array of path segments.
    */
    function trimDots(ary) {
      var i, part;
      for (i = 0; ary[i]; i += 1) {
        part = ary[i];
        if (part === '.') {
          ary.splice(i, 1);
          i -= 1;
        } else if (part === '..') {
          if (i === 1 && (ary[2] === '..' || ary[0] === '..')) {
            //End of the line. Keep at least one non-dot
            //path segment at the front so it can be mapped
            //correctly to disk. Otherwise, there is likely
            //no path mapping for a path starting with '..'.
            //This can still fail, but catches the most reasonable
            //uses of ..
            break;
          } else if (i > 0) {
            ary.splice(i - 1, 2);
            i -= 2;
          }
        }
      }
    }

    /**
    * Given a relative module name, like ./something, normalize it to
    * a real name that can be mapped to a path.
    * @param {String} name the relative name
    * @param {String} baseName a real name that the name arg is relative
    * to.
    * @param {Boolean} applyMap apply the map config to the value. Should
    * only be done if this normalization is for a dependency ID.
    * @returns {String} normalized name
    */
    function normalize(name, baseName, applyMap) {
      var pkgName, pkgConfig, mapValue, nameParts, i, j, nameSegment,
                foundMap, foundI, foundStarMap, starI,
                baseParts = baseName && baseName.split('/'),
                normalizedBaseParts = baseParts,
                map = config.map,
                starMap = map && map['*'];

      //Adjust any relative paths.
      if (name && name.charAt(0) === '.') {
        //If have a base name, try to normalize against it,
        //otherwise, assume it is a top-level require that will
        //be relative to baseUrl in the end.
        if (baseName) {
          if (getOwn(config.pkgs, baseName)) {
            //If the baseName is a package name, then just treat it as one
            //name to concat the name with.
            normalizedBaseParts = baseParts = [baseName];
          } else {
            //Convert baseName to array, and lop off the last part,
            //so that . matches that 'directory' and not name of the baseName's
            //module. For instance, baseName of 'one/two/three', maps to
            //'one/two/three.js', but we want the directory, 'one/two' for
            //this normalization.
            normalizedBaseParts = baseParts.slice(0, baseParts.length - 1);
          }

          name = normalizedBaseParts.concat(name.split('/'));
          trimDots(name);

          //Some use of packages may use a . path to reference the
          //'main' module name, so normalize for that.
          pkgConfig = getOwn(config.pkgs, (pkgName = name[0]));
          name = name.join('/');
          if (pkgConfig && name === pkgName + '/' + pkgConfig.main) {
            name = pkgName;
          }
        } else if (name.indexOf('./') === 0) {
          // No baseName, so this is ID is resolved relative
          // to baseUrl, pull off the leading dot.
          name = name.substring(2);
        }
      }

      //Apply map config if available.
      if (applyMap && map && (baseParts || starMap)) {
        nameParts = name.split('/');

        for (i = nameParts.length; i > 0; i -= 1) {
          nameSegment = nameParts.slice(0, i).join('/');

          if (baseParts) {
            //Find the longest baseName segment match in the config.
            //So, do joins on the biggest to smallest lengths of baseParts.
            for (j = baseParts.length; j > 0; j -= 1) {
              mapValue = getOwn(map, baseParts.slice(0, j).join('/'));

              //baseName segment has config, find if it has one for
              //this name.
              if (mapValue) {
                mapValue = getOwn(mapValue, nameSegment);
                if (mapValue) {
                  //Match, update name to the new value.
                  foundMap = mapValue;
                  foundI = i;
                  break;
                }
              }
            }
          }

          if (foundMap) {
            break;
          }

          //Check for a star map match, but just hold on to it,
          //if there is a shorter segment match later in a matching
          //config, then favor over this star map.
          if (!foundStarMap && starMap && getOwn(starMap, nameSegment)) {
            foundStarMap = getOwn(starMap, nameSegment);
            starI = i;
          }
        }

        if (!foundMap && foundStarMap) {
          foundMap = foundStarMap;
          foundI = starI;
        }

        if (foundMap) {
          nameParts.splice(0, foundI, foundMap);
          name = nameParts.join('/');
        }
      }

      return name;
    }

    function removeScript(name) {
      if (isBrowser) {
        each(scripts(), function (scriptNode) {
          if (scriptNode.getAttribute('data-requiremodule') === name &&
                            scriptNode.getAttribute('data-requirecontext') === context.contextName) {
            scriptNode.parentNode.removeChild(scriptNode);
            return true;
          }
        });
      }
    }

    function hasPathFallback(id) {
      var pathConfig = getOwn(config.paths, id);
      if (pathConfig && isArray(pathConfig) && pathConfig.length > 1) {
        //Pop off the first array value, since it failed, and
        //retry
        pathConfig.shift();
        context.require.undef(id);
        context.require([id]);
        return true;
      }
    }

    //Turns a plugin!resource to [plugin, resource]
    //with the plugin being undefined if the name
    //did not have a plugin prefix.
    function splitPrefix(name) {
      var prefix,
                index = name ? name.indexOf('!') : -1;
      if (index > -1) {
        prefix = name.substring(0, index);
        name = name.substring(index + 1, name.length);
      }
      return [prefix, name];
    }

    /**
    * Creates a module mapping that includes plugin prefix, module
    * name, and path. If parentModuleMap is provided it will
    * also normalize the name via require.normalize()
    *
    * @param {String} name the module name
    * @param {String} [parentModuleMap] parent module map
    * for the module name, used to resolve relative names.
    * @param {Boolean} isNormalized: is the ID already normalized.
    * This is true if this call is done for a define() module ID.
    * @param {Boolean} applyMap: apply the map config to the ID.
    * Should only be true if this map is for a dependency.
    *
    * @returns {Object}
    */
    function makeModuleMap(name, parentModuleMap, isNormalized, applyMap) {
      var url, pluginModule, suffix, nameParts,
            prefix = null,
            parentName = parentModuleMap ? parentModuleMap.name : null,
            originalName = name,
            isDefine = true,
            normalizedName = '';

      //If no name, then it means it is a require call, generate an
      //internal name.
      if (!name) {
        isDefine = false;
        name = '_@r' + (requireCounter += 1);
      }

      nameParts = splitPrefix(name);
      prefix = nameParts[0];
      name = nameParts[1];

      if (prefix) {
        prefix = normalize(prefix, parentName, applyMap);
        pluginModule = getOwn(defined, prefix);
      }

      //Account for relative paths if there is a base name.
      if (name) {
        if (prefix) {
          if (pluginModule && pluginModule.normalize) {
            //Plugin is loaded, use its normalize method.
            normalizedName = pluginModule.normalize(name, function (name) {
              return normalize(name, parentName, applyMap);
            });
          } else {
            normalizedName = normalize(name, parentName, applyMap);
          }
        } else {
          //A regular module.
          normalizedName = normalize(name, parentName, applyMap);

          //Normalized name may be a plugin ID due to map config
          //application in normalize. The map config values must
          //already be normalized, so do not need to redo that part.
          nameParts = splitPrefix(normalizedName);
          prefix = nameParts[0];
          normalizedName = nameParts[1];
          isNormalized = true;

          url = context.nameToUrl(normalizedName);
        }
      }

      //If the id is a plugin id that cannot be determined if it needs
      //normalization, stamp it with a unique ID so two matching relative
      //ids that may conflict can be separate.
      suffix = prefix && !pluginModule && !isNormalized ?
                  '_unnormalized' + (unnormalizedCounter += 1) :
                  '';

      return {
        prefix: prefix,
        name: normalizedName,
        parentMap: parentModuleMap,
        unnormalized: !!suffix,
        url: url,
        originalName: originalName,
        isDefine: isDefine,
        id: (prefix ?
                    prefix + '!' + normalizedName :
                    normalizedName) + suffix
      };
    }

    function getModule(depMap) {
      var id = depMap.id,
            mod = getOwn(registry, id);

      if (!mod) {
        mod = registry[id] = new context.Module(depMap);
      }

      return mod;
    }

    function on(depMap, name, fn) {
      var id = depMap.id,
                mod = getOwn(registry, id);

      if (hasProp(defined, id) &&
                    (!mod || mod.defineEmitComplete)) {
        if (name === 'defined') {
          fn(defined[id]);
        }
      } else {
        mod = getModule(depMap);
        if (mod.error && name === 'error') {
          fn(mod.error);
        } else {
          mod.on(name, fn);
        }
      }
    }

    function onError(err, errback) {
      var ids = err.requireModules,
                notified = false;

      if (errback) {
        errback(err);
      } else {
        each(ids, function (id) {
          var mod = getOwn(registry, id);
          if (mod) {
            //Set error on module, so it skips timeout checks.
            mod.error = err;
            if (mod.events.error) {
              notified = true;
              mod.emit('error', err);
            }
          }
        });

        if (!notified) {
          req.onError(err);
        }
      }
    }

/**
* Internal method to transfer globalQueue items to this context's
* defQueue.
*/
function takeGlobalQueue() {
  //Push all the globalDefQueue items into the context's defQueue
  if (globalDefQueue.length) {
    //Array splice in the values since the context code has a
    //local var ref to defQueue, so cannot just reassign the one
    //on context.
    apsp.apply(defQueue,
                        [defQueue.length - 1, 0].concat(globalDefQueue));
    globalDefQueue = [];
  }
}

    handlers = {
      'require': function (mod) {
        if (mod.require) {
          return mod.require;
        } else {
          return (mod.require = context.makeRequire(mod.map));
        }
      },
      'exports': function (mod) {
        mod.usingExports = true;
        if (mod.map.isDefine) {
          if (mod.exports) {
            return mod.exports;
          } else {
            return (mod.exports = defined[mod.map.id] = {});
          }
        }
      },
      'module': function (mod) {
        if (mod.module) {
          return mod.module;
        } else {
          return (mod.module = {
            id: mod.map.id,
            uri: mod.map.url,
            config: function () {
              var c,
                                pkg = getOwn(config.pkgs, mod.map.id);
              // For packages, only support config targeted
              // at the main module.
              c = pkg ? getOwn(config.config, mod.map.id + '/' + pkg.main) :
                                      getOwn(config.config, mod.map.id);
              return c || {};
            },
            exports: defined[mod.map.id]
          });
        }
      }
    };

    function cleanRegistry(id) {
      //Clean up machinery used for waiting modules.
      delete registry[id];
      delete enabledRegistry[id];
    }

    function breakCycle(mod, traced, processed) {
      var id = mod.map.id;

      if (mod.error) {
        mod.emit('error', mod.error);
      } else {
        traced[id] = true;
        each(mod.depMaps, function (depMap, i) {
          var depId = depMap.id,
                        dep = getOwn(registry, depId);

          //Only force things that have not completed
          //being defined, so still in the registry,
          //and only if it has not been matched up
          //in the module already.
          if (dep && !mod.depMatched[i] && !processed[depId]) {
            if (getOwn(traced, depId)) {
              mod.defineDep(i, defined[depId]);
              mod.check(); //pass false?
            } else {
              breakCycle(dep, traced, processed);
            }
          }
        });
        processed[id] = true;
      }
    }

    function checkLoaded() {
      var map, modId, err, usingPathFallback,
                waitInterval = config.waitSeconds * 1000,
      //It is possible to disable the wait interval by using waitSeconds of 0.
                expired = waitInterval && (context.startTime + waitInterval) < new Date().getTime(),
                noLoads = [],
                reqCalls = [],
                stillLoading = false,
                needCycleCheck = true;

      //Do not bother if this call was a result of a cycle break.
      if (inCheckLoaded) {
        return;
      }

      inCheckLoaded = true;

      //Figure out the state of all the modules.
      eachProp(enabledRegistry, function (mod) {
        map = mod.map;
        modId = map.id;

        //Skip things that are not enabled or in error state.
        if (!mod.enabled) {
          return;
        }

        if (!map.isDefine) {
          reqCalls.push(mod);
        }

        if (!mod.error) {
          //If the module should be executed, and it has not
          //been inited and time is up, remember it.
          if (!mod.inited && expired) {
            if (hasPathFallback(modId)) {
              usingPathFallback = true;
              stillLoading = true;
            } else {
              noLoads.push(modId);
              removeScript(modId);
            }
          } else if (!mod.inited && mod.fetched && map.isDefine) {
            stillLoading = true;
            if (!map.prefix) {
              //No reason to keep looking for unfinished
              //loading. If the only stillLoading is a
              //plugin resource though, keep going,
              //because it may be that a plugin resource
              //is waiting on a non-plugin cycle.
              return (needCycleCheck = false);
            }
          }
        }
      });

      if (expired && noLoads.length) {
        //If wait time expired, throw error of unloaded modules.
        err = makeError('timeout', 'Load timeout for modules: ' + noLoads, null, noLoads);
        err.contextName = context.contextName;
        return onError(err);
      }

      //Not expired, check for a cycle.
      if (needCycleCheck) {
        each(reqCalls, function (mod) {
          breakCycle(mod, {}, {});
        });
      }

      //If still waiting on loads, and the waiting load is something
      //other than a plugin resource, or there are still outstanding
      //scripts, then just try back later.
      if ((!expired || usingPathFallback) && stillLoading) {
        //Something is still waiting to load. Wait for it, but only
        //if a timeout is not already in effect.
        if ((isBrowser || isWebWorker) && !checkLoadedTimeoutId) {
          checkLoadedTimeoutId = setTimeout(function () {
            checkLoadedTimeoutId = 0;
            checkLoaded();
          }, 50);
        }
      }

      inCheckLoaded = false;
    }

    Module = function (map) {
      this.events = getOwn(undefEvents, map.id) || {};
      this.map = map;
      this.shim = getOwn(config.shim, map.id);
      this.depExports = [];
      this.depMaps = [];
      this.depMatched = [];
      this.pluginMaps = {};
      this.depCount = 0;

      /* this.exports this.factory
      this.depMaps = [],
      this.enabled, this.fetched
      */
    };

    Module.prototype = {
      init: function (depMaps, factory, errback, options) {
        options = options || {};

        //Do not do more inits if already done. Can happen if there
        //are multiple define calls for the same module. That is not
        //a normal, common case, but it is also not unexpected.
        if (this.inited) {
          return;
        }

        this.factory = factory;

        if (errback) {
          //Register for errors on this module.
          this.on('error', errback);
        } else if (this.events.error) {
          //If no errback already, but there are error listeners
          //on this module, set up an errback to pass to the deps.
          errback = bind(this, function (err) {
            this.emit('error', err);
          });
        }

        //Do a copy of the dependency array, so that
        //source inputs are not modified. For example
        //"shim" deps are passed in here directly, and
        //doing a direct modification of the depMaps array
        //would affect that config.
        this.depMaps = depMaps && depMaps.slice(0);

        this.errback = errback;

        //Indicate this module has be initialized
        this.inited = true;

        this.ignore = options.ignore;

        //Could have option to init this module in enabled mode,
        //or could have been previously marked as enabled. However,
        //the dependencies are not known until init is called. So
        //if enabled previously, now trigger dependencies as enabled.
        if (options.enabled || this.enabled) {
          //Enable this module and dependencies.
          //Will call this.check()
          this.enable();
        } else {
          this.check();
        }
      },

      defineDep: function (i, depExports) {
        //Because of cycles, defined callback for a given
        //export can be called more than once.
        if (!this.depMatched[i]) {
          this.depMatched[i] = true;
          this.depCount -= 1;
          this.depExports[i] = depExports;
        }
      },

      fetch: function () {
        if (this.fetched) {
          return;
        }
        this.fetched = true;

        context.startTime = (new Date()).getTime();

        var map = this.map;

        //If the manager is for a plugin managed resource,
        //ask the plugin to load it now.
        if (this.shim) {
          context.makeRequire(this.map, {
            enableBuildCallback: true
          })(this.shim.deps || [], bind(this, function () {
            return map.prefix ? this.callPlugin() : this.load();
          }));
        } else {
          //Regular dependency.
          return map.prefix ? this.callPlugin() : this.load();
        }
      },

      load: function () {
        var url = this.map.url;

        //Regular dependency.
        if (!urlFetched[url]) {
          urlFetched[url] = true;
          context.load(this.map.id, url);
        }
      },

      /**
      * Checks if the module is ready to define itself, and if so,
      * define it.
      */
      check: function () {
        if (!this.enabled || this.enabling) {
          return;
        }

        var err, cjsModule,
              id = this.map.id,
              depExports = this.depExports,
              exports = this.exports,
              factory = this.factory;

        if (!this.inited) {
          this.fetch();
        } else if (this.error) {
          this.emit('error', this.error);
        } else if (!this.defining) {
          //The factory could trigger another require call
          //that would result in checking this module to
          //define itself again. If already in the process
          //of doing that, skip this work.
          this.defining = true;

          if (this.depCount < 1 && !this.defined) {
            if (isFunction(factory)) {
              //If there is an error listener, favor passing
              //to that instead of throwing an error. However,
              //only do it for define()'d  modules. require
              //errbacks should not be called for failures in
              //their callbacks (#699). However if a global
              //onError is set, use that.
              if ((this.events.error && this.map.isDefine) ||
                          req.onError !== defaultOnError) {
                try {
                  exports = context.execCb(id, factory, depExports, exports);
                } catch (e) {
                  err = e;
                }
              } else {
                exports = context.execCb(id, factory, depExports, exports);
              }

              if (this.map.isDefine) {
                //If setting exports via 'module' is in play,
                //favor that over return value and exports. After that,
                //favor a non-undefined return value over exports use.
                cjsModule = this.module;
                if (cjsModule &&
                                  cjsModule.exports !== undefined &&
                //Make sure it is not already the exports value
                                  cjsModule.exports !== this.exports) {
                  exports = cjsModule.exports;
                } else if (exports === undefined && this.usingExports) {
                  //exports already set the defined value.
                  exports = this.exports;
                }
              }

              if (err) {
                err.requireMap = this.map;
                err.requireModules = this.map.isDefine ? [this.map.id] : null;
                err.requireType = this.map.isDefine ? 'define' : 'require';
                return onError((this.error = err));
              }

            } else {
              //Just a literal value
              exports = factory;
            }

            this.exports = exports;

            if (this.map.isDefine && !this.ignore) {
              defined[id] = exports;

              if (req.onResourceLoad) {
                req.onResourceLoad(context, this.map, this.depMaps);
              }
            }

            //Clean up
            cleanRegistry(id);

            this.defined = true;
          }

          //Finished the define stage. Allow calling check again
          //to allow define notifications below in the case of a
          //cycle.
          this.defining = false;

          if (this.defined && !this.defineEmitted) {
            this.defineEmitted = true;
            this.emit('defined', this.exports);
            this.defineEmitComplete = true;
          }

        }
      },

      callPlugin: function () {
        var map = this.map,
                id = map.id,
        //Map already normalized the prefix.
                pluginMap = makeModuleMap(map.prefix);

        //Mark this as a dependency for this plugin, so it
        //can be traced for cycles.
        this.depMaps.push(pluginMap);

        on(pluginMap, 'defined', bind(this, function (plugin) {
          var load, normalizedMap, normalizedMod,
                    name = this.map.name,
                    parentName = this.map.parentMap ? this.map.parentMap.name : null,
                    localRequire = context.makeRequire(map.parentMap, {
                      enableBuildCallback: true
                    });

          //If current map is not normalized, wait for that
          //normalized name to load instead of continuing.
          if (this.map.unnormalized) {
            //Normalize the ID if the plugin allows it.
            if (plugin.normalize) {
              name = plugin.normalize(name, function (name) {
                return normalize(name, parentName, true);
              }) || '';
            }

            //prefix and name should already be normalized, no need
            //for applying map config again either.
            normalizedMap = makeModuleMap(map.prefix + '!' + name,
                                                  this.map.parentMap);
            on(normalizedMap,
                        'defined', bind(this, function (value) {
                          this.init([], function () { return value; }, null, {
                            enabled: true,
                            ignore: true
                          });
                        }));

            normalizedMod = getOwn(registry, normalizedMap.id);
            if (normalizedMod) {
              //Mark this as a dependency for this plugin, so it
              //can be traced for cycles.
              this.depMaps.push(normalizedMap);

              if (this.events.error) {
                normalizedMod.on('error', bind(this, function (err) {
                  this.emit('error', err);
                }));
              }
              normalizedMod.enable();
            }

            return;
          }

          load = bind(this, function (value) {
            this.init([], function () { return value; }, null, {
              enabled: true
            });
          });

          load.error = bind(this, function (err) {
            this.inited = true;
            this.error = err;
            err.requireModules = [id];

            //Remove temp unnormalized modules for this module,
            //since they will never be resolved otherwise now.
            eachProp(registry, function (mod) {
              if (mod.map.id.indexOf(id + '_unnormalized') === 0) {
                cleanRegistry(mod.map.id);
              }
            });

            onError(err);
          });

          //Allow plugins to load other code without having to know the
          //context or how to 'complete' the load.
          load.fromText = bind(this, function (text, textAlt) {
            /*jslint evil: true */
            var moduleName = map.name,
                        moduleMap = makeModuleMap(moduleName),
                        hasInteractive = useInteractive;

            //As of 2.1.0, support just passing the text, to reinforce
            //fromText only being called once per resource. Still
            //support old style of passing moduleName but discard
            //that moduleName in favor of the internal ref.
            if (textAlt) {
              text = textAlt;
            }

            //Turn off interactive script matching for IE for any define
            //calls in the text, then turn it back on at the end.
            if (hasInteractive) {
              useInteractive = false;
            }

            //Prime the system by creating a module instance for
            //it.
            getModule(moduleMap);

            //Transfer any config to this other module.
            if (hasProp(config.config, id)) {
              config.config[moduleName] = config.config[id];
            }

            try {
              req.exec(text);
            } catch (e) {
              return onError(makeError('fromtexteval',
                                          'fromText eval for ' + id +
                                        ' failed: ' + e,
                                          e,
                                          [id]));
            }

            if (hasInteractive) {
              useInteractive = true;
            }

            //Mark this as a dependency for the plugin
            //resource
            this.depMaps.push(moduleMap);

            //Support anonymous modules.
            context.completeLoad(moduleName);

            //Bind the value of that module to the value for this
            //resource ID.
            localRequire([moduleName], load);
          });

          //Use parentName here since the plugin's name is not reliable,
          //could be some weird string with no path that actually wants to
          //reference the parentName's path.
          plugin.load(map.name, localRequire, load, config);
        }));

        context.enable(pluginMap, this);
        this.pluginMaps[pluginMap.id] = pluginMap;
      },

      enable: function () {
        enabledRegistry[this.map.id] = this;
        this.enabled = true;

        //Set flag mentioning that the module is enabling,
        //so that immediate calls to the defined callbacks
        //for dependencies do not trigger inadvertent load
        //with the depCount still being zero.
        this.enabling = true;

        //Enable each dependency
        each(this.depMaps, bind(this, function (depMap, i) {
          var id, mod, handler;

          if (typeof depMap === 'string') {
            //Dependency needs to be converted to a depMap
            //and wired up to this module.
            depMap = makeModuleMap(depMap,
                                          (this.map.isDefine ? this.map : this.map.parentMap),
                                          false,
                                          !this.skipMap);
            this.depMaps[i] = depMap;

            handler = getOwn(handlers, depMap.id);

            if (handler) {
              this.depExports[i] = handler(this);
              return;
            }

            this.depCount += 1;

            on(depMap, 'defined', bind(this, function (depExports) {
              this.defineDep(i, depExports);
              this.check();
            }));

            if (this.errback) {
              on(depMap, 'error', bind(this, this.errback));
            }
          }

          id = depMap.id;
          mod = registry[id];

          //Skip special modules like 'require', 'exports', 'module'
          //Also, don't call enable if it is already enabled,
          //important in circular dependency cases.
          if (!hasProp(handlers, id) && mod && !mod.enabled) {
            context.enable(depMap, this);
          }
        }));

        //Enable each plugin that is used in
        //a dependency
        eachProp(this.pluginMaps, bind(this, function (pluginMap) {
          var mod = getOwn(registry, pluginMap.id);
          if (mod && !mod.enabled) {
            context.enable(pluginMap, this);
          }
        }));

        this.enabling = false;

        this.check();
      },

      on: function (name, cb) {
        var cbs = this.events[name];
        if (!cbs) {
          cbs = this.events[name] = [];
        }
        cbs.push(cb);
      },

      emit: function (name, evt) {
        each(this.events[name], function (cb) {
          cb(evt);
        });
        if (name === 'error') {
          //Now that the error handler was triggered, remove
          //the listeners, since this broken Module instance
          //can stay around for a while in the registry.
          delete this.events[name];
        }
      }
    };

    function callGetModule(args) {
      //Skip modules already defined.
      if (!hasProp(defined, args[0])) {
        getModule(makeModuleMap(args[0], null, true)).init(args[1], args[2]);
      }
    }

    function removeListener(node, func, name, ieName) {
      //Favor detachEvent because of IE9
      //issue, see attachEvent/addEventListener comment elsewhere
      //in this file.
      if (node.detachEvent && !isOpera) {
        //Probably IE. If not it will throw an error, which will be
        //useful to know.
        if (ieName) {
          node.detachEvent(ieName, func);
        }
      } else {
        node.removeEventListener(name, func, false);
      }
    }

    /**
    * Given an event from a script node, get the requirejs info from it,
    * and then removes the event listeners on the node.
    * @param {Event} evt
    * @returns {Object}
    */
    function getScriptData(evt) {
      //Using currentTarget instead of target for Firefox 2.0's sake. Not
      //all old browsers will be supported, but this one was easy enough
      //to support and still makes sense.
      var node = evt.currentTarget || evt.srcElement;

      //Remove the listeners once here.
      removeListener(node, context.onScriptLoad, 'load', 'onreadystatechange');
      removeListener(node, context.onScriptError, 'error');

      return {
        node: node,
        id: node && node.getAttribute('data-requiremodule')
      };
    }

function intakeDefines() {
  var args;

  //Any defined modules in the global queue, intake them now.
  takeGlobalQueue();

  //Make sure any remaining defQueue items get properly processed.
  while (defQueue.length) {
    args = defQueue.shift();
    if (args[0] === null) {
      return onError(makeError('mismatch', 'Mismatched anonymous define() module: ' + args[args.length - 1]));
    } else {
      //args are id, deps, factory. Should be normalized by the
      //define() function.
      callGetModule(args);
    }
  }
}

    context = {
      config: config,
      contextName: contextName,
      registry: registry,
      defined: defined,
      urlFetched: urlFetched,
      defQueue: defQueue,
      Module: Module,
      makeModuleMap: makeModuleMap,
      nextTick: req.nextTick,
      onError: onError,

      /**
      * Set a configuration for the context.
      * @param {Object} cfg config object to integrate.
      */
      configure: function (cfg) {
        //Make sure the baseUrl ends in a slash.
        if (cfg.baseUrl) {
          if (cfg.baseUrl.charAt(cfg.baseUrl.length - 1) !== '/') {
            cfg.baseUrl += '/';
          }
        }

        //Save off the paths and packages since they require special processing,
        //they are additive.
        var pkgs = config.pkgs,
              shim = config.shim,
              objs = {
                paths: true,
                config: true,
                map: true
              };

        eachProp(cfg, function (value, prop) {
          if (objs[prop]) {
            if (prop === 'map') {
              if (!config.map) {
                config.map = {};
              }
              mixin(config[prop], value, true, true);
            } else {
              mixin(config[prop], value, true);
            }
          } else {
            config[prop] = value;
          }
        });

        //Merge shim
        if (cfg.shim) {
          eachProp(cfg.shim, function (value, id) {
            //Normalize the structure
            if (isArray(value)) {
              value = {
                deps: value
              };
            }
            if ((value.exports || value.init) && !value.exportsFn) {
              value.exportsFn = context.makeShimExports(value);
            }
            shim[id] = value;
          });
          config.shim = shim;
        }

        //Adjust packages if necessary.
        if (cfg.packages) {
          each(cfg.packages, function (pkgObj) {
            var location;

            pkgObj = typeof pkgObj === 'string' ? { name: pkgObj} : pkgObj;
            location = pkgObj.location;

            //Create a brand new object on pkgs, since currentPackages can
            //be passed in again, and config.pkgs is the internal transformed
            //state for all package configs.
            pkgs[pkgObj.name] = {
              name: pkgObj.name,
              location: location || pkgObj.name,
              //Remove leading dot in main, so main paths are normalized,
              //and remove any trailing .js, since different package
              //envs have different conventions: some use a module name,
              //some use a file name.
              main: (pkgObj.main || 'main')
                            .replace(currDirRegExp, '')
                            .replace(jsSuffixRegExp, '')
            };
          });

          //Done with modifications, assing packages back to context config
          config.pkgs = pkgs;
        }

        //If there are any "waiting to execute" modules in the registry,
        //update the maps for them, since their info, like URLs to load,
        //may have changed.
        eachProp(registry, function (mod, id) {
          //If module already has init called, since it is too
          //late to modify them, and ignore unnormalized ones
          //since they are transient.
          if (!mod.inited && !mod.map.unnormalized) {
            mod.map = makeModuleMap(id);
          }
        });

        //If a deps array or a config callback is specified, then call
        //require with those args. This is useful when require is defined as a
        //config object before require.js is loaded.
        if (cfg.deps || cfg.callback) {
          context.require(cfg.deps || [], cfg.callback);
        }
      },

      makeShimExports: function (value) {
        function fn() {
          var ret;
          if (value.init) {
            ret = value.init.apply(global, arguments);
          }
          return ret || (value.exports && getGlobal(value.exports));
        }
        return fn;
      },

      makeRequire: function (relMap, options) {
        options = options || {};

        function localRequire(deps, callback, errback) {
          var id, map, requireMod;

          if (options.enableBuildCallback && callback && isFunction(callback)) {
            callback.__requireJsBuild = true;
          }

          if (typeof deps === 'string') {
            if (isFunction(callback)) {
              //Invalid call
              return onError(makeError('requireargs', 'Invalid require call'), errback);
            }

            //If require|exports|module are requested, get the
            //value for them from the special handlers. Caveat:
            //this only works while module is being defined.
            if (relMap && hasProp(handlers, deps)) {
              return handlers[deps](registry[relMap.id]);
            }

            //Synchronous access to one module. If require.get is
            //available (as in the Node adapter), prefer that.
            if (req.get) {
              return req.get(context, deps, relMap, localRequire);
            }

            //Normalize module name, if it contains . or ..
            map = makeModuleMap(deps, relMap, false, true);
            id = map.id;

            if (!hasProp(defined, id)) {
              return onError(makeError('notloaded', 'Module name "' +
                                id +
                                '" has not been loaded yet for context: ' +
                                contextName +
                                (relMap ? '' : '. Use require([])')));
            }
            return defined[id];
          }

          //Grab defines waiting in the global queue.
          intakeDefines();

          //Mark all the dependencies as needing to be loaded.
          context.nextTick(function () {
            //Some defines could have been added since the
            //require call, collect them.
            intakeDefines();

            requireMod = getModule(makeModuleMap(null, relMap));

            //Store if map config should be applied to this require
            //call for dependencies.
            requireMod.skipMap = options.skipMap;

            requireMod.init(deps, callback, errback, {
              enabled: true
            });

            checkLoaded();
          });

          return localRequire;
        }

        mixin(localRequire, {
          isBrowser: isBrowser,

          /**
          * Converts a module name + .extension into an URL path.
          * *Requires* the use of a module name. It does not support using
          * plain URLs like nameToUrl.
          */
          toUrl: function (moduleNamePlusExt) {
            var ext,
                            index = moduleNamePlusExt.lastIndexOf('.'),
                            segment = moduleNamePlusExt.split('/')[0],
                            isRelative = segment === '.' || segment === '..';

            //Have a file extension alias, and it is not the
            //dots from a relative path.
            if (index !== -1 && (!isRelative || index > 1)) {
              ext = moduleNamePlusExt.substring(index, moduleNamePlusExt.length);
              moduleNamePlusExt = moduleNamePlusExt.substring(0, index);
            }

            return context.nameToUrl(normalize(moduleNamePlusExt,
                                                relMap && relMap.id, true), ext, true);
          },

          defined: function (id) {
            return hasProp(defined, makeModuleMap(id, relMap, false, true).id);
          },

          specified: function (id) {
            id = makeModuleMap(id, relMap, false, true).id;
            return hasProp(defined, id) || hasProp(registry, id);
          }
        });

        //Only allow undef on top level require calls
        if (!relMap) {
          localRequire.undef = function (id) {
            //Bind any waiting define() calls to this context,
            //fix for #408
            takeGlobalQueue();

            var map = makeModuleMap(id, relMap, true),
                            mod = getOwn(registry, id);

            removeScript(id);

            delete defined[id];
            delete urlFetched[map.url];
            delete undefEvents[id];

            if (mod) {
              //Hold on to listeners in case the
              //module will be attempted to be reloaded
              //using a different config.
              if (mod.events.defined) {
                undefEvents[id] = mod.events;
              }

              cleanRegistry(id);
            }
          };
        }

        return localRequire;
      },

      /**
      * Called to enable a module if it is still in the registry
      * awaiting enablement. A second arg, parent, the parent module,
      * is passed in for context, when this method is overriden by
      * the optimizer. Not shown here to keep code compact.
      */
      enable: function (depMap) {
        var mod = getOwn(registry, depMap.id);
        if (mod) {
          getModule(depMap).enable();
        }
      },

      /**
      * Internal method used by environment adapters to complete a load event.
      * A load event could be a script load or just a load pass from a synchronous
      * load call.
      * @param {String} moduleName the name of the module to potentially complete.
      */
      completeLoad: function (moduleName) {
        var found, args, mod,
                    shim = getOwn(config.shim, moduleName) || {},
                    shExports = shim.exports;

        takeGlobalQueue();

        while (defQueue.length) {
          args = defQueue.shift();
          if (args[0] === null) {
            args[0] = moduleName;
            //If already found an anonymous module and bound it
            //to this name, then this is some other anon module
            //waiting for its completeLoad to fire.
            if (found) {
              break;
            }
            found = true;
          } else if (args[0] === moduleName) {
            //Found matching define call for this script!
            found = true;
          }

          callGetModule(args);
        }

        //Do this after the cycle of callGetModule in case the result
        //of those calls/init calls changes the registry.
        mod = getOwn(registry, moduleName);

        if (!found && !hasProp(defined, moduleName) && mod && !mod.inited) {
          if (config.enforceDefine && (!shExports || !getGlobal(shExports))) {
            if (hasPathFallback(moduleName)) {
              return;
            } else {
              return onError(makeError('nodefine',
                                             'No define call for ' + moduleName,
                                             null,
                                             [moduleName]));
            }
          } else {
            //A script that does not call define(), so just simulate
            //the call for it.
            callGetModule([moduleName, (shim.deps || []), shim.exportsFn]);
          }
        }

        checkLoaded();
      },

      /**
      * Converts a module name to a file path. Supports cases where
      * moduleName may actually be just an URL.
      * Note that it **does not** call normalize on the moduleName,
      * it is assumed to have already been normalized. This is an
      * internal API, not a public one. Use toUrl for the public API.
      */
      nameToUrl: function (moduleName, ext, skipExt) {
        var paths, pkgs, pkg, pkgPath, syms, i, parentModule, url,
                    parentPath;

        //If a colon is in the URL, it indicates a protocol is used and it is just
        //an URL to a file, or if it starts with a slash, contains a query arg (i.e. ?)
        //or ends with .js, then assume the user meant to use an url and not a module id.
        //The slash is important for protocol-less URLs as well as full paths.
        if (req.jsExtRegExp.test(moduleName)) {
          //Just a plain path, not module name lookup, so just return it.
          //Add extension if it is included. This is a bit wonky, only non-.js things pass
          //an extension, this method probably needs to be reworked.
          url = moduleName + (ext || '');
        } else {
          //A module that needs to be converted to a path.
          paths = config.paths;
          pkgs = config.pkgs;

          syms = moduleName.split('/');
          //For each module name segment, see if there is a path
          //registered for it. Start with most specific name
          //and work up from it.
          for (i = syms.length; i > 0; i -= 1) {
            parentModule = syms.slice(0, i).join('/');
            pkg = getOwn(pkgs, parentModule);
            parentPath = getOwn(paths, parentModule);
            if (parentPath) {
              //If an array, it means there are a few choices,
              //Choose the one that is desired
              if (isArray(parentPath)) {
                parentPath = parentPath[0];
              }
              syms.splice(0, i, parentPath);
              break;
            } else if (pkg) {
              //If module name is just the package name, then looking
              //for the main module.
              if (moduleName === pkg.name) {
                pkgPath = pkg.location + '/' + pkg.main;
              } else {
                pkgPath = pkg.location;
              }
              syms.splice(0, i, pkgPath);
              break;
            }
          }

          //Join the path parts together, then figure out if baseUrl is needed.
          url = syms.join('/');
          url += (ext || (/^data\:|\?/.test(url) || skipExt ? '' : '.js'));
          url = (url.charAt(0) === '/' || url.match(/^[\w\+\.\-]+:/) ? '' : config.baseUrl) + url;
        }

        return config.urlArgs ? url +
                                        ((url.indexOf('?') === -1 ? '?' : '&') +
                                         config.urlArgs) : url;
      },

      //Delegates to req.load. Broken out as a separate function to
      //allow overriding in the optimizer.
      load: function (id, url) {
        req.load(context, id, url);
      },

      /**
      * Executes a module callback function. Broken out as a separate function
      * solely to allow the build system to sequence the files in the built
      * layer in the right sequence.
      *
      * @private
      */
      execCb: function (name, callback, args, exports) {
        return callback.apply(exports, args);
      },

      /**
      * callback for script loads, used to check status of loading.
      *
      * @param {Event} evt the event from the browser for the script
      * that was loaded.
      */
      onScriptLoad: function (evt) {
        //Using currentTarget instead of target for Firefox 2.0's sake. Not
        //all old browsers will be supported, but this one was easy enough
        //to support and still makes sense.
        if (evt.type === 'load' ||
                  (readyRegExp.test((evt.currentTarget || evt.srcElement).readyState))) {
          //Reset interactive script so a script node is not held onto for
          //to long.
          interactiveScript = null;

          //Pull out the name of the module and the context.
          var data = getScriptData(evt);
          context.completeLoad(data.id);
        }
      },

      /**
      * Callback for script errors.
      */
      onScriptError: function (evt) {
        var data = getScriptData(evt);
        if (!hasPathFallback(data.id)) {
          return onError(makeError('scripterror', 'Script error for: ' + data.id, evt, [data.id]));
        }
      }
    };

    context.require = context.makeRequire();
    return context;
  }

  /**
  * Main entry point.
  *
  * If the only argument to require is a string, then the module that
  * is represented by that string is fetched for the appropriate context.
  *
  * If the first argument is an array, then it will be treated as an array
  * of dependency string names to fetch. An optional function callback can
  * be specified to execute when all of those dependencies are available.
  *
  * Make a local req variable to help Caja compliance (it assumes things
  * on a require that are not standardized), and to give a short
  * name for minification/local scope use.
  */
  req = requirejs = function (deps, callback, errback, optional) {

    //Find the right context, use default
    var context, config,
          contextName = defContextName;

    // Determine if have config object in the call.
    if (!isArray(deps) && typeof deps !== 'string') {
      // deps is a config object
      config = deps;
      if (isArray(callback)) {
        // Adjust args if there are dependencies
        deps = callback;
        callback = errback;
        errback = optional;
      } else {
        deps = [];
      }
    }

    if (config && config.context) {
      contextName = config.context;
    }

    context = getOwn(contexts, contextName);
    if (!context) {
      context = contexts[contextName] = req.s.newContext(contextName);
    }

    if (config) {
      context.configure(config);
    }

    return context.require(deps, callback, errback);
  };

  /**
  * Support require.config() to make it easier to cooperate with other
  * AMD loaders on globally agreed names.
  */
  req.config = function (config) {
    return req(config);
  };

  /**
  * Execute something after the current tick
  * of the event loop. Override for other envs
  * that have a better solution than setTimeout.
  * @param  {Function} fn function to execute later.
  */
  req.nextTick = typeof setTimeout !== 'undefined' ? function (fn) {
    setTimeout(fn, 4);
  } : function (fn) { fn(); };

  /**
  * Export require as a global, but only if it does not already exist.
  */
  if (!require) {
    require = req;
  }

  req.version = version;

  //Used to filter out dependencies that are already paths.
  req.jsExtRegExp = /^\/|:|\?|\.js$/;
  req.isBrowser = isBrowser;
  s = req.s = {
    contexts: contexts,
    newContext: newContext
  };

  //Create default context.
  req({});

  //Exports some context-sensitive methods on global require.
  each([
        'toUrl',
        'undef',
        'defined',
        'specified'
    ], function (prop) {
      //Reference from contexts instead of early binding to default context,
      //so that during builds, the latest instance of the default context
      //with its config gets used.
      req[prop] = function () {
        var ctx = contexts[defContextName];
        return ctx.require[prop].apply(ctx, arguments);
      };
    });

  if (isBrowser) {
    head = s.head = document.getElementsByTagName('head')[0];
    //If BASE tag is in play, using appendChild is a problem for IE6.
    //When that browser dies, this can be removed. Details in this jQuery bug:
    //http://dev.jquery.com/ticket/2709
    baseElement = document.getElementsByTagName('base')[0];
    if (baseElement) {
      head = s.head = baseElement.parentNode;
    }
  }

  /**
  * Any errors that require explicitly generates will be passed to this
  * function. Intercept/override it if you want custom error handling.
  * @param {Error} err the error object.
  */
  req.onError = defaultOnError;

  /**
  * Creates the node for the load command. Only used in browser envs.
  */
  req.createNode = function (config, moduleName, url) {
    var node = config.xhtml ?
              document.createElementNS('http://www.w3.org/1999/xhtml', 'html:script') :
              document.createElement('script');
    node.type = config.scriptType || 'text/javascript';
    node.charset = 'utf-8';
    node.async = true;
    return node;
  };

  /**
  * Does the request to load a module for the browser case.
  * Make this a separate function to allow other environments
  * to override it.
  *
  * @param {Object} context the require context to find state.
  * @param {String} moduleName the name of the module.
  * @param {Object} url the URL to the module.
  */
  req.load = function (context, moduleName, url) {
    var config = (context && context.config) || {},
          node;
    if (isBrowser) {
      //In the browser so use a script tag
      node = req.createNode(config, moduleName, url);

      node.setAttribute('data-requirecontext', context.contextName);
      node.setAttribute('data-requiremodule', moduleName);

      //Set up load listener. Test attachEvent first because IE9 has
      //a subtle issue in its addEventListener and script onload firings
      //that do not match the behavior of all other browsers with
      //addEventListener support, which fire the onload event for a
      //script right after the script execution. See:
      //https://connect.microsoft.com/IE/feedback/details/648057/script-onload-event-is-not-fired-immediately-after-script-execution
      //UNFORTUNATELY Opera implements attachEvent but does not follow the script
      //script execution mode.
      if (node.attachEvent &&
      //Check if node.attachEvent is artificially added by custom script or
      //natively supported by browser
      //read https://github.com/jrburke/requirejs/issues/187
      //if we can NOT find [native code] then it must NOT natively supported.
      //in IE8, node.attachEvent does not have toString()
      //Note the test for "[native code" with no closing brace, see:
      //https://github.com/jrburke/requirejs/issues/273
                  !(node.attachEvent.toString && node.attachEvent.toString().indexOf('[native code') < 0) &&
                  !isOpera) {
        //Probably IE. IE (at least 6-8) do not fire
        //script onload right after executing the script, so
        //we cannot tie the anonymous define call to a name.
        //However, IE reports the script as being in 'interactive'
        //readyState at the time of the define call.
        useInteractive = true;

        node.attachEvent('onreadystatechange', context.onScriptLoad);
        //It would be great to add an error handler here to catch
        //404s in IE9+. However, onreadystatechange will fire before
        //the error handler, so that does not help. If addEventListener
        //is used, then IE will fire error before load, but we cannot
        //use that pathway given the connect.microsoft.com issue
        //mentioned above about not doing the 'script execute,
        //then fire the script load event listener before execute
        //next script' that other browsers do.
        //Best hope: IE10 fixes the issues,
        //and then destroys all installs of IE 6-9.
        //node.attachEvent('onerror', context.onScriptError);
      } else {
        node.addEventListener('load', context.onScriptLoad, false);
        node.addEventListener('error', context.onScriptError, false);
      }
      node.src = url;

      //For some cache cases in IE 6-8, the script executes before the end
      //of the appendChild execution, so to tie an anonymous define
      //call to the module name (which is stored on the node), hold on
      //to a reference to this node, but clear after the DOM insertion.
      currentlyAddingScript = node;
      if (baseElement) {
        head.insertBefore(node, baseElement);
      } else {
        head.appendChild(node);
      }
      currentlyAddingScript = null;

      return node;
    } else if (isWebWorker) {
      try {
        //In a web worker, use importScripts. This is not a very
        //efficient use of importScripts, importScripts will block until
        //its script is downloaded and evaluated. However, if web workers
        //are in play, the expectation that a build has been done so that
        //only one script needs to be loaded anyway. This may need to be
        //reevaluated if other use cases become common.
        importScripts(url);

        //Account for anonymous modules
        context.completeLoad(moduleName);
      } catch (e) {
        context.onError(makeError('importscripts',
                              'importScripts failed for ' +
                                  moduleName + ' at ' + url,
                              e,
                              [moduleName]));
      }
    }
  };

  function getInteractiveScript() {
    if (interactiveScript && interactiveScript.readyState === 'interactive') {
      return interactiveScript;
    }

    eachReverse(scripts(), function (script) {
      if (script.readyState === 'interactive') {
        return (interactiveScript = script);
      }
    });
    return interactiveScript;
  }

  //Look for a data-main script attribute, which could also adjust the baseUrl.
  if (isBrowser && !cfg.skipDataMain) {
    //Figure out baseUrl. Get it from the script tag with require.js in it.
    eachReverse(scripts(), function (script) {
      //Set the 'head' where we can append children by
      //using the script's parent.
      if (!head) {
        head = script.parentNode;
      }

      //Look for a data-main attribute to set main script for the page
      //to load. If it is there, the path to data main becomes the
      //baseUrl, if it is not already set.
      dataMain = script.getAttribute('data-main');
      if (dataMain) {
        //Preserve dataMain in case it is a path (i.e. contains '?')
        mainScript = dataMain;

        //Set final baseUrl if there is not already an explicit one.
        if (!cfg.baseUrl) {
          //Pull off the directory of data-main for use as the
          //baseUrl.
          src = mainScript.split('/');
          mainScript = src.pop();
          subPath = src.length ? src.join('/') + '/' : './';

          cfg.baseUrl = subPath;
        }

        //Strip off any trailing .js since mainScript is now
        //like a module name.
        mainScript = mainScript.replace(jsSuffixRegExp, '');

        //If mainScript is still a path, fall back to dataMain
        if (req.jsExtRegExp.test(mainScript)) {
          mainScript = dataMain;
        }

        //Put the data-main script in the files to load.
        cfg.deps = cfg.deps ? cfg.deps.concat(mainScript) : [mainScript];

        return true;
      }
    });
  }

/**
* The function that handles definitions of modules. Differs from
* require() in that a string for the module should be the first argument,
* and the function to execute after dependencies are loaded should
* return a value to define the module corresponding to the first argument's
* name.
*/
define = function (name, deps, callback) {
  var node, context;

  //Allow for anonymous modules
  if (typeof name !== 'string') {
    //Adjust args appropriately
    callback = deps;
    deps = name;
    name = null;
  }

  //This module may not have dependencies
  if (!isArray(deps)) {
    callback = deps;
    deps = null;
  }

  //If no name, and callback is a function, then figure out if it a
  //CommonJS thing with dependencies.
  if (!deps && isFunction(callback)) {
    deps = [];
    //Remove comments from the callback string,
    //look for require calls, and pull them into the dependencies,
    //but only if there are function args.
    if (callback.length) {
      callback
                  .toString()
                  .replace(commentRegExp, '')
                  .replace(cjsRequireRegExp, function (match, dep) {
                    deps.push(dep);
                  });

      //May be a CommonJS thing even without require calls, but still
      //could use exports, and module. Avoid doing exports and module
      //work though if it just needs require.
      //REQUIRES the function to expect the CommonJS variables in the
      //order listed below.
      deps = (callback.length === 1 ? ['require'] : ['require', 'exports', 'module']).concat(deps);
    }
  }

  //If in IE 6-8 and hit an anonymous define() call, do the interactive
  //work.
  if (useInteractive) {
    node = currentlyAddingScript || getInteractiveScript();
    if (node) {
      if (!name) {
        name = node.getAttribute('data-requiremodule');
      }
      context = contexts[node.getAttribute('data-requirecontext')];
    }
  }

  //Always save off evaluating the def call until the script onload handler.
  //This allows multiple modules to be in a file without prematurely
  //tracing dependencies, and allows for anonymous module support,
  //where the module name is not known until the script onload event
  //occurs. If no context, use the global queue, and get it processed
  //in the onscript load callback.
  (context ? context.defQueue : globalDefQueue).push([name, deps, callback]);
};

  define.amd = {
    jQuery: true
  };


  /**
  * Executes the text. Normally just uses eval, but can be modified
  * to use a better, environment-specific call. Only used for transpiling
  * loader plugins, not for plain JS modules.
  * @param {String} text the text to execute/evaluate.
  */
  req.exec = function (text) {
    /*jslint evil: true */
    return eval(text);
  };

  //Set up with config info.
  req(cfg);

  window.cfg = cfg;
  window.contexts = contexts;

} (this));
;//     Zepto.js
//     (c) 2010-2014 Thomas Fuchs
//     Zepto.js may be freely distributed under the MIT license.

var Zepto = (function () {
  var undefined, key, $, classList, emptyArray = [], slice = emptyArray.slice, filter = emptyArray.filter,
    document = window.document,
    elementDisplay = {}, classCache = {},
    getComputedStyle = document.defaultView.getComputedStyle,
    cssNumber = { 'column-count': 1, 'columns': 1, 'font-weight': 1, 'line-height': 1, 'opacity': 1, 'z-index': 1, 'zoom': 1 },
    fragmentRE = /^\s*<(\w+|!)[^>]*>/,
    tagExpanderRE = /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/ig,
    rootNodeRE = /^(?:body|html)$/i,

  // special attributes that should be get/set via method calls
    methodAttributes = ['val', 'css', 'html', 'text', 'data', 'width', 'height', 'offset'],

    adjacencyOperators = ['after', 'prepend', 'before', 'append'],
    table = document.createElement('table'),
    tableRow = document.createElement('tr'),
    containers = {
      'tr': document.createElement('tbody'),
      'tbody': table, 'thead': table, 'tfoot': table,
      'td': tableRow, 'th': tableRow,
      '*': document.createElement('div')
    },
    readyRE = /complete|loaded|interactive/,
    classSelectorRE = /^\.([\w-]+)$/,
    idSelectorRE = /^#([\w-]*)$/,
    tagSelectorRE = /^[\w-]+$/,
    class2type = {},
    toString = class2type.toString,
    zepto = {},
    camelize, uniq,
    tempParent = document.createElement('div')

  zepto.matches = function (element, selector) {
    if (!element || element.nodeType !== 1) return false
    var matchesSelector = element.webkitMatchesSelector || element.mozMatchesSelector ||
                          element.oMatchesSelector || element.matchesSelector
    if (matchesSelector) return matchesSelector.call(element, selector)
    // fall back to performing a selector:
    var match, parent = element.parentNode, temp = !parent
    if (temp) (parent = tempParent).appendChild(element)
    match = ~zepto.qsa(parent, selector).indexOf(element)
    temp && tempParent.removeChild(element)
    return match
  }

  function type(obj) {
    return obj == null ? String(obj) :
      class2type[toString.call(obj)] || "object"
  }

  function isFunction(value) { return type(value) == "function" }
  function isWindow(obj) { return obj != null && obj == obj.window }
  function isDocument(obj) { return obj != null && obj.nodeType == obj.DOCUMENT_NODE }
  function isObject(obj) { return type(obj) == "object" }
  function isPlainObject(obj) {
    return isObject(obj) && !isWindow(obj) && obj.__proto__ == Object.prototype
  }
  function isArray(value) { return value instanceof Array }
  function likeArray(obj) { return typeof obj.length == 'number' }

  function compact(array) { return filter.call(array, function (item) { return item != null }) }
  function flatten(array) { return array.length > 0 ? $.fn.concat.apply([], array) : array }
  camelize = function (str) { return str.replace(/-+(.)?/g, function (match, chr) { return chr ? chr.toUpperCase() : '' }) }
  function dasherize(str) {
    return str.replace(/::/g, '/')
           .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
           .replace(/([a-z\d])([A-Z])/g, '$1_$2')
           .replace(/_/g, '-')
           .toLowerCase()
  }
  uniq = function (array) { return filter.call(array, function (item, idx) { return array.indexOf(item) == idx }) }

  function classRE(name) {
    return name in classCache ?
      classCache[name] : (classCache[name] = new RegExp('(^|\\s)' + name + '(\\s|$)'))
  }

  function maybeAddPx(name, value) {
    return (typeof value == "number" && !cssNumber[dasherize(name)]) ? value + "px" : value
  }

  function defaultDisplay(nodeName) {
    var element, display
    if (!elementDisplay[nodeName]) {
      element = document.createElement(nodeName)
      document.body.appendChild(element)
      display = getComputedStyle(element, '').getPropertyValue("display")
      element.parentNode.removeChild(element)
      display == "none" && (display = "block")
      elementDisplay[nodeName] = display
    }
    return elementDisplay[nodeName]
  }

  function children(element) {
    return 'children' in element ?
      slice.call(element.children) :
      $.map(element.childNodes, function (node) { if (node.nodeType == 1) return node })
  }

  // `$.zepto.fragment` takes a html string and an optional tag name
  // to generate DOM nodes nodes from the given html string.
  // The generated DOM nodes are returned as an array.
  // This function can be overriden in plugins for example to make
  // it compatible with browsers that don't support the DOM fully.
  zepto.fragment = function (html, name, properties) {
    if (html.replace) html = html.replace(tagExpanderRE, "<$1></$2>")
    if (name === undefined) name = fragmentRE.test(html) && RegExp.$1
    if (!(name in containers)) name = '*'

    var nodes, dom, container = containers[name]
    container.innerHTML = '' + html
    dom = $.each(slice.call(container.childNodes), function () {
      container.removeChild(this)
    })
    if (isPlainObject(properties)) {
      nodes = $(dom)
      $.each(properties, function (key, value) {
        if (methodAttributes.indexOf(key) > -1) nodes[key](value)
        else nodes.attr(key, value)
      })
    }
    return dom
  }

  // `$.zepto.Z` swaps out the prototype of the given `dom` array
  // of nodes with `$.fn` and thus supplying all the Zepto functions
  // to the array. Note that `__proto__` is not supported on Internet
  // Explorer. This method can be overriden in plugins.
  zepto.Z = function (dom, selector) {
    dom = dom || []
    dom.__proto__ = $.fn
    dom.selector = selector || ''
    return dom
  }

  // `$.zepto.isZ` should return `true` if the given object is a Zepto
  // collection. This method can be overriden in plugins.
  zepto.isZ = function (object) {
    return object instanceof zepto.Z
  }

  // `$.zepto.init` is Zepto's counterpart to jQuery's `$.fn.init` and
  // takes a CSS selector and an optional context (and handles various
  // special cases).
  // This method can be overriden in plugins.
  zepto.init = function (selector, context) {
    // If nothing given, return an empty Zepto collection
    if (!selector) return zepto.Z()
    // If a function is given, call it when the DOM is ready
    else if (isFunction(selector)) return $(document).ready(selector)
    // If a Zepto collection is given, juts return it
    else if (zepto.isZ(selector)) return selector
    else {
      var dom
      // normalize array if an array of nodes is given
      if (isArray(selector)) dom = compact(selector)
      // Wrap DOM nodes. If a plain object is given, duplicate it.
      else if (isObject(selector))
        dom = [isPlainObject(selector) ? $.extend({}, selector) : selector], selector = null
      // If it's a html fragment, create nodes from it
      else if (fragmentRE.test(selector))
        dom = zepto.fragment(selector.trim(), RegExp.$1, context), selector = null
      // If there's a context, create a collection on that context first, and select
      // nodes from there
      else if (context !== undefined) return $(context).find(selector)
      // And last but no least, if it's a CSS selector, use it to select nodes.
      else dom = zepto.qsa(document, selector)
      // create a new Zepto collection from the nodes found
      return zepto.Z(dom, selector)
    }
  }

  // `$` will be the base `Zepto` object. When calling this
  // function just call `$.zepto.init, which makes the implementation
  // details of selecting nodes and creating Zepto collections
  // patchable in plugins.
  $ = function (selector, context) {
    return zepto.init(selector, context)
  }

  function extend(target, source, deep) {
    for (key in source)
      if (deep && (isPlainObject(source[key]) || isArray(source[key]))) {
        if (isPlainObject(source[key]) && !isPlainObject(target[key]))
          target[key] = {}
        if (isArray(source[key]) && !isArray(target[key]))
          target[key] = []
        extend(target[key], source[key], deep)
      }
      else if (source[key] !== undefined) target[key] = source[key]
    }

    // Copy all but undefined properties from one or more
    // objects to the `target` object.
    $.extend = function (target) {
      var deep, args = slice.call(arguments, 1)
      if (typeof target == 'boolean') {
        deep = target
        target = args.shift()
      }
      args.forEach(function (arg) { extend(target, arg, deep) })
      return target
    }

    // `$.zepto.qsa` is Zepto's CSS selector implementation which
    // uses `document.querySelectorAll` and optimizes for some special cases, like `#id`.
    // This method can be overriden in plugins.
    zepto.qsa = function (element, selector) {
      var found
      return (isDocument(element) && idSelectorRE.test(selector)) ?
      ((found = element.getElementById(RegExp.$1)) ? [found] : []) :
      (element.nodeType !== 1 && element.nodeType !== 9) ? [] :
      slice.call(
        classSelectorRE.test(selector) ? element.getElementsByClassName(RegExp.$1) :
        tagSelectorRE.test(selector) ? element.getElementsByTagName(selector) :
        element.querySelectorAll(selector)
      )
    }

    function filtered(nodes, selector) {
      return selector === undefined ? $(nodes) : $(nodes).filter(selector)
    }

    $.contains = function (parent, node) {
      return parent !== node && parent.contains(node)
    }

    function funcArg(context, arg, idx, payload) {
      return isFunction(arg) ? arg.call(context, idx, payload) : arg
    }

    function setAttribute(node, name, value) {
      value == null ? node.removeAttribute(name) : node.setAttribute(name, value)
    }

    // access className property while respecting SVGAnimatedString
    function className(node, value) {
      var klass = node.className,
        svg = klass && klass.baseVal !== undefined

      if (value === undefined) return svg ? klass.baseVal : klass
      svg ? (klass.baseVal = value) : (node.className = value)
    }

    // "true"  => true
    // "false" => false
    // "null"  => null
    // "42"    => 42
    // "42.5"  => 42.5
    // JSON    => parse if valid
    // String  => self
    function deserializeValue(value) {
      var num
      try {
        return value ?
        value == "true" ||
        (value == "false" ? false :
          value == "null" ? null :
          !isNaN(num = Number(value)) ? num :
          /^[\[\{]/.test(value) ? $.parseJSON(value) :
          value)
        : value
      } catch (e) {
        return value
      }
    }

    $.type = type
    $.isFunction = isFunction
    $.isWindow = isWindow
    $.isArray = isArray
    $.isPlainObject = isPlainObject

    $.isEmptyObject = function (obj) {
      var name
      for (name in obj) return false
      return true
    }

    $.inArray = function (elem, array, i) {
      return emptyArray.indexOf.call(array, elem, i)
    }

    $.camelCase = camelize
    $.trim = function (str) { return str.trim() }

    // plugin compatibility
    $.uuid = 0
    $.support = {}
    $.expr = {}

    $.map = function (elements, callback) {
      var value, values = [], i, key
      if (likeArray(elements))
        for (i = 0; i < elements.length; i++) {
          value = callback(elements[i], i)
          if (value != null) values.push(value)
        }
      else
        for (key in elements) {
          value = callback(elements[key], key)
          if (value != null) values.push(value)
        }
      return flatten(values)
    }

    $.each = function (elements, callback) {
      var i, key
      if (likeArray(elements)) {
        for (i = 0; i < elements.length; i++)
          if (callback.call(elements[i], i, elements[i]) === false) return elements
        } else {
          for (key in elements)
            if (callback.call(elements[key], key, elements[key]) === false) return elements
          }

          return elements
        }

        $.grep = function (elements, callback) {
          return filter.call(elements, callback)
        }

        if (window.JSON) $.parseJSON = JSON.parse

        // Populate the class2type map
        $.each("Boolean Number String Function Array Date RegExp Object Error".split(" "), function (i, name) {
          class2type["[object " + name + "]"] = name.toLowerCase()
        })

        // Define methods that will be available on all
        // Zepto collections
        $.fn = {
          // Because a collection acts like an array
          // copy over these useful array functions.
          forEach: emptyArray.forEach,
          reduce: emptyArray.reduce,
          push: emptyArray.push,
          sort: emptyArray.sort,
          indexOf: emptyArray.indexOf,
          concat: emptyArray.concat,

          // `map` and `slice` in the jQuery API work differently
          // from their array counterparts
          map: function (fn) {
            return $($.map(this, function (el, i) { return fn.call(el, i, el) }))
          },
          slice: function () {
            return $(slice.apply(this, arguments))
          },

          ready: function (callback) {
            if (readyRE.test(document.readyState)) callback($)
            else document.addEventListener('DOMContentLoaded', function () { callback($) }, false)
            return this
          },
          get: function (idx) {
            return idx === undefined ? slice.call(this) : this[idx >= 0 ? idx : idx + this.length]
          },
          toArray: function () { return this.get() },
          size: function () {
            return this.length
          },
          remove: function () {
            return this.each(function () {
              if (this.parentNode != null)
                this.parentNode.removeChild(this)
            })
          },
          each: function (callback) {
            emptyArray.every.call(this, function (el, idx) {
              return callback.call(el, idx, el) !== false
            })
            return this
          },
          filter: function (selector) {
            if (isFunction(selector)) return this.not(this.not(selector))
            return $(filter.call(this, function (element) {
              return zepto.matches(element, selector)
            }))
          },
          add: function (selector, context) {
            return $(uniq(this.concat($(selector, context))))
          },
          is: function (selector) {
            return this.length > 0 && zepto.matches(this[0], selector)
          },
          not: function (selector) {
            var nodes = []
            if (isFunction(selector) && selector.call !== undefined)
              this.each(function (idx) {
                if (!selector.call(this, idx)) nodes.push(this)
              })
            else {
              var excludes = typeof selector == 'string' ? this.filter(selector) :
          (likeArray(selector) && isFunction(selector.item)) ? slice.call(selector) : $(selector)
              this.forEach(function (el) {
                if (excludes.indexOf(el) < 0) nodes.push(el)
              })
            }
            return $(nodes)
          },
          has: function (selector) {
            return this.filter(function () {
              return isObject(selector) ?
          $.contains(this, selector) :
          $(this).find(selector).size()
            })
          },
          eq: function (idx) {
            return idx === -1 ? this.slice(idx) : this.slice(idx, +idx + 1)
          },
          first: function () {
            var el = this[0]
            return el && !isObject(el) ? el : $(el)
          },
          last: function () {
            var el = this[this.length - 1]
            return el && !isObject(el) ? el : $(el)
          },
          find: function (selector) {
            var result, $this = this
            if (typeof selector == 'object')
              result = $(selector).filter(function () {
                var node = this
                return emptyArray.some.call($this, function (parent) {
                  return $.contains(parent, node)
                })
              })
            else if (this.length == 1) result = $(zepto.qsa(this[0], selector))
            else result = this.map(function () { return zepto.qsa(this, selector) })
            return result
          },
          closest: function (selector, context) {
            var node = this[0], collection = false
            if (typeof selector == 'object') collection = $(selector)
            while (node && !(collection ? collection.indexOf(node) >= 0 : zepto.matches(node, selector)))
              node = node !== context && !isDocument(node) && node.parentNode
            return $(node)
          },
          parents: function (selector) {
            var ancestors = [], nodes = this
            while (nodes.length > 0)
              nodes = $.map(nodes, function (node) {
                if ((node = node.parentNode) && !isDocument(node) && ancestors.indexOf(node) < 0) {
                  ancestors.push(node)
                  return node
                }
              })
            return filtered(ancestors, selector)
          },
          parent: function (selector) {
            return filtered(uniq(this.pluck('parentNode')), selector)
          },
          children: function (selector) {
            return filtered(this.map(function () { return children(this) }), selector)
          },
          contents: function () {
            return this.map(function () { return slice.call(this.childNodes) })
          },
          siblings: function (selector) {
            return filtered(this.map(function (i, el) {
              return filter.call(children(el.parentNode), function (child) { return child !== el })
            }), selector)
          },
          empty: function () {
            return this.each(function () { this.innerHTML = '' })
          },
          // `pluck` is borrowed from Prototype.js
          pluck: function (property) {
            return $.map(this, function (el) { return el[property] })
          },
          show: function () {
            return this.each(function () {
              this.style.display == "none" && (this.style.display = null)
              if (getComputedStyle(this, '').getPropertyValue("display") == "none")
                this.style.display = defaultDisplay(this.nodeName)
            })
          },
          replaceWith: function (newContent) {
            return this.before(newContent).remove()
          },
          wrap: function (structure) {
            var func = isFunction(structure)
            if (this[0] && !func)
              var dom = $(structure).get(0),
            clone = dom.parentNode || this.length > 1

            return this.each(function (index) {
              $(this).wrapAll(
          func ? structure.call(this, index) :
            clone ? dom.cloneNode(true) : dom
        )
            })
          },
          wrapAll: function (structure) {
            if (this[0]) {
              $(this[0]).before(structure = $(structure))
              var children
              // drill down to the inmost element
              while ((children = structure.children()).length) structure = children.first()
              $(structure).append(this)
            }
            return this
          },
          wrapInner: function (structure) {
            var func = isFunction(structure)
            return this.each(function (index) {
              var self = $(this), contents = self.contents(),
            dom = func ? structure.call(this, index) : structure
              contents.length ? contents.wrapAll(dom) : self.append(dom)
            })
          },
          unwrap: function () {
            this.parent().each(function () {
              $(this).replaceWith($(this).children())
            })
            return this
          },
          clone: function () {
            return this.map(function () { return this.cloneNode(true) })
          },
          hide: function () {
            return this.css("display", "none")
          },
          toggle: function (setting) {
            return this.each(function () {
              var el = $(this)
        ; (setting === undefined ? el.css("display") == "none" : setting) ? el.show() : el.hide()
            })
          },
          prev: function (selector) { return $(this.pluck('previousElementSibling')).filter(selector || '*') },
          next: function (selector) { return $(this.pluck('nextElementSibling')).filter(selector || '*') },
          html: function (html) {
            return html === undefined ?
        (this.length > 0 ? this[0].innerHTML : null) :
        this.each(function (idx) {
          var originHtml = this.innerHTML
          $(this).empty().append(funcArg(this, html, idx, originHtml))
        })
          },
          text: function (text) {
            return text === undefined ?
        (this.length > 0 ? this[0].textContent : null) :
        this.each(function () { this.textContent = text })
          },
          attr: function (name, value) {
            var result
            return (typeof name == 'string' && value === undefined) ?
        (this.length == 0 || this[0].nodeType !== 1 ? undefined :
          (name == 'value' && this[0].nodeName == 'INPUT') ? this.val() :
          (!(result = this[0].getAttribute(name)) && name in this[0]) ? this[0][name] : result
        ) :
        this.each(function (idx) {
          if (this.nodeType !== 1) return
          if (isObject(name)) for (key in name) setAttribute(this, key, name[key])
          else setAttribute(this, name, funcArg(this, value, idx, this.getAttribute(name)))
        })
          },
          removeAttr: function (name) {
            return this.each(function () { this.nodeType === 1 && setAttribute(this, name) })
          },
          prop: function (name, value) {
            return (value === undefined) ?
        (this[0] && this[0][name]) :
        this.each(function (idx) {
          this[name] = funcArg(this, value, idx, this[name])
        })
          },
          data: function (name, value) {
            var data = this.attr('data-' + dasherize(name), value)
            return data !== null ? deserializeValue(data) : undefined
          },
          val: function (value) {
            return (value === undefined) ?
        (this[0] && (this[0].multiple ?
           $(this[0]).find('option').filter(function (o) { return this.selected }).pluck('value') :
           this[0].value)
        ) :
        this.each(function (idx) {
          this.value = funcArg(this, value, idx, this.value)
        })
          },
          offset: function (coordinates) {
            if (coordinates) return this.each(function (index) {
              var $this = $(this),
            coords = funcArg(this, coordinates, index, $this.offset()),
            parentOffset = $this.offsetParent().offset(),
            props = {
              top: coords.top - parentOffset.top,
              left: coords.left - parentOffset.left
            }

              if ($this.css('position') == 'static') props['position'] = 'relative'
              $this.css(props)
            })
            if (this.length == 0) return null
            var obj = this[0].getBoundingClientRect()
            return {
              left: obj.left + window.pageXOffset,
              top: obj.top + window.pageYOffset,
              width: Math.round(obj.width),
              height: Math.round(obj.height)
            }
          },
          css: function (property, value) {
            if (arguments.length < 2 && typeof property == 'string')
              return this[0] && (this[0].style[camelize(property)] || getComputedStyle(this[0], '').getPropertyValue(property))

            var css = ''
            if (type(property) == 'string') {
              if (!value && value !== 0)
                this.each(function () { this.style.removeProperty(dasherize(property)) })
              else
                css = dasherize(property) + ":" + maybeAddPx(property, value)
            } else {
              for (key in property)
                if (!property[key] && property[key] !== 0)
                  this.each(function () { this.style.removeProperty(dasherize(key)) })
                else
                  css += dasherize(key) + ':' + maybeAddPx(key, property[key]) + ';'
              }

              return this.each(function () { this.style.cssText += ';' + css })
            },
            index: function (element) {
              return element ? this.indexOf($(element)[0]) : this.parent().children().indexOf(this[0])
            },
            hasClass: function (name) {
              return emptyArray.some.call(this, function (el) {
                return this.test(className(el))
              }, classRE(name))
            },
            addClass: function (name) {
              return this.each(function (idx) {
                classList = []
                var cls = className(this), newName = funcArg(this, name, idx, cls)
                newName.split(/\s+/g).forEach(function (klass) {
                  if (!$(this).hasClass(klass)) classList.push(klass)
                }, this)
                classList.length && className(this, cls + (cls ? " " : "") + classList.join(" "))
              })
            },
            removeClass: function (name) {
              return this.each(function (idx) {
                if (name === undefined) return className(this, '')
                classList = className(this)
                funcArg(this, name, idx, classList).split(/\s+/g).forEach(function (klass) {
                  classList = classList.replace(classRE(klass), " ")
                })
                className(this, classList.trim())
              })
            },
            toggleClass: function (name, when) {
              return this.each(function (idx) {
                var $this = $(this), names = funcArg(this, name, idx, className(this))
                names.split(/\s+/g).forEach(function (klass) {
                  (when === undefined ? !$this.hasClass(klass) : when) ?
            $this.addClass(klass) : $this.removeClass(klass)
                })
              })
            },
            scrollTop: function () {
              if (!this.length) return
              return ('scrollTop' in this[0]) ? this[0].scrollTop : this[0].scrollY
            },
            position: function () {
              if (!this.length) return

              var elem = this[0],
              // Get *real* offsetParent
        offsetParent = this.offsetParent(),
              // Get correct offsets
        offset = this.offset(),
        parentOffset = rootNodeRE.test(offsetParent[0].nodeName) ? { top: 0, left: 0} : offsetParent.offset()

              // Subtract element margins
              // note: when an element has margin: auto the offsetLeft and marginLeft
              // are the same in Safari causing offset.left to incorrectly be 0
              offset.top -= parseFloat($(elem).css('margin-top')) || 0
              offset.left -= parseFloat($(elem).css('margin-left')) || 0

              // Add offsetParent borders
              parentOffset.top += parseFloat($(offsetParent[0]).css('border-top-width')) || 0
              parentOffset.left += parseFloat($(offsetParent[0]).css('border-left-width')) || 0

              // Subtract the two offsets
              return {
                top: offset.top - parentOffset.top,
                left: offset.left - parentOffset.left
              }
            },
            offsetParent: function () {
              return this.map(function () {
                var parent = this.offsetParent || document.body
                while (parent && !rootNodeRE.test(parent.nodeName) && $(parent).css("position") == "static")
                  parent = parent.offsetParent
                return parent
              })
            }
          }

          // for now
          $.fn.detach = $.fn.remove

          // Generate the `width` and `height` functions
  ; ['width', 'height'].forEach(function (dimension) {
    $.fn[dimension] = function (value) {
      var offset, el = this[0],
        Dimension = dimension.replace(/./, function (m) { return m[0].toUpperCase() })
      if (value === undefined) return isWindow(el) ? el['inner' + Dimension] :
        isDocument(el) ? el.documentElement['offset' + Dimension] :
        (offset = this.offset()) && offset[dimension]
      else return this.each(function (idx) {
        el = $(this)
        el.css(dimension, funcArg(this, value, idx, el[dimension]()))
      })
    }
  })

          function traverseNode(node, fun) {
            fun(node)
            for (var key in node.childNodes) traverseNode(node.childNodes[key], fun)
          }

          // Generate the `after`, `prepend`, `before`, `append`,
          // `insertAfter`, `insertBefore`, `appendTo`, and `prependTo` methods.
          adjacencyOperators.forEach(function (operator, operatorIndex) {
            var inside = operatorIndex % 2 //=> prepend, append

            $.fn[operator] = function () {
              // arguments can be nodes, arrays of nodes, Zepto objects and HTML strings
              var argType, nodes = $.map(arguments, function (arg) {
                argType = type(arg)
                return argType == "object" || argType == "array" || arg == null ?
              arg : zepto.fragment(arg)
              }),
          parent, copyByClone = this.length > 1
              if (nodes.length < 1) return this

              return this.each(function (_, target) {
                parent = inside ? target : target.parentNode

                // convert all methods to a "before" operation
                target = operatorIndex == 0 ? target.nextSibling :
                 operatorIndex == 1 ? target.firstChild :
                 operatorIndex == 2 ? target :
                 null

                nodes.forEach(function (node) {
                  if (copyByClone) node = node.cloneNode(true)
                  else if (!parent) return $(node).remove()

                  traverseNode(parent.insertBefore(node, target), function (el) {
                    if (el.nodeName != null && el.nodeName.toUpperCase() === 'SCRIPT' &&
               (!el.type || el.type === 'text/javascript') && !el.src)
                      window['eval'].call(window, el.innerHTML)
                  })
                })
              })
            }

            // after    => insertAfter
            // prepend  => prependTo
            // before   => insertBefore
            // append   => appendTo
            $.fn[inside ? operator + 'To' : 'insert' + (operatorIndex ? 'Before' : 'After')] = function (html) {
              $(html)[operator](this)
              return this
            }
          })

          zepto.Z.prototype = $.fn

          // Export internal API functions in the `$.zepto` namespace
          zepto.uniq = uniq
          zepto.deserializeValue = deserializeValue
          $.zepto = zepto

          return $
        })()


        // If `$` is not yet defined, point it to `Zepto`
        window.Zepto = Zepto
        window.$ === undefined && (window.$ = Zepto)

; (function ($) {
  function detect(ua) {
    var os = this.os = {}, browser = this.browser = {},
      webkit = ua.match(/Web[kK]it[\/]{0,1}([\d.]+)/),
      android = ua.match(/(Android);?[\s\/]+([\d.]+)?/),
      ipad = ua.match(/(iPad).*OS\s([\d_]+)/),
      ipod = ua.match(/(iPod)(.*OS\s([\d_]+))?/),
      iphone = !ipad && ua.match(/(iPhone\sOS)\s([\d_]+)/),
      webos = ua.match(/(webOS|hpwOS)[\s\/]([\d.]+)/),
      touchpad = webos && ua.match(/TouchPad/),
      kindle = ua.match(/Kindle\/([\d.]+)/),
      silk = ua.match(/Silk\/([\d._]+)/),
      blackberry = ua.match(/(BlackBerry).*Version\/([\d.]+)/),
      bb10 = ua.match(/(BB10).*Version\/([\d.]+)/),
      rimtabletos = ua.match(/(RIM\sTablet\sOS)\s([\d.]+)/),
      playbook = ua.match(/PlayBook/),
      chrome = ua.match(/Chrome\/([\d.]+)/) || ua.match(/CriOS\/([\d.]+)/),
      firefox = ua.match(/Firefox\/([\d.]+)/),
      ie = ua.match(/MSIE\s([\d.]+)/),
      safari = webkit && ua.match(/Mobile\//) && !chrome,
      webview = ua.match(/(iPhone|iPod|iPad).*AppleWebKit(?!.*Safari)/) && !chrome

    // Todo: clean this up with a better OS/browser seperation:
    // - discern (more) between multiple browsers on android
    // - decide if kindle fire in silk mode is android or not
    // - Firefox on Android doesn't specify the Android version
    // - possibly devide in os, device and browser hashes

    if (browser.webkit = !!webkit) browser.version = webkit[1]

    if (android) os.android = true, os.version = android[2]
    if (iphone && !ipod) os.ios = os.iphone = true, os.version = iphone[2].replace(/_/g, '.')
    if (ipad) os.ios = os.ipad = true, os.version = ipad[2].replace(/_/g, '.')
    if (ipod) os.ios = os.ipod = true, os.version = ipod[3] ? ipod[3].replace(/_/g, '.') : null
    if (webos) os.webos = true, os.version = webos[2]
    if (touchpad) os.touchpad = true
    if (blackberry) os.blackberry = true, os.version = blackberry[2]
    if (bb10) os.bb10 = true, os.version = bb10[2]
    if (rimtabletos) os.rimtabletos = true, os.version = rimtabletos[2]
    if (playbook) browser.playbook = true
    if (kindle) os.kindle = true, os.version = kindle[1]
    if (silk) browser.silk = true, browser.version = silk[1]
    if (!silk && os.android && ua.match(/Kindle Fire/)) browser.silk = true
    if (chrome) browser.chrome = true, browser.version = chrome[1]
    if (firefox) browser.firefox = true, browser.version = firefox[1]
    if (ie) browser.ie = true, browser.version = ie[1]
    if (safari && (ua.match(/Safari/) || !!os.ios)) browser.safari = true
    if (webview) browser.webview = true

    os.tablet = !!(ipad || playbook || (android && !ua.match(/Mobile/)) ||
      (firefox && ua.match(/Tablet/)) || (ie && !ua.match(/Phone/) && ua.match(/Touch/)))
    os.phone = !!(!os.tablet && !os.ipod && (android || iphone || webos || blackberry || bb10 ||
      (chrome && ua.match(/Android/)) || (chrome && ua.match(/CriOS\/([\d.]+)/)) ||
      (firefox && ua.match(/Mobile/)) || (ie && ua.match(/Touch/))))
  }

  detect.call($, navigator.userAgent)
  // make available to unit tests
  $.__detect = detect

})(Zepto)

; (function ($) {
  var _zid = 1, undefined,
      slice = Array.prototype.slice,
      isFunction = $.isFunction,
      isString = function (obj) { return typeof obj == 'string' },
      handlers = {},
      specialEvents = {},
      focusinSupported = 'onfocusin' in window,
      focus = { focus: 'focusin', blur: 'focusout' },
      hover = { mouseenter: 'mouseover', mouseleave: 'mouseout' }

  specialEvents.click = specialEvents.mousedown = specialEvents.mouseup = specialEvents.mousemove = 'MouseEvents'

  function zid(element) {
    return element._zid || (element._zid = _zid++)
  }
  function findHandlers(element, event, fn, selector) {
    event = parse(event)
    if (event.ns) var matcher = matcherFor(event.ns)
    return (handlers[zid(element)] || []).filter(function (handler) {
      return handler
        && (!event.e || handler.e == event.e)
        && (!event.ns || matcher.test(handler.ns))
        && (!fn || zid(handler.fn) === zid(fn))
        && (!selector || handler.sel == selector)
    })
  }
  function parse(event) {
    var parts = ('' + event).split('.')
    return { e: parts[0], ns: parts.slice(1).sort().join(' ') }
  }
  function matcherFor(ns) {
    return new RegExp('(?:^| )' + ns.replace(' ', ' .* ?') + '(?: |$)')
  }

  function eventCapture(handler, captureSetting) {
    return handler.del &&
      (!focusinSupported && (handler.e in focus)) ||
      !!captureSetting
  }

  function realEvent(type) {
    return hover[type] || (focusinSupported && focus[type]) || type
  }

  function add(element, events, fn, data, selector, delegator, capture) {
    var id = zid(element), set = (handlers[id] || (handlers[id] = []))
    events.split(/\s/).forEach(function (event) {
      if (event == 'ready') return $(document).ready(fn)
      var handler = parse(event)
      handler.fn = fn
      handler.sel = selector
      // emulate mouseenter, mouseleave
      if (handler.e in hover) fn = function (e) {
        var related = e.relatedTarget
        if (!related || (related !== this && !$.contains(this, related)))
          return handler.fn.apply(this, arguments)
      }
      handler.del = delegator
      var callback = delegator || fn
      handler.proxy = function (e) {
        e = compatible(e)
        if (e.isImmediatePropagationStopped()) return
        e.data = data
        var result = callback.apply(element, e._args == undefined ? [e] : [e].concat(e._args))
        if (result === false) e.preventDefault(), e.stopPropagation()
        return result
      }
      handler.i = set.length
      set.push(handler)
      if ('addEventListener' in element)
        element.addEventListener(realEvent(handler.e), handler.proxy, eventCapture(handler, capture))
    })
  }
  function remove(element, events, fn, selector, capture) {
    var id = zid(element)
    ; (events || '').split(/\s/).forEach(function (event) {
      findHandlers(element, event, fn, selector).forEach(function (handler) {
        delete handlers[id][handler.i]
        if ('removeEventListener' in element)
          element.removeEventListener(realEvent(handler.e), handler.proxy, eventCapture(handler, capture))
      })
    })
  }

  $.event = { add: add, remove: remove }

  $.proxy = function (fn, context) {
    if (isFunction(fn)) {
      var proxyFn = function () { return fn.apply(context, arguments) }
      proxyFn._zid = zid(fn)
      return proxyFn
    } else if (isString(context)) {
      return $.proxy(fn[context], fn)
    } else {
      throw new TypeError("expected function")
    }
  }

  $.fn.bind = function (event, data, callback) {
    return this.on(event, data, callback)
  }
  $.fn.unbind = function (event, callback) {
    return this.off(event, callback)
  }
  $.fn.one = function (event, selector, data, callback) {
    return this.on(event, selector, data, callback, 1)
  }

  var returnTrue = function () { return true },
      returnFalse = function () { return false },
      ignoreProperties = /^([A-Z]|returnValue$|layer[XY]$)/,
      eventMethods = {
        preventDefault: 'isDefaultPrevented',
        stopImmediatePropagation: 'isImmediatePropagationStopped',
        stopPropagation: 'isPropagationStopped'
      }

  function compatible(event, source) {
    if (source || !event.isDefaultPrevented) {
      source || (source = event)

      $.each(eventMethods, function (name, predicate) {
        var sourceMethod = source[name]
        event[name] = function () {
          this[predicate] = returnTrue
          return sourceMethod && sourceMethod.apply(source, arguments)
        }
        event[predicate] = returnFalse
      })

      if (source.defaultPrevented !== undefined ? source.defaultPrevented :
          'returnValue' in source ? source.returnValue === false :
          source.getPreventDefault && source.getPreventDefault())
        event.isDefaultPrevented = returnTrue
    }
    return event
  }

  function createProxy(event) {
    var key, proxy = { originalEvent: event }
    for (key in event)
      if (!ignoreProperties.test(key) && event[key] !== undefined) proxy[key] = event[key]

      return compatible(proxy, event)
    }

    $.fn.delegate = function (selector, event, callback) {
      return this.on(event, selector, callback)
    }
    $.fn.undelegate = function (selector, event, callback) {
      return this.off(event, selector, callback)
    }

    $.fn.live = function (event, callback) {
      $(document.body).delegate(this.selector, event, callback)
      return this
    }
    $.fn.die = function (event, callback) {
      $(document.body).undelegate(this.selector, event, callback)
      return this
    }

    $.fn.on = function (event, selector, data, callback, one) {
      var autoRemove, delegator, $this = this
      if (event && !isString(event)) {
        $.each(event, function (type, fn) {
          $this.on(type, selector, data, fn, one)
        })
        return $this
      }

      if (!isString(selector) && !isFunction(callback) && callback !== false)
        callback = data, data = selector, selector = undefined
      if (isFunction(data) || data === false)
        callback = data, data = undefined

      if (callback === false) callback = returnFalse

      return $this.each(function (_, element) {
        if (one) autoRemove = function (e) {
          remove(element, e.type, callback)
          return callback.apply(this, arguments)
        }

        if (selector) delegator = function (e) {
          var evt, match = $(e.target).closest(selector, element).get(0)
          if (match && match !== element) {
            evt = $.extend(createProxy(e), { currentTarget: match, liveFired: element })
            return (autoRemove || callback).apply(match, [evt].concat(slice.call(arguments, 1)))
          }
        }

        add(element, event, callback, data, selector, delegator || autoRemove)
      })
    }
    $.fn.off = function (event, selector, callback) {
      var $this = this
      if (event && !isString(event)) {
        $.each(event, function (type, fn) {
          $this.off(type, selector, fn)
        })
        return $this
      }

      if (!isString(selector) && !isFunction(callback) && callback !== false)
        callback = selector, selector = undefined

      if (callback === false) callback = returnFalse

      return $this.each(function () {
        remove(this, event, callback, selector)
      })
    }

    $.fn.trigger = function (event, args) {
      event = (isString(event) || $.isPlainObject(event)) ? $.Event(event) : compatible(event)
      event._args = args
      return this.each(function () {
        // items in the collection might not be DOM elements
        if ('dispatchEvent' in this) this.dispatchEvent(event)
        else $(this).triggerHandler(event, args)
      })
    }

    // triggers event handlers on current element just as if an event occurred,
    // doesn't trigger an actual event, doesn't bubble
    $.fn.triggerHandler = function (event, args) {
      var e, result
      this.each(function (i, element) {
        e = createProxy(isString(event) ? $.Event(event) : event)
        e._args = args
        e.target = element
        $.each(findHandlers(element, event.type || event), function (i, handler) {
          result = handler.proxy(e)
          if (e.isImmediatePropagationStopped()) return false
        })
      })
      return result
    }

    // shortcut methods for `.bind(event, fn)` for each event type
  ; ('focusin focusout load resize scroll unload click dblclick ' +
  'mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave ' +
  'change select keydown keypress keyup error').split(' ').forEach(function (event) {
    $.fn[event] = function (callback) {
      return callback ?
        this.bind(event, callback) :
        this.trigger(event)
    }
  })

  ; ['focus', 'blur'].forEach(function (name) {
    $.fn[name] = function (callback) {
      if (callback) this.bind(name, callback)
      else this.each(function () {
        try { this[name]() }
        catch (e) { }
      })
      return this
    }
  })
    $.Event = function (type, props) {
      if (!isString(type)) props = type, type = props.type
      var event = document.createEvent(specialEvents[type] || 'Events'), bubbles = true
      if (props) for (var name in props) (name == 'bubbles') ? (bubbles = !!props[name]) : (event[name] = props[name])

            event.initEvent(type, bubbles, true)
      return compatible(event)
    }

  })(Zepto)

; (function ($) {
  var jsonpID = 0,
      document = window.document,
      key,
      name,
      rscript = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      scriptTypeRE = /^(?:text|application)\/javascript/i,
      xmlTypeRE = /^(?:text|application)\/xml/i,
      jsonType = 'application/json',
      htmlType = 'text/html',
      blankRE = /^\s*$/

  // trigger a custom event and return false if it was cancelled
  function triggerAndReturn(context, eventName, data) {
    var event = $.Event(eventName)
    $(context).trigger(event, data)
    return !event.isDefaultPrevented()
  }

  // trigger an Ajax "global" event
  function triggerGlobal(settings, context, eventName, data) {
    if (settings.global) return triggerAndReturn(context || document, eventName, data)
  }

  // Number of active Ajax requests
  $.active = 0

  function ajaxStart(settings) {
    if (settings.global && $.active++ === 0) triggerGlobal(settings, null, 'ajaxStart')
  }
  function ajaxStop(settings) {
    if (settings.global && !(--$.active)) triggerGlobal(settings, null, 'ajaxStop')
  }

  // triggers an extra global event "ajaxBeforeSend" that's like "ajaxSend" but cancelable
  function ajaxBeforeSend(xhr, settings) {
    var context = settings.context
    if (settings.beforeSend.call(context, xhr, settings) === false ||
        triggerGlobal(settings, context, 'ajaxBeforeSend', [xhr, settings]) === false)
      return false

    triggerGlobal(settings, context, 'ajaxSend', [xhr, settings])
  }
  function ajaxSuccess(data, xhr, settings, deferred) {
    var context = settings.context, status = 'success'
    settings.success.call(context, data, status, xhr)
    if (deferred) deferred.resolveWith(context, [data, status, xhr])
    triggerGlobal(settings, context, 'ajaxSuccess', [xhr, settings, data])
    ajaxComplete(status, xhr, settings)
  }
  // type: "timeout", "error", "abort", "parsererror"
  function ajaxError(error, type, xhr, settings, deferred) {
    var context = settings.context
    settings.error.call(context, xhr, type, error)
    if (deferred) deferred.rejectWith(context, [xhr, type, error])
    triggerGlobal(settings, context, 'ajaxError', [xhr, settings, error || type])
    ajaxComplete(type, xhr, settings)
  }
  // status: "success", "notmodified", "error", "timeout", "abort", "parsererror"
  function ajaxComplete(status, xhr, settings) {
    var context = settings.context
    settings.complete.call(context, xhr, status)
    triggerGlobal(settings, context, 'ajaxComplete', [xhr, settings])
    ajaxStop(settings)
  }

  // Empty function, used as default callback
  function empty() { }

  $.ajaxJSONP = function (options, deferred) {
    if (!('type' in options)) return $.ajax(options)

    var _callbackName = options.jsonpCallback,
      callbackName = ($.isFunction(_callbackName) ?
        _callbackName() : _callbackName) || ('jsonp' + (++jsonpID)),
      script = document.createElement('script'),
      originalCallback = window[callbackName],
      responseData,
      abort = function (errorType) {
        $(script).triggerHandler('error', errorType || 'abort')
      },
      xhr = { abort: abort }, abortTimeout

    if (deferred) deferred.promise(xhr)

    $(script).on('load error', function (e, errorType) {
      clearTimeout(abortTimeout)
      $(script).off().remove()

      if (e.type == 'error' || !responseData) {
        ajaxError(null, errorType || 'error', xhr, options, deferred)
      } else {
        ajaxSuccess(responseData[0], xhr, options, deferred)
      }

      window[callbackName] = originalCallback
      if (responseData && $.isFunction(originalCallback))
        originalCallback(responseData[0])

      originalCallback = responseData = undefined
    })

    if (ajaxBeforeSend(xhr, options) === false) {
      abort('abort')
      return xhr
    }

    window[callbackName] = function () {
      responseData = arguments
    }

    script.src = options.url.replace(/\?(.+)=\?/, '?$1=' + callbackName)
    document.head.appendChild(script)

    if (options.timeout > 0) abortTimeout = setTimeout(function () {
      abort('timeout')
    }, options.timeout)

    return xhr
  }

  $.ajaxSettings = {
    // Default type of request
    type: 'GET',
    // Callback that is executed before request
    beforeSend: empty,
    // Callback that is executed if the request succeeds
    success: empty,
    // Callback that is executed the the server drops error
    error: empty,
    // Callback that is executed on request complete (both: error and success)
    complete: empty,
    // The context for the callbacks
    context: null,
    // Whether to trigger "global" Ajax events
    global: true,
    // Transport
    xhr: function () {
      return new window.XMLHttpRequest()
    },
    // MIME types mapping
    // IIS returns Javascript as "application/x-javascript"
    accepts: {
      script: 'text/javascript, application/javascript, application/x-javascript',
      json: jsonType,
      xml: 'application/xml, text/xml',
      html: htmlType,
      text: 'text/plain'
    },
    // Whether the request is to another domain
    crossDomain: false,
    // Default timeout
    timeout: 0,
    // Whether data should be serialized to string
    processData: true,
    // Whether the browser should be allowed to cache GET responses
    cache: true
  }

  function mimeToDataType(mime) {
    if (mime) mime = mime.split(';', 2)[0]
    return mime && (mime == htmlType ? 'html' :
      mime == jsonType ? 'json' :
      scriptTypeRE.test(mime) ? 'script' :
      xmlTypeRE.test(mime) && 'xml') || 'text'
  }

  function appendQuery(url, query) {
    if (query == '') return url
    return (url + '&' + query).replace(/[&?]{1,2}/, '?')
  }

  // serialize payload and append it to the URL for GET requests
  function serializeData(options) {
    if (options.processData && options.data && $.type(options.data) != "string")
      options.data = $.param(options.data, options.traditional)
    if (options.data && (!options.type || options.type.toUpperCase() == 'GET'))
      options.url = appendQuery(options.url, options.data), options.data = undefined
  }

  $.ajax = function (options) {
    var settings = $.extend({}, options || {}),
        deferred = $.Deferred && $.Deferred()
    for (key in $.ajaxSettings) if (settings[key] === undefined) settings[key] = $.ajaxSettings[key]

    ajaxStart(settings)

    if (!settings.crossDomain) settings.crossDomain = /^([\w-]+:)?\/\/([^\/]+)/.test(settings.url) &&
      RegExp.$2 != window.location.host

    if (!settings.url) settings.url = window.location.toString()
    serializeData(settings)
    if (settings.cache === false) settings.url = appendQuery(settings.url, '_=' + Date.now())

    var dataType = settings.dataType, hasPlaceholder = /\?.+=\?/.test(settings.url)
    if (dataType == 'jsonp' || hasPlaceholder) {
      if (!hasPlaceholder)
        settings.url = appendQuery(settings.url,
          settings.jsonp ? (settings.jsonp + '=?') : settings.jsonp === false ? '' : 'callback=?')
      return $.ajaxJSONP(settings, deferred)
    }

    var mime = settings.accepts[dataType],
        headers = {},
        setHeader = function (name, value) { headers[name.toLowerCase()] = [name, value] },
        protocol = /^([\w-]+:)\/\//.test(settings.url) ? RegExp.$1 : window.location.protocol,
        xhr = settings.xhr(),
        nativeSetHeader = xhr.setRequestHeader,
        abortTimeout

    if (deferred) deferred.promise(xhr)

    if (!settings.crossDomain) setHeader('X-Requested-With', 'XMLHttpRequest')
    setHeader('Accept', mime || '*/*')
    if (mime = settings.mimeType || mime) {
      if (mime.indexOf(',') > -1) mime = mime.split(',', 2)[0]
      xhr.overrideMimeType && xhr.overrideMimeType(mime)
    }
    if (settings.contentType || (settings.contentType !== false && settings.data && settings.type.toUpperCase() != 'GET'))
      setHeader('Content-Type', settings.contentType || 'application/x-www-form-urlencoded')

    if (settings.headers) for (name in settings.headers) setHeader(name, settings.headers[name])
    xhr.setRequestHeader = setHeader

    xhr.onreadystatechange = function () {
      if (xhr.readyState == 4) {
        xhr.onreadystatechange = empty
        clearTimeout(abortTimeout)
        var result, error = false
        if ((xhr.status >= 200 && xhr.status < 300) || xhr.status == 304 || (xhr.status == 0 && protocol == 'file:')) {
          dataType = dataType || mimeToDataType(settings.mimeType || xhr.getResponseHeader('content-type'))
          result = xhr.responseText

          try {
            // http://perfectionkills.com/global-eval-what-are-the-options/
            if (dataType == 'script') (1, eval)(result)
            else if (dataType == 'xml') result = xhr.responseXML
            else if (dataType == 'json') result = blankRE.test(result) ? null : $.parseJSON(result)
          } catch (e) { error = e }

          if (error) ajaxError(error, 'parsererror', xhr, settings, deferred)
          else ajaxSuccess(result, xhr, settings, deferred)
        } else {
          ajaxError(xhr.statusText || null, xhr.status ? 'error' : 'abort', xhr, settings, deferred)
        }
      }
    }

    if (ajaxBeforeSend(xhr, settings) === false) {
      xhr.abort()
      ajaxError(null, 'abort', xhr, settings, deferred)
      return xhr
    }

    if (settings.xhrFields) for (name in settings.xhrFields) xhr[name] = settings.xhrFields[name]

    var async = 'async' in settings ? settings.async : true
    xhr.open(settings.type, settings.url, async, settings.username, settings.password)

    for (name in headers) nativeSetHeader.apply(xhr, headers[name])

    if (settings.timeout > 0) abortTimeout = setTimeout(function () {
      xhr.onreadystatechange = empty
      xhr.abort()
      ajaxError(null, 'timeout', xhr, settings, deferred)
    }, settings.timeout)

    // avoid sending empty string (#319)
    xhr.send(settings.data ? settings.data : null)
    return xhr
  }

  // handle optional data/success arguments
  function parseArguments(url, data, success, dataType) {
    if ($.isFunction(data)) dataType = success, success = data, data = undefined
    if (!$.isFunction(success)) dataType = success, success = undefined
    return {
      url: url
    , data: data
    , success: success
    , dataType: dataType
    }
  }

  $.get = function (/* url, data, success, dataType */) {
    return $.ajax(parseArguments.apply(null, arguments))
  }

  $.post = function (/* url, data, success, dataType */) {
    var options = parseArguments.apply(null, arguments)
    options.type = 'POST'
    return $.ajax(options)
  }

  $.getJSON = function (/* url, data, success */) {
    var options = parseArguments.apply(null, arguments)
    options.dataType = 'json'
    return $.ajax(options)
  }

  $.fn.load = function (url, data, success) {
    if (!this.length) return this
    var self = this, parts = url.split(/\s/), selector,
        options = parseArguments(url, data, success),
        callback = options.success
    if (parts.length > 1) options.url = parts[0], selector = parts[1]
    options.success = function (response) {
      self.html(selector ?
        $('<div>').html(response.replace(rscript, "")).find(selector)
        : response)
      callback && callback.apply(self, arguments)
    }
    $.ajax(options)
    return this
  }

  var escape = encodeURIComponent

  function serialize(params, obj, traditional, scope) {
    var type, array = $.isArray(obj), hash = $.isPlainObject(obj)
    $.each(obj, function (key, value) {
      type = $.type(value)
      if (scope) key = traditional ? scope :
        scope + '[' + (hash || type == 'object' || type == 'array' ? key : '') + ']'
      // handle data in serializeArray() format
      if (!scope && array) params.add(value.name, value.value)
      // recurse into nested objects
      else if (type == "array" || (!traditional && type == "object"))
        serialize(params, value, traditional, key)
      else params.add(key, value)
    })
  }

  $.param = function (obj, traditional) {
    var params = []
    params.add = function (k, v) { this.push(escape(k) + '=' + escape(v)) }
    serialize(params, obj, traditional)
    return params.join('&').replace(/%20/g, '+')
  }
})(Zepto)

; (function ($) {
  $.fn.serializeArray = function () {
    var result = [], el
    $([].slice.call(this.get(0).elements)).each(function () {
      el = $(this)
      var type = el.attr('type')
      if (this.nodeName.toLowerCase() != 'fieldset' &&
        !this.disabled && type != 'submit' && type != 'reset' && type != 'button' &&
        ((type != 'radio' && type != 'checkbox') || this.checked))
        result.push({
          name: el.attr('name'),
          value: el.val()
        })
    })
    return result
  }

  $.fn.serialize = function () {
    var result = []
    this.serializeArray().forEach(function (elm) {
      result.push(encodeURIComponent(elm.name) + '=' + encodeURIComponent(elm.value))
    })
    return result.join('&')
  }

  $.fn.submit = function (callback) {
    if (callback) this.bind('submit', callback)
    else if (this.length) {
      var event = $.Event('submit')
      this.eq(0).trigger(event)
      if (!event.isDefaultPrevented()) this.get(0).submit()
    }
    return this
  }

})(Zepto)

; (function ($, undefined) {
  var prefix = '', eventPrefix, endEventName, endAnimationName,
    vendors = { Webkit: 'webkit', Moz: '', O: 'o' },
    document = window.document, testEl = document.createElement('div'),
    supportedTransforms = /^((translate|rotate|scale)(X|Y|Z|3d)?|matrix(3d)?|perspective|skew(X|Y)?)$/i,
    transform,
    transitionProperty, transitionDuration, transitionTiming, transitionDelay,
    animationName, animationDuration, animationTiming, animationDelay,
    cssReset = {}

  function dasherize(str) { return str.replace(/([a-z])([A-Z])/, '$1-$2').toLowerCase() }
  function normalizeEvent(name) { return eventPrefix ? eventPrefix + name : name.toLowerCase() }

  $.each(vendors, function (vendor, event) {
    if (testEl.style[vendor + 'TransitionProperty'] !== undefined) {
      prefix = '-' + vendor.toLowerCase() + '-'
      eventPrefix = event
      return false
    }
  })

  transform = prefix + 'transform'
  cssReset[transitionProperty = prefix + 'transition-property'] =
  cssReset[transitionDuration = prefix + 'transition-duration'] =
  cssReset[transitionDelay = prefix + 'transition-delay'] =
  cssReset[transitionTiming = prefix + 'transition-timing-function'] =
  cssReset[animationName = prefix + 'animation-name'] =
  cssReset[animationDuration = prefix + 'animation-duration'] =
  cssReset[animationDelay = prefix + 'animation-delay'] =
  cssReset[animationTiming = prefix + 'animation-timing-function'] = ''

  $.fx = {
    off: (eventPrefix === undefined && testEl.style.transitionProperty === undefined),
    speeds: { _default: 400, fast: 200, slow: 600 },
    cssPrefix: prefix,
    transitionEnd: normalizeEvent('TransitionEnd'),
    animationEnd: normalizeEvent('AnimationEnd')
  }

  $.fn.animate = function (properties, duration, ease, callback, delay) {
    if ($.isFunction(duration))
      callback = duration, ease = undefined, duration = undefined
    if ($.isFunction(ease))
      callback = ease, ease = undefined
    if ($.isPlainObject(duration))
      ease = duration.easing, callback = duration.complete, delay = duration.delay, duration = duration.duration
    if (duration) duration = (typeof duration == 'number' ? duration :
                    ($.fx.speeds[duration] || $.fx.speeds._default)) / 1000
    if (delay) delay = parseFloat(delay) / 1000
    return this.anim(properties, duration, ease, callback, delay)
  }

  $.fn.anim = function (properties, duration, ease, callback, delay) {
    var key, cssValues = {}, cssProperties, transforms = '',
        that = this, wrappedCallback, endEvent = $.fx.transitionEnd,
        fired = false

    if (duration === undefined) duration = $.fx.speeds._default / 1000
    if (delay === undefined) delay = 0
    if ($.fx.off) duration = 0

    if (typeof properties == 'string') {
      // keyframe animation
      cssValues[animationName] = properties
      cssValues[animationDuration] = duration + 's'
      cssValues[animationDelay] = delay + 's'
      cssValues[animationTiming] = (ease || 'linear')
      endEvent = $.fx.animationEnd
    } else {
      cssProperties = []
      // CSS transitions
      for (key in properties)
        if (supportedTransforms.test(key)) transforms += key + '(' + properties[key] + ') '
        else cssValues[key] = properties[key], cssProperties.push(dasherize(key))

      if (transforms) cssValues[transform] = transforms, cssProperties.push(transform)
      if (duration > 0 && typeof properties === 'object') {
        cssValues[transitionProperty] = cssProperties.join(', ')
        cssValues[transitionDuration] = duration + 's'
        cssValues[transitionDelay] = delay + 's'
        cssValues[transitionTiming] = (ease || 'linear')
      }
    }

    wrappedCallback = function (event) {
      if (typeof event !== 'undefined') {
        if (event.target !== event.currentTarget) return // makes sure the event didn't bubble from "below"
        $(event.target).unbind(endEvent, wrappedCallback)
      } else
        $(this).unbind(endEvent, wrappedCallback) // triggered by setTimeout

      fired = true
      $(this).css(cssReset)
      callback && callback.call(this)
    }
    if (duration > 0) {
      this.bind(endEvent, wrappedCallback)
      // transitionEnd is not always firing on older Android phones
      // so make sure it gets fired
      setTimeout(function () {
        if (fired) return
        wrappedCallback.call(that)
      }, (duration * 1000) + 25)
    }

    // trigger page reflow so new elements can animate
    this.size() && this.get(0).clientLeft

    this.css(cssValues)

    if (duration <= 0) setTimeout(function () {
      that.each(function () { wrappedCallback.call(this) })
    }, 0)

    return this
  }

  testEl = null
})(Zepto)
;//     Underscore.js 1.8.3
//     http://underscorejs.org
//     (c) 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
//     Underscore may be freely distributed under the MIT license.

(function() {

  // Baseline setup
  // --------------

  // Establish the root object, `window` in the browser, or `exports` on the server.
  var root = this;

  // Save the previous value of the `_` variable.
  var previousUnderscore = root._;

  // Save bytes in the minified (but not gzipped) version:
  var ArrayProto = Array.prototype, ObjProto = Object.prototype, FuncProto = Function.prototype;

  // Create quick reference variables for speed access to core prototypes.
  var
    push             = ArrayProto.push,
    slice            = ArrayProto.slice,
    toString         = ObjProto.toString,
    hasOwnProperty   = ObjProto.hasOwnProperty;

  // All **ECMAScript 5** native function implementations that we hope to use
  // are declared here.
  var
    nativeIsArray      = Array.isArray,
    nativeKeys         = Object.keys,
    nativeBind         = FuncProto.bind,
    nativeCreate       = Object.create;

  // Naked function reference for surrogate-prototype-swapping.
  var Ctor = function(){};

  // Create a safe reference to the Underscore object for use below.
  var _ = function(obj) {
    if (obj instanceof _) return obj;
    if (!(this instanceof _)) return new _(obj);
    this._wrapped = obj;
  };

  // Export the Underscore object for **Node.js**, with
  // backwards-compatibility for the old `require()` API. If we're in
  // the browser, add `_` as a global object.
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = _;
    }
    exports._ = _;
  } else {
    root._ = _;
  }

  // Current version.
  _.VERSION = '1.8.3';

  // Internal function that returns an efficient (for current engines) version
  // of the passed-in callback, to be repeatedly applied in other Underscore
  // functions.
  var optimizeCb = function(func, context, argCount) {
    if (context === void 0) return func;
    switch (argCount == null ? 3 : argCount) {
      case 1: return function(value) {
        return func.call(context, value);
      };
      case 2: return function(value, other) {
        return func.call(context, value, other);
      };
      case 3: return function(value, index, collection) {
        return func.call(context, value, index, collection);
      };
      case 4: return function(accumulator, value, index, collection) {
        return func.call(context, accumulator, value, index, collection);
      };
    }
    return function() {
      return func.apply(context, arguments);
    };
  };

  // A mostly-internal function to generate callbacks that can be applied
  // to each element in a collection, returning the desired result — either
  // identity, an arbitrary callback, a property matcher, or a property accessor.
  var cb = function(value, context, argCount) {
    if (value == null) return _.identity;
    if (_.isFunction(value)) return optimizeCb(value, context, argCount);
    if (_.isObject(value)) return _.matcher(value);
    return _.property(value);
  };
  _.iteratee = function(value, context) {
    return cb(value, context, Infinity);
  };

  // An internal function for creating assigner functions.
  var createAssigner = function(keysFunc, undefinedOnly) {
    return function(obj) {
      var length = arguments.length;
      if (length < 2 || obj == null) return obj;
      for (var index = 1; index < length; index++) {
        var source = arguments[index],
            keys = keysFunc(source),
            l = keys.length;
        for (var i = 0; i < l; i++) {
          var key = keys[i];
          if (!undefinedOnly || obj[key] === void 0) obj[key] = source[key];
        }
      }
      return obj;
    };
  };

  // An internal function for creating a new object that inherits from another.
  var baseCreate = function(prototype) {
    if (!_.isObject(prototype)) return {};
    if (nativeCreate) return nativeCreate(prototype);
    Ctor.prototype = prototype;
    var result = new Ctor;
    Ctor.prototype = null;
    return result;
  };

  var property = function(key) {
    return function(obj) {
      return obj == null ? void 0 : obj[key];
    };
  };

  // Helper for collection methods to determine whether a collection
  // should be iterated as an array or as an object
  // Related: http://people.mozilla.org/~jorendorff/es6-draft.html#sec-tolength
  // Avoids a very nasty iOS 8 JIT bug on ARM-64. #2094
  var MAX_ARRAY_INDEX = Math.pow(2, 53) - 1;
  var getLength = property('length');
  var isArrayLike = function(collection) {
    var length = getLength(collection);
    return typeof length == 'number' && length >= 0 && length <= MAX_ARRAY_INDEX;
  };

  // Collection Functions
  // --------------------

  // The cornerstone, an `each` implementation, aka `forEach`.
  // Handles raw objects in addition to array-likes. Treats all
  // sparse array-likes as if they were dense.
  _.each = _.forEach = function(obj, iteratee, context) {
    iteratee = optimizeCb(iteratee, context);
    var i, length;
    if (isArrayLike(obj)) {
      for (i = 0, length = obj.length; i < length; i++) {
        iteratee(obj[i], i, obj);
      }
    } else {
      var keys = _.keys(obj);
      for (i = 0, length = keys.length; i < length; i++) {
        iteratee(obj[keys[i]], keys[i], obj);
      }
    }
    return obj;
  };

  // Return the results of applying the iteratee to each element.
  _.map = _.collect = function(obj, iteratee, context) {
    iteratee = cb(iteratee, context);
    var keys = !isArrayLike(obj) && _.keys(obj),
        length = (keys || obj).length,
        results = Array(length);
    for (var index = 0; index < length; index++) {
      var currentKey = keys ? keys[index] : index;
      results[index] = iteratee(obj[currentKey], currentKey, obj);
    }
    return results;
  };

  // Create a reducing function iterating left or right.
  function createReduce(dir) {
    // Optimized iterator function as using arguments.length
    // in the main function will deoptimize the, see #1991.
    function iterator(obj, iteratee, memo, keys, index, length) {
      for (; index >= 0 && index < length; index += dir) {
        var currentKey = keys ? keys[index] : index;
        memo = iteratee(memo, obj[currentKey], currentKey, obj);
      }
      return memo;
    }

    return function(obj, iteratee, memo, context) {
      iteratee = optimizeCb(iteratee, context, 4);
      var keys = !isArrayLike(obj) && _.keys(obj),
          length = (keys || obj).length,
          index = dir > 0 ? 0 : length - 1;
      // Determine the initial value if none is provided.
      if (arguments.length < 3) {
        memo = obj[keys ? keys[index] : index];
        index += dir;
      }
      return iterator(obj, iteratee, memo, keys, index, length);
    };
  }

  // **Reduce** builds up a single result from a list of values, aka `inject`,
  // or `foldl`.
  _.reduce = _.foldl = _.inject = createReduce(1);

  // The right-associative version of reduce, also known as `foldr`.
  _.reduceRight = _.foldr = createReduce(-1);

  // Return the first value which passes a truth test. Aliased as `detect`.
  _.find = _.detect = function(obj, predicate, context) {
    var key;
    if (isArrayLike(obj)) {
      key = _.findIndex(obj, predicate, context);
    } else {
      key = _.findKey(obj, predicate, context);
    }
    if (key !== void 0 && key !== -1) return obj[key];
  };

  // Return all the elements that pass a truth test.
  // Aliased as `select`.
  _.filter = _.select = function(obj, predicate, context) {
    var results = [];
    predicate = cb(predicate, context);
    _.each(obj, function(value, index, list) {
      if (predicate(value, index, list)) results.push(value);
    });
    return results;
  };

  // Return all the elements for which a truth test fails.
  _.reject = function(obj, predicate, context) {
    return _.filter(obj, _.negate(cb(predicate)), context);
  };

  // Determine whether all of the elements match a truth test.
  // Aliased as `all`.
  _.every = _.all = function(obj, predicate, context) {
    predicate = cb(predicate, context);
    var keys = !isArrayLike(obj) && _.keys(obj),
        length = (keys || obj).length;
    for (var index = 0; index < length; index++) {
      var currentKey = keys ? keys[index] : index;
      if (!predicate(obj[currentKey], currentKey, obj)) return false;
    }
    return true;
  };

  // Determine if at least one element in the object matches a truth test.
  // Aliased as `any`.
  _.some = _.any = function(obj, predicate, context) {
    predicate = cb(predicate, context);
    var keys = !isArrayLike(obj) && _.keys(obj),
        length = (keys || obj).length;
    for (var index = 0; index < length; index++) {
      var currentKey = keys ? keys[index] : index;
      if (predicate(obj[currentKey], currentKey, obj)) return true;
    }
    return false;
  };

  // Determine if the array or object contains a given item (using `===`).
  // Aliased as `includes` and `include`.
  _.contains = _.includes = _.include = function(obj, item, fromIndex, guard) {
    if (!isArrayLike(obj)) obj = _.values(obj);
    if (typeof fromIndex != 'number' || guard) fromIndex = 0;
    return _.indexOf(obj, item, fromIndex) >= 0;
  };

  // Invoke a method (with arguments) on every item in a collection.
  _.invoke = function(obj, method) {
    var args = slice.call(arguments, 2);
    var isFunc = _.isFunction(method);
    return _.map(obj, function(value) {
      var func = isFunc ? method : value[method];
      return func == null ? func : func.apply(value, args);
    });
  };

  // Convenience version of a common use case of `map`: fetching a property.
  _.pluck = function(obj, key) {
    return _.map(obj, _.property(key));
  };

  // Convenience version of a common use case of `filter`: selecting only objects
  // containing specific `key:value` pairs.
  _.where = function(obj, attrs) {
    return _.filter(obj, _.matcher(attrs));
  };

  // Convenience version of a common use case of `find`: getting the first object
  // containing specific `key:value` pairs.
  _.findWhere = function(obj, attrs) {
    return _.find(obj, _.matcher(attrs));
  };

  // Return the maximum element (or element-based computation).
  _.max = function(obj, iteratee, context) {
    var result = -Infinity, lastComputed = -Infinity,
        value, computed;
    if (iteratee == null && obj != null) {
      obj = isArrayLike(obj) ? obj : _.values(obj);
      for (var i = 0, length = obj.length; i < length; i++) {
        value = obj[i];
        if (value > result) {
          result = value;
        }
      }
    } else {
      iteratee = cb(iteratee, context);
      _.each(obj, function(value, index, list) {
        computed = iteratee(value, index, list);
        if (computed > lastComputed || computed === -Infinity && result === -Infinity) {
          result = value;
          lastComputed = computed;
        }
      });
    }
    return result;
  };

  // Return the minimum element (or element-based computation).
  _.min = function(obj, iteratee, context) {
    var result = Infinity, lastComputed = Infinity,
        value, computed;
    if (iteratee == null && obj != null) {
      obj = isArrayLike(obj) ? obj : _.values(obj);
      for (var i = 0, length = obj.length; i < length; i++) {
        value = obj[i];
        if (value < result) {
          result = value;
        }
      }
    } else {
      iteratee = cb(iteratee, context);
      _.each(obj, function(value, index, list) {
        computed = iteratee(value, index, list);
        if (computed < lastComputed || computed === Infinity && result === Infinity) {
          result = value;
          lastComputed = computed;
        }
      });
    }
    return result;
  };

  // Shuffle a collection, using the modern version of the
  // [Fisher-Yates shuffle](http://en.wikipedia.org/wiki/Fisher–Yates_shuffle).
  _.shuffle = function(obj) {
    var set = isArrayLike(obj) ? obj : _.values(obj);
    var length = set.length;
    var shuffled = Array(length);
    for (var index = 0, rand; index < length; index++) {
      rand = _.random(0, index);
      if (rand !== index) shuffled[index] = shuffled[rand];
      shuffled[rand] = set[index];
    }
    return shuffled;
  };

  // Sample **n** random values from a collection.
  // If **n** is not specified, returns a single random element.
  // The internal `guard` argument allows it to work with `map`.
  _.sample = function(obj, n, guard) {
    if (n == null || guard) {
      if (!isArrayLike(obj)) obj = _.values(obj);
      return obj[_.random(obj.length - 1)];
    }
    return _.shuffle(obj).slice(0, Math.max(0, n));
  };

  // Sort the object's values by a criterion produced by an iteratee.
  _.sortBy = function(obj, iteratee, context) {
    iteratee = cb(iteratee, context);
    return _.pluck(_.map(obj, function(value, index, list) {
      return {
        value: value,
        index: index,
        criteria: iteratee(value, index, list)
      };
    }).sort(function(left, right) {
      var a = left.criteria;
      var b = right.criteria;
      if (a !== b) {
        if (a > b || a === void 0) return 1;
        if (a < b || b === void 0) return -1;
      }
      return left.index - right.index;
    }), 'value');
  };

  // An internal function used for aggregate "group by" operations.
  var group = function(behavior) {
    return function(obj, iteratee, context) {
      var result = {};
      iteratee = cb(iteratee, context);
      _.each(obj, function(value, index) {
        var key = iteratee(value, index, obj);
        behavior(result, value, key);
      });
      return result;
    };
  };

  // Groups the object's values by a criterion. Pass either a string attribute
  // to group by, or a function that returns the criterion.
  _.groupBy = group(function(result, value, key) {
    if (_.has(result, key)) result[key].push(value); else result[key] = [value];
  });

  // Indexes the object's values by a criterion, similar to `groupBy`, but for
  // when you know that your index values will be unique.
  _.indexBy = group(function(result, value, key) {
    result[key] = value;
  });

  // Counts instances of an object that group by a certain criterion. Pass
  // either a string attribute to count by, or a function that returns the
  // criterion.
  _.countBy = group(function(result, value, key) {
    if (_.has(result, key)) result[key]++; else result[key] = 1;
  });

  // Safely create a real, live array from anything iterable.
  _.toArray = function(obj) {
    if (!obj) return [];
    if (_.isArray(obj)) return slice.call(obj);
    if (isArrayLike(obj)) return _.map(obj, _.identity);
    return _.values(obj);
  };

  // Return the number of elements in an object.
  _.size = function(obj) {
    if (obj == null) return 0;
    return isArrayLike(obj) ? obj.length : _.keys(obj).length;
  };

  // Split a collection into two arrays: one whose elements all satisfy the given
  // predicate, and one whose elements all do not satisfy the predicate.
  _.partition = function(obj, predicate, context) {
    predicate = cb(predicate, context);
    var pass = [], fail = [];
    _.each(obj, function(value, key, obj) {
      (predicate(value, key, obj) ? pass : fail).push(value);
    });
    return [pass, fail];
  };

  // Array Functions
  // ---------------

  // Get the first element of an array. Passing **n** will return the first N
  // values in the array. Aliased as `head` and `take`. The **guard** check
  // allows it to work with `_.map`.
  _.first = _.head = _.take = function(array, n, guard) {
    if (array == null) return void 0;
    if (n == null || guard) return array[0];
    return _.initial(array, array.length - n);
  };

  // Returns everything but the last entry of the array. Especially useful on
  // the arguments object. Passing **n** will return all the values in
  // the array, excluding the last N.
  _.initial = function(array, n, guard) {
    return slice.call(array, 0, Math.max(0, array.length - (n == null || guard ? 1 : n)));
  };

  // Get the last element of an array. Passing **n** will return the last N
  // values in the array.
  _.last = function(array, n, guard) {
    if (array == null) return void 0;
    if (n == null || guard) return array[array.length - 1];
    return _.rest(array, Math.max(0, array.length - n));
  };

  // Returns everything but the first entry of the array. Aliased as `tail` and `drop`.
  // Especially useful on the arguments object. Passing an **n** will return
  // the rest N values in the array.
  _.rest = _.tail = _.drop = function(array, n, guard) {
    return slice.call(array, n == null || guard ? 1 : n);
  };

  // Trim out all falsy values from an array.
  _.compact = function(array) {
    return _.filter(array, _.identity);
  };

  // Internal implementation of a recursive `flatten` function.
  var flatten = function(input, shallow, strict, startIndex) {
    var output = [], idx = 0;
    for (var i = startIndex || 0, length = getLength(input); i < length; i++) {
      var value = input[i];
      if (isArrayLike(value) && (_.isArray(value) || _.isArguments(value))) {
        //flatten current level of array or arguments object
        if (!shallow) value = flatten(value, shallow, strict);
        var j = 0, len = value.length;
        output.length += len;
        while (j < len) {
          output[idx++] = value[j++];
        }
      } else if (!strict) {
        output[idx++] = value;
      }
    }
    return output;
  };

  // Flatten out an array, either recursively (by default), or just one level.
  _.flatten = function(array, shallow) {
    return flatten(array, shallow, false);
  };

  // Return a version of the array that does not contain the specified value(s).
  _.without = function(array) {
    return _.difference(array, slice.call(arguments, 1));
  };

  // Produce a duplicate-free version of the array. If the array has already
  // been sorted, you have the option of using a faster algorithm.
  // Aliased as `unique`.
  _.uniq = _.unique = function(array, isSorted, iteratee, context) {
    if (!_.isBoolean(isSorted)) {
      context = iteratee;
      iteratee = isSorted;
      isSorted = false;
    }
    if (iteratee != null) iteratee = cb(iteratee, context);
    var result = [];
    var seen = [];
    for (var i = 0, length = getLength(array); i < length; i++) {
      var value = array[i],
          computed = iteratee ? iteratee(value, i, array) : value;
      if (isSorted) {
        if (!i || seen !== computed) result.push(value);
        seen = computed;
      } else if (iteratee) {
        if (!_.contains(seen, computed)) {
          seen.push(computed);
          result.push(value);
        }
      } else if (!_.contains(result, value)) {
        result.push(value);
      }
    }
    return result;
  };

  // Produce an array that contains the union: each distinct element from all of
  // the passed-in arrays.
  _.union = function() {
    return _.uniq(flatten(arguments, true, true));
  };

  // Produce an array that contains every item shared between all the
  // passed-in arrays.
  _.intersection = function(array) {
    var result = [];
    var argsLength = arguments.length;
    for (var i = 0, length = getLength(array); i < length; i++) {
      var item = array[i];
      if (_.contains(result, item)) continue;
      for (var j = 1; j < argsLength; j++) {
        if (!_.contains(arguments[j], item)) break;
      }
      if (j === argsLength) result.push(item);
    }
    return result;
  };

  // Take the difference between one array and a number of other arrays.
  // Only the elements present in just the first array will remain.
  _.difference = function(array) {
    var rest = flatten(arguments, true, true, 1);
    return _.filter(array, function(value){
      return !_.contains(rest, value);
    });
  };

  // Zip together multiple lists into a single array -- elements that share
  // an index go together.
  _.zip = function() {
    return _.unzip(arguments);
  };

  // Complement of _.zip. Unzip accepts an array of arrays and groups
  // each array's elements on shared indices
  _.unzip = function(array) {
    var length = array && _.max(array, getLength).length || 0;
    var result = Array(length);

    for (var index = 0; index < length; index++) {
      result[index] = _.pluck(array, index);
    }
    return result;
  };

  // Converts lists into objects. Pass either a single array of `[key, value]`
  // pairs, or two parallel arrays of the same length -- one of keys, and one of
  // the corresponding values.
  _.object = function(list, values) {
    var result = {};
    for (var i = 0, length = getLength(list); i < length; i++) {
      if (values) {
        result[list[i]] = values[i];
      } else {
        result[list[i][0]] = list[i][1];
      }
    }
    return result;
  };

  // Generator function to create the findIndex and findLastIndex functions
  function createPredicateIndexFinder(dir) {
    return function(array, predicate, context) {
      predicate = cb(predicate, context);
      var length = getLength(array);
      var index = dir > 0 ? 0 : length - 1;
      for (; index >= 0 && index < length; index += dir) {
        if (predicate(array[index], index, array)) return index;
      }
      return -1;
    };
  }

  // Returns the first index on an array-like that passes a predicate test
  _.findIndex = createPredicateIndexFinder(1);
  _.findLastIndex = createPredicateIndexFinder(-1);

  // Use a comparator function to figure out the smallest index at which
  // an object should be inserted so as to maintain order. Uses binary search.
  _.sortedIndex = function(array, obj, iteratee, context) {
    iteratee = cb(iteratee, context, 1);
    var value = iteratee(obj);
    var low = 0, high = getLength(array);
    while (low < high) {
      var mid = Math.floor((low + high) / 2);
      if (iteratee(array[mid]) < value) low = mid + 1; else high = mid;
    }
    return low;
  };

  // Generator function to create the indexOf and lastIndexOf functions
  function createIndexFinder(dir, predicateFind, sortedIndex) {
    return function(array, item, idx) {
      var i = 0, length = getLength(array);
      if (typeof idx == 'number') {
        if (dir > 0) {
            i = idx >= 0 ? idx : Math.max(idx + length, i);
        } else {
            length = idx >= 0 ? Math.min(idx + 1, length) : idx + length + 1;
        }
      } else if (sortedIndex && idx && length) {
        idx = sortedIndex(array, item);
        return array[idx] === item ? idx : -1;
      }
      if (item !== item) {
        idx = predicateFind(slice.call(array, i, length), _.isNaN);
        return idx >= 0 ? idx + i : -1;
      }
      for (idx = dir > 0 ? i : length - 1; idx >= 0 && idx < length; idx += dir) {
        if (array[idx] === item) return idx;
      }
      return -1;
    };
  }

  // Return the position of the first occurrence of an item in an array,
  // or -1 if the item is not included in the array.
  // If the array is large and already in sort order, pass `true`
  // for **isSorted** to use binary search.
  _.indexOf = createIndexFinder(1, _.findIndex, _.sortedIndex);
  _.lastIndexOf = createIndexFinder(-1, _.findLastIndex);

  // Generate an integer Array containing an arithmetic progression. A port of
  // the native Python `range()` function. See
  // [the Python documentation](http://docs.python.org/library/functions.html#range).
  _.range = function(start, stop, step) {
    if (stop == null) {
      stop = start || 0;
      start = 0;
    }
    step = step || 1;

    var length = Math.max(Math.ceil((stop - start) / step), 0);
    var range = Array(length);

    for (var idx = 0; idx < length; idx++, start += step) {
      range[idx] = start;
    }

    return range;
  };

  // Function (ahem) Functions
  // ------------------

  // Determines whether to execute a function as a constructor
  // or a normal function with the provided arguments
  var executeBound = function(sourceFunc, boundFunc, context, callingContext, args) {
    if (!(callingContext instanceof boundFunc)) return sourceFunc.apply(context, args);
    var self = baseCreate(sourceFunc.prototype);
    var result = sourceFunc.apply(self, args);
    if (_.isObject(result)) return result;
    return self;
  };

  // Create a function bound to a given object (assigning `this`, and arguments,
  // optionally). Delegates to **ECMAScript 5**'s native `Function.bind` if
  // available.
  _.bind = function(func, context) {
    if (nativeBind && func.bind === nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
    if (!_.isFunction(func)) throw new TypeError('Bind must be called on a function');
    var args = slice.call(arguments, 2);
    var bound = function() {
      return executeBound(func, bound, context, this, args.concat(slice.call(arguments)));
    };
    return bound;
  };

  // Partially apply a function by creating a version that has had some of its
  // arguments pre-filled, without changing its dynamic `this` context. _ acts
  // as a placeholder, allowing any combination of arguments to be pre-filled.
  _.partial = function(func) {
    var boundArgs = slice.call(arguments, 1);
    var bound = function() {
      var position = 0, length = boundArgs.length;
      var args = Array(length);
      for (var i = 0; i < length; i++) {
        args[i] = boundArgs[i] === _ ? arguments[position++] : boundArgs[i];
      }
      while (position < arguments.length) args.push(arguments[position++]);
      return executeBound(func, bound, this, this, args);
    };
    return bound;
  };

  // Bind a number of an object's methods to that object. Remaining arguments
  // are the method names to be bound. Useful for ensuring that all callbacks
  // defined on an object belong to it.
  _.bindAll = function(obj) {
    var i, length = arguments.length, key;
    if (length <= 1) throw new Error('bindAll must be passed function names');
    for (i = 1; i < length; i++) {
      key = arguments[i];
      obj[key] = _.bind(obj[key], obj);
    }
    return obj;
  };

  // Memoize an expensive function by storing its results.
  _.memoize = function(func, hasher) {
    var memoize = function(key) {
      var cache = memoize.cache;
      var address = '' + (hasher ? hasher.apply(this, arguments) : key);
      if (!_.has(cache, address)) cache[address] = func.apply(this, arguments);
      return cache[address];
    };
    memoize.cache = {};
    return memoize;
  };

  // Delays a function for the given number of milliseconds, and then calls
  // it with the arguments supplied.
  _.delay = function(func, wait) {
    var args = slice.call(arguments, 2);
    return setTimeout(function(){
      return func.apply(null, args);
    }, wait);
  };

  // Defers a function, scheduling it to run after the current call stack has
  // cleared.
  _.defer = _.partial(_.delay, _, 1);

  // Returns a function, that, when invoked, will only be triggered at most once
  // during a given window of time. Normally, the throttled function will run
  // as much as it can, without ever going more than once per `wait` duration;
  // but if you'd like to disable the execution on the leading edge, pass
  // `{leading: false}`. To disable execution on the trailing edge, ditto.
  _.throttle = function(func, wait, options) {
    var context, args, result;
    var timeout = null;
    var previous = 0;
    if (!options) options = {};
    var later = function() {
      previous = options.leading === false ? 0 : _.now();
      timeout = null;
      result = func.apply(context, args);
      if (!timeout) context = args = null;
    };
    return function() {
      var now = _.now();
      if (!previous && options.leading === false) previous = now;
      var remaining = wait - (now - previous);
      context = this;
      args = arguments;
      if (remaining <= 0 || remaining > wait) {
        if (timeout) {
          clearTimeout(timeout);
          timeout = null;
        }
        previous = now;
        result = func.apply(context, args);
        if (!timeout) context = args = null;
      } else if (!timeout && options.trailing !== false) {
        timeout = setTimeout(later, remaining);
      }
      return result;
    };
  };

  // Returns a function, that, as long as it continues to be invoked, will not
  // be triggered. The function will be called after it stops being called for
  // N milliseconds. If `immediate` is passed, trigger the function on the
  // leading edge, instead of the trailing.
  _.debounce = function(func, wait, immediate) {
    var timeout, args, context, timestamp, result;

    var later = function() {
      var last = _.now() - timestamp;

      if (last < wait && last >= 0) {
        timeout = setTimeout(later, wait - last);
      } else {
        timeout = null;
        if (!immediate) {
          result = func.apply(context, args);
          if (!timeout) context = args = null;
        }
      }
    };

    return function() {
      context = this;
      args = arguments;
      timestamp = _.now();
      var callNow = immediate && !timeout;
      if (!timeout) timeout = setTimeout(later, wait);
      if (callNow) {
        result = func.apply(context, args);
        context = args = null;
      }

      return result;
    };
  };

  // Returns the first function passed as an argument to the second,
  // allowing you to adjust arguments, run code before and after, and
  // conditionally execute the original function.
  _.wrap = function(func, wrapper) {
    return _.partial(wrapper, func);
  };

  // Returns a negated version of the passed-in predicate.
  _.negate = function(predicate) {
    return function() {
      return !predicate.apply(this, arguments);
    };
  };

  // Returns a function that is the composition of a list of functions, each
  // consuming the return value of the function that follows.
  _.compose = function() {
    var args = arguments;
    var start = args.length - 1;
    return function() {
      var i = start;
      var result = args[start].apply(this, arguments);
      while (i--) result = args[i].call(this, result);
      return result;
    };
  };

  // Returns a function that will only be executed on and after the Nth call.
  _.after = function(times, func) {
    return function() {
      if (--times < 1) {
        return func.apply(this, arguments);
      }
    };
  };

  // Returns a function that will only be executed up to (but not including) the Nth call.
  _.before = function(times, func) {
    var memo;
    return function() {
      if (--times > 0) {
        memo = func.apply(this, arguments);
      }
      if (times <= 1) func = null;
      return memo;
    };
  };

  // Returns a function that will be executed at most one time, no matter how
  // often you call it. Useful for lazy initialization.
  _.once = _.partial(_.before, 2);

  // Object Functions
  // ----------------

  // Keys in IE < 9 that won't be iterated by `for key in ...` and thus missed.
  var hasEnumBug = !{toString: null}.propertyIsEnumerable('toString');
  var nonEnumerableProps = ['valueOf', 'isPrototypeOf', 'toString',
                      'propertyIsEnumerable', 'hasOwnProperty', 'toLocaleString'];

  function collectNonEnumProps(obj, keys) {
    var nonEnumIdx = nonEnumerableProps.length;
    var constructor = obj.constructor;
    var proto = (_.isFunction(constructor) && constructor.prototype) || ObjProto;

    // Constructor is a special case.
    var prop = 'constructor';
    if (_.has(obj, prop) && !_.contains(keys, prop)) keys.push(prop);

    while (nonEnumIdx--) {
      prop = nonEnumerableProps[nonEnumIdx];
      if (prop in obj && obj[prop] !== proto[prop] && !_.contains(keys, prop)) {
        keys.push(prop);
      }
    }
  }

  // Retrieve the names of an object's own properties.
  // Delegates to **ECMAScript 5**'s native `Object.keys`
  _.keys = function(obj) {
    if (!_.isObject(obj)) return [];
    if (nativeKeys) return nativeKeys(obj);
    var keys = [];
    for (var key in obj) if (_.has(obj, key)) keys.push(key);
    // Ahem, IE < 9.
    if (hasEnumBug) collectNonEnumProps(obj, keys);
    return keys;
  };

  // Retrieve all the property names of an object.
  _.allKeys = function(obj) {
    if (!_.isObject(obj)) return [];
    var keys = [];
    for (var key in obj) keys.push(key);
    // Ahem, IE < 9.
    if (hasEnumBug) collectNonEnumProps(obj, keys);
    return keys;
  };

  // Retrieve the values of an object's properties.
  _.values = function(obj) {
    var keys = _.keys(obj);
    var length = keys.length;
    var values = Array(length);
    for (var i = 0; i < length; i++) {
      values[i] = obj[keys[i]];
    }
    return values;
  };

  // Returns the results of applying the iteratee to each element of the object
  // In contrast to _.map it returns an object
  _.mapObject = function(obj, iteratee, context) {
    iteratee = cb(iteratee, context);
    var keys =  _.keys(obj),
          length = keys.length,
          results = {},
          currentKey;
      for (var index = 0; index < length; index++) {
        currentKey = keys[index];
        results[currentKey] = iteratee(obj[currentKey], currentKey, obj);
      }
      return results;
  };

  // Convert an object into a list of `[key, value]` pairs.
  _.pairs = function(obj) {
    var keys = _.keys(obj);
    var length = keys.length;
    var pairs = Array(length);
    for (var i = 0; i < length; i++) {
      pairs[i] = [keys[i], obj[keys[i]]];
    }
    return pairs;
  };

  // Invert the keys and values of an object. The values must be serializable.
  _.invert = function(obj) {
    var result = {};
    var keys = _.keys(obj);
    for (var i = 0, length = keys.length; i < length; i++) {
      result[obj[keys[i]]] = keys[i];
    }
    return result;
  };

  // Return a sorted list of the function names available on the object.
  // Aliased as `methods`
  _.functions = _.methods = function(obj) {
    var names = [];
    for (var key in obj) {
      if (_.isFunction(obj[key])) names.push(key);
    }
    return names.sort();
  };

  // Extend a given object with all the properties in passed-in object(s).
  _.extend = createAssigner(_.allKeys);

  // Assigns a given object with all the own properties in the passed-in object(s)
  // (https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object/assign)
  _.extendOwn = _.assign = createAssigner(_.keys);

  // Returns the first key on an object that passes a predicate test
  _.findKey = function(obj, predicate, context) {
    predicate = cb(predicate, context);
    var keys = _.keys(obj), key;
    for (var i = 0, length = keys.length; i < length; i++) {
      key = keys[i];
      if (predicate(obj[key], key, obj)) return key;
    }
  };

  // Return a copy of the object only containing the whitelisted properties.
  _.pick = function(object, oiteratee, context) {
    var result = {}, obj = object, iteratee, keys;
    if (obj == null) return result;
    if (_.isFunction(oiteratee)) {
      keys = _.allKeys(obj);
      iteratee = optimizeCb(oiteratee, context);
    } else {
      keys = flatten(arguments, false, false, 1);
      iteratee = function(value, key, obj) { return key in obj; };
      obj = Object(obj);
    }
    for (var i = 0, length = keys.length; i < length; i++) {
      var key = keys[i];
      var value = obj[key];
      if (iteratee(value, key, obj)) result[key] = value;
    }
    return result;
  };

   // Return a copy of the object without the blacklisted properties.
  _.omit = function(obj, iteratee, context) {
    if (_.isFunction(iteratee)) {
      iteratee = _.negate(iteratee);
    } else {
      var keys = _.map(flatten(arguments, false, false, 1), String);
      iteratee = function(value, key) {
        return !_.contains(keys, key);
      };
    }
    return _.pick(obj, iteratee, context);
  };

  // Fill in a given object with default properties.
  _.defaults = createAssigner(_.allKeys, true);

  // Creates an object that inherits from the given prototype object.
  // If additional properties are provided then they will be added to the
  // created object.
  _.create = function(prototype, props) {
    var result = baseCreate(prototype);
    if (props) _.extendOwn(result, props);
    return result;
  };

  // Create a (shallow-cloned) duplicate of an object.
  _.clone = function(obj) {
    if (!_.isObject(obj)) return obj;
    return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
  };

  // Invokes interceptor with the obj, and then returns obj.
  // The primary purpose of this method is to "tap into" a method chain, in
  // order to perform operations on intermediate results within the chain.
  _.tap = function(obj, interceptor) {
    interceptor(obj);
    return obj;
  };

  // Returns whether an object has a given set of `key:value` pairs.
  _.isMatch = function(object, attrs) {
    var keys = _.keys(attrs), length = keys.length;
    if (object == null) return !length;
    var obj = Object(object);
    for (var i = 0; i < length; i++) {
      var key = keys[i];
      if (attrs[key] !== obj[key] || !(key in obj)) return false;
    }
    return true;
  };


  // Internal recursive comparison function for `isEqual`.
  var eq = function(a, b, aStack, bStack) {
    // Identical objects are equal. `0 === -0`, but they aren't identical.
    // See the [Harmony `egal` proposal](http://wiki.ecmascript.org/doku.php?id=harmony:egal).
    if (a === b) return a !== 0 || 1 / a === 1 / b;
    // A strict comparison is necessary because `null == undefined`.
    if (a == null || b == null) return a === b;
    // Unwrap any wrapped objects.
    if (a instanceof _) a = a._wrapped;
    if (b instanceof _) b = b._wrapped;
    // Compare `[[Class]]` names.
    var className = toString.call(a);
    if (className !== toString.call(b)) return false;
    switch (className) {
      // Strings, numbers, regular expressions, dates, and booleans are compared by value.
      case '[object RegExp]':
      // RegExps are coerced to strings for comparison (Note: '' + /a/i === '/a/i')
      case '[object String]':
        // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
        // equivalent to `new String("5")`.
        return '' + a === '' + b;
      case '[object Number]':
        // `NaN`s are equivalent, but non-reflexive.
        // Object(NaN) is equivalent to NaN
        if (+a !== +a) return +b !== +b;
        // An `egal` comparison is performed for other numeric values.
        return +a === 0 ? 1 / +a === 1 / b : +a === +b;
      case '[object Date]':
      case '[object Boolean]':
        // Coerce dates and booleans to numeric primitive values. Dates are compared by their
        // millisecond representations. Note that invalid dates with millisecond representations
        // of `NaN` are not equivalent.
        return +a === +b;
    }

    var areArrays = className === '[object Array]';
    if (!areArrays) {
      if (typeof a != 'object' || typeof b != 'object') return false;

      // Objects with different constructors are not equivalent, but `Object`s or `Array`s
      // from different frames are.
      var aCtor = a.constructor, bCtor = b.constructor;
      if (aCtor !== bCtor && !(_.isFunction(aCtor) && aCtor instanceof aCtor &&
                               _.isFunction(bCtor) && bCtor instanceof bCtor)
                          && ('constructor' in a && 'constructor' in b)) {
        return false;
      }
    }
    // Assume equality for cyclic structures. The algorithm for detecting cyclic
    // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.

    // Initializing stack of traversed objects.
    // It's done here since we only need them for objects and arrays comparison.
    aStack = aStack || [];
    bStack = bStack || [];
    var length = aStack.length;
    while (length--) {
      // Linear search. Performance is inversely proportional to the number of
      // unique nested structures.
      if (aStack[length] === a) return bStack[length] === b;
    }

    // Add the first object to the stack of traversed objects.
    aStack.push(a);
    bStack.push(b);

    // Recursively compare objects and arrays.
    if (areArrays) {
      // Compare array lengths to determine if a deep comparison is necessary.
      length = a.length;
      if (length !== b.length) return false;
      // Deep compare the contents, ignoring non-numeric properties.
      while (length--) {
        if (!eq(a[length], b[length], aStack, bStack)) return false;
      }
    } else {
      // Deep compare objects.
      var keys = _.keys(a), key;
      length = keys.length;
      // Ensure that both objects contain the same number of properties before comparing deep equality.
      if (_.keys(b).length !== length) return false;
      while (length--) {
        // Deep compare each member
        key = keys[length];
        if (!(_.has(b, key) && eq(a[key], b[key], aStack, bStack))) return false;
      }
    }
    // Remove the first object from the stack of traversed objects.
    aStack.pop();
    bStack.pop();
    return true;
  };

  // Perform a deep comparison to check if two objects are equal.
  _.isEqual = function(a, b) {
    return eq(a, b);
  };

  // Is a given array, string, or object empty?
  // An "empty" object has no enumerable own-properties.
  _.isEmpty = function(obj) {
    if (obj == null) return true;
    if (isArrayLike(obj) && (_.isArray(obj) || _.isString(obj) || _.isArguments(obj))) return obj.length === 0;
    return _.keys(obj).length === 0;
  };

  // Is a given value a DOM element?
  _.isElement = function(obj) {
    return !!(obj && obj.nodeType === 1);
  };

  // Is a given value an array?
  // Delegates to ECMA5's native Array.isArray
  _.isArray = nativeIsArray || function(obj) {
    return toString.call(obj) === '[object Array]';
  };

  // Is a given variable an object?
  _.isObject = function(obj) {
    var type = typeof obj;
    return type === 'function' || type === 'object' && !!obj;
  };

  // Add some isType methods: isArguments, isFunction, isString, isNumber, isDate, isRegExp, isError.
  _.each(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp', 'Error'], function(name) {
    _['is' + name] = function(obj) {
      return toString.call(obj) === '[object ' + name + ']';
    };
  });

  // Define a fallback version of the method in browsers (ahem, IE < 9), where
  // there isn't any inspectable "Arguments" type.
  if (!_.isArguments(arguments)) {
    _.isArguments = function(obj) {
      return _.has(obj, 'callee');
    };
  }

  // Optimize `isFunction` if appropriate. Work around some typeof bugs in old v8,
  // IE 11 (#1621), and in Safari 8 (#1929).
  if (typeof /./ != 'function' && typeof Int8Array != 'object') {
    _.isFunction = function(obj) {
      return typeof obj == 'function' || false;
    };
  }

  // Is a given object a finite number?
  _.isFinite = function(obj) {
    return isFinite(obj) && !isNaN(parseFloat(obj));
  };

  // Is the given value `NaN`? (NaN is the only number which does not equal itself).
  _.isNaN = function(obj) {
    return _.isNumber(obj) && obj !== +obj;
  };

  // Is a given value a boolean?
  _.isBoolean = function(obj) {
    return obj === true || obj === false || toString.call(obj) === '[object Boolean]';
  };

  // Is a given value equal to null?
  _.isNull = function(obj) {
    return obj === null;
  };

  // Is a given variable undefined?
  _.isUndefined = function(obj) {
    return obj === void 0;
  };

  // Shortcut function for checking if an object has a given property directly
  // on itself (in other words, not on a prototype).
  _.has = function(obj, key) {
    return obj != null && hasOwnProperty.call(obj, key);
  };

  // Utility Functions
  // -----------------

  // Run Underscore.js in *noConflict* mode, returning the `_` variable to its
  // previous owner. Returns a reference to the Underscore object.
  _.noConflict = function() {
    root._ = previousUnderscore;
    return this;
  };

  // Keep the identity function around for default iteratees.
  _.identity = function(value) {
    return value;
  };

  // Predicate-generating functions. Often useful outside of Underscore.
  _.constant = function(value) {
    return function() {
      return value;
    };
  };

  _.noop = function(){};

  _.property = property;

  // Generates a function for a given object that returns a given property.
  _.propertyOf = function(obj) {
    return obj == null ? function(){} : function(key) {
      return obj[key];
    };
  };

  // Returns a predicate for checking whether an object has a given set of
  // `key:value` pairs.
  _.matcher = _.matches = function(attrs) {
    attrs = _.extendOwn({}, attrs);
    return function(obj) {
      return _.isMatch(obj, attrs);
    };
  };

  // Run a function **n** times.
  _.times = function(n, iteratee, context) {
    var accum = Array(Math.max(0, n));
    iteratee = optimizeCb(iteratee, context, 1);
    for (var i = 0; i < n; i++) accum[i] = iteratee(i);
    return accum;
  };

  // Return a random integer between min and max (inclusive).
  _.random = function(min, max) {
    if (max == null) {
      max = min;
      min = 0;
    }
    return min + Math.floor(Math.random() * (max - min + 1));
  };

  // A (possibly faster) way to get the current timestamp as an integer.
  _.now = Date.now || function() {
    return new Date().getTime();
  };

   // List of HTML entities for escaping.
  var escapeMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '`': '&#x60;'
  };
  var unescapeMap = _.invert(escapeMap);

  // Functions for escaping and unescaping strings to/from HTML interpolation.
  var createEscaper = function(map) {
    var escaper = function(match) {
      return map[match];
    };
    // Regexes for identifying a key that needs to be escaped
    var source = '(?:' + _.keys(map).join('|') + ')';
    var testRegexp = RegExp(source);
    var replaceRegexp = RegExp(source, 'g');
    return function(string) {
      string = string == null ? '' : '' + string;
      return testRegexp.test(string) ? string.replace(replaceRegexp, escaper) : string;
    };
  };
  _.escape = createEscaper(escapeMap);
  _.unescape = createEscaper(unescapeMap);

  // If the value of the named `property` is a function then invoke it with the
  // `object` as context; otherwise, return it.
  _.result = function(object, property, fallback) {
    var value = object == null ? void 0 : object[property];
    if (value === void 0) {
      value = fallback;
    }
    return _.isFunction(value) ? value.call(object) : value;
  };

  // Generate a unique integer id (unique within the entire client session).
  // Useful for temporary DOM ids.
  var idCounter = 0;
  _.uniqueId = function(prefix) {
    var id = ++idCounter + '';
    return prefix ? prefix + id : id;
  };

  // By default, Underscore uses ERB-style template delimiters, change the
  // following template settings to use alternative delimiters.
  _.templateSettings = {
    evaluate    : /<%([\s\S]+?)%>/g,
    interpolate : /<%=([\s\S]+?)%>/g,
    escape      : /<%-([\s\S]+?)%>/g
  };

  // When customizing `templateSettings`, if you don't want to define an
  // interpolation, evaluation or escaping regex, we need one that is
  // guaranteed not to match.
  var noMatch = /(.)^/;

  // Certain characters need to be escaped so that they can be put into a
  // string literal.
  var escapes = {
    "'":      "'",
    '\\':     '\\',
    '\r':     'r',
    '\n':     'n',
    '\u2028': 'u2028',
    '\u2029': 'u2029'
  };

  var escaper = /\\|'|\r|\n|\u2028|\u2029/g;

  var escapeChar = function(match) {
    return '\\' + escapes[match];
  };

  // JavaScript micro-templating, similar to John Resig's implementation.
  // Underscore templating handles arbitrary delimiters, preserves whitespace,
  // and correctly escapes quotes within interpolated code.
  // NB: `oldSettings` only exists for backwards compatibility.
  _.template = function(text, settings, oldSettings) {
    if (!settings && oldSettings) settings = oldSettings;
    settings = _.defaults({}, settings, _.templateSettings);

    // Combine delimiters into one regular expression via alternation.
    var matcher = RegExp([
      (settings.escape || noMatch).source,
      (settings.interpolate || noMatch).source,
      (settings.evaluate || noMatch).source
    ].join('|') + '|$', 'g');

    // Compile the template source, escaping string literals appropriately.
    var index = 0;
    var source = "__p+='";
    text.replace(matcher, function(match, escape, interpolate, evaluate, offset) {
      source += text.slice(index, offset).replace(escaper, escapeChar);
      index = offset + match.length;

      if (escape) {
        source += "'+\n((__t=(" + escape + "))==null?'':_.escape(__t))+\n'";
      } else if (interpolate) {
        source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'";
      } else if (evaluate) {
        source += "';\n" + evaluate + "\n__p+='";
      }

      // Adobe VMs need the match returned to produce the correct offest.
      return match;
    });
    source += "';\n";

    // If a variable is not specified, place data values in local scope.
    if (!settings.variable) source = 'with(obj||{}){\n' + source + '}\n';

    source = "var __t,__p='',__j=Array.prototype.join," +
      "print=function(){__p+=__j.call(arguments,'');};\n" +
      source + 'return __p;\n';

    try {
      var render = new Function(settings.variable || 'obj', '_', source);
    } catch (e) {
      e.source = source;
      throw e;
    }

    var template = function(data) {
      return render.call(this, data, _);
    };

    // Provide the compiled source as a convenience for precompilation.
    var argument = settings.variable || 'obj';
    template.source = 'function(' + argument + '){\n' + source + '}';

    return template;
  };

  // Add a "chain" function. Start chaining a wrapped Underscore object.
  _.chain = function(obj) {
    var instance = _(obj);
    instance._chain = true;
    return instance;
  };

  // OOP
  // ---------------
  // If Underscore is called as a function, it returns a wrapped object that
  // can be used OO-style. This wrapper holds altered versions of all the
  // underscore functions. Wrapped objects may be chained.

  // Helper function to continue chaining intermediate results.
  var result = function(instance, obj) {
    return instance._chain ? _(obj).chain() : obj;
  };

  // Add your own custom functions to the Underscore object.
  _.mixin = function(obj) {
    _.each(_.functions(obj), function(name) {
      var func = _[name] = obj[name];
      _.prototype[name] = function() {
        var args = [this._wrapped];
        push.apply(args, arguments);
        return result(this, func.apply(_, args));
      };
    });
  };

  // Add all of the Underscore functions to the wrapper object.
  _.mixin(_);

  // Add all mutator Array functions to the wrapper.
  _.each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      var obj = this._wrapped;
      method.apply(obj, arguments);
      if ((name === 'shift' || name === 'splice') && obj.length === 0) delete obj[0];
      return result(this, obj);
    };
  });

  // Add all accessor Array functions to the wrapper.
  _.each(['concat', 'join', 'slice'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      return result(this, method.apply(this._wrapped, arguments));
    };
  });

  // Extracts the result from a wrapped and chained object.
  _.prototype.value = function() {
    return this._wrapped;
  };

  // Provide unwrapping proxy for some methods used in engine operations
  // such as arithmetic and JSON stringification.
  _.prototype.valueOf = _.prototype.toJSON = _.prototype.value;

  _.prototype.toString = function() {
    return '' + this._wrapped;
  };

  // AMD registration happens at the end for compatibility with AMD loaders
  // that may not enforce next-turn semantics on modules. Even though general
  // practice for AMD registration is to be anonymous, underscore registers
  // as a named module because, like jQuery, it is a base library that is
  // popular enough to be bundled in a third party lib, but not be part of
  // an AMD load request. Those cases could generate an error when an
  // anonymous define() is called outside of a loader request.
  if (typeof define === 'function' && define.amd) {
    define('underscore', [], function() {
      return _;
    });
  }
}.call(this));































// 新增扩展工具类

//继承相关逻辑
(function () {

  // 全局可能用到的变量
  var arr = [];
  var slice = arr.slice;
  /**
  * inherit方法，js的继承，默认为两个参数
  *
  * @param  {function} origin  可选，要继承的类
  * @param  {object}   methods 被创建类的成员，扩展的方法和属性
  * @return {function}         继承之后的子类
  */
  _.inherit = function (origin, methods) {

    // 参数检测，该继承方法，只支持一个参数创建类，或者两个参数继承类
    if (arguments.length === 0 || arguments.length > 2) throw '参数错误';

    var parent = null;

    // 将参数转换为数组
    var properties = slice.call(arguments);

    // 如果第一个参数为类（function），那么就将之取出
    if (typeof properties[0] === 'function')
      parent = properties.shift();
    properties = properties[0];

    // 创建新类用于返回
    function klass() {
      this.__propertys__();  //--
      if (_.isFunction(this.initialize))
        this.initialize.apply(this, arguments);
    }

    klass.superclass = parent;

    // 父类的方法不做保留，直接赋给子类
    klass.subclasses = []; //--

    var sup__propertys__ = function () { }; //--
    var sub__propertys__ = properties.__propertys__ || function () {  };  //--

    if (parent) {
      if (parent.prototype.__propertys__) sup__propertys__ = parent.prototype.__propertys__; //--

      // 中间过渡类，防止parent的构造函数被执行
      var subclass = function () { };
      subclass.prototype = parent.prototype;
      klass.prototype = new subclass();

      // 父类的方法不做保留，直接赋给子类
      parent.subclasses.push(klass);  //--
    }

    var ancestor = klass.superclass && klass.superclass.prototype;
    for (var k in properties) {
      var value = properties[k];

      //满足条件就重写
      if (ancestor && typeof value == 'function') {
        var argslist = /^\s*function\s*\(([^\(\)]*?)\)\s*?\{/i.exec(value.toString())[1].replace(/\s/g, '').split(',');
        //只有在第一个参数为$super情况下才需要处理（是否具有重复方法需要用户自己决定）
        if (argslist[0] === '$super' && ancestor[k]) {
          value = (function (methodName, fn) {
            return function () {
              var scope = this;
              var args = [
                function () {
                  return ancestor[methodName].apply(scope, arguments);
                }
              ];
              return fn.apply(this, args.concat(slice.call(arguments)));
            };
          })(k, value);
        }
      }

      //此处对对象进行扩展，当前原型链已经存在该对象，便进行扩展
      if (_.isObject(klass.prototype[k]) && _.isObject(value) && (typeof klass.prototype[k] != 'function' && typeof value != 'fuction')) {
        //原型链是共享的，这里处理逻辑要改
        var temp = {};
        _.extend(temp, klass.prototype[k]);
        _.extend(temp, value);
        klass.prototype[k] = temp;
      } else {
        klass.prototype[k] = value;
      }

    }

    if (!klass.prototype.initialize)
      klass.prototype.initialize = function () { };


    //兼容现有框架，__propertys__方法直接重写
    klass.prototype.__propertys__ = function () {
      sup__propertys__.call(this);
      sub__propertys__.call(this);
    };

    //兼容代码，非原型属性也需要进行继承
    for (key in parent) {
      if (parent.hasOwnProperty(key) && key !== 'prototype' && key !== 'superclass')
        klass[key] = parent[key];
    }


    klass.prototype.constructor = klass;

    return klass;
  };

})();

//基础方法
(function () {





  // 获取url参数
  /*
  这个方法还是有问题
  问题1：这里为什么要 decode？默认的 url 就应该是一个非 encode 的 url
  这里做 decode 会导致如下示例无法正常取 code 值，参数 decode 后已经乱套了
  示例如：http://m.ctrip.com/wechat/code.html?usertype=snsapi_userinfo&bindtype=bindwechat&jumpurl=http%3A%2F%2F10.0.0.119%3A8000%2Fwechat%2Fafterlogin%3Fbindtype%3Dbindwechat&code=0318f4f9425b94e272a68e58c81e0b5f&state=1440125203301
  url = decodeURIComponent(url);

  问题2：url 如果有两个？，第二个替换成&才行
  有些很恶心的第三方 app，不管你的 url 带不带 ? 他们直接加 ? 带自己的参数，如微信，wifiKey
  如：
  http://m.haoshiqi.net/index.html?from=singlemessage&isappinstalled=1?sid=150
  //微信默认转发链接，这样处理，导致页面直接挂了，因为他参数加前面，我取不到我要的参数了，处理后才能拿到我要的参数
  http://m.haoshiqi.net/index.html#detail?sid=235?openid=6c3d4d3cd62311e5afd76c92bf0ccc49&operid=14580358593451860495&lng=121.437046&long=121.437046&lat=31.167036&coordtype=b&maptype=baidu&srcFrom=
  这样转发出去，可能影响我们取有效的 key-value 值
  **/

  //规则规则，参数都为 key-value 值形式，若值为 url，必须 encodeURIComponent 处理
  _.getUrlParam = function (url, key) {
    if (!url) url = window.location.href;

    var searchReg = /([^&=?]+)=([^&]+)/g;
    var urlReg = /\/+.*\?/;
    var arrayReg = /(.+)\[\]$/;
    var urlParams = {};
    var match, name, value, isArray;


    // url = url.replace(/(.*)\?(.*)\?(.*)/, '$1?$2&$3');
    // var tempUrl = url.split('?');
    //
    // var tempLen = tempUrl.length;
    // if(tempLen>1){
    //   var temp = tempUrl[0];
    //   for(var i=0;i<tempLen;i++){
    //
    //   }gu
    // }
    //TODO：更好的方法做这件事，location.hash 替换掉 hash 部分以及第一个？，
    //      然后剩余部分的？全部替换为 &，之后取 key-value 值
    //故此方法可以优化[2016-03-18记]
    url = url.replace(/(.*)\?(.*)\?(.*)/, '$1?$2&$3');

    //var url = 'http://www.w3school.com.cn/tags/html_ref_canvas.asp?aa=1?cc=2&rr=4';
    //var reg = /^(http(?:s?):\/\/[\w\.\/?]+)([\w?=&]*)/
    //url.replace(reg, function(match,s1,s2){ return s1 + (!!s2 ? s2.replace(/\?/g,'&') : '');})

    while (match = searchReg.exec(url)) {
      name = match[1];
      value = match[2];
      isArray = name.match(arrayReg);
      //处理参数为url这种情况
      if (urlReg.test(value)) {
        urlParams[name] = url.substr(url.indexOf(value));
        break;
      } else {
        if (isArray) {
          name = isArray[1];
          urlParams[name] = urlParams[name] || [];
          urlParams[name].push(value);
        } else {
          urlParams[name] = value;
        }
      }
    }

    return key ? urlParams[key] : urlParams;
  };

  _.removeAllSpace = function (str) {
    return str.replace(/\s+/g, "");
  };

  _._compact = function(params){
    for(var key in params){
      if(!params[key]){
        delete(params[key]);
      }
    }
    return params;
  };

  _.formatPrice = function(_price, needCount, smallCount){
    var price = parseFloat(_price)*0.01;
    if(isNaN(price)) return _price;
    var is0 = price < 1 && price >= 0;
    if(is0) price += 1;
    // 需要小数点后2位
    needCount = needCount || 2;
    // 更小数部分
    smallCount = smallCount || 0;
    var fn = fn || 'round';
    var numStr = Math[fn](price * Math.pow(10, needCount)).toString();
    var index = numStr.length - needCount;
    var intPart = numStr.substr(0, index);
    if(is0) intPart = parseInt(intPart) - 1;
    var smallNum = smallCount ? ('<i>' + numStr.substr(index+2) + '</i>') : '';
    return intPart + '.' + numStr.substr(index, 2) + smallNum;
  };

})();

//l_wang flip手势工具
(function () {

  //偏移步长
  var step = 20;

  var touch = {};
  var down = 'touchstart';
  var move = 'touchmove';
  var up = 'touchend';
  if (!('ontouchstart' in window)) {
    down = 'mousedown';
    move = 'mousemove';
    up = 'mouseup';
  }

  //简单借鉴ccd思维做简要处理
  function swipeDirection(x1, x2, y1, y2, sensibility) {

    //x移动的步长
    var _x = Math.abs(x1 - x2);
    //y移动步长
    var _y = Math.abs(y1 - y2);
    var dir = _x >= _y ? (x1 - x2 > 0 ? 'left' : 'right') : (y1 - y2 > 0 ? 'up' : 'down');

    //设置灵敏度限制
    if (sensibility) {
      if (dir == 'left' || dir == 'right') {
        if ((_y / _x) > sensibility) dir = '';
      } else if (dir == 'up' || dir == 'down') {
        if ((_x / _y) > sensibility) dir = '';
      }
    }
    return dir;
  }

  //sensibility设置灵敏度，值为0-1
  function flip(el, dir, fn, noDefault, sensibility, stepSet) {
    if (!el || !el[0]) return;
    var _dir = '', _step = stepSet || step;

    /*
    这里原来的逻辑是绑定几次flip便会执行几次，这里做一次优化
    */
    if (el[0].__flipEventObj) {
      el[0].__flipEventObj['__flip_' + dir] = fn;
//        el[0].__flipEventObj['__flip_noDefault'] = noDefault;
//        el[0].__flipEventObj['__flip_sensibility'] = sensibility;
      return;
    }

    el[0].__flipEventObj = {};
    el[0].__flipEventObj['__flip_' + dir] = fn;

    //var _step = sensibility || step;
    el.on(down, function (e) {
      var pos = (e.touches && e.touches[0]) || e;
      touch.x1 = pos.pageX;
      touch.y1 = pos.pageY;

    }).on(move, function (e) {

      var pos = (e.touches && e.touches[0]) || e;
      touch.x2 = pos.pageX;
      touch.y2 = pos.pageY;

      //如果view过长滑不动是有问题的
      //if (!noDefault) { e.preventDefault(); }
      if ((touch.x2 && Math.abs(touch.x1 - touch.x2) > _step) ||
        (touch.y2 && Math.abs(touch.y1 - touch.y2) > _step)) {
        _dir = swipeDirection(touch.x1, touch.x2, touch.y1, touch.y2, sensibility);
      }
      var preventDefultFlag = typeof noDefault == 'function' ? noDefault(_dir) : noDefault;
      if (!preventDefultFlag) {
        e.preventDefault();
      }
    }).on(up, function (e) {
      var pos = (e.changedTouches && e.changedTouches[0]) || e;
      touch.x2 = pos.pageX;
      touch.y2 = pos.pageY;

      if ((touch.x2 && Math.abs(touch.x1 - touch.x2) > _step) ||
      (touch.y2 && Math.abs(touch.y1 - touch.y2) > _step)) {
        var _dir = swipeDirection(touch.x1, touch.x2, touch.y1, touch.y2, sensibility);

        if (_.isFunction(el[0].__flipEventObj['__flip_' + _dir])) {
          el[0].__flipEventObj['__flip_' + _dir]();
        }

      } else {

        if (_.isFunction(el[0].__flipEventObj['__flip_tap'])) {
          el[0].__flipEventObj['__flip_tap']();
        }
      }
      //l_wang 每次up后皆重置
      touch = {};
    });
  }

  function flipDestroy(el) {
    if (!el || !el[0]) return;

    el.off(down).off(move).off(up);
    if (el[0].__flipEventObj) delete el[0].__flipEventObj;

  }

  _.flip = flip;
  _.flipDestroy = flipDestroy;

})();


//日期操作类
(function () {

  /**
  * @description 静态日期操作类，封装系列日期操作方法
  * @description 输入时候月份自动减一，输出时候自动加一
  * @return {object} 返回操作方法
  */
  _.dateUtil = {
    /**
    * @description 数字操作，
    * @return {string} 返回处理后的数字
    */
    formatNum: function (n) {
      if (n < 10) return '0' + n;
      return n;
    },
    /**
    * @description 将字符串转换为日期，支持格式y-m-d ymd (y m r)以及标准的
    * @return {Date} 返回日期对象
    */
    parse: function (dateStr, formatStr) {
      if (typeof dateStr === 'undefined') return null;
      if (typeof formatStr === 'string') {
        var _d = new Date(formatStr);
        //首先取得顺序相关字符串
        var arrStr = formatStr.replace(/[^ymd]/g, '').split('');
        if (!arrStr && arrStr.length != 3) return null;

        var formatStr = formatStr.replace(/y|m|d/g, function (k) {
          switch (k) {
            case 'y': return '(\\d{4})';
            case 'm': ;
            case 'd': return '(\\d{1,2})';
          }
        });

        var reg = new RegExp(formatStr, 'g');
        var arr = reg.exec(dateStr)

        var dateObj = {};
        for (var i = 0, len = arrStr.length; i < len; i++) {
          dateObj[arrStr[i]] = arr[i + 1];
        }
        return new Date(dateObj['y'], dateObj['m'] - 1, dateObj['d']);
      }
      return null;
    },
    /**
    * @description将日期格式化为字符串
    * @return {string} 常用格式化字符串
    */
    format: function (date, options) {
      options = options || {type: 'date', format: 'Y年M月D日 H时F分S秒'};
      if(options.type === 'countdown' && !options.format){
        options.format = 'H时F分S秒';
      }

      var format = options.format;

      if(options.type === 'countdown'){
        //此时 date 为剩余时间 毫秒数
        var countTimes = {};
        var time = parseInt(date*0.001);

        var seconds = time%60;
        time = parseInt(time/60);
        var minutes = time%60;
        time = parseInt(time/60);
        var hours = parseInt(time%24);
        var days = parseInt(time/24);
        // var times = 1000;

        return format.replace(/Y|y|M|m|D|d|H|h|F|f|S|s/g, function (a) {
          switch (a) {
            case "d": return days;
            case "D": return _.dateUtil.formatNum(days);
            case "h": return hours;
            case "H": return _.dateUtil.formatNum(hours);
            case "f": return minutes;
            case "F": return _.dateUtil.formatNum(minutes);
            case "s": return seconds;
            case "S": return _.dateUtil.formatNum(seconds);
          }
        });
      }else{
        //date 可以传入时间戳 毫秒数
        if(typeof date === 'number'){
          date = new Date(date);
        }
        if (arguments.length < 2 && !date.getTime) {
          format = date;
          date = new Date();
        }
        //typeof format != 'string' && (format = 'Y年M月D日 H时F分S秒');
        return format.replace(/Y|y|M|m|D|d|H|h|F|f|S|s/g, function (a) {
          switch (a) {
            case "y": return (date.getFullYear() + "").slice(2);
            case "Y": return date.getFullYear();
            case "m": return date.getMonth() + 1;
            case "M": return _.dateUtil.formatNum(date.getMonth() + 1);
            case "d": return date.getDate();
            case "D": return _.dateUtil.formatNum(date.getDate());
            case "h": return date.getHours();
            case "H": return _.dateUtil.formatNum(date.getHours());
            case "f": return date.getMinutes();
            case "F": return _.dateUtil.formatNum(date.getMinutes());
            case "s": return date.getSeconds();
            case "S": return _.dateUtil.formatNum(date.getSeconds());
          }
        });
      }


    },
    // @description 是否为为日期对象，该方法可能有坑，使用需要慎重
    // @param year {num} 日期对象
    // @return {boolean} 返回值
    isDate: function (d) {
      if ((typeof d == 'object') && (d instanceof Date)) return true;
      return false;
    },
    // @description 是否为闰年
    // @param year {num} 可能是年份或者为一个date时间
    // @return {boolean} 返回值
    isLeapYear: function (year) {
      //传入为时间格式需要处理
      if (_.dateUtil.isDate(year)) year = year.getFullYear()
      if ((year % 4 == 0 && year % 100 != 0) || (year % 400 == 0)) return true;
      return false;
    },

    // @description 获取一个月份的天数
    // @param year {num} 可能是年份或者为一个date时间
    // @param year {num} 月份
    // @return {num} 返回天数
    getDaysOfMonth: function (year, month) {
      //自动减一以便操作
      month--;
      if (_.dateUtil.isDate(year)) {
        month = year.getMonth(); //注意此处月份要加1，所以我们要减一
        year = year.getFullYear();
      }
      return [31, _.dateUtil.isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month];
    },

    // @description 获取一个月份1号是星期几，注意此时的月份传入时需要自主减一
    // @param year {num} 可能是年份或者为一个date时间
    // @param year {num} 月份
    // @return {num} 当月一号为星期几0-6
    getBeginDayOfMouth: function (year, month) {
      //自动减一以便操作
      month--;
      if ((typeof year == 'object') && (year instanceof Date)) {
        month = year.getMonth();
        year = year.getFullYear();
      }
      var d = new Date(year, month, 1);
      return d.getDay();
    }
  };

})();

//封装setTimeout
(function() {

  var TimerRes = {};

  _.setInterval = function(fn, timeout, ns) {
    if (!ns) ns = 'g';
    if (!TimerRes[ns]) TimerRes[ns] = [];
    TimerRes[ns].push(setInterval(fn, timeout));
  };

  _.clearInterval = function (rid, ns) {
    var k, v, k1, i, len, i1, len1, resArr, j;

    if(typeof rid == 'number'){
      //1 clearInterval， 清除数组
      for(k in TimerRes) {
        v = TimerRes[k];
        for(i = 0, len = v.length; i < len; i++) {
          if(rid == v[i]) {
            v.splice(i, 1)
            clearInterval(rid);
            return;
          }
        }
      }
    }

    if(typeof rid == 'string'){
      ns = rid;
      resArr = TimerRes[ns];
      j = resArr.length;
      while(j != 0){
       _.clearInterval(resArr[resArr.length - 1]);
      }
    }

    if(arguments.length == 0) {
       for(k1 in TimerRes) {
       _.clearInterval(k1);
       }
    }

  }

})();
;/* global Zepto:true */
/* global WebKitCSSMatrix:true */

(function($) {
     "use strict";
    ['width', 'height'].forEach(function(dimension) {
        var  Dimension = dimension.replace(/./, function(m) {
            return m[0].toUpperCase();
        });
        $.fn['outer' + Dimension] = function(margin) {
            var elem = this;
            if (elem) {
                var size = elem[dimension]();
                var sides = {
                    'width': ['left', 'right'],
                    'height': ['top', 'bottom']
                };
                sides[dimension].forEach(function(side) {
                    if (margin) size += parseInt(elem.css('margin-' + side), 10);
                });
                return size;
            } else {
                return null;
            }
        };
    });


    //support
    $.support = (function() {
        var support = {
            touch: !!(('ontouchstart' in window) || window.DocumentTouch && document instanceof window.DocumentTouch)
        };
        return support;
    })();

    $.touchEvents = {
        start: $.support.touch ? 'touchstart' : 'mousedown',
        move: $.support.touch ? 'touchmove' : 'mousemove',
        end: $.support.touch ? 'touchend' : 'mouseup'
    };

    $.getTranslate = function (el, axis) {
      var matrix, curTransform, curStyle, transformMatrix;

      // automatic axis detection
      if (typeof axis === 'undefined') {
        axis = 'x';
      }

      curStyle = window.getComputedStyle(el, null);
      if (window.WebKitCSSMatrix) {
        // Some old versions of Webkit choke when 'none' is passed; pass
        // empty string instead in this case
        transformMatrix = new WebKitCSSMatrix(curStyle.webkitTransform === 'none' ? '' : curStyle.webkitTransform);
      }
      else {
        transformMatrix = curStyle.MozTransform || curStyle.OTransform || curStyle.MsTransform || curStyle.msTransform  || curStyle.transform || curStyle.getPropertyValue('transform').replace('translate(', 'matrix(1, 0, 0, 1,');
        matrix = transformMatrix.toString().split(',');
      }

      if (axis === 'x') {
        //Latest Chrome and webkits Fix
        if (window.WebKitCSSMatrix)
          curTransform = transformMatrix.m41;
        //Crazy IE10 Matrix
        else if (matrix.length === 16)
          curTransform = parseFloat(matrix[12]);
        //Normal Browsers
        else
          curTransform = parseFloat(matrix[4]);
      }
      if (axis === 'y') {
        //Latest Chrome and webkits Fix
        if (window.WebKitCSSMatrix)
          curTransform = transformMatrix.m42;
        //Crazy IE10 Matrix
        else if (matrix.length === 16)
          curTransform = parseFloat(matrix[13]);
        //Normal Browsers
        else
          curTransform = parseFloat(matrix[5]);
      }

      return curTransform || 0;
    };
    $.requestAnimationFrame = function (callback) {
      if (window.requestAnimationFrame) return window.requestAnimationFrame(callback);
      else if (window.webkitRequestAnimationFrame) return window.webkitRequestAnimationFrame(callback);
      else if (window.mozRequestAnimationFrame) return window.mozRequestAnimationFrame(callback);
      else {
        return window.setTimeout(callback, 1000 / 60);
      }
    };

    $.cancelAnimationFrame = function (id) {
      if (window.cancelAnimationFrame) return window.cancelAnimationFrame(id);
      else if (window.webkitCancelAnimationFrame) return window.webkitCancelAnimationFrame(id);
      else if (window.mozCancelAnimationFrame) return window.mozCancelAnimationFrame(id);
      else {
        return window.clearTimeout(id);
      }
    };


    $.fn.transitionEnd = function(callback) {
        var events = ['webkitTransitionEnd', 'transitionend'],
            i, dom = this;

        function fireCallBack(e) {
            /*jshint validthis:true */
            if (e.target !== this) return;
            callback.call(this, e);
            for (i = 0; i < events.length; i++) {
                dom.off(events[i], fireCallBack);
            }
        }
        if (callback) {
            for (i = 0; i < events.length; i++) {
                dom.on(events[i], fireCallBack);
            }
        }
        return this;
    };
    $.fn.dataset = function() {
        var el = this[0];
        if (el) {
            var dataset = {};
            if (el.dataset) {

                for (var dataKey in el.dataset) { // jshint ignore:line
                    dataset[dataKey] = el.dataset[dataKey];
                }
            } else {
                for (var i = 0; i < el.attributes.length; i++) {
                    var attr = el.attributes[i];
                    if (/^data-/.test(attr.name)) {
                        dataset[$.toCamelCase(attr.name.split('data-')[1])] = attr.value;
                    }
                }
            }
            for (var key in dataset) {
                if (dataset[key] === 'false') dataset[key] = false;
                else if (dataset[key] === 'true') dataset[key] = true;
                else if (parseFloat(dataset[key]) === dataset[key] * 1) dataset[key] = dataset[key] * 1;
            }
            return dataset;
        } else return undefined;
    };
    $.fn.data = function(key, value) {
        if (typeof key === 'undefined') {
            return $(this).dataset();
        }
        if (typeof value === 'undefined') {
            // Get value
            if (this[0] && this[0].getAttribute) {
                var dataKey = this[0].getAttribute('data-' + key);

                if (dataKey) {
                    return dataKey;
                } else if (this[0].smElementDataStorage && (key in this[0].smElementDataStorage)) {


                    return this[0].smElementDataStorage[key];

                } else {
                    return undefined;
                }
            } else return undefined;

        } else {
            // Set value
            for (var i = 0; i < this.length; i++) {
                var el = this[i];
                if (!el.smElementDataStorage) el.smElementDataStorage = {};
                el.smElementDataStorage[key] = value;
            }
            return this;
        }
    };
    $.fn.animationEnd = function(callback) {
        var events = ['webkitAnimationEnd', 'animationend'],
            i, dom = this;

        function fireCallBack(e) {
            callback(e);
            for (i = 0; i < events.length; i++) {
                dom.off(events[i], fireCallBack);
            }
        }
        if (callback) {
            for (i = 0; i < events.length; i++) {
                dom.on(events[i], fireCallBack);
            }
        }
        return this;
    };
    $.fn.transition = function(duration) {
        if (typeof duration !== 'string') {
            duration = duration + 'ms';
        }
        for (var i = 0; i < this.length; i++) {
            var elStyle = this[i].style;
            elStyle.webkitTransitionDuration = elStyle.MsTransitionDuration = elStyle.msTransitionDuration = elStyle.MozTransitionDuration = elStyle.OTransitionDuration = elStyle.transitionDuration = duration;
        }
        return this;
    };
    $.fn.transform = function(transform) {
        for (var i = 0; i < this.length; i++) {
            var elStyle = this[i].style;
            elStyle.webkitTransform = elStyle.MsTransform = elStyle.msTransform = elStyle.MozTransform = elStyle.OTransform = elStyle.transform = transform;
        }
        return this;
    };
    $.fn.prevAll = function (selector) {
      var prevEls = [];
      var el = this[0];
      if (!el) return $([]);
      while (el.previousElementSibling) {
        var prev = el.previousElementSibling;
        if (selector) {
          if($(prev).is(selector)) prevEls.push(prev);
        }
        else prevEls.push(prev);
        el = prev;
      }
      return $(prevEls);
    };
    $.fn.nextAll = function (selector) {
      var nextEls = [];
      var el = this[0];
      if (!el) return $([]);
      while (el.nextElementSibling) {
        var next = el.nextElementSibling;
        if (selector) {
          if($(next).is(selector)) nextEls.push(next);
        }
        else nextEls.push(next);
        el = next;
      }
      return $(nextEls);
    };

    //重置zepto的show方法，防止有些人引用的版本中 show 方法操作 opacity 属性影响动画执行
    $.fn.show = function(){
      var elementDisplay = {};
      function defaultDisplay(nodeName) {
        var element, display;
        if (!elementDisplay[nodeName]) {
          element = document.createElement(nodeName);
          document.body.appendChild(element);
          display = getComputedStyle(element, '').getPropertyValue("display");
          element.parentNode.removeChild(element);
          display === "none" && (display = "block");
          elementDisplay[nodeName] = display;
        }
        return elementDisplay[nodeName];
      }

      return this.each(function(){
        this.style.display === "none" && (this.style.display = '');
        if (getComputedStyle(this, '').getPropertyValue("display") === "none");
          this.style.display = defaultDisplay(this.nodeName);
      });
    };
})(Zepto);
;//     Zepto.js
//     (c) 2010-2016 Thomas Fuchs
//     Zepto.js may be freely distributed under the MIT license.

// Provides andSelf & end() chaining methods

;(function($){
  $.fn.end = function(){
    return this.prevObject || $()
  }

  $.fn.andSelf = function(){
    return this.add(this.prevObject || $())
  }

  'filter,add,not,eq,first,last,find,closest,parents,parent,children,siblings'.split(',').forEach(function(property){
    var fn = $.fn[property]
    $.fn[property] = function(){
      var ret = fn.apply(this, arguments)
      ret.prevObject = this
      return ret
    }
  })
})(Zepto)
;//     Backbone.js 1.1.2

//     (c) 2010-2014 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
//     Backbone may be freely distributed under the MIT license.
//     For all details and documentation:
//     http://backbonejs.org

(function(root, factory) {

  // Set up Backbone appropriately for the environment. Start with AMD.
  if (typeof define === 'function' && define.amd) {
    // define(['underscore', 'jquery', 'exports'], function(_, $, exports) {
    //   // Export global even in AMD case in case this script is loaded with
    //   // others that may still expect a global Backbone.
    //   root.Backbone = factory(root, exports, _, $);
    // });

    root.Backbone = factory(root, {}, root._, (root.jQuery || root.Zepto || root.ender || root.$));
  // Next for Node.js or CommonJS. jQuery may not be needed as a module.
  } else if (typeof exports !== 'undefined') {
    // var _ = require('underscore');
    factory(root, exports, root._);

  // Finally, as a browser global.
  } else {
    root.Backbone = factory(root, {}, root._, (root.jQuery || root.Zepto || root.ender || root.$));
  }

}(this, function(root, Backbone, _, $) {

  // Initial Setup
  // -------------

  // Save the previous value of the `Backbone` variable, so that it can be
  // restored later on, if `noConflict` is used.
  var previousBackbone = root.Backbone;

  // Create local references to array methods we'll want to use later.
  var array = [];
  var slice = array.slice;

  // Current version of the library. Keep in sync with `package.json`.
  Backbone.VERSION = '1.1.2';

  // For Backbone's purposes, jQuery, Zepto, Ender, or My Library (kidding) owns
  // the `$` variable.
  Backbone.$ = $;

  // Runs Backbone.js in *noConflict* mode, returning the `Backbone` variable
  // to its previous owner. Returns a reference to this Backbone object.
  Backbone.noConflict = function() {
    root.Backbone = previousBackbone;
    return this;
  };

  // Turn on `emulateHTTP` to support legacy HTTP servers. Setting this option
  // will fake `"PATCH"`, `"PUT"` and `"DELETE"` requests via the `_method` parameter and
  // set a `X-Http-Method-Override` header.
  Backbone.emulateHTTP = false;

  // Turn on `emulateJSON` to support legacy servers that can't deal with direct
  // `application/json` requests ... this will encode the body as
  // `application/x-www-form-urlencoded` instead and will send the model in a
  // form param named `model`.
  Backbone.emulateJSON = false;

  // Backbone.Events
  // ---------------

  // A module that can be mixed in to *any object* in order to provide it with
  // custom events. You may bind with `on` or remove with `off` callback
  // functions to an event; `trigger`-ing an event fires all callbacks in
  // succession.
  //
  //     var object = {};
  //     _.extend(object, Backbone.Events);
  //     object.on('expand', function(){ alert('expanded'); });
  //     object.trigger('expand');
  //
  var Events = Backbone.Events = {

    // Bind an event to a `callback` function. Passing `"all"` will bind
    // the callback to all events fired.
    on: function(name, callback, context) {
      if (!eventsApi(this, 'on', name, [callback, context]) || !callback) return this;
      this._events || (this._events = {});
      var events = this._events[name] || (this._events[name] = []);
      events.push({callback: callback, context: context, ctx: context || this});
      return this;
    },

    // Bind an event to only be triggered a single time. After the first time
    // the callback is invoked, it will be removed.
    once: function(name, callback, context) {
      if (!eventsApi(this, 'once', name, [callback, context]) || !callback) return this;
      var self = this;
      var once = _.once(function() {
        self.off(name, once);
        callback.apply(this, arguments);
      });
      once._callback = callback;
      return this.on(name, once, context);
    },

    // Remove one or many callbacks. If `context` is null, removes all
    // callbacks with that function. If `callback` is null, removes all
    // callbacks for the event. If `name` is null, removes all bound
    // callbacks for all events.
    off: function(name, callback, context) {
      if (!this._events || !eventsApi(this, 'off', name, [callback, context])) return this;

      // Remove all callbacks for all events.
      if (!name && !callback && !context) {
        this._events = void 0;
        return this;
      }

      var names = name ? [name] : _.keys(this._events);
      for (var i = 0, length = names.length; i < length; i++) {
        name = names[i];

        // Bail out if there are no events stored.
        var events = this._events[name];
        if (!events) continue;

        // Remove all callbacks for this event.
        if (!callback && !context) {
          delete this._events[name];
          continue;
        }

        // Find any remaining events.
        var remaining = [];
        for (var j = 0, k = events.length; j < k; j++) {
          var event = events[j];
          if (
            callback && callback !== event.callback &&
            callback !== event.callback._callback ||
            context && context !== event.context
          ) {
            remaining.push(event);
          }
        }

        // Replace events if there are any remaining.  Otherwise, clean up.
        if (remaining.length) {
          this._events[name] = remaining;
        } else {
          delete this._events[name];
        }
      }

      return this;
    },

    // Trigger one or many events, firing all bound callbacks. Callbacks are
    // passed the same arguments as `trigger` is, apart from the event name
    // (unless you're listening on `"all"`, which will cause your callback to
    // receive the true name of the event as the first argument).
    trigger: function(name) {
      if (!this._events) return this;
      var args = slice.call(arguments, 1);
      if (!eventsApi(this, 'trigger', name, args)) return this;
      var events = this._events[name];
      var allEvents = this._events.all;
      if (events) triggerEvents(events, args);
      if (allEvents) triggerEvents(allEvents, arguments);
      return this;
    },

    // Inversion-of-control versions of `on` and `once`. Tell *this* object to
    // listen to an event in another object ... keeping track of what it's
    // listening to.
    listenTo: function(obj, name, callback) {
      var listeningTo = this._listeningTo || (this._listeningTo = {});
      var id = obj._listenId || (obj._listenId = _.uniqueId('l'));
      listeningTo[id] = obj;
      if (!callback && typeof name === 'object') callback = this;
      obj.on(name, callback, this);
      return this;
    },

    listenToOnce: function(obj, name, callback) {
      if (typeof name === 'object') {
        for (var event in name) this.listenToOnce(obj, event, name[event]);
        return this;
      }
      if (eventSplitter.test(name)) {
        var names = name.split(eventSplitter);
        for (var i = 0, length = names.length; i < length; i++) {
          this.listenToOnce(obj, names[i], callback);
        }
        return this;
      }
      if (!callback) return this;
      var once = _.once(function() {
        this.stopListening(obj, name, once);
        callback.apply(this, arguments);
      });
      once._callback = callback;
      return this.listenTo(obj, name, once);
    },

    // Tell this object to stop listening to either specific events ... or
    // to every object it's currently listening to.
    stopListening: function(obj, name, callback) {
      var listeningTo = this._listeningTo;
      if (!listeningTo) return this;
      var remove = !name && !callback;
      if (!callback && typeof name === 'object') callback = this;
      if (obj) (listeningTo = {})[obj._listenId] = obj;
      for (var id in listeningTo) {
        obj = listeningTo[id];
        obj.off(name, callback, this);
        if (remove || _.isEmpty(obj._events)) delete this._listeningTo[id];
      }
      return this;
    }

  };

  // Regular expression used to split event strings.
  var eventSplitter = /\s+/;

  // Implement fancy features of the Events API such as multiple event
  // names `"change blur"` and jQuery-style event maps `{change: action}`
  // in terms of the existing API.
  var eventsApi = function(obj, action, name, rest) {
    if (!name) return true;

    // Handle event maps.
    if (typeof name === 'object') {
      for (var key in name) {
        obj[action].apply(obj, [key, name[key]].concat(rest));
      }
      return false;
    }

    // Handle space separated event names.
    if (eventSplitter.test(name)) {
      var names = name.split(eventSplitter);
      for (var i = 0, length = names.length; i < length; i++) {
        obj[action].apply(obj, [names[i]].concat(rest));
      }
      return false;
    }

    return true;
  };

  // A difficult-to-believe, but optimized internal dispatch function for
  // triggering events. Tries to keep the usual cases speedy (most internal
  // Backbone events have 3 arguments).
  var triggerEvents = function(events, args) {
    var ev, i = -1, l = events.length, a1 = args[0], a2 = args[1], a3 = args[2];
    switch (args.length) {
      case 0: while (++i < l) (ev = events[i]).callback.call(ev.ctx); return;
      case 1: while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1); return;
      case 2: while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1, a2); return;
      case 3: while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1, a2, a3); return;
      default: while (++i < l) (ev = events[i]).callback.apply(ev.ctx, args); return;
    }
  };

  // Aliases for backwards compatibility.
  Events.bind   = Events.on;
  Events.unbind = Events.off;

  // Allow the `Backbone` object to serve as a global event bus, for folks who
  // want global "pubsub" in a convenient place.
  _.extend(Backbone, Events);

  // Backbone.Model
  // --------------

  // Backbone **Models** are the basic data object in the framework --
  // frequently representing a row in a table in a database on your server.
  // A discrete chunk of data and a bunch of useful, related methods for
  // performing computations and transformations on that data.

  // Create a new model with the specified attributes. A client id (`cid`)
  // is automatically generated and assigned for you.
  var Model = Backbone.Model = function(attributes, options) {
    var attrs = attributes || {};
    options || (options = {});
    this.cid = _.uniqueId('c');
    this.attributes = {};
    if (options.collection) this.collection = options.collection;
    if (options.parse) attrs = this.parse(attrs, options) || {};
    attrs = _.defaults({}, attrs, _.result(this, 'defaults'));
    this.set(attrs, options);
    this.changed = {};
    this.initialize.apply(this, arguments);
  };

  // Attach all inheritable methods to the Model prototype.
  _.extend(Model.prototype, Events, {

    // A hash of attributes whose current and previous value differ.
    changed: null,

    // The value returned during the last failed validation.
    validationError: null,

    // The default name for the JSON `id` attribute is `"id"`. MongoDB and
    // CouchDB users may want to set this to `"_id"`.
    idAttribute: 'id',

    // Initialize is an empty function by default. Override it with your own
    // initialization logic.
    initialize: function(){},

    // Return a copy of the model's `attributes` object.
    toJSON: function(options) {
      return _.clone(this.attributes);
    },

    // Proxy `Backbone.sync` by default -- but override this if you need
    // custom syncing semantics for *this* particular model.
    sync: function() {
      return Backbone.sync.apply(this, arguments);
    },

    // Get the value of an attribute.
    get: function(attr) {
      return this.attributes[attr];
    },

    // Get the HTML-escaped value of an attribute.
    escape: function(attr) {
      return _.escape(this.get(attr));
    },

    // Returns `true` if the attribute contains a value that is not null
    // or undefined.
    has: function(attr) {
      return this.get(attr) != null;
    },

    // Special-cased proxy to underscore's `_.matches` method.
    matches: function(attrs) {
      return _.matches(attrs)(this.attributes);
    },

    // Set a hash of model attributes on the object, firing `"change"`. This is
    // the core primitive operation of a model, updating the data and notifying
    // anyone who needs to know about the change in state. The heart of the beast.
    set: function(key, val, options) {
      var attr, attrs, unset, changes, silent, changing, prev, current;
      if (key == null) return this;

      // Handle both `"key", value` and `{key: value}` -style arguments.
      if (typeof key === 'object') {
        attrs = key;
        options = val;
      } else {
        (attrs = {})[key] = val;
      }

      options || (options = {});

      // Run validation.
      if (!this._validate(attrs, options)) return false;

      // Extract attributes and options.
      unset           = options.unset;
      silent          = options.silent;
      changes         = [];
      changing        = this._changing;
      this._changing  = true;

      if (!changing) {
        this._previousAttributes = _.clone(this.attributes);
        this.changed = {};
      }
      current = this.attributes, prev = this._previousAttributes;

      // Check for changes of `id`.
      if (this.idAttribute in attrs) this.id = attrs[this.idAttribute];

      // For each `set` attribute, update or delete the current value.
      for (attr in attrs) {
        val = attrs[attr];
        if (!_.isEqual(current[attr], val)) changes.push(attr);
        if (!_.isEqual(prev[attr], val)) {
          this.changed[attr] = val;
        } else {
          delete this.changed[attr];
        }
        unset ? delete current[attr] : current[attr] = val;
      }

      // Trigger all relevant attribute changes.
      if (!silent) {
        if (changes.length) this._pending = options;
        for (var i = 0, length = changes.length; i < length; i++) {
          this.trigger('change:' + changes[i], this, current[changes[i]], options);
        }
      }

      // You might be wondering why there's a `while` loop here. Changes can
      // be recursively nested within `"change"` events.
      if (changing) return this;
      if (!silent) {
        while (this._pending) {
          options = this._pending;
          this._pending = false;
          this.trigger('change', this, options);
        }
      }
      this._pending = false;
      this._changing = false;
      return this;
    },

    // Remove an attribute from the model, firing `"change"`. `unset` is a noop
    // if the attribute doesn't exist.
    unset: function(attr, options) {
      return this.set(attr, void 0, _.extend({}, options, {unset: true}));
    },

    // Clear all attributes on the model, firing `"change"`.
    clear: function(options) {
      var attrs = {};
      for (var key in this.attributes) attrs[key] = void 0;
      return this.set(attrs, _.extend({}, options, {unset: true}));
    },

    // Determine if the model has changed since the last `"change"` event.
    // If you specify an attribute name, determine if that attribute has changed.
    hasChanged: function(attr) {
      if (attr == null) return !_.isEmpty(this.changed);
      return _.has(this.changed, attr);
    },

    // Return an object containing all the attributes that have changed, or
    // false if there are no changed attributes. Useful for determining what
    // parts of a view need to be updated and/or what attributes need to be
    // persisted to the server. Unset attributes will be set to undefined.
    // You can also pass an attributes object to diff against the model,
    // determining if there *would be* a change.
    changedAttributes: function(diff) {
      if (!diff) return this.hasChanged() ? _.clone(this.changed) : false;
      var val, changed = false;
      var old = this._changing ? this._previousAttributes : this.attributes;
      for (var attr in diff) {
        if (_.isEqual(old[attr], (val = diff[attr]))) continue;
        (changed || (changed = {}))[attr] = val;
      }
      return changed;
    },

    // Get the previous value of an attribute, recorded at the time the last
    // `"change"` event was fired.
    previous: function(attr) {
      if (attr == null || !this._previousAttributes) return null;
      return this._previousAttributes[attr];
    },

    // Get all of the attributes of the model at the time of the previous
    // `"change"` event.
    previousAttributes: function() {
      return _.clone(this._previousAttributes);
    },

    // Fetch the model from the server. If the server's representation of the
    // model differs from its current attributes, they will be overridden,
    // triggering a `"change"` event.
    fetch: function(options) {
      options = options ? _.clone(options) : {};
      if (options.parse === void 0) options.parse = true;
      var model = this;
      var success = options.success;
      options.success = function(resp) {
        if (!model.set(model.parse(resp, options), options)) return false;
        if (success) success(model, resp, options);
        model.trigger('sync', model, resp, options);
      };
      wrapError(this, options);
      return this.sync('read', this, options);
    },

    // Set a hash of model attributes, and sync the model to the server.
    // If the server returns an attributes hash that differs, the model's
    // state will be `set` again.
    save: function(key, val, options) {
      var attrs, method, xhr, attributes = this.attributes;

      // Handle both `"key", value` and `{key: value}` -style arguments.
      if (key == null || typeof key === 'object') {
        attrs = key;
        options = val;
      } else {
        (attrs = {})[key] = val;
      }

      options = _.extend({validate: true}, options);

      // If we're not waiting and attributes exist, save acts as
      // `set(attr).save(null, opts)` with validation. Otherwise, check if
      // the model will be valid when the attributes, if any, are set.
      if (attrs && !options.wait) {
        if (!this.set(attrs, options)) return false;
      } else {
        if (!this._validate(attrs, options)) return false;
      }

      // Set temporary attributes if `{wait: true}`.
      if (attrs && options.wait) {
        this.attributes = _.extend({}, attributes, attrs);
      }

      // After a successful server-side save, the client is (optionally)
      // updated with the server-side state.
      if (options.parse === void 0) options.parse = true;
      var model = this;
      var success = options.success;
      options.success = function(resp) {
        // Ensure attributes are restored during synchronous saves.
        model.attributes = attributes;
        var serverAttrs = model.parse(resp, options);
        if (options.wait) serverAttrs = _.extend(attrs || {}, serverAttrs);
        if (_.isObject(serverAttrs) && !model.set(serverAttrs, options)) {
          return false;
        }
        if (success) success(model, resp, options);
        model.trigger('sync', model, resp, options);
      };
      wrapError(this, options);

      method = this.isNew() ? 'create' : (options.patch ? 'patch' : 'update');
      if (method === 'patch' && !options.attrs) options.attrs = attrs;
      xhr = this.sync(method, this, options);

      // Restore attributes.
      if (attrs && options.wait) this.attributes = attributes;

      return xhr;
    },

    // Destroy this model on the server if it was already persisted.
    // Optimistically removes the model from its collection, if it has one.
    // If `wait: true` is passed, waits for the server to respond before removal.
    destroy: function(options) {
      options = options ? _.clone(options) : {};
      var model = this;
      var success = options.success;

      var destroy = function() {
        model.stopListening();
        model.trigger('destroy', model, model.collection, options);
      };

      options.success = function(resp) {
        if (options.wait || model.isNew()) destroy();
        if (success) success(model, resp, options);
        if (!model.isNew()) model.trigger('sync', model, resp, options);
      };

      if (this.isNew()) {
        options.success();
        return false;
      }
      wrapError(this, options);

      var xhr = this.sync('delete', this, options);
      if (!options.wait) destroy();
      return xhr;
    },

    // Default URL for the model's representation on the server -- if you're
    // using Backbone's restful methods, override this to change the endpoint
    // that will be called.
    url: function() {
      var base =
        _.result(this, 'urlRoot') ||
        _.result(this.collection, 'url') ||
        urlError();
      if (this.isNew()) return base;
      return base.replace(/([^\/])$/, '$1/') + encodeURIComponent(this.id);
    },

    // **parse** converts a response into the hash of attributes to be `set` on
    // the model. The default implementation is just to pass the response along.
    parse: function(resp, options) {
      return resp;
    },

    // Create a new model with identical attributes to this one.
    clone: function() {
      return new this.constructor(this.attributes);
    },

    // A model is new if it has never been saved to the server, and lacks an id.
    isNew: function() {
      return !this.has(this.idAttribute);
    },

    // Check if the model is currently in a valid state.
    isValid: function(options) {
      return this._validate({}, _.extend(options || {}, { validate: true }));
    },

    // Run validation against the next complete set of model attributes,
    // returning `true` if all is well. Otherwise, fire an `"invalid"` event.
    _validate: function(attrs, options) {
      if (!options.validate || !this.validate) return true;
      attrs = _.extend({}, this.attributes, attrs);
      var error = this.validationError = this.validate(attrs, options) || null;
      if (!error) return true;
      this.trigger('invalid', this, error, _.extend(options, {validationError: error}));
      return false;
    }

  });

  // Underscore methods that we want to implement on the Model.
  var modelMethods = ['keys', 'values', 'pairs', 'invert', 'pick', 'omit', 'chain', 'isEmpty'];

  // Mix in each Underscore method as a proxy to `Model#attributes`.
  _.each(modelMethods, function(method) {
    if (!_[method]) return;
    Model.prototype[method] = function() {
      var args = slice.call(arguments);
      args.unshift(this.attributes);
      return _[method].apply(_, args);
    };
  });

  // Backbone.Collection
  // -------------------

  // If models tend to represent a single row of data, a Backbone Collection is
  // more analogous to a table full of data ... or a small slice or page of that
  // table, or a collection of rows that belong together for a particular reason
  // -- all of the messages in this particular folder, all of the documents
  // belonging to this particular author, and so on. Collections maintain
  // indexes of their models, both in order, and for lookup by `id`.

  // Create a new **Collection**, perhaps to contain a specific type of `model`.
  // If a `comparator` is specified, the Collection will maintain
  // its models in sort order, as they're added and removed.
  var Collection = Backbone.Collection = function(models, options) {
    options || (options = {});
    if (options.model) this.model = options.model;
    if (options.comparator !== void 0) this.comparator = options.comparator;
    this._reset();
    this.initialize.apply(this, arguments);
    if (models) this.reset(models, _.extend({silent: true}, options));
  };

  // Default options for `Collection#set`.
  var setOptions = {add: true, remove: true, merge: true};
  var addOptions = {add: true, remove: false};

  // Define the Collection's inheritable methods.
  _.extend(Collection.prototype, Events, {

    // The default model for a collection is just a **Backbone.Model**.
    // This should be overridden in most cases.
    model: Model,

    // Initialize is an empty function by default. Override it with your own
    // initialization logic.
    initialize: function(){},

    // The JSON representation of a Collection is an array of the
    // models' attributes.
    toJSON: function(options) {
      return this.map(function(model){ return model.toJSON(options); });
    },

    // Proxy `Backbone.sync` by default.
    sync: function() {
      return Backbone.sync.apply(this, arguments);
    },

    // Add a model, or list of models to the set.
    add: function(models, options) {
      return this.set(models, _.extend({merge: false}, options, addOptions));
    },

    // Remove a model, or a list of models from the set.
    remove: function(models, options) {
      var singular = !_.isArray(models);
      models = singular ? [models] : _.clone(models);
      options || (options = {});
      for (var i = 0, length = models.length; i < length; i++) {
        var model = models[i] = this.get(models[i]);
        if (!model) continue;
        var id = this.modelId(model.attributes);
        if (id != null) delete this._byId[id];
        delete this._byId[model.cid];
        var index = this.indexOf(model);
        this.models.splice(index, 1);
        this.length--;
        if (!options.silent) {
          options.index = index;
          model.trigger('remove', model, this, options);
        }
        this._removeReference(model, options);
      }
      return singular ? models[0] : models;
    },

    // Update a collection by `set`-ing a new list of models, adding new ones,
    // removing models that are no longer present, and merging models that
    // already exist in the collection, as necessary. Similar to **Model#set**,
    // the core operation for updating the data contained by the collection.
    set: function(models, options) {
      options = _.defaults({}, options, setOptions);
      if (options.parse) models = this.parse(models, options);
      var singular = !_.isArray(models);
      models = singular ? (models ? [models] : []) : models.slice();
      var id, model, attrs, existing, sort;
      var at = options.at;
      if (at != null) at = +at;
      if (at < 0) at += this.length + 1;
      var sortable = this.comparator && (at == null) && options.sort !== false;
      var sortAttr = _.isString(this.comparator) ? this.comparator : null;
      var toAdd = [], toRemove = [], modelMap = {};
      var add = options.add, merge = options.merge, remove = options.remove;
      var order = !sortable && add && remove ? [] : false;
      var orderChanged = false;

      // Turn bare objects into model references, and prevent invalid models
      // from being added.
      for (var i = 0, length = models.length; i < length; i++) {
        attrs = models[i];

        // If a duplicate is found, prevent it from being added and
        // optionally merge it into the existing model.
        if (existing = this.get(attrs)) {
          if (remove) modelMap[existing.cid] = true;
          if (merge && attrs !== existing) {
            attrs = this._isModel(attrs) ? attrs.attributes : attrs;
            if (options.parse) attrs = existing.parse(attrs, options);
            existing.set(attrs, options);
            if (sortable && !sort && existing.hasChanged(sortAttr)) sort = true;
          }
          models[i] = existing;

        // If this is a new, valid model, push it to the `toAdd` list.
        } else if (add) {
          model = models[i] = this._prepareModel(attrs, options);
          if (!model) continue;
          toAdd.push(model);
          this._addReference(model, options);
        }

        // Do not add multiple models with the same `id`.
        model = existing || model;
        if (!model) continue;
        id = this.modelId(model.attributes);
        if (order && (model.isNew() || !modelMap[id])) {
          order.push(model);

          // Check to see if this is actually a new model at this index.
          orderChanged = orderChanged || !this.models[i] || model.cid !== this.models[i].cid;
        }

        modelMap[id] = true;
      }

      // Remove nonexistent models if appropriate.
      if (remove) {
        for (var i = 0, length = this.length; i < length; i++) {
          if (!modelMap[(model = this.models[i]).cid]) toRemove.push(model);
        }
        if (toRemove.length) this.remove(toRemove, options);
      }

      // See if sorting is needed, update `length` and splice in new models.
      if (toAdd.length || orderChanged) {
        if (sortable) sort = true;
        this.length += toAdd.length;
        if (at != null) {
          for (var i = 0, length = toAdd.length; i < length; i++) {
            this.models.splice(at + i, 0, toAdd[i]);
          }
        } else {
          if (order) this.models.length = 0;
          var orderedModels = order || toAdd;
          for (var i = 0, length = orderedModels.length; i < length; i++) {
            this.models.push(orderedModels[i]);
          }
        }
      }

      // Silently sort the collection if appropriate.
      if (sort) this.sort({silent: true});

      // Unless silenced, it's time to fire all appropriate add/sort events.
      if (!options.silent) {
        var addOpts = at != null ? _.clone(options) : options;
        for (var i = 0, length = toAdd.length; i < length; i++) {
          if (at != null) addOpts.index = at + i;
          (model = toAdd[i]).trigger('add', model, this, addOpts);
        }
        if (sort || orderChanged) this.trigger('sort', this, options);
      }

      // Return the added (or merged) model (or models).
      return singular ? models[0] : models;
    },

    // When you have more items than you want to add or remove individually,
    // you can reset the entire set with a new list of models, without firing
    // any granular `add` or `remove` events. Fires `reset` when finished.
    // Useful for bulk operations and optimizations.
    reset: function(models, options) {
      options = options ? _.clone(options) : {};
      for (var i = 0, length = this.models.length; i < length; i++) {
        this._removeReference(this.models[i], options);
      }
      options.previousModels = this.models;
      this._reset();
      models = this.add(models, _.extend({silent: true}, options));
      if (!options.silent) this.trigger('reset', this, options);
      return models;
    },

    // Add a model to the end of the collection.
    push: function(model, options) {
      return this.add(model, _.extend({at: this.length}, options));
    },

    // Remove a model from the end of the collection.
    pop: function(options) {
      var model = this.at(this.length - 1);
      this.remove(model, options);
      return model;
    },

    // Add a model to the beginning of the collection.
    unshift: function(model, options) {
      return this.add(model, _.extend({at: 0}, options));
    },

    // Remove a model from the beginning of the collection.
    shift: function(options) {
      var model = this.at(0);
      this.remove(model, options);
      return model;
    },

    // Slice out a sub-array of models from the collection.
    slice: function() {
      return slice.apply(this.models, arguments);
    },

    // Get a model from the set by id.
    get: function(obj) {
      if (obj == null) return void 0;
      var id = this.modelId(this._isModel(obj) ? obj.attributes : obj);
      return this._byId[obj] || this._byId[id] || this._byId[obj.cid];
    },

    // Get the model at the given index.
    at: function(index) {
      if (index < 0) index += this.length;
      return this.models[index];
    },

    // Return models with matching attributes. Useful for simple cases of
    // `filter`.
    where: function(attrs, first) {
      var matches = _.matches(attrs);
      return this[first ? 'find' : 'filter'](function(model) {
        return matches(model.attributes);
      });
    },

    // Return the first model with matching attributes. Useful for simple cases
    // of `find`.
    findWhere: function(attrs) {
      return this.where(attrs, true);
    },

    // Force the collection to re-sort itself. You don't need to call this under
    // normal circumstances, as the set will maintain sort order as each item
    // is added.
    sort: function(options) {
      if (!this.comparator) throw new Error('Cannot sort a set without a comparator');
      options || (options = {});

      // Run sort based on type of `comparator`.
      if (_.isString(this.comparator) || this.comparator.length === 1) {
        this.models = this.sortBy(this.comparator, this);
      } else {
        this.models.sort(_.bind(this.comparator, this));
      }

      if (!options.silent) this.trigger('sort', this, options);
      return this;
    },

    // Pluck an attribute from each model in the collection.
    pluck: function(attr) {
      return _.invoke(this.models, 'get', attr);
    },

    // Fetch the default set of models for this collection, resetting the
    // collection when they arrive. If `reset: true` is passed, the response
    // data will be passed through the `reset` method instead of `set`.
    fetch: function(options) {
      options = options ? _.clone(options) : {};
      if (options.parse === void 0) options.parse = true;
      var success = options.success;
      var collection = this;
      options.success = function(resp) {
        var method = options.reset ? 'reset' : 'set';
        collection[method](resp, options);
        if (success) success(collection, resp, options);
        collection.trigger('sync', collection, resp, options);
      };
      wrapError(this, options);
      return this.sync('read', this, options);
    },

    // Create a new instance of a model in this collection. Add the model to the
    // collection immediately, unless `wait: true` is passed, in which case we
    // wait for the server to agree.
    create: function(model, options) {
      options = options ? _.clone(options) : {};
      if (!(model = this._prepareModel(model, options))) return false;
      if (!options.wait) this.add(model, options);
      var collection = this;
      var success = options.success;
      options.success = function(model, resp) {
        if (options.wait) collection.add(model, options);
        if (success) success(model, resp, options);
      };
      model.save(null, options);
      return model;
    },

    // **parse** converts a response into a list of models to be added to the
    // collection. The default implementation is just to pass it through.
    parse: function(resp, options) {
      return resp;
    },

    // Create a new collection with an identical list of models as this one.
    clone: function() {
      return new this.constructor(this.models, {
        model: this.model,
        comparator: this.comparator
      });
    },

    // Define how to uniquely identify models in the collection.
    modelId: function (attrs) {
      return attrs[this.model.prototype.idAttribute || 'id'];
    },

    // Private method to reset all internal state. Called when the collection
    // is first initialized or reset.
    _reset: function() {
      this.length = 0;
      this.models = [];
      this._byId  = {};
    },

    // Prepare a hash of attributes (or other model) to be added to this
    // collection.
    _prepareModel: function(attrs, options) {
      if (this._isModel(attrs)) {
        if (!attrs.collection) attrs.collection = this;
        return attrs;
      }
      options = options ? _.clone(options) : {};
      options.collection = this;
      var model = new this.model(attrs, options);
      if (!model.validationError) return model;
      this.trigger('invalid', this, model.validationError, options);
      return false;
    },

    // Method for checking whether an object should be considered a model for
    // the purposes of adding to the collection.
    _isModel: function (model) {
      return model instanceof Model;
    },

    // Internal method to create a model's ties to a collection.
    _addReference: function(model, options) {
      this._byId[model.cid] = model;
      var id = this.modelId(model.attributes);
      if (id != null) this._byId[id] = model;
      model.on('all', this._onModelEvent, this);
    },

    // Internal method to sever a model's ties to a collection.
    _removeReference: function(model, options) {
      if (this === model.collection) delete model.collection;
      model.off('all', this._onModelEvent, this);
    },

    // Internal method called every time a model in the set fires an event.
    // Sets need to update their indexes when models change ids. All other
    // events simply proxy through. "add" and "remove" events that originate
    // in other collections are ignored.
    _onModelEvent: function(event, model, collection, options) {
      if ((event === 'add' || event === 'remove') && collection !== this) return;
      if (event === 'destroy') this.remove(model, options);
      if (event === 'change') {
        var prevId = this.modelId(model.previousAttributes());
        var id = this.modelId(model.attributes);
        if (prevId !== id) {
          if (prevId != null) delete this._byId[prevId];
          if (id != null) this._byId[id] = model;
        }
      }
      this.trigger.apply(this, arguments);
    }

  });

  // Underscore methods that we want to implement on the Collection.
  // 90% of the core usefulness of Backbone Collections is actually implemented
  // right here:
  var methods = ['forEach', 'each', 'map', 'collect', 'reduce', 'foldl',
    'inject', 'reduceRight', 'foldr', 'find', 'detect', 'filter', 'select',
    'reject', 'every', 'all', 'some', 'any', 'include', 'contains', 'invoke',
    'max', 'min', 'toArray', 'size', 'first', 'head', 'take', 'initial', 'rest',
    'tail', 'drop', 'last', 'without', 'difference', 'indexOf', 'shuffle',
    'lastIndexOf', 'isEmpty', 'chain', 'sample', 'partition'];

  // Mix in each Underscore method as a proxy to `Collection#models`.
  _.each(methods, function(method) {
    if (!_[method]) return;
    Collection.prototype[method] = function() {
      var args = slice.call(arguments);
      args.unshift(this.models);
      return _[method].apply(_, args);
    };
  });

  // Underscore methods that take a property name as an argument.
  var attributeMethods = ['groupBy', 'countBy', 'sortBy', 'indexBy'];

  // Use attributes instead of properties.
  _.each(attributeMethods, function(method) {
    if (!_[method]) return;
    Collection.prototype[method] = function(value, context) {
      var iterator = _.isFunction(value) ? value : function(model) {
        return model.get(value);
      };
      return _[method](this.models, iterator, context);
    };
  });

  // Backbone.View
  // -------------

  // Backbone Views are almost more convention than they are actual code. A View
  // is simply a JavaScript object that represents a logical chunk of UI in the
  // DOM. This might be a single item, an entire list, a sidebar or panel, or
  // even the surrounding frame which wraps your whole app. Defining a chunk of
  // UI as a **View** allows you to define your DOM events declaratively, without
  // having to worry about render order ... and makes it easy for the view to
  // react to specific changes in the state of your models.

  // Creating a Backbone.View creates its initial element outside of the DOM,
  // if an existing element is not provided...
  var View = Backbone.View = function(options) {
    this.cid = _.uniqueId('view');
    options || (options = {});
    _.extend(this, _.pick(options, viewOptions));
    this._ensureElement();
    this.initialize.apply(this, arguments);
  };

  // Cached regex to split keys for `delegate`.
  var delegateEventSplitter = /^(\S+)\s*(.*)$/;

  // List of view options to be merged as properties.
  var viewOptions = ['model', 'collection', 'el', 'id', 'attributes', 'className', 'tagName', 'events'];

  // Set up all inheritable **Backbone.View** properties and methods.
  _.extend(View.prototype, Events, {

    // The default `tagName` of a View's element is `"div"`.
    tagName: 'div',

    // jQuery delegate for element lookup, scoped to DOM elements within the
    // current view. This should be preferred to global lookups where possible.
    $: function(selector) {
      return this.$el.find(selector);
    },

    // Initialize is an empty function by default. Override it with your own
    // initialization logic.
    initialize: function(){},

    // **render** is the core function that your view should override, in order
    // to populate its element (`this.el`), with the appropriate HTML. The
    // convention is for **render** to always return `this`.
    render: function() {
      return this;
    },

    // Remove this view by taking the element out of the DOM, and removing any
    // applicable Backbone.Events listeners.
    remove: function() {
      this._removeElement();
      this.stopListening();
      return this;
    },

    // Remove this view's element from the document and all event listeners
    // attached to it. Exposed for subclasses using an alternative DOM
    // manipulation API.
    _removeElement: function() {
      this.$el.remove();
    },

    // Change the view's element (`this.el` property) and re-delegate the
    // view's events on the new element.
    setElement: function(element) {
      this.undelegateEvents();
      this._setElement(element);
      this.delegateEvents();
      return this;
    },

    // Creates the `this.el` and `this.$el` references for this view using the
    // given `el`. `el` can be a CSS selector or an HTML string, a jQuery
    // context or an element. Subclasses can override this to utilize an
    // alternative DOM manipulation API and are only required to set the
    // `this.el` property.
    _setElement: function(el) {
      this.$el = el instanceof Backbone.$ ? el : Backbone.$(el);
      this.el = this.$el[0];
    },

    // Set callbacks, where `this.events` is a hash of
    //
    // *{"event selector": "callback"}*
    //
    //     {
    //       'mousedown .title':  'edit',
    //       'click .button':     'save',
    //       'click .open':       function(e) { ... }
    //     }
    //
    // pairs. Callbacks will be bound to the view, with `this` set properly.
    // Uses event delegation for efficiency.
    // Omitting the selector binds the event to `this.el`.
    delegateEvents: function(events) {
      if (!(events || (events = _.result(this, 'events')))) return this;
      this.undelegateEvents();
      for (var key in events) {
        var method = events[key];
        if (!_.isFunction(method)) method = this[events[key]];
        if (!method) continue;
        var match = key.match(delegateEventSplitter);
        this.delegate(match[1], match[2], _.bind(method, this));
      }
      return this;
    },

    // Add a single event listener to the view's element (or a child element
    // using `selector`). This only works for delegate-able events: not `focus`,
    // `blur`, and not `change`, `submit`, and `reset` in Internet Explorer.
    delegate: function(eventName, selector, listener) {
      this.$el.on(eventName + '.delegateEvents' + this.cid, selector, listener);
    },

    // Clears all callbacks previously bound to the view by `delegateEvents`.
    // You usually don't need to use this, but may wish to if you have multiple
    // Backbone views attached to the same DOM element.
    undelegateEvents: function() {
      if (this.$el) this.$el.off('.delegateEvents' + this.cid);
      return this;
    },

    // A finer-grained `undelegateEvents` for removing a single delegated event.
    // `selector` and `listener` are both optional.
    undelegate: function(eventName, selector, listener) {
      this.$el.off(eventName + '.delegateEvents' + this.cid, selector, listener);
    },

    // Produces a DOM element to be assigned to your view. Exposed for
    // subclasses using an alternative DOM manipulation API.
    _createElement: function(tagName) {
      return document.createElement(tagName);
    },

    // Ensure that the View has a DOM element to render into.
    // If `this.el` is a string, pass it through `$()`, take the first
    // matching element, and re-assign it to `el`. Otherwise, create
    // an element from the `id`, `className` and `tagName` properties.
    _ensureElement: function() {
      if (!this.el) {
        var attrs = _.extend({}, _.result(this, 'attributes'));
        if (this.id) attrs.id = _.result(this, 'id');
        if (this.className) attrs['class'] = _.result(this, 'className');
        this.setElement(this._createElement(_.result(this, 'tagName')));
        this._setAttributes(attrs);
      } else {
        this.setElement(_.result(this, 'el'));
      }
    },

    // Set attributes from a hash on this view's element.  Exposed for
    // subclasses using an alternative DOM manipulation API.
    _setAttributes: function(attributes) {
      this.$el.attr(attributes);
    }

  });

  // Backbone.sync
  // -------------

  // Override this function to change the manner in which Backbone persists
  // models to the server. You will be passed the type of request, and the
  // model in question. By default, makes a RESTful Ajax request
  // to the model's `url()`. Some possible customizations could be:
  //
  // * Use `setTimeout` to batch rapid-fire updates into a single request.
  // * Send up the models as XML instead of JSON.
  // * Persist models via WebSockets instead of Ajax.
  //
  // Turn on `Backbone.emulateHTTP` in order to send `PUT` and `DELETE` requests
  // as `POST`, with a `_method` parameter containing the true HTTP method,
  // as well as all requests with the body as `application/x-www-form-urlencoded`
  // instead of `application/json` with the model in a param named `model`.
  // Useful when interfacing with server-side languages like **PHP** that make
  // it difficult to read the body of `PUT` requests.
  Backbone.sync = function(method, model, options) {
    var type = methodMap[method];

    // Default options, unless specified.
    _.defaults(options || (options = {}), {
      emulateHTTP: Backbone.emulateHTTP,
      emulateJSON: Backbone.emulateJSON
    });

    // Default JSON-request options.
    var params = {type: type, dataType: 'json'};

    // Ensure that we have a URL.
    if (!options.url) {
      params.url = _.result(model, 'url') || urlError();
    }

    // Ensure that we have the appropriate request data.
    if (options.data == null && model && (method === 'create' || method === 'update' || method === 'patch')) {
      params.contentType = 'application/json';
      params.data = JSON.stringify(options.attrs || model.toJSON(options));
    }

    // For older servers, emulate JSON by encoding the request into an HTML-form.
    if (options.emulateJSON) {
      params.contentType = 'application/x-www-form-urlencoded';
      params.data = params.data ? {model: params.data} : {};
    }

    // For older servers, emulate HTTP by mimicking the HTTP method with `_method`
    // And an `X-HTTP-Method-Override` header.
    if (options.emulateHTTP && (type === 'PUT' || type === 'DELETE' || type === 'PATCH')) {
      params.type = 'POST';
      if (options.emulateJSON) params.data._method = type;
      var beforeSend = options.beforeSend;
      options.beforeSend = function(xhr) {
        xhr.setRequestHeader('X-HTTP-Method-Override', type);
        if (beforeSend) return beforeSend.apply(this, arguments);
      };
    }

    // Don't process data on a non-GET request.
    if (params.type !== 'GET' && !options.emulateJSON) {
      params.processData = false;
    }

    // Pass along `textStatus` and `errorThrown` from jQuery.
    var error = options.error;
    options.error = function(xhr, textStatus, errorThrown) {
      options.textStatus = textStatus;
      options.errorThrown = errorThrown;
      if (error) error.apply(this, arguments);
    };

    // Make the request, allowing the user to override any Ajax options.
    var xhr = options.xhr = Backbone.ajax(_.extend(params, options));
    model.trigger('request', model, xhr, options);
    return xhr;
  };

  // Map from CRUD to HTTP for our default `Backbone.sync` implementation.
  var methodMap = {
    'create': 'POST',
    'update': 'PUT',
    'patch':  'PATCH',
    'delete': 'DELETE',
    'read':   'GET'
  };

  // Set the default implementation of `Backbone.ajax` to proxy through to `$`.
  // Override this if you'd like to use a different library.
  Backbone.ajax = function() {
    return Backbone.$.ajax.apply(Backbone.$, arguments);
  };

  // Backbone.Router
  // ---------------

  // Routers map faux-URLs to actions, and fire events when routes are
  // matched. Creating a new one sets its `routes` hash, if not set statically.
  var Router = Backbone.Router = function(options) {
    options || (options = {});
    if (options.routes) this.routes = options.routes;
    this._bindRoutes();
    this.initialize.apply(this, arguments);
  };

  // Cached regular expressions for matching named param parts and splatted
  // parts of route strings.
  var optionalParam = /\((.*?)\)/g;
  var namedParam    = /(\(\?)?:\w+/g;
  var splatParam    = /\*\w+/g;
  var escapeRegExp  = /[\-{}\[\]+?.,\\\^$|#\s]/g;

  // Set up all inheritable **Backbone.Router** properties and methods.
  _.extend(Router.prototype, Events, {

    // Initialize is an empty function by default. Override it with your own
    // initialization logic.
    initialize: function(){},

    // Manually bind a single named route to a callback. For example:
    //
    //     this.route('search/:query/p:num', 'search', function(query, num) {
    //       ...
    //     });
    //
    route: function(route, name, callback) {
      if (!_.isRegExp(route)) route = this._routeToRegExp(route);
      if (_.isFunction(name)) {
        callback = name;
        name = '';
      }
      if (!callback) callback = this[name];
      var router = this;
      Backbone.history.route(route, function(fragment) {
        var args = router._extractParameters(route, fragment);
        if (router.execute(callback, args, name) !== false) {
          router.trigger.apply(router, ['route:' + name].concat(args));
          router.trigger('route', name, args);
          Backbone.history.trigger('route', router, name, args);
        }
      });
      return this;
    },

    // Execute a route handler with the provided parameters.  This is an
    // excellent place to do pre-route setup or post-route cleanup.
    execute: function(callback, args, name) {
      if (callback) callback.apply(this, args);
    },

    // Simple proxy to `Backbone.history` to save a fragment into the history.
    navigate: function(fragment, options) {
      Backbone.history.navigate(fragment, options);
      return this;
    },

    // Bind all defined routes to `Backbone.history`. We have to reverse the
    // order of the routes here to support behavior where the most general
    // routes can be defined at the bottom of the route map.
    _bindRoutes: function() {
      if (!this.routes) return;
      this.routes = _.result(this, 'routes');
      var route, routes = _.keys(this.routes);
      while ((route = routes.pop()) != null) {
        this.route(route, this.routes[route]);
      }
    },

    // Convert a route string into a regular expression, suitable for matching
    // against the current location hash.
    _routeToRegExp: function(route) {
      route = route.replace(escapeRegExp, '\\$&')
                   .replace(optionalParam, '(?:$1)?')
                   .replace(namedParam, function(match, optional) {
                     return optional ? match : '([^/?]+)';
                   })
                   .replace(splatParam, '([^?]*?)');
      return new RegExp('^' + route + '(?:\\?([\\s\\S]*))?$');
    },

    // Given a route, and a URL fragment that it matches, return the array of
    // extracted decoded parameters. Empty or unmatched parameters will be
    // treated as `null` to normalize cross-browser behavior.
    _extractParameters: function(route, fragment) {
      var params = route.exec(fragment).slice(1);
      return _.map(params, function(param, i) {
        // Don't decode the search params.
        if (i === params.length - 1) return param || null;
        return param ? decodeURIComponent(param) : null;
      });
    }

  });

  // Backbone.History
  // ----------------

  // Handles cross-browser history management, based on either
  // [pushState](http://diveintohtml5.info/history.html) and real URLs, or
  // [onhashchange](https://developer.mozilla.org/en-US/docs/DOM/window.onhashchange)
  // and URL fragments. If the browser supports neither (old IE, natch),
  // falls back to polling.
  var History = Backbone.History = function() {
    this.handlers = [];
    _.bindAll(this, 'checkUrl');

    // Ensure that `History` can be used outside of the browser.
    if (typeof window !== 'undefined') {
      this.location = window.location;
      this.history = window.history;
    }
  };

  // Cached regex for stripping a leading hash/slash and trailing space.
  var routeStripper = /^[#\/]|\s+$/g;

  // Cached regex for stripping leading and trailing slashes.
  var rootStripper = /^\/+|\/+$/g;

  // Cached regex for stripping urls of hash.
  var pathStripper = /#.*$/;

  // Has the history handling already been started?
  History.started = false;

  // Set up all inheritable **Backbone.History** properties and methods.
  _.extend(History.prototype, Events, {

    // The default interval to poll for hash changes, if necessary, is
    // twenty times a second.
    interval: 50,

    // Are we at the app root?
    atRoot: function() {
      var path = this.location.pathname.replace(/[^\/]$/, '$&/');
      return path === this.root && !this.getSearch();
    },

    // In IE6, the hash fragment and search params are incorrect if the
    // fragment contains `?`.
    getSearch: function() {
      var match = this.location.href.replace(/#.*/, '').match(/\?.+/);
      return match ? match[0] : '';
    },

    // Gets the true hash value. Cannot use location.hash directly due to bug
    // in Firefox where location.hash will always be decoded.
    getHash: function(window) {
      var match = (window || this).location.href.match(/#(.*)$/);
      return match ? match[1] : '';
    },

    // Get the pathname and search params, without the root.
    getPath: function() {
      var path = decodeURI(this.location.pathname + this.getSearch());
      var root = this.root.slice(0, -1);
      if (!path.indexOf(root)) path = path.slice(root.length);
      return path.charAt(0) === '/' ? path.slice(1) : path;
    },

    // Get the cross-browser normalized URL fragment from the path or hash.
    getFragment: function(fragment) {
      if (fragment == null) {
        if (this._hasPushState || !this._wantsHashChange) {
          fragment = this.getPath();
        } else {
          fragment = this.getHash();
        }
      }
      return fragment.replace(routeStripper, '');
    },

    // Start the hash change handling, returning `true` if the current URL matches
    // an existing route, and `false` otherwise.
    start: function(options) {
      if (History.started) throw new Error('Backbone.history has already been started');
      History.started = true;

      // Figure out the initial configuration. Do we need an iframe?
      // Is pushState desired ... is it available?
      this.options          = _.extend({root: '/'}, this.options, options);
      this.root             = this.options.root;
      this._wantsHashChange = this.options.hashChange !== false;
      this._hasHashChange   = 'onhashchange' in window;
      this._wantsPushState  = !!this.options.pushState;
      this._hasPushState    = !!(this.options.pushState && this.history && this.history.pushState);
      this.fragment         = this.getFragment();

      // Normalize root to always include a leading and trailing slash.
      this.root = ('/' + this.root + '/').replace(rootStripper, '/');

      // Transition from hashChange to pushState or vice versa if both are
      // requested.
      if (this._wantsHashChange && this._wantsPushState) {

        // If we've started off with a route from a `pushState`-enabled
        // browser, but we're currently in a browser that doesn't support it...
        if (!this._hasPushState && !this.atRoot()) {
          var root = this.root.slice(0, -1) || '/';
          this.location.replace(root + '#' + this.getPath());
          // Return immediately as browser will do redirect to new url
          return true;

        // Or if we've started out with a hash-based route, but we're currently
        // in a browser where it could be `pushState`-based instead...
        } else if (this._hasPushState && this.atRoot()) {
          this.navigate(this.getHash(), {replace: true});
        }

      }

      // Proxy an iframe to handle location events if the browser doesn't
      // support the `hashchange` event, HTML5 history, or the user wants
      // `hashChange` but not `pushState`.
      if (!this._hasHashChange && this._wantsHashChange && (!this._wantsPushState || !this._hasPushState)) {
        var iframe = document.createElement('iframe');
        iframe.src = 'javascript:0';
        iframe.style.display = 'none';
        iframe.tabIndex = -1;
        var body = document.body;
        // Using `appendChild` will throw on IE < 9 if the document is not ready.
        this.iframe = body.insertBefore(iframe, body.firstChild).contentWindow;
        this.iframe.document.open().close();
        this.iframe.location.hash = '#' + this.fragment;
      }

      // Add a cross-platform `addEventListener` shim for older browsers.
      var addEventListener = window.addEventListener || function (eventName, listener) {
        return attachEvent('on' + eventName, listener);
      };

      // Depending on whether we're using pushState or hashes, and whether
      // 'onhashchange' is supported, determine how we check the URL state.
      if (this._hasPushState) {
        addEventListener('popstate', this.checkUrl, false);
      } else if (this._wantsHashChange && this._hasHashChange && !this.iframe) {
        addEventListener('hashchange', this.checkUrl, false);
      } else if (this._wantsHashChange) {
        this._checkUrlInterval = setInterval(this.checkUrl, this.interval);
      }

      if (!this.options.silent) return this.loadUrl();
    },

    // Disable Backbone.history, perhaps temporarily. Not useful in a real app,
    // but possibly useful for unit testing Routers.
    stop: function() {
      // Add a cross-platform `removeEventListener` shim for older browsers.
      var removeEventListener = window.removeEventListener || function (eventName, listener) {
        return detachEvent('on' + eventName, listener);
      };

      // Remove window listeners.
      if (this._hasPushState) {
        removeEventListener('popstate', this.checkUrl, false);
      } else if (this._wantsHashChange && this._hasHashChange && !this.iframe) {
        removeEventListener('hashchange', this.checkUrl, false);
      }

      // Clean up the iframe if necessary.
      if (this.iframe) {
        document.body.removeChild(this.iframe.frameElement);
        this.iframe = null;
      }

      // Some environments will throw when clearing an undefined interval.
      if (this._checkUrlInterval) clearInterval(this._checkUrlInterval);
      History.started = false;
    },

    // Add a route to be tested when the fragment changes. Routes added later
    // may override previous routes.
    route: function(route, callback) {
      this.handlers.unshift({route: route, callback: callback});
    },

    // Checks the current URL to see if it has changed, and if it has,
    // calls `loadUrl`, normalizing across the hidden iframe.
    checkUrl: function(e) {
      var current = this.getFragment();

      // If the user pressed the back button, the iframe's hash will have
      // changed and we should use that for comparison.
      if (current === this.fragment && this.iframe) {
        current = this.getHash(this.iframe);
      }

      if (current === this.fragment) return false;
      if (this.iframe) this.navigate(current);
      this.loadUrl();
    },

    // Attempt to load the current URL fragment. If a route succeeds with a
    // match, returns `true`. If no defined routes matches the fragment,
    // returns `false`.
    loadUrl: function(fragment) {
      fragment = this.fragment = this.getFragment(fragment);
      return _.any(this.handlers, function(handler) {
        if (handler.route.test(fragment)) {
          handler.callback(fragment);
          return true;
        }
      });
    },

    // Save a fragment into the hash history, or replace the URL state if the
    // 'replace' option is passed. You are responsible for properly URL-encoding
    // the fragment in advance.
    //
    // The options object can contain `trigger: true` if you wish to have the
    // route callback be fired (not usually desirable), or `replace: true`, if
    // you wish to modify the current URL without adding an entry to the history.
    navigate: function(fragment, options) {
      if (!History.started) return false;
      if (!options || options === true) options = {trigger: !!options};

      // Normalize the fragment.
      fragment = this.getFragment(fragment || '');

      // Don't include a trailing slash on the root.
      var root = this.root;
      if (fragment === '' || fragment.charAt(0) === '?') {
        root = root.slice(0, -1) || '/';
      }
      var url = root + fragment;

      // Strip the hash and decode for matching.
      fragment = decodeURI(fragment.replace(pathStripper, ''));

      if (this.fragment === fragment) return;
      this.fragment = fragment;

      // If pushState is available, we use it to set the fragment as a real URL.
      if (this._hasPushState) {
        this.history[options.replace ? 'replaceState' : 'pushState']({}, document.title, url);

      // If hash changes haven't been explicitly disabled, update the hash
      // fragment to store history.
      } else if (this._wantsHashChange) {
        this._updateHash(this.location, fragment, options.replace);
        if (this.iframe && (fragment !== this.getHash(this.iframe))) {
          // Opening and closing the iframe tricks IE7 and earlier to push a
          // history entry on hash-tag change.  When replace is true, we don't
          // want this.
          if (!options.replace) this.iframe.document.open().close();
          this._updateHash(this.iframe.location, fragment, options.replace);
        }

      // If you've told us that you explicitly don't want fallback hashchange-
      // based history, then `navigate` becomes a page refresh.
      } else {
        return this.location.assign(url);
      }
      if (options.trigger) return this.loadUrl(fragment);
    },

    // Update the hash location, either replacing the current entry, or adding
    // a new one to the browser history.
    _updateHash: function(location, fragment, replace) {
      if (replace) {
        var href = location.href.replace(/(javascript:|#).*$/, '');
        location.replace(href + '#' + fragment);
      } else {
        // Some browsers require that `hash` contains a leading #.
        location.hash = '#' + fragment;
      }
    }

  });

  // Create the default Backbone.history.
  Backbone.history = new History;

  // Helpers
  // -------

  // Helper function to correctly set up the prototype chain, for subclasses.
  // Similar to `goog.inherits`, but uses a hash of prototype properties and
  // class properties to be extended.
  var extend = function(protoProps, staticProps) {
    var parent = this;
    var child;

    // The constructor function for the new subclass is either defined by you
    // (the "constructor" property in your `extend` definition), or defaulted
    // by us to simply call the parent's constructor.
    if (protoProps && _.has(protoProps, 'constructor')) {
      child = protoProps.constructor;
    } else {
      child = function(){ return parent.apply(this, arguments); };
    }

    // Add static properties to the constructor function, if supplied.
    _.extend(child, parent, staticProps);

    // Set the prototype chain to inherit from `parent`, without calling
    // `parent`'s constructor function.
    var Surrogate = function(){ this.constructor = child; };
    Surrogate.prototype = parent.prototype;
    child.prototype = new Surrogate;

    // Add prototype properties (instance properties) to the subclass,
    // if supplied.
    if (protoProps) _.extend(child.prototype, protoProps);

    // Set a convenience property in case the parent's prototype is needed
    // later.
    child.__super__ = parent.prototype;

    return child;
  };

  // Set up inheritance for the model, collection, router, view and history.
  Model.extend = Collection.extend = Router.extend = View.extend = History.extend = extend;

  // Throw an error when a URL is needed, and none is supplied.
  var urlError = function() {
    throw new Error('A "url" property or function must be specified');
  };

  // Wrap an optional error callback with a fallback error event.
  var wrapError = function(model, options) {
    var error = options.error;
    options.error = function(resp) {
      if (error) error(model, resp, options);
      model.trigger('error', model, resp, options);
    };
  };

  return Backbone;

}));
;(function ($) {
  /***************************
  l_wang 提升点击响应速度
  *****************************/

  //需要用到的变量定义
  var trackingClick = false,
    trackingStart = 0, lastClickTime = 0, cancelNextClick = false, el = null, startX = 0, startY = 0, endX = 0, endY = 0, boundary = 4, isAndriond = navigator.userAgent.indexOf('Android') > 0, isIOS = /iP(ad|hone|od)/.test(navigator.userAgent), lastTouchIdentifier = 0, IOSWithBadTarget = isIOS && (/OS ([6-9]|\d{2})_\d/).test(navigator.userAgent);

  function onTouchStart(e) {
    if (e.targetTouches.length > 1) {
      return true;
    }

    //改变获取焦点位置，解决获取焦点难问题
    el = e.target;

    var no_el = $(el).closest('.nofastclick');
    if (no_el.length > 0 || needFocus(el)) return true;

    if (isIOS) {
      var selection = window.getSelection();
      if (selection.rangeCount && !selection.isCollapsed) {
        return true;
      }
      if (e.targetTouches[0].identifier === lastTouchIdentifier) {
        event.preventDefault();
        return false;
      }
      lastTouchIdentifier = e.targetTouches[0].identifier;
    }

    trackingClick = true;
    trackingStart = e.timeStamp;
    startX = e.targetTouches[0].pageX;
    startY = e.targetTouches[0].pageY;

    //解决用户修改服务器时间问题
    if (e.timeStamp - lastClickTime < 0) lastClickTime = e.timeStamp;

    if (e.timeStamp - lastClickTime < 200) e.preventDefault();

    return true;
  }
  function onTouchMove(e) {
    if (!trackingClick) return true;
    endX = e.changedTouches[0].pageX;
    endY = e.changedTouches[0].pageY;

    if (Math.abs(endX - startX) > boundary || Math.abs(endY - startY) > boundary) {
      el = null;
      trackingClick = false;
    }
    return true; ;
  }

  function onTouchEnd(e) {
    if (!trackingClick) return true;

    if ((e.timeStamp - lastClickTime) < 200) { cancelNextClick = true; return true; }

    lastClickTime = e.timeStamp;
    trackingClick = false;
    var tagName = el.tagName.toLowerCase();
    if (tagName == 'label') {
      var forEl = findControl(el);
      if (forEl) {
        var _el = $(forEl);
        if (_el.attr('type') == 'checkbox' || _el.attr('type') == 'radio') {
          if (_el.attr('checked')) _el.removeAttr('checked');
          else _el.attr('checked', 'checked')
        } else {
          $(forEl).focus();
        }
        if (isAndriond) return false;
        el = forEl;
      }
    }

    else if (needFocus(el)) {
      if ((e.timeStamp - trackingStart) > 100) {
        el = null;
        return false;
      }
      //      if (IOSWithBadTarget) {
      //        //解决ios7点击问题，看着这个代码我真想打自己......
      //        el.blur();
      //      }

      var length;
      if (isIOS && el.setSelectionRange && el.type.indexOf('date') !== 0 && el.type !== 'time') {
        length = el.value.length;
        el.setSelectionRange(length, length);
      } else {
        el.focus();
      }

      if (tagName !== 'select') {
        el = null;
        e.preventDefault();
      }
      return false;
    }

    trackingStart = 0;

    if (!needClick(el)) {
      e.preventDefault();
      sendClick(el, e);
    }
    return false;
  }

  function onTouchCancel(e) {
    trackingClick = false;
    el = null;
  }
  function onMouse(e) {
    var el1 = e.target;
    var no_el = $(el1).closest('.nofastclick');
    if (no_el.length > 0 || needFocus(el1)) return true;

    if (!el) return true;
    if (e.touchEvent) return true; //表示为自己触发便跳出了
    if (!e.cancelable) return true;
    if (!needClick(el) || cancelNextClick) {
      if (e.stopImmediatePropagation) e.stopImmediatePropagation();
      else e.propagationStopped = true;
      e.stopPropagation();
      e.preventDefault();
      return false;
    }
    return true;
  }
  function onClick(e) {
    //只有touchend才能让他为true，所以这里直接跳出了
    if (trackingClick) {
      trackingClick = false;
      el = null;
      return true;
    }
    if (e.target.type === 'submit' && e.detail === 0) return true;
    var permitted = onMouse(e);
    if (!permitted) el = null;
    return permitted;
  }
  function needClick(el) {
    switch (el.nodeName.toLowerCase()) {
      case 'button':
      case 'select':
      case 'textarea':
        if (el.disabled) return true;
        break;
      case 'input':
        if ((isIOS && el.type === 'file') || el.disabled) return true;
        break;
      //	    case 'label':              
      case 'video':
        return true;
    }
    return (/\bneedclick\b/).test(el.className);
  }
  function needFocus(el) {
    switch (el.nodeName.toLowerCase()) {
      case 'textarea':
      case 'select':
        return true;
      case 'input':
        switch (el.type) {
          case 'button':
          case 'checkbox':
          case 'file':
          case 'image':
          case 'radio':
          case 'submit':
            return false;
        }
        return !el.disabled && !el.readOnly;
      default:
        return (/\bneedfocus\b/).test(el.className);
    }
  }
  function findControl(el) {
    if (el.control !== undefined) return el.control;
    if (el.htmlFor) return document.getElementById(el.htmlFor);
    return el.querySelector('button, input:not([type=hidden]), keygen, meter, output, progress, select, textarea');
  }
  function sendClick(el, e) {
    var clickEvent, touch;
    if (document.activeElement && document.activeElement !== el) {
      document.activeElement.blur();
    }
    touch = e.changedTouches[0];
    clickEvent = document.createEvent('MouseEvents');
    clickEvent.initMouseEvent('click', true, true, window, 1, touch.screenX, touch.screenY, touch.clientX, touch.clientY, false, false, false, false, 0, null);
    clickEvent.touchEvent = true;
    el.dispatchEvent(clickEvent);
  }
  function needFast() {

    //    if (navigator.userAgent.indexOf('MQQBrowser') > 0) return false;
    if (typeof window.ontouchstart === 'undefined') return false;
    return true;
  }

  //该接口公开
  $.needFocus = needFocus;

  $.bindFastClick = function () {
    if (!needFast()) {
      return true;
    }

    $(document).ready(function () {
      if (isAndriond) {
        document.addEventListener('mouseover', onMouse, true);
        document.addEventListener('mousedown', onMouse, true);
        document.addEventListener('mouseup', onMouse, true);
      }
      document.addEventListener('click', onClick, true);
      $(document).on('touchstart', onTouchStart)
            .on('touchmove', onTouchMove)
            .on('touchend', onTouchEnd)
            .on('touchcancel', onTouchCancel);
    });
  }
  $.unbindFastClick = function () {
    if (!needFast()) {
      return true;
    }
    if (isAndriond) {
      document.removeEventListener('mouseover', onMouse, true);
      document.removeEventListener('mousedown', onMouse, true);
      document.removeEventListener('mouseup', onMouse, true);
    }
    document.removeEventListener('click', onClick, true);
    $(document).off('touchstart', onTouchStart)
        .off('touchmove', onTouchMove)
        .off('touchend', onTouchEnd)
        .off('touchcancel', onTouchCancel);
  }
})(Zepto)

;(function () {

  //项目根路径，这个会跟着外层入口index.html而变化
  var srcDir = "./blade/";
  //模板路径

  require.config({
    // baseUrl: srcDir,
    shim: {
      $: {
        exports: "Zepto"
      },
      _: {
        exports: "_"
      },
      B: {
        deps: ["_", "$"],
        exports: "Backbone"
      },
      F: {
        deps: ["$"],
        exports: "Fastclick"
      },
      libs: {
        deps: ["_", "$", "B"],
        exports: "libs"
      },
      common: {
        deps: ["libs"]
      },
      cAjax: {
        exports: "cAjax"
      },
      UIView: {
        deps: ["B"],
        exports: "UIView"
      },
    },
    paths: {
      //依赖部分
      "R": srcDir + "libs/require",
      "$": srcDir + "libs/zepto",
      "_": srcDir + "libs/underscore",
      "B": srcDir + "libs/backbone",
      "F": srcDir + "libs/fastclick",
      "libs": srcDir + "libs/libs",
      // "text": srcDir + "libs/require.text",
      // "cInherit": srcDir + "common/c.inherit",

      //核心部分：
      "text": srcDir + "libs/require.text",
      "cAjax": srcDir + "mvc/c.ajax",
      // "cInherit": srcDir + "common/c.inherit",
      "AbstractApp": srcDir + "mvc/abstract.app",
      "AbstractModel": srcDir + "mvc/abstract.model",
      "AbstractView": srcDir + "mvc/abstract.view",

      //工具类
      "cDetect": srcDir + "common/c.detect",
      "cValidate": srcDir + "common/c.validate",
      "cSchema": srcDir + "common/c.schema",
      "cCount": srcDir + "common/c.count", //统计
      // "cLazyload": srcDir + "common/c.lazyload",

      //data
      "cUtilDate": srcDir + "util/c.util.date",
      "cUtilObject": srcDir + "util/c.util.object",
      "cAbstractStorage": srcDir + "data/storage/c.abstract.storage",
      "cLocalStorage": srcDir + "data/storage/c.local.storage",

      "cAbstractStore": srcDir + "data/store/c.abstract.store",
      "cLocalStore": srcDir + "data/store/c.local.store",

      //UI 组件
      //抽象view
      "UIView": srcDir + "ui/core.abstract.view",
      "C_UIView": srcDir + "ui/core.abstract.view.css",

      //头部组件
      "UIHeader": srcDir + "ui/core.header",
      "T_UIHeader": srcDir + "ui/core.header.html",
      "C_UIHeader": srcDir + "ui/core.header.css",


      //基础组件部分

      "LazyLoad": srcDir + "function/lazyload",
      "Swiper": srcDir + "function/swiper",  //extend
      "UISwiper": srcDir + "ui/ui.swiper",
      "UIDownTip": srcDir + "ui/ui.downtip",

      //蒙版
      "UIMask": srcDir + "ui/ui.mask",
      // "C_UIMask": srcDir + "ui/ui.mask.css",

      //弹出层基类
      "UILayer": srcDir + "ui/ui.layer",
      "T_UILayer": srcDir + "ui/ui.layer.html",
      // "C_UILayer": srcDir + "ui/ui.layer.css",

      //loading弹出层
      "UILoadingLayer": srcDir + "ui/ui.loading.layer",
      "T_UILoadingLayer": srcDir + "ui/ui.loading.layer.html",
      // "C_UILoadingLayer": srcDir + "ui/ui.loading.layer.css",

      //toast提升
      "UIToast": srcDir + "ui/ui.toast",
      "T_UIToast": srcDir + "ui/ui.toast.html",
      // "C_UIToast": srcDir + "ui/ui.toast.css",
      //
      // //404提示
      // "UIWarning404": srcDir + "ui/ui.warning404",
      // "T_UIWarning404": srcDir + "ui/ui.warning404.html",
      // "C_UIWarning404": srcDir + "ui/ui.warning404.css",

      //alert组件
      "UIAlert": srcDir + "ui/ui.alert",
      "T_UIAlert": srcDir + "ui/ui.alert.html",
      //
      // //扩展组件部分
      // //
      //
      // //气泡组件
      // "UIBubbleLayer": srcDir + "ui/ui.bubble.layer",
      // "T_UIBubbleLayer": srcDir + "ui/ui.bubble.layer.html",
      // "C_UIBubbleLayer": srcDir + "ui/ui.bubble.layer.css",
      //
      // //日历
      // "UICalendar": srcDir + "ui/ui.calendar",
      // "T_UICalendar": srcDir + "ui/ui.calendar.html",
      // "C_UICalendar": srcDir + "ui/ui.calendar.css",
      //
      // //分组列表
      // "UIGroupList": srcDir + "ui/ui.group.list",
      // "T_UIGroupList": srcDir + "ui/ui.group.list.html",
      // "C_UIGroupList": srcDir + "ui/ui.group.list.css",
      //
      // //身份证组件
      // "UIIdentitycard": srcDir + "ui/ui.identitycard",
      // "T_UIIdentitycard": srcDir + "ui/ui.identitycard.html",
      // "C_UIIdentitycard": srcDir + "ui/ui.identitycard.css",
      //
      // //图片轮播
      // "UIImageSlider": srcDir + "ui/ui.image.slider",
      //
      // //底部弹出层列表
      // "UILayerList": srcDir + "ui/ui.layer.list",
      // "T_UILayerList": srcDir + "ui/ui.layer.list.html",
      // "C_UILayerList": srcDir + "ui/ui.layer.list.css",
      //
      // //数字组件
      // "UINum": srcDir + "ui/ui.num",
      // "T_UINum": srcDir + "ui/ui.num.html",
      // "C_UINum": srcDir + "ui/ui.num.css",
      //
      // //可拖动选择弹出层
      // "UIRadioList": srcDir + "ui/ui.radio.list",
      // "T_UIRadioList": srcDir + "ui/ui.radio.list.html",
      //
      // //IScroll滚动基类
      // "UIScroll": srcDir + "ui/ui.scroll",
      //
      // //滚动容器层
      // "UIScrollLayer": srcDir + "ui/ui.scroll.layer",
      // "T_UIScrollLayer": srcDir + "ui/ui.radio.layer.html",
      //
      // //select组件
      // "UISelect": srcDir + "ui/ui.select",
      // "T_UISelect": srcDir + "ui/ui.select.html",
      // "C_UISelect": srcDir + "ui/ui.select.css",
      //
      // //slider横向滚动组件
      // "UISlider": srcDir + "ui/ui.slider",
      // "T_UISlider": srcDir + "ui/ui.slider.html",
      // "C_UISlider": srcDir + "ui/ui.slider.css",
      //
      // //switch组件
      // "UISwitch": srcDir + "ui/ui.switch",
      // "T_UISwitch": srcDir + "ui/ui.switch.html",
      // "C_UISwitch": srcDir + "ui/ui.switch.css",
      //
      // //tab组件
      // "UITab": srcDir + "ui/ui.tab",
      // "T_UITab": srcDir + "ui/ui.tab.html",
      // "C_UITab": srcDir + "ui/ui.tab.css",

      //"cHighlight": srcDir + "common/c.highlight",


      "cPageView": srcDir + "page/c.page.view",
      "cPageList": srcDir + "page/c.page.list",
    },
    "map": {
      // TODO：这个没起效果 !!!
      "*": {
        // "cUtility": "cUtilCommon",
        "cStore": "cLocalStore",
        // "cGuider": "cGuiderService",
        // "CommonStore":"cCommonStore"
      }
    }

  });

})();
