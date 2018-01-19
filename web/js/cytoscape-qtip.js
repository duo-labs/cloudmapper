/*!
Copyright (c) The Cytoscape Consortium

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the “Software”), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
of the Software, and to permit persons to whom the Software is furnished to do
so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

;(function( $, $$ ){ 'use strict';

  var isObject = function(o){
    return o != null && typeof o === 'object';
  };

  var isFunction = function(o){
    return o != null && typeof o === 'function';
  };

  var isNumber = function(o){
    return o != null && typeof o === 'number';
  };

  var isString = function(o){
    return o != null && typeof o === 'string';
  };

  var isUndef = function(o){
    return o === undefined;
  };

  var wrap = function(obj, target) {
    if( isFunction(obj) ) {
      return function(event, api){
        return obj.apply( target, [event, api] );
      };
    } else {
      return obj;
    }
  };

  var throttle = function(func, wait, options) {
    var leading = true,
        trailing = true;

    if (options === false) {
      leading = false;
    } else if (isObject(options)) {
      leading = 'leading' in options ? options.leading : leading;
      trailing = 'trailing' in options ? options.trailing : trailing;
    }
    options = options || {};
    options.leading = leading;
    options.maxWait = wait;
    options.trailing = trailing;

    return debounce(func, wait, options);
  };

  var debounce = function(func, wait, options) { // ported lodash debounce function
    var args,
        maxTimeoutId,
        result,
        stamp,
        thisArg,
        timeoutId,
        trailingCall,
        lastCalled = 0,
        maxWait = false,
        trailing = true;

    if (!isFunction(func)) {
      return;
    }
    wait = Math.max(0, wait) || 0;
    if (options === true) {
      var leading = true;
      trailing = false;
    } else if (isObject(options)) {
      leading = options.leading;
      maxWait = 'maxWait' in options && (Math.max(wait, options.maxWait) || 0);
      trailing = 'trailing' in options ? options.trailing : trailing;
    }
    var delayed = function() {
      var remaining = wait - (Date.now() - stamp);
      if (remaining <= 0) {
        if (maxTimeoutId) {
          clearTimeout(maxTimeoutId);
        }
        var isCalled = trailingCall;
        maxTimeoutId = timeoutId = trailingCall = undefined;
        if (isCalled) {
          lastCalled = Date.now();
          result = func.apply(thisArg, args);
          if (!timeoutId && !maxTimeoutId) {
            args = thisArg = null;
          }
        }
      } else {
        timeoutId = setTimeout(delayed, remaining);
      }
    };

    var maxDelayed = function() {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      maxTimeoutId = timeoutId = trailingCall = undefined;
      if (trailing || (maxWait !== wait)) {
        lastCalled = Date.now();
        result = func.apply(thisArg, args);
        if (!timeoutId && !maxTimeoutId) {
          args = thisArg = null;
        }
      }
    };

    return function() {
      args = arguments;
      stamp = Date.now();
      thisArg = this;
      trailingCall = trailing && (timeoutId || !leading);

      if (maxWait === false) {
        var leadingCall = leading && !timeoutId;
      } else {
        if (!maxTimeoutId && !leading) {
          lastCalled = stamp;
        }
        var remaining = maxWait - (stamp - lastCalled),
            isCalled = remaining <= 0;

        if (isCalled) {
          if (maxTimeoutId) {
            maxTimeoutId = clearTimeout(maxTimeoutId);
          }
          lastCalled = stamp;
          result = func.apply(thisArg, args);
        }
        else if (!maxTimeoutId) {
          maxTimeoutId = setTimeout(maxDelayed, remaining);
        }
      }
      if (isCalled && timeoutId) {
        timeoutId = clearTimeout(timeoutId);
      }
      else if (!timeoutId && wait !== maxWait) {
        timeoutId = setTimeout(delayed, wait);
      }
      if (leadingCall) {
        isCalled = true;
        result = func.apply(thisArg, args);
      }
      if (isCalled && !timeoutId && !maxTimeoutId) {
        args = thisArg = null;
      }
      return result;
    };
  };

  function register( $$, $ ){

    // use a single dummy dom ele as target for every qtip
    var $qtipContainer = $('<div></div>');
    var viewportDebounceRate = 250;

    $qtipContainer.css({
      'z-index': -1,
      'position': 'absolute'
    });

    function generateOpts( target, passedOpts ){
      var qtip = target.scratch().qtip;
      var opts = $.extend( {}, passedOpts );

      if( !opts.id ){
        opts.id = 'cy-qtip-target-' + ( Date.now() + Math.round( Math.random() * 10000) );
      }

      if( !qtip.$domEle ){
        qtip.$domEle = $qtipContainer;
      }

      // qtip should be positioned relative to cy dom container
      opts.position = opts.position || {};
      opts.position.container = opts.position.container || $( document.body );
      opts.position.viewport = opts.position.viewport || $( document.body );
      opts.position.target = [0, 0];
      opts.position.my = opts.position.my || 'top center';
      opts.position.at = opts.position.at || 'bottom center';

      // adjust
      var adjust = opts.position.adjust = opts.position.adjust || {};
      adjust.method = adjust.method || 'flip';
      adjust.mouse = false;

      // default show event
      opts.show = opts.show || {};

      if( isUndef(opts.show.event) ){
        opts.show.event = 'tap';
      }

      // default hide event
      opts.hide = opts.hide || {};
      opts.hide.cyViewport = opts.hide.cyViewport === undefined ? true : opts.hide.cyViewport;

      if( isUndef(opts.hide.event) ){
        opts.hide.event = 'unfocus';
      }

      // so multiple qtips can exist at once (only works on recent qtip2 versions)
      opts.overwrite = false;

      if( opts.content ){
        if ( isFunction(opts.content) || isString(opts.content) ){
          opts.content = wrap( opts.content, target );
        } else {
          opts.content = {
            text: wrap( opts.content.text, target ),
            title: wrap( opts.content.title, target )
          };
        }
      }

      return opts;
    }

    function updatePosition(ele, qtip, evt){
      var e = evt;
      var isCy = isFunction( ele.pan );
      var isEle = !isCy;
      var isNode = isEle && ele.isNode();
      var cy = isCy ? ele : ele.cy();
      var cOff = cy.container().getBoundingClientRect();
      var pos = isNode ? ele.renderedPosition() : ( e ? e.renderedPosition || e.cyRenderedPosition : undefined );
      if( !pos || pos.x == null || isNaN(pos.x) ){ return; }

      var bb = isNode ? ele.renderedBoundingBox({
        includeNodes: true,
        includeEdges: false,
        includeLabels: false,
        includeShadows: false
      }) : {
        x1: pos.x - 1,
        x2: pos.x + 1,
        w: 3,
        y1: pos.y - 1,
        y2: pos.y + 1,
        h: 3
      };

      if( qtip.$domEle.parent().length === 0 ){
        qtip.$domEle.appendTo(document.body);
      }

      qtip.$domEle.css({
        'width': bb.w,
        'height': bb.h,
        'top': bb.y1 + cOff.top + window.pageYOffset,
        'left': bb.x1 + cOff.left + window.pageXOffset,
        'position': 'absolute',
        'pointer-events': 'none',
        'background': 'red',
        'z-index': 99999999,
        'opacity': 0.5,
        'visibility': 'hidden'
      });

      qtip.api.set('position.target', qtip.$domEle);
    }

    $$('collection', 'qtip', function( passedOpts ){
      var eles = this;
      var cy = this.cy();
      var container = cy.container();

      if( passedOpts === 'api' ){
        return this.scratch().qtip.api;
      }

      eles.each(function(ele, i){
        // Perform 2.x and 1.x backwards compatibility check
        if(isNumber(ele)){
          ele = i;
        }
        var scratch = ele.scratch();
        var qtip = scratch.qtip = scratch.qtip || {};
        var opts = generateOpts( ele, passedOpts );
        var adjNums = opts.position.adjust;

        qtip.$domEle.qtip( opts );
        var qtipApi = qtip.api = qtip.$domEle.qtip('api'); // save api ref
        qtip.$domEle.removeData('qtip'); // remove qtip dom/api ref to be safe

        updatePosition(ele, qtip);

        ele.on( opts.show.event, function(e){
          updatePosition(ele, qtip, e);
          qtipApi.show();
        } );

        ele.on( opts.hide.event, function(e){
          qtipApi.hide();
        } );

        if( opts.hide.cyViewport ){
          cy.on('viewport', debounce(function(){
            qtipApi.hide();
          }, viewportDebounceRate, { leading: true }) );
        }

        if( opts.position.adjust.cyViewport ){
          cy.on('pan zoom', debounce(function(e){
            updatePosition(ele, qtip, e);

            qtipApi.reposition();
          }, viewportDebounceRate, { trailing: true }) );
        }

      });

      return this; // chainability

    });

    $$('core', 'qtip', function( passedOpts ){
      var cy = this;
      var container = cy.container();

      if( passedOpts === 'api' ){
        return this.scratch().qtip.api;
      }

      var scratch = cy.scratch();
      var qtip = scratch.qtip = scratch.qtip || {};
      var opts = generateOpts( cy, passedOpts );


      qtip.$domEle.qtip( opts );
      var qtipApi = qtip.api = qtip.$domEle.qtip('api'); // save api ref
      qtip.$domEle.removeData('qtip'); // remove qtip dom/api ref to be safe

      cy.on( opts.show.event, function(e){
        if( !opts.show.cyBgOnly || (opts.show.cyBgOnly && (e.target === cy || e.cyTarget === cy)) ){
          updatePosition(cy, qtip, e);

          qtipApi.show();
        }
      } );

      cy.on( opts.hide.event, function(e){
        if( !opts.hide.cyBgOnly || (opts.hide.cyBgOnly && (e.target === cy || e.cyTarget === cy)) ){
          qtipApi.hide();
        }
      } );

      if( opts.hide.cyViewport ){
        cy.on('viewport', debounce(function(){
          qtipApi.hide();
        }, viewportDebounceRate, { leading: true }) );
      }

      return this; // chainability

    });

  }

  if( typeof module !== 'undefined' && module.exports ){ // expose as a commonjs module
    module.exports = function( cytoscape ){
      var oldJq = window.jQuery;
      var old$ = window.$;

      var jQuery = window.jQuery = window.$ = require('jquery'); // qtip requires global jquery
      var qtip = require('qtip2');

      register( cytoscape, jQuery );

      window.jQuery = oldJq;
      window.$ = old$;
    };
  } else if( typeof define !== 'undefined' && define.amd ){ // expose as an amd/requirejs module
    define('cytoscape-qtip', function(){
      return register;
    });
  }

  if( $ && $$ ){
    register( $$, $ );
  }

})(
  typeof jQuery !== 'undefined' ? jQuery : null,
  typeof cytoscape !== 'undefined' ? cytoscape : null
);
