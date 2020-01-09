;(function(){ 'use strict';

  var $;

  var defaults = {
      container: false // can be a HTML or jQuery element or jQuery selector
    , viewLiveFramerate: 0 // set false to update graph pan only on drag end; set 0 to do it instantly; set a number (frames per second) to update not more than N times per second
    , dblClickDelay: 200 // milliseconds
    , removeCustomContainer: true // destroy the container specified by user on plugin destroy
    , rerenderDelay: 500 // ms to throttle rerender updates to the panzoom for performance
  };

  var debounce = (function(){
    /**
     * lodash 3.1.1 (Custom Build) <https://lodash.com/>
     * Build: `lodash modern modularize exports="npm" -o ./`
     * Copyright 2012-2015 The Dojo Foundation <http://dojofoundation.org/>
     * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
     * Copyright 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
     * Available under MIT license <https://lodash.com/license>
     */
    /** Used as the `TypeError` message for "Functions" methods. */
    var FUNC_ERROR_TEXT = 'Expected a function';

    /* Native method references for those with the same name as other `lodash` methods. */
    var nativeMax = Math.max,
        nativeNow = Date.now;

    /**
     * Gets the number of milliseconds that have elapsed since the Unix epoch
     * (1 January 1970 00:00:00 UTC).
     *
     * @static
     * @memberOf _
     * @category Date
     * @example
     *
     * _.defer(function(stamp) {
     *   console.log(_.now() - stamp);
     * }, _.now());
     * // => logs the number of milliseconds it took for the deferred function to be invoked
     */
    var now = nativeNow || function() {
      return new Date().getTime();
    };

    /**
     * Creates a debounced function that delays invoking `func` until after `wait`
     * milliseconds have elapsed since the last time the debounced function was
     * invoked. The debounced function comes with a `cancel` method to cancel
     * delayed invocations. Provide an options object to indicate that `func`
     * should be invoked on the leading and/or trailing edge of the `wait` timeout.
     * Subsequent calls to the debounced function return the result of the last
     * `func` invocation.
     *
     * **Note:** If `leading` and `trailing` options are `true`, `func` is invoked
     * on the trailing edge of the timeout only if the the debounced function is
     * invoked more than once during the `wait` timeout.
     *
     * See [David Corbacho's article](http://drupalmotion.com/article/debounce-and-throttle-visual-explanation)
     * for details over the differences between `_.debounce` and `_.throttle`.
     *
     * @static
     * @memberOf _
     * @category Function
     * @param {Function} func The function to debounce.
     * @param {number} [wait=0] The number of milliseconds to delay.
     * @param {Object} [options] The options object.
     * @param {boolean} [options.leading=false] Specify invoking on the leading
     *  edge of the timeout.
     * @param {number} [options.maxWait] The maximum time `func` is allowed to be
     *  delayed before it's invoked.
     * @param {boolean} [options.trailing=true] Specify invoking on the trailing
     *  edge of the timeout.
     * @returns {Function} Returns the new debounced function.
     * @example
     *
     * // avoid costly calculations while the window size is in flux
     * jQuery(window).on('resize', _.debounce(calculateLayout, 150));
     *
     * // invoke `sendMail` when the click event is fired, debouncing subsequent calls
     * jQuery('#postbox').on('click', _.debounce(sendMail, 300, {
     *   'leading': true,
     *   'trailing': false
     * }));
     *
     * // ensure `batchLog` is invoked once after 1 second of debounced calls
     * var source = new EventSource('/stream');
     * jQuery(source).on('message', _.debounce(batchLog, 250, {
     *   'maxWait': 1000
     * }));
     *
     * // cancel a debounced call
     * var todoChanges = _.debounce(batchLog, 1000);
     * Object.observe(models.todo, todoChanges);
     *
     * Object.observe(models, function(changes) {
     *   if (_.find(changes, { 'user': 'todo', 'type': 'delete'})) {
     *     todoChanges.cancel();
     *   }
     * }, ['delete']);
     *
     * // ...at some point `models.todo` is changed
     * models.todo.completed = true;
     *
     * // ...before 1 second has passed `models.todo` is deleted
     * // which cancels the debounced `todoChanges` call
     * delete models.todo;
     */
    function debounce(func, wait, options) {
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

      if (typeof func != 'function') {
        throw new TypeError(FUNC_ERROR_TEXT);
      }
      wait = wait < 0 ? 0 : (+wait || 0);
      if (options === true) {
        var leading = true;
        trailing = false;
      } else if (isObject(options)) {
        leading = !!options.leading;
        maxWait = 'maxWait' in options && nativeMax(+options.maxWait || 0, wait);
        trailing = 'trailing' in options ? !!options.trailing : trailing;
      }

      function cancel() {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        if (maxTimeoutId) {
          clearTimeout(maxTimeoutId);
        }
        lastCalled = 0;
        maxTimeoutId = timeoutId = trailingCall = undefined;
      }

      function complete(isCalled, id) {
        if (id) {
          clearTimeout(id);
        }
        maxTimeoutId = timeoutId = trailingCall = undefined;
        if (isCalled) {
          lastCalled = now();
          result = func.apply(thisArg, args);
          if (!timeoutId && !maxTimeoutId) {
            args = thisArg = undefined;
          }
        }
      }

      function delayed() {
        var remaining = wait - (now() - stamp);
        if (remaining <= 0 || remaining > wait) {
          complete(trailingCall, maxTimeoutId);
        } else {
          timeoutId = setTimeout(delayed, remaining);
        }
      }

      function maxDelayed() {
        complete(trailing, timeoutId);
      }

      function debounced() {
        args = arguments;
        stamp = now();
        thisArg = this;
        trailingCall = trailing && (timeoutId || !leading);

        if (maxWait === false) {
          var leadingCall = leading && !timeoutId;
        } else {
          if (!maxTimeoutId && !leading) {
            lastCalled = stamp;
          }
          var remaining = maxWait - (stamp - lastCalled),
              isCalled = remaining <= 0 || remaining > maxWait;

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
          args = thisArg = undefined;
        }
        return result;
      }
      debounced.cancel = cancel;
      return debounced;
    }

    /**
     * Checks if `value` is the [language type](https://es5.github.io/#x8) of `Object`.
     * (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
     *
     * @static
     * @memberOf _
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is an object, else `false`.
     * @example
     *
     * _.isObject({});
     * // => true
     *
     * _.isObject([1, 2, 3]);
     * // => true
     *
     * _.isObject(1);
     * // => false
     */
    function isObject(value) {
      // Avoid a V8 JIT bug in Chrome 19-20.
      // See https://code.google.com/p/v8/issues/detail?id=2291 for more details.
      var type = typeof value;
      return !!value && (type == 'object' || type == 'function');
    }

    return debounce;

  })();

  // ported lodash throttle function
  var throttle = function( func, wait, options ){
    var leading = true,
        trailing = true;

    if( options === false ){
      leading = false;
    } else if( typeof options === typeof {} ){
      leading = 'leading' in options ? options.leading : leading;
      trailing = 'trailing' in options ? options.trailing : trailing;
    }
    options = options || {};
    options.leading = leading;
    options.maxWait = wait;
    options.trailing = trailing;

    return debounce( func, wait, options );
  };

  var Navigator = function ( element, options ) {
    this._init(element, options)
  }

  Navigator.prototype = {

    constructor: Navigator

  /****************************
    Main functions
  ****************************/

  , bb: function(){
    var bb = this.cy.elements().boundingBox()

    if( bb.w === 0 || bb.h === 0 ){
      return {
        x1: 0,
        x2: Infinity,
        y1: 0,
        y2: Infinity,
        w: Infinity,
        h: Infinity
      } // => hide interactive overlay
    }

    return bb
  }

  , _init: function ( cy, options ) {
      this.$element = $( cy.container() )
      this.options = $.extend({}, defaults, options)

      this.cy = cy

      // Cache bounding box
      this.boundingBox = this.bb()

      // Cache sizes
      this.width = this.$element.width()
      this.height = this.$element.height()

      // Init components
      this._initPanel()
      this._initThumbnail()
      this._initView()
      this._initOverlay()
    }

  , destroy: function () {
      this._removeEventsHandling();

      // If container is not created by navigator and its removal is prohibited
      if (this.options.container && !this.options.removeCustomContainer) {
        this.$panel.empty()
      } else {
        this.$panel.remove()
      }
      this.$element.removeData('navigator')
    }

  /****************************
    Navigator elements functions
  ****************************/

    /*
     * Used inner attributes
     *
     * w {number} width
     * h {number} height
     */
  , _initPanel: function () {
      var options = this.options

      if( options.container ) {
        if( options.container instanceof jQuery ){
          if( options.container.length > 0 ){
            this.$panel = options.container.first()
          } else {
            $.error("Container for jquery.cyNavigator is empty")
            return
          }
        } else if ( $(options.container).length > 0 ) {
          this.$panel = $(options.container).first()
        } else {
          $.error("There is no any element matching your selector for jquery.cyNavigator")
          return
        }
      } else {
        this.$panel = $('<div class="cytoscape-navigator"/>')
        $('body').append(this.$panel)
      }

      this._setupPanel()

      this.cy.on('resize', $.proxy(this.resize, this))
    }

  , _setupPanel: function () {
      var options = this.options

      // Cache sizes
      this.panelWidth = this.$panel.width()
      this.panelHeight = this.$panel.height()
    }

    /*
     * Used inner attributes
     *
     * zoom {number}
     * pan {object} - {x: 0, y: 0}
     */
  , _initThumbnail: function () {
      // Create thumbnail
      this.$thumbnail = $('<img/>')

      // Add thumbnail canvas to the DOM
      this.$panel.append(this.$thumbnail)

      // Setup thumbnail
      this._setupThumbnailSizes()
      this._setupThumbnail()
    }

  , _setupThumbnail: function () {
      this._updateThumbnailImage()
    }

  , _setupThumbnailSizes: function () {
      // Update bounding box cache
      this.boundingBox = this.bb()

      this.thumbnailZoom = Math.min(this.panelHeight / this.boundingBox.h, this.panelWidth / this.boundingBox.w)

      // Used on thumbnail generation
      this.thumbnailPan = {
        x: (this.panelWidth - this.thumbnailZoom * (this.boundingBox.x1 + this.boundingBox.x2))/2
      , y: (this.panelHeight - this.thumbnailZoom * (this.boundingBox.y1 + this.boundingBox.y2))/2
      }
    }

    // If bounding box has changed then update sizes
    // Otherwise just update the thumbnail
  , _checkThumbnailSizesAndUpdate: function () {
      // Cache previous values
      var _zoom = this.thumbnailZoom
        , _pan_x = this.thumbnailPan.x
        , _pan_y = this.thumbnailPan.y

      this._setupThumbnailSizes()

      if (_zoom != this.thumbnailZoom || _pan_x != this.thumbnailPan.x || _pan_y != this.thumbnailPan.y) {
        this._setupThumbnail()
        this._setupView()
      } else {
        this._updateThumbnailImage()
      }
    }

    /*
     * Used inner attributes
     *
     * w {number} width
     * h {number} height
     * x {number}
     * y {number}
     * borderWidth {number}
     * locked {boolean}
     */
  , _initView: function () {
      var that = this

      this.$view = $('<div class="cytoscape-navigatorView"/>')
      this.$panel.append(this.$view)

      // Compute borders
      this.viewBorderTop = parseInt(this.$view.css('border-top-width'), 10)
      this.viewBorderRight = parseInt(this.$view.css('border-right-width'), 10)
      this.viewBorderBottom = parseInt(this.$view.css('border-bottom-width'), 10)
      this.viewBorderLeft = parseInt(this.$view.css('border-left-width'), 10)

      // Abstract borders
      this.viewBorderHorizontal = this.viewBorderLeft + this.viewBorderRight
      this.viewBorderVertical = this.viewBorderTop + this.viewBorderBottom

      this._setupView()

      // Hook graph zoom and pan
      this.cy.on('zoom pan', $.proxy(this._setupView, this))
    }

  , _setupView: function () {
      if (this.viewLocked)
        return

      var cyZoom = this.cy.zoom()
        , cyPan = this.cy.pan()

      // Horizontal computation
      this.viewW = this.width / cyZoom * this.thumbnailZoom
      this.viewX = -cyPan.x * this.viewW / this.width + this.thumbnailPan.x - this.viewBorderLeft

      // Vertical computation
      this.viewH = this.height / cyZoom * this.thumbnailZoom
      this.viewY = -cyPan.y * this.viewH / this.height + this.thumbnailPan.y - this.viewBorderTop

      // CSS view
      this.$view
        .width(this.viewW)
        .height(this.viewH)
        .css({
          position: 'absolute',
          left: this.viewX
        , top: this.viewY
        })
    }

    /*
     * Used inner attributes
     *
     * timeout {number} used to keep stable frame rate
     * lastMoveStartTime {number}
     * inMovement {boolean}
     * hookPoint {object} {x: 0, y: 0}
     */
  , _initOverlay: function () {
      // Used to capture mouse events
      this.$overlay = $('<div class="cytoscape-navigatorOverlay"/>')

      // Add overlay to the DOM
      this.$panel.append(this.$overlay)

      // Init some attributes
      this.overlayHookPointX = 0;
      this.overlayHookPointY = 0;

      // Listen for events
      this._initEventsHandling()
    }

  /****************************
    Event handling functions
  ****************************/

  , resize: function () {
      // Cache sizes
      this.width = this.$element.width()
      this.height = this.$element.height()

      this._thumbnailSetup = false
      this._setupPanel()
      this._checkThumbnailSizesAndUpdate()
      this._setupView()
    }

  , _initEventsHandling: function () {
      var that = this
        , eventsLocal = [
        // Mouse events
          'mousedown'
        , 'mousewheel'
        , 'DOMMouseScroll' // Mozilla specific event
        // Touch events
        , 'touchstart'
        ]
        , eventsGlobal = [
          'mouseup'
        , 'mouseout'
        , 'mousemove'
        // Touch events
        , 'touchmove'
        , 'touchend'
        ]

      // handle events and stop their propagation
      var overlayListener;
      this.$overlay.on(eventsLocal.join(' '), overlayListener = function (ev) {
        // Touch events
        if (ev.type == 'touchstart') {
          // Will count as middle of View
          ev.offsetX = that.viewX + that.viewW / 2
          ev.offsetY = that.viewY + that.viewH / 2
        }

        // Normalize offset for browsers which do not provide that value
        if (ev.offsetX === undefined || ev.offsetY === undefined) {
          var targetOffset = $(ev.target).offset()
          ev.offsetX = ev.pageX - targetOffset.left
          ev.offsetY = ev.pageY - targetOffset.top
        }

        if (ev.type == 'mousedown' || ev.type == 'touchstart') {
          that._eventMoveStart(ev)
        } else if (ev.type == 'mousewheel' || ev.type == 'DOMMouseScroll') {
          that._eventZoom(ev)
        }

        // Prevent default and propagation
        // Don't use peventPropagation as it breaks mouse events
        return false;
      })

      // Hook global events
      var globalListener;
      $(window).on(eventsGlobal.join(' '), globalListener = function (ev) {
        // Do not make any computations if it is has no effect on Navigator
        if (!that.overlayInMovement)
          return;

        // Touch events
        if (ev.type == 'touchend') {
          // Will count as middle of View
          ev.offsetX = that.viewX + that.viewW / 2
          ev.offsetY = that.viewY + that.viewH / 2
        } else if (ev.type == 'touchmove') {
          // Hack - we take in account only first touch
          ev.pageX = ev.originalEvent.touches[0].pageX
          ev.pageY = ev.originalEvent.touches[0].pageY
        }

        // Normalize offset for browsers which do not provide that value
        if (ev.offsetX === undefined || ev.offsetY === undefined) {
          var targetOffset = $(ev.target).offset()
          ev.offsetX = ev.pageX - targetOffset.left
          ev.offsetY = ev.pageY - targetOffset.top
        }

        // Translate global events into local coordinates
        if (ev.target !== that.$overlay[0]) {
          var targetOffset = $(ev.target).offset()
            , overlayOffset = that.$overlay.offset()

          ev.offsetX = ev.offsetX - overlayOffset.left + targetOffset.left
          ev.offsetY = ev.offsetY - overlayOffset.top + targetOffset.top
        }

        if (ev.type == 'mousemove' || ev.type == 'touchmove') {
          that._eventMove(ev)
        } else if (ev.type == 'mouseup' || ev.type == 'touchend') {
          that._eventMoveEnd(ev)
        }

        // Prevent default and propagation
        // Don't use peventPropagation as it breaks mouse events
        return false;
      })

      this._removeEventsHandling = function(){

        this.$overlay.off( eventsLocal.join(' '), overlayListener )
        $(window).off( eventsGlobal.join(' '), globalListener )
      }
    }

  , _eventMoveStart: function (ev) {
      var now = new Date().getTime()

      // Check if it was double click
      if (this.overlayLastMoveStartTime
        && this.overlayLastMoveStartTime + this.options.dblClickDelay > now) {
        // Reset lastMoveStartTime
        this.overlayLastMoveStartTime = 0
        // Enable View in order to move it to the center
        this.overlayInMovement = true

        // Set hook point as View center
        this.overlayHookPointX = this.viewW / 2
        this.overlayHookPointY = this.viewH / 2

        // Move View to start point
        if (this.options.viewLiveFramerate !== false) {
          this._eventMove({
            offsetX: this.panelWidth / 2
          , offsetY: this.panelHeight / 2
          })
        } else {
          this._eventMoveEnd({
            offsetX: this.panelWidth / 2
          , offsetY: this.panelHeight / 2
          })
        }

        // View should be inactive as we don't want to move it right after double click
        this.overlayInMovement = false
      }
      // This is a single click
      // Take care as single click happens before double click 2 times
      else {
        this.overlayLastMoveStartTime = now
        this.overlayInMovement = true
        // Lock view moving caused by cy events
        this.viewLocked = true

        // if event started in View
        if (ev.offsetX >= this.viewX && ev.offsetX <= this.viewX + this.viewW
          && ev.offsetY >= this.viewY && ev.offsetY <= this.viewY + this.viewH
        ) {
          this.overlayHookPointX = ev.offsetX - this.viewX
          this.overlayHookPointY = ev.offsetY - this.viewY
        }
        // if event started in Thumbnail (outside of View)
        else {
          // Set hook point as View center
          this.overlayHookPointX = this.viewW / 2
          this.overlayHookPointY = this.viewH / 2

          // Move View to start point
          this._eventMove(ev)
        }
      }
    }

  , _eventMove: function (ev) {
      var that = this

      this._checkMousePosition(ev)

      // break if it is useless event
      if (!this.overlayInMovement) {
        return;
      }

      // Update cache
      this.viewX = ev.offsetX - this.overlayHookPointX
      this.viewY = ev.offsetY - this.overlayHookPointY

      // Update view position
      this.$view.css('left', this.viewX)
      this.$view.css('top', this.viewY)

      // Move Cy
      if (this.options.viewLiveFramerate !== false) {
        // trigger instantly
        if (this.options.viewLiveFramerate == 0) {
          this._moveCy()
        }
        // trigger less often than frame rate
        else if (!this.overlayTimeout) {
          // Set a timeout for graph movement
          this.overlayTimeout = setTimeout(function () {
            that._moveCy()
            that.overlayTimeout = false
          }, 1000/this.options.viewLiveFramerate)
        }
      }
    }

  , _checkMousePosition: function (ev) {
      // If mouse in over View
      if(ev.offsetX > this.viewX && ev.offsetX < this.viewX + this.viewBorderHorizontal + this.viewW
        && ev.offsetY > this.viewY && ev.offsetY < this.viewY + this.viewBorderVertical + this.viewH) {
        this.$panel.addClass('mouseover-view')
      } else {
        this.$panel.removeClass('mouseover-view')
      }
    }

  , _eventMoveEnd: function (ev) {
      // Unlock view changing caused by graph events
      this.viewLocked = false

      // Remove class when mouse is not over Navigator
      this.$panel.removeClass('mouseover-view')

      if (!this.overlayInMovement) {
        return;
      }

      // Trigger one last move
      this._eventMove(ev)

      // If mode is not live then move graph on drag end
      if (this.options.viewLiveFramerate === false) {
        this._moveCy()
      }

      // Stop movement permission
      this.overlayInMovement = false
    }

  , _eventZoom: function (ev) {
      var zoomRate = Math.pow(10, ev.originalEvent.wheelDeltaY / 1000 || ev.originalEvent.wheelDelta / 1000 || ev.originalEvent.detail / -32)
        , mousePosition = {
            left: ev.offsetX
          , top: ev.offsetY
          }

      if (this.cy.zoomingEnabled()) {
        this._zoomCy(zoomRate, mousePosition)
      }
    }

  , _updateThumbnailImage: function () {
    var that = this;

    if( this._thumbnailUpdating ){
      return;
    }

    this._thumbnailUpdating = true;

    var render = function(){
      that._checkThumbnailSizesAndUpdate();
      that._setupView();

      var $img = that.$thumbnail;
      var img = $img[0];

      var w = that.panelWidth;
      var h = that.panelHeight;
      var bb = that.boundingBox;
      var zoom = Math.min( w/bb.w, h/bb.h );

      var pxRatio = 1;

      var translate = {
        x: (w - zoom*( bb.w ))/2,
        y: (h - zoom*( bb.h ))/2
      };

      var png = that.cy.png({
        full: true,
        scale: zoom
      });

      if( png.indexOf('image/png') < 0 ){
        img.removeAttribute( 'src' );
      } else {
        img.setAttribute( 'src', png );
      }

      $img.css({
        'position': 'absolute',
        'left': translate.x + 'px',
        'top': translate.y + 'px'
      });
    }

    this.cy.onRender( throttle(render, that.options.rerenderDelay) );
  }

  /****************************
    Navigator view moving
  ****************************/

  , _moveCy: function () {
      this.cy.pan({
        x: -(this.viewX + this.viewBorderLeft - this.thumbnailPan.x) * this.width / this.viewW
      , y: -(this.viewY + this.viewBorderLeft - this.thumbnailPan.y) * this.height / this.viewH
      })
    }

  /**
   * Zooms graph.
   *
   * @this {cytoscapeNavigator}
   * @param {number} zoomRate The zoom rate value. 1 is 100%.
   */
  , _zoomCy: function (zoomRate, zoomCenterRaw) {
      var zoomCenter
        , isZoomCenterInView = false

      zoomCenter = {
        x: this.width / 2
      , y: this.height / 2
      };

      this.cy.zoom({
        level: this.cy.zoom() * zoomRate
      , renderedPosition: zoomCenter
      })
    }
  }

  // registers the extension on a cytoscape lib ref
  var register = function( cytoscape, jq ){

    if( !cytoscape || !jq ){ return; } // can't register if cytoscape unspecified

    $ = jq;

    cytoscape( 'core', 'navigator', function( options ){
      var cy = this;

      return new Navigator( cy, options );
    } );

  };

  if( typeof module !== 'undefined' && module.exports ){ // expose as a commonjs module
    module.exports = function( cytoscape, jq ){
      register( cytoscape, jq || require('jquery') );
    };
  } else if( typeof define !== 'undefined' && define.amd ){ // expose as an amd/requirejs module
    define('cytoscape-navigator', function(){
      return register;
    });
  }

  if( typeof cytoscape !== 'undefined' && typeof jQuery !== 'undefined' ){ // expose to global cytoscape (i.e. window.cytoscape)
    register( cytoscape, jQuery );
  }

})();
