/*
Copyright 2018 Duo Security

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

3. Neither the name of the copyright holder nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/
; (function () {
    'use strict';

    var cyRef;

    var nodeUI; // Set in init to refer to our UI element

    // registers the extension on a cytoscape lib ref
    var register = function (cytoscape, $) {
        if (!cytoscape || !$) { return; } // can't register if cytoscape or jquery unspecified

        $.fn.cyNodeInfo = $.fn.cytoscapeNodeInfo = function (options) {
            nodeInfo.apply(this, [options, cytoscape, $]);

            return this; // chainability
        };

        var _instance = {};

        cytoscape('core', 'nodeInfo', function (options) { 
            nodeInfo.apply(this, [options, cytoscape, $]);
            return _instance;
        });

        // This is called when a node is clicked on
        _instance.describe = function (n) {
            // Find parents
            var nodeLocation = $('#nodeLocation');
            nodeLocation.empty();
            var p = n.parent();
            while (!p.empty()) {
                if (nodeLocation.children().length != 0) {
                    nodeLocation.prepend($('<span class="nodeParentSeparater"> &gt; </span>'));
                }
                nodeLocation.prepend($('<span class="nodeParent nodeLink" data-internalid="'+p.data().id+'">'+p.data().name+'</span>'));
                p = p.parent();
            }
            // Ensure something is there
            nodeLocation.prepend('&nbsp;');

            var nodeName = $('#nodeName');
            nodeName.text(n.data().name);

            var summary = $('#Summary');
            summary.empty();
            if (n.data().type == "edge") {
                summary.append('<span class="label">Source:</span><span> '+n.data().source+'</span><br>');
                summary.append('<span class="label">Target:</span><span> '+n.data().target+'</span><br>');
            } else {
                summary.append('<span class="label">Type:</span><span> '+n.data().type+'</span><br>');
                summary.append('<span class="label">ID:</span><span> '+n.data().local_id+'</span><br>');
                summary.append('<span class="label">Name:</span><span> '+n.data().name+'</span><br>');
            }
            
            var details = $('#Details');
            if (typeof n.data().node_data !== 'undefined') {
                details.empty();
                details.append('<pre id="nodeDetails" class="frame">'+JSON.stringify(n.data().node_data, null, 4)+'</pre>');
            }


            $('#Neighbors').empty().append('<span class="label neighborLink" data-internalid="'+n.id()+'">Neighbors:</span><br>');
            var nodeNeighborsList = $('<ul></ul>');
            n.neighborhood().forEach(function (ele) {
                if (ele.isNode()) {
                    nodeNeighborsList.append($('<li class="nodeNeighbor nodeLink" data-internalid="'+ele.id()+'">'+ele.data().name+'</li>'));
                }
            });
            $('#Neighbors').append(nodeNeighborsList);

            $('#Siblings').empty().append('<span class="label siblingLink" data-internalid="'+n.id()+'">Siblings:</span><br>');
            var nodeSiblingsList = $('<ul></ul>');
            n.siblings().forEach(function (ele) {
                if (ele.isNode()) {
                    nodeSiblingsList.append($('<li class="nodeSibling nodeLink" data-internalid="'+ele.id()+'">'+ele.data().name+'</li>'));
                }
            });
            $('#Siblings').append(nodeSiblingsList);

            $('#Children').empty().append('<span class="label childLink" data-internalid="'+n.id()+'">Children:</span><br>');
            var nodeChildrenList = $('<ul></ul>');
            n.children().forEach(function (ele) {
                if (ele.isNode()) {
                    nodeChildrenList.append($('<li class="nodeChild nodeLink" data-internalid="'+ele.id()+'">'+ele.data().name+'</li>'));
                }
            });
            $('#Children').append(nodeChildrenList);


            // Make text for nodes clickable
            var linkClick = function(e) {
                var id = e.target.dataset.internalid;

                // Unselect the currently selected node
                cyRef.nodes().forEach(function(n) { n.unselect(); });

                // Find the node we have an ID for
                var n = cyRef.nodes().getElementById(id);
                
                if ($.inArray("neighborLink", e.target.classList) > 0) {
                    n.neighborhood().forEach(function (ele) {
                        ele.select();
                    });
                } else if ($.inArray("siblingLink", e.target.classList) > 0) {
                    n.siblings().forEach(function (ele) {
                        ele.select();
                    });
                } else if ($.inArray("childLink", e.target.classList) > 0) {
                    n.children().forEach(function (ele) {
                        ele.select();
                    });
                } else {
                    // Select the new one
                    n.select();

                    // Display info about it
                    cyRef.ni.describe(n);
                }
            };
            $(".nodeLink").click(linkClick);
            $(".neighborLink").click(linkClick);
            $(".siblingLink").click(linkClick);
            $(".childLink").click(linkClick);
        };
    };

    var defaults = {};

    var nodeInfo = function (params, cytoscape, $) {
        cyRef = this;
        var options = $.extend(true, {}, defaults, params);
        var fn = params;

        var functions = {
            init: function () {
                return $(cyRef.container()).each(function () {
                    nodeUI = $('#nodeInfo');
                    nodeUI.css('position', 'absolute'); // must be absolute regardless of stylesheet
                });
            }
        };

        if (functions[fn]) {
            return functions[fn].apply(this, Array.prototype.slice.call(arguments, 1));
        } else if (typeof fn == 'object' || !fn) {
            return functions.init.apply(this, arguments);
        } else {
            $.error("No such function `" + fn + "` for jquery.cytoscapeNodeInfo");
        }

        return $(this);
    };

    // expose to global cytoscape (i.e. window.cytoscape)
    if (typeof cytoscape !== 'undefined' && typeof jQuery !== 'undefined') {
        register(cytoscape, jQuery);
    }

})();

