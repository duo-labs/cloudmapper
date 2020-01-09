/*
Copyright 2018 Duo Security

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the
following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following
disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the
following disclaimer in the documentation and/or other materials provided with the distribution.

3. Neither the name of the copyright holder nor the names of its contributors may be used to endorse or promote
products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES,
INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE
USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/
NProgress.start();

// Prevent arrow keys from scrolling the window
window.addEventListener("keydown", function(e) {
    // space and arrow keys
    if([32, 37, 38, 39, 40].indexOf(e.keyCode) > -1) {
        e.preventDefault();
    }
}, false);

$(window).on('load', function(){
    NProgress.set(0.1);
    akkordion(".akkordion", {});
    
    $.when(
        $.getJSON("./data.json"),
        $.getJSON("./style.json")
    ).done(function(datafile, stylefile) {
        loadCytoscape({
            wheelSensitivity: 0.1,
            container: document.getElementById('cy'),
            elements: datafile[0],
            layout: {
                name: 'cose-bilkent',
                nodeDimensionsIncludeLabels: true,
                tilingPaddingVertical: 10,
                tilingPaddingHorizontal: 100
            },
            style: stylefile[0]
        });
    })
    .fail(function(e) {
        if (e.status == 404) {
            alert("Failed to fetch data!\nPlease run cloudmapper.py prepare before using webserver");
        }
    });
}); // Page loaded


function loadCytoscape(options) {
    NProgress.set(0.2);
    // Perform the layout
    var cy = window.cy = cytoscape(options);
    NProgress.set(0.9);

    // Snap to grid
    cy.gridGuide({
        drawGrid: false,
        gridSpacing: 20,
    });

    // Add ability to undo moves
    var ur = cy.undoRedo();

    function setEdgeActions() {
        // Do something when an edge is clicked on
        cy.edges().on('tap', function( e ){
            // This function is just to get us to directtap
            var eventIsDirect = e.target.same( this ); // don't use 2.x cyTarget
            
            if( eventIsDirect ){
                this.emit('directtap');
            }
        }).on('directtap', function( e ){
            // An edge has been click on
            ni.describe(this);
            
            e.stopPropagation();
        });
        console.log("Setting edge actions");
    }

    // Add ability to expand and collapse nodes
    cy.expandCollapse({
        layoutBy: {
            name: "cose-bilkent",
            animate: "end",
            randomize: false,
            fit: true,
            animationDuration: 1000,
        },
        cueEnabled: false,
        fisheye: true,
        animate: true
    });
    
    // Add pan and zoom UI control
    cy.panzoom({
        panSpeed: 5,
        zoomDelay: 30,
    });

    // Bird's eye navigator
    cy.navigator({});

    // Pan when dragging off-screen
    cy.autopanOnDrag({});

    // Add ability to hide nodes and see neighbors
    var api = cy.viewUtilities({
        neighbor: function(node){
            return node.closedNeighborhood();
        },
        neighborSelectTime: 1000,
        edge: {
            highlighted: { // Styles for when edges are unhighlighted.
                "width": 5,
                "color": "#000",
                "opacity": 1
            },
            unhighlighted: { // Styles for when edges are unhighlighted.
                'opacity': 0.1
            }
        },
        node: {
            unhighlighted: { // Styles for when nodes are unhighlighted.
                'opacity': 0.3
            }
        }
    });


    // Increase border width to show nodes with hidden neighbors
    function thickenBorder(eles){
        eles.forEach(function( ele ){
            ele.toggleClass("hiddenNeighbors", true);
        });
        eles.data("thickBorder", true);
        return eles;
    }
    // Decrease border width when hidden neighbors of the nodes become visible
    function thinBorder(eles){
        eles.forEach(function( ele ){
            ele.toggleClass("hiddenNeighbors", false);
        });
        eles.removeData("thickBorder");
        return eles;
    }

    ur.action("thickenBorder", thickenBorder, thinBorder);
    ur.action("thinBorder", thinBorder, thickenBorder);

    // Collapse selected nodes
    document.getElementById("collapseRecursively").addEventListener("click", function () {
        ur.do("collapseRecursively", {
            nodes: cy.$(":selected")
        });
        setEdgeActions();
    });

    // Expand selected nodes
    document.getElementById("expandRecursively").addEventListener("click", function () {
        ur.do("expandRecursively", {
            nodes: cy.$(":selected")
        });
        setEdgeActions();
    });

    // Collapse all
    document.getElementById("collapseAll").addEventListener("click", function () {
        ur.do("collapseAll");
        setEdgeActions();
    });

    // Expand all
    document.getElementById("expandAll").addEventListener("click", function () {
        ur.do("expandAll");
        setEdgeActions();
    });


    // Save image
    document.getElementById("saveImage").addEventListener("click", function () {
        var png = cy.png( {
            output: 'blob',
            full: true
        });
        saveAs(png, "CloudMapper.png");
    });

    // Export layout
    document.getElementById("exportLayout").addEventListener("click", function () {
        blob = new Blob([CircularJSON.stringify(cy.json())], {type: "text/plain;charset=utf-8"});
        saveAs(blob, "layout.json");
    });

    // Import layout
    document.getElementById("importLayout").addEventListener("click", function () {
        //cy.json( cyJson );
    });

    // Randomize layout
    function randomizeLayout() {
        var layout = cy.layout({
            name: 'cose-bilkent',
            animate: 'end',
            animationEasing: 'ease-out',
            animationDuration: 2000,
            randomize: true
        });
        layout.run();
    }
    document.getElementById("randomizeLayout").addEventListener("click", function(){
        randomizeLayout();
    });

    //In below functions, finding the nodes to hide/show are sample specific. 
    //If the sample graph changes, those calculations may also need a change.   
    
    $("#hide").click(function (){
        hideSelectedNodes();
    });

    $("#showAll").click(function () {
        var actions = [];
        var nodesWithHiddenNeighbor = cy.nodes("[thickBorder]");
        actions.push({name: "thinBorder", param: nodesWithHiddenNeighbor});
        actions.push({name: "show", param: cy.elements()});
        ur.do("batch", actions);                    
    });
    

    $("#showHiddenNeighbors").click(function () {
        // Not used, as you can double-click on a node to see this.
        var hiddenEles = cy.$(":selected").neighborhood().filter(':hidden');
        var actions = [];
        var nodesWithHiddenNeighbor = (hiddenEles.neighborhood(":visible").nodes("[thickBorder]"))
            .difference(cy.edges(":hidden").difference(hiddenEles.edges().union(hiddenEles.nodes().connectedEdges())).connectedNodes());
        actions.push({name: "thinBorder", param: nodesWithHiddenNeighbor});
        actions.push({name: "show", param: hiddenEles.union(hiddenEles.parent())});
        nodesWithHiddenNeighbor = hiddenEles.nodes().edgesWith(cy.nodes(":hidden").difference(hiddenEles.nodes()))
            .connectedNodes().intersection(hiddenEles.nodes());
        actions.push({name: "thickenBorder", param: nodesWithHiddenNeighbor}); 
        cy.undoRedo().do("batch", actions);                
    });
    

    // Double-tapping a node makes it's hidden neighbors reappear
    var tappedBefore;
    cy.on('tap', 'node', function (event) {
        var node = this;

        var tappedNow = node;
        setTimeout(function () {
            tappedBefore = null;
        }, 300);
        if (tappedBefore && tappedBefore.id() === tappedNow.id()) {
            tappedNow.trigger('doubleTap');
            tappedBefore = null;
        } else {
            tappedBefore = tappedNow;
        }
    });  
    cy.on('doubleTap', 'node', function (event) {
        var hiddenEles = cy.$(":selected").neighborhood().filter(':hidden');
        var actions = [];
        var nodesWithHiddenNeighbor = (hiddenEles.neighborhood(":visible").nodes("[thickBorder]"))
            .difference(cy.edges(":hidden").difference(hiddenEles.edges().union(hiddenEles.nodes().connectedEdges())).connectedNodes());
        actions.push({name: "thinBorder", param: nodesWithHiddenNeighbor});
        actions.push({name: "show", param: hiddenEles.union(hiddenEles.parent())});
        nodesWithHiddenNeighbor = hiddenEles.nodes().edgesWith(cy.nodes(":hidden").difference(hiddenEles.nodes()))
            .connectedNodes().intersection(hiddenEles.nodes());
        actions.push({name: "thickenBorder", param: nodesWithHiddenNeighbor}); 
        cy.undoRedo().do("batch", actions);
        setEdgeActions();
    });

    var highlight = false;
    $("#highlightNeighbors").click(function () {
        highlight = true;
        if(cy.$(":selected").length > 0)
            ur.do("highlightNeighbors", cy.$(":selected"));
    });

    $("#removeHighlights").click(function () {
        highlight = false;
        ur.do("removeHighlights");
    });

    $("#search").click(function () {
        var text = $("#toSearch").val();
        cy.elements().search(text).highlightNeighbors();
    });
                
    // Undo redo
    document.addEventListener("keydown", function (e) {
        if (e.ctrlKey){
            if (e.which === 90)
                ur.undo();
            else if (e.which === 89)
                ur.redo();
        }
    });

    // Provide viewing area for when a node is clicked on
    var ni = cy.ni = cy.nodeInfo();

    // Do something when a node is clicked on
    cy.nodes().on('tap', function( e ){
        // This function is just to get us to directtap
        var eventIsDirect = e.target.same( this ); // don't use 2.x cyTarget
        
        if( eventIsDirect ){
            this.emit('directtap');
        }
    }).on('directtap', function( e ){
        // A node has been click on
        ni.describe(this);
        
        e.stopPropagation();
    });

    setEdgeActions();

    //
    // Handle hotkeys
    //

    // Pan
    Mousetrap.bind('left', function(e) { cy.panBy({x: 10, y:0}); return false; });
    Mousetrap.bind('right', function(e) { cy.panBy({x: -10, y:0}); return false; });
    Mousetrap.bind('up', function(e) { cy.panBy({x: 0, y:10}); return false; });
    Mousetrap.bind('down', function(e) { cy.panBy({x: 0, y:-10}); return false; });
    
    // Zoom
    Mousetrap.bind(['-', '_'], function() { 
        cy.zoom( {
            level: cy.zoom()*0.9,
            renderedPosition: { x: cy.width()/2, y: cy.height()/2 }
        }); 
    });
    Mousetrap.bind(['=', '+'], function() {
        cy.zoom( {
            level: cy.zoom()*1.2,
            renderedPosition: { x: cy.width()/2, y: cy.height()/2 }
        }); 
    });

    // Collapse selected nodes
    Mousetrap.bind('c', function() {
        ur.do("collapseRecursively", {
            nodes: cy.$(":selected")
        });
    });

    // Expand selected nodes
    Mousetrap.bind('e', function() {
        ur.do("expandRecursively", {
            nodes: cy.$(":selected")
        });
        setEdgeActions();
    });

    // Randomize layout
    Mousetrap.bind('r', function() {
        randomizeLayout();
    });

    // Highlight neighbors
    Mousetrap.bind('h', function() {
        if (!highlight) {
            highlight = true;
            if(cy.$(":selected").length > 0)
                ur.do("highlightNeighbors", cy.$(":selected"));
        } else {
            highlight = false;
            ur.do("removeHighlights");
        }
    });

    // Delete
    Mousetrap.bind('d', function() {
        hideSelectedNodes();
    });

    // App has finished loading
    NProgress.done();
}

function hideSelectedNodes() {
    var actions = [];                    
    var nodesToHide = cy.$(":selected").add(cy.$(":selected").nodes().descendants());                  
    var nodesWithHiddenNeighbor = cy.edges(":hidden").connectedNodes().intersection(nodesToHide);
    actions.push({name: "thinBorder", param: nodesWithHiddenNeighbor});
    actions.push({name: "hide", param: nodesToHide});                    
    nodesWithHiddenNeighbor = nodesToHide.neighborhood(":visible")
        .nodes().difference(nodesToHide).difference(cy.nodes("[thickBorder]"));
    actions.push({name: "thickenBorder", param: nodesWithHiddenNeighbor}); 
    cy.undoRedo().do("batch", actions);
}



function importLayout() {
    var f = document.getElementById("fileUpload").files[0];
    var reader = new FileReader();
    reader.readAsText(f, "UTF-8");
    reader.onload = function(evt) {
        var fileString = evt.target.result;
        //console.log(fileString);
        options = JSON.parse(fileString);
        options.container = document.getElementById('cy');
        options.layout = {name: 'preset'};
        loadCytoscape(options);
    };
}
