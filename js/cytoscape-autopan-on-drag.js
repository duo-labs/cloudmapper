;(function(){ 'use strict';

  // registers the extension on a cytoscape lib ref
  var register = function( cytoscape ){

    if( !cytoscape ){ return; } // can't register if cytoscape unspecified

    var cy;
    var currentNode;
    var tapstartFcn, tapdragFcn, tapendFcn;
    
    // Default options
    var defaults = {
      enabled: true, // Whether the extension is enabled on register
      selector: 'node', // Which elements will be affected by this extension
      speed: 1 // Speed of panning when elements exceed canvas bounds
    };
    
    var options;
    
    // Merge default options with the ones coming from parameter
    function extend(defaults, options) {
      var obj = {};

      for (var i in defaults) {
        obj[i] = defaults[i];
      }

      for (var i in options) {
        obj[i] = options[i];
      }

      return obj;
    };
    
    function bindCyEvents() {
      
      cy.on('tapstart', options.selector, tapstartFcn = function() {
        var node = this;
        
        var renderedPosition = node.renderedPosition();
        var renderedWidth = node.renderedWidth();
        var renderedHeight = node.renderedHeight();
        
        var maxRenderedX = $(cy.container()).width();
        var maxRenderedY = $(cy.container()).height();
        
        var topLeftRenderedPosition = {
          x: renderedPosition.x - renderedWidth / 2,
          y: renderedPosition.y - renderedHeight / 2
        };

        var bottomRightRenderedPosition = {
          x: renderedPosition.x + renderedWidth / 2,
          y: renderedPosition.y + renderedHeight / 2
        };
        
        var exceed = false;
        
        if( ( bottomRightRenderedPosition.x >= maxRenderedX ) || ( topLeftRenderedPosition.x <= 0 )
                || ( bottomRightRenderedPosition.y >= maxRenderedY ) || ( topLeftRenderedPosition.y <= 0 ) ){
          exceed = true;
        }
        
        if( !exceed ) {
          currentNode = node;
        }
        
      });
      
      cy.on('tapdrag', tapdragFcn = function() {
        if(currentNode === undefined) {
          return;
        }
        
        var newRenderedPosition = currentNode.renderedPosition();
        var renderedWidth = currentNode.renderedWidth();
        var renderedHeight = currentNode.renderedHeight();
        
        var maxRenderedX = $(cy.container()).width();
        var maxRenderedY = $(cy.container()).height();

        var topLeftRenderedPosition = {
          x: newRenderedPosition.x - renderedWidth / 2,
          y: newRenderedPosition.y - renderedHeight / 2
        };

        var bottomRightRenderedPosition = {
          x: newRenderedPosition.x + renderedWidth / 2,
          y: newRenderedPosition.y + renderedHeight / 2
        };
       
        var exceedX;
        var exceedY;
        
        if(bottomRightRenderedPosition.x >= maxRenderedX) {
          exceedX = -bottomRightRenderedPosition.x + maxRenderedX;
        }
        
        if(topLeftRenderedPosition.x <= 0) {
          exceedX = -topLeftRenderedPosition.x;
        }
        
        if(bottomRightRenderedPosition.y >= maxRenderedY ) {
          exceedY = -bottomRightRenderedPosition.y + maxRenderedY;
        }
        
        if(topLeftRenderedPosition.y <= 0) {
          exceedY = -topLeftRenderedPosition.y;
        }
        
        if(exceedX) {
          cy.panBy({x: exceedX * options.speed});
        }
        
        if(exceedY) {
          cy.panBy({y: exceedY * options.speed});
        }
      });
      
      cy.on('tapend', tapendFcn = function() {
        currentNode = undefined;
      });
    }
    
    function unbindCyEvents() {
      cy.off('tapstart', options.selector, tapstartFcn);
      cy.off('tapdrag', tapdragFcn);
      cy.off('tapend', tapendFcn);
    }
    
    cytoscape( 'core', 'autopanOnDrag', function(opts){
      cy = this;

      if(opts !== 'get') {
        // merge the options with default ones
        options = extend(defaults, opts);
        
        if(options.enabled) {
          bindCyEvents();
        }
      }
      
      return {
        enable: function() {
          bindCyEvents();
        },
        disable: function() {
          unbindCyEvents();
        }
      };
    } );

  };

  if( typeof module !== 'undefined' && module.exports ){ // expose as a commonjs module
    module.exports = register;
  }

  if( typeof define !== 'undefined' && define.amd ){ // expose as an amd/requirejs module
    define('cytoscape-context-menus', function(){
      return register;
    });
  }

  if( typeof cytoscape !== 'undefined' ){ // expose to global cytoscape (i.e. window.cytoscape)
    register( cytoscape );
  }

})();