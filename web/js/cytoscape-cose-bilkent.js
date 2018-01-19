(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.cytoscapeCoseBilkent = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
var ns = {
	List: _dereq_('./src/List'),
	Node: _dereq_('./src/Node'),
};

if (typeof module !== 'undefined') {
	module.exports = ns;
} else if (typeof define !== 'undefined') {
	define('LinkedListJS', function () {
		return ns;
	});
} else if (typeof window !== 'undefined') {
	window.LinkedListJS = ns;
}
},{"./src/List":2,"./src/Node":3}],2:[function(_dereq_,module,exports){
var Node = _dereq_('./Node');

var List = function () {
	this._count = 0;
	this._head = null;
	this._tail = null;
};

List.prototype.head = function () {
	return this._head;
};

List.prototype.tail = function () {
	return this._tail;
};

List.prototype.count = function () {
	return this._count;
};

List.prototype.get = function (index) {
	var node = this._head;

	for (var i = 0; i < index; i++) {
		node = node.next();
	}

	return node;
};

List.prototype.set = function (index, value) {
	var node = this.get(index);
	node.set(value);
};

List.prototype.push = function (value) {
	var node = new Node(value, this._tail, null);

	if (this._tail !== null) {
		this._tail.setNext(node);
	}

	if (this._head === null) {
		this._head = node;
	}

	this._tail = node;
	this._count++;

	return node;
};

List.prototype.pop = function () {
	var node = this._tail;

	var new_tail = null;
	if (this._tail.previous() !== null) {
		new_tail = this._tail.previous();
		new_tail.setNext(null);
	}
	
	this._tail = new_tail;

	this._count--;

	if (this._count === 0) {
		this._head = null;
	}

	return node;
};

List.prototype.unshift = function (value) {
	var node = new Node(value, null, this._head);

	if (this._head !== null) {
		this._head.setPrevious(node);
	}

	if (this._tail === null) {
		this._tail = node;
	}
	
	this._head = node;

	this._count++;

	return node;
};

List.prototype.shift = function () {
	var node = this._head;

	var new_head = null;
	if (this._head.next() !== null) {
		new_head = this._head.next();
		new_head.setPrevious(null);
	}

	this._head = new_head;

	this._count--;

	if (this._count === 0) {
		this._tail = null;
	}

	return node;
};

List.prototype.asArray = function () {
	var arr = [];
	var node = this._head;

	while (node) {
		arr.push(node.value());
		node = node.next();
	}

	return arr;
};

List.prototype.truncateTo = function (length) {
	this._count = length;

	if (length === 0) {
		this._head = null;
		this._tail = null;

		return;
	}

	var node = this.get(length-1);
	node.setNext(null);
	this._tail = node;
};

List.prototype.empty = function () {
	this.truncateTo(0);
};

List.prototype.isEmpty = function () {
	return this._head === null;
};

List.prototype.find = function (value) {
	var node = this._head;

	while (node !== null) {
		if (node.value() === value) {
			return node;
		}

		node = node.next();
	}

	return null;
};

List.prototype.each = function (callback) {
	var node = this._head;
	var i = 0;
	while (node !== null) {
		callback(i, node);
		node = node.next();
		i++;
	}
}

module.exports = List;
},{"./Node":3}],3:[function(_dereq_,module,exports){
var Node = function (value, previous, next) {
	this._value = value === undefined ? null : value;
	
	this._previous = previous === undefined ? null : previous;
	this._next = next === undefined ? null : next;
};

Node.prototype.value = function () {
	return this._value;
};

Node.prototype.previous = function () {
	return this._previous;
};

Node.prototype.next = function () {
	return this._next;
};

Node.prototype.set = function (value) {
	this._value = value;
};

Node.prototype.setPrevious = function (node) {
	this._previous = node;
};

Node.prototype.setNext = function (node) {
	this._next = node;
};

Node.prototype.isHead = function () {
	return this._previous === null;
};

Node.prototype.isTail = function () {
	return this._next === null;
};

module.exports = Node;
},{}],4:[function(_dereq_,module,exports){
'use strict';

var FDLayoutConstants = _dereq_('./FDLayoutConstants');

function CoSEConstants() {}

//CoSEConstants inherits static props in FDLayoutConstants
for (var prop in FDLayoutConstants) {
  CoSEConstants[prop] = FDLayoutConstants[prop];
}

CoSEConstants.DEFAULT_USE_MULTI_LEVEL_SCALING = false;
CoSEConstants.DEFAULT_RADIAL_SEPARATION = FDLayoutConstants.DEFAULT_EDGE_LENGTH;
CoSEConstants.DEFAULT_COMPONENT_SEPERATION = 60;
CoSEConstants.TILE = true;
CoSEConstants.TILING_PADDING_VERTICAL = 10;
CoSEConstants.TILING_PADDING_HORIZONTAL = 10;

module.exports = CoSEConstants;

},{"./FDLayoutConstants":13}],5:[function(_dereq_,module,exports){
'use strict';

var FDLayoutEdge = _dereq_('./FDLayoutEdge');

function CoSEEdge(source, target, vEdge) {
  FDLayoutEdge.call(this, source, target, vEdge);
}

CoSEEdge.prototype = Object.create(FDLayoutEdge.prototype);
for (var prop in FDLayoutEdge) {
  CoSEEdge[prop] = FDLayoutEdge[prop];
}

module.exports = CoSEEdge;

},{"./FDLayoutEdge":14}],6:[function(_dereq_,module,exports){
'use strict';

var LGraph = _dereq_('./LGraph');

function CoSEGraph(parent, graphMgr, vGraph) {
  LGraph.call(this, parent, graphMgr, vGraph);
}

CoSEGraph.prototype = Object.create(LGraph.prototype);
for (var prop in LGraph) {
  CoSEGraph[prop] = LGraph[prop];
}

module.exports = CoSEGraph;

},{"./LGraph":22}],7:[function(_dereq_,module,exports){
'use strict';

var LGraphManager = _dereq_('./LGraphManager');

function CoSEGraphManager(layout) {
  LGraphManager.call(this, layout);
}

CoSEGraphManager.prototype = Object.create(LGraphManager.prototype);
for (var prop in LGraphManager) {
  CoSEGraphManager[prop] = LGraphManager[prop];
}

module.exports = CoSEGraphManager;

},{"./LGraphManager":23}],8:[function(_dereq_,module,exports){
'use strict';

var FDLayout = _dereq_('./FDLayout');
var CoSEGraphManager = _dereq_('./CoSEGraphManager');
var CoSEGraph = _dereq_('./CoSEGraph');
var CoSENode = _dereq_('./CoSENode');
var CoSEEdge = _dereq_('./CoSEEdge');
var CoSEConstants = _dereq_('./CoSEConstants');
var FDLayoutConstants = _dereq_('./FDLayoutConstants');
var LayoutConstants = _dereq_('./LayoutConstants');
var Point = _dereq_('./Point');
var PointD = _dereq_('./PointD');
var Layout = _dereq_('./Layout');
var Integer = _dereq_('./Integer');
var IGeometry = _dereq_('./IGeometry');
var LGraph = _dereq_('./LGraph');
var Transform = _dereq_('./Transform');

function CoSELayout() {
  FDLayout.call(this);

  this.toBeTiled = {}; // Memorize if a node is to be tiled or is tiled
}

CoSELayout.prototype = Object.create(FDLayout.prototype);

for (var prop in FDLayout) {
  CoSELayout[prop] = FDLayout[prop];
}

CoSELayout.prototype.newGraphManager = function () {
  var gm = new CoSEGraphManager(this);
  this.graphManager = gm;
  return gm;
};

CoSELayout.prototype.newGraph = function (vGraph) {
  return new CoSEGraph(null, this.graphManager, vGraph);
};

CoSELayout.prototype.newNode = function (vNode) {
  return new CoSENode(this.graphManager, vNode);
};

CoSELayout.prototype.newEdge = function (vEdge) {
  return new CoSEEdge(null, null, vEdge);
};

CoSELayout.prototype.initParameters = function () {
  FDLayout.prototype.initParameters.call(this, arguments);
  if (!this.isSubLayout) {
    if (CoSEConstants.DEFAULT_EDGE_LENGTH < 10) {
      this.idealEdgeLength = 10;
    } else {
      this.idealEdgeLength = CoSEConstants.DEFAULT_EDGE_LENGTH;
    }

    this.useSmartIdealEdgeLengthCalculation = CoSEConstants.DEFAULT_USE_SMART_IDEAL_EDGE_LENGTH_CALCULATION;
    this.springConstant = FDLayoutConstants.DEFAULT_SPRING_STRENGTH;
    this.repulsionConstant = FDLayoutConstants.DEFAULT_REPULSION_STRENGTH;
    this.gravityConstant = FDLayoutConstants.DEFAULT_GRAVITY_STRENGTH;
    this.compoundGravityConstant = FDLayoutConstants.DEFAULT_COMPOUND_GRAVITY_STRENGTH;
    this.gravityRangeFactor = FDLayoutConstants.DEFAULT_GRAVITY_RANGE_FACTOR;
    this.compoundGravityRangeFactor = FDLayoutConstants.DEFAULT_COMPOUND_GRAVITY_RANGE_FACTOR;
  }
};

CoSELayout.prototype.layout = function () {
  var createBendsAsNeeded = LayoutConstants.DEFAULT_CREATE_BENDS_AS_NEEDED;
  if (createBendsAsNeeded) {
    this.createBendpoints();
    this.graphManager.resetAllEdges();
  }

  this.level = 0;
  return this.classicLayout();
};

CoSELayout.prototype.classicLayout = function () {
  this.nodesWithGravity = this.calculateNodesToApplyGravitationTo();
  this.graphManager.setAllNodesToApplyGravitation(this.nodesWithGravity);
  this.calcNoOfChildrenForAllNodes();
  this.graphManager.calcLowestCommonAncestors();
  this.graphManager.calcInclusionTreeDepths();
  this.graphManager.getRoot().calcEstimatedSize();
  this.calcIdealEdgeLengths();

  if (!this.incremental) {
    var forest = this.getFlatForest();

    // The graph associated with this layout is flat and a forest
    if (forest.length > 0) {
      this.positionNodesRadially(forest);
    }
    // The graph associated with this layout is not flat or a forest
    else {
        // Reduce the trees when incremental mode is not enabled and graph is not a forest 
        this.reduceTrees();
        // Update nodes that gravity will be applied
        this.graphManager.resetAllNodesToApplyGravitation();
        var allNodes = new Set(this.getAllNodes());
        var intersection = this.nodesWithGravity.filter(function (x) {
          return allNodes.has(x);
        });
        this.graphManager.setAllNodesToApplyGravitation(intersection);

        this.positionNodesRandomly();
      }
  }

  this.initSpringEmbedder();
  this.runSpringEmbedder();

  return true;
};

CoSELayout.prototype.tick = function () {
  this.totalIterations++;

  if (this.totalIterations === this.maxIterations && !this.isTreeGrowing && !this.isGrowthFinished) {
    if (this.prunedNodesAll.length > 0) {
      this.isTreeGrowing = true;
    } else {
      return true;
    }
  }

  if (this.totalIterations % FDLayoutConstants.CONVERGENCE_CHECK_PERIOD == 0 && !this.isTreeGrowing && !this.isGrowthFinished) {
    if (this.isConverged()) {
      if (this.prunedNodesAll.length > 0) {
        this.isTreeGrowing = true;
      } else {
        return true;
      }
    }

    this.coolingFactor = this.initialCoolingFactor * ((this.maxIterations - this.totalIterations) / this.maxIterations);
    this.animationPeriod = Math.ceil(this.initialAnimationPeriod * Math.sqrt(this.coolingFactor));
  }
  // Operations while tree is growing again 
  if (this.isTreeGrowing) {
    if (this.growTreeIterations % 10 == 0) {
      if (this.prunedNodesAll.length > 0) {
        this.graphManager.updateBounds();
        this.updateGrid();
        this.growTree(this.prunedNodesAll);
        // Update nodes that gravity will be applied
        this.graphManager.resetAllNodesToApplyGravitation();
        var allNodes = new Set(this.getAllNodes());
        var intersection = this.nodesWithGravity.filter(function (x) {
          return allNodes.has(x);
        });
        this.graphManager.setAllNodesToApplyGravitation(intersection);

        this.graphManager.updateBounds();
        this.updateGrid();
        this.coolingFactor = FDLayoutConstants.DEFAULT_COOLING_FACTOR_INCREMENTAL;
      } else {
        this.isTreeGrowing = false;
        this.isGrowthFinished = true;
      }
    }
    this.growTreeIterations++;
  }
  // Operations after growth is finished
  if (this.isGrowthFinished) {
    if (this.isConverged()) {
      return true;
    }
    if (this.afterGrowthIterations % 10 == 0) {
      this.graphManager.updateBounds();
      this.updateGrid();
    }
    this.coolingFactor = FDLayoutConstants.DEFAULT_COOLING_FACTOR_INCREMENTAL * ((100 - this.afterGrowthIterations) / 100);
    this.afterGrowthIterations++;
  }

  this.totalDisplacement = 0;
  this.graphManager.updateBounds();
  this.calcSpringForces();
  this.calcRepulsionForces();
  this.calcGravitationalForces();
  this.moveNodes();
  this.animate();

  return false; // Layout is not ended yet return false
};

CoSELayout.prototype.getPositionsData = function () {
  var allNodes = this.graphManager.getAllNodes();
  var pData = {};
  for (var i = 0; i < allNodes.length; i++) {
    var rect = allNodes[i].rect;
    var id = allNodes[i].id;
    pData[id] = {
      id: id,
      x: rect.getCenterX(),
      y: rect.getCenterY(),
      w: rect.width,
      h: rect.height
    };
  }

  return pData;
};

CoSELayout.prototype.runSpringEmbedder = function () {
  this.initialAnimationPeriod = 25;
  this.animationPeriod = this.initialAnimationPeriod;
  var layoutEnded = false;

  // If aminate option is 'during' signal that layout is supposed to start iterating
  if (FDLayoutConstants.ANIMATE === 'during') {
    this.emit('layoutstarted');
  } else {
    // If aminate option is 'during' tick() function will be called on index.js
    while (!layoutEnded) {
      layoutEnded = this.tick();
    }

    this.graphManager.updateBounds();
  }
};

CoSELayout.prototype.calculateNodesToApplyGravitationTo = function () {
  var nodeList = [];
  var graph;

  var graphs = this.graphManager.getGraphs();
  var size = graphs.length;
  var i;
  for (i = 0; i < size; i++) {
    graph = graphs[i];

    graph.updateConnected();

    if (!graph.isConnected) {
      nodeList = nodeList.concat(graph.getNodes());
    }
  }

  return nodeList;
};

CoSELayout.prototype.calcNoOfChildrenForAllNodes = function () {
  var node;
  var allNodes = this.graphManager.getAllNodes();

  for (var i = 0; i < allNodes.length; i++) {
    node = allNodes[i];
    node.noOfChildren = node.getNoOfChildren();
  }
};

CoSELayout.prototype.createBendpoints = function () {
  var edges = [];
  edges = edges.concat(this.graphManager.getAllEdges());
  var visited = new HashSet();
  var i;
  for (i = 0; i < edges.length; i++) {
    var edge = edges[i];

    if (!visited.contains(edge)) {
      var source = edge.getSource();
      var target = edge.getTarget();

      if (source == target) {
        edge.getBendpoints().push(new PointD());
        edge.getBendpoints().push(new PointD());
        this.createDummyNodesForBendpoints(edge);
        visited.add(edge);
      } else {
        var edgeList = [];

        edgeList = edgeList.concat(source.getEdgeListToNode(target));
        edgeList = edgeList.concat(target.getEdgeListToNode(source));

        if (!visited.contains(edgeList[0])) {
          if (edgeList.length > 1) {
            var k;
            for (k = 0; k < edgeList.length; k++) {
              var multiEdge = edgeList[k];
              multiEdge.getBendpoints().push(new PointD());
              this.createDummyNodesForBendpoints(multiEdge);
            }
          }
          visited.addAll(list);
        }
      }
    }

    if (visited.size() == edges.length) {
      break;
    }
  }
};

CoSELayout.prototype.positionNodesRadially = function (forest) {
  // We tile the trees to a grid row by row; first tree starts at (0,0)
  var currentStartingPoint = new Point(0, 0);
  var numberOfColumns = Math.ceil(Math.sqrt(forest.length));
  var height = 0;
  var currentY = 0;
  var currentX = 0;
  var point = new PointD(0, 0);

  for (var i = 0; i < forest.length; i++) {
    if (i % numberOfColumns == 0) {
      // Start of a new row, make the x coordinate 0, increment the
      // y coordinate with the max height of the previous row
      currentX = 0;
      currentY = height;

      if (i != 0) {
        currentY += CoSEConstants.DEFAULT_COMPONENT_SEPERATION;
      }

      height = 0;
    }

    var tree = forest[i];

    // Find the center of the tree
    var centerNode = Layout.findCenterOfTree(tree);

    // Set the staring point of the next tree
    currentStartingPoint.x = currentX;
    currentStartingPoint.y = currentY;

    // Do a radial layout starting with the center
    point = CoSELayout.radialLayout(tree, centerNode, currentStartingPoint);

    if (point.y > height) {
      height = Math.floor(point.y);
    }

    currentX = Math.floor(point.x + CoSEConstants.DEFAULT_COMPONENT_SEPERATION);
  }

  this.transform(new PointD(LayoutConstants.WORLD_CENTER_X - point.x / 2, LayoutConstants.WORLD_CENTER_Y - point.y / 2));
};

CoSELayout.radialLayout = function (tree, centerNode, startingPoint) {
  var radialSep = Math.max(this.maxDiagonalInTree(tree), CoSEConstants.DEFAULT_RADIAL_SEPARATION);
  CoSELayout.branchRadialLayout(centerNode, null, 0, 359, 0, radialSep);
  var bounds = LGraph.calculateBounds(tree);

  var transform = new Transform();
  transform.setDeviceOrgX(bounds.getMinX());
  transform.setDeviceOrgY(bounds.getMinY());
  transform.setWorldOrgX(startingPoint.x);
  transform.setWorldOrgY(startingPoint.y);

  for (var i = 0; i < tree.length; i++) {
    var node = tree[i];
    node.transform(transform);
  }

  var bottomRight = new PointD(bounds.getMaxX(), bounds.getMaxY());

  return transform.inverseTransformPoint(bottomRight);
};

CoSELayout.branchRadialLayout = function (node, parentOfNode, startAngle, endAngle, distance, radialSeparation) {
  // First, position this node by finding its angle.
  var halfInterval = (endAngle - startAngle + 1) / 2;

  if (halfInterval < 0) {
    halfInterval += 180;
  }

  var nodeAngle = (halfInterval + startAngle) % 360;
  var teta = nodeAngle * IGeometry.TWO_PI / 360;

  // Make polar to java cordinate conversion.
  var cos_teta = Math.cos(teta);
  var x_ = distance * Math.cos(teta);
  var y_ = distance * Math.sin(teta);

  node.setCenter(x_, y_);

  // Traverse all neighbors of this node and recursively call this
  // function.
  var neighborEdges = [];
  neighborEdges = neighborEdges.concat(node.getEdges());
  var childCount = neighborEdges.length;

  if (parentOfNode != null) {
    childCount--;
  }

  var branchCount = 0;

  var incEdgesCount = neighborEdges.length;
  var startIndex;

  var edges = node.getEdgesBetween(parentOfNode);

  // If there are multiple edges, prune them until there remains only one
  // edge.
  while (edges.length > 1) {
    //neighborEdges.remove(edges.remove(0));
    var temp = edges[0];
    edges.splice(0, 1);
    var index = neighborEdges.indexOf(temp);
    if (index >= 0) {
      neighborEdges.splice(index, 1);
    }
    incEdgesCount--;
    childCount--;
  }

  if (parentOfNode != null) {
    //assert edges.length == 1;
    startIndex = (neighborEdges.indexOf(edges[0]) + 1) % incEdgesCount;
  } else {
    startIndex = 0;
  }

  var stepAngle = Math.abs(endAngle - startAngle) / childCount;

  for (var i = startIndex; branchCount != childCount; i = ++i % incEdgesCount) {
    var currentNeighbor = neighborEdges[i].getOtherEnd(node);

    // Don't back traverse to root node in current tree.
    if (currentNeighbor == parentOfNode) {
      continue;
    }

    var childStartAngle = (startAngle + branchCount * stepAngle) % 360;
    var childEndAngle = (childStartAngle + stepAngle) % 360;

    CoSELayout.branchRadialLayout(currentNeighbor, node, childStartAngle, childEndAngle, distance + radialSeparation, radialSeparation);

    branchCount++;
  }
};

CoSELayout.maxDiagonalInTree = function (tree) {
  var maxDiagonal = Integer.MIN_VALUE;

  for (var i = 0; i < tree.length; i++) {
    var node = tree[i];
    var diagonal = node.getDiagonal();

    if (diagonal > maxDiagonal) {
      maxDiagonal = diagonal;
    }
  }

  return maxDiagonal;
};

CoSELayout.prototype.calcRepulsionRange = function () {
  // formula is 2 x (level + 1) x idealEdgeLength
  return 2 * (this.level + 1) * this.idealEdgeLength;
};

// Tiling methods

// Group zero degree members whose parents are not to be tiled, create dummy parents where needed and fill memberGroups by their dummp parent id's
CoSELayout.prototype.groupZeroDegreeMembers = function () {
  var self = this;
  // array of [parent_id x oneDegreeNode_id]
  var tempMemberGroups = {}; // A temporary map of parent node and its zero degree members
  this.memberGroups = {}; // A map of dummy parent node and its zero degree members whose parents are not to be tiled
  this.idToDummyNode = {}; // A map of id to dummy node 

  var zeroDegree = []; // List of zero degree nodes whose parents are not to be tiled
  var allNodes = this.graphManager.getAllNodes();

  // Fill zero degree list
  for (var i = 0; i < allNodes.length; i++) {
    var node = allNodes[i];
    var parent = node.getParent();
    // If a node has zero degree and its parent is not to be tiled if exists add that node to zeroDegres list
    if (this.getNodeDegreeWithChildren(node) === 0 && (parent.id == undefined || !this.getToBeTiled(parent))) {
      zeroDegree.push(node);
    }
  }

  // Create a map of parent node and its zero degree members
  for (var i = 0; i < zeroDegree.length; i++) {
    var node = zeroDegree[i]; // Zero degree node itself
    var p_id = node.getParent().id; // Parent id

    if (typeof tempMemberGroups[p_id] === "undefined") tempMemberGroups[p_id] = [];

    tempMemberGroups[p_id] = tempMemberGroups[p_id].concat(node); // Push node to the list belongs to its parent in tempMemberGroups
  }

  // If there are at least two nodes at a level, create a dummy compound for them
  Object.keys(tempMemberGroups).forEach(function (p_id) {
    if (tempMemberGroups[p_id].length > 1) {
      var dummyCompoundId = "DummyCompound_" + p_id; // The id of dummy compound which will be created soon
      self.memberGroups[dummyCompoundId] = tempMemberGroups[p_id]; // Add dummy compound to memberGroups

      var parent = tempMemberGroups[p_id][0].getParent(); // The parent of zero degree nodes will be the parent of new dummy compound

      // Create a dummy compound with calculated id
      var dummyCompound = new CoSENode(self.graphManager);
      dummyCompound.id = dummyCompoundId;
      dummyCompound.paddingLeft = parent.paddingLeft || 0;
      dummyCompound.paddingRight = parent.paddingRight || 0;
      dummyCompound.paddingBottom = parent.paddingBottom || 0;
      dummyCompound.paddingTop = parent.paddingTop || 0;

      self.idToDummyNode[dummyCompoundId] = dummyCompound;

      var dummyParentGraph = self.getGraphManager().add(self.newGraph(), dummyCompound);
      var parentGraph = parent.getChild();

      // Add dummy compound to parent the graph
      parentGraph.add(dummyCompound);

      // For each zero degree node in this level remove it from its parent graph and add it to the graph of dummy parent
      for (var i = 0; i < tempMemberGroups[p_id].length; i++) {
        var node = tempMemberGroups[p_id][i];

        parentGraph.remove(node);
        dummyParentGraph.add(node);
      }
    }
  });
};

CoSELayout.prototype.clearCompounds = function () {
  var childGraphMap = {};
  var idToNode = {};

  // Get compound ordering by finding the inner one first
  this.performDFSOnCompounds();

  for (var i = 0; i < this.compoundOrder.length; i++) {

    idToNode[this.compoundOrder[i].id] = this.compoundOrder[i];
    childGraphMap[this.compoundOrder[i].id] = [].concat(this.compoundOrder[i].getChild().getNodes());

    // Remove children of compounds
    this.graphManager.remove(this.compoundOrder[i].getChild());
    this.compoundOrder[i].child = null;
  }

  this.graphManager.resetAllNodes();

  // Tile the removed children
  this.tileCompoundMembers(childGraphMap, idToNode);
};

CoSELayout.prototype.clearZeroDegreeMembers = function () {
  var self = this;
  var tiledZeroDegreePack = this.tiledZeroDegreePack = [];

  Object.keys(this.memberGroups).forEach(function (id) {
    var compoundNode = self.idToDummyNode[id]; // Get the dummy compound

    tiledZeroDegreePack[id] = self.tileNodes(self.memberGroups[id], compoundNode.paddingLeft + compoundNode.paddingRight);

    // Set the width and height of the dummy compound as calculated
    compoundNode.rect.width = tiledZeroDegreePack[id].width;
    compoundNode.rect.height = tiledZeroDegreePack[id].height;
  });
};

CoSELayout.prototype.repopulateCompounds = function () {
  for (var i = this.compoundOrder.length - 1; i >= 0; i--) {
    var lCompoundNode = this.compoundOrder[i];
    var id = lCompoundNode.id;
    var horizontalMargin = lCompoundNode.paddingLeft;
    var verticalMargin = lCompoundNode.paddingTop;

    this.adjustLocations(this.tiledMemberPack[id], lCompoundNode.rect.x, lCompoundNode.rect.y, horizontalMargin, verticalMargin);
  }
};

CoSELayout.prototype.repopulateZeroDegreeMembers = function () {
  var self = this;
  var tiledPack = this.tiledZeroDegreePack;

  Object.keys(tiledPack).forEach(function (id) {
    var compoundNode = self.idToDummyNode[id]; // Get the dummy compound by its id
    var horizontalMargin = compoundNode.paddingLeft;
    var verticalMargin = compoundNode.paddingTop;

    // Adjust the positions of nodes wrt its compound
    self.adjustLocations(tiledPack[id], compoundNode.rect.x, compoundNode.rect.y, horizontalMargin, verticalMargin);
  });
};

CoSELayout.prototype.getToBeTiled = function (node) {
  var id = node.id;
  //firstly check the previous results
  if (this.toBeTiled[id] != null) {
    return this.toBeTiled[id];
  }

  //only compound nodes are to be tiled
  var childGraph = node.getChild();
  if (childGraph == null) {
    this.toBeTiled[id] = false;
    return false;
  }

  var children = childGraph.getNodes(); // Get the children nodes

  //a compound node is not to be tiled if all of its compound children are not to be tiled
  for (var i = 0; i < children.length; i++) {
    var theChild = children[i];

    if (this.getNodeDegree(theChild) > 0) {
      this.toBeTiled[id] = false;
      return false;
    }

    //pass the children not having the compound structure
    if (theChild.getChild() == null) {
      this.toBeTiled[theChild.id] = false;
      continue;
    }

    if (!this.getToBeTiled(theChild)) {
      this.toBeTiled[id] = false;
      return false;
    }
  }
  this.toBeTiled[id] = true;
  return true;
};

// Get degree of a node depending of its edges and independent of its children
CoSELayout.prototype.getNodeDegree = function (node) {
  var id = node.id;
  var edges = node.getEdges();
  var degree = 0;

  // For the edges connected
  for (var i = 0; i < edges.length; i++) {
    var edge = edges[i];
    if (edge.getSource().id !== edge.getTarget().id) {
      degree = degree + 1;
    }
  }
  return degree;
};

// Get degree of a node with its children
CoSELayout.prototype.getNodeDegreeWithChildren = function (node) {
  var degree = this.getNodeDegree(node);
  if (node.getChild() == null) {
    return degree;
  }
  var children = node.getChild().getNodes();
  for (var i = 0; i < children.length; i++) {
    var child = children[i];
    degree += this.getNodeDegreeWithChildren(child);
  }
  return degree;
};

CoSELayout.prototype.performDFSOnCompounds = function () {
  this.compoundOrder = [];
  this.fillCompexOrderByDFS(this.graphManager.getRoot().getNodes());
};

CoSELayout.prototype.fillCompexOrderByDFS = function (children) {
  for (var i = 0; i < children.length; i++) {
    var child = children[i];
    if (child.getChild() != null) {
      this.fillCompexOrderByDFS(child.getChild().getNodes());
    }
    if (this.getToBeTiled(child)) {
      this.compoundOrder.push(child);
    }
  }
};

/**
* This method places each zero degree member wrt given (x,y) coordinates (top left).
*/
CoSELayout.prototype.adjustLocations = function (organization, x, y, compoundHorizontalMargin, compoundVerticalMargin) {
  x += compoundHorizontalMargin;
  y += compoundVerticalMargin;

  var left = x;

  for (var i = 0; i < organization.rows.length; i++) {
    var row = organization.rows[i];
    x = left;
    var maxHeight = 0;

    for (var j = 0; j < row.length; j++) {
      var lnode = row[j];

      lnode.rect.x = x; // + lnode.rect.width / 2;
      lnode.rect.y = y; // + lnode.rect.height / 2;

      x += lnode.rect.width + organization.horizontalPadding;

      if (lnode.rect.height > maxHeight) maxHeight = lnode.rect.height;
    }

    y += maxHeight + organization.verticalPadding;
  }
};

CoSELayout.prototype.tileCompoundMembers = function (childGraphMap, idToNode) {
  var self = this;
  this.tiledMemberPack = [];

  Object.keys(childGraphMap).forEach(function (id) {
    // Get the compound node
    var compoundNode = idToNode[id];

    self.tiledMemberPack[id] = self.tileNodes(childGraphMap[id], compoundNode.paddingLeft + compoundNode.paddingRight);

    compoundNode.rect.width = self.tiledMemberPack[id].width + 20;
    compoundNode.rect.height = self.tiledMemberPack[id].height + 20;
  });
};

CoSELayout.prototype.tileNodes = function (nodes, minWidth) {
  var verticalPadding = CoSEConstants.TILING_PADDING_VERTICAL;
  var horizontalPadding = CoSEConstants.TILING_PADDING_HORIZONTAL;
  var organization = {
    rows: [],
    rowWidth: [],
    rowHeight: [],
    width: 20,
    height: 20,
    verticalPadding: verticalPadding,
    horizontalPadding: horizontalPadding
  };

  // Sort the nodes in ascending order of their areas
  nodes.sort(function (n1, n2) {
    if (n1.rect.width * n1.rect.height > n2.rect.width * n2.rect.height) return -1;
    if (n1.rect.width * n1.rect.height < n2.rect.width * n2.rect.height) return 1;
    return 0;
  });

  // Create the organization -> tile members
  for (var i = 0; i < nodes.length; i++) {
    var lNode = nodes[i];

    if (organization.rows.length == 0) {
      this.insertNodeToRow(organization, lNode, 0, minWidth);
    } else if (this.canAddHorizontal(organization, lNode.rect.width, lNode.rect.height)) {
      this.insertNodeToRow(organization, lNode, this.getShortestRowIndex(organization), minWidth);
    } else {
      this.insertNodeToRow(organization, lNode, organization.rows.length, minWidth);
    }

    this.shiftToLastRow(organization);
  }

  return organization;
};

CoSELayout.prototype.insertNodeToRow = function (organization, node, rowIndex, minWidth) {
  var minCompoundSize = minWidth;

  // Add new row if needed
  if (rowIndex == organization.rows.length) {
    var secondDimension = [];

    organization.rows.push(secondDimension);
    organization.rowWidth.push(minCompoundSize);
    organization.rowHeight.push(0);
  }

  // Update row width
  var w = organization.rowWidth[rowIndex] + node.rect.width;

  if (organization.rows[rowIndex].length > 0) {
    w += organization.horizontalPadding;
  }

  organization.rowWidth[rowIndex] = w;
  // Update compound width
  if (organization.width < w) {
    organization.width = w;
  }

  // Update height
  var h = node.rect.height;
  if (rowIndex > 0) h += organization.verticalPadding;

  var extraHeight = 0;
  if (h > organization.rowHeight[rowIndex]) {
    extraHeight = organization.rowHeight[rowIndex];
    organization.rowHeight[rowIndex] = h;
    extraHeight = organization.rowHeight[rowIndex] - extraHeight;
  }

  organization.height += extraHeight;

  // Insert node
  organization.rows[rowIndex].push(node);
};

//Scans the rows of an organization and returns the one with the min width
CoSELayout.prototype.getShortestRowIndex = function (organization) {
  var r = -1;
  var min = Number.MAX_VALUE;

  for (var i = 0; i < organization.rows.length; i++) {
    if (organization.rowWidth[i] < min) {
      r = i;
      min = organization.rowWidth[i];
    }
  }
  return r;
};

//Scans the rows of an organization and returns the one with the max width
CoSELayout.prototype.getLongestRowIndex = function (organization) {
  var r = -1;
  var max = Number.MIN_VALUE;

  for (var i = 0; i < organization.rows.length; i++) {

    if (organization.rowWidth[i] > max) {
      r = i;
      max = organization.rowWidth[i];
    }
  }

  return r;
};

/**
* This method checks whether adding extra width to the organization violates
* the aspect ratio(1) or not.
*/
CoSELayout.prototype.canAddHorizontal = function (organization, extraWidth, extraHeight) {

  var sri = this.getShortestRowIndex(organization);

  if (sri < 0) {
    return true;
  }

  var min = organization.rowWidth[sri];

  if (min + organization.horizontalPadding + extraWidth <= organization.width) return true;

  var hDiff = 0;

  // Adding to an existing row
  if (organization.rowHeight[sri] < extraHeight) {
    if (sri > 0) hDiff = extraHeight + organization.verticalPadding - organization.rowHeight[sri];
  }

  var add_to_row_ratio;
  if (organization.width - min >= extraWidth + organization.horizontalPadding) {
    add_to_row_ratio = (organization.height + hDiff) / (min + extraWidth + organization.horizontalPadding);
  } else {
    add_to_row_ratio = (organization.height + hDiff) / organization.width;
  }

  // Adding a new row for this node
  hDiff = extraHeight + organization.verticalPadding;
  var add_new_row_ratio;
  if (organization.width < extraWidth) {
    add_new_row_ratio = (organization.height + hDiff) / extraWidth;
  } else {
    add_new_row_ratio = (organization.height + hDiff) / organization.width;
  }

  if (add_new_row_ratio < 1) add_new_row_ratio = 1 / add_new_row_ratio;

  if (add_to_row_ratio < 1) add_to_row_ratio = 1 / add_to_row_ratio;

  return add_to_row_ratio < add_new_row_ratio;
};

//If moving the last node from the longest row and adding it to the last
//row makes the bounding box smaller, do it.
CoSELayout.prototype.shiftToLastRow = function (organization) {
  var longest = this.getLongestRowIndex(organization);
  var last = organization.rowWidth.length - 1;
  var row = organization.rows[longest];
  var node = row[row.length - 1];

  var diff = node.width + organization.horizontalPadding;

  // Check if there is enough space on the last row
  if (organization.width - organization.rowWidth[last] > diff && longest != last) {
    // Remove the last element of the longest row
    row.splice(-1, 1);

    // Push it to the last row
    organization.rows[last].push(node);

    organization.rowWidth[longest] = organization.rowWidth[longest] - diff;
    organization.rowWidth[last] = organization.rowWidth[last] + diff;
    organization.width = organization.rowWidth[instance.getLongestRowIndex(organization)];

    // Update heights of the organization
    var maxHeight = Number.MIN_VALUE;
    for (var i = 0; i < row.length; i++) {
      if (row[i].height > maxHeight) maxHeight = row[i].height;
    }
    if (longest > 0) maxHeight += organization.verticalPadding;

    var prevTotal = organization.rowHeight[longest] + organization.rowHeight[last];

    organization.rowHeight[longest] = maxHeight;
    if (organization.rowHeight[last] < node.height + organization.verticalPadding) organization.rowHeight[last] = node.height + organization.verticalPadding;

    var finalTotal = organization.rowHeight[longest] + organization.rowHeight[last];
    organization.height += finalTotal - prevTotal;

    this.shiftToLastRow(organization);
  }
};

CoSELayout.prototype.tilingPreLayout = function () {
  if (CoSEConstants.TILE) {
    // Find zero degree nodes and create a compound for each level
    this.groupZeroDegreeMembers();
    // Tile and clear children of each compound
    this.clearCompounds();
    // Separately tile and clear zero degree nodes for each level
    this.clearZeroDegreeMembers();
  }
};

CoSELayout.prototype.tilingPostLayout = function () {
  if (CoSEConstants.TILE) {
    this.repopulateZeroDegreeMembers();
    this.repopulateCompounds();
  }
};

module.exports = CoSELayout;

},{"./CoSEConstants":4,"./CoSEEdge":5,"./CoSEGraph":6,"./CoSEGraphManager":7,"./CoSENode":9,"./FDLayout":12,"./FDLayoutConstants":13,"./IGeometry":18,"./Integer":20,"./LGraph":22,"./Layout":26,"./LayoutConstants":27,"./Point":28,"./PointD":29,"./Transform":32}],9:[function(_dereq_,module,exports){
'use strict';

var FDLayoutNode = _dereq_('./FDLayoutNode');
var IMath = _dereq_('./IMath');

function CoSENode(gm, loc, size, vNode) {
  FDLayoutNode.call(this, gm, loc, size, vNode);
}

CoSENode.prototype = Object.create(FDLayoutNode.prototype);
for (var prop in FDLayoutNode) {
  CoSENode[prop] = FDLayoutNode[prop];
}

CoSENode.prototype.move = function () {
  var layout = this.graphManager.getLayout();
  this.displacementX = layout.coolingFactor * (this.springForceX + this.repulsionForceX + this.gravitationForceX) / this.noOfChildren;
  this.displacementY = layout.coolingFactor * (this.springForceY + this.repulsionForceY + this.gravitationForceY) / this.noOfChildren;

  if (Math.abs(this.displacementX) > layout.coolingFactor * layout.maxNodeDisplacement) {
    this.displacementX = layout.coolingFactor * layout.maxNodeDisplacement * IMath.sign(this.displacementX);
  }

  if (Math.abs(this.displacementY) > layout.coolingFactor * layout.maxNodeDisplacement) {
    this.displacementY = layout.coolingFactor * layout.maxNodeDisplacement * IMath.sign(this.displacementY);
  }

  // a simple node, just move it
  if (this.child == null) {
    this.moveBy(this.displacementX, this.displacementY);
  }
  // an empty compound node, again just move it
  else if (this.child.getNodes().length == 0) {
      this.moveBy(this.displacementX, this.displacementY);
    }
    // non-empty compound node, propogate movement to children as well
    else {
        this.propogateDisplacementToChildren(this.displacementX, this.displacementY);
      }

  layout.totalDisplacement += Math.abs(this.displacementX) + Math.abs(this.displacementY);

  this.springForceX = 0;
  this.springForceY = 0;
  this.repulsionForceX = 0;
  this.repulsionForceY = 0;
  this.gravitationForceX = 0;
  this.gravitationForceY = 0;
  this.displacementX = 0;
  this.displacementY = 0;
};

CoSENode.prototype.propogateDisplacementToChildren = function (dX, dY) {
  var nodes = this.getChild().getNodes();
  var node;
  for (var i = 0; i < nodes.length; i++) {
    node = nodes[i];
    if (node.getChild() == null) {
      node.moveBy(dX, dY);
      node.displacementX += dX;
      node.displacementY += dY;
    } else {
      node.propogateDisplacementToChildren(dX, dY);
    }
  }
};

CoSENode.prototype.setPred1 = function (pred1) {
  this.pred1 = pred1;
};

CoSENode.prototype.getPred1 = function () {
  return pred1;
};

CoSENode.prototype.getPred2 = function () {
  return pred2;
};

CoSENode.prototype.setNext = function (next) {
  this.next = next;
};

CoSENode.prototype.getNext = function () {
  return next;
};

CoSENode.prototype.setProcessed = function (processed) {
  this.processed = processed;
};

CoSENode.prototype.isProcessed = function () {
  return processed;
};

module.exports = CoSENode;

},{"./FDLayoutNode":15,"./IMath":19}],10:[function(_dereq_,module,exports){
"use strict";

function DimensionD(width, height) {
  this.width = 0;
  this.height = 0;
  if (width !== null && height !== null) {
    this.height = height;
    this.width = width;
  }
}

DimensionD.prototype.getWidth = function () {
  return this.width;
};

DimensionD.prototype.setWidth = function (width) {
  this.width = width;
};

DimensionD.prototype.getHeight = function () {
  return this.height;
};

DimensionD.prototype.setHeight = function (height) {
  this.height = height;
};

module.exports = DimensionD;

},{}],11:[function(_dereq_,module,exports){
"use strict";

function Emitter() {
  this.listeners = [];
}

var p = Emitter.prototype;

p.addListener = function (event, callback) {
  this.listeners.push({
    event: event,
    callback: callback
  });
};

p.removeListener = function (event, callback) {
  for (var i = this.listeners.length; i >= 0; i--) {
    var l = this.listeners[i];

    if (l.event === event && l.callback === callback) {
      this.listeners.splice(i, 1);
    }
  }
};

p.emit = function (event, data) {
  for (var i = 0; i < this.listeners.length; i++) {
    var l = this.listeners[i];

    if (event === l.event) {
      l.callback(data);
    }
  }
};

module.exports = Emitter;

},{}],12:[function(_dereq_,module,exports){
'use strict';

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var Layout = _dereq_('./Layout');
var FDLayoutConstants = _dereq_('./FDLayoutConstants');
var LayoutConstants = _dereq_('./LayoutConstants');
var IGeometry = _dereq_('./IGeometry');
var IMath = _dereq_('./IMath');
var Integer = _dereq_('./Integer');

function FDLayout() {
  Layout.call(this);

  this.useSmartIdealEdgeLengthCalculation = FDLayoutConstants.DEFAULT_USE_SMART_IDEAL_EDGE_LENGTH_CALCULATION;
  this.idealEdgeLength = FDLayoutConstants.DEFAULT_EDGE_LENGTH;
  this.springConstant = FDLayoutConstants.DEFAULT_SPRING_STRENGTH;
  this.repulsionConstant = FDLayoutConstants.DEFAULT_REPULSION_STRENGTH;
  this.gravityConstant = FDLayoutConstants.DEFAULT_GRAVITY_STRENGTH;
  this.compoundGravityConstant = FDLayoutConstants.DEFAULT_COMPOUND_GRAVITY_STRENGTH;
  this.gravityRangeFactor = FDLayoutConstants.DEFAULT_GRAVITY_RANGE_FACTOR;
  this.compoundGravityRangeFactor = FDLayoutConstants.DEFAULT_COMPOUND_GRAVITY_RANGE_FACTOR;
  this.displacementThresholdPerNode = 3.0 * FDLayoutConstants.DEFAULT_EDGE_LENGTH / 100;
  this.coolingFactor = FDLayoutConstants.DEFAULT_COOLING_FACTOR_INCREMENTAL;
  this.initialCoolingFactor = FDLayoutConstants.DEFAULT_COOLING_FACTOR_INCREMENTAL;
  this.totalDisplacement = 0.0;
  this.oldTotalDisplacement = 0.0;
  this.maxIterations = FDLayoutConstants.MAX_ITERATIONS;
}

FDLayout.prototype = Object.create(Layout.prototype);

for (var prop in Layout) {
  FDLayout[prop] = Layout[prop];
}

FDLayout.prototype.initParameters = function () {
  Layout.prototype.initParameters.call(this, arguments);

  if (this.layoutQuality == LayoutConstants.DRAFT_QUALITY) {
    this.displacementThresholdPerNode += 0.30;
    this.maxIterations *= 0.8;
  } else if (this.layoutQuality == LayoutConstants.PROOF_QUALITY) {
    this.displacementThresholdPerNode -= 0.30;
    this.maxIterations *= 1.2;
  }

  this.totalIterations = 0;
  this.notAnimatedIterations = 0;

  this.useFRGridVariant = FDLayoutConstants.DEFAULT_USE_SMART_REPULSION_RANGE_CALCULATION;

  this.grid = [];
  // variables for tree reduction support
  this.prunedNodesAll = [];
  this.growTreeIterations = 0;
  this.afterGrowthIterations = 0;
  this.isTreeGrowing = false;
  this.isGrowthFinished = false;
};

FDLayout.prototype.calcIdealEdgeLengths = function () {
  var edge;
  var lcaDepth;
  var source;
  var target;
  var sizeOfSourceInLca;
  var sizeOfTargetInLca;

  var allEdges = this.getGraphManager().getAllEdges();
  for (var i = 0; i < allEdges.length; i++) {
    edge = allEdges[i];

    edge.idealLength = this.idealEdgeLength;

    if (edge.isInterGraph) {
      source = edge.getSource();
      target = edge.getTarget();

      sizeOfSourceInLca = edge.getSourceInLca().getEstimatedSize();
      sizeOfTargetInLca = edge.getTargetInLca().getEstimatedSize();

      if (this.useSmartIdealEdgeLengthCalculation) {
        edge.idealLength += sizeOfSourceInLca + sizeOfTargetInLca - 2 * LayoutConstants.SIMPLE_NODE_SIZE;
      }

      lcaDepth = edge.getLca().getInclusionTreeDepth();

      edge.idealLength += FDLayoutConstants.DEFAULT_EDGE_LENGTH * FDLayoutConstants.PER_LEVEL_IDEAL_EDGE_LENGTH_FACTOR * (source.getInclusionTreeDepth() + target.getInclusionTreeDepth() - 2 * lcaDepth);
    }
  }
};

FDLayout.prototype.initSpringEmbedder = function () {

  if (this.incremental) {
    this.maxNodeDisplacement = FDLayoutConstants.MAX_NODE_DISPLACEMENT_INCREMENTAL;
  } else {
    this.coolingFactor = 1.0;
    this.initialCoolingFactor = 1.0;
    this.maxNodeDisplacement = FDLayoutConstants.MAX_NODE_DISPLACEMENT;
  }

  this.maxIterations = Math.max(this.getAllNodes().length * 5, this.maxIterations);

  this.totalDisplacementThreshold = this.displacementThresholdPerNode * this.getAllNodes().length;

  this.repulsionRange = this.calcRepulsionRange();
};

FDLayout.prototype.calcSpringForces = function () {
  var lEdges = this.getAllEdges();
  var edge;

  for (var i = 0; i < lEdges.length; i++) {
    edge = lEdges[i];

    this.calcSpringForce(edge, edge.idealLength);
  }
};

FDLayout.prototype.calcRepulsionForces = function () {
  var i, j;
  var nodeA, nodeB;
  var lNodes = this.getAllNodes();
  var processedNodeSet;

  if (this.useFRGridVariant) {
    if (this.totalIterations % FDLayoutConstants.GRID_CALCULATION_CHECK_PERIOD == 1 && !this.isTreeGrowing && !this.isGrowthFinished) {
      this.updateGrid();
    }

    processedNodeSet = new Set();

    // calculate repulsion forces between each nodes and its surrounding
    for (i = 0; i < lNodes.length; i++) {
      nodeA = lNodes[i];
      this.calculateRepulsionForceOfANode(nodeA, processedNodeSet);
      processedNodeSet.add(nodeA);
    }
  } else {
    for (i = 0; i < lNodes.length; i++) {
      nodeA = lNodes[i];

      for (j = i + 1; j < lNodes.length; j++) {
        nodeB = lNodes[j];

        // If both nodes are not members of the same graph, skip.
        if (nodeA.getOwner() != nodeB.getOwner()) {
          continue;
        }

        this.calcRepulsionForce(nodeA, nodeB);
      }
    }
  }
};

FDLayout.prototype.calcGravitationalForces = function () {
  var node;
  var lNodes = this.getAllNodesToApplyGravitation();

  for (var i = 0; i < lNodes.length; i++) {
    node = lNodes[i];
    this.calcGravitationalForce(node);
  }
};

FDLayout.prototype.moveNodes = function () {
  var lNodes = this.getAllNodes();
  var node;

  for (var i = 0; i < lNodes.length; i++) {
    node = lNodes[i];
    node.move();
  }
};

FDLayout.prototype.calcSpringForce = function (edge, idealLength) {
  var sourceNode = edge.getSource();
  var targetNode = edge.getTarget();

  var length;
  var springForce;
  var springForceX;
  var springForceY;

  // Update edge length
  if (this.uniformLeafNodeSizes && sourceNode.getChild() == null && targetNode.getChild() == null) {
    edge.updateLengthSimple();
  } else {
    edge.updateLength();

    if (edge.isOverlapingSourceAndTarget) {
      return;
    }
  }

  length = edge.getLength();

  // Calculate spring forces
  springForce = this.springConstant * (length - idealLength);

  // Project force onto x and y axes
  springForceX = springForce * (edge.lengthX / length);
  springForceY = springForce * (edge.lengthY / length);

  // Apply forces on the end nodes
  sourceNode.springForceX += springForceX;
  sourceNode.springForceY += springForceY;
  targetNode.springForceX -= springForceX;
  targetNode.springForceY -= springForceY;
};

FDLayout.prototype.calcRepulsionForce = function (nodeA, nodeB) {
  var rectA = nodeA.getRect();
  var rectB = nodeB.getRect();
  var overlapAmount = new Array(2);
  var clipPoints = new Array(4);
  var distanceX;
  var distanceY;
  var distanceSquared;
  var distance;
  var repulsionForce;
  var repulsionForceX;
  var repulsionForceY;

  if (rectA.intersects(rectB)) // two nodes overlap
    {
      // calculate separation amount in x and y directions
      IGeometry.calcSeparationAmount(rectA, rectB, overlapAmount, FDLayoutConstants.DEFAULT_EDGE_LENGTH / 2.0);

      repulsionForceX = 2 * overlapAmount[0];
      repulsionForceY = 2 * overlapAmount[1];

      var childrenConstant = nodeA.noOfChildren * nodeB.noOfChildren / (nodeA.noOfChildren + nodeB.noOfChildren);

      // Apply forces on the two nodes
      nodeA.repulsionForceX -= childrenConstant * repulsionForceX;
      nodeA.repulsionForceY -= childrenConstant * repulsionForceY;
      nodeB.repulsionForceX += childrenConstant * repulsionForceX;
      nodeB.repulsionForceY += childrenConstant * repulsionForceY;
    } else // no overlap
    {
      // calculate distance

      if (this.uniformLeafNodeSizes && nodeA.getChild() == null && nodeB.getChild() == null) // simply base repulsion on distance of node centers
        {
          distanceX = rectB.getCenterX() - rectA.getCenterX();
          distanceY = rectB.getCenterY() - rectA.getCenterY();
        } else // use clipping points
        {
          IGeometry.getIntersection(rectA, rectB, clipPoints);

          distanceX = clipPoints[2] - clipPoints[0];
          distanceY = clipPoints[3] - clipPoints[1];
        }

      // No repulsion range. FR grid variant should take care of this.
      if (Math.abs(distanceX) < FDLayoutConstants.MIN_REPULSION_DIST) {
        distanceX = IMath.sign(distanceX) * FDLayoutConstants.MIN_REPULSION_DIST;
      }

      if (Math.abs(distanceY) < FDLayoutConstants.MIN_REPULSION_DIST) {
        distanceY = IMath.sign(distanceY) * FDLayoutConstants.MIN_REPULSION_DIST;
      }

      distanceSquared = distanceX * distanceX + distanceY * distanceY;
      distance = Math.sqrt(distanceSquared);

      repulsionForce = this.repulsionConstant * nodeA.noOfChildren * nodeB.noOfChildren / distanceSquared;

      // Project force onto x and y axes
      repulsionForceX = repulsionForce * distanceX / distance;
      repulsionForceY = repulsionForce * distanceY / distance;

      // Apply forces on the two nodes    
      nodeA.repulsionForceX -= repulsionForceX;
      nodeA.repulsionForceY -= repulsionForceY;
      nodeB.repulsionForceX += repulsionForceX;
      nodeB.repulsionForceY += repulsionForceY;
    }
};

FDLayout.prototype.calcGravitationalForce = function (node) {
  var ownerGraph;
  var ownerCenterX;
  var ownerCenterY;
  var distanceX;
  var distanceY;
  var absDistanceX;
  var absDistanceY;
  var estimatedSize;
  ownerGraph = node.getOwner();

  ownerCenterX = (ownerGraph.getRight() + ownerGraph.getLeft()) / 2;
  ownerCenterY = (ownerGraph.getTop() + ownerGraph.getBottom()) / 2;
  distanceX = node.getCenterX() - ownerCenterX;
  distanceY = node.getCenterY() - ownerCenterY;
  absDistanceX = Math.abs(distanceX) + node.getWidth() / 2;
  absDistanceY = Math.abs(distanceY) + node.getHeight() / 2;

  if (node.getOwner() == this.graphManager.getRoot()) // in the root graph
    {
      estimatedSize = ownerGraph.getEstimatedSize() * this.gravityRangeFactor;

      if (absDistanceX > estimatedSize || absDistanceY > estimatedSize) {
        node.gravitationForceX = -this.gravityConstant * distanceX;
        node.gravitationForceY = -this.gravityConstant * distanceY;
      }
    } else // inside a compound
    {
      estimatedSize = ownerGraph.getEstimatedSize() * this.compoundGravityRangeFactor;

      if (absDistanceX > estimatedSize || absDistanceY > estimatedSize) {
        node.gravitationForceX = -this.gravityConstant * distanceX * this.compoundGravityConstant;
        node.gravitationForceY = -this.gravityConstant * distanceY * this.compoundGravityConstant;
      }
    }
};

FDLayout.prototype.isConverged = function () {
  var converged;
  var oscilating = false;

  if (this.totalIterations > this.maxIterations / 3) {
    oscilating = Math.abs(this.totalDisplacement - this.oldTotalDisplacement) < 2;
  }

  converged = this.totalDisplacement < this.totalDisplacementThreshold;

  this.oldTotalDisplacement = this.totalDisplacement;

  return converged || oscilating;
};

FDLayout.prototype.animate = function () {
  if (this.animationDuringLayout && !this.isSubLayout) {
    if (this.notAnimatedIterations == this.animationPeriod) {
      this.update();
      this.notAnimatedIterations = 0;
    } else {
      this.notAnimatedIterations++;
    }
  }
};

// -----------------------------------------------------------------------------
// Section: FR-Grid Variant Repulsion Force Calculation
// -----------------------------------------------------------------------------

FDLayout.prototype.calcGrid = function (graph) {

  var sizeX = 0;
  var sizeY = 0;

  sizeX = parseInt(Math.ceil((graph.getRight() - graph.getLeft()) / this.repulsionRange));
  sizeY = parseInt(Math.ceil((graph.getBottom() - graph.getTop()) / this.repulsionRange));

  var grid = new Array(sizeX);

  for (var i = 0; i < sizeX; i++) {
    grid[i] = new Array(sizeY);
  }

  for (var i = 0; i < sizeX; i++) {
    for (var j = 0; j < sizeY; j++) {
      grid[i][j] = new Array();
    }
  }

  return grid;
};

FDLayout.prototype.addNodeToGrid = function (v, left, top) {

  var startX = 0;
  var finishX = 0;
  var startY = 0;
  var finishY = 0;

  startX = parseInt(Math.floor((v.getRect().x - left) / this.repulsionRange));
  finishX = parseInt(Math.floor((v.getRect().width + v.getRect().x - left) / this.repulsionRange));
  startY = parseInt(Math.floor((v.getRect().y - top) / this.repulsionRange));
  finishY = parseInt(Math.floor((v.getRect().height + v.getRect().y - top) / this.repulsionRange));

  for (var i = startX; i <= finishX; i++) {
    for (var j = startY; j <= finishY; j++) {
      this.grid[i][j].push(v);
      v.setGridCoordinates(startX, finishX, startY, finishY);
    }
  }
};

FDLayout.prototype.updateGrid = function () {
  var i;
  var nodeA;
  var lNodes = this.getAllNodes();

  this.grid = this.calcGrid(this.graphManager.getRoot());

  // put all nodes to proper grid cells
  for (i = 0; i < lNodes.length; i++) {
    nodeA = lNodes[i];
    this.addNodeToGrid(nodeA, this.graphManager.getRoot().getLeft(), this.graphManager.getRoot().getTop());
  }
};

FDLayout.prototype.calculateRepulsionForceOfANode = function (nodeA, processedNodeSet) {

  if (this.totalIterations % FDLayoutConstants.GRID_CALCULATION_CHECK_PERIOD == 1 && !this.isTreeGrowing && !this.isGrowthFinished || this.growTreeIterations % 10 == 1 && this.isTreeGrowing || this.afterGrowthIterations % 10 == 1 && this.isGrowthFinished) {
    var surrounding = new Set();
    nodeA.surrounding = new Array();
    var nodeB;
    var grid = this.grid;

    for (var i = nodeA.startX - 1; i < nodeA.finishX + 2; i++) {
      for (var j = nodeA.startY - 1; j < nodeA.finishY + 2; j++) {
        if (!(i < 0 || j < 0 || i >= grid.length || j >= grid[0].length)) {
          for (var k = 0; k < grid[i][j].length; k++) {
            nodeB = grid[i][j][k];

            // If both nodes are not members of the same graph, 
            // or both nodes are the same, skip.
            if (nodeA.getOwner() != nodeB.getOwner() || nodeA == nodeB) {
              continue;
            }

            // check if the repulsion force between
            // nodeA and nodeB has already been calculated
            if (!processedNodeSet.has(nodeB) && !surrounding.has(nodeB)) {
              var distanceX = Math.abs(nodeA.getCenterX() - nodeB.getCenterX()) - (nodeA.getWidth() / 2 + nodeB.getWidth() / 2);
              var distanceY = Math.abs(nodeA.getCenterY() - nodeB.getCenterY()) - (nodeA.getHeight() / 2 + nodeB.getHeight() / 2);

              // if the distance between nodeA and nodeB 
              // is less then calculation range
              if (distanceX <= this.repulsionRange && distanceY <= this.repulsionRange) {
                //then add nodeB to surrounding of nodeA
                surrounding.add(nodeB);
              }
            }
          }
        }
      }
    }

    nodeA.surrounding = [].concat(_toConsumableArray(surrounding));
  }
  for (i = 0; i < nodeA.surrounding.length; i++) {
    this.calcRepulsionForce(nodeA, nodeA.surrounding[i]);
  }
};

FDLayout.prototype.calcRepulsionRange = function () {
  return 0.0;
};

// -----------------------------------------------------------------------------
// Section: Tree Reduction methods
// -----------------------------------------------------------------------------
// Reduce trees 
FDLayout.prototype.reduceTrees = function () {
  var prunedNodesAll = [];
  var containsLeaf = true;
  var node;

  while (containsLeaf) {
    var allNodes = this.graphManager.getAllNodes();
    var prunedNodesInStepTemp = [];
    containsLeaf = false;

    for (var i = 0; i < allNodes.length; i++) {
      node = allNodes[i];
      if (node.getEdges().length == 1 && !node.getEdges()[0].isInterGraph && node.getChild() == null) {
        prunedNodesInStepTemp.push([node, node.getEdges()[0], node.getOwner()]);
        containsLeaf = true;
      }
    }
    if (containsLeaf == true) {
      var prunedNodesInStep = [];
      for (var j = 0; j < prunedNodesInStepTemp.length; j++) {
        if (prunedNodesInStepTemp[j][0].getEdges().length == 1) {
          prunedNodesInStep.push(prunedNodesInStepTemp[j]);
          prunedNodesInStepTemp[j][0].getOwner().remove(prunedNodesInStepTemp[j][0]);
        }
      }
      prunedNodesAll.push(prunedNodesInStep);
      this.graphManager.resetAllNodes();
      this.graphManager.resetAllEdges();
    }
  }
  this.prunedNodesAll = prunedNodesAll;
};

// Grow tree one step 
FDLayout.prototype.growTree = function (prunedNodesAll) {
  var lengthOfPrunedNodesInStep = prunedNodesAll.length;
  var prunedNodesInStep = prunedNodesAll[lengthOfPrunedNodesInStep - 1];

  var nodeData;
  for (var i = 0; i < prunedNodesInStep.length; i++) {
    nodeData = prunedNodesInStep[i];

    this.findPlaceforPrunedNode(nodeData);

    nodeData[2].add(nodeData[0]);
    nodeData[2].add(nodeData[1], nodeData[1].source, nodeData[1].target);
  }

  prunedNodesAll.splice(prunedNodesAll.length - 1, 1);
  this.graphManager.resetAllNodes();
  this.graphManager.resetAllEdges();
};

// Find an appropriate position to replace pruned node, this method can be improved
FDLayout.prototype.findPlaceforPrunedNode = function (nodeData) {

  var gridForPrunedNode;
  var nodeToConnect;
  var prunedNode = nodeData[0];
  if (prunedNode == nodeData[1].source) {
    nodeToConnect = nodeData[1].target;
  } else {
    nodeToConnect = nodeData[1].source;
  }
  var startGridX = nodeToConnect.startX;
  var finishGridX = nodeToConnect.finishX;
  var startGridY = nodeToConnect.startY;
  var finishGridY = nodeToConnect.finishY;

  var upNodeCount = 0;
  var downNodeCount = 0;
  var rightNodeCount = 0;
  var leftNodeCount = 0;
  var controlRegions = [upNodeCount, rightNodeCount, downNodeCount, leftNodeCount];

  if (startGridY > 0) {
    for (var i = startGridX; i <= finishGridX; i++) {
      controlRegions[0] += this.grid[i][startGridY - 1].length + this.grid[i][startGridY].length - 1;
    }
  }
  if (finishGridX < this.grid.length - 1) {
    for (var i = startGridY; i <= finishGridY; i++) {
      controlRegions[1] += this.grid[finishGridX + 1][i].length + this.grid[finishGridX][i].length - 1;
    }
  }
  if (finishGridY < this.grid[0].length - 1) {
    for (var i = startGridX; i <= finishGridX; i++) {
      controlRegions[2] += this.grid[i][finishGridY + 1].length + this.grid[i][finishGridY].length - 1;
    }
  }
  if (startGridX > 0) {
    for (var i = startGridY; i <= finishGridY; i++) {
      controlRegions[3] += this.grid[startGridX - 1][i].length + this.grid[startGridX][i].length - 1;
    }
  }
  var min = Integer.MAX_VALUE;
  var minCount;
  var minIndex;
  for (var j = 0; j < controlRegions.length; j++) {
    if (controlRegions[j] < min) {
      min = controlRegions[j];
      minCount = 1;
      minIndex = j;
    } else if (controlRegions[j] == min) {
      minCount++;
    }
  }

  if (minCount == 3 && min == 0) {
    if (controlRegions[0] == 0 && controlRegions[1] == 0 && controlRegions[2] == 0) {
      gridForPrunedNode = 1;
    } else if (controlRegions[0] == 0 && controlRegions[1] == 0 && controlRegions[3] == 0) {
      gridForPrunedNode = 0;
    } else if (controlRegions[0] == 0 && controlRegions[2] == 0 && controlRegions[3] == 0) {
      gridForPrunedNode = 3;
    } else if (controlRegions[1] == 0 && controlRegions[2] == 0 && controlRegions[3] == 0) {
      gridForPrunedNode = 2;
    }
  } else if (minCount == 2 && min == 0) {
    var random = Math.floor(Math.random() * 2);
    if (controlRegions[0] == 0 && controlRegions[1] == 0) {
      ;
      if (random == 0) {
        gridForPrunedNode = 0;
      } else {
        gridForPrunedNode = 1;
      }
    } else if (controlRegions[0] == 0 && controlRegions[2] == 0) {
      if (random == 0) {
        gridForPrunedNode = 0;
      } else {
        gridForPrunedNode = 2;
      }
    } else if (controlRegions[0] == 0 && controlRegions[3] == 0) {
      if (random == 0) {
        gridForPrunedNode = 0;
      } else {
        gridForPrunedNode = 3;
      }
    } else if (controlRegions[1] == 0 && controlRegions[2] == 0) {
      if (random == 0) {
        gridForPrunedNode = 1;
      } else {
        gridForPrunedNode = 2;
      }
    } else if (controlRegions[1] == 0 && controlRegions[3] == 0) {
      if (random == 0) {
        gridForPrunedNode = 1;
      } else {
        gridForPrunedNode = 3;
      }
    } else {
      if (random == 0) {
        gridForPrunedNode = 2;
      } else {
        gridForPrunedNode = 3;
      }
    }
  } else if (minCount == 4 && min == 0) {
    var random = Math.floor(Math.random() * 4);
    gridForPrunedNode = random;
  } else {
    gridForPrunedNode = minIndex;
  }

  if (gridForPrunedNode == 0) {
    prunedNode.setCenter(nodeToConnect.getCenterX(), nodeToConnect.getCenterY() - nodeToConnect.getHeight() / 2 - FDLayoutConstants.DEFAULT_EDGE_LENGTH - prunedNode.getHeight() / 2);
  } else if (gridForPrunedNode == 1) {
    prunedNode.setCenter(nodeToConnect.getCenterX() + nodeToConnect.getWidth() / 2 + FDLayoutConstants.DEFAULT_EDGE_LENGTH + prunedNode.getWidth() / 2, nodeToConnect.getCenterY());
  } else if (gridForPrunedNode == 2) {
    prunedNode.setCenter(nodeToConnect.getCenterX(), nodeToConnect.getCenterY() + nodeToConnect.getHeight() / 2 + FDLayoutConstants.DEFAULT_EDGE_LENGTH + prunedNode.getHeight() / 2);
  } else {
    prunedNode.setCenter(nodeToConnect.getCenterX() - nodeToConnect.getWidth() / 2 - FDLayoutConstants.DEFAULT_EDGE_LENGTH - prunedNode.getWidth() / 2, nodeToConnect.getCenterY());
  }
};

module.exports = FDLayout;

},{"./FDLayoutConstants":13,"./IGeometry":18,"./IMath":19,"./Integer":20,"./Layout":26,"./LayoutConstants":27}],13:[function(_dereq_,module,exports){
'use strict';

var LayoutConstants = _dereq_('./LayoutConstants');

function FDLayoutConstants() {}

//FDLayoutConstants inherits static props in LayoutConstants
for (var prop in LayoutConstants) {
  FDLayoutConstants[prop] = LayoutConstants[prop];
}

FDLayoutConstants.MAX_ITERATIONS = 2500;

FDLayoutConstants.DEFAULT_EDGE_LENGTH = 50;
FDLayoutConstants.DEFAULT_SPRING_STRENGTH = 0.45;
FDLayoutConstants.DEFAULT_REPULSION_STRENGTH = 4500.0;
FDLayoutConstants.DEFAULT_GRAVITY_STRENGTH = 0.4;
FDLayoutConstants.DEFAULT_COMPOUND_GRAVITY_STRENGTH = 1.0;
FDLayoutConstants.DEFAULT_GRAVITY_RANGE_FACTOR = 3.8;
FDLayoutConstants.DEFAULT_COMPOUND_GRAVITY_RANGE_FACTOR = 1.5;
FDLayoutConstants.DEFAULT_USE_SMART_IDEAL_EDGE_LENGTH_CALCULATION = true;
FDLayoutConstants.DEFAULT_USE_SMART_REPULSION_RANGE_CALCULATION = true;
FDLayoutConstants.DEFAULT_COOLING_FACTOR_INCREMENTAL = 0.5;
FDLayoutConstants.MAX_NODE_DISPLACEMENT_INCREMENTAL = 100.0;
FDLayoutConstants.MAX_NODE_DISPLACEMENT = FDLayoutConstants.MAX_NODE_DISPLACEMENT_INCREMENTAL * 3;
FDLayoutConstants.MIN_REPULSION_DIST = FDLayoutConstants.DEFAULT_EDGE_LENGTH / 10.0;
FDLayoutConstants.CONVERGENCE_CHECK_PERIOD = 100;
FDLayoutConstants.PER_LEVEL_IDEAL_EDGE_LENGTH_FACTOR = 0.1;
FDLayoutConstants.MIN_EDGE_LENGTH = 1;
FDLayoutConstants.GRID_CALCULATION_CHECK_PERIOD = 10;

module.exports = FDLayoutConstants;

},{"./LayoutConstants":27}],14:[function(_dereq_,module,exports){
'use strict';

var LEdge = _dereq_('./LEdge');
var FDLayoutConstants = _dereq_('./FDLayoutConstants');

function FDLayoutEdge(source, target, vEdge) {
  LEdge.call(this, source, target, vEdge);
  this.idealLength = FDLayoutConstants.DEFAULT_EDGE_LENGTH;
}

FDLayoutEdge.prototype = Object.create(LEdge.prototype);

for (var prop in LEdge) {
  FDLayoutEdge[prop] = LEdge[prop];
}

module.exports = FDLayoutEdge;

},{"./FDLayoutConstants":13,"./LEdge":21}],15:[function(_dereq_,module,exports){
'use strict';

var LNode = _dereq_('./LNode');

function FDLayoutNode(gm, loc, size, vNode) {
  // alternative constructor is handled inside LNode
  LNode.call(this, gm, loc, size, vNode);
  //Spring, repulsion and gravitational forces acting on this node
  this.springForceX = 0;
  this.springForceY = 0;
  this.repulsionForceX = 0;
  this.repulsionForceY = 0;
  this.gravitationForceX = 0;
  this.gravitationForceY = 0;
  //Amount by which this node is to be moved in this iteration
  this.displacementX = 0;
  this.displacementY = 0;

  //Start and finish grid coordinates that this node is fallen into
  this.startX = 0;
  this.finishX = 0;
  this.startY = 0;
  this.finishY = 0;

  //Geometric neighbors of this node
  this.surrounding = [];
}

FDLayoutNode.prototype = Object.create(LNode.prototype);

for (var prop in LNode) {
  FDLayoutNode[prop] = LNode[prop];
}

FDLayoutNode.prototype.setGridCoordinates = function (_startX, _finishX, _startY, _finishY) {
  this.startX = _startX;
  this.finishX = _finishX;
  this.startY = _startY;
  this.finishY = _finishY;
};

module.exports = FDLayoutNode;

},{"./LNode":25}],16:[function(_dereq_,module,exports){
'use strict';

var UniqueIDGeneretor = _dereq_('./UniqueIDGeneretor');

function HashMap() {
  this.map = {};
  this.keys = [];
}

HashMap.prototype.put = function (key, value) {
  var theId = UniqueIDGeneretor.createID(key);
  if (!this.contains(theId)) {
    this.map[theId] = value;
    this.keys.push(key);
  }
};

HashMap.prototype.contains = function (key) {
  var theId = UniqueIDGeneretor.createID(key);
  return this.map[key] != null;
};

HashMap.prototype.get = function (key) {
  var theId = UniqueIDGeneretor.createID(key);
  return this.map[theId];
};

HashMap.prototype.keySet = function () {
  return this.keys;
};

module.exports = HashMap;

},{"./UniqueIDGeneretor":33}],17:[function(_dereq_,module,exports){
'use strict';

var UniqueIDGeneretor = _dereq_('./UniqueIDGeneretor');

function HashSet() {
  this.set = {};
}
;

HashSet.prototype.add = function (obj) {
  var theId = UniqueIDGeneretor.createID(obj);
  if (!this.contains(theId)) this.set[theId] = obj;
};

HashSet.prototype.remove = function (obj) {
  delete this.set[UniqueIDGeneretor.createID(obj)];
};

HashSet.prototype.clear = function () {
  this.set = {};
};

HashSet.prototype.contains = function (obj) {
  return this.set[UniqueIDGeneretor.createID(obj)] == obj;
};

HashSet.prototype.isEmpty = function () {
  return this.size() === 0;
};

HashSet.prototype.size = function () {
  return Object.keys(this.set).length;
};

//concats this.set to the given list
HashSet.prototype.addAllTo = function (list) {
  var keys = Object.keys(this.set);
  var length = keys.length;
  for (var i = 0; i < length; i++) {
    list.push(this.set[keys[i]]);
  }
};

HashSet.prototype.size = function () {
  return Object.keys(this.set).length;
};

HashSet.prototype.addAll = function (list) {
  var s = list.length;
  for (var i = 0; i < s; i++) {
    var v = list[i];
    this.add(v);
  }
};

module.exports = HashSet;

},{"./UniqueIDGeneretor":33}],18:[function(_dereq_,module,exports){
"use strict";

function IGeometry() {}

IGeometry.calcSeparationAmount = function (rectA, rectB, overlapAmount, separationBuffer) {
  if (!rectA.intersects(rectB)) {
    throw "assert failed";
  }
  var directions = new Array(2);
  IGeometry.decideDirectionsForOverlappingNodes(rectA, rectB, directions);
  overlapAmount[0] = Math.min(rectA.getRight(), rectB.getRight()) - Math.max(rectA.x, rectB.x);
  overlapAmount[1] = Math.min(rectA.getBottom(), rectB.getBottom()) - Math.max(rectA.y, rectB.y);
  // update the overlapping amounts for the following cases:
  if (rectA.getX() <= rectB.getX() && rectA.getRight() >= rectB.getRight()) {
    overlapAmount[0] += Math.min(rectB.getX() - rectA.getX(), rectA.getRight() - rectB.getRight());
  } else if (rectB.getX() <= rectA.getX() && rectB.getRight() >= rectA.getRight()) {
    overlapAmount[0] += Math.min(rectA.getX() - rectB.getX(), rectB.getRight() - rectA.getRight());
  }
  if (rectA.getY() <= rectB.getY() && rectA.getBottom() >= rectB.getBottom()) {
    overlapAmount[1] += Math.min(rectB.getY() - rectA.getY(), rectA.getBottom() - rectB.getBottom());
  } else if (rectB.getY() <= rectA.getY() && rectB.getBottom() >= rectA.getBottom()) {
    overlapAmount[1] += Math.min(rectA.getY() - rectB.getY(), rectB.getBottom() - rectA.getBottom());
  }

  // find slope of the line passes two centers
  var slope = Math.abs((rectB.getCenterY() - rectA.getCenterY()) / (rectB.getCenterX() - rectA.getCenterX()));
  // if centers are overlapped
  if (rectB.getCenterY() == rectA.getCenterY() && rectB.getCenterX() == rectA.getCenterX()) {
    // assume the slope is 1 (45 degree)
    slope = 1.0;
  }

  var moveByY = slope * overlapAmount[0];
  var moveByX = overlapAmount[1] / slope;
  if (overlapAmount[0] < moveByX) {
    moveByX = overlapAmount[0];
  } else {
    moveByY = overlapAmount[1];
  }
  // return half the amount so that if each rectangle is moved by these
  // amounts in opposite directions, overlap will be resolved
  overlapAmount[0] = -1 * directions[0] * (moveByX / 2 + separationBuffer);
  overlapAmount[1] = -1 * directions[1] * (moveByY / 2 + separationBuffer);
};

IGeometry.decideDirectionsForOverlappingNodes = function (rectA, rectB, directions) {
  if (rectA.getCenterX() < rectB.getCenterX()) {
    directions[0] = -1;
  } else {
    directions[0] = 1;
  }

  if (rectA.getCenterY() < rectB.getCenterY()) {
    directions[1] = -1;
  } else {
    directions[1] = 1;
  }
};

IGeometry.getIntersection2 = function (rectA, rectB, result) {
  //result[0-1] will contain clipPoint of rectA, result[2-3] will contain clipPoint of rectB
  var p1x = rectA.getCenterX();
  var p1y = rectA.getCenterY();
  var p2x = rectB.getCenterX();
  var p2y = rectB.getCenterY();

  //if two rectangles intersect, then clipping points are centers
  if (rectA.intersects(rectB)) {
    result[0] = p1x;
    result[1] = p1y;
    result[2] = p2x;
    result[3] = p2y;
    return true;
  }
  //variables for rectA
  var topLeftAx = rectA.getX();
  var topLeftAy = rectA.getY();
  var topRightAx = rectA.getRight();
  var bottomLeftAx = rectA.getX();
  var bottomLeftAy = rectA.getBottom();
  var bottomRightAx = rectA.getRight();
  var halfWidthA = rectA.getWidthHalf();
  var halfHeightA = rectA.getHeightHalf();
  //variables for rectB
  var topLeftBx = rectB.getX();
  var topLeftBy = rectB.getY();
  var topRightBx = rectB.getRight();
  var bottomLeftBx = rectB.getX();
  var bottomLeftBy = rectB.getBottom();
  var bottomRightBx = rectB.getRight();
  var halfWidthB = rectB.getWidthHalf();
  var halfHeightB = rectB.getHeightHalf();
  //flag whether clipping points are found
  var clipPointAFound = false;
  var clipPointBFound = false;

  // line is vertical
  if (p1x == p2x) {
    if (p1y > p2y) {
      result[0] = p1x;
      result[1] = topLeftAy;
      result[2] = p2x;
      result[3] = bottomLeftBy;
      return false;
    } else if (p1y < p2y) {
      result[0] = p1x;
      result[1] = bottomLeftAy;
      result[2] = p2x;
      result[3] = topLeftBy;
      return false;
    } else {
      //not line, return null;
    }
  }
  // line is horizontal
  else if (p1y == p2y) {
      if (p1x > p2x) {
        result[0] = topLeftAx;
        result[1] = p1y;
        result[2] = topRightBx;
        result[3] = p2y;
        return false;
      } else if (p1x < p2x) {
        result[0] = topRightAx;
        result[1] = p1y;
        result[2] = topLeftBx;
        result[3] = p2y;
        return false;
      } else {
        //not valid line, return null;
      }
    } else {
      //slopes of rectA's and rectB's diagonals
      var slopeA = rectA.height / rectA.width;
      var slopeB = rectB.height / rectB.width;

      //slope of line between center of rectA and center of rectB
      var slopePrime = (p2y - p1y) / (p2x - p1x);
      var cardinalDirectionA;
      var cardinalDirectionB;
      var tempPointAx;
      var tempPointAy;
      var tempPointBx;
      var tempPointBy;

      //determine whether clipping point is the corner of nodeA
      if (-slopeA == slopePrime) {
        if (p1x > p2x) {
          result[0] = bottomLeftAx;
          result[1] = bottomLeftAy;
          clipPointAFound = true;
        } else {
          result[0] = topRightAx;
          result[1] = topLeftAy;
          clipPointAFound = true;
        }
      } else if (slopeA == slopePrime) {
        if (p1x > p2x) {
          result[0] = topLeftAx;
          result[1] = topLeftAy;
          clipPointAFound = true;
        } else {
          result[0] = bottomRightAx;
          result[1] = bottomLeftAy;
          clipPointAFound = true;
        }
      }

      //determine whether clipping point is the corner of nodeB
      if (-slopeB == slopePrime) {
        if (p2x > p1x) {
          result[2] = bottomLeftBx;
          result[3] = bottomLeftBy;
          clipPointBFound = true;
        } else {
          result[2] = topRightBx;
          result[3] = topLeftBy;
          clipPointBFound = true;
        }
      } else if (slopeB == slopePrime) {
        if (p2x > p1x) {
          result[2] = topLeftBx;
          result[3] = topLeftBy;
          clipPointBFound = true;
        } else {
          result[2] = bottomRightBx;
          result[3] = bottomLeftBy;
          clipPointBFound = true;
        }
      }

      //if both clipping points are corners
      if (clipPointAFound && clipPointBFound) {
        return false;
      }

      //determine Cardinal Direction of rectangles
      if (p1x > p2x) {
        if (p1y > p2y) {
          cardinalDirectionA = IGeometry.getCardinalDirection(slopeA, slopePrime, 4);
          cardinalDirectionB = IGeometry.getCardinalDirection(slopeB, slopePrime, 2);
        } else {
          cardinalDirectionA = IGeometry.getCardinalDirection(-slopeA, slopePrime, 3);
          cardinalDirectionB = IGeometry.getCardinalDirection(-slopeB, slopePrime, 1);
        }
      } else {
        if (p1y > p2y) {
          cardinalDirectionA = IGeometry.getCardinalDirection(-slopeA, slopePrime, 1);
          cardinalDirectionB = IGeometry.getCardinalDirection(-slopeB, slopePrime, 3);
        } else {
          cardinalDirectionA = IGeometry.getCardinalDirection(slopeA, slopePrime, 2);
          cardinalDirectionB = IGeometry.getCardinalDirection(slopeB, slopePrime, 4);
        }
      }
      //calculate clipping Point if it is not found before
      if (!clipPointAFound) {
        switch (cardinalDirectionA) {
          case 1:
            tempPointAy = topLeftAy;
            tempPointAx = p1x + -halfHeightA / slopePrime;
            result[0] = tempPointAx;
            result[1] = tempPointAy;
            break;
          case 2:
            tempPointAx = bottomRightAx;
            tempPointAy = p1y + halfWidthA * slopePrime;
            result[0] = tempPointAx;
            result[1] = tempPointAy;
            break;
          case 3:
            tempPointAy = bottomLeftAy;
            tempPointAx = p1x + halfHeightA / slopePrime;
            result[0] = tempPointAx;
            result[1] = tempPointAy;
            break;
          case 4:
            tempPointAx = bottomLeftAx;
            tempPointAy = p1y + -halfWidthA * slopePrime;
            result[0] = tempPointAx;
            result[1] = tempPointAy;
            break;
        }
      }
      if (!clipPointBFound) {
        switch (cardinalDirectionB) {
          case 1:
            tempPointBy = topLeftBy;
            tempPointBx = p2x + -halfHeightB / slopePrime;
            result[2] = tempPointBx;
            result[3] = tempPointBy;
            break;
          case 2:
            tempPointBx = bottomRightBx;
            tempPointBy = p2y + halfWidthB * slopePrime;
            result[2] = tempPointBx;
            result[3] = tempPointBy;
            break;
          case 3:
            tempPointBy = bottomLeftBy;
            tempPointBx = p2x + halfHeightB / slopePrime;
            result[2] = tempPointBx;
            result[3] = tempPointBy;
            break;
          case 4:
            tempPointBx = bottomLeftBx;
            tempPointBy = p2y + -halfWidthB * slopePrime;
            result[2] = tempPointBx;
            result[3] = tempPointBy;
            break;
        }
      }
    }
  return false;
};

IGeometry.getCardinalDirection = function (slope, slopePrime, line) {
  if (slope > slopePrime) {
    return line;
  } else {
    return 1 + line % 4;
  }
};

IGeometry.getIntersection = function (s1, s2, f1, f2) {
  if (f2 == null) {
    return IGeometry.getIntersection2(s1, s2, f1);
  }
  var x1 = s1.x;
  var y1 = s1.y;
  var x2 = s2.x;
  var y2 = s2.y;
  var x3 = f1.x;
  var y3 = f1.y;
  var x4 = f2.x;
  var y4 = f2.y;
  var x, y; // intersection point
  var a1, a2, b1, b2, c1, c2; // coefficients of line eqns.
  var denom;

  a1 = y2 - y1;
  b1 = x1 - x2;
  c1 = x2 * y1 - x1 * y2; // { a1*x + b1*y + c1 = 0 is line 1 }

  a2 = y4 - y3;
  b2 = x3 - x4;
  c2 = x4 * y3 - x3 * y4; // { a2*x + b2*y + c2 = 0 is line 2 }

  denom = a1 * b2 - a2 * b1;

  if (denom == 0) {
    return null;
  }

  x = (b1 * c2 - b2 * c1) / denom;
  y = (a2 * c1 - a1 * c2) / denom;

  return new Point(x, y);
};

// -----------------------------------------------------------------------------
// Section: Class Constants
// -----------------------------------------------------------------------------
/**
 * Some useful pre-calculated constants
 */
IGeometry.HALF_PI = 0.5 * Math.PI;
IGeometry.ONE_AND_HALF_PI = 1.5 * Math.PI;
IGeometry.TWO_PI = 2.0 * Math.PI;
IGeometry.THREE_PI = 3.0 * Math.PI;

module.exports = IGeometry;

},{}],19:[function(_dereq_,module,exports){
"use strict";

function IMath() {}

/**
 * This method returns the sign of the input value.
 */
IMath.sign = function (value) {
  if (value > 0) {
    return 1;
  } else if (value < 0) {
    return -1;
  } else {
    return 0;
  }
};

IMath.floor = function (value) {
  return value < 0 ? Math.ceil(value) : Math.floor(value);
};

IMath.ceil = function (value) {
  return value < 0 ? Math.floor(value) : Math.ceil(value);
};

module.exports = IMath;

},{}],20:[function(_dereq_,module,exports){
"use strict";

function Integer() {}

Integer.MAX_VALUE = 2147483647;
Integer.MIN_VALUE = -2147483648;

module.exports = Integer;

},{}],21:[function(_dereq_,module,exports){
'use strict';

var LGraphObject = _dereq_('./LGraphObject');
var IGeometry = _dereq_('./IGeometry');
var IMath = _dereq_('./IMath');

function LEdge(source, target, vEdge) {
  LGraphObject.call(this, vEdge);

  this.isOverlapingSourceAndTarget = false;
  this.vGraphObject = vEdge;
  this.bendpoints = [];
  this.source = source;
  this.target = target;
}

LEdge.prototype = Object.create(LGraphObject.prototype);

for (var prop in LGraphObject) {
  LEdge[prop] = LGraphObject[prop];
}

LEdge.prototype.getSource = function () {
  return this.source;
};

LEdge.prototype.getTarget = function () {
  return this.target;
};

LEdge.prototype.isInterGraph = function () {
  return this.isInterGraph;
};

LEdge.prototype.getLength = function () {
  return this.length;
};

LEdge.prototype.isOverlapingSourceAndTarget = function () {
  return this.isOverlapingSourceAndTarget;
};

LEdge.prototype.getBendpoints = function () {
  return this.bendpoints;
};

LEdge.prototype.getLca = function () {
  return this.lca;
};

LEdge.prototype.getSourceInLca = function () {
  return this.sourceInLca;
};

LEdge.prototype.getTargetInLca = function () {
  return this.targetInLca;
};

LEdge.prototype.getOtherEnd = function (node) {
  if (this.source === node) {
    return this.target;
  } else if (this.target === node) {
    return this.source;
  } else {
    throw "Node is not incident with this edge";
  }
};

LEdge.prototype.getOtherEndInGraph = function (node, graph) {
  var otherEnd = this.getOtherEnd(node);
  var root = graph.getGraphManager().getRoot();

  while (true) {
    if (otherEnd.getOwner() == graph) {
      return otherEnd;
    }

    if (otherEnd.getOwner() == root) {
      break;
    }

    otherEnd = otherEnd.getOwner().getParent();
  }

  return null;
};

LEdge.prototype.updateLength = function () {
  var clipPointCoordinates = new Array(4);

  this.isOverlapingSourceAndTarget = IGeometry.getIntersection(this.target.getRect(), this.source.getRect(), clipPointCoordinates);

  if (!this.isOverlapingSourceAndTarget) {
    this.lengthX = clipPointCoordinates[0] - clipPointCoordinates[2];
    this.lengthY = clipPointCoordinates[1] - clipPointCoordinates[3];

    if (Math.abs(this.lengthX) < 1.0) {
      this.lengthX = IMath.sign(this.lengthX);
    }

    if (Math.abs(this.lengthY) < 1.0) {
      this.lengthY = IMath.sign(this.lengthY);
    }

    this.length = Math.sqrt(this.lengthX * this.lengthX + this.lengthY * this.lengthY);
  }
};

LEdge.prototype.updateLengthSimple = function () {
  this.lengthX = this.target.getCenterX() - this.source.getCenterX();
  this.lengthY = this.target.getCenterY() - this.source.getCenterY();

  if (Math.abs(this.lengthX) < 1.0) {
    this.lengthX = IMath.sign(this.lengthX);
  }

  if (Math.abs(this.lengthY) < 1.0) {
    this.lengthY = IMath.sign(this.lengthY);
  }

  this.length = Math.sqrt(this.lengthX * this.lengthX + this.lengthY * this.lengthY);
};

module.exports = LEdge;

},{"./IGeometry":18,"./IMath":19,"./LGraphObject":24}],22:[function(_dereq_,module,exports){
'use strict';

var LGraphObject = _dereq_('./LGraphObject');
var Integer = _dereq_('./Integer');
var LayoutConstants = _dereq_('./LayoutConstants');
var LGraphManager = _dereq_('./LGraphManager');
var LNode = _dereq_('./LNode');
var LEdge = _dereq_('./LEdge');
var HashSet = _dereq_('./HashSet');
var RectangleD = _dereq_('./RectangleD');
var Point = _dereq_('./Point');
var List = _dereq_('linkedlist-js').List;

function LGraph(parent, obj2, vGraph) {
  LGraphObject.call(this, vGraph);
  this.estimatedSize = Integer.MIN_VALUE;
  this.margin = LayoutConstants.DEFAULT_GRAPH_MARGIN;
  this.edges = [];
  this.nodes = [];
  this.isConnected = false;
  this.parent = parent;

  if (obj2 != null && obj2 instanceof LGraphManager) {
    this.graphManager = obj2;
  } else if (obj2 != null && obj2 instanceof Layout) {
    this.graphManager = obj2.graphManager;
  }
}

LGraph.prototype = Object.create(LGraphObject.prototype);
for (var prop in LGraphObject) {
  LGraph[prop] = LGraphObject[prop];
}

LGraph.prototype.getNodes = function () {
  return this.nodes;
};

LGraph.prototype.getEdges = function () {
  return this.edges;
};

LGraph.prototype.getGraphManager = function () {
  return this.graphManager;
};

LGraph.prototype.getParent = function () {
  return this.parent;
};

LGraph.prototype.getLeft = function () {
  return this.left;
};

LGraph.prototype.getRight = function () {
  return this.right;
};

LGraph.prototype.getTop = function () {
  return this.top;
};

LGraph.prototype.getBottom = function () {
  return this.bottom;
};

LGraph.prototype.isConnected = function () {
  return this.isConnected;
};

LGraph.prototype.add = function (obj1, sourceNode, targetNode) {
  if (sourceNode == null && targetNode == null) {
    var newNode = obj1;
    if (this.graphManager == null) {
      throw "Graph has no graph mgr!";
    }
    if (this.getNodes().indexOf(newNode) > -1) {
      throw "Node already in graph!";
    }
    newNode.owner = this;
    this.getNodes().push(newNode);

    return newNode;
  } else {
    var newEdge = obj1;
    if (!(this.getNodes().indexOf(sourceNode) > -1 && this.getNodes().indexOf(targetNode) > -1)) {
      throw "Source or target not in graph!";
    }

    if (!(sourceNode.owner == targetNode.owner && sourceNode.owner == this)) {
      throw "Both owners must be this graph!";
    }

    if (sourceNode.owner != targetNode.owner) {
      return null;
    }

    // set source and target
    newEdge.source = sourceNode;
    newEdge.target = targetNode;

    // set as intra-graph edge
    newEdge.isInterGraph = false;

    // add to graph edge list
    this.getEdges().push(newEdge);

    // add to incidency lists
    sourceNode.edges.push(newEdge);

    if (targetNode != sourceNode) {
      targetNode.edges.push(newEdge);
    }

    return newEdge;
  }
};

LGraph.prototype.remove = function (obj) {
  var node = obj;
  if (obj instanceof LNode) {
    if (node == null) {
      throw "Node is null!";
    }
    if (!(node.owner != null && node.owner == this)) {
      throw "Owner graph is invalid!";
    }
    if (this.graphManager == null) {
      throw "Owner graph manager is invalid!";
    }
    // remove incident edges first (make a copy to do it safely)
    var edgesToBeRemoved = node.edges.slice();
    var edge;
    var s = edgesToBeRemoved.length;
    for (var i = 0; i < s; i++) {
      edge = edgesToBeRemoved[i];

      if (edge.isInterGraph) {
        this.graphManager.remove(edge);
      } else {
        edge.source.owner.remove(edge);
      }
    }

    // now the node itself
    var index = this.nodes.indexOf(node);
    if (index == -1) {
      throw "Node not in owner node list!";
    }

    this.nodes.splice(index, 1);
  } else if (obj instanceof LEdge) {
    var edge = obj;
    if (edge == null) {
      throw "Edge is null!";
    }
    if (!(edge.source != null && edge.target != null)) {
      throw "Source and/or target is null!";
    }
    if (!(edge.source.owner != null && edge.target.owner != null && edge.source.owner == this && edge.target.owner == this)) {
      throw "Source and/or target owner is invalid!";
    }

    var sourceIndex = edge.source.edges.indexOf(edge);
    var targetIndex = edge.target.edges.indexOf(edge);
    if (!(sourceIndex > -1 && targetIndex > -1)) {
      throw "Source and/or target doesn't know this edge!";
    }

    edge.source.edges.splice(sourceIndex, 1);

    if (edge.target != edge.source) {
      edge.target.edges.splice(targetIndex, 1);
    }

    var index = edge.source.owner.getEdges().indexOf(edge);
    if (index == -1) {
      throw "Not in owner's edge list!";
    }

    edge.source.owner.getEdges().splice(index, 1);
  }
};

LGraph.prototype.updateLeftTop = function () {
  var top = Integer.MAX_VALUE;
  var left = Integer.MAX_VALUE;
  var nodeTop;
  var nodeLeft;
  var margin;

  var nodes = this.getNodes();
  var s = nodes.length;

  for (var i = 0; i < s; i++) {
    var lNode = nodes[i];
    nodeTop = lNode.getTop();
    nodeLeft = lNode.getLeft();

    if (top > nodeTop) {
      top = nodeTop;
    }

    if (left > nodeLeft) {
      left = nodeLeft;
    }
  }

  // Do we have any nodes in this graph?
  if (top == Integer.MAX_VALUE) {
    return null;
  }

  if (nodes[0].getParent().paddingLeft != undefined) {
    margin = nodes[0].getParent().paddingLeft;
  } else {
    margin = this.margin;
  }

  this.left = left - margin;
  this.top = top - margin;

  // Apply the margins and return the result
  return new Point(this.left, this.top);
};

LGraph.prototype.updateBounds = function (recursive) {
  // calculate bounds
  var left = Integer.MAX_VALUE;
  var right = -Integer.MAX_VALUE;
  var top = Integer.MAX_VALUE;
  var bottom = -Integer.MAX_VALUE;
  var nodeLeft;
  var nodeRight;
  var nodeTop;
  var nodeBottom;
  var margin;

  var nodes = this.nodes;
  var s = nodes.length;
  for (var i = 0; i < s; i++) {
    var lNode = nodes[i];

    if (recursive && lNode.child != null) {
      lNode.updateBounds();
    }
    nodeLeft = lNode.getLeft();
    nodeRight = lNode.getRight();
    nodeTop = lNode.getTop();
    nodeBottom = lNode.getBottom();

    if (left > nodeLeft) {
      left = nodeLeft;
    }

    if (right < nodeRight) {
      right = nodeRight;
    }

    if (top > nodeTop) {
      top = nodeTop;
    }

    if (bottom < nodeBottom) {
      bottom = nodeBottom;
    }
  }

  var boundingRect = new RectangleD(left, top, right - left, bottom - top);
  if (left == Integer.MAX_VALUE) {
    this.left = this.parent.getLeft();
    this.right = this.parent.getRight();
    this.top = this.parent.getTop();
    this.bottom = this.parent.getBottom();
  }

  if (nodes[0].getParent().paddingLeft != undefined) {
    margin = nodes[0].getParent().paddingLeft;
  } else {
    margin = this.margin;
  }

  this.left = boundingRect.x - margin;
  this.right = boundingRect.x + boundingRect.width + margin;
  this.top = boundingRect.y - margin;
  this.bottom = boundingRect.y + boundingRect.height + margin;
};

LGraph.calculateBounds = function (nodes) {
  var left = Integer.MAX_VALUE;
  var right = -Integer.MAX_VALUE;
  var top = Integer.MAX_VALUE;
  var bottom = -Integer.MAX_VALUE;
  var nodeLeft;
  var nodeRight;
  var nodeTop;
  var nodeBottom;

  var s = nodes.length;

  for (var i = 0; i < s; i++) {
    var lNode = nodes[i];
    nodeLeft = lNode.getLeft();
    nodeRight = lNode.getRight();
    nodeTop = lNode.getTop();
    nodeBottom = lNode.getBottom();

    if (left > nodeLeft) {
      left = nodeLeft;
    }

    if (right < nodeRight) {
      right = nodeRight;
    }

    if (top > nodeTop) {
      top = nodeTop;
    }

    if (bottom < nodeBottom) {
      bottom = nodeBottom;
    }
  }

  var boundingRect = new RectangleD(left, top, right - left, bottom - top);

  return boundingRect;
};

LGraph.prototype.getInclusionTreeDepth = function () {
  if (this == this.graphManager.getRoot()) {
    return 1;
  } else {
    return this.parent.getInclusionTreeDepth();
  }
};

LGraph.prototype.getEstimatedSize = function () {
  if (this.estimatedSize == Integer.MIN_VALUE) {
    throw "assert failed";
  }
  return this.estimatedSize;
};

LGraph.prototype.calcEstimatedSize = function () {
  var size = 0;
  var nodes = this.nodes;
  var s = nodes.length;

  for (var i = 0; i < s; i++) {
    var lNode = nodes[i];
    size += lNode.calcEstimatedSize();
  }

  if (size == 0) {
    this.estimatedSize = LayoutConstants.EMPTY_COMPOUND_NODE_SIZE;
  } else {
    this.estimatedSize = size / Math.sqrt(this.nodes.length);
  }

  return this.estimatedSize;
};

LGraph.prototype.updateConnected = function () {
  var self = this;
  if (this.nodes.length == 0) {
    this.isConnected = true;
    return;
  }

  var toBeVisited = new List();
  var visited = new HashSet();
  var currentNode = this.nodes[0];
  var neighborEdges;
  var currentNeighbor;
  var childrenOfNode = currentNode.withChildren();
  childrenOfNode.forEach(function (node) {
    toBeVisited.push(node);
  });

  while (!toBeVisited.isEmpty()) {
    currentNode = toBeVisited.shift().value();
    visited.add(currentNode);

    // Traverse all neighbors of this node
    neighborEdges = currentNode.getEdges();
    var s = neighborEdges.length;
    for (var i = 0; i < s; i++) {
      var neighborEdge = neighborEdges[i];
      currentNeighbor = neighborEdge.getOtherEndInGraph(currentNode, this);

      // Add unvisited neighbors to the list to visit
      if (currentNeighbor != null && !visited.contains(currentNeighbor)) {
        var childrenOfNeighbor = currentNeighbor.withChildren();

        childrenOfNeighbor.forEach(function (node) {
          toBeVisited.push(node);
        });
      }
    }
  }

  this.isConnected = false;

  if (visited.size() >= this.nodes.length) {
    var noOfVisitedInThisGraph = 0;

    var s = visited.size();
    Object.keys(visited.set).forEach(function (visitedId) {
      var visitedNode = visited.set[visitedId];
      if (visitedNode.owner == self) {
        noOfVisitedInThisGraph++;
      }
    });

    if (noOfVisitedInThisGraph == this.nodes.length) {
      this.isConnected = true;
    }
  }
};

module.exports = LGraph;

},{"./HashSet":17,"./Integer":20,"./LEdge":21,"./LGraphManager":23,"./LGraphObject":24,"./LNode":25,"./LayoutConstants":27,"./Point":28,"./RectangleD":31,"linkedlist-js":1}],23:[function(_dereq_,module,exports){
'use strict';

var LGraph;
var LEdge = _dereq_('./LEdge');

function LGraphManager(layout) {
  LGraph = _dereq_('./LGraph'); // It may be better to initilize this out of this function but it gives an error (Right-hand side of 'instanceof' is not callable) now.
  this.layout = layout;

  this.graphs = [];
  this.edges = [];
}

LGraphManager.prototype.addRoot = function () {
  var ngraph = this.layout.newGraph();
  var nnode = this.layout.newNode(null);
  var root = this.add(ngraph, nnode);
  this.setRootGraph(root);
  return this.rootGraph;
};

LGraphManager.prototype.add = function (newGraph, parentNode, newEdge, sourceNode, targetNode) {
  //there are just 2 parameters are passed then it adds an LGraph else it adds an LEdge
  if (newEdge == null && sourceNode == null && targetNode == null) {
    if (newGraph == null) {
      throw "Graph is null!";
    }
    if (parentNode == null) {
      throw "Parent node is null!";
    }
    if (this.graphs.indexOf(newGraph) > -1) {
      throw "Graph already in this graph mgr!";
    }

    this.graphs.push(newGraph);

    if (newGraph.parent != null) {
      throw "Already has a parent!";
    }
    if (parentNode.child != null) {
      throw "Already has a child!";
    }

    newGraph.parent = parentNode;
    parentNode.child = newGraph;

    return newGraph;
  } else {
    //change the order of the parameters
    targetNode = newEdge;
    sourceNode = parentNode;
    newEdge = newGraph;
    var sourceGraph = sourceNode.getOwner();
    var targetGraph = targetNode.getOwner();

    if (!(sourceGraph != null && sourceGraph.getGraphManager() == this)) {
      throw "Source not in this graph mgr!";
    }
    if (!(targetGraph != null && targetGraph.getGraphManager() == this)) {
      throw "Target not in this graph mgr!";
    }

    if (sourceGraph == targetGraph) {
      newEdge.isInterGraph = false;
      return sourceGraph.add(newEdge, sourceNode, targetNode);
    } else {
      newEdge.isInterGraph = true;

      // set source and target
      newEdge.source = sourceNode;
      newEdge.target = targetNode;

      // add edge to inter-graph edge list
      if (this.edges.indexOf(newEdge) > -1) {
        throw "Edge already in inter-graph edge list!";
      }

      this.edges.push(newEdge);

      // add edge to source and target incidency lists
      if (!(newEdge.source != null && newEdge.target != null)) {
        throw "Edge source and/or target is null!";
      }

      if (!(newEdge.source.edges.indexOf(newEdge) == -1 && newEdge.target.edges.indexOf(newEdge) == -1)) {
        throw "Edge already in source and/or target incidency list!";
      }

      newEdge.source.edges.push(newEdge);
      newEdge.target.edges.push(newEdge);

      return newEdge;
    }
  }
};

LGraphManager.prototype.remove = function (lObj) {
  if (lObj instanceof LGraph) {
    var graph = lObj;
    if (graph.getGraphManager() != this) {
      throw "Graph not in this graph mgr";
    }
    if (!(graph == this.rootGraph || graph.parent != null && graph.parent.graphManager == this)) {
      throw "Invalid parent node!";
    }

    // first the edges (make a copy to do it safely)
    var edgesToBeRemoved = [];

    edgesToBeRemoved = edgesToBeRemoved.concat(graph.getEdges());

    var edge;
    var s = edgesToBeRemoved.length;
    for (var i = 0; i < s; i++) {
      edge = edgesToBeRemoved[i];
      graph.remove(edge);
    }

    // then the nodes (make a copy to do it safely)
    var nodesToBeRemoved = [];

    nodesToBeRemoved = nodesToBeRemoved.concat(graph.getNodes());

    var node;
    s = nodesToBeRemoved.length;
    for (var i = 0; i < s; i++) {
      node = nodesToBeRemoved[i];
      graph.remove(node);
    }

    // check if graph is the root
    if (graph == this.rootGraph) {
      this.setRootGraph(null);
    }

    // now remove the graph itself
    var index = this.graphs.indexOf(graph);
    this.graphs.splice(index, 1);

    // also reset the parent of the graph
    graph.parent = null;
  } else if (lObj instanceof LEdge) {
    edge = lObj;
    if (edge == null) {
      throw "Edge is null!";
    }
    if (!edge.isInterGraph) {
      throw "Not an inter-graph edge!";
    }
    if (!(edge.source != null && edge.target != null)) {
      throw "Source and/or target is null!";
    }

    // remove edge from source and target nodes' incidency lists

    if (!(edge.source.edges.indexOf(edge) != -1 && edge.target.edges.indexOf(edge) != -1)) {
      throw "Source and/or target doesn't know this edge!";
    }

    var index = edge.source.edges.indexOf(edge);
    edge.source.edges.splice(index, 1);
    index = edge.target.edges.indexOf(edge);
    edge.target.edges.splice(index, 1);

    // remove edge from owner graph manager's inter-graph edge list

    if (!(edge.source.owner != null && edge.source.owner.getGraphManager() != null)) {
      throw "Edge owner graph or owner graph manager is null!";
    }
    if (edge.source.owner.getGraphManager().edges.indexOf(edge) == -1) {
      throw "Not in owner graph manager's edge list!";
    }

    var index = edge.source.owner.getGraphManager().edges.indexOf(edge);
    edge.source.owner.getGraphManager().edges.splice(index, 1);
  }
};

LGraphManager.prototype.updateBounds = function () {
  this.rootGraph.updateBounds(true);
};

LGraphManager.prototype.getGraphs = function () {
  return this.graphs;
};

LGraphManager.prototype.getAllNodes = function () {
  if (this.allNodes == null) {
    var nodeList = [];
    var graphs = this.getGraphs();
    var s = graphs.length;
    for (var i = 0; i < s; i++) {
      nodeList = nodeList.concat(graphs[i].getNodes());
    }
    this.allNodes = nodeList;
  }
  return this.allNodes;
};

LGraphManager.prototype.resetAllNodes = function () {
  this.allNodes = null;
};

LGraphManager.prototype.resetAllEdges = function () {
  this.allEdges = null;
};

LGraphManager.prototype.resetAllNodesToApplyGravitation = function () {
  this.allNodesToApplyGravitation = null;
};

LGraphManager.prototype.getAllEdges = function () {
  if (this.allEdges == null) {
    var edgeList = [];
    var graphs = this.getGraphs();
    var s = graphs.length;
    for (var i = 0; i < graphs.length; i++) {
      edgeList = edgeList.concat(graphs[i].getEdges());
    }

    edgeList = edgeList.concat(this.edges);

    this.allEdges = edgeList;
  }
  return this.allEdges;
};

LGraphManager.prototype.getAllNodesToApplyGravitation = function () {
  return this.allNodesToApplyGravitation;
};

LGraphManager.prototype.setAllNodesToApplyGravitation = function (nodeList) {
  if (this.allNodesToApplyGravitation != null) {
    throw "assert failed";
  }

  this.allNodesToApplyGravitation = nodeList;
};

LGraphManager.prototype.getRoot = function () {
  return this.rootGraph;
};

LGraphManager.prototype.setRootGraph = function (graph) {
  if (graph.getGraphManager() != this) {
    throw "Root not in this graph mgr!";
  }

  this.rootGraph = graph;
  // root graph must have a root node associated with it for convenience
  if (graph.parent == null) {
    graph.parent = this.layout.newNode("Root node");
  }
};

LGraphManager.prototype.getLayout = function () {
  return this.layout;
};

LGraphManager.prototype.isOneAncestorOfOther = function (firstNode, secondNode) {
  if (!(firstNode != null && secondNode != null)) {
    throw "assert failed";
  }

  if (firstNode == secondNode) {
    return true;
  }
  // Is second node an ancestor of the first one?
  var ownerGraph = firstNode.getOwner();
  var parentNode;

  do {
    parentNode = ownerGraph.getParent();

    if (parentNode == null) {
      break;
    }

    if (parentNode == secondNode) {
      return true;
    }

    ownerGraph = parentNode.getOwner();
    if (ownerGraph == null) {
      break;
    }
  } while (true);
  // Is first node an ancestor of the second one?
  ownerGraph = secondNode.getOwner();

  do {
    parentNode = ownerGraph.getParent();

    if (parentNode == null) {
      break;
    }

    if (parentNode == firstNode) {
      return true;
    }

    ownerGraph = parentNode.getOwner();
    if (ownerGraph == null) {
      break;
    }
  } while (true);

  return false;
};

LGraphManager.prototype.calcLowestCommonAncestors = function () {
  var edge;
  var sourceNode;
  var targetNode;
  var sourceAncestorGraph;
  var targetAncestorGraph;

  var edges = this.getAllEdges();
  var s = edges.length;
  for (var i = 0; i < s; i++) {
    edge = edges[i];

    sourceNode = edge.source;
    targetNode = edge.target;
    edge.lca = null;
    edge.sourceInLca = sourceNode;
    edge.targetInLca = targetNode;

    if (sourceNode == targetNode) {
      edge.lca = sourceNode.getOwner();
      continue;
    }

    sourceAncestorGraph = sourceNode.getOwner();

    while (edge.lca == null) {
      edge.targetInLca = targetNode;
      targetAncestorGraph = targetNode.getOwner();

      while (edge.lca == null) {
        if (targetAncestorGraph == sourceAncestorGraph) {
          edge.lca = targetAncestorGraph;
          break;
        }

        if (targetAncestorGraph == this.rootGraph) {
          break;
        }

        if (edge.lca != null) {
          throw "assert failed";
        }
        edge.targetInLca = targetAncestorGraph.getParent();
        targetAncestorGraph = edge.targetInLca.getOwner();
      }

      if (sourceAncestorGraph == this.rootGraph) {
        break;
      }

      if (edge.lca == null) {
        edge.sourceInLca = sourceAncestorGraph.getParent();
        sourceAncestorGraph = edge.sourceInLca.getOwner();
      }
    }

    if (edge.lca == null) {
      throw "assert failed";
    }
  }
};

LGraphManager.prototype.calcLowestCommonAncestor = function (firstNode, secondNode) {
  if (firstNode == secondNode) {
    return firstNode.getOwner();
  }
  var firstOwnerGraph = firstNode.getOwner();

  do {
    if (firstOwnerGraph == null) {
      break;
    }
    var secondOwnerGraph = secondNode.getOwner();

    do {
      if (secondOwnerGraph == null) {
        break;
      }

      if (secondOwnerGraph == firstOwnerGraph) {
        return secondOwnerGraph;
      }
      secondOwnerGraph = secondOwnerGraph.getParent().getOwner();
    } while (true);

    firstOwnerGraph = firstOwnerGraph.getParent().getOwner();
  } while (true);

  return firstOwnerGraph;
};

LGraphManager.prototype.calcInclusionTreeDepths = function (graph, depth) {
  if (graph == null && depth == null) {
    graph = this.rootGraph;
    depth = 1;
  }
  var node;

  var nodes = graph.getNodes();
  var s = nodes.length;
  for (var i = 0; i < s; i++) {
    node = nodes[i];
    node.inclusionTreeDepth = depth;

    if (node.child != null) {
      this.calcInclusionTreeDepths(node.child, depth + 1);
    }
  }
};

LGraphManager.prototype.includesInvalidEdge = function () {
  var edge;

  var s = this.edges.length;
  for (var i = 0; i < s; i++) {
    edge = this.edges[i];

    if (this.isOneAncestorOfOther(edge.source, edge.target)) {
      return true;
    }
  }
  return false;
};

module.exports = LGraphManager;

},{"./LEdge":21,"./LGraph":22}],24:[function(_dereq_,module,exports){
"use strict";

function LGraphObject(vGraphObject) {
  this.vGraphObject = vGraphObject;
}

module.exports = LGraphObject;

},{}],25:[function(_dereq_,module,exports){
'use strict';

var LGraphObject = _dereq_('./LGraphObject');
var Integer = _dereq_('./Integer');
var RectangleD = _dereq_('./RectangleD');
var LayoutConstants = _dereq_('./LayoutConstants');
var RandomSeed = _dereq_('./RandomSeed');
var PointD = _dereq_('./PointD');
var HashSet = _dereq_('./HashSet');

function LNode(gm, loc, size, vNode) {
  //Alternative constructor 1 : LNode(LGraphManager gm, Point loc, Dimension size, Object vNode)
  if (size == null && vNode == null) {
    vNode = loc;
  }

  LGraphObject.call(this, vNode);

  //Alternative constructor 2 : LNode(Layout layout, Object vNode)
  if (gm.graphManager != null) gm = gm.graphManager;

  this.estimatedSize = Integer.MIN_VALUE;
  this.inclusionTreeDepth = Integer.MAX_VALUE;
  this.vGraphObject = vNode;
  this.edges = [];
  this.graphManager = gm;

  if (size != null && loc != null) this.rect = new RectangleD(loc.x, loc.y, size.width, size.height);else this.rect = new RectangleD();
}

LNode.prototype = Object.create(LGraphObject.prototype);
for (var prop in LGraphObject) {
  LNode[prop] = LGraphObject[prop];
}

LNode.prototype.getEdges = function () {
  return this.edges;
};

LNode.prototype.getChild = function () {
  return this.child;
};

LNode.prototype.getOwner = function () {
  //  if (this.owner != null) {
  //    if (!(this.owner == null || this.owner.getNodes().indexOf(this) > -1)) {
  //      throw "assert failed";
  //    }
  //  }

  return this.owner;
};

LNode.prototype.getWidth = function () {
  return this.rect.width;
};

LNode.prototype.setWidth = function (width) {
  this.rect.width = width;
};

LNode.prototype.getHeight = function () {
  return this.rect.height;
};

LNode.prototype.setHeight = function (height) {
  this.rect.height = height;
};

LNode.prototype.getCenterX = function () {
  return this.rect.x + this.rect.width / 2;
};

LNode.prototype.getCenterY = function () {
  return this.rect.y + this.rect.height / 2;
};

LNode.prototype.getCenter = function () {
  return new PointD(this.rect.x + this.rect.width / 2, this.rect.y + this.rect.height / 2);
};

LNode.prototype.getLocation = function () {
  return new PointD(this.rect.x, this.rect.y);
};

LNode.prototype.getRect = function () {
  return this.rect;
};

LNode.prototype.getDiagonal = function () {
  return Math.sqrt(this.rect.width * this.rect.width + this.rect.height * this.rect.height);
};

LNode.prototype.setRect = function (upperLeft, dimension) {
  this.rect.x = upperLeft.x;
  this.rect.y = upperLeft.y;
  this.rect.width = dimension.width;
  this.rect.height = dimension.height;
};

LNode.prototype.setCenter = function (cx, cy) {
  this.rect.x = cx - this.rect.width / 2;
  this.rect.y = cy - this.rect.height / 2;
};

LNode.prototype.setLocation = function (x, y) {
  this.rect.x = x;
  this.rect.y = y;
};

LNode.prototype.moveBy = function (dx, dy) {
  this.rect.x += dx;
  this.rect.y += dy;
};

LNode.prototype.getEdgeListToNode = function (to) {
  var edgeList = [];
  var edge;
  var self = this;

  self.edges.forEach(function (edge) {

    if (edge.target == to) {
      if (edge.source != self) throw "Incorrect edge source!";

      edgeList.push(edge);
    }
  });

  return edgeList;
};

LNode.prototype.getEdgesBetween = function (other) {
  var edgeList = [];
  var edge;

  var self = this;
  self.edges.forEach(function (edge) {

    if (!(edge.source == self || edge.target == self)) throw "Incorrect edge source and/or target";

    if (edge.target == other || edge.source == other) {
      edgeList.push(edge);
    }
  });

  return edgeList;
};

LNode.prototype.getNeighborsList = function () {
  var neighbors = new HashSet();
  var edge;

  var self = this;
  self.edges.forEach(function (edge) {

    if (edge.source == self) {
      neighbors.add(edge.target);
    } else {
      if (edge.target != self) {
        throw "Incorrect incidency!";
      }

      neighbors.add(edge.source);
    }
  });

  return neighbors;
};

LNode.prototype.withChildren = function () {
  var withNeighborsList = new Set();
  var childNode;
  var children;

  withNeighborsList.add(this);

  if (this.child != null) {
    var nodes = this.child.getNodes();
    for (var i = 0; i < nodes.length; i++) {
      childNode = nodes[i];
      children = childNode.withChildren();
      children.forEach(function (node) {
        withNeighborsList.add(node);
      });
    }
  }

  return withNeighborsList;
};

LNode.prototype.getNoOfChildren = function () {
  var noOfChildren = 0;
  var childNode;

  if (this.child == null) {
    noOfChildren = 1;
  } else {
    var nodes = this.child.getNodes();
    for (var i = 0; i < nodes.length; i++) {
      childNode = nodes[i];

      noOfChildren += childNode.getNoOfChildren();
    }
  }

  if (noOfChildren == 0) {
    noOfChildren = 1;
  }
  return noOfChildren;
};

LNode.prototype.getEstimatedSize = function () {
  if (this.estimatedSize == Integer.MIN_VALUE) {
    throw "assert failed";
  }
  return this.estimatedSize;
};

LNode.prototype.calcEstimatedSize = function () {
  if (this.child == null) {
    return this.estimatedSize = (this.rect.width + this.rect.height) / 2;
  } else {
    this.estimatedSize = this.child.calcEstimatedSize();
    this.rect.width = this.estimatedSize;
    this.rect.height = this.estimatedSize;

    return this.estimatedSize;
  }
};

LNode.prototype.scatter = function () {
  var randomCenterX;
  var randomCenterY;

  var minX = -LayoutConstants.INITIAL_WORLD_BOUNDARY;
  var maxX = LayoutConstants.INITIAL_WORLD_BOUNDARY;
  randomCenterX = LayoutConstants.WORLD_CENTER_X + RandomSeed.nextDouble() * (maxX - minX) + minX;

  var minY = -LayoutConstants.INITIAL_WORLD_BOUNDARY;
  var maxY = LayoutConstants.INITIAL_WORLD_BOUNDARY;
  randomCenterY = LayoutConstants.WORLD_CENTER_Y + RandomSeed.nextDouble() * (maxY - minY) + minY;

  this.rect.x = randomCenterX;
  this.rect.y = randomCenterY;
};

LNode.prototype.updateBounds = function () {
  if (this.getChild() == null) {
    throw "assert failed";
  }
  if (this.getChild().getNodes().length != 0) {
    // wrap the children nodes by re-arranging the boundaries
    var childGraph = this.getChild();
    childGraph.updateBounds(true);

    this.rect.x = childGraph.getLeft();
    this.rect.y = childGraph.getTop();

    this.setWidth(childGraph.getRight() - childGraph.getLeft());
    this.setHeight(childGraph.getBottom() - childGraph.getTop());

    // Update compound bounds considering its label properties    
    if (LayoutConstants.NODE_DIMENSIONS_INCLUDE_LABELS) {

      var width = childGraph.getRight() - childGraph.getLeft();
      var height = childGraph.getBottom() - childGraph.getTop();

      if (this.labelWidth > width) {
        this.rect.x -= (this.labelWidth - width) / 2;
        this.setWidth(this.labelWidth);
      }

      if (this.labelHeight > height) {
        if (this.labelPos == "center") {
          this.rect.y -= (this.labelHeight - height) / 2;
        } else if (this.labelPos == "top") {
          this.rect.y -= this.labelHeight - height;
        }
        this.setHeight(this.labelHeight);
      }
    }
  }
};

LNode.prototype.getInclusionTreeDepth = function () {
  if (this.inclusionTreeDepth == Integer.MAX_VALUE) {
    throw "assert failed";
  }
  return this.inclusionTreeDepth;
};

LNode.prototype.transform = function (trans) {
  var left = this.rect.x;

  if (left > LayoutConstants.WORLD_BOUNDARY) {
    left = LayoutConstants.WORLD_BOUNDARY;
  } else if (left < -LayoutConstants.WORLD_BOUNDARY) {
    left = -LayoutConstants.WORLD_BOUNDARY;
  }

  var top = this.rect.y;

  if (top > LayoutConstants.WORLD_BOUNDARY) {
    top = LayoutConstants.WORLD_BOUNDARY;
  } else if (top < -LayoutConstants.WORLD_BOUNDARY) {
    top = -LayoutConstants.WORLD_BOUNDARY;
  }

  var leftTop = new PointD(left, top);
  var vLeftTop = trans.inverseTransformPoint(leftTop);

  this.setLocation(vLeftTop.x, vLeftTop.y);
};

LNode.prototype.getLeft = function () {
  return this.rect.x;
};

LNode.prototype.getRight = function () {
  return this.rect.x + this.rect.width;
};

LNode.prototype.getTop = function () {
  return this.rect.y;
};

LNode.prototype.getBottom = function () {
  return this.rect.y + this.rect.height;
};

LNode.prototype.getParent = function () {
  if (this.owner == null) {
    return null;
  }

  return this.owner.getParent();
};

module.exports = LNode;

},{"./HashSet":17,"./Integer":20,"./LGraphObject":24,"./LayoutConstants":27,"./PointD":29,"./RandomSeed":30,"./RectangleD":31}],26:[function(_dereq_,module,exports){
'use strict';

var LayoutConstants = _dereq_('./LayoutConstants');
var HashMap = _dereq_('./HashMap');
var LGraphManager = _dereq_('./LGraphManager');
var LNode = _dereq_('./LNode');
var LEdge = _dereq_('./LEdge');
var LGraph = _dereq_('./LGraph');
var PointD = _dereq_('./PointD');
var Transform = _dereq_('./Transform');
var Emitter = _dereq_('./Emitter');
var HashSet = _dereq_('./HashSet');

function Layout(isRemoteUse) {
  Emitter.call(this);

  //Layout Quality: 0:proof, 1:default, 2:draft
  this.layoutQuality = LayoutConstants.DEFAULT_QUALITY;
  //Whether layout should create bendpoints as needed or not
  this.createBendsAsNeeded = LayoutConstants.DEFAULT_CREATE_BENDS_AS_NEEDED;
  //Whether layout should be incremental or not
  this.incremental = LayoutConstants.DEFAULT_INCREMENTAL;
  //Whether we animate from before to after layout node positions
  this.animationOnLayout = LayoutConstants.DEFAULT_ANIMATION_ON_LAYOUT;
  //Whether we animate the layout process or not
  this.animationDuringLayout = LayoutConstants.DEFAULT_ANIMATION_DURING_LAYOUT;
  //Number iterations that should be done between two successive animations
  this.animationPeriod = LayoutConstants.DEFAULT_ANIMATION_PERIOD;
  /**
   * Whether or not leaf nodes (non-compound nodes) are of uniform sizes. When
   * they are, both spring and repulsion forces between two leaf nodes can be
   * calculated without the expensive clipping point calculations, resulting
   * in major speed-up.
   */
  this.uniformLeafNodeSizes = LayoutConstants.DEFAULT_UNIFORM_LEAF_NODE_SIZES;
  /**
   * This is used for creation of bendpoints by using dummy nodes and edges.
   * Maps an LEdge to its dummy bendpoint path.
   */
  this.edgeToDummyNodes = new HashMap();
  this.graphManager = new LGraphManager(this);
  this.isLayoutFinished = false;
  this.isSubLayout = false;
  this.isRemoteUse = false;

  if (isRemoteUse != null) {
    this.isRemoteUse = isRemoteUse;
  }
}

Layout.RANDOM_SEED = 1;

Layout.prototype = Object.create(Emitter.prototype);

Layout.prototype.getGraphManager = function () {
  return this.graphManager;
};

Layout.prototype.getAllNodes = function () {
  return this.graphManager.getAllNodes();
};

Layout.prototype.getAllEdges = function () {
  return this.graphManager.getAllEdges();
};

Layout.prototype.getAllNodesToApplyGravitation = function () {
  return this.graphManager.getAllNodesToApplyGravitation();
};

Layout.prototype.newGraphManager = function () {
  var gm = new LGraphManager(this);
  this.graphManager = gm;
  return gm;
};

Layout.prototype.newGraph = function (vGraph) {
  return new LGraph(null, this.graphManager, vGraph);
};

Layout.prototype.newNode = function (vNode) {
  return new LNode(this.graphManager, vNode);
};

Layout.prototype.newEdge = function (vEdge) {
  return new LEdge(null, null, vEdge);
};

Layout.prototype.checkLayoutSuccess = function () {
  return this.graphManager.getRoot() == null || this.graphManager.getRoot().getNodes().length == 0 || this.graphManager.includesInvalidEdge();
};

Layout.prototype.runLayout = function () {
  this.isLayoutFinished = false;

  if (this.tilingPreLayout) {
    this.tilingPreLayout();
  }

  this.initParameters();
  var isLayoutSuccessfull;

  if (this.checkLayoutSuccess()) {
    isLayoutSuccessfull = false;
  } else {
    isLayoutSuccessfull = this.layout();
  }

  if (LayoutConstants.ANIMATE === 'during') {
    // If this is a 'during' layout animation. Layout is not finished yet. 
    // We need to perform these in index.js when layout is really finished.
    return false;
  }

  if (isLayoutSuccessfull) {
    if (!this.isSubLayout) {
      this.doPostLayout();
    }
  }

  if (this.tilingPostLayout) {
    this.tilingPostLayout();
  }

  this.isLayoutFinished = true;

  return isLayoutSuccessfull;
};

/**
 * This method performs the operations required after layout.
 */
Layout.prototype.doPostLayout = function () {
  //assert !isSubLayout : "Should not be called on sub-layout!";
  // Propagate geometric changes to v-level objects
  if (!this.incremental) {
    this.transform();
  }
  this.update();
};

/**
 * This method updates the geometry of the target graph according to
 * calculated layout.
 */
Layout.prototype.update2 = function () {
  // update bend points
  if (this.createBendsAsNeeded) {
    this.createBendpointsFromDummyNodes();

    // reset all edges, since the topology has changed
    this.graphManager.resetAllEdges();
  }

  // perform edge, node and root updates if layout is not called
  // remotely
  if (!this.isRemoteUse) {
    // update all edges
    var edge;
    var allEdges = this.graphManager.getAllEdges();
    for (var i = 0; i < allEdges.length; i++) {
      edge = allEdges[i];
      //      this.update(edge);
    }

    // recursively update nodes
    var node;
    var nodes = this.graphManager.getRoot().getNodes();
    for (var i = 0; i < nodes.length; i++) {
      node = nodes[i];
      //      this.update(node);
    }

    // update root graph
    this.update(this.graphManager.getRoot());
  }
};

Layout.prototype.update = function (obj) {
  if (obj == null) {
    this.update2();
  } else if (obj instanceof LNode) {
    var node = obj;
    if (node.getChild() != null) {
      // since node is compound, recursively update child nodes
      var nodes = node.getChild().getNodes();
      for (var i = 0; i < nodes.length; i++) {
        update(nodes[i]);
      }
    }

    // if the l-level node is associated with a v-level graph object,
    // then it is assumed that the v-level node implements the
    // interface Updatable.
    if (node.vGraphObject != null) {
      // cast to Updatable without any type check
      var vNode = node.vGraphObject;

      // call the update method of the interface
      vNode.update(node);
    }
  } else if (obj instanceof LEdge) {
    var edge = obj;
    // if the l-level edge is associated with a v-level graph object,
    // then it is assumed that the v-level edge implements the
    // interface Updatable.

    if (edge.vGraphObject != null) {
      // cast to Updatable without any type check
      var vEdge = edge.vGraphObject;

      // call the update method of the interface
      vEdge.update(edge);
    }
  } else if (obj instanceof LGraph) {
    var graph = obj;
    // if the l-level graph is associated with a v-level graph object,
    // then it is assumed that the v-level object implements the
    // interface Updatable.

    if (graph.vGraphObject != null) {
      // cast to Updatable without any type check
      var vGraph = graph.vGraphObject;

      // call the update method of the interface
      vGraph.update(graph);
    }
  }
};

/**
 * This method is used to set all layout parameters to default values
 * determined at compile time.
 */
Layout.prototype.initParameters = function () {
  if (!this.isSubLayout) {
    this.layoutQuality = LayoutConstants.DEFAULT_QUALITY;
    this.animationDuringLayout = LayoutConstants.DEFAULT_ANIMATION_DURING_LAYOUT;
    this.animationPeriod = LayoutConstants.DEFAULT_ANIMATION_PERIOD;
    this.animationOnLayout = LayoutConstants.DEFAULT_ANIMATION_ON_LAYOUT;
    this.incremental = LayoutConstants.DEFAULT_INCREMENTAL;
    this.createBendsAsNeeded = LayoutConstants.DEFAULT_CREATE_BENDS_AS_NEEDED;
    this.uniformLeafNodeSizes = LayoutConstants.DEFAULT_UNIFORM_LEAF_NODE_SIZES;
  }

  if (this.animationDuringLayout) {
    this.animationOnLayout = false;
  }
};

Layout.prototype.transform = function (newLeftTop) {
  if (newLeftTop == undefined) {
    this.transform(new PointD(0, 0));
  } else {
    // create a transformation object (from Eclipse to layout). When an
    // inverse transform is applied, we get upper-left coordinate of the
    // drawing or the root graph at given input coordinate (some margins
    // already included in calculation of left-top).

    var trans = new Transform();
    var leftTop = this.graphManager.getRoot().updateLeftTop();

    if (leftTop != null) {
      trans.setWorldOrgX(newLeftTop.x);
      trans.setWorldOrgY(newLeftTop.y);

      trans.setDeviceOrgX(leftTop.x);
      trans.setDeviceOrgY(leftTop.y);

      var nodes = this.getAllNodes();
      var node;

      for (var i = 0; i < nodes.length; i++) {
        node = nodes[i];
        node.transform(trans);
      }
    }
  }
};

Layout.prototype.positionNodesRandomly = function (graph) {

  if (graph == undefined) {
    //assert !this.incremental;
    this.positionNodesRandomly(this.getGraphManager().getRoot());
    this.getGraphManager().getRoot().updateBounds(true);
  } else {
    var lNode;
    var childGraph;

    var nodes = graph.getNodes();
    for (var i = 0; i < nodes.length; i++) {
      lNode = nodes[i];
      childGraph = lNode.getChild();

      if (childGraph == null) {
        lNode.scatter();
      } else if (childGraph.getNodes().length == 0) {
        lNode.scatter();
      } else {
        this.positionNodesRandomly(childGraph);
        lNode.updateBounds();
      }
    }
  }
};

/**
 * This method returns a list of trees where each tree is represented as a
 * list of l-nodes. The method returns a list of size 0 when:
 * - The graph is not flat or
 * - One of the component(s) of the graph is not a tree.
 */
Layout.prototype.getFlatForest = function () {
  var flatForest = [];
  var isForest = true;

  // Quick reference for all nodes in the graph manager associated with
  // this layout. The list should not be changed.
  var allNodes = this.graphManager.getRoot().getNodes();

  // First be sure that the graph is flat
  var isFlat = true;

  for (var i = 0; i < allNodes.length; i++) {
    if (allNodes[i].getChild() != null) {
      isFlat = false;
    }
  }

  // Return empty forest if the graph is not flat.
  if (!isFlat) {
    return flatForest;
  }

  // Run BFS for each component of the graph.

  var visited = new HashSet();
  var toBeVisited = [];
  var parents = new HashMap();
  var unProcessedNodes = [];

  unProcessedNodes = unProcessedNodes.concat(allNodes);

  // Each iteration of this loop finds a component of the graph and
  // decides whether it is a tree or not. If it is a tree, adds it to the
  // forest and continued with the next component.

  while (unProcessedNodes.length > 0 && isForest) {
    toBeVisited.push(unProcessedNodes[0]);

    // Start the BFS. Each iteration of this loop visits a node in a
    // BFS manner.
    while (toBeVisited.length > 0 && isForest) {
      //pool operation
      var currentNode = toBeVisited[0];
      toBeVisited.splice(0, 1);
      visited.add(currentNode);

      // Traverse all neighbors of this node
      var neighborEdges = currentNode.getEdges();

      for (var i = 0; i < neighborEdges.length; i++) {
        var currentNeighbor = neighborEdges[i].getOtherEnd(currentNode);

        // If BFS is not growing from this neighbor.
        if (parents.get(currentNode) != currentNeighbor) {
          // We haven't previously visited this neighbor.
          if (!visited.contains(currentNeighbor)) {
            toBeVisited.push(currentNeighbor);
            parents.put(currentNeighbor, currentNode);
          }
          // Since we have previously visited this neighbor and
          // this neighbor is not parent of currentNode, given
          // graph contains a component that is not tree, hence
          // it is not a forest.
          else {
              isForest = false;
              break;
            }
        }
      }
    }

    // The graph contains a component that is not a tree. Empty
    // previously found trees. The method will end.
    if (!isForest) {
      flatForest = [];
    }
    // Save currently visited nodes as a tree in our forest. Reset
    // visited and parents lists. Continue with the next component of
    // the graph, if any.
    else {
        var temp = [];
        visited.addAllTo(temp);
        flatForest.push(temp);
        //flatForest = flatForest.concat(temp);
        //unProcessedNodes.removeAll(visited);
        for (var i = 0; i < temp.length; i++) {
          var value = temp[i];
          var index = unProcessedNodes.indexOf(value);
          if (index > -1) {
            unProcessedNodes.splice(index, 1);
          }
        }
        visited = new HashSet();
        parents = new HashMap();
      }
  }

  return flatForest;
};

/**
 * This method creates dummy nodes (an l-level node with minimal dimensions)
 * for the given edge (one per bendpoint). The existing l-level structure
 * is updated accordingly.
 */
Layout.prototype.createDummyNodesForBendpoints = function (edge) {
  var dummyNodes = [];
  var prev = edge.source;

  var graph = this.graphManager.calcLowestCommonAncestor(edge.source, edge.target);

  for (var i = 0; i < edge.bendpoints.length; i++) {
    // create new dummy node
    var dummyNode = this.newNode(null);
    dummyNode.setRect(new Point(0, 0), new Dimension(1, 1));

    graph.add(dummyNode);

    // create new dummy edge between prev and dummy node
    var dummyEdge = this.newEdge(null);
    this.graphManager.add(dummyEdge, prev, dummyNode);

    dummyNodes.add(dummyNode);
    prev = dummyNode;
  }

  var dummyEdge = this.newEdge(null);
  this.graphManager.add(dummyEdge, prev, edge.target);

  this.edgeToDummyNodes.put(edge, dummyNodes);

  // remove real edge from graph manager if it is inter-graph
  if (edge.isInterGraph()) {
    this.graphManager.remove(edge);
  }
  // else, remove the edge from the current graph
  else {
      graph.remove(edge);
    }

  return dummyNodes;
};

/**
 * This method creates bendpoints for edges from the dummy nodes
 * at l-level.
 */
Layout.prototype.createBendpointsFromDummyNodes = function () {
  var edges = [];
  edges = edges.concat(this.graphManager.getAllEdges());
  edges = this.edgeToDummyNodes.keySet().concat(edges);

  for (var k = 0; k < edges.length; k++) {
    var lEdge = edges[k];

    if (lEdge.bendpoints.length > 0) {
      var path = this.edgeToDummyNodes.get(lEdge);

      for (var i = 0; i < path.length; i++) {
        var dummyNode = path[i];
        var p = new PointD(dummyNode.getCenterX(), dummyNode.getCenterY());

        // update bendpoint's location according to dummy node
        var ebp = lEdge.bendpoints.get(i);
        ebp.x = p.x;
        ebp.y = p.y;

        // remove the dummy node, dummy edges incident with this
        // dummy node is also removed (within the remove method)
        dummyNode.getOwner().remove(dummyNode);
      }

      // add the real edge to graph
      this.graphManager.add(lEdge, lEdge.source, lEdge.target);
    }
  }
};

Layout.transform = function (sliderValue, defaultValue, minDiv, maxMul) {
  if (minDiv != undefined && maxMul != undefined) {
    var value = defaultValue;

    if (sliderValue <= 50) {
      var minValue = defaultValue / minDiv;
      value -= (defaultValue - minValue) / 50 * (50 - sliderValue);
    } else {
      var maxValue = defaultValue * maxMul;
      value += (maxValue - defaultValue) / 50 * (sliderValue - 50);
    }

    return value;
  } else {
    var a, b;

    if (sliderValue <= 50) {
      a = 9.0 * defaultValue / 500.0;
      b = defaultValue / 10.0;
    } else {
      a = 9.0 * defaultValue / 50.0;
      b = -8 * defaultValue;
    }

    return a * sliderValue + b;
  }
};

/**
 * This method finds and returns the center of the given nodes, assuming
 * that the given nodes form a tree in themselves.
 */
Layout.findCenterOfTree = function (nodes) {
  var list = [];
  list = list.concat(nodes);

  var removedNodes = [];
  var remainingDegrees = new HashMap();
  var foundCenter = false;
  var centerNode = null;

  if (list.length == 1 || list.length == 2) {
    foundCenter = true;
    centerNode = list[0];
  }

  for (var i = 0; i < list.length; i++) {
    var node = list[i];
    var degree = node.getNeighborsList().size();
    remainingDegrees.put(node, node.getNeighborsList().size());

    if (degree == 1) {
      removedNodes.push(node);
    }
  }

  var tempList = [];
  tempList = tempList.concat(removedNodes);

  while (!foundCenter) {
    var tempList2 = [];
    tempList2 = tempList2.concat(tempList);
    tempList = [];

    for (var i = 0; i < list.length; i++) {
      var node = list[i];

      var index = list.indexOf(node);
      if (index >= 0) {
        list.splice(index, 1);
      }

      var neighbours = node.getNeighborsList();

      Object.keys(neighbours.set).forEach(function (j) {
        var neighbour = neighbours.set[j];
        if (removedNodes.indexOf(neighbour) < 0) {
          var otherDegree = remainingDegrees.get(neighbour);
          var newDegree = otherDegree - 1;

          if (newDegree == 1) {
            tempList.push(neighbour);
          }

          remainingDegrees.put(neighbour, newDegree);
        }
      });
    }

    removedNodes = removedNodes.concat(tempList);

    if (list.length == 1 || list.length == 2) {
      foundCenter = true;
      centerNode = list[0];
    }
  }

  return centerNode;
};

/**
 * During the coarsening process, this layout may be referenced by two graph managers
 * this setter function grants access to change the currently being used graph manager
 */
Layout.prototype.setGraphManager = function (gm) {
  this.graphManager = gm;
};

module.exports = Layout;

},{"./Emitter":11,"./HashMap":16,"./HashSet":17,"./LEdge":21,"./LGraph":22,"./LGraphManager":23,"./LNode":25,"./LayoutConstants":27,"./PointD":29,"./Transform":32}],27:[function(_dereq_,module,exports){
"use strict";

function LayoutConstants() {}

/**
 * Layout Quality
 */
LayoutConstants.PROOF_QUALITY = 0;
LayoutConstants.DEFAULT_QUALITY = 1;
LayoutConstants.DRAFT_QUALITY = 2;

/**
 * Default parameters
 */
LayoutConstants.DEFAULT_CREATE_BENDS_AS_NEEDED = false;
//LayoutConstants.DEFAULT_INCREMENTAL = true;
LayoutConstants.DEFAULT_INCREMENTAL = false;
LayoutConstants.DEFAULT_ANIMATION_ON_LAYOUT = true;
LayoutConstants.DEFAULT_ANIMATION_DURING_LAYOUT = false;
LayoutConstants.DEFAULT_ANIMATION_PERIOD = 50;
LayoutConstants.DEFAULT_UNIFORM_LEAF_NODE_SIZES = false;

// -----------------------------------------------------------------------------
// Section: General other constants
// -----------------------------------------------------------------------------
/*
 * Margins of a graph to be applied on bouding rectangle of its contents. We
 * assume margins on all four sides to be uniform.
 */
LayoutConstants.DEFAULT_GRAPH_MARGIN = 15;

/*
 * Whether to consider labels in node dimensions or not
 */
LayoutConstants.NODE_DIMENSIONS_INCLUDE_LABELS = false;

/*
 * Default dimension of a non-compound node.
 */
LayoutConstants.SIMPLE_NODE_SIZE = 40;

/*
 * Default dimension of a non-compound node.
 */
LayoutConstants.SIMPLE_NODE_HALF_SIZE = LayoutConstants.SIMPLE_NODE_SIZE / 2;

/*
 * Empty compound node size. When a compound node is empty, its both
 * dimensions should be of this value.
 */
LayoutConstants.EMPTY_COMPOUND_NODE_SIZE = 40;

/*
 * Minimum length that an edge should take during layout
 */
LayoutConstants.MIN_EDGE_LENGTH = 1;

/*
 * World boundaries that layout operates on
 */
LayoutConstants.WORLD_BOUNDARY = 1000000;

/*
 * World boundaries that random positioning can be performed with
 */
LayoutConstants.INITIAL_WORLD_BOUNDARY = LayoutConstants.WORLD_BOUNDARY / 1000;

/*
 * Coordinates of the world center
 */
LayoutConstants.WORLD_CENTER_X = 1200;
LayoutConstants.WORLD_CENTER_Y = 900;

module.exports = LayoutConstants;

},{}],28:[function(_dereq_,module,exports){
'use strict';

/*
 *This class is the javascript implementation of the Point.java class in jdk
 */
function Point(x, y, p) {
  this.x = null;
  this.y = null;
  if (x == null && y == null && p == null) {
    this.x = 0;
    this.y = 0;
  } else if (typeof x == 'number' && typeof y == 'number' && p == null) {
    this.x = x;
    this.y = y;
  } else if (x.constructor.name == 'Point' && y == null && p == null) {
    p = x;
    this.x = p.x;
    this.y = p.y;
  }
}

Point.prototype.getX = function () {
  return this.x;
};

Point.prototype.getY = function () {
  return this.y;
};

Point.prototype.getLocation = function () {
  return new Point(this.x, this.y);
};

Point.prototype.setLocation = function (x, y, p) {
  if (x.constructor.name == 'Point' && y == null && p == null) {
    p = x;
    this.setLocation(p.x, p.y);
  } else if (typeof x == 'number' && typeof y == 'number' && p == null) {
    //if both parameters are integer just move (x,y) location
    if (parseInt(x) == x && parseInt(y) == y) {
      this.move(x, y);
    } else {
      this.x = Math.floor(x + 0.5);
      this.y = Math.floor(y + 0.5);
    }
  }
};

Point.prototype.move = function (x, y) {
  this.x = x;
  this.y = y;
};

Point.prototype.translate = function (dx, dy) {
  this.x += dx;
  this.y += dy;
};

Point.prototype.equals = function (obj) {
  if (obj.constructor.name == "Point") {
    var pt = obj;
    return this.x == pt.x && this.y == pt.y;
  }
  return this == obj;
};

Point.prototype.toString = function () {
  return new Point().constructor.name + "[x=" + this.x + ",y=" + this.y + "]";
};

module.exports = Point;

},{}],29:[function(_dereq_,module,exports){
"use strict";

function PointD(x, y) {
  if (x == null && y == null) {
    this.x = 0;
    this.y = 0;
  } else {
    this.x = x;
    this.y = y;
  }
}

PointD.prototype.getX = function () {
  return this.x;
};

PointD.prototype.getY = function () {
  return this.y;
};

PointD.prototype.setX = function (x) {
  this.x = x;
};

PointD.prototype.setY = function (y) {
  this.y = y;
};

PointD.prototype.getDifference = function (pt) {
  return new DimensionD(this.x - pt.x, this.y - pt.y);
};

PointD.prototype.getCopy = function () {
  return new PointD(this.x, this.y);
};

PointD.prototype.translate = function (dim) {
  this.x += dim.width;
  this.y += dim.height;
  return this;
};

module.exports = PointD;

},{}],30:[function(_dereq_,module,exports){
"use strict";

function RandomSeed() {}
RandomSeed.seed = 1;
RandomSeed.x = 0;

RandomSeed.nextDouble = function () {
  RandomSeed.x = Math.sin(RandomSeed.seed++) * 10000;
  return RandomSeed.x - Math.floor(RandomSeed.x);
};

module.exports = RandomSeed;

},{}],31:[function(_dereq_,module,exports){
"use strict";

function RectangleD(x, y, width, height) {
  this.x = 0;
  this.y = 0;
  this.width = 0;
  this.height = 0;

  if (x != null && y != null && width != null && height != null) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }
}

RectangleD.prototype.getX = function () {
  return this.x;
};

RectangleD.prototype.setX = function (x) {
  this.x = x;
};

RectangleD.prototype.getY = function () {
  return this.y;
};

RectangleD.prototype.setY = function (y) {
  this.y = y;
};

RectangleD.prototype.getWidth = function () {
  return this.width;
};

RectangleD.prototype.setWidth = function (width) {
  this.width = width;
};

RectangleD.prototype.getHeight = function () {
  return this.height;
};

RectangleD.prototype.setHeight = function (height) {
  this.height = height;
};

RectangleD.prototype.getRight = function () {
  return this.x + this.width;
};

RectangleD.prototype.getBottom = function () {
  return this.y + this.height;
};

RectangleD.prototype.intersects = function (a) {
  if (this.getRight() < a.x) {
    return false;
  }

  if (this.getBottom() < a.y) {
    return false;
  }

  if (a.getRight() < this.x) {
    return false;
  }

  if (a.getBottom() < this.y) {
    return false;
  }

  return true;
};

RectangleD.prototype.getCenterX = function () {
  return this.x + this.width / 2;
};

RectangleD.prototype.getMinX = function () {
  return this.getX();
};

RectangleD.prototype.getMaxX = function () {
  return this.getX() + this.width;
};

RectangleD.prototype.getCenterY = function () {
  return this.y + this.height / 2;
};

RectangleD.prototype.getMinY = function () {
  return this.getY();
};

RectangleD.prototype.getMaxY = function () {
  return this.getY() + this.height;
};

RectangleD.prototype.getWidthHalf = function () {
  return this.width / 2;
};

RectangleD.prototype.getHeightHalf = function () {
  return this.height / 2;
};

module.exports = RectangleD;

},{}],32:[function(_dereq_,module,exports){
'use strict';

var PointD = _dereq_('./PointD');

function Transform(x, y) {
  this.lworldOrgX = 0.0;
  this.lworldOrgY = 0.0;
  this.ldeviceOrgX = 0.0;
  this.ldeviceOrgY = 0.0;
  this.lworldExtX = 1.0;
  this.lworldExtY = 1.0;
  this.ldeviceExtX = 1.0;
  this.ldeviceExtY = 1.0;
}

Transform.prototype.getWorldOrgX = function () {
  return this.lworldOrgX;
};

Transform.prototype.setWorldOrgX = function (wox) {
  this.lworldOrgX = wox;
};

Transform.prototype.getWorldOrgY = function () {
  return this.lworldOrgY;
};

Transform.prototype.setWorldOrgY = function (woy) {
  this.lworldOrgY = woy;
};

Transform.prototype.getWorldExtX = function () {
  return this.lworldExtX;
};

Transform.prototype.setWorldExtX = function (wex) {
  this.lworldExtX = wex;
};

Transform.prototype.getWorldExtY = function () {
  return this.lworldExtY;
};

Transform.prototype.setWorldExtY = function (wey) {
  this.lworldExtY = wey;
};

/* Device related */

Transform.prototype.getDeviceOrgX = function () {
  return this.ldeviceOrgX;
};

Transform.prototype.setDeviceOrgX = function (dox) {
  this.ldeviceOrgX = dox;
};

Transform.prototype.getDeviceOrgY = function () {
  return this.ldeviceOrgY;
};

Transform.prototype.setDeviceOrgY = function (doy) {
  this.ldeviceOrgY = doy;
};

Transform.prototype.getDeviceExtX = function () {
  return this.ldeviceExtX;
};

Transform.prototype.setDeviceExtX = function (dex) {
  this.ldeviceExtX = dex;
};

Transform.prototype.getDeviceExtY = function () {
  return this.ldeviceExtY;
};

Transform.prototype.setDeviceExtY = function (dey) {
  this.ldeviceExtY = dey;
};

Transform.prototype.transformX = function (x) {
  var xDevice = 0.0;
  var worldExtX = this.lworldExtX;
  if (worldExtX != 0.0) {
    xDevice = this.ldeviceOrgX + (x - this.lworldOrgX) * this.ldeviceExtX / worldExtX;
  }

  return xDevice;
};

Transform.prototype.transformY = function (y) {
  var yDevice = 0.0;
  var worldExtY = this.lworldExtY;
  if (worldExtY != 0.0) {
    yDevice = this.ldeviceOrgY + (y - this.lworldOrgY) * this.ldeviceExtY / worldExtY;
  }

  return yDevice;
};

Transform.prototype.inverseTransformX = function (x) {
  var xWorld = 0.0;
  var deviceExtX = this.ldeviceExtX;
  if (deviceExtX != 0.0) {
    xWorld = this.lworldOrgX + (x - this.ldeviceOrgX) * this.lworldExtX / deviceExtX;
  }

  return xWorld;
};

Transform.prototype.inverseTransformY = function (y) {
  var yWorld = 0.0;
  var deviceExtY = this.ldeviceExtY;
  if (deviceExtY != 0.0) {
    yWorld = this.lworldOrgY + (y - this.ldeviceOrgY) * this.lworldExtY / deviceExtY;
  }
  return yWorld;
};

Transform.prototype.inverseTransformPoint = function (inPoint) {
  var outPoint = new PointD(this.inverseTransformX(inPoint.x), this.inverseTransformY(inPoint.y));
  return outPoint;
};

module.exports = Transform;

},{"./PointD":29}],33:[function(_dereq_,module,exports){
"use strict";

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

function UniqueIDGeneretor() {}

UniqueIDGeneretor.lastID = 0;

UniqueIDGeneretor.createID = function (obj) {
  if (UniqueIDGeneretor.isPrimitive(obj)) {
    return obj;
  }
  if (obj.uniqueID != null) {
    return obj.uniqueID;
  }
  obj.uniqueID = UniqueIDGeneretor.getString();
  UniqueIDGeneretor.lastID++;
  return obj.uniqueID;
};

UniqueIDGeneretor.getString = function (id) {
  if (id == null) id = UniqueIDGeneretor.lastID;
  return "Object#" + id + "";
};

UniqueIDGeneretor.isPrimitive = function (arg) {
  var type = typeof arg === "undefined" ? "undefined" : _typeof(arg);
  return arg == null || type != "object" && type != "function";
};

module.exports = UniqueIDGeneretor;

},{}],34:[function(_dereq_,module,exports){
'use strict';

var DimensionD = _dereq_('./DimensionD');
var HashMap = _dereq_('./HashMap');
var HashSet = _dereq_('./HashSet');
var IGeometry = _dereq_('./IGeometry');
var IMath = _dereq_('./IMath');
var Integer = _dereq_('./Integer');
var Point = _dereq_('./Point');
var PointD = _dereq_('./PointD');
var RandomSeed = _dereq_('./RandomSeed');
var RectangleD = _dereq_('./RectangleD');
var Transform = _dereq_('./Transform');
var UniqueIDGeneretor = _dereq_('./UniqueIDGeneretor');
var LGraphObject = _dereq_('./LGraphObject');
var LGraph = _dereq_('./LGraph');
var LEdge = _dereq_('./LEdge');
var LGraphManager = _dereq_('./LGraphManager');
var LNode = _dereq_('./LNode');
var Layout = _dereq_('./Layout');
var LayoutConstants = _dereq_('./LayoutConstants');
var FDLayout = _dereq_('./FDLayout');
var FDLayoutConstants = _dereq_('./FDLayoutConstants');
var FDLayoutEdge = _dereq_('./FDLayoutEdge');
var FDLayoutNode = _dereq_('./FDLayoutNode');
var CoSEConstants = _dereq_('./CoSEConstants');
var CoSEEdge = _dereq_('./CoSEEdge');
var CoSEGraph = _dereq_('./CoSEGraph');
var CoSEGraphManager = _dereq_('./CoSEGraphManager');
var CoSELayout = _dereq_('./CoSELayout');
var CoSENode = _dereq_('./CoSENode');

var defaults = {
  // Called on `layoutready`
  ready: function ready() {},
  // Called on `layoutstop`
  stop: function stop() {},
  // include labels in node dimensions
  nodeDimensionsIncludeLabels: false,
  // number of ticks per frame; higher is faster but more jerky
  refresh: 30,
  // Whether to fit the network view after when done
  fit: true,
  // Padding on fit
  padding: 10,
  // Whether to enable incremental mode
  randomize: true,
  // Node repulsion (non overlapping) multiplier
  nodeRepulsion: 4500,
  // Ideal edge (non nested) length
  idealEdgeLength: 50,
  // Divisor to compute edge forces
  edgeElasticity: 0.45,
  // Nesting factor (multiplier) to compute ideal edge length for nested edges
  nestingFactor: 0.1,
  // Gravity force (constant)
  gravity: 0.25,
  // Maximum number of iterations to perform
  numIter: 2500,
  // For enabling tiling
  tile: true,
  // Type of layout animation. The option set is {'during', 'end', false}
  animate: 'end',
  // Duration for animate:end
  animationDuration: 500,
  // Represents the amount of the vertical space to put between the zero degree members during the tiling operation(can also be a function)
  tilingPaddingVertical: 10,
  // Represents the amount of the horizontal space to put between the zero degree members during the tiling operation(can also be a function)
  tilingPaddingHorizontal: 10,
  // Gravity range (constant) for compounds
  gravityRangeCompound: 1.5,
  // Gravity force (constant) for compounds
  gravityCompound: 1.0,
  // Gravity range (constant)
  gravityRange: 3.8,
  // Initial cooling factor for incremental layout
  initialEnergyOnIncremental: 0.5
};

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

function _CoSELayout(_options) {
  this.options = extend(defaults, _options);
  getUserOptions(this.options);
}

var getUserOptions = function getUserOptions(options) {
  if (options.nodeRepulsion != null) CoSEConstants.DEFAULT_REPULSION_STRENGTH = FDLayoutConstants.DEFAULT_REPULSION_STRENGTH = options.nodeRepulsion;
  if (options.idealEdgeLength != null) CoSEConstants.DEFAULT_EDGE_LENGTH = FDLayoutConstants.DEFAULT_EDGE_LENGTH = options.idealEdgeLength;
  if (options.edgeElasticity != null) CoSEConstants.DEFAULT_SPRING_STRENGTH = FDLayoutConstants.DEFAULT_SPRING_STRENGTH = options.edgeElasticity;
  if (options.nestingFactor != null) CoSEConstants.PER_LEVEL_IDEAL_EDGE_LENGTH_FACTOR = FDLayoutConstants.PER_LEVEL_IDEAL_EDGE_LENGTH_FACTOR = options.nestingFactor;
  if (options.gravity != null) CoSEConstants.DEFAULT_GRAVITY_STRENGTH = FDLayoutConstants.DEFAULT_GRAVITY_STRENGTH = options.gravity;
  if (options.numIter != null) CoSEConstants.MAX_ITERATIONS = FDLayoutConstants.MAX_ITERATIONS = options.numIter;
  if (options.gravityRange != null) CoSEConstants.DEFAULT_GRAVITY_RANGE_FACTOR = FDLayoutConstants.DEFAULT_GRAVITY_RANGE_FACTOR = options.gravityRange;
  if (options.gravityCompound != null) CoSEConstants.DEFAULT_COMPOUND_GRAVITY_STRENGTH = FDLayoutConstants.DEFAULT_COMPOUND_GRAVITY_STRENGTH = options.gravityCompound;
  if (options.gravityRangeCompound != null) CoSEConstants.DEFAULT_COMPOUND_GRAVITY_RANGE_FACTOR = FDLayoutConstants.DEFAULT_COMPOUND_GRAVITY_RANGE_FACTOR = options.gravityRangeCompound;
  if (options.initialEnergyOnIncremental != null) CoSEConstants.DEFAULT_COOLING_FACTOR_INCREMENTAL = FDLayoutConstants.DEFAULT_COOLING_FACTOR_INCREMENTAL = options.initialEnergyOnIncremental;

  CoSEConstants.NODE_DIMENSIONS_INCLUDE_LABELS = FDLayoutConstants.NODE_DIMENSIONS_INCLUDE_LABELS = LayoutConstants.NODE_DIMENSIONS_INCLUDE_LABELS = options.nodeDimensionsIncludeLabels;
  CoSEConstants.DEFAULT_INCREMENTAL = FDLayoutConstants.DEFAULT_INCREMENTAL = LayoutConstants.DEFAULT_INCREMENTAL = !options.randomize;
  CoSEConstants.ANIMATE = FDLayoutConstants.ANIMATE = LayoutConstants.ANIMATE = options.animate;
  CoSEConstants.TILE = options.tile;
  CoSEConstants.TILING_PADDING_VERTICAL = typeof options.tilingPaddingVertical === 'function' ? options.tilingPaddingVertical.call() : options.tilingPaddingVertical;
  CoSEConstants.TILING_PADDING_HORIZONTAL = typeof options.tilingPaddingHorizontal === 'function' ? options.tilingPaddingHorizontal.call() : options.tilingPaddingHorizontal;
};

_CoSELayout.prototype.run = function () {
  var ready;
  var frameId;
  var options = this.options;
  var idToLNode = this.idToLNode = {};
  var layout = this.layout = new CoSELayout();
  var self = this;

  self.stopped = false;

  this.cy = this.options.cy;

  this.cy.trigger({ type: 'layoutstart', layout: this });

  var gm = layout.newGraphManager();
  this.gm = gm;

  var nodes = this.options.eles.nodes();
  var edges = this.options.eles.edges();

  this.root = gm.addRoot();
  this.processChildrenList(this.root, this.getTopMostNodes(nodes), layout);

  for (var i = 0; i < edges.length; i++) {
    var edge = edges[i];
    var sourceNode = this.idToLNode[edge.data("source")];
    var targetNode = this.idToLNode[edge.data("target")];
    if (sourceNode.getEdgesBetween(targetNode).length == 0) {
      var e1 = gm.add(layout.newEdge(), sourceNode, targetNode);
      e1.id = edge.id();
    }
  }

  var getPositions = function getPositions(ele, i) {
    if (typeof ele === "number") {
      ele = i;
    }
    var theId = ele.data('id');
    var lNode = self.idToLNode[theId];

    return {
      x: lNode.getRect().getCenterX(),
      y: lNode.getRect().getCenterY()
    };
  };

  /*
   * Reposition nodes in iterations animatedly
   */
  var iterateAnimated = function iterateAnimated() {
    // Thigs to perform after nodes are repositioned on screen
    var afterReposition = function afterReposition() {
      if (options.fit) {
        options.cy.fit(options.eles.nodes(), options.padding);
      }

      if (!ready) {
        ready = true;
        self.cy.one('layoutready', options.ready);
        self.cy.trigger({ type: 'layoutready', layout: self });
      }
    };

    var ticksPerFrame = self.options.refresh;
    var isDone;

    for (var i = 0; i < ticksPerFrame && !isDone; i++) {
      isDone = self.stopped || self.layout.tick();
    }

    // If layout is done
    if (isDone) {
      // If the layout is not a sublayout and it is successful perform post layout.
      if (layout.checkLayoutSuccess() && !layout.isSubLayout) {
        layout.doPostLayout();
      }

      // If layout has a tilingPostLayout function property call it.
      if (layout.tilingPostLayout) {
        layout.tilingPostLayout();
      }

      layout.isLayoutFinished = true;

      self.options.eles.nodes().positions(getPositions);

      afterReposition();

      // trigger layoutstop when the layout stops (e.g. finishes)
      self.cy.one('layoutstop', self.options.stop);
      self.cy.trigger({ type: 'layoutstop', layout: self });

      if (frameId) {
        cancelAnimationFrame(frameId);
      }

      ready = false;
      return;
    }

    var animationData = self.layout.getPositionsData(); // Get positions of layout nodes note that all nodes may not be layout nodes because of tiling

    // Position nodes, for the nodes whose id does not included in data (because they are removed from their parents and included in dummy compounds)
    // use position of their ancestors or dummy ancestors
    options.eles.nodes().positions(function (ele, i) {
      if (typeof ele === "number") {
        ele = i;
      }
      var theId = ele.id();
      var pNode = animationData[theId];
      var temp = ele;
      // If pNode is undefined search until finding position data of its first ancestor (It may be dummy as well)
      while (pNode == null) {
        pNode = animationData[temp.data('parent')] || animationData['DummyCompound_' + temp.data('parent')];
        animationData[theId] = pNode;
        temp = temp.parent()[0];
        if (temp == undefined) {
          break;
        }
      }
      if (pNode != null) {
        return {
          x: pNode.x,
          y: pNode.y
        };
      } else {
        return {
          x: ele.x,
          y: ele.y
        };
      }
    });

    afterReposition();

    frameId = requestAnimationFrame(iterateAnimated);
  };

  /*
  * Listen 'layoutstarted' event and start animated iteration if animate option is 'during'
  */
  layout.addListener('layoutstarted', function () {
    if (self.options.animate === 'during') {
      frameId = requestAnimationFrame(iterateAnimated);
    }
  });

  layout.runLayout(); // Run cose layout

  /*
   * If animate option is not 'during' ('end' or false) perform these here (If it is 'during' similar things are already performed)
   */
  if (this.options.animate !== "during") {
    self.options.eles.nodes().not(":parent").layoutPositions(self, self.options, getPositions); // Use layout positions to reposition the nodes it considers the options parameter
    ready = false;
  }

  return this; // chaining
};

//Get the top most ones of a list of nodes
_CoSELayout.prototype.getTopMostNodes = function (nodes) {
  var nodesMap = {};
  for (var i = 0; i < nodes.length; i++) {
    nodesMap[nodes[i].id()] = true;
  }
  var roots = nodes.filter(function (ele, i) {
    if (typeof ele === "number") {
      ele = i;
    }
    var parent = ele.parent()[0];
    while (parent != null) {
      if (nodesMap[parent.id()]) {
        return false;
      }
      parent = parent.parent()[0];
    }
    return true;
  });

  return roots;
};

_CoSELayout.prototype.processChildrenList = function (parent, children, layout) {
  var size = children.length;
  for (var i = 0; i < size; i++) {
    var theChild = children[i];
    var children_of_children = theChild.children();
    var theNode;

    var dimensions = theChild.layoutDimensions({
      nodeDimensionsIncludeLabels: this.options.nodeDimensionsIncludeLabels
    });

    if (theChild.outerWidth() != null && theChild.outerHeight() != null) {
      theNode = parent.add(new CoSENode(layout.graphManager, new PointD(theChild.position('x') - dimensions.w / 2, theChild.position('y') - dimensions.h / 2), new DimensionD(parseFloat(dimensions.w), parseFloat(dimensions.h))));
    } else {
      theNode = parent.add(new CoSENode(this.graphManager));
    }
    // Attach id to the layout node
    theNode.id = theChild.data("id");
    // Attach the paddings of cy node to layout node
    theNode.paddingLeft = parseInt(theChild.css('padding'));
    theNode.paddingTop = parseInt(theChild.css('padding'));
    theNode.paddingRight = parseInt(theChild.css('padding'));
    theNode.paddingBottom = parseInt(theChild.css('padding'));

    //Attach the label properties to compound if labels will be included in node dimensions  
    if (this.options.nodeDimensionsIncludeLabels) {
      if (theChild.isParent()) {
        var labelWidth = theChild.boundingBox({ includeLabels: true, includeNodes: false }).w;
        var labelHeight = theChild.boundingBox({ includeLabels: true, includeNodes: false }).h;
        var labelPos = theChild.css("text-halign");
        theNode.labelWidth = labelWidth;
        theNode.labelHeight = labelHeight;
        theNode.labelPos = labelPos;
      }
    }

    // Map the layout node
    this.idToLNode[theChild.data("id")] = theNode;

    if (isNaN(theNode.rect.x)) {
      theNode.rect.x = 0;
    }

    if (isNaN(theNode.rect.y)) {
      theNode.rect.y = 0;
    }

    if (children_of_children != null && children_of_children.length > 0) {
      var theNewGraph;
      theNewGraph = layout.getGraphManager().add(layout.newGraph(), theNode);
      this.processChildrenList(theNewGraph, children_of_children, layout);
    }
  }
};

/**
 * @brief : called on continuous layouts to stop them before they finish
 */
_CoSELayout.prototype.stop = function () {
  this.stopped = true;

  return this; // chaining
};

module.exports = function get(cytoscape) {
  return _CoSELayout;
};

},{"./CoSEConstants":4,"./CoSEEdge":5,"./CoSEGraph":6,"./CoSEGraphManager":7,"./CoSELayout":8,"./CoSENode":9,"./DimensionD":10,"./FDLayout":12,"./FDLayoutConstants":13,"./FDLayoutEdge":14,"./FDLayoutNode":15,"./HashMap":16,"./HashSet":17,"./IGeometry":18,"./IMath":19,"./Integer":20,"./LEdge":21,"./LGraph":22,"./LGraphManager":23,"./LGraphObject":24,"./LNode":25,"./Layout":26,"./LayoutConstants":27,"./Point":28,"./PointD":29,"./RandomSeed":30,"./RectangleD":31,"./Transform":32,"./UniqueIDGeneretor":33}],35:[function(_dereq_,module,exports){
'use strict';

// registers the extension on a cytoscape lib ref

var getLayout = _dereq_('./Layout');

var register = function register(cytoscape) {
  var Layout = getLayout(cytoscape);

  cytoscape('layout', 'cose-bilkent', Layout);
};

// auto reg for globals
if (typeof cytoscape !== 'undefined') {
  register(cytoscape);
}

module.exports = register;

},{"./Layout":34}]},{},[35])(35)
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvbGlua2VkbGlzdC1qcy9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9saW5rZWRsaXN0LWpzL3NyYy9MaXN0LmpzIiwibm9kZV9tb2R1bGVzL2xpbmtlZGxpc3QtanMvc3JjL05vZGUuanMiLCJzcmMvTGF5b3V0L0NvU0VDb25zdGFudHMuanMiLCJzcmMvTGF5b3V0L0NvU0VFZGdlLmpzIiwic3JjL0xheW91dC9Db1NFR3JhcGguanMiLCJzcmMvTGF5b3V0L0NvU0VHcmFwaE1hbmFnZXIuanMiLCJzcmMvTGF5b3V0L0NvU0VMYXlvdXQuanMiLCJzcmMvTGF5b3V0L0NvU0VOb2RlLmpzIiwic3JjL0xheW91dC9EaW1lbnNpb25ELmpzIiwic3JjL0xheW91dC9FbWl0dGVyLmpzIiwic3JjL0xheW91dC9GRExheW91dC5qcyIsInNyYy9MYXlvdXQvRkRMYXlvdXRDb25zdGFudHMuanMiLCJzcmMvTGF5b3V0L0ZETGF5b3V0RWRnZS5qcyIsInNyYy9MYXlvdXQvRkRMYXlvdXROb2RlLmpzIiwic3JjL0xheW91dC9IYXNoTWFwLmpzIiwic3JjL0xheW91dC9IYXNoU2V0LmpzIiwic3JjL0xheW91dC9JR2VvbWV0cnkuanMiLCJzcmMvTGF5b3V0L0lNYXRoLmpzIiwic3JjL0xheW91dC9JbnRlZ2VyLmpzIiwic3JjL0xheW91dC9MRWRnZS5qcyIsInNyYy9MYXlvdXQvTEdyYXBoLmpzIiwic3JjL0xheW91dC9MR3JhcGhNYW5hZ2VyLmpzIiwic3JjL0xheW91dC9MR3JhcGhPYmplY3QuanMiLCJzcmMvTGF5b3V0L0xOb2RlLmpzIiwic3JjL0xheW91dC9MYXlvdXQuanMiLCJzcmMvTGF5b3V0L0xheW91dENvbnN0YW50cy5qcyIsInNyYy9MYXlvdXQvUG9pbnQuanMiLCJzcmMvTGF5b3V0L1BvaW50RC5qcyIsInNyYy9MYXlvdXQvUmFuZG9tU2VlZC5qcyIsInNyYy9MYXlvdXQvUmVjdGFuZ2xlRC5qcyIsInNyYy9MYXlvdXQvVHJhbnNmb3JtLmpzIiwic3JjL0xheW91dC9VbmlxdWVJREdlbmVyZXRvci5qcyIsInNyYy9MYXlvdXQvaW5kZXguanMiLCJpbmRleC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDYkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNB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QUFiLEVBQXdCO0FBQ3ZDLFNBQU8sV0FBUDtBQUNELENBRkQ7OztBQ2xZQTs7QUFFQTs7QUFDQSxJQUFJLFlBQVksUUFBUSxVQUFSLENBQWhCOztBQUVBLElBQUksV0FBVyxTQUFYLFFBQVcsQ0FBVSxTQUFWLEVBQXFCO0FBQ2xDLE1BQUksU0FBUyxVQUFXLFNBQVgsQ0FBYjs7QUFFQSxZQUFVLFFBQVYsRUFBb0IsY0FBcEIsRUFBb0MsTUFBcEM7QUFDRCxDQUpEOztBQU1BO0FBQ0EsSUFBSSxPQUFPLFNBQVAsS0FBcUIsV0FBekIsRUFBc0M7QUFDcEMsV0FBVSxTQUFWO0FBQ0Q7O0FBRUQsT0FBTyxPQUFQLEdBQWlCLFFBQWpCIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsInZhciBucyA9IHtcblx0TGlzdDogcmVxdWlyZSgnLi9zcmMvTGlzdCcpLFxuXHROb2RlOiByZXF1aXJlKCcuL3NyYy9Ob2RlJyksXG59O1xuXG5pZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcpIHtcblx0bW9kdWxlLmV4cG9ydHMgPSBucztcbn0gZWxzZSBpZiAodHlwZW9mIGRlZmluZSAhPT0gJ3VuZGVmaW5lZCcpIHtcblx0ZGVmaW5lKCdMaW5rZWRMaXN0SlMnLCBmdW5jdGlvbiAoKSB7XG5cdFx0cmV0dXJuIG5zO1xuXHR9KTtcbn0gZWxzZSBpZiAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcpIHtcblx0d2luZG93LkxpbmtlZExpc3RKUyA9IG5zO1xufSIsInZhciBOb2RlID0gcmVxdWlyZSgnLi9Ob2RlJyk7XG5cbnZhciBMaXN0ID0gZnVuY3Rpb24gKCkge1xuXHR0aGlzLl9jb3VudCA9IDA7XG5cdHRoaXMuX2hlYWQgPSBudWxsO1xuXHR0aGlzLl90YWlsID0gbnVsbDtcbn07XG5cbkxpc3QucHJvdG90eXBlLmhlYWQgPSBmdW5jdGlvbiAoKSB7XG5cdHJldHVybiB0aGlzLl9oZWFkO1xufTtcblxuTGlzdC5wcm90b3R5cGUudGFpbCA9IGZ1bmN0aW9uICgpIHtcblx0cmV0dXJuIHRoaXMuX3RhaWw7XG59O1xuXG5MaXN0LnByb3RvdHlwZS5jb3VudCA9IGZ1bmN0aW9uICgpIHtcblx0cmV0dXJuIHRoaXMuX2NvdW50O1xufTtcblxuTGlzdC5wcm90b3R5cGUuZ2V0ID0gZnVuY3Rpb24gKGluZGV4KSB7XG5cdHZhciBub2RlID0gdGhpcy5faGVhZDtcblxuXHRmb3IgKHZhciBpID0gMDsgaSA8IGluZGV4OyBpKyspIHtcblx0XHRub2RlID0gbm9kZS5uZXh0KCk7XG5cdH1cblxuXHRyZXR1cm4gbm9kZTtcbn07XG5cbkxpc3QucHJvdG90eXBlLnNldCA9IGZ1bmN0aW9uIChpbmRleCwgdmFsdWUpIHtcblx0dmFyIG5vZGUgPSB0aGlzLmdldChpbmRleCk7XG5cdG5vZGUuc2V0KHZhbHVlKTtcbn07XG5cbkxpc3QucHJvdG90eXBlLnB1c2ggPSBmdW5jdGlvbiAodmFsdWUpIHtcblx0dmFyIG5vZGUgPSBuZXcgTm9kZSh2YWx1ZSwgdGhpcy5fdGFpbCwgbnVsbCk7XG5cblx0aWYgKHRoaXMuX3RhaWwgIT09IG51bGwpIHtcblx0XHR0aGlzLl90YWlsLnNldE5leHQobm9kZSk7XG5cdH1cblxuXHRpZiAodGhpcy5faGVhZCA9PT0gbnVsbCkge1xuXHRcdHRoaXMuX2hlYWQgPSBub2RlO1xuXHR9XG5cblx0dGhpcy5fdGFpbCA9IG5vZGU7XG5cdHRoaXMuX2NvdW50Kys7XG5cblx0cmV0dXJuIG5vZGU7XG59O1xuXG5MaXN0LnByb3RvdHlwZS5wb3AgPSBmdW5jdGlvbiAoKSB7XG5cdHZhciBub2RlID0gdGhpcy5fdGFpbDtcblxuXHR2YXIgbmV3X3RhaWwgPSBudWxsO1xuXHRpZiAodGhpcy5fdGFpbC5wcmV2aW91cygpICE9PSBudWxsKSB7XG5cdFx0bmV3X3RhaWwgPSB0aGlzLl90YWlsLnByZXZpb3VzKCk7XG5cdFx0bmV3X3RhaWwuc2V0TmV4dChudWxsKTtcblx0fVxuXHRcblx0dGhpcy5fdGFpbCA9IG5ld190YWlsO1xuXG5cdHRoaXMuX2NvdW50LS07XG5cblx0aWYgKHRoaXMuX2NvdW50ID09PSAwKSB7XG5cdFx0dGhpcy5faGVhZCA9IG51bGw7XG5cdH1cblxuXHRyZXR1cm4gbm9kZTtcbn07XG5cbkxpc3QucHJvdG90eXBlLnVuc2hpZnQgPSBmdW5jdGlvbiAodmFsdWUpIHtcblx0dmFyIG5vZGUgPSBuZXcgTm9kZSh2YWx1ZSwgbnVsbCwgdGhpcy5faGVhZCk7XG5cblx0aWYgKHRoaXMuX2hlYWQgIT09IG51bGwpIHtcblx0XHR0aGlzLl9oZWFkLnNldFByZXZpb3VzKG5vZGUpO1xuXHR9XG5cblx0aWYgKHRoaXMuX3RhaWwgPT09IG51bGwpIHtcblx0XHR0aGlzLl90YWlsID0gbm9kZTtcblx0fVxuXHRcblx0dGhpcy5faGVhZCA9IG5vZGU7XG5cblx0dGhpcy5fY291bnQrKztcblxuXHRyZXR1cm4gbm9kZTtcbn07XG5cbkxpc3QucHJvdG90eXBlLnNoaWZ0ID0gZnVuY3Rpb24gKCkge1xuXHR2YXIgbm9kZSA9IHRoaXMuX2hlYWQ7XG5cblx0dmFyIG5ld19oZWFkID0gbnVsbDtcblx0aWYgKHRoaXMuX2hlYWQubmV4dCgpICE9PSBudWxsKSB7XG5cdFx0bmV3X2hlYWQgPSB0aGlzLl9oZWFkLm5leHQoKTtcblx0XHRuZXdfaGVhZC5zZXRQcmV2aW91cyhudWxsKTtcblx0fVxuXG5cdHRoaXMuX2hlYWQgPSBuZXdfaGVhZDtcblxuXHR0aGlzLl9jb3VudC0tO1xuXG5cdGlmICh0aGlzLl9jb3VudCA9PT0gMCkge1xuXHRcdHRoaXMuX3RhaWwgPSBudWxsO1xuXHR9XG5cblx0cmV0dXJuIG5vZGU7XG59O1xuXG5MaXN0LnByb3RvdHlwZS5hc0FycmF5ID0gZnVuY3Rpb24gKCkge1xuXHR2YXIgYXJyID0gW107XG5cdHZhciBub2RlID0gdGhpcy5faGVhZDtcblxuXHR3aGlsZSAobm9kZSkge1xuXHRcdGFyci5wdXNoKG5vZGUudmFsdWUoKSk7XG5cdFx0bm9kZSA9IG5vZGUubmV4dCgpO1xuXHR9XG5cblx0cmV0dXJuIGFycjtcbn07XG5cbkxpc3QucHJvdG90eXBlLnRydW5jYXRlVG8gPSBmdW5jdGlvbiAobGVuZ3RoKSB7XG5cdHRoaXMuX2NvdW50ID0gbGVuZ3RoO1xuXG5cdGlmIChsZW5ndGggPT09IDApIHtcblx0XHR0aGlzLl9oZWFkID0gbnVsbDtcblx0XHR0aGlzLl90YWlsID0gbnVsbDtcblxuXHRcdHJldHVybjtcblx0fVxuXG5cdHZhciBub2RlID0gdGhpcy5nZXQobGVuZ3RoLTEpO1xuXHRub2RlLnNldE5leHQobnVsbCk7XG5cdHRoaXMuX3RhaWwgPSBub2RlO1xufTtcblxuTGlzdC5wcm90b3R5cGUuZW1wdHkgPSBmdW5jdGlvbiAoKSB7XG5cdHRoaXMudHJ1bmNhdGVUbygwKTtcbn07XG5cbkxpc3QucHJvdG90eXBlLmlzRW1wdHkgPSBmdW5jdGlvbiAoKSB7XG5cdHJldHVybiB0aGlzLl9oZWFkID09PSBudWxsO1xufTtcblxuTGlzdC5wcm90b3R5cGUuZmluZCA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuXHR2YXIgbm9kZSA9IHRoaXMuX2hlYWQ7XG5cblx0d2hpbGUgKG5vZGUgIT09IG51bGwpIHtcblx0XHRpZiAobm9kZS52YWx1ZSgpID09PSB2YWx1ZSkge1xuXHRcdFx0cmV0dXJuIG5vZGU7XG5cdFx0fVxuXG5cdFx0bm9kZSA9IG5vZGUubmV4dCgpO1xuXHR9XG5cblx0cmV0dXJuIG51bGw7XG59O1xuXG5MaXN0LnByb3RvdHlwZS5lYWNoID0gZnVuY3Rpb24gKGNhbGxiYWNrKSB7XG5cdHZhciBub2RlID0gdGhpcy5faGVhZDtcblx0dmFyIGkgPSAwO1xuXHR3aGlsZSAobm9kZSAhPT0gbnVsbCkge1xuXHRcdGNhbGxiYWNrKGksIG5vZGUpO1xuXHRcdG5vZGUgPSBub2RlLm5leHQoKTtcblx0XHRpKys7XG5cdH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBMaXN0OyIsInZhciBOb2RlID0gZnVuY3Rpb24gKHZhbHVlLCBwcmV2aW91cywgbmV4dCkge1xuXHR0aGlzLl92YWx1ZSA9IHZhbHVlID09PSB1bmRlZmluZWQgPyBudWxsIDogdmFsdWU7XG5cdFxuXHR0aGlzLl9wcmV2aW91cyA9IHByZXZpb3VzID09PSB1bmRlZmluZWQgPyBudWxsIDogcHJldmlvdXM7XG5cdHRoaXMuX25leHQgPSBuZXh0ID09PSB1bmRlZmluZWQgPyBudWxsIDogbmV4dDtcbn07XG5cbk5vZGUucHJvdG90eXBlLnZhbHVlID0gZnVuY3Rpb24gKCkge1xuXHRyZXR1cm4gdGhpcy5fdmFsdWU7XG59O1xuXG5Ob2RlLnByb3RvdHlwZS5wcmV2aW91cyA9IGZ1bmN0aW9uICgpIHtcblx0cmV0dXJuIHRoaXMuX3ByZXZpb3VzO1xufTtcblxuTm9kZS5wcm90b3R5cGUubmV4dCA9IGZ1bmN0aW9uICgpIHtcblx0cmV0dXJuIHRoaXMuX25leHQ7XG59O1xuXG5Ob2RlLnByb3RvdHlwZS5zZXQgPSBmdW5jdGlvbiAodmFsdWUpIHtcblx0dGhpcy5fdmFsdWUgPSB2YWx1ZTtcbn07XG5cbk5vZGUucHJvdG90eXBlLnNldFByZXZpb3VzID0gZnVuY3Rpb24gKG5vZGUpIHtcblx0dGhpcy5fcHJldmlvdXMgPSBub2RlO1xufTtcblxuTm9kZS5wcm90b3R5cGUuc2V0TmV4dCA9IGZ1bmN0aW9uIChub2RlKSB7XG5cdHRoaXMuX25leHQgPSBub2RlO1xufTtcblxuTm9kZS5wcm90b3R5cGUuaXNIZWFkID0gZnVuY3Rpb24gKCkge1xuXHRyZXR1cm4gdGhpcy5fcHJldmlvdXMgPT09IG51bGw7XG59O1xuXG5Ob2RlLnByb3RvdHlwZS5pc1RhaWwgPSBmdW5jdGlvbiAoKSB7XG5cdHJldHVybiB0aGlzLl9uZXh0ID09PSBudWxsO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBOb2RlOyIsInZhciBGRExheW91dENvbnN0YW50cyA9IHJlcXVpcmUoJy4vRkRMYXlvdXRDb25zdGFudHMnKTtcblxuZnVuY3Rpb24gQ29TRUNvbnN0YW50cygpIHtcbn1cblxuLy9Db1NFQ29uc3RhbnRzIGluaGVyaXRzIHN0YXRpYyBwcm9wcyBpbiBGRExheW91dENvbnN0YW50c1xuZm9yICh2YXIgcHJvcCBpbiBGRExheW91dENvbnN0YW50cykge1xuICBDb1NFQ29uc3RhbnRzW3Byb3BdID0gRkRMYXlvdXRDb25zdGFudHNbcHJvcF07XG59XG5cbkNvU0VDb25zdGFudHMuREVGQVVMVF9VU0VfTVVMVElfTEVWRUxfU0NBTElORyA9IGZhbHNlO1xuQ29TRUNvbnN0YW50cy5ERUZBVUxUX1JBRElBTF9TRVBBUkFUSU9OID0gRkRMYXlvdXRDb25zdGFudHMuREVGQVVMVF9FREdFX0xFTkdUSDtcbkNvU0VDb25zdGFudHMuREVGQVVMVF9DT01QT05FTlRfU0VQRVJBVElPTiA9IDYwO1xuQ29TRUNvbnN0YW50cy5USUxFID0gdHJ1ZTtcbkNvU0VDb25zdGFudHMuVElMSU5HX1BBRERJTkdfVkVSVElDQUwgPSAxMDtcbkNvU0VDb25zdGFudHMuVElMSU5HX1BBRERJTkdfSE9SSVpPTlRBTCA9IDEwO1xuXG5tb2R1bGUuZXhwb3J0cyA9IENvU0VDb25zdGFudHM7XG4iLCJ2YXIgRkRMYXlvdXRFZGdlID0gcmVxdWlyZSgnLi9GRExheW91dEVkZ2UnKTtcblxuZnVuY3Rpb24gQ29TRUVkZ2Uoc291cmNlLCB0YXJnZXQsIHZFZGdlKSB7XG4gIEZETGF5b3V0RWRnZS5jYWxsKHRoaXMsIHNvdXJjZSwgdGFyZ2V0LCB2RWRnZSk7XG59XG5cbkNvU0VFZGdlLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoRkRMYXlvdXRFZGdlLnByb3RvdHlwZSk7XG5mb3IgKHZhciBwcm9wIGluIEZETGF5b3V0RWRnZSkge1xuICBDb1NFRWRnZVtwcm9wXSA9IEZETGF5b3V0RWRnZVtwcm9wXTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBDb1NFRWRnZVxuIiwidmFyIExHcmFwaCA9IHJlcXVpcmUoJy4vTEdyYXBoJyk7XG5cbmZ1bmN0aW9uIENvU0VHcmFwaChwYXJlbnQsIGdyYXBoTWdyLCB2R3JhcGgpIHtcbiAgTEdyYXBoLmNhbGwodGhpcywgcGFyZW50LCBncmFwaE1nciwgdkdyYXBoKTtcbn1cblxuQ29TRUdyYXBoLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoTEdyYXBoLnByb3RvdHlwZSk7XG5mb3IgKHZhciBwcm9wIGluIExHcmFwaCkge1xuICBDb1NFR3JhcGhbcHJvcF0gPSBMR3JhcGhbcHJvcF07XG59XG5cbm1vZHVsZS5leHBvcnRzID0gQ29TRUdyYXBoO1xuIiwidmFyIExHcmFwaE1hbmFnZXIgPSByZXF1aXJlKCcuL0xHcmFwaE1hbmFnZXInKTtcblxuZnVuY3Rpb24gQ29TRUdyYXBoTWFuYWdlcihsYXlvdXQpIHtcbiAgTEdyYXBoTWFuYWdlci5jYWxsKHRoaXMsIGxheW91dCk7XG59XG5cbkNvU0VHcmFwaE1hbmFnZXIucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShMR3JhcGhNYW5hZ2VyLnByb3RvdHlwZSk7XG5mb3IgKHZhciBwcm9wIGluIExHcmFwaE1hbmFnZXIpIHtcbiAgQ29TRUdyYXBoTWFuYWdlcltwcm9wXSA9IExHcmFwaE1hbmFnZXJbcHJvcF07XG59XG5cbm1vZHVsZS5leHBvcnRzID0gQ29TRUdyYXBoTWFuYWdlcjtcbiIsInZhciBGRExheW91dCA9IHJlcXVpcmUoJy4vRkRMYXlvdXQnKTtcbnZhciBDb1NFR3JhcGhNYW5hZ2VyID0gcmVxdWlyZSgnLi9Db1NFR3JhcGhNYW5hZ2VyJyk7XG52YXIgQ29TRUdyYXBoID0gcmVxdWlyZSgnLi9Db1NFR3JhcGgnKTtcbnZhciBDb1NFTm9kZSA9IHJlcXVpcmUoJy4vQ29TRU5vZGUnKTtcbnZhciBDb1NFRWRnZSA9IHJlcXVpcmUoJy4vQ29TRUVkZ2UnKTtcbnZhciBDb1NFQ29uc3RhbnRzID0gcmVxdWlyZSgnLi9Db1NFQ29uc3RhbnRzJyk7XG52YXIgRkRMYXlvdXRDb25zdGFudHMgPSByZXF1aXJlKCcuL0ZETGF5b3V0Q29uc3RhbnRzJyk7XG52YXIgTGF5b3V0Q29uc3RhbnRzID0gcmVxdWlyZSgnLi9MYXlvdXRDb25zdGFudHMnKTtcbnZhciBQb2ludCA9IHJlcXVpcmUoJy4vUG9pbnQnKTtcbnZhciBQb2ludEQgPSByZXF1aXJlKCcuL1BvaW50RCcpO1xudmFyIExheW91dCA9IHJlcXVpcmUoJy4vTGF5b3V0Jyk7XG52YXIgSW50ZWdlciA9IHJlcXVpcmUoJy4vSW50ZWdlcicpO1xudmFyIElHZW9tZXRyeSA9IHJlcXVpcmUoJy4vSUdlb21ldHJ5Jyk7XG52YXIgTEdyYXBoID0gcmVxdWlyZSgnLi9MR3JhcGgnKTtcbnZhciBUcmFuc2Zvcm0gPSByZXF1aXJlKCcuL1RyYW5zZm9ybScpO1xuXG5mdW5jdGlvbiBDb1NFTGF5b3V0KCkge1xuICBGRExheW91dC5jYWxsKHRoaXMpO1xuICBcbiAgdGhpcy50b0JlVGlsZWQgPSB7fTsgLy8gTWVtb3JpemUgaWYgYSBub2RlIGlzIHRvIGJlIHRpbGVkIG9yIGlzIHRpbGVkXG59XG5cbkNvU0VMYXlvdXQucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShGRExheW91dC5wcm90b3R5cGUpO1xuXG5mb3IgKHZhciBwcm9wIGluIEZETGF5b3V0KSB7XG4gIENvU0VMYXlvdXRbcHJvcF0gPSBGRExheW91dFtwcm9wXTtcbn1cblxuQ29TRUxheW91dC5wcm90b3R5cGUubmV3R3JhcGhNYW5hZ2VyID0gZnVuY3Rpb24gKCkge1xuICB2YXIgZ20gPSBuZXcgQ29TRUdyYXBoTWFuYWdlcih0aGlzKTtcbiAgdGhpcy5ncmFwaE1hbmFnZXIgPSBnbTtcbiAgcmV0dXJuIGdtO1xufTtcblxuQ29TRUxheW91dC5wcm90b3R5cGUubmV3R3JhcGggPSBmdW5jdGlvbiAodkdyYXBoKSB7XG4gIHJldHVybiBuZXcgQ29TRUdyYXBoKG51bGwsIHRoaXMuZ3JhcGhNYW5hZ2VyLCB2R3JhcGgpO1xufTtcblxuQ29TRUxheW91dC5wcm90b3R5cGUubmV3Tm9kZSA9IGZ1bmN0aW9uICh2Tm9kZSkge1xuICByZXR1cm4gbmV3IENvU0VOb2RlKHRoaXMuZ3JhcGhNYW5hZ2VyLCB2Tm9kZSk7XG59O1xuXG5Db1NFTGF5b3V0LnByb3RvdHlwZS5uZXdFZGdlID0gZnVuY3Rpb24gKHZFZGdlKSB7XG4gIHJldHVybiBuZXcgQ29TRUVkZ2UobnVsbCwgbnVsbCwgdkVkZ2UpO1xufTtcblxuQ29TRUxheW91dC5wcm90b3R5cGUuaW5pdFBhcmFtZXRlcnMgPSBmdW5jdGlvbiAoKSB7XG4gIEZETGF5b3V0LnByb3RvdHlwZS5pbml0UGFyYW1ldGVycy5jYWxsKHRoaXMsIGFyZ3VtZW50cyk7XG4gIGlmICghdGhpcy5pc1N1YkxheW91dCkge1xuICAgIGlmIChDb1NFQ29uc3RhbnRzLkRFRkFVTFRfRURHRV9MRU5HVEggPCAxMClcbiAgICB7XG4gICAgICB0aGlzLmlkZWFsRWRnZUxlbmd0aCA9IDEwO1xuICAgIH1cbiAgICBlbHNlXG4gICAge1xuICAgICAgdGhpcy5pZGVhbEVkZ2VMZW5ndGggPSBDb1NFQ29uc3RhbnRzLkRFRkFVTFRfRURHRV9MRU5HVEg7XG4gICAgfVxuXG4gICAgdGhpcy51c2VTbWFydElkZWFsRWRnZUxlbmd0aENhbGN1bGF0aW9uID1cbiAgICAgICAgICAgIENvU0VDb25zdGFudHMuREVGQVVMVF9VU0VfU01BUlRfSURFQUxfRURHRV9MRU5HVEhfQ0FMQ1VMQVRJT047XG4gICAgdGhpcy5zcHJpbmdDb25zdGFudCA9XG4gICAgICAgICAgICBGRExheW91dENvbnN0YW50cy5ERUZBVUxUX1NQUklOR19TVFJFTkdUSDtcbiAgICB0aGlzLnJlcHVsc2lvbkNvbnN0YW50ID1cbiAgICAgICAgICAgIEZETGF5b3V0Q29uc3RhbnRzLkRFRkFVTFRfUkVQVUxTSU9OX1NUUkVOR1RIO1xuICAgIHRoaXMuZ3Jhdml0eUNvbnN0YW50ID1cbiAgICAgICAgICAgIEZETGF5b3V0Q29uc3RhbnRzLkRFRkFVTFRfR1JBVklUWV9TVFJFTkdUSDtcbiAgICB0aGlzLmNvbXBvdW5kR3Jhdml0eUNvbnN0YW50ID1cbiAgICAgICAgICAgIEZETGF5b3V0Q29uc3RhbnRzLkRFRkFVTFRfQ09NUE9VTkRfR1JBVklUWV9TVFJFTkdUSDtcbiAgICB0aGlzLmdyYXZpdHlSYW5nZUZhY3RvciA9XG4gICAgICAgICAgICBGRExheW91dENvbnN0YW50cy5ERUZBVUxUX0dSQVZJVFlfUkFOR0VfRkFDVE9SO1xuICAgIHRoaXMuY29tcG91bmRHcmF2aXR5UmFuZ2VGYWN0b3IgPVxuICAgICAgICAgICAgRkRMYXlvdXRDb25zdGFudHMuREVGQVVMVF9DT01QT1VORF9HUkFWSVRZX1JBTkdFX0ZBQ1RPUjtcbiAgfVxufTtcblxuQ29TRUxheW91dC5wcm90b3R5cGUubGF5b3V0ID0gZnVuY3Rpb24gKCkge1xuICB2YXIgY3JlYXRlQmVuZHNBc05lZWRlZCA9IExheW91dENvbnN0YW50cy5ERUZBVUxUX0NSRUFURV9CRU5EU19BU19ORUVERUQ7XG4gIGlmIChjcmVhdGVCZW5kc0FzTmVlZGVkKVxuICB7XG4gICAgdGhpcy5jcmVhdGVCZW5kcG9pbnRzKCk7XG4gICAgdGhpcy5ncmFwaE1hbmFnZXIucmVzZXRBbGxFZGdlcygpO1xuICB9XG5cbiAgdGhpcy5sZXZlbCA9IDA7XG4gIHJldHVybiB0aGlzLmNsYXNzaWNMYXlvdXQoKTtcbn07XG5cbkNvU0VMYXlvdXQucHJvdG90eXBlLmNsYXNzaWNMYXlvdXQgPSBmdW5jdGlvbiAoKSB7XG4gIHRoaXMubm9kZXNXaXRoR3Jhdml0eSA9IHRoaXMuY2FsY3VsYXRlTm9kZXNUb0FwcGx5R3Jhdml0YXRpb25UbygpO1xuICB0aGlzLmdyYXBoTWFuYWdlci5zZXRBbGxOb2Rlc1RvQXBwbHlHcmF2aXRhdGlvbih0aGlzLm5vZGVzV2l0aEdyYXZpdHkpO1xuICB0aGlzLmNhbGNOb09mQ2hpbGRyZW5Gb3JBbGxOb2RlcygpO1xuICB0aGlzLmdyYXBoTWFuYWdlci5jYWxjTG93ZXN0Q29tbW9uQW5jZXN0b3JzKCk7XG4gIHRoaXMuZ3JhcGhNYW5hZ2VyLmNhbGNJbmNsdXNpb25UcmVlRGVwdGhzKCk7XG4gIHRoaXMuZ3JhcGhNYW5hZ2VyLmdldFJvb3QoKS5jYWxjRXN0aW1hdGVkU2l6ZSgpO1xuICB0aGlzLmNhbGNJZGVhbEVkZ2VMZW5ndGhzKCk7XG4gIFxuICBpZiAoIXRoaXMuaW5jcmVtZW50YWwpXG4gIHtcbiAgICB2YXIgZm9yZXN0ID0gdGhpcy5nZXRGbGF0Rm9yZXN0KCk7XG5cbiAgICAvLyBUaGUgZ3JhcGggYXNzb2NpYXRlZCB3aXRoIHRoaXMgbGF5b3V0IGlzIGZsYXQgYW5kIGEgZm9yZXN0XG4gICAgaWYgKGZvcmVzdC5sZW5ndGggPiAwKVxuICAgIHtcbiAgICAgIHRoaXMucG9zaXRpb25Ob2Rlc1JhZGlhbGx5KGZvcmVzdCk7XG4gICAgfVxuICAgIC8vIFRoZSBncmFwaCBhc3NvY2lhdGVkIHdpdGggdGhpcyBsYXlvdXQgaXMgbm90IGZsYXQgb3IgYSBmb3Jlc3RcbiAgICBlbHNlXG4gICAge1xuICAgICAgLy8gUmVkdWNlIHRoZSB0cmVlcyB3aGVuIGluY3JlbWVudGFsIG1vZGUgaXMgbm90IGVuYWJsZWQgYW5kIGdyYXBoIGlzIG5vdCBhIGZvcmVzdCBcbiAgICAgIHRoaXMucmVkdWNlVHJlZXMoKTtcbiAgICAgIC8vIFVwZGF0ZSBub2RlcyB0aGF0IGdyYXZpdHkgd2lsbCBiZSBhcHBsaWVkXG4gICAgICB0aGlzLmdyYXBoTWFuYWdlci5yZXNldEFsbE5vZGVzVG9BcHBseUdyYXZpdGF0aW9uKCk7XG4gICAgICB2YXIgYWxsTm9kZXMgPSBuZXcgU2V0KHRoaXMuZ2V0QWxsTm9kZXMoKSk7XG4gICAgICB2YXIgaW50ZXJzZWN0aW9uID0gdGhpcy5ub2Rlc1dpdGhHcmF2aXR5LmZpbHRlcih4ID0+IGFsbE5vZGVzLmhhcyh4KSk7XG4gICAgICB0aGlzLmdyYXBoTWFuYWdlci5zZXRBbGxOb2Rlc1RvQXBwbHlHcmF2aXRhdGlvbihpbnRlcnNlY3Rpb24pO1xuICAgICAgXG4gICAgICB0aGlzLnBvc2l0aW9uTm9kZXNSYW5kb21seSgpO1xuICAgIH1cbiAgfVxuXG4gIHRoaXMuaW5pdFNwcmluZ0VtYmVkZGVyKCk7XG4gIHRoaXMucnVuU3ByaW5nRW1iZWRkZXIoKTtcblxuICByZXR1cm4gdHJ1ZTtcbn07XG5cbkNvU0VMYXlvdXQucHJvdG90eXBlLnRpY2sgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy50b3RhbEl0ZXJhdGlvbnMrKztcbiAgXG4gIGlmICh0aGlzLnRvdGFsSXRlcmF0aW9ucyA9PT0gdGhpcy5tYXhJdGVyYXRpb25zICYmICF0aGlzLmlzVHJlZUdyb3dpbmcgJiYgIXRoaXMuaXNHcm93dGhGaW5pc2hlZCkge1xuICAgIGlmKHRoaXMucHJ1bmVkTm9kZXNBbGwubGVuZ3RoID4gMCl7XG4gICAgICB0aGlzLmlzVHJlZUdyb3dpbmcgPSB0cnVlO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIHJldHVybiB0cnVlOyAgXG4gICAgfVxuICB9XG4gIFxuICBpZiAodGhpcy50b3RhbEl0ZXJhdGlvbnMgJSBGRExheW91dENvbnN0YW50cy5DT05WRVJHRU5DRV9DSEVDS19QRVJJT0QgPT0gMCAgJiYgIXRoaXMuaXNUcmVlR3Jvd2luZyAmJiAhdGhpcy5pc0dyb3d0aEZpbmlzaGVkKVxuICB7XG4gICAgaWYgKHRoaXMuaXNDb252ZXJnZWQoKSlcbiAgICB7XG4gICAgICBpZih0aGlzLnBydW5lZE5vZGVzQWxsLmxlbmd0aCA+IDApe1xuICAgICAgICB0aGlzLmlzVHJlZUdyb3dpbmcgPSB0cnVlO1xuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIHJldHVybiB0cnVlOyAgXG4gICAgICB9IFxuICAgIH1cblxuICAgIHRoaXMuY29vbGluZ0ZhY3RvciA9IHRoaXMuaW5pdGlhbENvb2xpbmdGYWN0b3IgKlxuICAgICAgICAgICAgKCh0aGlzLm1heEl0ZXJhdGlvbnMgLSB0aGlzLnRvdGFsSXRlcmF0aW9ucykgLyB0aGlzLm1heEl0ZXJhdGlvbnMpO1xuICAgIHRoaXMuYW5pbWF0aW9uUGVyaW9kID0gTWF0aC5jZWlsKHRoaXMuaW5pdGlhbEFuaW1hdGlvblBlcmlvZCAqIE1hdGguc3FydCh0aGlzLmNvb2xpbmdGYWN0b3IpKTtcbiAgfVxuICAvLyBPcGVyYXRpb25zIHdoaWxlIHRyZWUgaXMgZ3Jvd2luZyBhZ2FpbiBcbiAgaWYodGhpcy5pc1RyZWVHcm93aW5nKXtcbiAgICBpZih0aGlzLmdyb3dUcmVlSXRlcmF0aW9ucyAlIDEwID09IDApe1xuICAgICAgaWYodGhpcy5wcnVuZWROb2Rlc0FsbC5sZW5ndGggPiAwKSB7XG4gICAgICAgIHRoaXMuZ3JhcGhNYW5hZ2VyLnVwZGF0ZUJvdW5kcygpO1xuICAgICAgICB0aGlzLnVwZGF0ZUdyaWQoKTtcbiAgICAgICAgdGhpcy5ncm93VHJlZSh0aGlzLnBydW5lZE5vZGVzQWxsKTtcbiAgICAgICAgLy8gVXBkYXRlIG5vZGVzIHRoYXQgZ3Jhdml0eSB3aWxsIGJlIGFwcGxpZWRcbiAgICAgICAgdGhpcy5ncmFwaE1hbmFnZXIucmVzZXRBbGxOb2Rlc1RvQXBwbHlHcmF2aXRhdGlvbigpO1xuICAgICAgICB2YXIgYWxsTm9kZXMgPSBuZXcgU2V0KHRoaXMuZ2V0QWxsTm9kZXMoKSk7XG4gICAgICAgIHZhciBpbnRlcnNlY3Rpb24gPSB0aGlzLm5vZGVzV2l0aEdyYXZpdHkuZmlsdGVyKHggPT4gYWxsTm9kZXMuaGFzKHgpKTtcbiAgICAgICAgdGhpcy5ncmFwaE1hbmFnZXIuc2V0QWxsTm9kZXNUb0FwcGx5R3Jhdml0YXRpb24oaW50ZXJzZWN0aW9uKTtcbiAgICAgICAgXG4gICAgICAgIHRoaXMuZ3JhcGhNYW5hZ2VyLnVwZGF0ZUJvdW5kcygpO1xuICAgICAgICB0aGlzLnVwZGF0ZUdyaWQoKTsgXG4gICAgICAgIHRoaXMuY29vbGluZ0ZhY3RvciA9IEZETGF5b3V0Q29uc3RhbnRzLkRFRkFVTFRfQ09PTElOR19GQUNUT1JfSU5DUkVNRU5UQUw7IFxuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIHRoaXMuaXNUcmVlR3Jvd2luZyA9IGZhbHNlOyAgXG4gICAgICAgIHRoaXMuaXNHcm93dGhGaW5pc2hlZCA9IHRydWU7IFxuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLmdyb3dUcmVlSXRlcmF0aW9ucysrO1xuICB9XG4gIC8vIE9wZXJhdGlvbnMgYWZ0ZXIgZ3Jvd3RoIGlzIGZpbmlzaGVkXG4gIGlmKHRoaXMuaXNHcm93dGhGaW5pc2hlZCl7XG4gICAgaWYgKHRoaXMuaXNDb252ZXJnZWQoKSlcbiAgICB7XG4gICAgICByZXR1cm4gdHJ1ZTsgIFxuICAgIH1cbiAgICBpZih0aGlzLmFmdGVyR3Jvd3RoSXRlcmF0aW9ucyAlIDEwID09IDApe1xuICAgICAgdGhpcy5ncmFwaE1hbmFnZXIudXBkYXRlQm91bmRzKCk7XG4gICAgICB0aGlzLnVwZGF0ZUdyaWQoKTsgXG4gICAgfVxuICAgIHRoaXMuY29vbGluZ0ZhY3RvciA9IEZETGF5b3V0Q29uc3RhbnRzLkRFRkFVTFRfQ09PTElOR19GQUNUT1JfSU5DUkVNRU5UQUwgKiAoKDEwMCAtIHRoaXMuYWZ0ZXJHcm93dGhJdGVyYXRpb25zKSAvIDEwMCk7XG4gICAgdGhpcy5hZnRlckdyb3d0aEl0ZXJhdGlvbnMrKztcbiAgfVxuICBcbiAgdGhpcy50b3RhbERpc3BsYWNlbWVudCA9IDA7XG4gIHRoaXMuZ3JhcGhNYW5hZ2VyLnVwZGF0ZUJvdW5kcygpO1xuICB0aGlzLmNhbGNTcHJpbmdGb3JjZXMoKTtcbiAgdGhpcy5jYWxjUmVwdWxzaW9uRm9yY2VzKCk7XG4gIHRoaXMuY2FsY0dyYXZpdGF0aW9uYWxGb3JjZXMoKTtcbiAgdGhpcy5tb3ZlTm9kZXMoKTtcbiAgdGhpcy5hbmltYXRlKCk7XG4gIFxuICByZXR1cm4gZmFsc2U7IC8vIExheW91dCBpcyBub3QgZW5kZWQgeWV0IHJldHVybiBmYWxzZVxufTtcblxuQ29TRUxheW91dC5wcm90b3R5cGUuZ2V0UG9zaXRpb25zRGF0YSA9IGZ1bmN0aW9uKCkge1xuICB2YXIgYWxsTm9kZXMgPSB0aGlzLmdyYXBoTWFuYWdlci5nZXRBbGxOb2RlcygpO1xuICB2YXIgcERhdGEgPSB7fTtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBhbGxOb2Rlcy5sZW5ndGg7IGkrKykge1xuICAgIHZhciByZWN0ID0gYWxsTm9kZXNbaV0ucmVjdDtcbiAgICB2YXIgaWQgPSBhbGxOb2Rlc1tpXS5pZDtcbiAgICBwRGF0YVtpZF0gPSB7XG4gICAgICBpZDogaWQsXG4gICAgICB4OiByZWN0LmdldENlbnRlclgoKSxcbiAgICAgIHk6IHJlY3QuZ2V0Q2VudGVyWSgpLFxuICAgICAgdzogcmVjdC53aWR0aCxcbiAgICAgIGg6IHJlY3QuaGVpZ2h0XG4gICAgfTtcbiAgfVxuICBcbiAgcmV0dXJuIHBEYXRhO1xufTtcblxuQ29TRUxheW91dC5wcm90b3R5cGUucnVuU3ByaW5nRW1iZWRkZXIgPSBmdW5jdGlvbiAoKSB7XG4gIHRoaXMuaW5pdGlhbEFuaW1hdGlvblBlcmlvZCA9IDI1O1xuICB0aGlzLmFuaW1hdGlvblBlcmlvZCA9IHRoaXMuaW5pdGlhbEFuaW1hdGlvblBlcmlvZDtcbiAgdmFyIGxheW91dEVuZGVkID0gZmFsc2U7XG4gIFxuICAvLyBJZiBhbWluYXRlIG9wdGlvbiBpcyAnZHVyaW5nJyBzaWduYWwgdGhhdCBsYXlvdXQgaXMgc3VwcG9zZWQgdG8gc3RhcnQgaXRlcmF0aW5nXG4gIGlmICggRkRMYXlvdXRDb25zdGFudHMuQU5JTUFURSA9PT0gJ2R1cmluZycgKSB7XG4gICAgdGhpcy5lbWl0KCdsYXlvdXRzdGFydGVkJyk7XG4gIH1cbiAgZWxzZSB7XG4gICAgLy8gSWYgYW1pbmF0ZSBvcHRpb24gaXMgJ2R1cmluZycgdGljaygpIGZ1bmN0aW9uIHdpbGwgYmUgY2FsbGVkIG9uIGluZGV4LmpzXG4gICAgd2hpbGUgKCFsYXlvdXRFbmRlZCkge1xuICAgICAgbGF5b3V0RW5kZWQgPSB0aGlzLnRpY2soKTtcbiAgICB9XG5cbiAgICB0aGlzLmdyYXBoTWFuYWdlci51cGRhdGVCb3VuZHMoKTtcbiAgfVxufTtcblxuQ29TRUxheW91dC5wcm90b3R5cGUuY2FsY3VsYXRlTm9kZXNUb0FwcGx5R3Jhdml0YXRpb25UbyA9IGZ1bmN0aW9uICgpIHtcbiAgdmFyIG5vZGVMaXN0ID0gW107XG4gIHZhciBncmFwaDtcblxuICB2YXIgZ3JhcGhzID0gdGhpcy5ncmFwaE1hbmFnZXIuZ2V0R3JhcGhzKCk7XG4gIHZhciBzaXplID0gZ3JhcGhzLmxlbmd0aDtcbiAgdmFyIGk7XG4gIGZvciAoaSA9IDA7IGkgPCBzaXplOyBpKyspXG4gIHtcbiAgICBncmFwaCA9IGdyYXBoc1tpXTtcblxuICAgIGdyYXBoLnVwZGF0ZUNvbm5lY3RlZCgpO1xuXG4gICAgaWYgKCFncmFwaC5pc0Nvbm5lY3RlZClcbiAgICB7XG4gICAgICBub2RlTGlzdCA9IG5vZGVMaXN0LmNvbmNhdChncmFwaC5nZXROb2RlcygpKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gbm9kZUxpc3Q7XG59O1xuXG5Db1NFTGF5b3V0LnByb3RvdHlwZS5jYWxjTm9PZkNoaWxkcmVuRm9yQWxsTm9kZXMgPSBmdW5jdGlvbiAoKVxue1xuICB2YXIgbm9kZTtcbiAgdmFyIGFsbE5vZGVzID0gdGhpcy5ncmFwaE1hbmFnZXIuZ2V0QWxsTm9kZXMoKTtcbiAgXG4gIGZvcih2YXIgaSA9IDA7IGkgPCBhbGxOb2Rlcy5sZW5ndGg7IGkrKylcbiAge1xuICAgICAgbm9kZSA9IGFsbE5vZGVzW2ldO1xuICAgICAgbm9kZS5ub09mQ2hpbGRyZW4gPSBub2RlLmdldE5vT2ZDaGlsZHJlbigpO1xuICB9XG59O1xuXG5Db1NFTGF5b3V0LnByb3RvdHlwZS5jcmVhdGVCZW5kcG9pbnRzID0gZnVuY3Rpb24gKCkge1xuICB2YXIgZWRnZXMgPSBbXTtcbiAgZWRnZXMgPSBlZGdlcy5jb25jYXQodGhpcy5ncmFwaE1hbmFnZXIuZ2V0QWxsRWRnZXMoKSk7XG4gIHZhciB2aXNpdGVkID0gbmV3IEhhc2hTZXQoKTtcbiAgdmFyIGk7XG4gIGZvciAoaSA9IDA7IGkgPCBlZGdlcy5sZW5ndGg7IGkrKylcbiAge1xuICAgIHZhciBlZGdlID0gZWRnZXNbaV07XG5cbiAgICBpZiAoIXZpc2l0ZWQuY29udGFpbnMoZWRnZSkpXG4gICAge1xuICAgICAgdmFyIHNvdXJjZSA9IGVkZ2UuZ2V0U291cmNlKCk7XG4gICAgICB2YXIgdGFyZ2V0ID0gZWRnZS5nZXRUYXJnZXQoKTtcblxuICAgICAgaWYgKHNvdXJjZSA9PSB0YXJnZXQpXG4gICAgICB7XG4gICAgICAgIGVkZ2UuZ2V0QmVuZHBvaW50cygpLnB1c2gobmV3IFBvaW50RCgpKTtcbiAgICAgICAgZWRnZS5nZXRCZW5kcG9pbnRzKCkucHVzaChuZXcgUG9pbnREKCkpO1xuICAgICAgICB0aGlzLmNyZWF0ZUR1bW15Tm9kZXNGb3JCZW5kcG9pbnRzKGVkZ2UpO1xuICAgICAgICB2aXNpdGVkLmFkZChlZGdlKTtcbiAgICAgIH1cbiAgICAgIGVsc2VcbiAgICAgIHtcbiAgICAgICAgdmFyIGVkZ2VMaXN0ID0gW107XG5cbiAgICAgICAgZWRnZUxpc3QgPSBlZGdlTGlzdC5jb25jYXQoc291cmNlLmdldEVkZ2VMaXN0VG9Ob2RlKHRhcmdldCkpO1xuICAgICAgICBlZGdlTGlzdCA9IGVkZ2VMaXN0LmNvbmNhdCh0YXJnZXQuZ2V0RWRnZUxpc3RUb05vZGUoc291cmNlKSk7XG5cbiAgICAgICAgaWYgKCF2aXNpdGVkLmNvbnRhaW5zKGVkZ2VMaXN0WzBdKSlcbiAgICAgICAge1xuICAgICAgICAgIGlmIChlZGdlTGlzdC5sZW5ndGggPiAxKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgIHZhciBrO1xuICAgICAgICAgICAgZm9yIChrID0gMDsgayA8IGVkZ2VMaXN0Lmxlbmd0aDsgaysrKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICB2YXIgbXVsdGlFZGdlID0gZWRnZUxpc3Rba107XG4gICAgICAgICAgICAgIG11bHRpRWRnZS5nZXRCZW5kcG9pbnRzKCkucHVzaChuZXcgUG9pbnREKCkpO1xuICAgICAgICAgICAgICB0aGlzLmNyZWF0ZUR1bW15Tm9kZXNGb3JCZW5kcG9pbnRzKG11bHRpRWRnZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIHZpc2l0ZWQuYWRkQWxsKGxpc3QpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHZpc2l0ZWQuc2l6ZSgpID09IGVkZ2VzLmxlbmd0aClcbiAgICB7XG4gICAgICBicmVhaztcbiAgICB9XG4gIH1cbn07XG5cbkNvU0VMYXlvdXQucHJvdG90eXBlLnBvc2l0aW9uTm9kZXNSYWRpYWxseSA9IGZ1bmN0aW9uIChmb3Jlc3QpIHtcbiAgLy8gV2UgdGlsZSB0aGUgdHJlZXMgdG8gYSBncmlkIHJvdyBieSByb3c7IGZpcnN0IHRyZWUgc3RhcnRzIGF0ICgwLDApXG4gIHZhciBjdXJyZW50U3RhcnRpbmdQb2ludCA9IG5ldyBQb2ludCgwLCAwKTtcbiAgdmFyIG51bWJlck9mQ29sdW1ucyA9IE1hdGguY2VpbChNYXRoLnNxcnQoZm9yZXN0Lmxlbmd0aCkpO1xuICB2YXIgaGVpZ2h0ID0gMDtcbiAgdmFyIGN1cnJlbnRZID0gMDtcbiAgdmFyIGN1cnJlbnRYID0gMDtcbiAgdmFyIHBvaW50ID0gbmV3IFBvaW50RCgwLCAwKTtcblxuICBmb3IgKHZhciBpID0gMDsgaSA8IGZvcmVzdC5sZW5ndGg7IGkrKylcbiAge1xuICAgIGlmIChpICUgbnVtYmVyT2ZDb2x1bW5zID09IDApXG4gICAge1xuICAgICAgLy8gU3RhcnQgb2YgYSBuZXcgcm93LCBtYWtlIHRoZSB4IGNvb3JkaW5hdGUgMCwgaW5jcmVtZW50IHRoZVxuICAgICAgLy8geSBjb29yZGluYXRlIHdpdGggdGhlIG1heCBoZWlnaHQgb2YgdGhlIHByZXZpb3VzIHJvd1xuICAgICAgY3VycmVudFggPSAwO1xuICAgICAgY3VycmVudFkgPSBoZWlnaHQ7XG5cbiAgICAgIGlmIChpICE9IDApXG4gICAgICB7XG4gICAgICAgIGN1cnJlbnRZICs9IENvU0VDb25zdGFudHMuREVGQVVMVF9DT01QT05FTlRfU0VQRVJBVElPTjtcbiAgICAgIH1cblxuICAgICAgaGVpZ2h0ID0gMDtcbiAgICB9XG5cbiAgICB2YXIgdHJlZSA9IGZvcmVzdFtpXTtcblxuICAgIC8vIEZpbmQgdGhlIGNlbnRlciBvZiB0aGUgdHJlZVxuICAgIHZhciBjZW50ZXJOb2RlID0gTGF5b3V0LmZpbmRDZW50ZXJPZlRyZWUodHJlZSk7XG5cbiAgICAvLyBTZXQgdGhlIHN0YXJpbmcgcG9pbnQgb2YgdGhlIG5leHQgdHJlZVxuICAgIGN1cnJlbnRTdGFydGluZ1BvaW50LnggPSBjdXJyZW50WDtcbiAgICBjdXJyZW50U3RhcnRpbmdQb2ludC55ID0gY3VycmVudFk7XG5cbiAgICAvLyBEbyBhIHJhZGlhbCBsYXlvdXQgc3RhcnRpbmcgd2l0aCB0aGUgY2VudGVyXG4gICAgcG9pbnQgPVxuICAgICAgICAgICAgQ29TRUxheW91dC5yYWRpYWxMYXlvdXQodHJlZSwgY2VudGVyTm9kZSwgY3VycmVudFN0YXJ0aW5nUG9pbnQpO1xuXG4gICAgaWYgKHBvaW50LnkgPiBoZWlnaHQpXG4gICAge1xuICAgICAgaGVpZ2h0ID0gTWF0aC5mbG9vcihwb2ludC55KTtcbiAgICB9XG5cbiAgICBjdXJyZW50WCA9IE1hdGguZmxvb3IocG9pbnQueCArIENvU0VDb25zdGFudHMuREVGQVVMVF9DT01QT05FTlRfU0VQRVJBVElPTik7XG4gIH1cblxuICB0aGlzLnRyYW5zZm9ybShcbiAgICAgICAgICBuZXcgUG9pbnREKExheW91dENvbnN0YW50cy5XT1JMRF9DRU5URVJfWCAtIHBvaW50LnggLyAyLFxuICAgICAgICAgICAgICAgICAgTGF5b3V0Q29uc3RhbnRzLldPUkxEX0NFTlRFUl9ZIC0gcG9pbnQueSAvIDIpKTtcbn07XG5cbkNvU0VMYXlvdXQucmFkaWFsTGF5b3V0ID0gZnVuY3Rpb24gKHRyZWUsIGNlbnRlck5vZGUsIHN0YXJ0aW5nUG9pbnQpIHtcbiAgdmFyIHJhZGlhbFNlcCA9IE1hdGgubWF4KHRoaXMubWF4RGlhZ29uYWxJblRyZWUodHJlZSksXG4gICAgICAgICAgQ29TRUNvbnN0YW50cy5ERUZBVUxUX1JBRElBTF9TRVBBUkFUSU9OKTtcbiAgQ29TRUxheW91dC5icmFuY2hSYWRpYWxMYXlvdXQoY2VudGVyTm9kZSwgbnVsbCwgMCwgMzU5LCAwLCByYWRpYWxTZXApO1xuICB2YXIgYm91bmRzID0gTEdyYXBoLmNhbGN1bGF0ZUJvdW5kcyh0cmVlKTtcblxuICB2YXIgdHJhbnNmb3JtID0gbmV3IFRyYW5zZm9ybSgpO1xuICB0cmFuc2Zvcm0uc2V0RGV2aWNlT3JnWChib3VuZHMuZ2V0TWluWCgpKTtcbiAgdHJhbnNmb3JtLnNldERldmljZU9yZ1koYm91bmRzLmdldE1pblkoKSk7XG4gIHRyYW5zZm9ybS5zZXRXb3JsZE9yZ1goc3RhcnRpbmdQb2ludC54KTtcbiAgdHJhbnNmb3JtLnNldFdvcmxkT3JnWShzdGFydGluZ1BvaW50LnkpO1xuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgdHJlZS5sZW5ndGg7IGkrKylcbiAge1xuICAgIHZhciBub2RlID0gdHJlZVtpXTtcbiAgICBub2RlLnRyYW5zZm9ybSh0cmFuc2Zvcm0pO1xuICB9XG5cbiAgdmFyIGJvdHRvbVJpZ2h0ID1cbiAgICAgICAgICBuZXcgUG9pbnREKGJvdW5kcy5nZXRNYXhYKCksIGJvdW5kcy5nZXRNYXhZKCkpO1xuXG4gIHJldHVybiB0cmFuc2Zvcm0uaW52ZXJzZVRyYW5zZm9ybVBvaW50KGJvdHRvbVJpZ2h0KTtcbn07XG5cbkNvU0VMYXlvdXQuYnJhbmNoUmFkaWFsTGF5b3V0ID0gZnVuY3Rpb24gKG5vZGUsIHBhcmVudE9mTm9kZSwgc3RhcnRBbmdsZSwgZW5kQW5nbGUsIGRpc3RhbmNlLCByYWRpYWxTZXBhcmF0aW9uKSB7XG4gIC8vIEZpcnN0LCBwb3NpdGlvbiB0aGlzIG5vZGUgYnkgZmluZGluZyBpdHMgYW5nbGUuXG4gIHZhciBoYWxmSW50ZXJ2YWwgPSAoKGVuZEFuZ2xlIC0gc3RhcnRBbmdsZSkgKyAxKSAvIDI7XG5cbiAgaWYgKGhhbGZJbnRlcnZhbCA8IDApXG4gIHtcbiAgICBoYWxmSW50ZXJ2YWwgKz0gMTgwO1xuICB9XG5cbiAgdmFyIG5vZGVBbmdsZSA9IChoYWxmSW50ZXJ2YWwgKyBzdGFydEFuZ2xlKSAlIDM2MDtcbiAgdmFyIHRldGEgPSAobm9kZUFuZ2xlICogSUdlb21ldHJ5LlRXT19QSSkgLyAzNjA7XG5cbiAgLy8gTWFrZSBwb2xhciB0byBqYXZhIGNvcmRpbmF0ZSBjb252ZXJzaW9uLlxuICB2YXIgY29zX3RldGEgPSBNYXRoLmNvcyh0ZXRhKTtcbiAgdmFyIHhfID0gZGlzdGFuY2UgKiBNYXRoLmNvcyh0ZXRhKTtcbiAgdmFyIHlfID0gZGlzdGFuY2UgKiBNYXRoLnNpbih0ZXRhKTtcblxuICBub2RlLnNldENlbnRlcih4XywgeV8pO1xuXG4gIC8vIFRyYXZlcnNlIGFsbCBuZWlnaGJvcnMgb2YgdGhpcyBub2RlIGFuZCByZWN1cnNpdmVseSBjYWxsIHRoaXNcbiAgLy8gZnVuY3Rpb24uXG4gIHZhciBuZWlnaGJvckVkZ2VzID0gW107XG4gIG5laWdoYm9yRWRnZXMgPSBuZWlnaGJvckVkZ2VzLmNvbmNhdChub2RlLmdldEVkZ2VzKCkpO1xuICB2YXIgY2hpbGRDb3VudCA9IG5laWdoYm9yRWRnZXMubGVuZ3RoO1xuXG4gIGlmIChwYXJlbnRPZk5vZGUgIT0gbnVsbClcbiAge1xuICAgIGNoaWxkQ291bnQtLTtcbiAgfVxuXG4gIHZhciBicmFuY2hDb3VudCA9IDA7XG5cbiAgdmFyIGluY0VkZ2VzQ291bnQgPSBuZWlnaGJvckVkZ2VzLmxlbmd0aDtcbiAgdmFyIHN0YXJ0SW5kZXg7XG5cbiAgdmFyIGVkZ2VzID0gbm9kZS5nZXRFZGdlc0JldHdlZW4ocGFyZW50T2ZOb2RlKTtcblxuICAvLyBJZiB0aGVyZSBhcmUgbXVsdGlwbGUgZWRnZXMsIHBydW5lIHRoZW0gdW50aWwgdGhlcmUgcmVtYWlucyBvbmx5IG9uZVxuICAvLyBlZGdlLlxuICB3aGlsZSAoZWRnZXMubGVuZ3RoID4gMSlcbiAge1xuICAgIC8vbmVpZ2hib3JFZGdlcy5yZW1vdmUoZWRnZXMucmVtb3ZlKDApKTtcbiAgICB2YXIgdGVtcCA9IGVkZ2VzWzBdO1xuICAgIGVkZ2VzLnNwbGljZSgwLCAxKTtcbiAgICB2YXIgaW5kZXggPSBuZWlnaGJvckVkZ2VzLmluZGV4T2YodGVtcCk7XG4gICAgaWYgKGluZGV4ID49IDApIHtcbiAgICAgIG5laWdoYm9yRWRnZXMuc3BsaWNlKGluZGV4LCAxKTtcbiAgICB9XG4gICAgaW5jRWRnZXNDb3VudC0tO1xuICAgIGNoaWxkQ291bnQtLTtcbiAgfVxuXG4gIGlmIChwYXJlbnRPZk5vZGUgIT0gbnVsbClcbiAge1xuICAgIC8vYXNzZXJ0IGVkZ2VzLmxlbmd0aCA9PSAxO1xuICAgIHN0YXJ0SW5kZXggPSAobmVpZ2hib3JFZGdlcy5pbmRleE9mKGVkZ2VzWzBdKSArIDEpICUgaW5jRWRnZXNDb3VudDtcbiAgfVxuICBlbHNlXG4gIHtcbiAgICBzdGFydEluZGV4ID0gMDtcbiAgfVxuXG4gIHZhciBzdGVwQW5nbGUgPSBNYXRoLmFicyhlbmRBbmdsZSAtIHN0YXJ0QW5nbGUpIC8gY2hpbGRDb3VudDtcblxuICBmb3IgKHZhciBpID0gc3RhcnRJbmRleDtcbiAgICAgICAgICBicmFuY2hDb3VudCAhPSBjaGlsZENvdW50O1xuICAgICAgICAgIGkgPSAoKytpKSAlIGluY0VkZ2VzQ291bnQpXG4gIHtcbiAgICB2YXIgY3VycmVudE5laWdoYm9yID1cbiAgICAgICAgICAgIG5laWdoYm9yRWRnZXNbaV0uZ2V0T3RoZXJFbmQobm9kZSk7XG5cbiAgICAvLyBEb24ndCBiYWNrIHRyYXZlcnNlIHRvIHJvb3Qgbm9kZSBpbiBjdXJyZW50IHRyZWUuXG4gICAgaWYgKGN1cnJlbnROZWlnaGJvciA9PSBwYXJlbnRPZk5vZGUpXG4gICAge1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgdmFyIGNoaWxkU3RhcnRBbmdsZSA9XG4gICAgICAgICAgICAoc3RhcnRBbmdsZSArIGJyYW5jaENvdW50ICogc3RlcEFuZ2xlKSAlIDM2MDtcbiAgICB2YXIgY2hpbGRFbmRBbmdsZSA9IChjaGlsZFN0YXJ0QW5nbGUgKyBzdGVwQW5nbGUpICUgMzYwO1xuXG4gICAgQ29TRUxheW91dC5icmFuY2hSYWRpYWxMYXlvdXQoY3VycmVudE5laWdoYm9yLFxuICAgICAgICAgICAgbm9kZSxcbiAgICAgICAgICAgIGNoaWxkU3RhcnRBbmdsZSwgY2hpbGRFbmRBbmdsZSxcbiAgICAgICAgICAgIGRpc3RhbmNlICsgcmFkaWFsU2VwYXJhdGlvbiwgcmFkaWFsU2VwYXJhdGlvbik7XG5cbiAgICBicmFuY2hDb3VudCsrO1xuICB9XG59O1xuXG5Db1NFTGF5b3V0Lm1heERpYWdvbmFsSW5UcmVlID0gZnVuY3Rpb24gKHRyZWUpIHtcbiAgdmFyIG1heERpYWdvbmFsID0gSW50ZWdlci5NSU5fVkFMVUU7XG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCB0cmVlLmxlbmd0aDsgaSsrKVxuICB7XG4gICAgdmFyIG5vZGUgPSB0cmVlW2ldO1xuICAgIHZhciBkaWFnb25hbCA9IG5vZGUuZ2V0RGlhZ29uYWwoKTtcblxuICAgIGlmIChkaWFnb25hbCA+IG1heERpYWdvbmFsKVxuICAgIHtcbiAgICAgIG1heERpYWdvbmFsID0gZGlhZ29uYWw7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIG1heERpYWdvbmFsO1xufTtcblxuQ29TRUxheW91dC5wcm90b3R5cGUuY2FsY1JlcHVsc2lvblJhbmdlID0gZnVuY3Rpb24gKCkge1xuICAvLyBmb3JtdWxhIGlzIDIgeCAobGV2ZWwgKyAxKSB4IGlkZWFsRWRnZUxlbmd0aFxuICByZXR1cm4gKDIgKiAodGhpcy5sZXZlbCArIDEpICogdGhpcy5pZGVhbEVkZ2VMZW5ndGgpO1xufTtcblxuLy8gVGlsaW5nIG1ldGhvZHNcblxuLy8gR3JvdXAgemVybyBkZWdyZWUgbWVtYmVycyB3aG9zZSBwYXJlbnRzIGFyZSBub3QgdG8gYmUgdGlsZWQsIGNyZWF0ZSBkdW1teSBwYXJlbnRzIHdoZXJlIG5lZWRlZCBhbmQgZmlsbCBtZW1iZXJHcm91cHMgYnkgdGhlaXIgZHVtbXAgcGFyZW50IGlkJ3NcbkNvU0VMYXlvdXQucHJvdG90eXBlLmdyb3VwWmVyb0RlZ3JlZU1lbWJlcnMgPSBmdW5jdGlvbiAoKSB7XG4gIHZhciBzZWxmID0gdGhpcztcbiAgLy8gYXJyYXkgb2YgW3BhcmVudF9pZCB4IG9uZURlZ3JlZU5vZGVfaWRdXG4gIHZhciB0ZW1wTWVtYmVyR3JvdXBzID0ge307IC8vIEEgdGVtcG9yYXJ5IG1hcCBvZiBwYXJlbnQgbm9kZSBhbmQgaXRzIHplcm8gZGVncmVlIG1lbWJlcnNcbiAgdGhpcy5tZW1iZXJHcm91cHMgPSB7fTsgLy8gQSBtYXAgb2YgZHVtbXkgcGFyZW50IG5vZGUgYW5kIGl0cyB6ZXJvIGRlZ3JlZSBtZW1iZXJzIHdob3NlIHBhcmVudHMgYXJlIG5vdCB0byBiZSB0aWxlZFxuICB0aGlzLmlkVG9EdW1teU5vZGUgPSB7fTsgLy8gQSBtYXAgb2YgaWQgdG8gZHVtbXkgbm9kZSBcbiAgXG4gIHZhciB6ZXJvRGVncmVlID0gW107IC8vIExpc3Qgb2YgemVybyBkZWdyZWUgbm9kZXMgd2hvc2UgcGFyZW50cyBhcmUgbm90IHRvIGJlIHRpbGVkXG4gIHZhciBhbGxOb2RlcyA9IHRoaXMuZ3JhcGhNYW5hZ2VyLmdldEFsbE5vZGVzKCk7XG5cbiAgLy8gRmlsbCB6ZXJvIGRlZ3JlZSBsaXN0XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgYWxsTm9kZXMubGVuZ3RoOyBpKyspIHtcbiAgICB2YXIgbm9kZSA9IGFsbE5vZGVzW2ldO1xuICAgIHZhciBwYXJlbnQgPSBub2RlLmdldFBhcmVudCgpO1xuICAgIC8vIElmIGEgbm9kZSBoYXMgemVybyBkZWdyZWUgYW5kIGl0cyBwYXJlbnQgaXMgbm90IHRvIGJlIHRpbGVkIGlmIGV4aXN0cyBhZGQgdGhhdCBub2RlIHRvIHplcm9EZWdyZXMgbGlzdFxuICAgIGlmICh0aGlzLmdldE5vZGVEZWdyZWVXaXRoQ2hpbGRyZW4obm9kZSkgPT09IDAgJiYgKCBwYXJlbnQuaWQgPT0gdW5kZWZpbmVkIHx8ICF0aGlzLmdldFRvQmVUaWxlZChwYXJlbnQpICkgKSB7XG4gICAgICB6ZXJvRGVncmVlLnB1c2gobm9kZSk7XG4gICAgfVxuICB9XG5cbiAgLy8gQ3JlYXRlIGEgbWFwIG9mIHBhcmVudCBub2RlIGFuZCBpdHMgemVybyBkZWdyZWUgbWVtYmVyc1xuICBmb3IgKHZhciBpID0gMDsgaSA8IHplcm9EZWdyZWUubGVuZ3RoOyBpKyspXG4gIHtcbiAgICB2YXIgbm9kZSA9IHplcm9EZWdyZWVbaV07IC8vIFplcm8gZGVncmVlIG5vZGUgaXRzZWxmXG4gICAgdmFyIHBfaWQgPSBub2RlLmdldFBhcmVudCgpLmlkOyAvLyBQYXJlbnQgaWRcblxuICAgIGlmICh0eXBlb2YgdGVtcE1lbWJlckdyb3Vwc1twX2lkXSA9PT0gXCJ1bmRlZmluZWRcIilcbiAgICAgIHRlbXBNZW1iZXJHcm91cHNbcF9pZF0gPSBbXTtcblxuICAgIHRlbXBNZW1iZXJHcm91cHNbcF9pZF0gPSB0ZW1wTWVtYmVyR3JvdXBzW3BfaWRdLmNvbmNhdChub2RlKTsgLy8gUHVzaCBub2RlIHRvIHRoZSBsaXN0IGJlbG9uZ3MgdG8gaXRzIHBhcmVudCBpbiB0ZW1wTWVtYmVyR3JvdXBzXG4gIH1cblxuICAvLyBJZiB0aGVyZSBhcmUgYXQgbGVhc3QgdHdvIG5vZGVzIGF0IGEgbGV2ZWwsIGNyZWF0ZSBhIGR1bW15IGNvbXBvdW5kIGZvciB0aGVtXG4gIE9iamVjdC5rZXlzKHRlbXBNZW1iZXJHcm91cHMpLmZvckVhY2goZnVuY3Rpb24ocF9pZCkge1xuICAgIGlmICh0ZW1wTWVtYmVyR3JvdXBzW3BfaWRdLmxlbmd0aCA+IDEpIHtcbiAgICAgIHZhciBkdW1teUNvbXBvdW5kSWQgPSBcIkR1bW15Q29tcG91bmRfXCIgKyBwX2lkOyAvLyBUaGUgaWQgb2YgZHVtbXkgY29tcG91bmQgd2hpY2ggd2lsbCBiZSBjcmVhdGVkIHNvb25cbiAgICAgIHNlbGYubWVtYmVyR3JvdXBzW2R1bW15Q29tcG91bmRJZF0gPSB0ZW1wTWVtYmVyR3JvdXBzW3BfaWRdOyAvLyBBZGQgZHVtbXkgY29tcG91bmQgdG8gbWVtYmVyR3JvdXBzXG5cbiAgICAgIHZhciBwYXJlbnQgPSB0ZW1wTWVtYmVyR3JvdXBzW3BfaWRdWzBdLmdldFBhcmVudCgpOyAvLyBUaGUgcGFyZW50IG9mIHplcm8gZGVncmVlIG5vZGVzIHdpbGwgYmUgdGhlIHBhcmVudCBvZiBuZXcgZHVtbXkgY29tcG91bmRcblxuICAgICAgLy8gQ3JlYXRlIGEgZHVtbXkgY29tcG91bmQgd2l0aCBjYWxjdWxhdGVkIGlkXG4gICAgICB2YXIgZHVtbXlDb21wb3VuZCA9IG5ldyBDb1NFTm9kZShzZWxmLmdyYXBoTWFuYWdlcik7XG4gICAgICBkdW1teUNvbXBvdW5kLmlkID0gZHVtbXlDb21wb3VuZElkO1xuICAgICAgZHVtbXlDb21wb3VuZC5wYWRkaW5nTGVmdCA9IHBhcmVudC5wYWRkaW5nTGVmdCB8fCAwO1xuICAgICAgZHVtbXlDb21wb3VuZC5wYWRkaW5nUmlnaHQgPSBwYXJlbnQucGFkZGluZ1JpZ2h0IHx8IDA7XG4gICAgICBkdW1teUNvbXBvdW5kLnBhZGRpbmdCb3R0b20gPSBwYXJlbnQucGFkZGluZ0JvdHRvbSB8fCAwO1xuICAgICAgZHVtbXlDb21wb3VuZC5wYWRkaW5nVG9wID0gcGFyZW50LnBhZGRpbmdUb3AgfHwgMDtcbiAgICAgIFxuICAgICAgc2VsZi5pZFRvRHVtbXlOb2RlW2R1bW15Q29tcG91bmRJZF0gPSBkdW1teUNvbXBvdW5kO1xuICAgICAgXG4gICAgICB2YXIgZHVtbXlQYXJlbnRHcmFwaCA9IHNlbGYuZ2V0R3JhcGhNYW5hZ2VyKCkuYWRkKHNlbGYubmV3R3JhcGgoKSwgZHVtbXlDb21wb3VuZCk7XG4gICAgICB2YXIgcGFyZW50R3JhcGggPSBwYXJlbnQuZ2V0Q2hpbGQoKTtcblxuICAgICAgLy8gQWRkIGR1bW15IGNvbXBvdW5kIHRvIHBhcmVudCB0aGUgZ3JhcGhcbiAgICAgIHBhcmVudEdyYXBoLmFkZChkdW1teUNvbXBvdW5kKTtcblxuICAgICAgLy8gRm9yIGVhY2ggemVybyBkZWdyZWUgbm9kZSBpbiB0aGlzIGxldmVsIHJlbW92ZSBpdCBmcm9tIGl0cyBwYXJlbnQgZ3JhcGggYW5kIGFkZCBpdCB0byB0aGUgZ3JhcGggb2YgZHVtbXkgcGFyZW50XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRlbXBNZW1iZXJHcm91cHNbcF9pZF0ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIG5vZGUgPSB0ZW1wTWVtYmVyR3JvdXBzW3BfaWRdW2ldO1xuICAgICAgICBcbiAgICAgICAgcGFyZW50R3JhcGgucmVtb3ZlKG5vZGUpO1xuICAgICAgICBkdW1teVBhcmVudEdyYXBoLmFkZChub2RlKTtcbiAgICAgIH1cbiAgICB9XG4gIH0pO1xufTtcblxuQ29TRUxheW91dC5wcm90b3R5cGUuY2xlYXJDb21wb3VuZHMgPSBmdW5jdGlvbiAoKSB7XG4gIHZhciBjaGlsZEdyYXBoTWFwID0ge307XG4gIHZhciBpZFRvTm9kZSA9IHt9O1xuXG4gIC8vIEdldCBjb21wb3VuZCBvcmRlcmluZyBieSBmaW5kaW5nIHRoZSBpbm5lciBvbmUgZmlyc3RcbiAgdGhpcy5wZXJmb3JtREZTT25Db21wb3VuZHMoKTtcblxuICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuY29tcG91bmRPcmRlci5sZW5ndGg7IGkrKykge1xuICAgIFxuICAgIGlkVG9Ob2RlW3RoaXMuY29tcG91bmRPcmRlcltpXS5pZF0gPSB0aGlzLmNvbXBvdW5kT3JkZXJbaV07XG4gICAgY2hpbGRHcmFwaE1hcFt0aGlzLmNvbXBvdW5kT3JkZXJbaV0uaWRdID0gW10uY29uY2F0KHRoaXMuY29tcG91bmRPcmRlcltpXS5nZXRDaGlsZCgpLmdldE5vZGVzKCkpO1xuXG4gICAgLy8gUmVtb3ZlIGNoaWxkcmVuIG9mIGNvbXBvdW5kc1xuICAgIHRoaXMuZ3JhcGhNYW5hZ2VyLnJlbW92ZSh0aGlzLmNvbXBvdW5kT3JkZXJbaV0uZ2V0Q2hpbGQoKSk7XG4gICAgdGhpcy5jb21wb3VuZE9yZGVyW2ldLmNoaWxkID0gbnVsbDtcbiAgfVxuICBcbiAgdGhpcy5ncmFwaE1hbmFnZXIucmVzZXRBbGxOb2RlcygpO1xuICBcbiAgLy8gVGlsZSB0aGUgcmVtb3ZlZCBjaGlsZHJlblxuICB0aGlzLnRpbGVDb21wb3VuZE1lbWJlcnMoY2hpbGRHcmFwaE1hcCwgaWRUb05vZGUpO1xufTtcblxuQ29TRUxheW91dC5wcm90b3R5cGUuY2xlYXJaZXJvRGVncmVlTWVtYmVycyA9IGZ1bmN0aW9uICgpIHtcbiAgdmFyIHNlbGYgPSB0aGlzO1xuICB2YXIgdGlsZWRaZXJvRGVncmVlUGFjayA9IHRoaXMudGlsZWRaZXJvRGVncmVlUGFjayA9IFtdO1xuXG4gIE9iamVjdC5rZXlzKHRoaXMubWVtYmVyR3JvdXBzKS5mb3JFYWNoKGZ1bmN0aW9uKGlkKSB7XG4gICAgdmFyIGNvbXBvdW5kTm9kZSA9IHNlbGYuaWRUb0R1bW15Tm9kZVtpZF07IC8vIEdldCB0aGUgZHVtbXkgY29tcG91bmRcblxuICAgIHRpbGVkWmVyb0RlZ3JlZVBhY2tbaWRdID0gc2VsZi50aWxlTm9kZXMoc2VsZi5tZW1iZXJHcm91cHNbaWRdLCBjb21wb3VuZE5vZGUucGFkZGluZ0xlZnQgKyBjb21wb3VuZE5vZGUucGFkZGluZ1JpZ2h0KTtcblxuICAgIC8vIFNldCB0aGUgd2lkdGggYW5kIGhlaWdodCBvZiB0aGUgZHVtbXkgY29tcG91bmQgYXMgY2FsY3VsYXRlZFxuICAgIGNvbXBvdW5kTm9kZS5yZWN0LndpZHRoID0gdGlsZWRaZXJvRGVncmVlUGFja1tpZF0ud2lkdGg7XG4gICAgY29tcG91bmROb2RlLnJlY3QuaGVpZ2h0ID0gdGlsZWRaZXJvRGVncmVlUGFja1tpZF0uaGVpZ2h0O1xuICB9KTtcbn07XG5cbkNvU0VMYXlvdXQucHJvdG90eXBlLnJlcG9wdWxhdGVDb21wb3VuZHMgPSBmdW5jdGlvbiAoKSB7XG4gIGZvciAodmFyIGkgPSB0aGlzLmNvbXBvdW5kT3JkZXIubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICB2YXIgbENvbXBvdW5kTm9kZSA9IHRoaXMuY29tcG91bmRPcmRlcltpXTtcbiAgICB2YXIgaWQgPSBsQ29tcG91bmROb2RlLmlkO1xuICAgIHZhciBob3Jpem9udGFsTWFyZ2luID0gbENvbXBvdW5kTm9kZS5wYWRkaW5nTGVmdDtcbiAgICB2YXIgdmVydGljYWxNYXJnaW4gPSBsQ29tcG91bmROb2RlLnBhZGRpbmdUb3A7XG5cbiAgICB0aGlzLmFkanVzdExvY2F0aW9ucyh0aGlzLnRpbGVkTWVtYmVyUGFja1tpZF0sIGxDb21wb3VuZE5vZGUucmVjdC54LCBsQ29tcG91bmROb2RlLnJlY3QueSwgaG9yaXpvbnRhbE1hcmdpbiwgdmVydGljYWxNYXJnaW4pO1xuICB9XG59O1xuXG5Db1NFTGF5b3V0LnByb3RvdHlwZS5yZXBvcHVsYXRlWmVyb0RlZ3JlZU1lbWJlcnMgPSBmdW5jdGlvbiAoKSB7XG4gIHZhciBzZWxmID0gdGhpcztcbiAgdmFyIHRpbGVkUGFjayA9IHRoaXMudGlsZWRaZXJvRGVncmVlUGFjaztcbiAgXG4gIE9iamVjdC5rZXlzKHRpbGVkUGFjaykuZm9yRWFjaChmdW5jdGlvbihpZCkge1xuICAgIHZhciBjb21wb3VuZE5vZGUgPSBzZWxmLmlkVG9EdW1teU5vZGVbaWRdOyAvLyBHZXQgdGhlIGR1bW15IGNvbXBvdW5kIGJ5IGl0cyBpZFxuICAgIHZhciBob3Jpem9udGFsTWFyZ2luID0gY29tcG91bmROb2RlLnBhZGRpbmdMZWZ0O1xuICAgIHZhciB2ZXJ0aWNhbE1hcmdpbiA9IGNvbXBvdW5kTm9kZS5wYWRkaW5nVG9wO1xuXG4gICAgLy8gQWRqdXN0IHRoZSBwb3NpdGlvbnMgb2Ygbm9kZXMgd3J0IGl0cyBjb21wb3VuZFxuICAgIHNlbGYuYWRqdXN0TG9jYXRpb25zKHRpbGVkUGFja1tpZF0sIGNvbXBvdW5kTm9kZS5yZWN0LngsIGNvbXBvdW5kTm9kZS5yZWN0LnksIGhvcml6b250YWxNYXJnaW4sIHZlcnRpY2FsTWFyZ2luKTtcbiAgfSk7XG59O1xuXG5Db1NFTGF5b3V0LnByb3RvdHlwZS5nZXRUb0JlVGlsZWQgPSBmdW5jdGlvbiAobm9kZSkge1xuICB2YXIgaWQgPSBub2RlLmlkO1xuICAvL2ZpcnN0bHkgY2hlY2sgdGhlIHByZXZpb3VzIHJlc3VsdHNcbiAgaWYgKHRoaXMudG9CZVRpbGVkW2lkXSAhPSBudWxsKSB7XG4gICAgcmV0dXJuIHRoaXMudG9CZVRpbGVkW2lkXTtcbiAgfVxuXG4gIC8vb25seSBjb21wb3VuZCBub2RlcyBhcmUgdG8gYmUgdGlsZWRcbiAgdmFyIGNoaWxkR3JhcGggPSBub2RlLmdldENoaWxkKCk7XG4gIGlmIChjaGlsZEdyYXBoID09IG51bGwpIHtcbiAgICB0aGlzLnRvQmVUaWxlZFtpZF0gPSBmYWxzZTtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICB2YXIgY2hpbGRyZW4gPSBjaGlsZEdyYXBoLmdldE5vZGVzKCk7IC8vIEdldCB0aGUgY2hpbGRyZW4gbm9kZXNcblxuICAvL2EgY29tcG91bmQgbm9kZSBpcyBub3QgdG8gYmUgdGlsZWQgaWYgYWxsIG9mIGl0cyBjb21wb3VuZCBjaGlsZHJlbiBhcmUgbm90IHRvIGJlIHRpbGVkXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcbiAgICB2YXIgdGhlQ2hpbGQgPSBjaGlsZHJlbltpXTtcblxuICAgIGlmICh0aGlzLmdldE5vZGVEZWdyZWUodGhlQ2hpbGQpID4gMCkge1xuICAgICAgdGhpcy50b0JlVGlsZWRbaWRdID0gZmFsc2U7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgLy9wYXNzIHRoZSBjaGlsZHJlbiBub3QgaGF2aW5nIHRoZSBjb21wb3VuZCBzdHJ1Y3R1cmVcbiAgICBpZiAodGhlQ2hpbGQuZ2V0Q2hpbGQoKSA9PSBudWxsKSB7XG4gICAgICB0aGlzLnRvQmVUaWxlZFt0aGVDaGlsZC5pZF0gPSBmYWxzZTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmICghdGhpcy5nZXRUb0JlVGlsZWQodGhlQ2hpbGQpKSB7XG4gICAgICB0aGlzLnRvQmVUaWxlZFtpZF0gPSBmYWxzZTtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH1cbiAgdGhpcy50b0JlVGlsZWRbaWRdID0gdHJ1ZTtcbiAgcmV0dXJuIHRydWU7XG59O1xuXG4vLyBHZXQgZGVncmVlIG9mIGEgbm9kZSBkZXBlbmRpbmcgb2YgaXRzIGVkZ2VzIGFuZCBpbmRlcGVuZGVudCBvZiBpdHMgY2hpbGRyZW5cbkNvU0VMYXlvdXQucHJvdG90eXBlLmdldE5vZGVEZWdyZWUgPSBmdW5jdGlvbiAobm9kZSkge1xuICB2YXIgaWQgPSBub2RlLmlkO1xuICB2YXIgZWRnZXMgPSBub2RlLmdldEVkZ2VzKCk7XG4gIHZhciBkZWdyZWUgPSAwO1xuICBcbiAgLy8gRm9yIHRoZSBlZGdlcyBjb25uZWN0ZWRcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBlZGdlcy5sZW5ndGg7IGkrKykge1xuICAgIHZhciBlZGdlID0gZWRnZXNbaV07XG4gICAgaWYgKGVkZ2UuZ2V0U291cmNlKCkuaWQgIT09IGVkZ2UuZ2V0VGFyZ2V0KCkuaWQpIHtcbiAgICAgIGRlZ3JlZSA9IGRlZ3JlZSArIDE7XG4gICAgfVxuICB9XG4gIHJldHVybiBkZWdyZWU7XG59O1xuXG4vLyBHZXQgZGVncmVlIG9mIGEgbm9kZSB3aXRoIGl0cyBjaGlsZHJlblxuQ29TRUxheW91dC5wcm90b3R5cGUuZ2V0Tm9kZURlZ3JlZVdpdGhDaGlsZHJlbiA9IGZ1bmN0aW9uIChub2RlKSB7XG4gIHZhciBkZWdyZWUgPSB0aGlzLmdldE5vZGVEZWdyZWUobm9kZSk7XG4gIGlmIChub2RlLmdldENoaWxkKCkgPT0gbnVsbCkge1xuICAgIHJldHVybiBkZWdyZWU7XG4gIH1cbiAgdmFyIGNoaWxkcmVuID0gbm9kZS5nZXRDaGlsZCgpLmdldE5vZGVzKCk7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcbiAgICB2YXIgY2hpbGQgPSBjaGlsZHJlbltpXTtcbiAgICBkZWdyZWUgKz0gdGhpcy5nZXROb2RlRGVncmVlV2l0aENoaWxkcmVuKGNoaWxkKTtcbiAgfVxuICByZXR1cm4gZGVncmVlO1xufTtcblxuQ29TRUxheW91dC5wcm90b3R5cGUucGVyZm9ybURGU09uQ29tcG91bmRzID0gZnVuY3Rpb24gKCkge1xuICB0aGlzLmNvbXBvdW5kT3JkZXIgPSBbXTtcbiAgdGhpcy5maWxsQ29tcGV4T3JkZXJCeURGUyh0aGlzLmdyYXBoTWFuYWdlci5nZXRSb290KCkuZ2V0Tm9kZXMoKSk7XG59O1xuXG5Db1NFTGF5b3V0LnByb3RvdHlwZS5maWxsQ29tcGV4T3JkZXJCeURGUyA9IGZ1bmN0aW9uIChjaGlsZHJlbikge1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG4gICAgdmFyIGNoaWxkID0gY2hpbGRyZW5baV07XG4gICAgaWYgKGNoaWxkLmdldENoaWxkKCkgIT0gbnVsbCkge1xuICAgICAgdGhpcy5maWxsQ29tcGV4T3JkZXJCeURGUyhjaGlsZC5nZXRDaGlsZCgpLmdldE5vZGVzKCkpO1xuICAgIH1cbiAgICBpZiAodGhpcy5nZXRUb0JlVGlsZWQoY2hpbGQpKSB7XG4gICAgICB0aGlzLmNvbXBvdW5kT3JkZXIucHVzaChjaGlsZCk7XG4gICAgfVxuICB9XG59O1xuXG4vKipcbiogVGhpcyBtZXRob2QgcGxhY2VzIGVhY2ggemVybyBkZWdyZWUgbWVtYmVyIHdydCBnaXZlbiAoeCx5KSBjb29yZGluYXRlcyAodG9wIGxlZnQpLlxuKi9cbkNvU0VMYXlvdXQucHJvdG90eXBlLmFkanVzdExvY2F0aW9ucyA9IGZ1bmN0aW9uIChvcmdhbml6YXRpb24sIHgsIHksIGNvbXBvdW5kSG9yaXpvbnRhbE1hcmdpbiwgY29tcG91bmRWZXJ0aWNhbE1hcmdpbikge1xuICB4ICs9IGNvbXBvdW5kSG9yaXpvbnRhbE1hcmdpbjtcbiAgeSArPSBjb21wb3VuZFZlcnRpY2FsTWFyZ2luO1xuXG4gIHZhciBsZWZ0ID0geDtcblxuICBmb3IgKHZhciBpID0gMDsgaSA8IG9yZ2FuaXphdGlvbi5yb3dzLmxlbmd0aDsgaSsrKSB7XG4gICAgdmFyIHJvdyA9IG9yZ2FuaXphdGlvbi5yb3dzW2ldO1xuICAgIHggPSBsZWZ0O1xuICAgIHZhciBtYXhIZWlnaHQgPSAwO1xuXG4gICAgZm9yICh2YXIgaiA9IDA7IGogPCByb3cubGVuZ3RoOyBqKyspIHtcbiAgICAgIHZhciBsbm9kZSA9IHJvd1tqXTtcblxuICAgICAgbG5vZGUucmVjdC54ID0geDsvLyArIGxub2RlLnJlY3Qud2lkdGggLyAyO1xuICAgICAgbG5vZGUucmVjdC55ID0geTsvLyArIGxub2RlLnJlY3QuaGVpZ2h0IC8gMjtcblxuICAgICAgeCArPSBsbm9kZS5yZWN0LndpZHRoICsgb3JnYW5pemF0aW9uLmhvcml6b250YWxQYWRkaW5nO1xuXG4gICAgICBpZiAobG5vZGUucmVjdC5oZWlnaHQgPiBtYXhIZWlnaHQpXG4gICAgICAgIG1heEhlaWdodCA9IGxub2RlLnJlY3QuaGVpZ2h0O1xuICAgIH1cblxuICAgIHkgKz0gbWF4SGVpZ2h0ICsgb3JnYW5pemF0aW9uLnZlcnRpY2FsUGFkZGluZztcbiAgfVxufTtcblxuQ29TRUxheW91dC5wcm90b3R5cGUudGlsZUNvbXBvdW5kTWVtYmVycyA9IGZ1bmN0aW9uIChjaGlsZEdyYXBoTWFwLCBpZFRvTm9kZSkge1xuICB2YXIgc2VsZiA9IHRoaXM7XG4gIHRoaXMudGlsZWRNZW1iZXJQYWNrID0gW107XG5cbiAgT2JqZWN0LmtleXMoY2hpbGRHcmFwaE1hcCkuZm9yRWFjaChmdW5jdGlvbihpZCkge1xuICAgIC8vIEdldCB0aGUgY29tcG91bmQgbm9kZVxuICAgIHZhciBjb21wb3VuZE5vZGUgPSBpZFRvTm9kZVtpZF07XG5cbiAgICBzZWxmLnRpbGVkTWVtYmVyUGFja1tpZF0gPSBzZWxmLnRpbGVOb2RlcyhjaGlsZEdyYXBoTWFwW2lkXSwgY29tcG91bmROb2RlLnBhZGRpbmdMZWZ0ICsgY29tcG91bmROb2RlLnBhZGRpbmdSaWdodCk7XG5cbiAgICBjb21wb3VuZE5vZGUucmVjdC53aWR0aCA9IHNlbGYudGlsZWRNZW1iZXJQYWNrW2lkXS53aWR0aCArIDIwO1xuICAgIGNvbXBvdW5kTm9kZS5yZWN0LmhlaWdodCA9IHNlbGYudGlsZWRNZW1iZXJQYWNrW2lkXS5oZWlnaHQgKyAyMDtcbiAgfSk7XG59O1xuXG5Db1NFTGF5b3V0LnByb3RvdHlwZS50aWxlTm9kZXMgPSBmdW5jdGlvbiAobm9kZXMsIG1pbldpZHRoKSB7XG4gIHZhciB2ZXJ0aWNhbFBhZGRpbmcgPSBDb1NFQ29uc3RhbnRzLlRJTElOR19QQURESU5HX1ZFUlRJQ0FMO1xuICB2YXIgaG9yaXpvbnRhbFBhZGRpbmcgPSBDb1NFQ29uc3RhbnRzLlRJTElOR19QQURESU5HX0hPUklaT05UQUw7XG4gIHZhciBvcmdhbml6YXRpb24gPSB7XG4gICAgcm93czogW10sXG4gICAgcm93V2lkdGg6IFtdLFxuICAgIHJvd0hlaWdodDogW10sXG4gICAgd2lkdGg6IDIwLFxuICAgIGhlaWdodDogMjAsXG4gICAgdmVydGljYWxQYWRkaW5nOiB2ZXJ0aWNhbFBhZGRpbmcsXG4gICAgaG9yaXpvbnRhbFBhZGRpbmc6IGhvcml6b250YWxQYWRkaW5nXG4gIH07XG5cbiAgLy8gU29ydCB0aGUgbm9kZXMgaW4gYXNjZW5kaW5nIG9yZGVyIG9mIHRoZWlyIGFyZWFzXG4gIG5vZGVzLnNvcnQoZnVuY3Rpb24gKG4xLCBuMikge1xuICAgIGlmIChuMS5yZWN0LndpZHRoICogbjEucmVjdC5oZWlnaHQgPiBuMi5yZWN0LndpZHRoICogbjIucmVjdC5oZWlnaHQpXG4gICAgICByZXR1cm4gLTE7XG4gICAgaWYgKG4xLnJlY3Qud2lkdGggKiBuMS5yZWN0LmhlaWdodCA8IG4yLnJlY3Qud2lkdGggKiBuMi5yZWN0LmhlaWdodClcbiAgICAgIHJldHVybiAxO1xuICAgIHJldHVybiAwO1xuICB9KTtcblxuICAvLyBDcmVhdGUgdGhlIG9yZ2FuaXphdGlvbiAtPiB0aWxlIG1lbWJlcnNcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBub2Rlcy5sZW5ndGg7IGkrKykge1xuICAgIHZhciBsTm9kZSA9IG5vZGVzW2ldO1xuICAgIFxuICAgIGlmIChvcmdhbml6YXRpb24ucm93cy5sZW5ndGggPT0gMCkge1xuICAgICAgdGhpcy5pbnNlcnROb2RlVG9Sb3cob3JnYW5pemF0aW9uLCBsTm9kZSwgMCwgbWluV2lkdGgpO1xuICAgIH1cbiAgICBlbHNlIGlmICh0aGlzLmNhbkFkZEhvcml6b250YWwob3JnYW5pemF0aW9uLCBsTm9kZS5yZWN0LndpZHRoLCBsTm9kZS5yZWN0LmhlaWdodCkpIHtcbiAgICAgIHRoaXMuaW5zZXJ0Tm9kZVRvUm93KG9yZ2FuaXphdGlvbiwgbE5vZGUsIHRoaXMuZ2V0U2hvcnRlc3RSb3dJbmRleChvcmdhbml6YXRpb24pLCBtaW5XaWR0aCk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgdGhpcy5pbnNlcnROb2RlVG9Sb3cob3JnYW5pemF0aW9uLCBsTm9kZSwgb3JnYW5pemF0aW9uLnJvd3MubGVuZ3RoLCBtaW5XaWR0aCk7XG4gICAgfVxuXG4gICAgdGhpcy5zaGlmdFRvTGFzdFJvdyhvcmdhbml6YXRpb24pO1xuICB9XG5cbiAgcmV0dXJuIG9yZ2FuaXphdGlvbjtcbn07XG5cbkNvU0VMYXlvdXQucHJvdG90eXBlLmluc2VydE5vZGVUb1JvdyA9IGZ1bmN0aW9uIChvcmdhbml6YXRpb24sIG5vZGUsIHJvd0luZGV4LCBtaW5XaWR0aCkge1xuICB2YXIgbWluQ29tcG91bmRTaXplID0gbWluV2lkdGg7XG5cbiAgLy8gQWRkIG5ldyByb3cgaWYgbmVlZGVkXG4gIGlmIChyb3dJbmRleCA9PSBvcmdhbml6YXRpb24ucm93cy5sZW5ndGgpIHtcbiAgICB2YXIgc2Vjb25kRGltZW5zaW9uID0gW107XG5cbiAgICBvcmdhbml6YXRpb24ucm93cy5wdXNoKHNlY29uZERpbWVuc2lvbik7XG4gICAgb3JnYW5pemF0aW9uLnJvd1dpZHRoLnB1c2gobWluQ29tcG91bmRTaXplKTtcbiAgICBvcmdhbml6YXRpb24ucm93SGVpZ2h0LnB1c2goMCk7XG4gIH1cblxuICAvLyBVcGRhdGUgcm93IHdpZHRoXG4gIHZhciB3ID0gb3JnYW5pemF0aW9uLnJvd1dpZHRoW3Jvd0luZGV4XSArIG5vZGUucmVjdC53aWR0aDtcblxuICBpZiAob3JnYW5pemF0aW9uLnJvd3Nbcm93SW5kZXhdLmxlbmd0aCA+IDApIHtcbiAgICB3ICs9IG9yZ2FuaXphdGlvbi5ob3Jpem9udGFsUGFkZGluZztcbiAgfVxuXG4gIG9yZ2FuaXphdGlvbi5yb3dXaWR0aFtyb3dJbmRleF0gPSB3O1xuICAvLyBVcGRhdGUgY29tcG91bmQgd2lkdGhcbiAgaWYgKG9yZ2FuaXphdGlvbi53aWR0aCA8IHcpIHtcbiAgICBvcmdhbml6YXRpb24ud2lkdGggPSB3O1xuICB9XG5cbiAgLy8gVXBkYXRlIGhlaWdodFxuICB2YXIgaCA9IG5vZGUucmVjdC5oZWlnaHQ7XG4gIGlmIChyb3dJbmRleCA+IDApXG4gICAgaCArPSBvcmdhbml6YXRpb24udmVydGljYWxQYWRkaW5nO1xuXG4gIHZhciBleHRyYUhlaWdodCA9IDA7XG4gIGlmIChoID4gb3JnYW5pemF0aW9uLnJvd0hlaWdodFtyb3dJbmRleF0pIHtcbiAgICBleHRyYUhlaWdodCA9IG9yZ2FuaXphdGlvbi5yb3dIZWlnaHRbcm93SW5kZXhdO1xuICAgIG9yZ2FuaXphdGlvbi5yb3dIZWlnaHRbcm93SW5kZXhdID0gaDtcbiAgICBleHRyYUhlaWdodCA9IG9yZ2FuaXphdGlvbi5yb3dIZWlnaHRbcm93SW5kZXhdIC0gZXh0cmFIZWlnaHQ7XG4gIH1cblxuICBvcmdhbml6YXRpb24uaGVpZ2h0ICs9IGV4dHJhSGVpZ2h0O1xuXG4gIC8vIEluc2VydCBub2RlXG4gIG9yZ2FuaXphdGlvbi5yb3dzW3Jvd0luZGV4XS5wdXNoKG5vZGUpO1xufTtcblxuLy9TY2FucyB0aGUgcm93cyBvZiBhbiBvcmdhbml6YXRpb24gYW5kIHJldHVybnMgdGhlIG9uZSB3aXRoIHRoZSBtaW4gd2lkdGhcbkNvU0VMYXlvdXQucHJvdG90eXBlLmdldFNob3J0ZXN0Um93SW5kZXggPSBmdW5jdGlvbiAob3JnYW5pemF0aW9uKSB7XG4gIHZhciByID0gLTE7XG4gIHZhciBtaW4gPSBOdW1iZXIuTUFYX1ZBTFVFO1xuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgb3JnYW5pemF0aW9uLnJvd3MubGVuZ3RoOyBpKyspIHtcbiAgICBpZiAob3JnYW5pemF0aW9uLnJvd1dpZHRoW2ldIDwgbWluKSB7XG4gICAgICByID0gaTtcbiAgICAgIG1pbiA9IG9yZ2FuaXphdGlvbi5yb3dXaWR0aFtpXTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHI7XG59O1xuXG4vL1NjYW5zIHRoZSByb3dzIG9mIGFuIG9yZ2FuaXphdGlvbiBhbmQgcmV0dXJucyB0aGUgb25lIHdpdGggdGhlIG1heCB3aWR0aFxuQ29TRUxheW91dC5wcm90b3R5cGUuZ2V0TG9uZ2VzdFJvd0luZGV4ID0gZnVuY3Rpb24gKG9yZ2FuaXphdGlvbikge1xuICB2YXIgciA9IC0xO1xuICB2YXIgbWF4ID0gTnVtYmVyLk1JTl9WQUxVRTtcblxuICBmb3IgKHZhciBpID0gMDsgaSA8IG9yZ2FuaXphdGlvbi5yb3dzLmxlbmd0aDsgaSsrKSB7XG5cbiAgICBpZiAob3JnYW5pemF0aW9uLnJvd1dpZHRoW2ldID4gbWF4KSB7XG4gICAgICByID0gaTtcbiAgICAgIG1heCA9IG9yZ2FuaXphdGlvbi5yb3dXaWR0aFtpXTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gcjtcbn07XG5cbi8qKlxuKiBUaGlzIG1ldGhvZCBjaGVja3Mgd2hldGhlciBhZGRpbmcgZXh0cmEgd2lkdGggdG8gdGhlIG9yZ2FuaXphdGlvbiB2aW9sYXRlc1xuKiB0aGUgYXNwZWN0IHJhdGlvKDEpIG9yIG5vdC5cbiovXG5Db1NFTGF5b3V0LnByb3RvdHlwZS5jYW5BZGRIb3Jpem9udGFsID0gZnVuY3Rpb24gKG9yZ2FuaXphdGlvbiwgZXh0cmFXaWR0aCwgZXh0cmFIZWlnaHQpIHtcblxuICB2YXIgc3JpID0gdGhpcy5nZXRTaG9ydGVzdFJvd0luZGV4KG9yZ2FuaXphdGlvbik7XG5cbiAgaWYgKHNyaSA8IDApIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIHZhciBtaW4gPSBvcmdhbml6YXRpb24ucm93V2lkdGhbc3JpXTtcblxuICBpZiAobWluICsgb3JnYW5pemF0aW9uLmhvcml6b250YWxQYWRkaW5nICsgZXh0cmFXaWR0aCA8PSBvcmdhbml6YXRpb24ud2lkdGgpXG4gICAgcmV0dXJuIHRydWU7XG5cbiAgdmFyIGhEaWZmID0gMDtcblxuICAvLyBBZGRpbmcgdG8gYW4gZXhpc3Rpbmcgcm93XG4gIGlmIChvcmdhbml6YXRpb24ucm93SGVpZ2h0W3NyaV0gPCBleHRyYUhlaWdodCkge1xuICAgIGlmIChzcmkgPiAwKVxuICAgICAgaERpZmYgPSBleHRyYUhlaWdodCArIG9yZ2FuaXphdGlvbi52ZXJ0aWNhbFBhZGRpbmcgLSBvcmdhbml6YXRpb24ucm93SGVpZ2h0W3NyaV07XG4gIH1cblxuICB2YXIgYWRkX3RvX3Jvd19yYXRpbztcbiAgaWYgKG9yZ2FuaXphdGlvbi53aWR0aCAtIG1pbiA+PSBleHRyYVdpZHRoICsgb3JnYW5pemF0aW9uLmhvcml6b250YWxQYWRkaW5nKSB7XG4gICAgYWRkX3RvX3Jvd19yYXRpbyA9IChvcmdhbml6YXRpb24uaGVpZ2h0ICsgaERpZmYpIC8gKG1pbiArIGV4dHJhV2lkdGggKyBvcmdhbml6YXRpb24uaG9yaXpvbnRhbFBhZGRpbmcpO1xuICB9IGVsc2Uge1xuICAgIGFkZF90b19yb3dfcmF0aW8gPSAob3JnYW5pemF0aW9uLmhlaWdodCArIGhEaWZmKSAvIG9yZ2FuaXphdGlvbi53aWR0aDtcbiAgfVxuXG4gIC8vIEFkZGluZyBhIG5ldyByb3cgZm9yIHRoaXMgbm9kZVxuICBoRGlmZiA9IGV4dHJhSGVpZ2h0ICsgb3JnYW5pemF0aW9uLnZlcnRpY2FsUGFkZGluZztcbiAgdmFyIGFkZF9uZXdfcm93X3JhdGlvO1xuICBpZiAob3JnYW5pemF0aW9uLndpZHRoIDwgZXh0cmFXaWR0aCkge1xuICAgIGFkZF9uZXdfcm93X3JhdGlvID0gKG9yZ2FuaXphdGlvbi5oZWlnaHQgKyBoRGlmZikgLyBleHRyYVdpZHRoO1xuICB9IGVsc2Uge1xuICAgIGFkZF9uZXdfcm93X3JhdGlvID0gKG9yZ2FuaXphdGlvbi5oZWlnaHQgKyBoRGlmZikgLyBvcmdhbml6YXRpb24ud2lkdGg7XG4gIH1cblxuICBpZiAoYWRkX25ld19yb3dfcmF0aW8gPCAxKVxuICAgIGFkZF9uZXdfcm93X3JhdGlvID0gMSAvIGFkZF9uZXdfcm93X3JhdGlvO1xuXG4gIGlmIChhZGRfdG9fcm93X3JhdGlvIDwgMSlcbiAgICBhZGRfdG9fcm93X3JhdGlvID0gMSAvIGFkZF90b19yb3dfcmF0aW87XG5cbiAgcmV0dXJuIGFkZF90b19yb3dfcmF0aW8gPCBhZGRfbmV3X3Jvd19yYXRpbztcbn07XG5cbi8vSWYgbW92aW5nIHRoZSBsYXN0IG5vZGUgZnJvbSB0aGUgbG9uZ2VzdCByb3cgYW5kIGFkZGluZyBpdCB0byB0aGUgbGFzdFxuLy9yb3cgbWFrZXMgdGhlIGJvdW5kaW5nIGJveCBzbWFsbGVyLCBkbyBpdC5cbkNvU0VMYXlvdXQucHJvdG90eXBlLnNoaWZ0VG9MYXN0Um93ID0gZnVuY3Rpb24gKG9yZ2FuaXphdGlvbikge1xuICB2YXIgbG9uZ2VzdCA9IHRoaXMuZ2V0TG9uZ2VzdFJvd0luZGV4KG9yZ2FuaXphdGlvbik7XG4gIHZhciBsYXN0ID0gb3JnYW5pemF0aW9uLnJvd1dpZHRoLmxlbmd0aCAtIDE7XG4gIHZhciByb3cgPSBvcmdhbml6YXRpb24ucm93c1tsb25nZXN0XTtcbiAgdmFyIG5vZGUgPSByb3dbcm93Lmxlbmd0aCAtIDFdO1xuXG4gIHZhciBkaWZmID0gbm9kZS53aWR0aCArIG9yZ2FuaXphdGlvbi5ob3Jpem9udGFsUGFkZGluZztcblxuICAvLyBDaGVjayBpZiB0aGVyZSBpcyBlbm91Z2ggc3BhY2Ugb24gdGhlIGxhc3Qgcm93XG4gIGlmIChvcmdhbml6YXRpb24ud2lkdGggLSBvcmdhbml6YXRpb24ucm93V2lkdGhbbGFzdF0gPiBkaWZmICYmIGxvbmdlc3QgIT0gbGFzdCkge1xuICAgIC8vIFJlbW92ZSB0aGUgbGFzdCBlbGVtZW50IG9mIHRoZSBsb25nZXN0IHJvd1xuICAgIHJvdy5zcGxpY2UoLTEsIDEpO1xuXG4gICAgLy8gUHVzaCBpdCB0byB0aGUgbGFzdCByb3dcbiAgICBvcmdhbml6YXRpb24ucm93c1tsYXN0XS5wdXNoKG5vZGUpO1xuXG4gICAgb3JnYW5pemF0aW9uLnJvd1dpZHRoW2xvbmdlc3RdID0gb3JnYW5pemF0aW9uLnJvd1dpZHRoW2xvbmdlc3RdIC0gZGlmZjtcbiAgICBvcmdhbml6YXRpb24ucm93V2lkdGhbbGFzdF0gPSBvcmdhbml6YXRpb24ucm93V2lkdGhbbGFzdF0gKyBkaWZmO1xuICAgIG9yZ2FuaXphdGlvbi53aWR0aCA9IG9yZ2FuaXphdGlvbi5yb3dXaWR0aFtpbnN0YW5jZS5nZXRMb25nZXN0Um93SW5kZXgob3JnYW5pemF0aW9uKV07XG5cbiAgICAvLyBVcGRhdGUgaGVpZ2h0cyBvZiB0aGUgb3JnYW5pemF0aW9uXG4gICAgdmFyIG1heEhlaWdodCA9IE51bWJlci5NSU5fVkFMVUU7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCByb3cubGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmIChyb3dbaV0uaGVpZ2h0ID4gbWF4SGVpZ2h0KVxuICAgICAgICBtYXhIZWlnaHQgPSByb3dbaV0uaGVpZ2h0O1xuICAgIH1cbiAgICBpZiAobG9uZ2VzdCA+IDApXG4gICAgICBtYXhIZWlnaHQgKz0gb3JnYW5pemF0aW9uLnZlcnRpY2FsUGFkZGluZztcblxuICAgIHZhciBwcmV2VG90YWwgPSBvcmdhbml6YXRpb24ucm93SGVpZ2h0W2xvbmdlc3RdICsgb3JnYW5pemF0aW9uLnJvd0hlaWdodFtsYXN0XTtcblxuICAgIG9yZ2FuaXphdGlvbi5yb3dIZWlnaHRbbG9uZ2VzdF0gPSBtYXhIZWlnaHQ7XG4gICAgaWYgKG9yZ2FuaXphdGlvbi5yb3dIZWlnaHRbbGFzdF0gPCBub2RlLmhlaWdodCArIG9yZ2FuaXphdGlvbi52ZXJ0aWNhbFBhZGRpbmcpXG4gICAgICBvcmdhbml6YXRpb24ucm93SGVpZ2h0W2xhc3RdID0gbm9kZS5oZWlnaHQgKyBvcmdhbml6YXRpb24udmVydGljYWxQYWRkaW5nO1xuXG4gICAgdmFyIGZpbmFsVG90YWwgPSBvcmdhbml6YXRpb24ucm93SGVpZ2h0W2xvbmdlc3RdICsgb3JnYW5pemF0aW9uLnJvd0hlaWdodFtsYXN0XTtcbiAgICBvcmdhbml6YXRpb24uaGVpZ2h0ICs9IChmaW5hbFRvdGFsIC0gcHJldlRvdGFsKTtcblxuICAgIHRoaXMuc2hpZnRUb0xhc3RSb3cob3JnYW5pemF0aW9uKTtcbiAgfVxufTtcblxuQ29TRUxheW91dC5wcm90b3R5cGUudGlsaW5nUHJlTGF5b3V0ID0gZnVuY3Rpb24oKSB7XG4gIGlmIChDb1NFQ29uc3RhbnRzLlRJTEUpIHtcbiAgICAvLyBGaW5kIHplcm8gZGVncmVlIG5vZGVzIGFuZCBjcmVhdGUgYSBjb21wb3VuZCBmb3IgZWFjaCBsZXZlbFxuICAgIHRoaXMuZ3JvdXBaZXJvRGVncmVlTWVtYmVycygpO1xuICAgIC8vIFRpbGUgYW5kIGNsZWFyIGNoaWxkcmVuIG9mIGVhY2ggY29tcG91bmRcbiAgICB0aGlzLmNsZWFyQ29tcG91bmRzKCk7XG4gICAgLy8gU2VwYXJhdGVseSB0aWxlIGFuZCBjbGVhciB6ZXJvIGRlZ3JlZSBub2RlcyBmb3IgZWFjaCBsZXZlbFxuICAgIHRoaXMuY2xlYXJaZXJvRGVncmVlTWVtYmVycygpO1xuICB9XG59O1xuXG5Db1NFTGF5b3V0LnByb3RvdHlwZS50aWxpbmdQb3N0TGF5b3V0ID0gZnVuY3Rpb24oKSB7XG4gIGlmIChDb1NFQ29uc3RhbnRzLlRJTEUpIHtcbiAgICB0aGlzLnJlcG9wdWxhdGVaZXJvRGVncmVlTWVtYmVycygpO1xuICAgIHRoaXMucmVwb3B1bGF0ZUNvbXBvdW5kcygpO1xuICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IENvU0VMYXlvdXQ7XG4iLCJ2YXIgRkRMYXlvdXROb2RlID0gcmVxdWlyZSgnLi9GRExheW91dE5vZGUnKTtcbnZhciBJTWF0aCA9IHJlcXVpcmUoJy4vSU1hdGgnKTtcblxuZnVuY3Rpb24gQ29TRU5vZGUoZ20sIGxvYywgc2l6ZSwgdk5vZGUpIHtcbiAgRkRMYXlvdXROb2RlLmNhbGwodGhpcywgZ20sIGxvYywgc2l6ZSwgdk5vZGUpO1xufVxuXG5cbkNvU0VOb2RlLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoRkRMYXlvdXROb2RlLnByb3RvdHlwZSk7XG5mb3IgKHZhciBwcm9wIGluIEZETGF5b3V0Tm9kZSkge1xuICBDb1NFTm9kZVtwcm9wXSA9IEZETGF5b3V0Tm9kZVtwcm9wXTtcbn1cblxuQ29TRU5vZGUucHJvdG90eXBlLm1vdmUgPSBmdW5jdGlvbiAoKVxue1xuICB2YXIgbGF5b3V0ID0gdGhpcy5ncmFwaE1hbmFnZXIuZ2V0TGF5b3V0KCk7XG4gIHRoaXMuZGlzcGxhY2VtZW50WCA9IGxheW91dC5jb29saW5nRmFjdG9yICpcbiAgICAgICAgICAodGhpcy5zcHJpbmdGb3JjZVggKyB0aGlzLnJlcHVsc2lvbkZvcmNlWCArIHRoaXMuZ3Jhdml0YXRpb25Gb3JjZVgpIC8gdGhpcy5ub09mQ2hpbGRyZW47XG4gIHRoaXMuZGlzcGxhY2VtZW50WSA9IGxheW91dC5jb29saW5nRmFjdG9yICpcbiAgICAgICAgICAodGhpcy5zcHJpbmdGb3JjZVkgKyB0aGlzLnJlcHVsc2lvbkZvcmNlWSArIHRoaXMuZ3Jhdml0YXRpb25Gb3JjZVkpIC8gdGhpcy5ub09mQ2hpbGRyZW47XG5cblxuICBpZiAoTWF0aC5hYnModGhpcy5kaXNwbGFjZW1lbnRYKSA+IGxheW91dC5jb29saW5nRmFjdG9yICogbGF5b3V0Lm1heE5vZGVEaXNwbGFjZW1lbnQpXG4gIHtcbiAgICB0aGlzLmRpc3BsYWNlbWVudFggPSBsYXlvdXQuY29vbGluZ0ZhY3RvciAqIGxheW91dC5tYXhOb2RlRGlzcGxhY2VtZW50ICpcbiAgICAgICAgICAgIElNYXRoLnNpZ24odGhpcy5kaXNwbGFjZW1lbnRYKTtcbiAgfVxuXG4gIGlmIChNYXRoLmFicyh0aGlzLmRpc3BsYWNlbWVudFkpID4gbGF5b3V0LmNvb2xpbmdGYWN0b3IgKiBsYXlvdXQubWF4Tm9kZURpc3BsYWNlbWVudClcbiAge1xuICAgIHRoaXMuZGlzcGxhY2VtZW50WSA9IGxheW91dC5jb29saW5nRmFjdG9yICogbGF5b3V0Lm1heE5vZGVEaXNwbGFjZW1lbnQgKlxuICAgICAgICAgICAgSU1hdGguc2lnbih0aGlzLmRpc3BsYWNlbWVudFkpO1xuICB9XG5cbiAgLy8gYSBzaW1wbGUgbm9kZSwganVzdCBtb3ZlIGl0XG4gIGlmICh0aGlzLmNoaWxkID09IG51bGwpXG4gIHtcbiAgICB0aGlzLm1vdmVCeSh0aGlzLmRpc3BsYWNlbWVudFgsIHRoaXMuZGlzcGxhY2VtZW50WSk7XG4gIH1cbiAgLy8gYW4gZW1wdHkgY29tcG91bmQgbm9kZSwgYWdhaW4ganVzdCBtb3ZlIGl0XG4gIGVsc2UgaWYgKHRoaXMuY2hpbGQuZ2V0Tm9kZXMoKS5sZW5ndGggPT0gMClcbiAge1xuICAgIHRoaXMubW92ZUJ5KHRoaXMuZGlzcGxhY2VtZW50WCwgdGhpcy5kaXNwbGFjZW1lbnRZKTtcbiAgfVxuICAvLyBub24tZW1wdHkgY29tcG91bmQgbm9kZSwgcHJvcG9nYXRlIG1vdmVtZW50IHRvIGNoaWxkcmVuIGFzIHdlbGxcbiAgZWxzZVxuICB7XG4gICAgdGhpcy5wcm9wb2dhdGVEaXNwbGFjZW1lbnRUb0NoaWxkcmVuKHRoaXMuZGlzcGxhY2VtZW50WCxcbiAgICAgICAgICAgIHRoaXMuZGlzcGxhY2VtZW50WSk7XG4gIH1cblxuICBsYXlvdXQudG90YWxEaXNwbGFjZW1lbnQgKz1cbiAgICAgICAgICBNYXRoLmFicyh0aGlzLmRpc3BsYWNlbWVudFgpICsgTWF0aC5hYnModGhpcy5kaXNwbGFjZW1lbnRZKTtcblxuICB0aGlzLnNwcmluZ0ZvcmNlWCA9IDA7XG4gIHRoaXMuc3ByaW5nRm9yY2VZID0gMDtcbiAgdGhpcy5yZXB1bHNpb25Gb3JjZVggPSAwO1xuICB0aGlzLnJlcHVsc2lvbkZvcmNlWSA9IDA7XG4gIHRoaXMuZ3Jhdml0YXRpb25Gb3JjZVggPSAwO1xuICB0aGlzLmdyYXZpdGF0aW9uRm9yY2VZID0gMDtcbiAgdGhpcy5kaXNwbGFjZW1lbnRYID0gMDtcbiAgdGhpcy5kaXNwbGFjZW1lbnRZID0gMDtcbn07XG5cbkNvU0VOb2RlLnByb3RvdHlwZS5wcm9wb2dhdGVEaXNwbGFjZW1lbnRUb0NoaWxkcmVuID0gZnVuY3Rpb24gKGRYLCBkWSlcbntcbiAgdmFyIG5vZGVzID0gdGhpcy5nZXRDaGlsZCgpLmdldE5vZGVzKCk7XG4gIHZhciBub2RlO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IG5vZGVzLmxlbmd0aDsgaSsrKVxuICB7XG4gICAgbm9kZSA9IG5vZGVzW2ldO1xuICAgIGlmIChub2RlLmdldENoaWxkKCkgPT0gbnVsbClcbiAgICB7XG4gICAgICBub2RlLm1vdmVCeShkWCwgZFkpO1xuICAgICAgbm9kZS5kaXNwbGFjZW1lbnRYICs9IGRYO1xuICAgICAgbm9kZS5kaXNwbGFjZW1lbnRZICs9IGRZO1xuICAgIH1cbiAgICBlbHNlXG4gICAge1xuICAgICAgbm9kZS5wcm9wb2dhdGVEaXNwbGFjZW1lbnRUb0NoaWxkcmVuKGRYLCBkWSk7XG4gICAgfVxuICB9XG59O1xuXG5Db1NFTm9kZS5wcm90b3R5cGUuc2V0UHJlZDEgPSBmdW5jdGlvbiAocHJlZDEpXG57XG4gIHRoaXMucHJlZDEgPSBwcmVkMTtcbn07XG5cbkNvU0VOb2RlLnByb3RvdHlwZS5nZXRQcmVkMSA9IGZ1bmN0aW9uICgpXG57XG4gIHJldHVybiBwcmVkMTtcbn07XG5cbkNvU0VOb2RlLnByb3RvdHlwZS5nZXRQcmVkMiA9IGZ1bmN0aW9uICgpXG57XG4gIHJldHVybiBwcmVkMjtcbn07XG5cbkNvU0VOb2RlLnByb3RvdHlwZS5zZXROZXh0ID0gZnVuY3Rpb24gKG5leHQpXG57XG4gIHRoaXMubmV4dCA9IG5leHQ7XG59O1xuXG5Db1NFTm9kZS5wcm90b3R5cGUuZ2V0TmV4dCA9IGZ1bmN0aW9uICgpXG57XG4gIHJldHVybiBuZXh0O1xufTtcblxuQ29TRU5vZGUucHJvdG90eXBlLnNldFByb2Nlc3NlZCA9IGZ1bmN0aW9uIChwcm9jZXNzZWQpXG57XG4gIHRoaXMucHJvY2Vzc2VkID0gcHJvY2Vzc2VkO1xufTtcblxuQ29TRU5vZGUucHJvdG90eXBlLmlzUHJvY2Vzc2VkID0gZnVuY3Rpb24gKClcbntcbiAgcmV0dXJuIHByb2Nlc3NlZDtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gQ29TRU5vZGU7XG4iLCJmdW5jdGlvbiBEaW1lbnNpb25EKHdpZHRoLCBoZWlnaHQpIHtcbiAgdGhpcy53aWR0aCA9IDA7XG4gIHRoaXMuaGVpZ2h0ID0gMDtcbiAgaWYgKHdpZHRoICE9PSBudWxsICYmIGhlaWdodCAhPT0gbnVsbCkge1xuICAgIHRoaXMuaGVpZ2h0ID0gaGVpZ2h0O1xuICAgIHRoaXMud2lkdGggPSB3aWR0aDtcbiAgfVxufVxuXG5EaW1lbnNpb25ELnByb3RvdHlwZS5nZXRXaWR0aCA9IGZ1bmN0aW9uICgpXG57XG4gIHJldHVybiB0aGlzLndpZHRoO1xufTtcblxuRGltZW5zaW9uRC5wcm90b3R5cGUuc2V0V2lkdGggPSBmdW5jdGlvbiAod2lkdGgpXG57XG4gIHRoaXMud2lkdGggPSB3aWR0aDtcbn07XG5cbkRpbWVuc2lvbkQucHJvdG90eXBlLmdldEhlaWdodCA9IGZ1bmN0aW9uICgpXG57XG4gIHJldHVybiB0aGlzLmhlaWdodDtcbn07XG5cbkRpbWVuc2lvbkQucHJvdG90eXBlLnNldEhlaWdodCA9IGZ1bmN0aW9uIChoZWlnaHQpXG57XG4gIHRoaXMuaGVpZ2h0ID0gaGVpZ2h0O1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBEaW1lbnNpb25EO1xuIiwiZnVuY3Rpb24gRW1pdHRlcigpe1xuICB0aGlzLmxpc3RlbmVycyA9IFtdO1xufVxuXG52YXIgcCA9IEVtaXR0ZXIucHJvdG90eXBlO1xuXG5wLmFkZExpc3RlbmVyID0gZnVuY3Rpb24oIGV2ZW50LCBjYWxsYmFjayApe1xuICB0aGlzLmxpc3RlbmVycy5wdXNoKHtcbiAgICBldmVudDogZXZlbnQsXG4gICAgY2FsbGJhY2s6IGNhbGxiYWNrXG4gIH0pO1xufTtcblxucC5yZW1vdmVMaXN0ZW5lciA9IGZ1bmN0aW9uKCBldmVudCwgY2FsbGJhY2sgKXtcbiAgZm9yKCB2YXIgaSA9IHRoaXMubGlzdGVuZXJzLmxlbmd0aDsgaSA+PSAwOyBpLS0gKXtcbiAgICB2YXIgbCA9IHRoaXMubGlzdGVuZXJzW2ldO1xuXG4gICAgaWYoIGwuZXZlbnQgPT09IGV2ZW50ICYmIGwuY2FsbGJhY2sgPT09IGNhbGxiYWNrICl7XG4gICAgICB0aGlzLmxpc3RlbmVycy5zcGxpY2UoIGksIDEgKTtcbiAgICB9XG4gIH1cbn07XG5cbnAuZW1pdCA9IGZ1bmN0aW9uKCBldmVudCwgZGF0YSApe1xuICBmb3IoIHZhciBpID0gMDsgaSA8IHRoaXMubGlzdGVuZXJzLmxlbmd0aDsgaSsrICl7XG4gICAgdmFyIGwgPSB0aGlzLmxpc3RlbmVyc1tpXTtcblxuICAgIGlmKCBldmVudCA9PT0gbC5ldmVudCApe1xuICAgICAgbC5jYWxsYmFjayggZGF0YSApO1xuICAgIH1cbiAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBFbWl0dGVyO1xuIiwidmFyIExheW91dCA9IHJlcXVpcmUoJy4vTGF5b3V0Jyk7XG52YXIgRkRMYXlvdXRDb25zdGFudHMgPSByZXF1aXJlKCcuL0ZETGF5b3V0Q29uc3RhbnRzJyk7XG52YXIgTGF5b3V0Q29uc3RhbnRzID0gcmVxdWlyZSgnLi9MYXlvdXRDb25zdGFudHMnKTtcbnZhciBJR2VvbWV0cnkgPSByZXF1aXJlKCcuL0lHZW9tZXRyeScpO1xudmFyIElNYXRoID0gcmVxdWlyZSgnLi9JTWF0aCcpO1xudmFyIEludGVnZXIgPSByZXF1aXJlKCcuL0ludGVnZXInKTtcblxuZnVuY3Rpb24gRkRMYXlvdXQoKSB7XG4gIExheW91dC5jYWxsKHRoaXMpO1xuXG4gIHRoaXMudXNlU21hcnRJZGVhbEVkZ2VMZW5ndGhDYWxjdWxhdGlvbiA9IEZETGF5b3V0Q29uc3RhbnRzLkRFRkFVTFRfVVNFX1NNQVJUX0lERUFMX0VER0VfTEVOR1RIX0NBTENVTEFUSU9OO1xuICB0aGlzLmlkZWFsRWRnZUxlbmd0aCA9IEZETGF5b3V0Q29uc3RhbnRzLkRFRkFVTFRfRURHRV9MRU5HVEg7XG4gIHRoaXMuc3ByaW5nQ29uc3RhbnQgPSBGRExheW91dENvbnN0YW50cy5ERUZBVUxUX1NQUklOR19TVFJFTkdUSDtcbiAgdGhpcy5yZXB1bHNpb25Db25zdGFudCA9IEZETGF5b3V0Q29uc3RhbnRzLkRFRkFVTFRfUkVQVUxTSU9OX1NUUkVOR1RIO1xuICB0aGlzLmdyYXZpdHlDb25zdGFudCA9IEZETGF5b3V0Q29uc3RhbnRzLkRFRkFVTFRfR1JBVklUWV9TVFJFTkdUSDtcbiAgdGhpcy5jb21wb3VuZEdyYXZpdHlDb25zdGFudCA9IEZETGF5b3V0Q29uc3RhbnRzLkRFRkFVTFRfQ09NUE9VTkRfR1JBVklUWV9TVFJFTkdUSDtcbiAgdGhpcy5ncmF2aXR5UmFuZ2VGYWN0b3IgPSBGRExheW91dENvbnN0YW50cy5ERUZBVUxUX0dSQVZJVFlfUkFOR0VfRkFDVE9SO1xuICB0aGlzLmNvbXBvdW5kR3Jhdml0eVJhbmdlRmFjdG9yID0gRkRMYXlvdXRDb25zdGFudHMuREVGQVVMVF9DT01QT1VORF9HUkFWSVRZX1JBTkdFX0ZBQ1RPUjtcbiAgdGhpcy5kaXNwbGFjZW1lbnRUaHJlc2hvbGRQZXJOb2RlID0gKDMuMCAqIEZETGF5b3V0Q29uc3RhbnRzLkRFRkFVTFRfRURHRV9MRU5HVEgpIC8gMTAwO1xuICB0aGlzLmNvb2xpbmdGYWN0b3IgPSBGRExheW91dENvbnN0YW50cy5ERUZBVUxUX0NPT0xJTkdfRkFDVE9SX0lOQ1JFTUVOVEFMO1xuICB0aGlzLmluaXRpYWxDb29saW5nRmFjdG9yID0gRkRMYXlvdXRDb25zdGFudHMuREVGQVVMVF9DT09MSU5HX0ZBQ1RPUl9JTkNSRU1FTlRBTDtcbiAgdGhpcy50b3RhbERpc3BsYWNlbWVudCA9IDAuMDtcbiAgdGhpcy5vbGRUb3RhbERpc3BsYWNlbWVudCA9IDAuMDtcbiAgdGhpcy5tYXhJdGVyYXRpb25zID0gRkRMYXlvdXRDb25zdGFudHMuTUFYX0lURVJBVElPTlM7XG59XG5cbkZETGF5b3V0LnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoTGF5b3V0LnByb3RvdHlwZSk7XG5cbmZvciAodmFyIHByb3AgaW4gTGF5b3V0KSB7XG4gIEZETGF5b3V0W3Byb3BdID0gTGF5b3V0W3Byb3BdO1xufVxuXG5GRExheW91dC5wcm90b3R5cGUuaW5pdFBhcmFtZXRlcnMgPSBmdW5jdGlvbiAoKSB7XG4gIExheW91dC5wcm90b3R5cGUuaW5pdFBhcmFtZXRlcnMuY2FsbCh0aGlzLCBhcmd1bWVudHMpO1xuXG4gIGlmICh0aGlzLmxheW91dFF1YWxpdHkgPT0gTGF5b3V0Q29uc3RhbnRzLkRSQUZUX1FVQUxJVFkpXG4gIHtcbiAgICB0aGlzLmRpc3BsYWNlbWVudFRocmVzaG9sZFBlck5vZGUgKz0gMC4zMDtcbiAgICB0aGlzLm1heEl0ZXJhdGlvbnMgKj0gMC44O1xuICB9XG4gIGVsc2UgaWYgKHRoaXMubGF5b3V0UXVhbGl0eSA9PSBMYXlvdXRDb25zdGFudHMuUFJPT0ZfUVVBTElUWSlcbiAge1xuICAgIHRoaXMuZGlzcGxhY2VtZW50VGhyZXNob2xkUGVyTm9kZSAtPSAwLjMwO1xuICAgIHRoaXMubWF4SXRlcmF0aW9ucyAqPSAxLjI7XG4gIH1cblxuICB0aGlzLnRvdGFsSXRlcmF0aW9ucyA9IDA7XG4gIHRoaXMubm90QW5pbWF0ZWRJdGVyYXRpb25zID0gMDtcblxuICB0aGlzLnVzZUZSR3JpZFZhcmlhbnQgPSBGRExheW91dENvbnN0YW50cy5ERUZBVUxUX1VTRV9TTUFSVF9SRVBVTFNJT05fUkFOR0VfQ0FMQ1VMQVRJT047XG4gIFxuICB0aGlzLmdyaWQgPSBbXTtcbiAgLy8gdmFyaWFibGVzIGZvciB0cmVlIHJlZHVjdGlvbiBzdXBwb3J0XG4gIHRoaXMucHJ1bmVkTm9kZXNBbGwgPSBbXTtcbiAgdGhpcy5ncm93VHJlZUl0ZXJhdGlvbnMgPSAwO1xuICB0aGlzLmFmdGVyR3Jvd3RoSXRlcmF0aW9ucyA9IDA7XG4gIHRoaXMuaXNUcmVlR3Jvd2luZyA9IGZhbHNlO1xuICB0aGlzLmlzR3Jvd3RoRmluaXNoZWQgPSBmYWxzZTtcbn07XG5cbkZETGF5b3V0LnByb3RvdHlwZS5jYWxjSWRlYWxFZGdlTGVuZ3RocyA9IGZ1bmN0aW9uICgpIHtcbiAgdmFyIGVkZ2U7XG4gIHZhciBsY2FEZXB0aDtcbiAgdmFyIHNvdXJjZTtcbiAgdmFyIHRhcmdldDtcbiAgdmFyIHNpemVPZlNvdXJjZUluTGNhO1xuICB2YXIgc2l6ZU9mVGFyZ2V0SW5MY2E7XG5cbiAgdmFyIGFsbEVkZ2VzID0gdGhpcy5nZXRHcmFwaE1hbmFnZXIoKS5nZXRBbGxFZGdlcygpO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGFsbEVkZ2VzLmxlbmd0aDsgaSsrKVxuICB7XG4gICAgZWRnZSA9IGFsbEVkZ2VzW2ldO1xuXG4gICAgZWRnZS5pZGVhbExlbmd0aCA9IHRoaXMuaWRlYWxFZGdlTGVuZ3RoO1xuXG4gICAgaWYgKGVkZ2UuaXNJbnRlckdyYXBoKVxuICAgIHtcbiAgICAgIHNvdXJjZSA9IGVkZ2UuZ2V0U291cmNlKCk7XG4gICAgICB0YXJnZXQgPSBlZGdlLmdldFRhcmdldCgpO1xuXG4gICAgICBzaXplT2ZTb3VyY2VJbkxjYSA9IGVkZ2UuZ2V0U291cmNlSW5MY2EoKS5nZXRFc3RpbWF0ZWRTaXplKCk7XG4gICAgICBzaXplT2ZUYXJnZXRJbkxjYSA9IGVkZ2UuZ2V0VGFyZ2V0SW5MY2EoKS5nZXRFc3RpbWF0ZWRTaXplKCk7XG5cbiAgICAgIGlmICh0aGlzLnVzZVNtYXJ0SWRlYWxFZGdlTGVuZ3RoQ2FsY3VsYXRpb24pXG4gICAgICB7XG4gICAgICAgIGVkZ2UuaWRlYWxMZW5ndGggKz0gc2l6ZU9mU291cmNlSW5MY2EgKyBzaXplT2ZUYXJnZXRJbkxjYSAtXG4gICAgICAgICAgICAgICAgMiAqIExheW91dENvbnN0YW50cy5TSU1QTEVfTk9ERV9TSVpFO1xuICAgICAgfVxuXG4gICAgICBsY2FEZXB0aCA9IGVkZ2UuZ2V0TGNhKCkuZ2V0SW5jbHVzaW9uVHJlZURlcHRoKCk7XG5cbiAgICAgIGVkZ2UuaWRlYWxMZW5ndGggKz0gRkRMYXlvdXRDb25zdGFudHMuREVGQVVMVF9FREdFX0xFTkdUSCAqXG4gICAgICAgICAgICAgIEZETGF5b3V0Q29uc3RhbnRzLlBFUl9MRVZFTF9JREVBTF9FREdFX0xFTkdUSF9GQUNUT1IgKlxuICAgICAgICAgICAgICAoc291cmNlLmdldEluY2x1c2lvblRyZWVEZXB0aCgpICtcbiAgICAgICAgICAgICAgICAgICAgICB0YXJnZXQuZ2V0SW5jbHVzaW9uVHJlZURlcHRoKCkgLSAyICogbGNhRGVwdGgpO1xuICAgIH1cbiAgfVxufTtcblxuRkRMYXlvdXQucHJvdG90eXBlLmluaXRTcHJpbmdFbWJlZGRlciA9IGZ1bmN0aW9uICgpIHtcblxuICBpZiAodGhpcy5pbmNyZW1lbnRhbClcbiAge1xuICAgIHRoaXMubWF4Tm9kZURpc3BsYWNlbWVudCA9XG4gICAgICAgICAgICBGRExheW91dENvbnN0YW50cy5NQVhfTk9ERV9ESVNQTEFDRU1FTlRfSU5DUkVNRU5UQUw7XG4gIH1cbiAgZWxzZVxuICB7XG4gICAgdGhpcy5jb29saW5nRmFjdG9yID0gMS4wO1xuICAgIHRoaXMuaW5pdGlhbENvb2xpbmdGYWN0b3IgPSAxLjA7XG4gICAgdGhpcy5tYXhOb2RlRGlzcGxhY2VtZW50ID1cbiAgICAgICAgICAgIEZETGF5b3V0Q29uc3RhbnRzLk1BWF9OT0RFX0RJU1BMQUNFTUVOVDtcbiAgfVxuXG4gIHRoaXMubWF4SXRlcmF0aW9ucyA9XG4gICAgICAgICAgTWF0aC5tYXgodGhpcy5nZXRBbGxOb2RlcygpLmxlbmd0aCAqIDUsIHRoaXMubWF4SXRlcmF0aW9ucyk7XG5cbiAgdGhpcy50b3RhbERpc3BsYWNlbWVudFRocmVzaG9sZCA9XG4gICAgICAgICAgdGhpcy5kaXNwbGFjZW1lbnRUaHJlc2hvbGRQZXJOb2RlICogdGhpcy5nZXRBbGxOb2RlcygpLmxlbmd0aDtcblxuICB0aGlzLnJlcHVsc2lvblJhbmdlID0gdGhpcy5jYWxjUmVwdWxzaW9uUmFuZ2UoKTtcbn07XG5cbkZETGF5b3V0LnByb3RvdHlwZS5jYWxjU3ByaW5nRm9yY2VzID0gZnVuY3Rpb24gKCkge1xuICB2YXIgbEVkZ2VzID0gdGhpcy5nZXRBbGxFZGdlcygpO1xuICB2YXIgZWRnZTtcblxuICBmb3IgKHZhciBpID0gMDsgaSA8IGxFZGdlcy5sZW5ndGg7IGkrKylcbiAge1xuICAgIGVkZ2UgPSBsRWRnZXNbaV07XG5cbiAgICB0aGlzLmNhbGNTcHJpbmdGb3JjZShlZGdlLCBlZGdlLmlkZWFsTGVuZ3RoKTtcbiAgfVxufTtcblxuRkRMYXlvdXQucHJvdG90eXBlLmNhbGNSZXB1bHNpb25Gb3JjZXMgPSBmdW5jdGlvbiAoKSB7XG4gIHZhciBpLCBqO1xuICB2YXIgbm9kZUEsIG5vZGVCO1xuICB2YXIgbE5vZGVzID0gdGhpcy5nZXRBbGxOb2RlcygpO1xuICB2YXIgcHJvY2Vzc2VkTm9kZVNldDtcblxuICBpZiAodGhpcy51c2VGUkdyaWRWYXJpYW50KVxuICB7ICAgICAgIFxuICAgIGlmICgodGhpcy50b3RhbEl0ZXJhdGlvbnMgJSBGRExheW91dENvbnN0YW50cy5HUklEX0NBTENVTEFUSU9OX0NIRUNLX1BFUklPRCA9PSAxICYmICF0aGlzLmlzVHJlZUdyb3dpbmcgJiYgIXRoaXMuaXNHcm93dGhGaW5pc2hlZCkpXG4gICAgeyAgICAgICBcbiAgICAgIHRoaXMudXBkYXRlR3JpZCgpOyAgXG4gICAgfVxuXG4gICAgcHJvY2Vzc2VkTm9kZVNldCA9IG5ldyBTZXQoKTtcbiAgICBcbiAgICAvLyBjYWxjdWxhdGUgcmVwdWxzaW9uIGZvcmNlcyBiZXR3ZWVuIGVhY2ggbm9kZXMgYW5kIGl0cyBzdXJyb3VuZGluZ1xuICAgIGZvciAoaSA9IDA7IGkgPCBsTm9kZXMubGVuZ3RoOyBpKyspXG4gICAge1xuICAgICAgbm9kZUEgPSBsTm9kZXNbaV07XG4gICAgICB0aGlzLmNhbGN1bGF0ZVJlcHVsc2lvbkZvcmNlT2ZBTm9kZShub2RlQSwgcHJvY2Vzc2VkTm9kZVNldCk7XG4gICAgICBwcm9jZXNzZWROb2RlU2V0LmFkZChub2RlQSk7XG4gICAgfVxuICB9XG4gIGVsc2VcbiAge1xuICAgIGZvciAoaSA9IDA7IGkgPCBsTm9kZXMubGVuZ3RoOyBpKyspXG4gICAge1xuICAgICAgbm9kZUEgPSBsTm9kZXNbaV07XG5cbiAgICAgIGZvciAoaiA9IGkgKyAxOyBqIDwgbE5vZGVzLmxlbmd0aDsgaisrKVxuICAgICAge1xuICAgICAgICBub2RlQiA9IGxOb2Rlc1tqXTtcblxuICAgICAgICAvLyBJZiBib3RoIG5vZGVzIGFyZSBub3QgbWVtYmVycyBvZiB0aGUgc2FtZSBncmFwaCwgc2tpcC5cbiAgICAgICAgaWYgKG5vZGVBLmdldE93bmVyKCkgIT0gbm9kZUIuZ2V0T3duZXIoKSlcbiAgICAgICAge1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5jYWxjUmVwdWxzaW9uRm9yY2Uobm9kZUEsIG5vZGVCKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn07XG5cbkZETGF5b3V0LnByb3RvdHlwZS5jYWxjR3Jhdml0YXRpb25hbEZvcmNlcyA9IGZ1bmN0aW9uICgpIHtcbiAgdmFyIG5vZGU7XG4gIHZhciBsTm9kZXMgPSB0aGlzLmdldEFsbE5vZGVzVG9BcHBseUdyYXZpdGF0aW9uKCk7XG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsTm9kZXMubGVuZ3RoOyBpKyspXG4gIHtcbiAgICBub2RlID0gbE5vZGVzW2ldO1xuICAgIHRoaXMuY2FsY0dyYXZpdGF0aW9uYWxGb3JjZShub2RlKTtcbiAgfVxufTtcblxuRkRMYXlvdXQucHJvdG90eXBlLm1vdmVOb2RlcyA9IGZ1bmN0aW9uICgpIHtcbiAgdmFyIGxOb2RlcyA9IHRoaXMuZ2V0QWxsTm9kZXMoKTtcbiAgdmFyIG5vZGU7XG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsTm9kZXMubGVuZ3RoOyBpKyspXG4gIHtcbiAgICBub2RlID0gbE5vZGVzW2ldO1xuICAgIG5vZGUubW92ZSgpO1xuICB9XG59XG5cbkZETGF5b3V0LnByb3RvdHlwZS5jYWxjU3ByaW5nRm9yY2UgPSBmdW5jdGlvbiAoZWRnZSwgaWRlYWxMZW5ndGgpIHtcbiAgdmFyIHNvdXJjZU5vZGUgPSBlZGdlLmdldFNvdXJjZSgpO1xuICB2YXIgdGFyZ2V0Tm9kZSA9IGVkZ2UuZ2V0VGFyZ2V0KCk7XG5cbiAgdmFyIGxlbmd0aDtcbiAgdmFyIHNwcmluZ0ZvcmNlO1xuICB2YXIgc3ByaW5nRm9yY2VYO1xuICB2YXIgc3ByaW5nRm9yY2VZO1xuXG4gIC8vIFVwZGF0ZSBlZGdlIGxlbmd0aFxuICBpZiAodGhpcy51bmlmb3JtTGVhZk5vZGVTaXplcyAmJlxuICAgICAgICAgIHNvdXJjZU5vZGUuZ2V0Q2hpbGQoKSA9PSBudWxsICYmIHRhcmdldE5vZGUuZ2V0Q2hpbGQoKSA9PSBudWxsKVxuICB7XG4gICAgZWRnZS51cGRhdGVMZW5ndGhTaW1wbGUoKTtcbiAgfVxuICBlbHNlXG4gIHtcbiAgICBlZGdlLnVwZGF0ZUxlbmd0aCgpO1xuXG4gICAgaWYgKGVkZ2UuaXNPdmVybGFwaW5nU291cmNlQW5kVGFyZ2V0KVxuICAgIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gIH1cblxuICBsZW5ndGggPSBlZGdlLmdldExlbmd0aCgpO1xuXG4gIC8vIENhbGN1bGF0ZSBzcHJpbmcgZm9yY2VzXG4gIHNwcmluZ0ZvcmNlID0gdGhpcy5zcHJpbmdDb25zdGFudCAqIChsZW5ndGggLSBpZGVhbExlbmd0aCk7XG5cbiAgLy8gUHJvamVjdCBmb3JjZSBvbnRvIHggYW5kIHkgYXhlc1xuICBzcHJpbmdGb3JjZVggPSBzcHJpbmdGb3JjZSAqIChlZGdlLmxlbmd0aFggLyBsZW5ndGgpO1xuICBzcHJpbmdGb3JjZVkgPSBzcHJpbmdGb3JjZSAqIChlZGdlLmxlbmd0aFkgLyBsZW5ndGgpO1xuXG4gIC8vIEFwcGx5IGZvcmNlcyBvbiB0aGUgZW5kIG5vZGVzXG4gIHNvdXJjZU5vZGUuc3ByaW5nRm9yY2VYICs9IHNwcmluZ0ZvcmNlWDtcbiAgc291cmNlTm9kZS5zcHJpbmdGb3JjZVkgKz0gc3ByaW5nRm9yY2VZO1xuICB0YXJnZXROb2RlLnNwcmluZ0ZvcmNlWCAtPSBzcHJpbmdGb3JjZVg7XG4gIHRhcmdldE5vZGUuc3ByaW5nRm9yY2VZIC09IHNwcmluZ0ZvcmNlWTtcbn07XG5cbkZETGF5b3V0LnByb3RvdHlwZS5jYWxjUmVwdWxzaW9uRm9yY2UgPSBmdW5jdGlvbiAobm9kZUEsIG5vZGVCKSB7XG4gIHZhciByZWN0QSA9IG5vZGVBLmdldFJlY3QoKTtcbiAgdmFyIHJlY3RCID0gbm9kZUIuZ2V0UmVjdCgpO1xuICB2YXIgb3ZlcmxhcEFtb3VudCA9IG5ldyBBcnJheSgyKTtcbiAgdmFyIGNsaXBQb2ludHMgPSBuZXcgQXJyYXkoNCk7XG4gIHZhciBkaXN0YW5jZVg7XG4gIHZhciBkaXN0YW5jZVk7XG4gIHZhciBkaXN0YW5jZVNxdWFyZWQ7XG4gIHZhciBkaXN0YW5jZTtcbiAgdmFyIHJlcHVsc2lvbkZvcmNlO1xuICB2YXIgcmVwdWxzaW9uRm9yY2VYO1xuICB2YXIgcmVwdWxzaW9uRm9yY2VZO1xuXG4gIGlmIChyZWN0QS5pbnRlcnNlY3RzKHJlY3RCKSkvLyB0d28gbm9kZXMgb3ZlcmxhcFxuICB7XG4gICAgLy8gY2FsY3VsYXRlIHNlcGFyYXRpb24gYW1vdW50IGluIHggYW5kIHkgZGlyZWN0aW9uc1xuICAgIElHZW9tZXRyeS5jYWxjU2VwYXJhdGlvbkFtb3VudChyZWN0QSxcbiAgICAgICAgICAgIHJlY3RCLFxuICAgICAgICAgICAgb3ZlcmxhcEFtb3VudCxcbiAgICAgICAgICAgIEZETGF5b3V0Q29uc3RhbnRzLkRFRkFVTFRfRURHRV9MRU5HVEggLyAyLjApO1xuXG4gICAgcmVwdWxzaW9uRm9yY2VYID0gMiAqIG92ZXJsYXBBbW91bnRbMF07XG4gICAgcmVwdWxzaW9uRm9yY2VZID0gMiAqIG92ZXJsYXBBbW91bnRbMV07XG4gICAgXG4gICAgdmFyIGNoaWxkcmVuQ29uc3RhbnQgPSBub2RlQS5ub09mQ2hpbGRyZW4gKiBub2RlQi5ub09mQ2hpbGRyZW4gLyAobm9kZUEubm9PZkNoaWxkcmVuICsgbm9kZUIubm9PZkNoaWxkcmVuKTtcbiAgICBcbiAgICAvLyBBcHBseSBmb3JjZXMgb24gdGhlIHR3byBub2Rlc1xuICAgIG5vZGVBLnJlcHVsc2lvbkZvcmNlWCAtPSBjaGlsZHJlbkNvbnN0YW50ICogcmVwdWxzaW9uRm9yY2VYO1xuICAgIG5vZGVBLnJlcHVsc2lvbkZvcmNlWSAtPSBjaGlsZHJlbkNvbnN0YW50ICogcmVwdWxzaW9uRm9yY2VZO1xuICAgIG5vZGVCLnJlcHVsc2lvbkZvcmNlWCArPSBjaGlsZHJlbkNvbnN0YW50ICogcmVwdWxzaW9uRm9yY2VYO1xuICAgIG5vZGVCLnJlcHVsc2lvbkZvcmNlWSArPSBjaGlsZHJlbkNvbnN0YW50ICogcmVwdWxzaW9uRm9yY2VZO1xuICB9XG4gIGVsc2UvLyBubyBvdmVybGFwXG4gIHtcbiAgICAvLyBjYWxjdWxhdGUgZGlzdGFuY2VcblxuICAgIGlmICh0aGlzLnVuaWZvcm1MZWFmTm9kZVNpemVzICYmXG4gICAgICAgICAgICBub2RlQS5nZXRDaGlsZCgpID09IG51bGwgJiYgbm9kZUIuZ2V0Q2hpbGQoKSA9PSBudWxsKS8vIHNpbXBseSBiYXNlIHJlcHVsc2lvbiBvbiBkaXN0YW5jZSBvZiBub2RlIGNlbnRlcnNcbiAgICB7XG4gICAgICBkaXN0YW5jZVggPSByZWN0Qi5nZXRDZW50ZXJYKCkgLSByZWN0QS5nZXRDZW50ZXJYKCk7XG4gICAgICBkaXN0YW5jZVkgPSByZWN0Qi5nZXRDZW50ZXJZKCkgLSByZWN0QS5nZXRDZW50ZXJZKCk7XG4gICAgfVxuICAgIGVsc2UvLyB1c2UgY2xpcHBpbmcgcG9pbnRzXG4gICAge1xuICAgICAgSUdlb21ldHJ5LmdldEludGVyc2VjdGlvbihyZWN0QSwgcmVjdEIsIGNsaXBQb2ludHMpO1xuXG4gICAgICBkaXN0YW5jZVggPSBjbGlwUG9pbnRzWzJdIC0gY2xpcFBvaW50c1swXTtcbiAgICAgIGRpc3RhbmNlWSA9IGNsaXBQb2ludHNbM10gLSBjbGlwUG9pbnRzWzFdO1xuICAgIH1cblxuICAgIC8vIE5vIHJlcHVsc2lvbiByYW5nZS4gRlIgZ3JpZCB2YXJpYW50IHNob3VsZCB0YWtlIGNhcmUgb2YgdGhpcy5cbiAgICBpZiAoTWF0aC5hYnMoZGlzdGFuY2VYKSA8IEZETGF5b3V0Q29uc3RhbnRzLk1JTl9SRVBVTFNJT05fRElTVClcbiAgICB7XG4gICAgICBkaXN0YW5jZVggPSBJTWF0aC5zaWduKGRpc3RhbmNlWCkgKlxuICAgICAgICAgICAgICBGRExheW91dENvbnN0YW50cy5NSU5fUkVQVUxTSU9OX0RJU1Q7XG4gICAgfVxuXG4gICAgaWYgKE1hdGguYWJzKGRpc3RhbmNlWSkgPCBGRExheW91dENvbnN0YW50cy5NSU5fUkVQVUxTSU9OX0RJU1QpXG4gICAge1xuICAgICAgZGlzdGFuY2VZID0gSU1hdGguc2lnbihkaXN0YW5jZVkpICpcbiAgICAgICAgICAgICAgRkRMYXlvdXRDb25zdGFudHMuTUlOX1JFUFVMU0lPTl9ESVNUO1xuICAgIH1cblxuICAgIGRpc3RhbmNlU3F1YXJlZCA9IGRpc3RhbmNlWCAqIGRpc3RhbmNlWCArIGRpc3RhbmNlWSAqIGRpc3RhbmNlWTtcbiAgICBkaXN0YW5jZSA9IE1hdGguc3FydChkaXN0YW5jZVNxdWFyZWQpO1xuXG4gICAgcmVwdWxzaW9uRm9yY2UgPSB0aGlzLnJlcHVsc2lvbkNvbnN0YW50ICogbm9kZUEubm9PZkNoaWxkcmVuICogbm9kZUIubm9PZkNoaWxkcmVuIC8gZGlzdGFuY2VTcXVhcmVkO1xuXG4gICAgLy8gUHJvamVjdCBmb3JjZSBvbnRvIHggYW5kIHkgYXhlc1xuICAgIHJlcHVsc2lvbkZvcmNlWCA9IHJlcHVsc2lvbkZvcmNlICogZGlzdGFuY2VYIC8gZGlzdGFuY2U7XG4gICAgcmVwdWxzaW9uRm9yY2VZID0gcmVwdWxzaW9uRm9yY2UgKiBkaXN0YW5jZVkgLyBkaXN0YW5jZTtcbiAgICAgXG4gICAgLy8gQXBwbHkgZm9yY2VzIG9uIHRoZSB0d28gbm9kZXMgICAgXG4gICAgbm9kZUEucmVwdWxzaW9uRm9yY2VYIC09IHJlcHVsc2lvbkZvcmNlWDtcbiAgICBub2RlQS5yZXB1bHNpb25Gb3JjZVkgLT0gcmVwdWxzaW9uRm9yY2VZO1xuICAgIG5vZGVCLnJlcHVsc2lvbkZvcmNlWCArPSByZXB1bHNpb25Gb3JjZVg7XG4gICAgbm9kZUIucmVwdWxzaW9uRm9yY2VZICs9IHJlcHVsc2lvbkZvcmNlWTtcbiAgfVxufTtcblxuRkRMYXlvdXQucHJvdG90eXBlLmNhbGNHcmF2aXRhdGlvbmFsRm9yY2UgPSBmdW5jdGlvbiAobm9kZSkge1xuICB2YXIgb3duZXJHcmFwaDtcbiAgdmFyIG93bmVyQ2VudGVyWDtcbiAgdmFyIG93bmVyQ2VudGVyWTtcbiAgdmFyIGRpc3RhbmNlWDtcbiAgdmFyIGRpc3RhbmNlWTtcbiAgdmFyIGFic0Rpc3RhbmNlWDtcbiAgdmFyIGFic0Rpc3RhbmNlWTtcbiAgdmFyIGVzdGltYXRlZFNpemU7XG4gIG93bmVyR3JhcGggPSBub2RlLmdldE93bmVyKCk7XG5cbiAgb3duZXJDZW50ZXJYID0gKG93bmVyR3JhcGguZ2V0UmlnaHQoKSArIG93bmVyR3JhcGguZ2V0TGVmdCgpKSAvIDI7XG4gIG93bmVyQ2VudGVyWSA9IChvd25lckdyYXBoLmdldFRvcCgpICsgb3duZXJHcmFwaC5nZXRCb3R0b20oKSkgLyAyO1xuICBkaXN0YW5jZVggPSBub2RlLmdldENlbnRlclgoKSAtIG93bmVyQ2VudGVyWDtcbiAgZGlzdGFuY2VZID0gbm9kZS5nZXRDZW50ZXJZKCkgLSBvd25lckNlbnRlclk7XG4gIGFic0Rpc3RhbmNlWCA9IE1hdGguYWJzKGRpc3RhbmNlWCkgKyBub2RlLmdldFdpZHRoKCkgLyAyO1xuICBhYnNEaXN0YW5jZVkgPSBNYXRoLmFicyhkaXN0YW5jZVkpICsgbm9kZS5nZXRIZWlnaHQoKSAvIDI7XG5cbiAgaWYgKG5vZGUuZ2V0T3duZXIoKSA9PSB0aGlzLmdyYXBoTWFuYWdlci5nZXRSb290KCkpLy8gaW4gdGhlIHJvb3QgZ3JhcGhcbiAge1xuICAgIGVzdGltYXRlZFNpemUgPSBvd25lckdyYXBoLmdldEVzdGltYXRlZFNpemUoKSAqIHRoaXMuZ3Jhdml0eVJhbmdlRmFjdG9yO1xuXG4gICAgaWYgKGFic0Rpc3RhbmNlWCA+IGVzdGltYXRlZFNpemUgfHwgYWJzRGlzdGFuY2VZID4gZXN0aW1hdGVkU2l6ZSlcbiAgICB7XG4gICAgICBub2RlLmdyYXZpdGF0aW9uRm9yY2VYID0gLXRoaXMuZ3Jhdml0eUNvbnN0YW50ICogZGlzdGFuY2VYO1xuICAgICAgbm9kZS5ncmF2aXRhdGlvbkZvcmNlWSA9IC10aGlzLmdyYXZpdHlDb25zdGFudCAqIGRpc3RhbmNlWTtcbiAgICB9XG4gIH1cbiAgZWxzZS8vIGluc2lkZSBhIGNvbXBvdW5kXG4gIHtcbiAgICBlc3RpbWF0ZWRTaXplID0gb3duZXJHcmFwaC5nZXRFc3RpbWF0ZWRTaXplKCkgKiB0aGlzLmNvbXBvdW5kR3Jhdml0eVJhbmdlRmFjdG9yO1xuXG4gICAgaWYgKGFic0Rpc3RhbmNlWCA+IGVzdGltYXRlZFNpemUgfHwgYWJzRGlzdGFuY2VZID4gZXN0aW1hdGVkU2l6ZSlcbiAgICB7XG4gICAgICBub2RlLmdyYXZpdGF0aW9uRm9yY2VYID0gLXRoaXMuZ3Jhdml0eUNvbnN0YW50ICogZGlzdGFuY2VYICpcbiAgICAgICAgICAgICAgdGhpcy5jb21wb3VuZEdyYXZpdHlDb25zdGFudDtcbiAgICAgIG5vZGUuZ3Jhdml0YXRpb25Gb3JjZVkgPSAtdGhpcy5ncmF2aXR5Q29uc3RhbnQgKiBkaXN0YW5jZVkgKlxuICAgICAgICAgICAgICB0aGlzLmNvbXBvdW5kR3Jhdml0eUNvbnN0YW50O1xuICAgIH1cbiAgfVxufTtcblxuRkRMYXlvdXQucHJvdG90eXBlLmlzQ29udmVyZ2VkID0gZnVuY3Rpb24gKCkge1xuICB2YXIgY29udmVyZ2VkO1xuICB2YXIgb3NjaWxhdGluZyA9IGZhbHNlO1xuXG4gIGlmICh0aGlzLnRvdGFsSXRlcmF0aW9ucyA+IHRoaXMubWF4SXRlcmF0aW9ucyAvIDMpXG4gIHtcbiAgICBvc2NpbGF0aW5nID1cbiAgICAgICAgICAgIE1hdGguYWJzKHRoaXMudG90YWxEaXNwbGFjZW1lbnQgLSB0aGlzLm9sZFRvdGFsRGlzcGxhY2VtZW50KSA8IDI7XG4gIH1cblxuICBjb252ZXJnZWQgPSB0aGlzLnRvdGFsRGlzcGxhY2VtZW50IDwgdGhpcy50b3RhbERpc3BsYWNlbWVudFRocmVzaG9sZDtcblxuICB0aGlzLm9sZFRvdGFsRGlzcGxhY2VtZW50ID0gdGhpcy50b3RhbERpc3BsYWNlbWVudDtcblxuICByZXR1cm4gY29udmVyZ2VkIHx8IG9zY2lsYXRpbmc7XG59O1xuXG5GRExheW91dC5wcm90b3R5cGUuYW5pbWF0ZSA9IGZ1bmN0aW9uICgpIHtcbiAgaWYgKHRoaXMuYW5pbWF0aW9uRHVyaW5nTGF5b3V0ICYmICF0aGlzLmlzU3ViTGF5b3V0KVxuICB7XG4gICAgaWYgKHRoaXMubm90QW5pbWF0ZWRJdGVyYXRpb25zID09IHRoaXMuYW5pbWF0aW9uUGVyaW9kKVxuICAgIHtcbiAgICAgIHRoaXMudXBkYXRlKCk7XG4gICAgICB0aGlzLm5vdEFuaW1hdGVkSXRlcmF0aW9ucyA9IDA7XG4gICAgfVxuICAgIGVsc2VcbiAgICB7XG4gICAgICB0aGlzLm5vdEFuaW1hdGVkSXRlcmF0aW9ucysrO1xuICAgIH1cbiAgfVxufTtcblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbi8vIFNlY3Rpb246IEZSLUdyaWQgVmFyaWFudCBSZXB1bHNpb24gRm9yY2UgQ2FsY3VsYXRpb25cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbkZETGF5b3V0LnByb3RvdHlwZS5jYWxjR3JpZCA9IGZ1bmN0aW9uIChncmFwaCl7XG5cbiAgdmFyIHNpemVYID0gMDsgXG4gIHZhciBzaXplWSA9IDA7XG4gIFxuICBzaXplWCA9IHBhcnNlSW50KE1hdGguY2VpbCgoZ3JhcGguZ2V0UmlnaHQoKSAtIGdyYXBoLmdldExlZnQoKSkgLyB0aGlzLnJlcHVsc2lvblJhbmdlKSk7XG4gIHNpemVZID0gcGFyc2VJbnQoTWF0aC5jZWlsKChncmFwaC5nZXRCb3R0b20oKSAtIGdyYXBoLmdldFRvcCgpKSAvIHRoaXMucmVwdWxzaW9uUmFuZ2UpKTtcbiAgXG4gIHZhciBncmlkID0gbmV3IEFycmF5KHNpemVYKTtcbiAgXG4gIGZvcih2YXIgaSA9IDA7IGkgPCBzaXplWDsgaSsrKXtcbiAgICBncmlkW2ldID0gbmV3IEFycmF5KHNpemVZKTsgICAgXG4gIH1cbiAgXG4gIGZvcih2YXIgaSA9IDA7IGkgPCBzaXplWDsgaSsrKXtcbiAgICBmb3IodmFyIGogPSAwOyBqIDwgc2l6ZVk7IGorKyl7XG4gICAgICBncmlkW2ldW2pdID0gbmV3IEFycmF5KCk7ICAgIFxuICAgIH1cbiAgfVxuICBcbiAgcmV0dXJuIGdyaWQ7XG59O1xuXG5GRExheW91dC5wcm90b3R5cGUuYWRkTm9kZVRvR3JpZCA9IGZ1bmN0aW9uICh2LCBsZWZ0LCB0b3Ape1xuICAgIFxuICB2YXIgc3RhcnRYID0gMDtcbiAgdmFyIGZpbmlzaFggPSAwO1xuICB2YXIgc3RhcnRZID0gMDtcbiAgdmFyIGZpbmlzaFkgPSAwO1xuICBcbiAgc3RhcnRYID0gcGFyc2VJbnQoTWF0aC5mbG9vcigodi5nZXRSZWN0KCkueCAtIGxlZnQpIC8gdGhpcy5yZXB1bHNpb25SYW5nZSkpO1xuICBmaW5pc2hYID0gcGFyc2VJbnQoTWF0aC5mbG9vcigodi5nZXRSZWN0KCkud2lkdGggKyB2LmdldFJlY3QoKS54IC0gbGVmdCkgLyB0aGlzLnJlcHVsc2lvblJhbmdlKSk7XG4gIHN0YXJ0WSA9IHBhcnNlSW50KE1hdGguZmxvb3IoKHYuZ2V0UmVjdCgpLnkgLSB0b3ApIC8gdGhpcy5yZXB1bHNpb25SYW5nZSkpO1xuICBmaW5pc2hZID0gcGFyc2VJbnQoTWF0aC5mbG9vcigodi5nZXRSZWN0KCkuaGVpZ2h0ICsgdi5nZXRSZWN0KCkueSAtIHRvcCkgLyB0aGlzLnJlcHVsc2lvblJhbmdlKSk7XG5cbiAgZm9yICh2YXIgaSA9IHN0YXJ0WDsgaSA8PSBmaW5pc2hYOyBpKyspXG4gIHtcbiAgICBmb3IgKHZhciBqID0gc3RhcnRZOyBqIDw9IGZpbmlzaFk7IGorKylcbiAgICB7XG4gICAgICB0aGlzLmdyaWRbaV1bal0ucHVzaCh2KTtcbiAgICAgIHYuc2V0R3JpZENvb3JkaW5hdGVzKHN0YXJ0WCwgZmluaXNoWCwgc3RhcnRZLCBmaW5pc2hZKTsgXG4gICAgfVxuICB9ICBcblxufTtcblxuRkRMYXlvdXQucHJvdG90eXBlLnVwZGF0ZUdyaWQgPSBmdW5jdGlvbigpIHtcbiAgdmFyIGk7XG4gIHZhciBub2RlQTtcbiAgdmFyIGxOb2RlcyA9IHRoaXMuZ2V0QWxsTm9kZXMoKTtcbiAgXG4gIHRoaXMuZ3JpZCA9IHRoaXMuY2FsY0dyaWQodGhpcy5ncmFwaE1hbmFnZXIuZ2V0Um9vdCgpKTsgICBcblxuICAvLyBwdXQgYWxsIG5vZGVzIHRvIHByb3BlciBncmlkIGNlbGxzXG4gIGZvciAoaSA9IDA7IGkgPCBsTm9kZXMubGVuZ3RoOyBpKyspXG4gIHtcbiAgICBub2RlQSA9IGxOb2Rlc1tpXTtcbiAgICB0aGlzLmFkZE5vZGVUb0dyaWQobm9kZUEsIHRoaXMuZ3JhcGhNYW5hZ2VyLmdldFJvb3QoKS5nZXRMZWZ0KCksIHRoaXMuZ3JhcGhNYW5hZ2VyLmdldFJvb3QoKS5nZXRUb3AoKSk7XG4gIH0gXG5cbn07XG5cbkZETGF5b3V0LnByb3RvdHlwZS5jYWxjdWxhdGVSZXB1bHNpb25Gb3JjZU9mQU5vZGUgPSBmdW5jdGlvbiAobm9kZUEsIHByb2Nlc3NlZE5vZGVTZXQpe1xuICBcbiAgaWYgKCh0aGlzLnRvdGFsSXRlcmF0aW9ucyAlIEZETGF5b3V0Q29uc3RhbnRzLkdSSURfQ0FMQ1VMQVRJT05fQ0hFQ0tfUEVSSU9EID09IDEgJiYgIXRoaXMuaXNUcmVlR3Jvd2luZyAmJiAhdGhpcy5pc0dyb3d0aEZpbmlzaGVkKSB8fCAodGhpcy5ncm93VHJlZUl0ZXJhdGlvbnMgJSAxMCA9PSAxICYmIHRoaXMuaXNUcmVlR3Jvd2luZykgfHwgKHRoaXMuYWZ0ZXJHcm93dGhJdGVyYXRpb25zICUgMTAgPT0gMSAmJiB0aGlzLmlzR3Jvd3RoRmluaXNoZWQpKVxuICB7XG4gICAgdmFyIHN1cnJvdW5kaW5nID0gbmV3IFNldCgpO1xuICAgIG5vZGVBLnN1cnJvdW5kaW5nID0gbmV3IEFycmF5KCk7XG4gICAgdmFyIG5vZGVCO1xuICAgIHZhciBncmlkID0gdGhpcy5ncmlkO1xuICAgIFxuICAgIGZvciAodmFyIGkgPSAobm9kZUEuc3RhcnRYIC0gMSk7IGkgPCAobm9kZUEuZmluaXNoWCArIDIpOyBpKyspXG4gICAge1xuICAgICAgZm9yICh2YXIgaiA9IChub2RlQS5zdGFydFkgLSAxKTsgaiA8IChub2RlQS5maW5pc2hZICsgMik7IGorKylcbiAgICAgIHtcbiAgICAgICAgaWYgKCEoKGkgPCAwKSB8fCAoaiA8IDApIHx8IChpID49IGdyaWQubGVuZ3RoKSB8fCAoaiA+PSBncmlkWzBdLmxlbmd0aCkpKVxuICAgICAgICB7ICBcbiAgICAgICAgICBmb3IgKHZhciBrID0gMDsgayA8IGdyaWRbaV1bal0ubGVuZ3RoOyBrKyspIHtcbiAgICAgICAgICAgIG5vZGVCID0gZ3JpZFtpXVtqXVtrXTtcblxuICAgICAgICAgICAgLy8gSWYgYm90aCBub2RlcyBhcmUgbm90IG1lbWJlcnMgb2YgdGhlIHNhbWUgZ3JhcGgsIFxuICAgICAgICAgICAgLy8gb3IgYm90aCBub2RlcyBhcmUgdGhlIHNhbWUsIHNraXAuXG4gICAgICAgICAgICBpZiAoKG5vZGVBLmdldE93bmVyKCkgIT0gbm9kZUIuZ2V0T3duZXIoKSkgfHwgKG5vZGVBID09IG5vZGVCKSlcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIGNoZWNrIGlmIHRoZSByZXB1bHNpb24gZm9yY2UgYmV0d2VlblxuICAgICAgICAgICAgLy8gbm9kZUEgYW5kIG5vZGVCIGhhcyBhbHJlYWR5IGJlZW4gY2FsY3VsYXRlZFxuICAgICAgICAgICAgaWYgKCFwcm9jZXNzZWROb2RlU2V0Lmhhcyhub2RlQikgJiYgIXN1cnJvdW5kaW5nLmhhcyhub2RlQikpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIHZhciBkaXN0YW5jZVggPSBNYXRoLmFicyhub2RlQS5nZXRDZW50ZXJYKCktbm9kZUIuZ2V0Q2VudGVyWCgpKSAtIFxuICAgICAgICAgICAgICAgICAgICAoKG5vZGVBLmdldFdpZHRoKCkvMikgKyAobm9kZUIuZ2V0V2lkdGgoKS8yKSk7XG4gICAgICAgICAgICAgIHZhciBkaXN0YW5jZVkgPSBNYXRoLmFicyhub2RlQS5nZXRDZW50ZXJZKCktbm9kZUIuZ2V0Q2VudGVyWSgpKSAtIFxuICAgICAgICAgICAgICAgICAgICAoKG5vZGVBLmdldEhlaWdodCgpLzIpICsgKG5vZGVCLmdldEhlaWdodCgpLzIpKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgICAvLyBpZiB0aGUgZGlzdGFuY2UgYmV0d2VlbiBub2RlQSBhbmQgbm9kZUIgXG4gICAgICAgICAgICAgIC8vIGlzIGxlc3MgdGhlbiBjYWxjdWxhdGlvbiByYW5nZVxuICAgICAgICAgICAgICBpZiAoKGRpc3RhbmNlWCA8PSB0aGlzLnJlcHVsc2lvblJhbmdlKSAmJiAoZGlzdGFuY2VZIDw9IHRoaXMucmVwdWxzaW9uUmFuZ2UpKVxuICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgLy90aGVuIGFkZCBub2RlQiB0byBzdXJyb3VuZGluZyBvZiBub2RlQVxuICAgICAgICAgICAgICAgIHN1cnJvdW5kaW5nLmFkZChub2RlQik7XG4gICAgICAgICAgICAgIH0gICAgICAgICAgICAgIFxuICAgICAgICAgICAgfSAgICBcbiAgICAgICAgICB9XG4gICAgICAgIH0gICAgICAgICAgXG4gICAgICB9XG4gICAgfVxuXG4gICAgbm9kZUEuc3Vycm91bmRpbmcgPSBbLi4uc3Vycm91bmRpbmddO1xuXHRcbiAgfVxuICBmb3IgKGkgPSAwOyBpIDwgbm9kZUEuc3Vycm91bmRpbmcubGVuZ3RoOyBpKyspXG4gIHtcbiAgICB0aGlzLmNhbGNSZXB1bHNpb25Gb3JjZShub2RlQSwgbm9kZUEuc3Vycm91bmRpbmdbaV0pO1xuICB9XHRcbn07XG5cbkZETGF5b3V0LnByb3RvdHlwZS5jYWxjUmVwdWxzaW9uUmFuZ2UgPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiAwLjA7XG59O1xuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuLy8gU2VjdGlvbjogVHJlZSBSZWR1Y3Rpb24gbWV0aG9kc1xuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbi8vIFJlZHVjZSB0cmVlcyBcbkZETGF5b3V0LnByb3RvdHlwZS5yZWR1Y2VUcmVlcyA9IGZ1bmN0aW9uICgpXG57XG4gIHZhciBwcnVuZWROb2Rlc0FsbCA9IFtdO1xuICB2YXIgY29udGFpbnNMZWFmID0gdHJ1ZTtcbiAgdmFyIG5vZGU7XG4gIFxuICB3aGlsZShjb250YWluc0xlYWYpIHtcbiAgICB2YXIgYWxsTm9kZXMgPSB0aGlzLmdyYXBoTWFuYWdlci5nZXRBbGxOb2RlcygpO1xuICAgIHZhciBwcnVuZWROb2Rlc0luU3RlcFRlbXAgPSBbXTtcbiAgICBjb250YWluc0xlYWYgPSBmYWxzZTtcbiAgICBcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFsbE5vZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBub2RlID0gYWxsTm9kZXNbaV07XG4gICAgICBpZihub2RlLmdldEVkZ2VzKCkubGVuZ3RoID09IDEgJiYgIW5vZGUuZ2V0RWRnZXMoKVswXS5pc0ludGVyR3JhcGggJiYgbm9kZS5nZXRDaGlsZCgpID09IG51bGwpe1xuICAgICAgICBwcnVuZWROb2Rlc0luU3RlcFRlbXAucHVzaChbbm9kZSwgbm9kZS5nZXRFZGdlcygpWzBdLCBub2RlLmdldE93bmVyKCldKTtcbiAgICAgICAgY29udGFpbnNMZWFmID0gdHJ1ZTtcbiAgICAgIH0gIFxuICAgIH1cbiAgICBpZihjb250YWluc0xlYWYgPT0gdHJ1ZSl7XG4gICAgICB2YXIgcHJ1bmVkTm9kZXNJblN0ZXAgPSBbXTtcbiAgICAgIGZvcih2YXIgaiA9IDA7IGogPCBwcnVuZWROb2Rlc0luU3RlcFRlbXAubGVuZ3RoOyBqKyspe1xuICAgICAgICBpZihwcnVuZWROb2Rlc0luU3RlcFRlbXBbal1bMF0uZ2V0RWRnZXMoKS5sZW5ndGggPT0gMSl7XG4gICAgICAgICAgcHJ1bmVkTm9kZXNJblN0ZXAucHVzaChwcnVuZWROb2Rlc0luU3RlcFRlbXBbal0pOyAgXG4gICAgICAgICAgcHJ1bmVkTm9kZXNJblN0ZXBUZW1wW2pdWzBdLmdldE93bmVyKCkucmVtb3ZlKHBydW5lZE5vZGVzSW5TdGVwVGVtcFtqXVswXSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHBydW5lZE5vZGVzQWxsLnB1c2gocHJ1bmVkTm9kZXNJblN0ZXApO1xuICAgICAgdGhpcy5ncmFwaE1hbmFnZXIucmVzZXRBbGxOb2RlcygpO1xuICAgICAgdGhpcy5ncmFwaE1hbmFnZXIucmVzZXRBbGxFZGdlcygpO1xuICAgIH1cbiAgfVxuICB0aGlzLnBydW5lZE5vZGVzQWxsID0gcHJ1bmVkTm9kZXNBbGw7XG59O1xuXG4vLyBHcm93IHRyZWUgb25lIHN0ZXAgXG5GRExheW91dC5wcm90b3R5cGUuZ3Jvd1RyZWUgPSBmdW5jdGlvbihwcnVuZWROb2Rlc0FsbClcbntcbiAgdmFyIGxlbmd0aE9mUHJ1bmVkTm9kZXNJblN0ZXAgPSBwcnVuZWROb2Rlc0FsbC5sZW5ndGg7IFxuICB2YXIgcHJ1bmVkTm9kZXNJblN0ZXAgPSBwcnVuZWROb2Rlc0FsbFtsZW5ndGhPZlBydW5lZE5vZGVzSW5TdGVwIC0gMV07ICBcblxuICB2YXIgbm9kZURhdGE7ICBcbiAgZm9yKHZhciBpID0gMDsgaSA8IHBydW5lZE5vZGVzSW5TdGVwLmxlbmd0aDsgaSsrKXtcbiAgICBub2RlRGF0YSA9IHBydW5lZE5vZGVzSW5TdGVwW2ldO1xuXG4gICAgdGhpcy5maW5kUGxhY2Vmb3JQcnVuZWROb2RlKG5vZGVEYXRhKTtcbiAgICBcbiAgICBub2RlRGF0YVsyXS5hZGQobm9kZURhdGFbMF0pO1xuICAgIG5vZGVEYXRhWzJdLmFkZChub2RlRGF0YVsxXSwgbm9kZURhdGFbMV0uc291cmNlLCBub2RlRGF0YVsxXS50YXJnZXQpO1xuICB9XG5cbiAgcHJ1bmVkTm9kZXNBbGwuc3BsaWNlKHBydW5lZE5vZGVzQWxsLmxlbmd0aC0xLCAxKTtcbiAgdGhpcy5ncmFwaE1hbmFnZXIucmVzZXRBbGxOb2RlcygpO1xuICB0aGlzLmdyYXBoTWFuYWdlci5yZXNldEFsbEVkZ2VzKCk7XG59O1xuXG4vLyBGaW5kIGFuIGFwcHJvcHJpYXRlIHBvc2l0aW9uIHRvIHJlcGxhY2UgcHJ1bmVkIG5vZGUsIHRoaXMgbWV0aG9kIGNhbiBiZSBpbXByb3ZlZFxuRkRMYXlvdXQucHJvdG90eXBlLmZpbmRQbGFjZWZvclBydW5lZE5vZGUgPSBmdW5jdGlvbihub2RlRGF0YSl7XG4gIFxuICB2YXIgZ3JpZEZvclBydW5lZE5vZGU7ICBcbiAgdmFyIG5vZGVUb0Nvbm5lY3Q7XG4gIHZhciBwcnVuZWROb2RlID0gbm9kZURhdGFbMF07XG4gIGlmKHBydW5lZE5vZGUgPT0gbm9kZURhdGFbMV0uc291cmNlKXtcbiAgICBub2RlVG9Db25uZWN0ID0gbm9kZURhdGFbMV0udGFyZ2V0O1xuICB9XG4gIGVsc2Uge1xuICAgIG5vZGVUb0Nvbm5lY3QgPSBub2RlRGF0YVsxXS5zb3VyY2U7ICBcbiAgfVxuICB2YXIgc3RhcnRHcmlkWCA9IG5vZGVUb0Nvbm5lY3Quc3RhcnRYO1xuICB2YXIgZmluaXNoR3JpZFggPSBub2RlVG9Db25uZWN0LmZpbmlzaFg7XG4gIHZhciBzdGFydEdyaWRZID0gbm9kZVRvQ29ubmVjdC5zdGFydFk7XG4gIHZhciBmaW5pc2hHcmlkWSA9IG5vZGVUb0Nvbm5lY3QuZmluaXNoWTsgXG4gIFxuICB2YXIgdXBOb2RlQ291bnQgPSAwO1xuICB2YXIgZG93bk5vZGVDb3VudCA9IDA7XG4gIHZhciByaWdodE5vZGVDb3VudCA9IDA7XG4gIHZhciBsZWZ0Tm9kZUNvdW50ID0gMDtcbiAgdmFyIGNvbnRyb2xSZWdpb25zID0gW3VwTm9kZUNvdW50LCByaWdodE5vZGVDb3VudCwgZG93bk5vZGVDb3VudCwgbGVmdE5vZGVDb3VudF1cbiAgXG4gIGlmKHN0YXJ0R3JpZFkgPiAwKXtcbiAgICBmb3IodmFyIGkgPSBzdGFydEdyaWRYOyBpIDw9IGZpbmlzaEdyaWRYOyBpKysgKXtcbiAgICAgIGNvbnRyb2xSZWdpb25zWzBdICs9ICh0aGlzLmdyaWRbaV1bc3RhcnRHcmlkWSAtIDFdLmxlbmd0aCArIHRoaXMuZ3JpZFtpXVtzdGFydEdyaWRZXS5sZW5ndGggLSAxKTsgICBcbiAgICB9XG4gIH1cbiAgaWYoZmluaXNoR3JpZFggPCB0aGlzLmdyaWQubGVuZ3RoIC0gMSl7XG4gICAgZm9yKHZhciBpID0gc3RhcnRHcmlkWTsgaSA8PSBmaW5pc2hHcmlkWTsgaSsrICl7XG4gICAgICBjb250cm9sUmVnaW9uc1sxXSArPSAodGhpcy5ncmlkW2ZpbmlzaEdyaWRYICsgMV1baV0ubGVuZ3RoICsgdGhpcy5ncmlkW2ZpbmlzaEdyaWRYXVtpXS5sZW5ndGggLSAxKTsgICBcbiAgICB9XG4gIH1cbiAgaWYoZmluaXNoR3JpZFkgPCB0aGlzLmdyaWRbMF0ubGVuZ3RoIC0gMSl7XG4gICAgZm9yKHZhciBpID0gc3RhcnRHcmlkWDsgaSA8PSBmaW5pc2hHcmlkWDsgaSsrICl7XG4gICAgICBjb250cm9sUmVnaW9uc1syXSArPSAodGhpcy5ncmlkW2ldW2ZpbmlzaEdyaWRZICsgMV0ubGVuZ3RoICsgdGhpcy5ncmlkW2ldW2ZpbmlzaEdyaWRZXS5sZW5ndGggLSAxKTsgICBcbiAgICB9XG4gIH1cbiAgaWYoc3RhcnRHcmlkWCA+IDApe1xuICAgIGZvcih2YXIgaSA9IHN0YXJ0R3JpZFk7IGkgPD0gZmluaXNoR3JpZFk7IGkrKyApe1xuICAgICAgY29udHJvbFJlZ2lvbnNbM10gKz0gKHRoaXMuZ3JpZFtzdGFydEdyaWRYIC0gMV1baV0ubGVuZ3RoICsgdGhpcy5ncmlkW3N0YXJ0R3JpZFhdW2ldLmxlbmd0aCAtIDEpOyAgIFxuICAgIH1cbiAgfVxuICB2YXIgbWluID0gSW50ZWdlci5NQVhfVkFMVUU7XG4gIHZhciBtaW5Db3VudDtcbiAgdmFyIG1pbkluZGV4O1xuICBmb3IodmFyIGogPSAwOyBqIDwgY29udHJvbFJlZ2lvbnMubGVuZ3RoOyBqKyspe1xuICAgIGlmKGNvbnRyb2xSZWdpb25zW2pdIDwgbWluKXtcbiAgICAgIG1pbiA9IGNvbnRyb2xSZWdpb25zW2pdO1xuICAgICAgbWluQ291bnQgPSAxO1xuICAgICAgbWluSW5kZXggPSBqO1xuICAgIH0gIFxuICAgIGVsc2UgaWYoY29udHJvbFJlZ2lvbnNbal0gPT0gbWluKXtcbiAgICAgIG1pbkNvdW50Kys7ICBcbiAgICB9XG4gIH1cbiAgXG4gIGlmKG1pbkNvdW50ID09IDMgJiYgbWluID09IDApe1xuICAgIGlmKGNvbnRyb2xSZWdpb25zWzBdID09IDAgJiYgY29udHJvbFJlZ2lvbnNbMV0gPT0gMCAmJiBjb250cm9sUmVnaW9uc1syXSA9PSAwKXtcbiAgICAgIGdyaWRGb3JQcnVuZWROb2RlID0gMTsgICAgXG4gICAgfVxuICAgIGVsc2UgaWYoY29udHJvbFJlZ2lvbnNbMF0gPT0gMCAmJiBjb250cm9sUmVnaW9uc1sxXSA9PSAwICYmIGNvbnRyb2xSZWdpb25zWzNdID09IDApe1xuICAgICAgZ3JpZEZvclBydW5lZE5vZGUgPSAwOyAgXG4gICAgfVxuICAgIGVsc2UgaWYoY29udHJvbFJlZ2lvbnNbMF0gPT0gMCAmJiBjb250cm9sUmVnaW9uc1syXSA9PSAwICYmIGNvbnRyb2xSZWdpb25zWzNdID09IDApe1xuICAgICAgZ3JpZEZvclBydW5lZE5vZGUgPSAzOyAgXG4gICAgfVxuICAgIGVsc2UgaWYoY29udHJvbFJlZ2lvbnNbMV0gPT0gMCAmJiBjb250cm9sUmVnaW9uc1syXSA9PSAwICYmIGNvbnRyb2xSZWdpb25zWzNdID09IDApe1xuICAgICAgZ3JpZEZvclBydW5lZE5vZGUgPSAyOyAgXG4gICAgfVxuICB9XG4gIGVsc2UgaWYobWluQ291bnQgPT0gMiAmJiBtaW4gPT0gMCl7XG4gICAgdmFyIHJhbmRvbSA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIDIpO1xuICAgIGlmKGNvbnRyb2xSZWdpb25zWzBdID09IDAgJiYgY29udHJvbFJlZ2lvbnNbMV0gPT0gMCl7O1xuICAgICAgaWYocmFuZG9tID09IDApe1xuICAgICAgICBncmlkRm9yUHJ1bmVkTm9kZSA9IDA7XG4gICAgICB9XG4gICAgICBlbHNle1xuICAgICAgICBncmlkRm9yUHJ1bmVkTm9kZSA9IDE7XG4gICAgICB9XG4gICAgfVxuICAgIGVsc2UgaWYoY29udHJvbFJlZ2lvbnNbMF0gPT0gMCAmJiBjb250cm9sUmVnaW9uc1syXSA9PSAwKXtcbiAgICAgIGlmKHJhbmRvbSA9PSAwKXtcbiAgICAgICAgZ3JpZEZvclBydW5lZE5vZGUgPSAwO1xuICAgICAgfVxuICAgICAgZWxzZXtcbiAgICAgICAgZ3JpZEZvclBydW5lZE5vZGUgPSAyO1xuICAgICAgfVxuICAgIH1cbiAgICBlbHNlIGlmKGNvbnRyb2xSZWdpb25zWzBdID09IDAgJiYgY29udHJvbFJlZ2lvbnNbM10gPT0gMCl7XG4gICAgICBpZihyYW5kb20gPT0gMCl7XG4gICAgICAgIGdyaWRGb3JQcnVuZWROb2RlID0gMDtcbiAgICAgIH1cbiAgICAgIGVsc2V7XG4gICAgICAgIGdyaWRGb3JQcnVuZWROb2RlID0gMztcbiAgICAgIH1cbiAgICB9XG4gICAgZWxzZSBpZihjb250cm9sUmVnaW9uc1sxXSA9PSAwICYmIGNvbnRyb2xSZWdpb25zWzJdID09IDApe1xuICAgICAgaWYocmFuZG9tID09IDApe1xuICAgICAgICBncmlkRm9yUHJ1bmVkTm9kZSA9IDE7XG4gICAgICB9XG4gICAgICBlbHNle1xuICAgICAgICBncmlkRm9yUHJ1bmVkTm9kZSA9IDI7XG4gICAgICB9XG4gICAgfVxuICAgIGVsc2UgaWYoY29udHJvbFJlZ2lvbnNbMV0gPT0gMCAmJiBjb250cm9sUmVnaW9uc1szXSA9PSAwKXtcbiAgICAgIGlmKHJhbmRvbSA9PSAwKXtcbiAgICAgICAgZ3JpZEZvclBydW5lZE5vZGUgPSAxO1xuICAgICAgfVxuICAgICAgZWxzZXtcbiAgICAgICAgZ3JpZEZvclBydW5lZE5vZGUgPSAzO1xuICAgICAgfVxuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIGlmKHJhbmRvbSA9PSAwKXtcbiAgICAgICAgZ3JpZEZvclBydW5lZE5vZGUgPSAyO1xuICAgICAgfVxuICAgICAgZWxzZXtcbiAgICAgICAgZ3JpZEZvclBydW5lZE5vZGUgPSAzO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICBlbHNlIGlmKG1pbkNvdW50ID09IDQgJiYgbWluID09IDApe1xuICAgIHZhciByYW5kb20gPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiA0KTtcbiAgICBncmlkRm9yUHJ1bmVkTm9kZSA9IHJhbmRvbTsgIFxuICB9XG4gIGVsc2Uge1xuICAgIGdyaWRGb3JQcnVuZWROb2RlID0gbWluSW5kZXg7XG4gIH1cbiAgXG4gIGlmKGdyaWRGb3JQcnVuZWROb2RlID09IDApIHtcbiAgICBwcnVuZWROb2RlLnNldENlbnRlcihub2RlVG9Db25uZWN0LmdldENlbnRlclgoKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICBub2RlVG9Db25uZWN0LmdldENlbnRlclkoKSAtIG5vZGVUb0Nvbm5lY3QuZ2V0SGVpZ2h0KCkvMiAtIEZETGF5b3V0Q29uc3RhbnRzLkRFRkFVTFRfRURHRV9MRU5HVEggLSBwcnVuZWROb2RlLmdldEhlaWdodCgpLzIpOyAgXG4gIH1cbiAgZWxzZSBpZihncmlkRm9yUHJ1bmVkTm9kZSA9PSAxKSB7XG4gICAgcHJ1bmVkTm9kZS5zZXRDZW50ZXIobm9kZVRvQ29ubmVjdC5nZXRDZW50ZXJYKCkgKyBub2RlVG9Db25uZWN0LmdldFdpZHRoKCkvMiArIEZETGF5b3V0Q29uc3RhbnRzLkRFRkFVTFRfRURHRV9MRU5HVEggKyBwcnVuZWROb2RlLmdldFdpZHRoKCkvMixcbiAgICAgICAgICAgICAgICAgICAgICAgICBub2RlVG9Db25uZWN0LmdldENlbnRlclkoKSk7ICBcbiAgfVxuICBlbHNlIGlmKGdyaWRGb3JQcnVuZWROb2RlID09IDIpIHtcbiAgICBwcnVuZWROb2RlLnNldENlbnRlcihub2RlVG9Db25uZWN0LmdldENlbnRlclgoKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICBub2RlVG9Db25uZWN0LmdldENlbnRlclkoKSArIG5vZGVUb0Nvbm5lY3QuZ2V0SGVpZ2h0KCkvMiArIEZETGF5b3V0Q29uc3RhbnRzLkRFRkFVTFRfRURHRV9MRU5HVEggKyBwcnVuZWROb2RlLmdldEhlaWdodCgpLzIpOyAgXG4gIH1cbiAgZWxzZSB7IFxuICAgIHBydW5lZE5vZGUuc2V0Q2VudGVyKG5vZGVUb0Nvbm5lY3QuZ2V0Q2VudGVyWCgpIC0gbm9kZVRvQ29ubmVjdC5nZXRXaWR0aCgpLzIgLSBGRExheW91dENvbnN0YW50cy5ERUZBVUxUX0VER0VfTEVOR1RIIC0gcHJ1bmVkTm9kZS5nZXRXaWR0aCgpLzIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgbm9kZVRvQ29ubmVjdC5nZXRDZW50ZXJZKCkpOyAgXG4gIH1cbiAgXG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEZETGF5b3V0O1xuIiwidmFyIExheW91dENvbnN0YW50cyA9IHJlcXVpcmUoJy4vTGF5b3V0Q29uc3RhbnRzJyk7XG5cbmZ1bmN0aW9uIEZETGF5b3V0Q29uc3RhbnRzKCkge1xufVxuXG4vL0ZETGF5b3V0Q29uc3RhbnRzIGluaGVyaXRzIHN0YXRpYyBwcm9wcyBpbiBMYXlvdXRDb25zdGFudHNcbmZvciAodmFyIHByb3AgaW4gTGF5b3V0Q29uc3RhbnRzKSB7XG4gIEZETGF5b3V0Q29uc3RhbnRzW3Byb3BdID0gTGF5b3V0Q29uc3RhbnRzW3Byb3BdO1xufVxuXG5GRExheW91dENvbnN0YW50cy5NQVhfSVRFUkFUSU9OUyA9IDI1MDA7XG5cbkZETGF5b3V0Q29uc3RhbnRzLkRFRkFVTFRfRURHRV9MRU5HVEggPSA1MDtcbkZETGF5b3V0Q29uc3RhbnRzLkRFRkFVTFRfU1BSSU5HX1NUUkVOR1RIID0gMC40NTtcbkZETGF5b3V0Q29uc3RhbnRzLkRFRkFVTFRfUkVQVUxTSU9OX1NUUkVOR1RIID0gNDUwMC4wO1xuRkRMYXlvdXRDb25zdGFudHMuREVGQVVMVF9HUkFWSVRZX1NUUkVOR1RIID0gMC40O1xuRkRMYXlvdXRDb25zdGFudHMuREVGQVVMVF9DT01QT1VORF9HUkFWSVRZX1NUUkVOR1RIID0gMS4wO1xuRkRMYXlvdXRDb25zdGFudHMuREVGQVVMVF9HUkFWSVRZX1JBTkdFX0ZBQ1RPUiA9IDMuODtcbkZETGF5b3V0Q29uc3RhbnRzLkRFRkFVTFRfQ09NUE9VTkRfR1JBVklUWV9SQU5HRV9GQUNUT1IgPSAxLjU7XG5GRExheW91dENvbnN0YW50cy5ERUZBVUxUX1VTRV9TTUFSVF9JREVBTF9FREdFX0xFTkdUSF9DQUxDVUxBVElPTiA9IHRydWU7XG5GRExheW91dENvbnN0YW50cy5ERUZBVUxUX1VTRV9TTUFSVF9SRVBVTFNJT05fUkFOR0VfQ0FMQ1VMQVRJT04gPSB0cnVlO1xuRkRMYXlvdXRDb25zdGFudHMuREVGQVVMVF9DT09MSU5HX0ZBQ1RPUl9JTkNSRU1FTlRBTCA9IDAuNTtcbkZETGF5b3V0Q29uc3RhbnRzLk1BWF9OT0RFX0RJU1BMQUNFTUVOVF9JTkNSRU1FTlRBTCA9IDEwMC4wO1xuRkRMYXlvdXRDb25zdGFudHMuTUFYX05PREVfRElTUExBQ0VNRU5UID0gRkRMYXlvdXRDb25zdGFudHMuTUFYX05PREVfRElTUExBQ0VNRU5UX0lOQ1JFTUVOVEFMICogMztcbkZETGF5b3V0Q29uc3RhbnRzLk1JTl9SRVBVTFNJT05fRElTVCA9IEZETGF5b3V0Q29uc3RhbnRzLkRFRkFVTFRfRURHRV9MRU5HVEggLyAxMC4wO1xuRkRMYXlvdXRDb25zdGFudHMuQ09OVkVSR0VOQ0VfQ0hFQ0tfUEVSSU9EID0gMTAwO1xuRkRMYXlvdXRDb25zdGFudHMuUEVSX0xFVkVMX0lERUFMX0VER0VfTEVOR1RIX0ZBQ1RPUiA9IDAuMTtcbkZETGF5b3V0Q29uc3RhbnRzLk1JTl9FREdFX0xFTkdUSCA9IDE7XG5GRExheW91dENvbnN0YW50cy5HUklEX0NBTENVTEFUSU9OX0NIRUNLX1BFUklPRCA9IDEwO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEZETGF5b3V0Q29uc3RhbnRzO1xuIiwidmFyIExFZGdlID0gcmVxdWlyZSgnLi9MRWRnZScpO1xudmFyIEZETGF5b3V0Q29uc3RhbnRzID0gcmVxdWlyZSgnLi9GRExheW91dENvbnN0YW50cycpO1xuXG5mdW5jdGlvbiBGRExheW91dEVkZ2Uoc291cmNlLCB0YXJnZXQsIHZFZGdlKSB7XG4gIExFZGdlLmNhbGwodGhpcywgc291cmNlLCB0YXJnZXQsIHZFZGdlKTtcbiAgdGhpcy5pZGVhbExlbmd0aCA9IEZETGF5b3V0Q29uc3RhbnRzLkRFRkFVTFRfRURHRV9MRU5HVEg7XG59XG5cbkZETGF5b3V0RWRnZS5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKExFZGdlLnByb3RvdHlwZSk7XG5cbmZvciAodmFyIHByb3AgaW4gTEVkZ2UpIHtcbiAgRkRMYXlvdXRFZGdlW3Byb3BdID0gTEVkZ2VbcHJvcF07XG59XG5cbm1vZHVsZS5leHBvcnRzID0gRkRMYXlvdXRFZGdlO1xuIiwidmFyIExOb2RlID0gcmVxdWlyZSgnLi9MTm9kZScpO1xuXG5mdW5jdGlvbiBGRExheW91dE5vZGUoZ20sIGxvYywgc2l6ZSwgdk5vZGUpIHtcbiAgLy8gYWx0ZXJuYXRpdmUgY29uc3RydWN0b3IgaXMgaGFuZGxlZCBpbnNpZGUgTE5vZGVcbiAgTE5vZGUuY2FsbCh0aGlzLCBnbSwgbG9jLCBzaXplLCB2Tm9kZSk7XG4gIC8vU3ByaW5nLCByZXB1bHNpb24gYW5kIGdyYXZpdGF0aW9uYWwgZm9yY2VzIGFjdGluZyBvbiB0aGlzIG5vZGVcbiAgdGhpcy5zcHJpbmdGb3JjZVggPSAwO1xuICB0aGlzLnNwcmluZ0ZvcmNlWSA9IDA7XG4gIHRoaXMucmVwdWxzaW9uRm9yY2VYID0gMDtcbiAgdGhpcy5yZXB1bHNpb25Gb3JjZVkgPSAwO1xuICB0aGlzLmdyYXZpdGF0aW9uRm9yY2VYID0gMDtcbiAgdGhpcy5ncmF2aXRhdGlvbkZvcmNlWSA9IDA7XG4gIC8vQW1vdW50IGJ5IHdoaWNoIHRoaXMgbm9kZSBpcyB0byBiZSBtb3ZlZCBpbiB0aGlzIGl0ZXJhdGlvblxuICB0aGlzLmRpc3BsYWNlbWVudFggPSAwO1xuICB0aGlzLmRpc3BsYWNlbWVudFkgPSAwO1xuXG4gIC8vU3RhcnQgYW5kIGZpbmlzaCBncmlkIGNvb3JkaW5hdGVzIHRoYXQgdGhpcyBub2RlIGlzIGZhbGxlbiBpbnRvXG4gIHRoaXMuc3RhcnRYID0gMDtcbiAgdGhpcy5maW5pc2hYID0gMDtcbiAgdGhpcy5zdGFydFkgPSAwO1xuICB0aGlzLmZpbmlzaFkgPSAwO1xuXG4gIC8vR2VvbWV0cmljIG5laWdoYm9ycyBvZiB0aGlzIG5vZGVcbiAgdGhpcy5zdXJyb3VuZGluZyA9IFtdO1xufVxuXG5GRExheW91dE5vZGUucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShMTm9kZS5wcm90b3R5cGUpO1xuXG5mb3IgKHZhciBwcm9wIGluIExOb2RlKSB7XG4gIEZETGF5b3V0Tm9kZVtwcm9wXSA9IExOb2RlW3Byb3BdO1xufVxuXG5GRExheW91dE5vZGUucHJvdG90eXBlLnNldEdyaWRDb29yZGluYXRlcyA9IGZ1bmN0aW9uIChfc3RhcnRYLCBfZmluaXNoWCwgX3N0YXJ0WSwgX2ZpbmlzaFkpXG57XG4gIHRoaXMuc3RhcnRYID0gX3N0YXJ0WDtcbiAgdGhpcy5maW5pc2hYID0gX2ZpbmlzaFg7XG4gIHRoaXMuc3RhcnRZID0gX3N0YXJ0WTtcbiAgdGhpcy5maW5pc2hZID0gX2ZpbmlzaFk7XG5cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gRkRMYXlvdXROb2RlO1xuIiwidmFyIFVuaXF1ZUlER2VuZXJldG9yID0gcmVxdWlyZSgnLi9VbmlxdWVJREdlbmVyZXRvcicpO1xuXG5mdW5jdGlvbiBIYXNoTWFwKCkge1xuICB0aGlzLm1hcCA9IHt9O1xuICB0aGlzLmtleXMgPSBbXTtcbn1cblxuSGFzaE1hcC5wcm90b3R5cGUucHV0ID0gZnVuY3Rpb24gKGtleSwgdmFsdWUpIHtcbiAgdmFyIHRoZUlkID0gVW5pcXVlSURHZW5lcmV0b3IuY3JlYXRlSUQoa2V5KTtcbiAgaWYgKCF0aGlzLmNvbnRhaW5zKHRoZUlkKSkge1xuICAgIHRoaXMubWFwW3RoZUlkXSA9IHZhbHVlO1xuICAgIHRoaXMua2V5cy5wdXNoKGtleSk7XG4gIH1cbn07XG5cbkhhc2hNYXAucHJvdG90eXBlLmNvbnRhaW5zID0gZnVuY3Rpb24gKGtleSkge1xuICB2YXIgdGhlSWQgPSBVbmlxdWVJREdlbmVyZXRvci5jcmVhdGVJRChrZXkpO1xuICByZXR1cm4gdGhpcy5tYXBba2V5XSAhPSBudWxsO1xufTtcblxuSGFzaE1hcC5wcm90b3R5cGUuZ2V0ID0gZnVuY3Rpb24gKGtleSkge1xuICB2YXIgdGhlSWQgPSBVbmlxdWVJREdlbmVyZXRvci5jcmVhdGVJRChrZXkpO1xuICByZXR1cm4gdGhpcy5tYXBbdGhlSWRdO1xufTtcblxuSGFzaE1hcC5wcm90b3R5cGUua2V5U2V0ID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4gdGhpcy5rZXlzO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBIYXNoTWFwO1xuIiwidmFyIFVuaXF1ZUlER2VuZXJldG9yID0gcmVxdWlyZSgnLi9VbmlxdWVJREdlbmVyZXRvcicpO1xuXG5mdW5jdGlvbiBIYXNoU2V0KCkge1xuICB0aGlzLnNldCA9IHt9O1xufVxuO1xuXG5IYXNoU2V0LnByb3RvdHlwZS5hZGQgPSBmdW5jdGlvbiAob2JqKSB7XG4gIHZhciB0aGVJZCA9IFVuaXF1ZUlER2VuZXJldG9yLmNyZWF0ZUlEKG9iaik7XG4gIGlmICghdGhpcy5jb250YWlucyh0aGVJZCkpXG4gICAgdGhpcy5zZXRbdGhlSWRdID0gb2JqO1xufTtcblxuSGFzaFNldC5wcm90b3R5cGUucmVtb3ZlID0gZnVuY3Rpb24gKG9iaikge1xuICBkZWxldGUgdGhpcy5zZXRbVW5pcXVlSURHZW5lcmV0b3IuY3JlYXRlSUQob2JqKV07XG59O1xuXG5IYXNoU2V0LnByb3RvdHlwZS5jbGVhciA9IGZ1bmN0aW9uICgpIHtcbiAgdGhpcy5zZXQgPSB7fTtcbn07XG5cbkhhc2hTZXQucHJvdG90eXBlLmNvbnRhaW5zID0gZnVuY3Rpb24gKG9iaikge1xuICByZXR1cm4gdGhpcy5zZXRbVW5pcXVlSURHZW5lcmV0b3IuY3JlYXRlSUQob2JqKV0gPT0gb2JqO1xufTtcblxuSGFzaFNldC5wcm90b3R5cGUuaXNFbXB0eSA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIHRoaXMuc2l6ZSgpID09PSAwO1xufTtcblxuSGFzaFNldC5wcm90b3R5cGUuc2l6ZSA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIE9iamVjdC5rZXlzKHRoaXMuc2V0KS5sZW5ndGg7XG59O1xuXG4vL2NvbmNhdHMgdGhpcy5zZXQgdG8gdGhlIGdpdmVuIGxpc3Rcbkhhc2hTZXQucHJvdG90eXBlLmFkZEFsbFRvID0gZnVuY3Rpb24gKGxpc3QpIHtcbiAgdmFyIGtleXMgPSBPYmplY3Qua2V5cyh0aGlzLnNldCk7XG4gIHZhciBsZW5ndGggPSBrZXlzLmxlbmd0aDtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgIGxpc3QucHVzaCh0aGlzLnNldFtrZXlzW2ldXSk7XG4gIH1cbn07XG5cbkhhc2hTZXQucHJvdG90eXBlLnNpemUgPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiBPYmplY3Qua2V5cyh0aGlzLnNldCkubGVuZ3RoO1xufTtcblxuSGFzaFNldC5wcm90b3R5cGUuYWRkQWxsID0gZnVuY3Rpb24gKGxpc3QpIHtcbiAgdmFyIHMgPSBsaXN0Lmxlbmd0aDtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBzOyBpKyspIHtcbiAgICB2YXIgdiA9IGxpc3RbaV07XG4gICAgdGhpcy5hZGQodik7XG4gIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gSGFzaFNldDtcbiIsImZ1bmN0aW9uIElHZW9tZXRyeSgpIHtcbn1cblxuSUdlb21ldHJ5LmNhbGNTZXBhcmF0aW9uQW1vdW50ID0gZnVuY3Rpb24gKHJlY3RBLCByZWN0Qiwgb3ZlcmxhcEFtb3VudCwgc2VwYXJhdGlvbkJ1ZmZlcilcbntcbiAgaWYgKCFyZWN0QS5pbnRlcnNlY3RzKHJlY3RCKSkge1xuICAgIHRocm93IFwiYXNzZXJ0IGZhaWxlZFwiO1xuICB9XG4gIHZhciBkaXJlY3Rpb25zID0gbmV3IEFycmF5KDIpO1xuICBJR2VvbWV0cnkuZGVjaWRlRGlyZWN0aW9uc0Zvck92ZXJsYXBwaW5nTm9kZXMocmVjdEEsIHJlY3RCLCBkaXJlY3Rpb25zKTtcbiAgb3ZlcmxhcEFtb3VudFswXSA9IE1hdGgubWluKHJlY3RBLmdldFJpZ2h0KCksIHJlY3RCLmdldFJpZ2h0KCkpIC1cbiAgICAgICAgICBNYXRoLm1heChyZWN0QS54LCByZWN0Qi54KTtcbiAgb3ZlcmxhcEFtb3VudFsxXSA9IE1hdGgubWluKHJlY3RBLmdldEJvdHRvbSgpLCByZWN0Qi5nZXRCb3R0b20oKSkgLVxuICAgICAgICAgIE1hdGgubWF4KHJlY3RBLnksIHJlY3RCLnkpO1xuICAvLyB1cGRhdGUgdGhlIG92ZXJsYXBwaW5nIGFtb3VudHMgZm9yIHRoZSBmb2xsb3dpbmcgY2FzZXM6XG4gIGlmICgocmVjdEEuZ2V0WCgpIDw9IHJlY3RCLmdldFgoKSkgJiYgKHJlY3RBLmdldFJpZ2h0KCkgPj0gcmVjdEIuZ2V0UmlnaHQoKSkpXG4gIHtcbiAgICBvdmVybGFwQW1vdW50WzBdICs9IE1hdGgubWluKChyZWN0Qi5nZXRYKCkgLSByZWN0QS5nZXRYKCkpLFxuICAgICAgICAgICAgKHJlY3RBLmdldFJpZ2h0KCkgLSByZWN0Qi5nZXRSaWdodCgpKSk7XG4gIH1cbiAgZWxzZSBpZiAoKHJlY3RCLmdldFgoKSA8PSByZWN0QS5nZXRYKCkpICYmIChyZWN0Qi5nZXRSaWdodCgpID49IHJlY3RBLmdldFJpZ2h0KCkpKVxuICB7XG4gICAgb3ZlcmxhcEFtb3VudFswXSArPSBNYXRoLm1pbigocmVjdEEuZ2V0WCgpIC0gcmVjdEIuZ2V0WCgpKSxcbiAgICAgICAgICAgIChyZWN0Qi5nZXRSaWdodCgpIC0gcmVjdEEuZ2V0UmlnaHQoKSkpO1xuICB9XG4gIGlmICgocmVjdEEuZ2V0WSgpIDw9IHJlY3RCLmdldFkoKSkgJiYgKHJlY3RBLmdldEJvdHRvbSgpID49IHJlY3RCLmdldEJvdHRvbSgpKSlcbiAge1xuICAgIG92ZXJsYXBBbW91bnRbMV0gKz0gTWF0aC5taW4oKHJlY3RCLmdldFkoKSAtIHJlY3RBLmdldFkoKSksXG4gICAgICAgICAgICAocmVjdEEuZ2V0Qm90dG9tKCkgLSByZWN0Qi5nZXRCb3R0b20oKSkpO1xuICB9XG4gIGVsc2UgaWYgKChyZWN0Qi5nZXRZKCkgPD0gcmVjdEEuZ2V0WSgpKSAmJiAocmVjdEIuZ2V0Qm90dG9tKCkgPj0gcmVjdEEuZ2V0Qm90dG9tKCkpKVxuICB7XG4gICAgb3ZlcmxhcEFtb3VudFsxXSArPSBNYXRoLm1pbigocmVjdEEuZ2V0WSgpIC0gcmVjdEIuZ2V0WSgpKSxcbiAgICAgICAgICAgIChyZWN0Qi5nZXRCb3R0b20oKSAtIHJlY3RBLmdldEJvdHRvbSgpKSk7XG4gIH1cblxuICAvLyBmaW5kIHNsb3BlIG9mIHRoZSBsaW5lIHBhc3NlcyB0d28gY2VudGVyc1xuICB2YXIgc2xvcGUgPSBNYXRoLmFicygocmVjdEIuZ2V0Q2VudGVyWSgpIC0gcmVjdEEuZ2V0Q2VudGVyWSgpKSAvXG4gICAgICAgICAgKHJlY3RCLmdldENlbnRlclgoKSAtIHJlY3RBLmdldENlbnRlclgoKSkpO1xuICAvLyBpZiBjZW50ZXJzIGFyZSBvdmVybGFwcGVkXG4gIGlmICgocmVjdEIuZ2V0Q2VudGVyWSgpID09IHJlY3RBLmdldENlbnRlclkoKSkgJiZcbiAgICAgICAgICAocmVjdEIuZ2V0Q2VudGVyWCgpID09IHJlY3RBLmdldENlbnRlclgoKSkpXG4gIHtcbiAgICAvLyBhc3N1bWUgdGhlIHNsb3BlIGlzIDEgKDQ1IGRlZ3JlZSlcbiAgICBzbG9wZSA9IDEuMDtcbiAgfVxuXG4gIHZhciBtb3ZlQnlZID0gc2xvcGUgKiBvdmVybGFwQW1vdW50WzBdO1xuICB2YXIgbW92ZUJ5WCA9IG92ZXJsYXBBbW91bnRbMV0gLyBzbG9wZTtcbiAgaWYgKG92ZXJsYXBBbW91bnRbMF0gPCBtb3ZlQnlYKVxuICB7XG4gICAgbW92ZUJ5WCA9IG92ZXJsYXBBbW91bnRbMF07XG4gIH1cbiAgZWxzZVxuICB7XG4gICAgbW92ZUJ5WSA9IG92ZXJsYXBBbW91bnRbMV07XG4gIH1cbiAgLy8gcmV0dXJuIGhhbGYgdGhlIGFtb3VudCBzbyB0aGF0IGlmIGVhY2ggcmVjdGFuZ2xlIGlzIG1vdmVkIGJ5IHRoZXNlXG4gIC8vIGFtb3VudHMgaW4gb3Bwb3NpdGUgZGlyZWN0aW9ucywgb3ZlcmxhcCB3aWxsIGJlIHJlc29sdmVkXG4gIG92ZXJsYXBBbW91bnRbMF0gPSAtMSAqIGRpcmVjdGlvbnNbMF0gKiAoKG1vdmVCeVggLyAyKSArIHNlcGFyYXRpb25CdWZmZXIpO1xuICBvdmVybGFwQW1vdW50WzFdID0gLTEgKiBkaXJlY3Rpb25zWzFdICogKChtb3ZlQnlZIC8gMikgKyBzZXBhcmF0aW9uQnVmZmVyKTtcbn1cblxuSUdlb21ldHJ5LmRlY2lkZURpcmVjdGlvbnNGb3JPdmVybGFwcGluZ05vZGVzID0gZnVuY3Rpb24gKHJlY3RBLCByZWN0QiwgZGlyZWN0aW9ucylcbntcbiAgaWYgKHJlY3RBLmdldENlbnRlclgoKSA8IHJlY3RCLmdldENlbnRlclgoKSlcbiAge1xuICAgIGRpcmVjdGlvbnNbMF0gPSAtMTtcbiAgfVxuICBlbHNlXG4gIHtcbiAgICBkaXJlY3Rpb25zWzBdID0gMTtcbiAgfVxuXG4gIGlmIChyZWN0QS5nZXRDZW50ZXJZKCkgPCByZWN0Qi5nZXRDZW50ZXJZKCkpXG4gIHtcbiAgICBkaXJlY3Rpb25zWzFdID0gLTE7XG4gIH1cbiAgZWxzZVxuICB7XG4gICAgZGlyZWN0aW9uc1sxXSA9IDE7XG4gIH1cbn1cblxuSUdlb21ldHJ5LmdldEludGVyc2VjdGlvbjIgPSBmdW5jdGlvbiAocmVjdEEsIHJlY3RCLCByZXN1bHQpXG57XG4gIC8vcmVzdWx0WzAtMV0gd2lsbCBjb250YWluIGNsaXBQb2ludCBvZiByZWN0QSwgcmVzdWx0WzItM10gd2lsbCBjb250YWluIGNsaXBQb2ludCBvZiByZWN0QlxuICB2YXIgcDF4ID0gcmVjdEEuZ2V0Q2VudGVyWCgpO1xuICB2YXIgcDF5ID0gcmVjdEEuZ2V0Q2VudGVyWSgpO1xuICB2YXIgcDJ4ID0gcmVjdEIuZ2V0Q2VudGVyWCgpO1xuICB2YXIgcDJ5ID0gcmVjdEIuZ2V0Q2VudGVyWSgpO1xuXG4gIC8vaWYgdHdvIHJlY3RhbmdsZXMgaW50ZXJzZWN0LCB0aGVuIGNsaXBwaW5nIHBvaW50cyBhcmUgY2VudGVyc1xuICBpZiAocmVjdEEuaW50ZXJzZWN0cyhyZWN0QikpXG4gIHtcbiAgICByZXN1bHRbMF0gPSBwMXg7XG4gICAgcmVzdWx0WzFdID0gcDF5O1xuICAgIHJlc3VsdFsyXSA9IHAyeDtcbiAgICByZXN1bHRbM10gPSBwMnk7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbiAgLy92YXJpYWJsZXMgZm9yIHJlY3RBXG4gIHZhciB0b3BMZWZ0QXggPSByZWN0QS5nZXRYKCk7XG4gIHZhciB0b3BMZWZ0QXkgPSByZWN0QS5nZXRZKCk7XG4gIHZhciB0b3BSaWdodEF4ID0gcmVjdEEuZ2V0UmlnaHQoKTtcbiAgdmFyIGJvdHRvbUxlZnRBeCA9IHJlY3RBLmdldFgoKTtcbiAgdmFyIGJvdHRvbUxlZnRBeSA9IHJlY3RBLmdldEJvdHRvbSgpO1xuICB2YXIgYm90dG9tUmlnaHRBeCA9IHJlY3RBLmdldFJpZ2h0KCk7XG4gIHZhciBoYWxmV2lkdGhBID0gcmVjdEEuZ2V0V2lkdGhIYWxmKCk7XG4gIHZhciBoYWxmSGVpZ2h0QSA9IHJlY3RBLmdldEhlaWdodEhhbGYoKTtcbiAgLy92YXJpYWJsZXMgZm9yIHJlY3RCXG4gIHZhciB0b3BMZWZ0QnggPSByZWN0Qi5nZXRYKCk7XG4gIHZhciB0b3BMZWZ0QnkgPSByZWN0Qi5nZXRZKCk7XG4gIHZhciB0b3BSaWdodEJ4ID0gcmVjdEIuZ2V0UmlnaHQoKTtcbiAgdmFyIGJvdHRvbUxlZnRCeCA9IHJlY3RCLmdldFgoKTtcbiAgdmFyIGJvdHRvbUxlZnRCeSA9IHJlY3RCLmdldEJvdHRvbSgpO1xuICB2YXIgYm90dG9tUmlnaHRCeCA9IHJlY3RCLmdldFJpZ2h0KCk7XG4gIHZhciBoYWxmV2lkdGhCID0gcmVjdEIuZ2V0V2lkdGhIYWxmKCk7XG4gIHZhciBoYWxmSGVpZ2h0QiA9IHJlY3RCLmdldEhlaWdodEhhbGYoKTtcbiAgLy9mbGFnIHdoZXRoZXIgY2xpcHBpbmcgcG9pbnRzIGFyZSBmb3VuZFxuICB2YXIgY2xpcFBvaW50QUZvdW5kID0gZmFsc2U7XG4gIHZhciBjbGlwUG9pbnRCRm91bmQgPSBmYWxzZTtcblxuICAvLyBsaW5lIGlzIHZlcnRpY2FsXG4gIGlmIChwMXggPT0gcDJ4KVxuICB7XG4gICAgaWYgKHAxeSA+IHAyeSlcbiAgICB7XG4gICAgICByZXN1bHRbMF0gPSBwMXg7XG4gICAgICByZXN1bHRbMV0gPSB0b3BMZWZ0QXk7XG4gICAgICByZXN1bHRbMl0gPSBwMng7XG4gICAgICByZXN1bHRbM10gPSBib3R0b21MZWZ0Qnk7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGVsc2UgaWYgKHAxeSA8IHAyeSlcbiAgICB7XG4gICAgICByZXN1bHRbMF0gPSBwMXg7XG4gICAgICByZXN1bHRbMV0gPSBib3R0b21MZWZ0QXk7XG4gICAgICByZXN1bHRbMl0gPSBwMng7XG4gICAgICByZXN1bHRbM10gPSB0b3BMZWZ0Qnk7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGVsc2VcbiAgICB7XG4gICAgICAvL25vdCBsaW5lLCByZXR1cm4gbnVsbDtcbiAgICB9XG4gIH1cbiAgLy8gbGluZSBpcyBob3Jpem9udGFsXG4gIGVsc2UgaWYgKHAxeSA9PSBwMnkpXG4gIHtcbiAgICBpZiAocDF4ID4gcDJ4KVxuICAgIHtcbiAgICAgIHJlc3VsdFswXSA9IHRvcExlZnRBeDtcbiAgICAgIHJlc3VsdFsxXSA9IHAxeTtcbiAgICAgIHJlc3VsdFsyXSA9IHRvcFJpZ2h0Qng7XG4gICAgICByZXN1bHRbM10gPSBwMnk7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGVsc2UgaWYgKHAxeCA8IHAyeClcbiAgICB7XG4gICAgICByZXN1bHRbMF0gPSB0b3BSaWdodEF4O1xuICAgICAgcmVzdWx0WzFdID0gcDF5O1xuICAgICAgcmVzdWx0WzJdID0gdG9wTGVmdEJ4O1xuICAgICAgcmVzdWx0WzNdID0gcDJ5O1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBlbHNlXG4gICAge1xuICAgICAgLy9ub3QgdmFsaWQgbGluZSwgcmV0dXJuIG51bGw7XG4gICAgfVxuICB9XG4gIGVsc2VcbiAge1xuICAgIC8vc2xvcGVzIG9mIHJlY3RBJ3MgYW5kIHJlY3RCJ3MgZGlhZ29uYWxzXG4gICAgdmFyIHNsb3BlQSA9IHJlY3RBLmhlaWdodCAvIHJlY3RBLndpZHRoO1xuICAgIHZhciBzbG9wZUIgPSByZWN0Qi5oZWlnaHQgLyByZWN0Qi53aWR0aDtcblxuICAgIC8vc2xvcGUgb2YgbGluZSBiZXR3ZWVuIGNlbnRlciBvZiByZWN0QSBhbmQgY2VudGVyIG9mIHJlY3RCXG4gICAgdmFyIHNsb3BlUHJpbWUgPSAocDJ5IC0gcDF5KSAvIChwMnggLSBwMXgpO1xuICAgIHZhciBjYXJkaW5hbERpcmVjdGlvbkE7XG4gICAgdmFyIGNhcmRpbmFsRGlyZWN0aW9uQjtcbiAgICB2YXIgdGVtcFBvaW50QXg7XG4gICAgdmFyIHRlbXBQb2ludEF5O1xuICAgIHZhciB0ZW1wUG9pbnRCeDtcbiAgICB2YXIgdGVtcFBvaW50Qnk7XG5cbiAgICAvL2RldGVybWluZSB3aGV0aGVyIGNsaXBwaW5nIHBvaW50IGlzIHRoZSBjb3JuZXIgb2Ygbm9kZUFcbiAgICBpZiAoKC1zbG9wZUEpID09IHNsb3BlUHJpbWUpXG4gICAge1xuICAgICAgaWYgKHAxeCA+IHAyeClcbiAgICAgIHtcbiAgICAgICAgcmVzdWx0WzBdID0gYm90dG9tTGVmdEF4O1xuICAgICAgICByZXN1bHRbMV0gPSBib3R0b21MZWZ0QXk7XG4gICAgICAgIGNsaXBQb2ludEFGb3VuZCA9IHRydWU7XG4gICAgICB9XG4gICAgICBlbHNlXG4gICAgICB7XG4gICAgICAgIHJlc3VsdFswXSA9IHRvcFJpZ2h0QXg7XG4gICAgICAgIHJlc3VsdFsxXSA9IHRvcExlZnRBeTtcbiAgICAgICAgY2xpcFBvaW50QUZvdW5kID0gdHJ1ZTtcbiAgICAgIH1cbiAgICB9XG4gICAgZWxzZSBpZiAoc2xvcGVBID09IHNsb3BlUHJpbWUpXG4gICAge1xuICAgICAgaWYgKHAxeCA+IHAyeClcbiAgICAgIHtcbiAgICAgICAgcmVzdWx0WzBdID0gdG9wTGVmdEF4O1xuICAgICAgICByZXN1bHRbMV0gPSB0b3BMZWZ0QXk7XG4gICAgICAgIGNsaXBQb2ludEFGb3VuZCA9IHRydWU7XG4gICAgICB9XG4gICAgICBlbHNlXG4gICAgICB7XG4gICAgICAgIHJlc3VsdFswXSA9IGJvdHRvbVJpZ2h0QXg7XG4gICAgICAgIHJlc3VsdFsxXSA9IGJvdHRvbUxlZnRBeTtcbiAgICAgICAgY2xpcFBvaW50QUZvdW5kID0gdHJ1ZTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvL2RldGVybWluZSB3aGV0aGVyIGNsaXBwaW5nIHBvaW50IGlzIHRoZSBjb3JuZXIgb2Ygbm9kZUJcbiAgICBpZiAoKC1zbG9wZUIpID09IHNsb3BlUHJpbWUpXG4gICAge1xuICAgICAgaWYgKHAyeCA+IHAxeClcbiAgICAgIHtcbiAgICAgICAgcmVzdWx0WzJdID0gYm90dG9tTGVmdEJ4O1xuICAgICAgICByZXN1bHRbM10gPSBib3R0b21MZWZ0Qnk7XG4gICAgICAgIGNsaXBQb2ludEJGb3VuZCA9IHRydWU7XG4gICAgICB9XG4gICAgICBlbHNlXG4gICAgICB7XG4gICAgICAgIHJlc3VsdFsyXSA9IHRvcFJpZ2h0Qng7XG4gICAgICAgIHJlc3VsdFszXSA9IHRvcExlZnRCeTtcbiAgICAgICAgY2xpcFBvaW50QkZvdW5kID0gdHJ1ZTtcbiAgICAgIH1cbiAgICB9XG4gICAgZWxzZSBpZiAoc2xvcGVCID09IHNsb3BlUHJpbWUpXG4gICAge1xuICAgICAgaWYgKHAyeCA+IHAxeClcbiAgICAgIHtcbiAgICAgICAgcmVzdWx0WzJdID0gdG9wTGVmdEJ4O1xuICAgICAgICByZXN1bHRbM10gPSB0b3BMZWZ0Qnk7XG4gICAgICAgIGNsaXBQb2ludEJGb3VuZCA9IHRydWU7XG4gICAgICB9XG4gICAgICBlbHNlXG4gICAgICB7XG4gICAgICAgIHJlc3VsdFsyXSA9IGJvdHRvbVJpZ2h0Qng7XG4gICAgICAgIHJlc3VsdFszXSA9IGJvdHRvbUxlZnRCeTtcbiAgICAgICAgY2xpcFBvaW50QkZvdW5kID0gdHJ1ZTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvL2lmIGJvdGggY2xpcHBpbmcgcG9pbnRzIGFyZSBjb3JuZXJzXG4gICAgaWYgKGNsaXBQb2ludEFGb3VuZCAmJiBjbGlwUG9pbnRCRm91bmQpXG4gICAge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIC8vZGV0ZXJtaW5lIENhcmRpbmFsIERpcmVjdGlvbiBvZiByZWN0YW5nbGVzXG4gICAgaWYgKHAxeCA+IHAyeClcbiAgICB7XG4gICAgICBpZiAocDF5ID4gcDJ5KVxuICAgICAge1xuICAgICAgICBjYXJkaW5hbERpcmVjdGlvbkEgPSBJR2VvbWV0cnkuZ2V0Q2FyZGluYWxEaXJlY3Rpb24oc2xvcGVBLCBzbG9wZVByaW1lLCA0KTtcbiAgICAgICAgY2FyZGluYWxEaXJlY3Rpb25CID0gSUdlb21ldHJ5LmdldENhcmRpbmFsRGlyZWN0aW9uKHNsb3BlQiwgc2xvcGVQcmltZSwgMik7XG4gICAgICB9XG4gICAgICBlbHNlXG4gICAgICB7XG4gICAgICAgIGNhcmRpbmFsRGlyZWN0aW9uQSA9IElHZW9tZXRyeS5nZXRDYXJkaW5hbERpcmVjdGlvbigtc2xvcGVBLCBzbG9wZVByaW1lLCAzKTtcbiAgICAgICAgY2FyZGluYWxEaXJlY3Rpb25CID0gSUdlb21ldHJ5LmdldENhcmRpbmFsRGlyZWN0aW9uKC1zbG9wZUIsIHNsb3BlUHJpbWUsIDEpO1xuICAgICAgfVxuICAgIH1cbiAgICBlbHNlXG4gICAge1xuICAgICAgaWYgKHAxeSA+IHAyeSlcbiAgICAgIHtcbiAgICAgICAgY2FyZGluYWxEaXJlY3Rpb25BID0gSUdlb21ldHJ5LmdldENhcmRpbmFsRGlyZWN0aW9uKC1zbG9wZUEsIHNsb3BlUHJpbWUsIDEpO1xuICAgICAgICBjYXJkaW5hbERpcmVjdGlvbkIgPSBJR2VvbWV0cnkuZ2V0Q2FyZGluYWxEaXJlY3Rpb24oLXNsb3BlQiwgc2xvcGVQcmltZSwgMyk7XG4gICAgICB9XG4gICAgICBlbHNlXG4gICAgICB7XG4gICAgICAgIGNhcmRpbmFsRGlyZWN0aW9uQSA9IElHZW9tZXRyeS5nZXRDYXJkaW5hbERpcmVjdGlvbihzbG9wZUEsIHNsb3BlUHJpbWUsIDIpO1xuICAgICAgICBjYXJkaW5hbERpcmVjdGlvbkIgPSBJR2VvbWV0cnkuZ2V0Q2FyZGluYWxEaXJlY3Rpb24oc2xvcGVCLCBzbG9wZVByaW1lLCA0KTtcbiAgICAgIH1cbiAgICB9XG4gICAgLy9jYWxjdWxhdGUgY2xpcHBpbmcgUG9pbnQgaWYgaXQgaXMgbm90IGZvdW5kIGJlZm9yZVxuICAgIGlmICghY2xpcFBvaW50QUZvdW5kKVxuICAgIHtcbiAgICAgIHN3aXRjaCAoY2FyZGluYWxEaXJlY3Rpb25BKVxuICAgICAge1xuICAgICAgICBjYXNlIDE6XG4gICAgICAgICAgdGVtcFBvaW50QXkgPSB0b3BMZWZ0QXk7XG4gICAgICAgICAgdGVtcFBvaW50QXggPSBwMXggKyAoLWhhbGZIZWlnaHRBKSAvIHNsb3BlUHJpbWU7XG4gICAgICAgICAgcmVzdWx0WzBdID0gdGVtcFBvaW50QXg7XG4gICAgICAgICAgcmVzdWx0WzFdID0gdGVtcFBvaW50QXk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgMjpcbiAgICAgICAgICB0ZW1wUG9pbnRBeCA9IGJvdHRvbVJpZ2h0QXg7XG4gICAgICAgICAgdGVtcFBvaW50QXkgPSBwMXkgKyBoYWxmV2lkdGhBICogc2xvcGVQcmltZTtcbiAgICAgICAgICByZXN1bHRbMF0gPSB0ZW1wUG9pbnRBeDtcbiAgICAgICAgICByZXN1bHRbMV0gPSB0ZW1wUG9pbnRBeTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAzOlxuICAgICAgICAgIHRlbXBQb2ludEF5ID0gYm90dG9tTGVmdEF5O1xuICAgICAgICAgIHRlbXBQb2ludEF4ID0gcDF4ICsgaGFsZkhlaWdodEEgLyBzbG9wZVByaW1lO1xuICAgICAgICAgIHJlc3VsdFswXSA9IHRlbXBQb2ludEF4O1xuICAgICAgICAgIHJlc3VsdFsxXSA9IHRlbXBQb2ludEF5O1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIDQ6XG4gICAgICAgICAgdGVtcFBvaW50QXggPSBib3R0b21MZWZ0QXg7XG4gICAgICAgICAgdGVtcFBvaW50QXkgPSBwMXkgKyAoLWhhbGZXaWR0aEEpICogc2xvcGVQcmltZTtcbiAgICAgICAgICByZXN1bHRbMF0gPSB0ZW1wUG9pbnRBeDtcbiAgICAgICAgICByZXN1bHRbMV0gPSB0ZW1wUG9pbnRBeTtcbiAgICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKCFjbGlwUG9pbnRCRm91bmQpXG4gICAge1xuICAgICAgc3dpdGNoIChjYXJkaW5hbERpcmVjdGlvbkIpXG4gICAgICB7XG4gICAgICAgIGNhc2UgMTpcbiAgICAgICAgICB0ZW1wUG9pbnRCeSA9IHRvcExlZnRCeTtcbiAgICAgICAgICB0ZW1wUG9pbnRCeCA9IHAyeCArICgtaGFsZkhlaWdodEIpIC8gc2xvcGVQcmltZTtcbiAgICAgICAgICByZXN1bHRbMl0gPSB0ZW1wUG9pbnRCeDtcbiAgICAgICAgICByZXN1bHRbM10gPSB0ZW1wUG9pbnRCeTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAyOlxuICAgICAgICAgIHRlbXBQb2ludEJ4ID0gYm90dG9tUmlnaHRCeDtcbiAgICAgICAgICB0ZW1wUG9pbnRCeSA9IHAyeSArIGhhbGZXaWR0aEIgKiBzbG9wZVByaW1lO1xuICAgICAgICAgIHJlc3VsdFsyXSA9IHRlbXBQb2ludEJ4O1xuICAgICAgICAgIHJlc3VsdFszXSA9IHRlbXBQb2ludEJ5O1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIDM6XG4gICAgICAgICAgdGVtcFBvaW50QnkgPSBib3R0b21MZWZ0Qnk7XG4gICAgICAgICAgdGVtcFBvaW50QnggPSBwMnggKyBoYWxmSGVpZ2h0QiAvIHNsb3BlUHJpbWU7XG4gICAgICAgICAgcmVzdWx0WzJdID0gdGVtcFBvaW50Qng7XG4gICAgICAgICAgcmVzdWx0WzNdID0gdGVtcFBvaW50Qnk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgNDpcbiAgICAgICAgICB0ZW1wUG9pbnRCeCA9IGJvdHRvbUxlZnRCeDtcbiAgICAgICAgICB0ZW1wUG9pbnRCeSA9IHAyeSArICgtaGFsZldpZHRoQikgKiBzbG9wZVByaW1lO1xuICAgICAgICAgIHJlc3VsdFsyXSA9IHRlbXBQb2ludEJ4O1xuICAgICAgICAgIHJlc3VsdFszXSA9IHRlbXBQb2ludEJ5O1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gZmFsc2U7XG59XG5cbklHZW9tZXRyeS5nZXRDYXJkaW5hbERpcmVjdGlvbiA9IGZ1bmN0aW9uIChzbG9wZSwgc2xvcGVQcmltZSwgbGluZSlcbntcbiAgaWYgKHNsb3BlID4gc2xvcGVQcmltZSlcbiAge1xuICAgIHJldHVybiBsaW5lO1xuICB9XG4gIGVsc2VcbiAge1xuICAgIHJldHVybiAxICsgbGluZSAlIDQ7XG4gIH1cbn1cblxuSUdlb21ldHJ5LmdldEludGVyc2VjdGlvbiA9IGZ1bmN0aW9uIChzMSwgczIsIGYxLCBmMilcbntcbiAgaWYgKGYyID09IG51bGwpIHtcbiAgICByZXR1cm4gSUdlb21ldHJ5LmdldEludGVyc2VjdGlvbjIoczEsIHMyLCBmMSk7XG4gIH1cbiAgdmFyIHgxID0gczEueDtcbiAgdmFyIHkxID0gczEueTtcbiAgdmFyIHgyID0gczIueDtcbiAgdmFyIHkyID0gczIueTtcbiAgdmFyIHgzID0gZjEueDtcbiAgdmFyIHkzID0gZjEueTtcbiAgdmFyIHg0ID0gZjIueDtcbiAgdmFyIHk0ID0gZjIueTtcbiAgdmFyIHgsIHk7IC8vIGludGVyc2VjdGlvbiBwb2ludFxuICB2YXIgYTEsIGEyLCBiMSwgYjIsIGMxLCBjMjsgLy8gY29lZmZpY2llbnRzIG9mIGxpbmUgZXFucy5cbiAgdmFyIGRlbm9tO1xuXG4gIGExID0geTIgLSB5MTtcbiAgYjEgPSB4MSAtIHgyO1xuICBjMSA9IHgyICogeTEgLSB4MSAqIHkyOyAgLy8geyBhMSp4ICsgYjEqeSArIGMxID0gMCBpcyBsaW5lIDEgfVxuXG4gIGEyID0geTQgLSB5MztcbiAgYjIgPSB4MyAtIHg0O1xuICBjMiA9IHg0ICogeTMgLSB4MyAqIHk0OyAgLy8geyBhMip4ICsgYjIqeSArIGMyID0gMCBpcyBsaW5lIDIgfVxuXG4gIGRlbm9tID0gYTEgKiBiMiAtIGEyICogYjE7XG5cbiAgaWYgKGRlbm9tID09IDApXG4gIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIHggPSAoYjEgKiBjMiAtIGIyICogYzEpIC8gZGVub207XG4gIHkgPSAoYTIgKiBjMSAtIGExICogYzIpIC8gZGVub207XG5cbiAgcmV0dXJuIG5ldyBQb2ludCh4LCB5KTtcbn1cblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbi8vIFNlY3Rpb246IENsYXNzIENvbnN0YW50c1xuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbi8qKlxuICogU29tZSB1c2VmdWwgcHJlLWNhbGN1bGF0ZWQgY29uc3RhbnRzXG4gKi9cbklHZW9tZXRyeS5IQUxGX1BJID0gMC41ICogTWF0aC5QSTtcbklHZW9tZXRyeS5PTkVfQU5EX0hBTEZfUEkgPSAxLjUgKiBNYXRoLlBJO1xuSUdlb21ldHJ5LlRXT19QSSA9IDIuMCAqIE1hdGguUEk7XG5JR2VvbWV0cnkuVEhSRUVfUEkgPSAzLjAgKiBNYXRoLlBJO1xuXG5tb2R1bGUuZXhwb3J0cyA9IElHZW9tZXRyeTtcbiIsImZ1bmN0aW9uIElNYXRoKCkge1xufVxuXG4vKipcbiAqIFRoaXMgbWV0aG9kIHJldHVybnMgdGhlIHNpZ24gb2YgdGhlIGlucHV0IHZhbHVlLlxuICovXG5JTWF0aC5zaWduID0gZnVuY3Rpb24gKHZhbHVlKSB7XG4gIGlmICh2YWx1ZSA+IDApXG4gIHtcbiAgICByZXR1cm4gMTtcbiAgfVxuICBlbHNlIGlmICh2YWx1ZSA8IDApXG4gIHtcbiAgICByZXR1cm4gLTE7XG4gIH1cbiAgZWxzZVxuICB7XG4gICAgcmV0dXJuIDA7XG4gIH1cbn1cblxuSU1hdGguZmxvb3IgPSBmdW5jdGlvbiAodmFsdWUpIHtcbiAgcmV0dXJuIHZhbHVlIDwgMCA/IE1hdGguY2VpbCh2YWx1ZSkgOiBNYXRoLmZsb29yKHZhbHVlKTtcbn1cblxuSU1hdGguY2VpbCA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICByZXR1cm4gdmFsdWUgPCAwID8gTWF0aC5mbG9vcih2YWx1ZSkgOiBNYXRoLmNlaWwodmFsdWUpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IElNYXRoO1xuIiwiZnVuY3Rpb24gSW50ZWdlcigpIHtcbn1cblxuSW50ZWdlci5NQVhfVkFMVUUgPSAyMTQ3NDgzNjQ3O1xuSW50ZWdlci5NSU5fVkFMVUUgPSAtMjE0NzQ4MzY0ODtcblxubW9kdWxlLmV4cG9ydHMgPSBJbnRlZ2VyO1xuIiwidmFyIExHcmFwaE9iamVjdCA9IHJlcXVpcmUoJy4vTEdyYXBoT2JqZWN0Jyk7XG52YXIgSUdlb21ldHJ5ID0gcmVxdWlyZSgnLi9JR2VvbWV0cnknKTtcbnZhciBJTWF0aCA9IHJlcXVpcmUoJy4vSU1hdGgnKTtcblxuZnVuY3Rpb24gTEVkZ2Uoc291cmNlLCB0YXJnZXQsIHZFZGdlKSB7XG4gIExHcmFwaE9iamVjdC5jYWxsKHRoaXMsIHZFZGdlKTtcblxuICB0aGlzLmlzT3ZlcmxhcGluZ1NvdXJjZUFuZFRhcmdldCA9IGZhbHNlO1xuICB0aGlzLnZHcmFwaE9iamVjdCA9IHZFZGdlO1xuICB0aGlzLmJlbmRwb2ludHMgPSBbXTtcbiAgdGhpcy5zb3VyY2UgPSBzb3VyY2U7XG4gIHRoaXMudGFyZ2V0ID0gdGFyZ2V0O1xufVxuXG5MRWRnZS5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKExHcmFwaE9iamVjdC5wcm90b3R5cGUpO1xuXG5mb3IgKHZhciBwcm9wIGluIExHcmFwaE9iamVjdCkge1xuICBMRWRnZVtwcm9wXSA9IExHcmFwaE9iamVjdFtwcm9wXTtcbn1cblxuTEVkZ2UucHJvdG90eXBlLmdldFNvdXJjZSA9IGZ1bmN0aW9uICgpXG57XG4gIHJldHVybiB0aGlzLnNvdXJjZTtcbn07XG5cbkxFZGdlLnByb3RvdHlwZS5nZXRUYXJnZXQgPSBmdW5jdGlvbiAoKVxue1xuICByZXR1cm4gdGhpcy50YXJnZXQ7XG59O1xuXG5MRWRnZS5wcm90b3R5cGUuaXNJbnRlckdyYXBoID0gZnVuY3Rpb24gKClcbntcbiAgcmV0dXJuIHRoaXMuaXNJbnRlckdyYXBoO1xufTtcblxuTEVkZ2UucHJvdG90eXBlLmdldExlbmd0aCA9IGZ1bmN0aW9uICgpXG57XG4gIHJldHVybiB0aGlzLmxlbmd0aDtcbn07XG5cbkxFZGdlLnByb3RvdHlwZS5pc092ZXJsYXBpbmdTb3VyY2VBbmRUYXJnZXQgPSBmdW5jdGlvbiAoKVxue1xuICByZXR1cm4gdGhpcy5pc092ZXJsYXBpbmdTb3VyY2VBbmRUYXJnZXQ7XG59O1xuXG5MRWRnZS5wcm90b3R5cGUuZ2V0QmVuZHBvaW50cyA9IGZ1bmN0aW9uICgpXG57XG4gIHJldHVybiB0aGlzLmJlbmRwb2ludHM7XG59O1xuXG5MRWRnZS5wcm90b3R5cGUuZ2V0TGNhID0gZnVuY3Rpb24gKClcbntcbiAgcmV0dXJuIHRoaXMubGNhO1xufTtcblxuTEVkZ2UucHJvdG90eXBlLmdldFNvdXJjZUluTGNhID0gZnVuY3Rpb24gKClcbntcbiAgcmV0dXJuIHRoaXMuc291cmNlSW5MY2E7XG59O1xuXG5MRWRnZS5wcm90b3R5cGUuZ2V0VGFyZ2V0SW5MY2EgPSBmdW5jdGlvbiAoKVxue1xuICByZXR1cm4gdGhpcy50YXJnZXRJbkxjYTtcbn07XG5cbkxFZGdlLnByb3RvdHlwZS5nZXRPdGhlckVuZCA9IGZ1bmN0aW9uIChub2RlKVxue1xuICBpZiAodGhpcy5zb3VyY2UgPT09IG5vZGUpXG4gIHtcbiAgICByZXR1cm4gdGhpcy50YXJnZXQ7XG4gIH1cbiAgZWxzZSBpZiAodGhpcy50YXJnZXQgPT09IG5vZGUpXG4gIHtcbiAgICByZXR1cm4gdGhpcy5zb3VyY2U7XG4gIH1cbiAgZWxzZVxuICB7XG4gICAgdGhyb3cgXCJOb2RlIGlzIG5vdCBpbmNpZGVudCB3aXRoIHRoaXMgZWRnZVwiO1xuICB9XG59XG5cbkxFZGdlLnByb3RvdHlwZS5nZXRPdGhlckVuZEluR3JhcGggPSBmdW5jdGlvbiAobm9kZSwgZ3JhcGgpXG57XG4gIHZhciBvdGhlckVuZCA9IHRoaXMuZ2V0T3RoZXJFbmQobm9kZSk7XG4gIHZhciByb290ID0gZ3JhcGguZ2V0R3JhcGhNYW5hZ2VyKCkuZ2V0Um9vdCgpO1xuXG4gIHdoaWxlICh0cnVlKVxuICB7XG4gICAgaWYgKG90aGVyRW5kLmdldE93bmVyKCkgPT0gZ3JhcGgpXG4gICAge1xuICAgICAgcmV0dXJuIG90aGVyRW5kO1xuICAgIH1cblxuICAgIGlmIChvdGhlckVuZC5nZXRPd25lcigpID09IHJvb3QpXG4gICAge1xuICAgICAgYnJlYWs7XG4gICAgfVxuXG4gICAgb3RoZXJFbmQgPSBvdGhlckVuZC5nZXRPd25lcigpLmdldFBhcmVudCgpO1xuICB9XG5cbiAgcmV0dXJuIG51bGw7XG59O1xuXG5MRWRnZS5wcm90b3R5cGUudXBkYXRlTGVuZ3RoID0gZnVuY3Rpb24gKClcbntcbiAgdmFyIGNsaXBQb2ludENvb3JkaW5hdGVzID0gbmV3IEFycmF5KDQpO1xuXG4gIHRoaXMuaXNPdmVybGFwaW5nU291cmNlQW5kVGFyZ2V0ID1cbiAgICAgICAgICBJR2VvbWV0cnkuZ2V0SW50ZXJzZWN0aW9uKHRoaXMudGFyZ2V0LmdldFJlY3QoKSxcbiAgICAgICAgICAgICAgICAgIHRoaXMuc291cmNlLmdldFJlY3QoKSxcbiAgICAgICAgICAgICAgICAgIGNsaXBQb2ludENvb3JkaW5hdGVzKTtcblxuICBpZiAoIXRoaXMuaXNPdmVybGFwaW5nU291cmNlQW5kVGFyZ2V0KVxuICB7XG4gICAgdGhpcy5sZW5ndGhYID0gY2xpcFBvaW50Q29vcmRpbmF0ZXNbMF0gLSBjbGlwUG9pbnRDb29yZGluYXRlc1syXTtcbiAgICB0aGlzLmxlbmd0aFkgPSBjbGlwUG9pbnRDb29yZGluYXRlc1sxXSAtIGNsaXBQb2ludENvb3JkaW5hdGVzWzNdO1xuXG4gICAgaWYgKE1hdGguYWJzKHRoaXMubGVuZ3RoWCkgPCAxLjApXG4gICAge1xuICAgICAgdGhpcy5sZW5ndGhYID0gSU1hdGguc2lnbih0aGlzLmxlbmd0aFgpO1xuICAgIH1cblxuICAgIGlmIChNYXRoLmFicyh0aGlzLmxlbmd0aFkpIDwgMS4wKVxuICAgIHtcbiAgICAgIHRoaXMubGVuZ3RoWSA9IElNYXRoLnNpZ24odGhpcy5sZW5ndGhZKTtcbiAgICB9XG5cbiAgICB0aGlzLmxlbmd0aCA9IE1hdGguc3FydChcbiAgICAgICAgICAgIHRoaXMubGVuZ3RoWCAqIHRoaXMubGVuZ3RoWCArIHRoaXMubGVuZ3RoWSAqIHRoaXMubGVuZ3RoWSk7XG4gIH1cbn07XG5cbkxFZGdlLnByb3RvdHlwZS51cGRhdGVMZW5ndGhTaW1wbGUgPSBmdW5jdGlvbiAoKVxue1xuICB0aGlzLmxlbmd0aFggPSB0aGlzLnRhcmdldC5nZXRDZW50ZXJYKCkgLSB0aGlzLnNvdXJjZS5nZXRDZW50ZXJYKCk7XG4gIHRoaXMubGVuZ3RoWSA9IHRoaXMudGFyZ2V0LmdldENlbnRlclkoKSAtIHRoaXMuc291cmNlLmdldENlbnRlclkoKTtcblxuICBpZiAoTWF0aC5hYnModGhpcy5sZW5ndGhYKSA8IDEuMClcbiAge1xuICAgIHRoaXMubGVuZ3RoWCA9IElNYXRoLnNpZ24odGhpcy5sZW5ndGhYKTtcbiAgfVxuXG4gIGlmIChNYXRoLmFicyh0aGlzLmxlbmd0aFkpIDwgMS4wKVxuICB7XG4gICAgdGhpcy5sZW5ndGhZID0gSU1hdGguc2lnbih0aGlzLmxlbmd0aFkpO1xuICB9XG5cbiAgdGhpcy5sZW5ndGggPSBNYXRoLnNxcnQoXG4gICAgICAgICAgdGhpcy5sZW5ndGhYICogdGhpcy5sZW5ndGhYICsgdGhpcy5sZW5ndGhZICogdGhpcy5sZW5ndGhZKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBMRWRnZTtcbiIsInZhciBMR3JhcGhPYmplY3QgPSByZXF1aXJlKCcuL0xHcmFwaE9iamVjdCcpO1xudmFyIEludGVnZXIgPSByZXF1aXJlKCcuL0ludGVnZXInKTtcbnZhciBMYXlvdXRDb25zdGFudHMgPSByZXF1aXJlKCcuL0xheW91dENvbnN0YW50cycpO1xudmFyIExHcmFwaE1hbmFnZXIgPSByZXF1aXJlKCcuL0xHcmFwaE1hbmFnZXInKTtcbnZhciBMTm9kZSA9IHJlcXVpcmUoJy4vTE5vZGUnKTtcbnZhciBMRWRnZSA9IHJlcXVpcmUoJy4vTEVkZ2UnKTtcbnZhciBIYXNoU2V0ID0gcmVxdWlyZSgnLi9IYXNoU2V0Jyk7XG52YXIgUmVjdGFuZ2xlRCA9IHJlcXVpcmUoJy4vUmVjdGFuZ2xlRCcpO1xudmFyIFBvaW50ID0gcmVxdWlyZSgnLi9Qb2ludCcpO1xudmFyIExpc3QgPSByZXF1aXJlKCdsaW5rZWRsaXN0LWpzJykuTGlzdDtcblxuZnVuY3Rpb24gTEdyYXBoKHBhcmVudCwgb2JqMiwgdkdyYXBoKSB7XG4gIExHcmFwaE9iamVjdC5jYWxsKHRoaXMsIHZHcmFwaCk7XG4gIHRoaXMuZXN0aW1hdGVkU2l6ZSA9IEludGVnZXIuTUlOX1ZBTFVFO1xuICB0aGlzLm1hcmdpbiA9IExheW91dENvbnN0YW50cy5ERUZBVUxUX0dSQVBIX01BUkdJTjtcbiAgdGhpcy5lZGdlcyA9IFtdO1xuICB0aGlzLm5vZGVzID0gW107XG4gIHRoaXMuaXNDb25uZWN0ZWQgPSBmYWxzZTtcbiAgdGhpcy5wYXJlbnQgPSBwYXJlbnQ7XG5cbiAgaWYgKG9iajIgIT0gbnVsbCAmJiBvYmoyIGluc3RhbmNlb2YgTEdyYXBoTWFuYWdlcikge1xuICAgIHRoaXMuZ3JhcGhNYW5hZ2VyID0gb2JqMjtcbiAgfVxuICBlbHNlIGlmIChvYmoyICE9IG51bGwgJiYgb2JqMiBpbnN0YW5jZW9mIExheW91dCkge1xuICAgIHRoaXMuZ3JhcGhNYW5hZ2VyID0gb2JqMi5ncmFwaE1hbmFnZXI7XG4gIH1cbn1cblxuTEdyYXBoLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoTEdyYXBoT2JqZWN0LnByb3RvdHlwZSk7XG5mb3IgKHZhciBwcm9wIGluIExHcmFwaE9iamVjdCkge1xuICBMR3JhcGhbcHJvcF0gPSBMR3JhcGhPYmplY3RbcHJvcF07XG59XG5cbkxHcmFwaC5wcm90b3R5cGUuZ2V0Tm9kZXMgPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiB0aGlzLm5vZGVzO1xufTtcblxuTEdyYXBoLnByb3RvdHlwZS5nZXRFZGdlcyA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIHRoaXMuZWRnZXM7XG59O1xuXG5MR3JhcGgucHJvdG90eXBlLmdldEdyYXBoTWFuYWdlciA9IGZ1bmN0aW9uICgpXG57XG4gIHJldHVybiB0aGlzLmdyYXBoTWFuYWdlcjtcbn07XG5cbkxHcmFwaC5wcm90b3R5cGUuZ2V0UGFyZW50ID0gZnVuY3Rpb24gKClcbntcbiAgcmV0dXJuIHRoaXMucGFyZW50O1xufTtcblxuTEdyYXBoLnByb3RvdHlwZS5nZXRMZWZ0ID0gZnVuY3Rpb24gKClcbntcbiAgcmV0dXJuIHRoaXMubGVmdDtcbn07XG5cbkxHcmFwaC5wcm90b3R5cGUuZ2V0UmlnaHQgPSBmdW5jdGlvbiAoKVxue1xuICByZXR1cm4gdGhpcy5yaWdodDtcbn07XG5cbkxHcmFwaC5wcm90b3R5cGUuZ2V0VG9wID0gZnVuY3Rpb24gKClcbntcbiAgcmV0dXJuIHRoaXMudG9wO1xufTtcblxuTEdyYXBoLnByb3RvdHlwZS5nZXRCb3R0b20gPSBmdW5jdGlvbiAoKVxue1xuICByZXR1cm4gdGhpcy5ib3R0b207XG59O1xuXG5MR3JhcGgucHJvdG90eXBlLmlzQ29ubmVjdGVkID0gZnVuY3Rpb24gKClcbntcbiAgcmV0dXJuIHRoaXMuaXNDb25uZWN0ZWQ7XG59O1xuXG5MR3JhcGgucHJvdG90eXBlLmFkZCA9IGZ1bmN0aW9uIChvYmoxLCBzb3VyY2VOb2RlLCB0YXJnZXROb2RlKSB7XG4gIGlmIChzb3VyY2VOb2RlID09IG51bGwgJiYgdGFyZ2V0Tm9kZSA9PSBudWxsKSB7XG4gICAgdmFyIG5ld05vZGUgPSBvYmoxO1xuICAgIGlmICh0aGlzLmdyYXBoTWFuYWdlciA9PSBudWxsKSB7XG4gICAgICB0aHJvdyBcIkdyYXBoIGhhcyBubyBncmFwaCBtZ3IhXCI7XG4gICAgfVxuICAgIGlmICh0aGlzLmdldE5vZGVzKCkuaW5kZXhPZihuZXdOb2RlKSA+IC0xKSB7XG4gICAgICB0aHJvdyBcIk5vZGUgYWxyZWFkeSBpbiBncmFwaCFcIjtcbiAgICB9XG4gICAgbmV3Tm9kZS5vd25lciA9IHRoaXM7XG4gICAgdGhpcy5nZXROb2RlcygpLnB1c2gobmV3Tm9kZSk7XG5cbiAgICByZXR1cm4gbmV3Tm9kZTtcbiAgfVxuICBlbHNlIHtcbiAgICB2YXIgbmV3RWRnZSA9IG9iajE7XG4gICAgaWYgKCEodGhpcy5nZXROb2RlcygpLmluZGV4T2Yoc291cmNlTm9kZSkgPiAtMSAmJiAodGhpcy5nZXROb2RlcygpLmluZGV4T2YodGFyZ2V0Tm9kZSkpID4gLTEpKSB7XG4gICAgICB0aHJvdyBcIlNvdXJjZSBvciB0YXJnZXQgbm90IGluIGdyYXBoIVwiO1xuICAgIH1cblxuICAgIGlmICghKHNvdXJjZU5vZGUub3duZXIgPT0gdGFyZ2V0Tm9kZS5vd25lciAmJiBzb3VyY2VOb2RlLm93bmVyID09IHRoaXMpKSB7XG4gICAgICB0aHJvdyBcIkJvdGggb3duZXJzIG11c3QgYmUgdGhpcyBncmFwaCFcIjtcbiAgICB9XG5cbiAgICBpZiAoc291cmNlTm9kZS5vd25lciAhPSB0YXJnZXROb2RlLm93bmVyKVxuICAgIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIC8vIHNldCBzb3VyY2UgYW5kIHRhcmdldFxuICAgIG5ld0VkZ2Uuc291cmNlID0gc291cmNlTm9kZTtcbiAgICBuZXdFZGdlLnRhcmdldCA9IHRhcmdldE5vZGU7XG5cbiAgICAvLyBzZXQgYXMgaW50cmEtZ3JhcGggZWRnZVxuICAgIG5ld0VkZ2UuaXNJbnRlckdyYXBoID0gZmFsc2U7XG5cbiAgICAvLyBhZGQgdG8gZ3JhcGggZWRnZSBsaXN0XG4gICAgdGhpcy5nZXRFZGdlcygpLnB1c2gobmV3RWRnZSk7XG5cbiAgICAvLyBhZGQgdG8gaW5jaWRlbmN5IGxpc3RzXG4gICAgc291cmNlTm9kZS5lZGdlcy5wdXNoKG5ld0VkZ2UpO1xuXG4gICAgaWYgKHRhcmdldE5vZGUgIT0gc291cmNlTm9kZSlcbiAgICB7XG4gICAgICB0YXJnZXROb2RlLmVkZ2VzLnB1c2gobmV3RWRnZSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIG5ld0VkZ2U7XG4gIH1cbn07XG5cbkxHcmFwaC5wcm90b3R5cGUucmVtb3ZlID0gZnVuY3Rpb24gKG9iaikge1xuICB2YXIgbm9kZSA9IG9iajtcbiAgaWYgKG9iaiBpbnN0YW5jZW9mIExOb2RlKSB7XG4gICAgaWYgKG5vZGUgPT0gbnVsbCkge1xuICAgICAgdGhyb3cgXCJOb2RlIGlzIG51bGwhXCI7XG4gICAgfVxuICAgIGlmICghKG5vZGUub3duZXIgIT0gbnVsbCAmJiBub2RlLm93bmVyID09IHRoaXMpKSB7XG4gICAgICB0aHJvdyBcIk93bmVyIGdyYXBoIGlzIGludmFsaWQhXCI7XG4gICAgfVxuICAgIGlmICh0aGlzLmdyYXBoTWFuYWdlciA9PSBudWxsKSB7XG4gICAgICB0aHJvdyBcIk93bmVyIGdyYXBoIG1hbmFnZXIgaXMgaW52YWxpZCFcIjtcbiAgICB9XG4gICAgLy8gcmVtb3ZlIGluY2lkZW50IGVkZ2VzIGZpcnN0IChtYWtlIGEgY29weSB0byBkbyBpdCBzYWZlbHkpXG4gICAgdmFyIGVkZ2VzVG9CZVJlbW92ZWQgPSBub2RlLmVkZ2VzLnNsaWNlKCk7XG4gICAgdmFyIGVkZ2U7XG4gICAgdmFyIHMgPSBlZGdlc1RvQmVSZW1vdmVkLmxlbmd0aDtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHM7IGkrKylcbiAgICB7XG4gICAgICBlZGdlID0gZWRnZXNUb0JlUmVtb3ZlZFtpXTtcblxuICAgICAgaWYgKGVkZ2UuaXNJbnRlckdyYXBoKVxuICAgICAge1xuICAgICAgICB0aGlzLmdyYXBoTWFuYWdlci5yZW1vdmUoZWRnZSk7XG4gICAgICB9XG4gICAgICBlbHNlXG4gICAgICB7XG4gICAgICAgIGVkZ2Uuc291cmNlLm93bmVyLnJlbW92ZShlZGdlKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBub3cgdGhlIG5vZGUgaXRzZWxmXG4gICAgdmFyIGluZGV4ID0gdGhpcy5ub2Rlcy5pbmRleE9mKG5vZGUpO1xuICAgIGlmIChpbmRleCA9PSAtMSkge1xuICAgICAgdGhyb3cgXCJOb2RlIG5vdCBpbiBvd25lciBub2RlIGxpc3QhXCI7XG4gICAgfVxuXG4gICAgdGhpcy5ub2Rlcy5zcGxpY2UoaW5kZXgsIDEpO1xuICB9XG4gIGVsc2UgaWYgKG9iaiBpbnN0YW5jZW9mIExFZGdlKSB7XG4gICAgdmFyIGVkZ2UgPSBvYmo7XG4gICAgaWYgKGVkZ2UgPT0gbnVsbCkge1xuICAgICAgdGhyb3cgXCJFZGdlIGlzIG51bGwhXCI7XG4gICAgfVxuICAgIGlmICghKGVkZ2Uuc291cmNlICE9IG51bGwgJiYgZWRnZS50YXJnZXQgIT0gbnVsbCkpIHtcbiAgICAgIHRocm93IFwiU291cmNlIGFuZC9vciB0YXJnZXQgaXMgbnVsbCFcIjtcbiAgICB9XG4gICAgaWYgKCEoZWRnZS5zb3VyY2Uub3duZXIgIT0gbnVsbCAmJiBlZGdlLnRhcmdldC5vd25lciAhPSBudWxsICYmXG4gICAgICAgICAgICBlZGdlLnNvdXJjZS5vd25lciA9PSB0aGlzICYmIGVkZ2UudGFyZ2V0Lm93bmVyID09IHRoaXMpKSB7XG4gICAgICB0aHJvdyBcIlNvdXJjZSBhbmQvb3IgdGFyZ2V0IG93bmVyIGlzIGludmFsaWQhXCI7XG4gICAgfVxuXG4gICAgdmFyIHNvdXJjZUluZGV4ID0gZWRnZS5zb3VyY2UuZWRnZXMuaW5kZXhPZihlZGdlKTtcbiAgICB2YXIgdGFyZ2V0SW5kZXggPSBlZGdlLnRhcmdldC5lZGdlcy5pbmRleE9mKGVkZ2UpO1xuICAgIGlmICghKHNvdXJjZUluZGV4ID4gLTEgJiYgdGFyZ2V0SW5kZXggPiAtMSkpIHtcbiAgICAgIHRocm93IFwiU291cmNlIGFuZC9vciB0YXJnZXQgZG9lc24ndCBrbm93IHRoaXMgZWRnZSFcIjtcbiAgICB9XG5cbiAgICBlZGdlLnNvdXJjZS5lZGdlcy5zcGxpY2Uoc291cmNlSW5kZXgsIDEpO1xuXG4gICAgaWYgKGVkZ2UudGFyZ2V0ICE9IGVkZ2Uuc291cmNlKVxuICAgIHtcbiAgICAgIGVkZ2UudGFyZ2V0LmVkZ2VzLnNwbGljZSh0YXJnZXRJbmRleCwgMSk7XG4gICAgfVxuXG4gICAgdmFyIGluZGV4ID0gZWRnZS5zb3VyY2Uub3duZXIuZ2V0RWRnZXMoKS5pbmRleE9mKGVkZ2UpO1xuICAgIGlmIChpbmRleCA9PSAtMSkge1xuICAgICAgdGhyb3cgXCJOb3QgaW4gb3duZXIncyBlZGdlIGxpc3QhXCI7XG4gICAgfVxuXG4gICAgZWRnZS5zb3VyY2Uub3duZXIuZ2V0RWRnZXMoKS5zcGxpY2UoaW5kZXgsIDEpO1xuICB9XG59O1xuXG5MR3JhcGgucHJvdG90eXBlLnVwZGF0ZUxlZnRUb3AgPSBmdW5jdGlvbiAoKVxue1xuICB2YXIgdG9wID0gSW50ZWdlci5NQVhfVkFMVUU7XG4gIHZhciBsZWZ0ID0gSW50ZWdlci5NQVhfVkFMVUU7XG4gIHZhciBub2RlVG9wO1xuICB2YXIgbm9kZUxlZnQ7XG4gIHZhciBtYXJnaW47XG5cbiAgdmFyIG5vZGVzID0gdGhpcy5nZXROb2RlcygpO1xuICB2YXIgcyA9IG5vZGVzLmxlbmd0aDtcblxuICBmb3IgKHZhciBpID0gMDsgaSA8IHM7IGkrKylcbiAge1xuICAgIHZhciBsTm9kZSA9IG5vZGVzW2ldO1xuICAgIG5vZGVUb3AgPSBsTm9kZS5nZXRUb3AoKTtcbiAgICBub2RlTGVmdCA9IGxOb2RlLmdldExlZnQoKTtcblxuICAgIGlmICh0b3AgPiBub2RlVG9wKVxuICAgIHtcbiAgICAgIHRvcCA9IG5vZGVUb3A7XG4gICAgfVxuXG4gICAgaWYgKGxlZnQgPiBub2RlTGVmdClcbiAgICB7XG4gICAgICBsZWZ0ID0gbm9kZUxlZnQ7XG4gICAgfVxuICB9XG5cbiAgLy8gRG8gd2UgaGF2ZSBhbnkgbm9kZXMgaW4gdGhpcyBncmFwaD9cbiAgaWYgKHRvcCA9PSBJbnRlZ2VyLk1BWF9WQUxVRSlcbiAge1xuICAgIHJldHVybiBudWxsO1xuICB9XG4gIFxuICBpZihub2Rlc1swXS5nZXRQYXJlbnQoKS5wYWRkaW5nTGVmdCAhPSB1bmRlZmluZWQpe1xuICAgIG1hcmdpbiA9IG5vZGVzWzBdLmdldFBhcmVudCgpLnBhZGRpbmdMZWZ0O1xuICB9XG4gIGVsc2V7XG4gICAgbWFyZ2luID0gdGhpcy5tYXJnaW47XG4gIH1cblxuICB0aGlzLmxlZnQgPSBsZWZ0IC0gbWFyZ2luO1xuICB0aGlzLnRvcCA9IHRvcCAtIG1hcmdpbjtcblxuICAvLyBBcHBseSB0aGUgbWFyZ2lucyBhbmQgcmV0dXJuIHRoZSByZXN1bHRcbiAgcmV0dXJuIG5ldyBQb2ludCh0aGlzLmxlZnQsIHRoaXMudG9wKTtcbn07XG5cbkxHcmFwaC5wcm90b3R5cGUudXBkYXRlQm91bmRzID0gZnVuY3Rpb24gKHJlY3Vyc2l2ZSlcbntcbiAgLy8gY2FsY3VsYXRlIGJvdW5kc1xuICB2YXIgbGVmdCA9IEludGVnZXIuTUFYX1ZBTFVFO1xuICB2YXIgcmlnaHQgPSAtSW50ZWdlci5NQVhfVkFMVUU7XG4gIHZhciB0b3AgPSBJbnRlZ2VyLk1BWF9WQUxVRTtcbiAgdmFyIGJvdHRvbSA9IC1JbnRlZ2VyLk1BWF9WQUxVRTtcbiAgdmFyIG5vZGVMZWZ0O1xuICB2YXIgbm9kZVJpZ2h0O1xuICB2YXIgbm9kZVRvcDtcbiAgdmFyIG5vZGVCb3R0b207XG4gIHZhciBtYXJnaW47XG5cbiAgdmFyIG5vZGVzID0gdGhpcy5ub2RlcztcbiAgdmFyIHMgPSBub2Rlcy5sZW5ndGg7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgczsgaSsrKVxuICB7XG4gICAgdmFyIGxOb2RlID0gbm9kZXNbaV07XG5cbiAgICBpZiAocmVjdXJzaXZlICYmIGxOb2RlLmNoaWxkICE9IG51bGwpXG4gICAge1xuICAgICAgbE5vZGUudXBkYXRlQm91bmRzKCk7XG4gICAgfVxuICAgIG5vZGVMZWZ0ID0gbE5vZGUuZ2V0TGVmdCgpO1xuICAgIG5vZGVSaWdodCA9IGxOb2RlLmdldFJpZ2h0KCk7XG4gICAgbm9kZVRvcCA9IGxOb2RlLmdldFRvcCgpO1xuICAgIG5vZGVCb3R0b20gPSBsTm9kZS5nZXRCb3R0b20oKTtcblxuICAgIGlmIChsZWZ0ID4gbm9kZUxlZnQpXG4gICAge1xuICAgICAgbGVmdCA9IG5vZGVMZWZ0O1xuICAgIH1cblxuICAgIGlmIChyaWdodCA8IG5vZGVSaWdodClcbiAgICB7XG4gICAgICByaWdodCA9IG5vZGVSaWdodDtcbiAgICB9XG5cbiAgICBpZiAodG9wID4gbm9kZVRvcClcbiAgICB7XG4gICAgICB0b3AgPSBub2RlVG9wO1xuICAgIH1cblxuICAgIGlmIChib3R0b20gPCBub2RlQm90dG9tKVxuICAgIHtcbiAgICAgIGJvdHRvbSA9IG5vZGVCb3R0b207XG4gICAgfVxuICB9XG5cbiAgdmFyIGJvdW5kaW5nUmVjdCA9IG5ldyBSZWN0YW5nbGVEKGxlZnQsIHRvcCwgcmlnaHQgLSBsZWZ0LCBib3R0b20gLSB0b3ApO1xuICBpZiAobGVmdCA9PSBJbnRlZ2VyLk1BWF9WQUxVRSlcbiAge1xuICAgIHRoaXMubGVmdCA9IHRoaXMucGFyZW50LmdldExlZnQoKTtcbiAgICB0aGlzLnJpZ2h0ID0gdGhpcy5wYXJlbnQuZ2V0UmlnaHQoKTtcbiAgICB0aGlzLnRvcCA9IHRoaXMucGFyZW50LmdldFRvcCgpO1xuICAgIHRoaXMuYm90dG9tID0gdGhpcy5wYXJlbnQuZ2V0Qm90dG9tKCk7XG4gIH1cbiAgXG4gIGlmKG5vZGVzWzBdLmdldFBhcmVudCgpLnBhZGRpbmdMZWZ0ICE9IHVuZGVmaW5lZCl7XG4gICAgbWFyZ2luID0gbm9kZXNbMF0uZ2V0UGFyZW50KCkucGFkZGluZ0xlZnQ7XG4gIH1cbiAgZWxzZXtcbiAgICBtYXJnaW4gPSB0aGlzLm1hcmdpbjtcbiAgfVxuXG4gIHRoaXMubGVmdCA9IGJvdW5kaW5nUmVjdC54IC0gbWFyZ2luO1xuICB0aGlzLnJpZ2h0ID0gYm91bmRpbmdSZWN0LnggKyBib3VuZGluZ1JlY3Qud2lkdGggKyBtYXJnaW47XG4gIHRoaXMudG9wID0gYm91bmRpbmdSZWN0LnkgLSBtYXJnaW47XG4gIHRoaXMuYm90dG9tID0gYm91bmRpbmdSZWN0LnkgKyBib3VuZGluZ1JlY3QuaGVpZ2h0ICsgbWFyZ2luO1xufTtcblxuTEdyYXBoLmNhbGN1bGF0ZUJvdW5kcyA9IGZ1bmN0aW9uIChub2RlcylcbntcbiAgdmFyIGxlZnQgPSBJbnRlZ2VyLk1BWF9WQUxVRTtcbiAgdmFyIHJpZ2h0ID0gLUludGVnZXIuTUFYX1ZBTFVFO1xuICB2YXIgdG9wID0gSW50ZWdlci5NQVhfVkFMVUU7XG4gIHZhciBib3R0b20gPSAtSW50ZWdlci5NQVhfVkFMVUU7XG4gIHZhciBub2RlTGVmdDtcbiAgdmFyIG5vZGVSaWdodDtcbiAgdmFyIG5vZGVUb3A7XG4gIHZhciBub2RlQm90dG9tO1xuXG4gIHZhciBzID0gbm9kZXMubGVuZ3RoO1xuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgczsgaSsrKVxuICB7XG4gICAgdmFyIGxOb2RlID0gbm9kZXNbaV07XG4gICAgbm9kZUxlZnQgPSBsTm9kZS5nZXRMZWZ0KCk7XG4gICAgbm9kZVJpZ2h0ID0gbE5vZGUuZ2V0UmlnaHQoKTtcbiAgICBub2RlVG9wID0gbE5vZGUuZ2V0VG9wKCk7XG4gICAgbm9kZUJvdHRvbSA9IGxOb2RlLmdldEJvdHRvbSgpO1xuXG4gICAgaWYgKGxlZnQgPiBub2RlTGVmdClcbiAgICB7XG4gICAgICBsZWZ0ID0gbm9kZUxlZnQ7XG4gICAgfVxuXG4gICAgaWYgKHJpZ2h0IDwgbm9kZVJpZ2h0KVxuICAgIHtcbiAgICAgIHJpZ2h0ID0gbm9kZVJpZ2h0O1xuICAgIH1cblxuICAgIGlmICh0b3AgPiBub2RlVG9wKVxuICAgIHtcbiAgICAgIHRvcCA9IG5vZGVUb3A7XG4gICAgfVxuXG4gICAgaWYgKGJvdHRvbSA8IG5vZGVCb3R0b20pXG4gICAge1xuICAgICAgYm90dG9tID0gbm9kZUJvdHRvbTtcbiAgICB9XG4gIH1cblxuICB2YXIgYm91bmRpbmdSZWN0ID0gbmV3IFJlY3RhbmdsZUQobGVmdCwgdG9wLCByaWdodCAtIGxlZnQsIGJvdHRvbSAtIHRvcCk7XG5cbiAgcmV0dXJuIGJvdW5kaW5nUmVjdDtcbn07XG5cbkxHcmFwaC5wcm90b3R5cGUuZ2V0SW5jbHVzaW9uVHJlZURlcHRoID0gZnVuY3Rpb24gKClcbntcbiAgaWYgKHRoaXMgPT0gdGhpcy5ncmFwaE1hbmFnZXIuZ2V0Um9vdCgpKVxuICB7XG4gICAgcmV0dXJuIDE7XG4gIH1cbiAgZWxzZVxuICB7XG4gICAgcmV0dXJuIHRoaXMucGFyZW50LmdldEluY2x1c2lvblRyZWVEZXB0aCgpO1xuICB9XG59O1xuXG5MR3JhcGgucHJvdG90eXBlLmdldEVzdGltYXRlZFNpemUgPSBmdW5jdGlvbiAoKVxue1xuICBpZiAodGhpcy5lc3RpbWF0ZWRTaXplID09IEludGVnZXIuTUlOX1ZBTFVFKSB7XG4gICAgdGhyb3cgXCJhc3NlcnQgZmFpbGVkXCI7XG4gIH1cbiAgcmV0dXJuIHRoaXMuZXN0aW1hdGVkU2l6ZTtcbn07XG5cbkxHcmFwaC5wcm90b3R5cGUuY2FsY0VzdGltYXRlZFNpemUgPSBmdW5jdGlvbiAoKVxue1xuICB2YXIgc2l6ZSA9IDA7XG4gIHZhciBub2RlcyA9IHRoaXMubm9kZXM7XG4gIHZhciBzID0gbm9kZXMubGVuZ3RoO1xuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgczsgaSsrKVxuICB7XG4gICAgdmFyIGxOb2RlID0gbm9kZXNbaV07XG4gICAgc2l6ZSArPSBsTm9kZS5jYWxjRXN0aW1hdGVkU2l6ZSgpO1xuICB9XG5cbiAgaWYgKHNpemUgPT0gMClcbiAge1xuICAgIHRoaXMuZXN0aW1hdGVkU2l6ZSA9IExheW91dENvbnN0YW50cy5FTVBUWV9DT01QT1VORF9OT0RFX1NJWkU7XG4gIH1cbiAgZWxzZVxuICB7XG4gICAgdGhpcy5lc3RpbWF0ZWRTaXplID0gc2l6ZSAvIE1hdGguc3FydCh0aGlzLm5vZGVzLmxlbmd0aCk7XG4gIH1cblxuICByZXR1cm4gdGhpcy5lc3RpbWF0ZWRTaXplO1xufTtcblxuTEdyYXBoLnByb3RvdHlwZS51cGRhdGVDb25uZWN0ZWQgPSBmdW5jdGlvbiAoKVxue1xuICB2YXIgc2VsZiA9IHRoaXM7XG4gIGlmICh0aGlzLm5vZGVzLmxlbmd0aCA9PSAwKVxuICB7XG4gICAgdGhpcy5pc0Nvbm5lY3RlZCA9IHRydWU7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgdmFyIHRvQmVWaXNpdGVkID0gbmV3IExpc3QoKTtcbiAgdmFyIHZpc2l0ZWQgPSBuZXcgSGFzaFNldCgpO1xuICB2YXIgY3VycmVudE5vZGUgPSB0aGlzLm5vZGVzWzBdO1xuICB2YXIgbmVpZ2hib3JFZGdlcztcbiAgdmFyIGN1cnJlbnROZWlnaGJvcjtcbiAgdmFyIGNoaWxkcmVuT2ZOb2RlID0gY3VycmVudE5vZGUud2l0aENoaWxkcmVuKCk7XG4gIGNoaWxkcmVuT2ZOb2RlLmZvckVhY2goZnVuY3Rpb24obm9kZSkge1xuICAgIHRvQmVWaXNpdGVkLnB1c2gobm9kZSk7XG4gIH0pO1xuXG4gIHdoaWxlICghdG9CZVZpc2l0ZWQuaXNFbXB0eSgpKVxuICB7XG4gICAgY3VycmVudE5vZGUgPSB0b0JlVmlzaXRlZC5zaGlmdCgpLnZhbHVlKCk7XG4gICAgdmlzaXRlZC5hZGQoY3VycmVudE5vZGUpO1xuXG4gICAgLy8gVHJhdmVyc2UgYWxsIG5laWdoYm9ycyBvZiB0aGlzIG5vZGVcbiAgICBuZWlnaGJvckVkZ2VzID0gY3VycmVudE5vZGUuZ2V0RWRnZXMoKTtcbiAgICB2YXIgcyA9IG5laWdoYm9yRWRnZXMubGVuZ3RoO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgczsgaSsrKVxuICAgIHtcbiAgICAgIHZhciBuZWlnaGJvckVkZ2UgPSBuZWlnaGJvckVkZ2VzW2ldO1xuICAgICAgY3VycmVudE5laWdoYm9yID1cbiAgICAgICAgICAgICAgbmVpZ2hib3JFZGdlLmdldE90aGVyRW5kSW5HcmFwaChjdXJyZW50Tm9kZSwgdGhpcyk7XG5cbiAgICAgIC8vIEFkZCB1bnZpc2l0ZWQgbmVpZ2hib3JzIHRvIHRoZSBsaXN0IHRvIHZpc2l0XG4gICAgICBpZiAoY3VycmVudE5laWdoYm9yICE9IG51bGwgJiZcbiAgICAgICAgICAgICAgIXZpc2l0ZWQuY29udGFpbnMoY3VycmVudE5laWdoYm9yKSlcbiAgICAgIHtcbiAgICAgICAgdmFyIGNoaWxkcmVuT2ZOZWlnaGJvciA9IGN1cnJlbnROZWlnaGJvci53aXRoQ2hpbGRyZW4oKTtcbiAgICAgICAgXG4gICAgICAgIGNoaWxkcmVuT2ZOZWlnaGJvci5mb3JFYWNoKGZ1bmN0aW9uKG5vZGUpIHtcbiAgICAgICAgICB0b0JlVmlzaXRlZC5wdXNoKG5vZGUpO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICB0aGlzLmlzQ29ubmVjdGVkID0gZmFsc2U7XG5cbiAgaWYgKHZpc2l0ZWQuc2l6ZSgpID49IHRoaXMubm9kZXMubGVuZ3RoKVxuICB7XG4gICAgdmFyIG5vT2ZWaXNpdGVkSW5UaGlzR3JhcGggPSAwO1xuICAgIFxuICAgIHZhciBzID0gdmlzaXRlZC5zaXplKCk7XG4gICAgIE9iamVjdC5rZXlzKHZpc2l0ZWQuc2V0KS5mb3JFYWNoKGZ1bmN0aW9uKHZpc2l0ZWRJZCkge1xuICAgICAgdmFyIHZpc2l0ZWROb2RlID0gdmlzaXRlZC5zZXRbdmlzaXRlZElkXTtcbiAgICAgIGlmICh2aXNpdGVkTm9kZS5vd25lciA9PSBzZWxmKVxuICAgICAge1xuICAgICAgICBub09mVmlzaXRlZEluVGhpc0dyYXBoKys7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICBpZiAobm9PZlZpc2l0ZWRJblRoaXNHcmFwaCA9PSB0aGlzLm5vZGVzLmxlbmd0aClcbiAgICB7XG4gICAgICB0aGlzLmlzQ29ubmVjdGVkID0gdHJ1ZTtcbiAgICB9XG4gIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gTEdyYXBoO1xuIiwidmFyIExHcmFwaDtcbnZhciBMRWRnZSA9IHJlcXVpcmUoJy4vTEVkZ2UnKTtcblxuZnVuY3Rpb24gTEdyYXBoTWFuYWdlcihsYXlvdXQpIHtcbiAgTEdyYXBoID0gcmVxdWlyZSgnLi9MR3JhcGgnKTsgLy8gSXQgbWF5IGJlIGJldHRlciB0byBpbml0aWxpemUgdGhpcyBvdXQgb2YgdGhpcyBmdW5jdGlvbiBidXQgaXQgZ2l2ZXMgYW4gZXJyb3IgKFJpZ2h0LWhhbmQgc2lkZSBvZiAnaW5zdGFuY2VvZicgaXMgbm90IGNhbGxhYmxlKSBub3cuXG4gIHRoaXMubGF5b3V0ID0gbGF5b3V0O1xuXG4gIHRoaXMuZ3JhcGhzID0gW107XG4gIHRoaXMuZWRnZXMgPSBbXTtcbn1cblxuTEdyYXBoTWFuYWdlci5wcm90b3R5cGUuYWRkUm9vdCA9IGZ1bmN0aW9uICgpXG57XG4gIHZhciBuZ3JhcGggPSB0aGlzLmxheW91dC5uZXdHcmFwaCgpO1xuICB2YXIgbm5vZGUgPSB0aGlzLmxheW91dC5uZXdOb2RlKG51bGwpO1xuICB2YXIgcm9vdCA9IHRoaXMuYWRkKG5ncmFwaCwgbm5vZGUpO1xuICB0aGlzLnNldFJvb3RHcmFwaChyb290KTtcbiAgcmV0dXJuIHRoaXMucm9vdEdyYXBoO1xufTtcblxuTEdyYXBoTWFuYWdlci5wcm90b3R5cGUuYWRkID0gZnVuY3Rpb24gKG5ld0dyYXBoLCBwYXJlbnROb2RlLCBuZXdFZGdlLCBzb3VyY2VOb2RlLCB0YXJnZXROb2RlKVxue1xuICAvL3RoZXJlIGFyZSBqdXN0IDIgcGFyYW1ldGVycyBhcmUgcGFzc2VkIHRoZW4gaXQgYWRkcyBhbiBMR3JhcGggZWxzZSBpdCBhZGRzIGFuIExFZGdlXG4gIGlmIChuZXdFZGdlID09IG51bGwgJiYgc291cmNlTm9kZSA9PSBudWxsICYmIHRhcmdldE5vZGUgPT0gbnVsbCkge1xuICAgIGlmIChuZXdHcmFwaCA9PSBudWxsKSB7XG4gICAgICB0aHJvdyBcIkdyYXBoIGlzIG51bGwhXCI7XG4gICAgfVxuICAgIGlmIChwYXJlbnROb2RlID09IG51bGwpIHtcbiAgICAgIHRocm93IFwiUGFyZW50IG5vZGUgaXMgbnVsbCFcIjtcbiAgICB9XG4gICAgaWYgKHRoaXMuZ3JhcGhzLmluZGV4T2YobmV3R3JhcGgpID4gLTEpIHtcbiAgICAgIHRocm93IFwiR3JhcGggYWxyZWFkeSBpbiB0aGlzIGdyYXBoIG1nciFcIjtcbiAgICB9XG5cbiAgICB0aGlzLmdyYXBocy5wdXNoKG5ld0dyYXBoKTtcblxuICAgIGlmIChuZXdHcmFwaC5wYXJlbnQgIT0gbnVsbCkge1xuICAgICAgdGhyb3cgXCJBbHJlYWR5IGhhcyBhIHBhcmVudCFcIjtcbiAgICB9XG4gICAgaWYgKHBhcmVudE5vZGUuY2hpbGQgIT0gbnVsbCkge1xuICAgICAgdGhyb3cgIFwiQWxyZWFkeSBoYXMgYSBjaGlsZCFcIjtcbiAgICB9XG5cbiAgICBuZXdHcmFwaC5wYXJlbnQgPSBwYXJlbnROb2RlO1xuICAgIHBhcmVudE5vZGUuY2hpbGQgPSBuZXdHcmFwaDtcblxuICAgIHJldHVybiBuZXdHcmFwaDtcbiAgfVxuICBlbHNlIHtcbiAgICAvL2NoYW5nZSB0aGUgb3JkZXIgb2YgdGhlIHBhcmFtZXRlcnNcbiAgICB0YXJnZXROb2RlID0gbmV3RWRnZTtcbiAgICBzb3VyY2VOb2RlID0gcGFyZW50Tm9kZTtcbiAgICBuZXdFZGdlID0gbmV3R3JhcGg7XG4gICAgdmFyIHNvdXJjZUdyYXBoID0gc291cmNlTm9kZS5nZXRPd25lcigpO1xuICAgIHZhciB0YXJnZXRHcmFwaCA9IHRhcmdldE5vZGUuZ2V0T3duZXIoKTtcblxuICAgIGlmICghKHNvdXJjZUdyYXBoICE9IG51bGwgJiYgc291cmNlR3JhcGguZ2V0R3JhcGhNYW5hZ2VyKCkgPT0gdGhpcykpIHtcbiAgICAgIHRocm93IFwiU291cmNlIG5vdCBpbiB0aGlzIGdyYXBoIG1nciFcIjtcbiAgICB9XG4gICAgaWYgKCEodGFyZ2V0R3JhcGggIT0gbnVsbCAmJiB0YXJnZXRHcmFwaC5nZXRHcmFwaE1hbmFnZXIoKSA9PSB0aGlzKSkge1xuICAgICAgdGhyb3cgXCJUYXJnZXQgbm90IGluIHRoaXMgZ3JhcGggbWdyIVwiO1xuICAgIH1cblxuICAgIGlmIChzb3VyY2VHcmFwaCA9PSB0YXJnZXRHcmFwaClcbiAgICB7XG4gICAgICBuZXdFZGdlLmlzSW50ZXJHcmFwaCA9IGZhbHNlO1xuICAgICAgcmV0dXJuIHNvdXJjZUdyYXBoLmFkZChuZXdFZGdlLCBzb3VyY2VOb2RlLCB0YXJnZXROb2RlKTtcbiAgICB9XG4gICAgZWxzZVxuICAgIHtcbiAgICAgIG5ld0VkZ2UuaXNJbnRlckdyYXBoID0gdHJ1ZTtcblxuICAgICAgLy8gc2V0IHNvdXJjZSBhbmQgdGFyZ2V0XG4gICAgICBuZXdFZGdlLnNvdXJjZSA9IHNvdXJjZU5vZGU7XG4gICAgICBuZXdFZGdlLnRhcmdldCA9IHRhcmdldE5vZGU7XG5cbiAgICAgIC8vIGFkZCBlZGdlIHRvIGludGVyLWdyYXBoIGVkZ2UgbGlzdFxuICAgICAgaWYgKHRoaXMuZWRnZXMuaW5kZXhPZihuZXdFZGdlKSA+IC0xKSB7XG4gICAgICAgIHRocm93IFwiRWRnZSBhbHJlYWR5IGluIGludGVyLWdyYXBoIGVkZ2UgbGlzdCFcIjtcbiAgICAgIH1cblxuICAgICAgdGhpcy5lZGdlcy5wdXNoKG5ld0VkZ2UpO1xuXG4gICAgICAvLyBhZGQgZWRnZSB0byBzb3VyY2UgYW5kIHRhcmdldCBpbmNpZGVuY3kgbGlzdHNcbiAgICAgIGlmICghKG5ld0VkZ2Uuc291cmNlICE9IG51bGwgJiYgbmV3RWRnZS50YXJnZXQgIT0gbnVsbCkpIHtcbiAgICAgICAgdGhyb3cgXCJFZGdlIHNvdXJjZSBhbmQvb3IgdGFyZ2V0IGlzIG51bGwhXCI7XG4gICAgICB9XG5cbiAgICAgIGlmICghKG5ld0VkZ2Uuc291cmNlLmVkZ2VzLmluZGV4T2YobmV3RWRnZSkgPT0gLTEgJiYgbmV3RWRnZS50YXJnZXQuZWRnZXMuaW5kZXhPZihuZXdFZGdlKSA9PSAtMSkpIHtcbiAgICAgICAgdGhyb3cgXCJFZGdlIGFscmVhZHkgaW4gc291cmNlIGFuZC9vciB0YXJnZXQgaW5jaWRlbmN5IGxpc3QhXCI7XG4gICAgICB9XG5cbiAgICAgIG5ld0VkZ2Uuc291cmNlLmVkZ2VzLnB1c2gobmV3RWRnZSk7XG4gICAgICBuZXdFZGdlLnRhcmdldC5lZGdlcy5wdXNoKG5ld0VkZ2UpO1xuXG4gICAgICByZXR1cm4gbmV3RWRnZTtcbiAgICB9XG4gIH1cbn07XG5cbkxHcmFwaE1hbmFnZXIucHJvdG90eXBlLnJlbW92ZSA9IGZ1bmN0aW9uIChsT2JqKSB7XG4gIGlmIChsT2JqIGluc3RhbmNlb2YgTEdyYXBoKSB7XG4gICAgdmFyIGdyYXBoID0gbE9iajtcbiAgICBpZiAoZ3JhcGguZ2V0R3JhcGhNYW5hZ2VyKCkgIT0gdGhpcykge1xuICAgICAgdGhyb3cgXCJHcmFwaCBub3QgaW4gdGhpcyBncmFwaCBtZ3JcIjtcbiAgICB9XG4gICAgaWYgKCEoZ3JhcGggPT0gdGhpcy5yb290R3JhcGggfHwgKGdyYXBoLnBhcmVudCAhPSBudWxsICYmIGdyYXBoLnBhcmVudC5ncmFwaE1hbmFnZXIgPT0gdGhpcykpKSB7XG4gICAgICB0aHJvdyBcIkludmFsaWQgcGFyZW50IG5vZGUhXCI7XG4gICAgfVxuXG4gICAgLy8gZmlyc3QgdGhlIGVkZ2VzIChtYWtlIGEgY29weSB0byBkbyBpdCBzYWZlbHkpXG4gICAgdmFyIGVkZ2VzVG9CZVJlbW92ZWQgPSBbXTtcblxuICAgIGVkZ2VzVG9CZVJlbW92ZWQgPSBlZGdlc1RvQmVSZW1vdmVkLmNvbmNhdChncmFwaC5nZXRFZGdlcygpKTtcblxuICAgIHZhciBlZGdlO1xuICAgIHZhciBzID0gZWRnZXNUb0JlUmVtb3ZlZC5sZW5ndGg7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzOyBpKyspXG4gICAge1xuICAgICAgZWRnZSA9IGVkZ2VzVG9CZVJlbW92ZWRbaV07XG4gICAgICBncmFwaC5yZW1vdmUoZWRnZSk7XG4gICAgfVxuXG4gICAgLy8gdGhlbiB0aGUgbm9kZXMgKG1ha2UgYSBjb3B5IHRvIGRvIGl0IHNhZmVseSlcbiAgICB2YXIgbm9kZXNUb0JlUmVtb3ZlZCA9IFtdO1xuXG4gICAgbm9kZXNUb0JlUmVtb3ZlZCA9IG5vZGVzVG9CZVJlbW92ZWQuY29uY2F0KGdyYXBoLmdldE5vZGVzKCkpO1xuXG4gICAgdmFyIG5vZGU7XG4gICAgcyA9IG5vZGVzVG9CZVJlbW92ZWQubGVuZ3RoO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgczsgaSsrKVxuICAgIHtcbiAgICAgIG5vZGUgPSBub2Rlc1RvQmVSZW1vdmVkW2ldO1xuICAgICAgZ3JhcGgucmVtb3ZlKG5vZGUpO1xuICAgIH1cblxuICAgIC8vIGNoZWNrIGlmIGdyYXBoIGlzIHRoZSByb290XG4gICAgaWYgKGdyYXBoID09IHRoaXMucm9vdEdyYXBoKVxuICAgIHtcbiAgICAgIHRoaXMuc2V0Um9vdEdyYXBoKG51bGwpO1xuICAgIH1cblxuICAgIC8vIG5vdyByZW1vdmUgdGhlIGdyYXBoIGl0c2VsZlxuICAgIHZhciBpbmRleCA9IHRoaXMuZ3JhcGhzLmluZGV4T2YoZ3JhcGgpO1xuICAgIHRoaXMuZ3JhcGhzLnNwbGljZShpbmRleCwgMSk7XG5cbiAgICAvLyBhbHNvIHJlc2V0IHRoZSBwYXJlbnQgb2YgdGhlIGdyYXBoXG4gICAgZ3JhcGgucGFyZW50ID0gbnVsbDtcbiAgfVxuICBlbHNlIGlmIChsT2JqIGluc3RhbmNlb2YgTEVkZ2UpIHtcbiAgICBlZGdlID0gbE9iajtcbiAgICBpZiAoZWRnZSA9PSBudWxsKSB7XG4gICAgICB0aHJvdyBcIkVkZ2UgaXMgbnVsbCFcIjtcbiAgICB9XG4gICAgaWYgKCFlZGdlLmlzSW50ZXJHcmFwaCkge1xuICAgICAgdGhyb3cgXCJOb3QgYW4gaW50ZXItZ3JhcGggZWRnZSFcIjtcbiAgICB9XG4gICAgaWYgKCEoZWRnZS5zb3VyY2UgIT0gbnVsbCAmJiBlZGdlLnRhcmdldCAhPSBudWxsKSkge1xuICAgICAgdGhyb3cgXCJTb3VyY2UgYW5kL29yIHRhcmdldCBpcyBudWxsIVwiO1xuICAgIH1cblxuICAgIC8vIHJlbW92ZSBlZGdlIGZyb20gc291cmNlIGFuZCB0YXJnZXQgbm9kZXMnIGluY2lkZW5jeSBsaXN0c1xuXG4gICAgaWYgKCEoZWRnZS5zb3VyY2UuZWRnZXMuaW5kZXhPZihlZGdlKSAhPSAtMSAmJiBlZGdlLnRhcmdldC5lZGdlcy5pbmRleE9mKGVkZ2UpICE9IC0xKSkge1xuICAgICAgdGhyb3cgXCJTb3VyY2UgYW5kL29yIHRhcmdldCBkb2Vzbid0IGtub3cgdGhpcyBlZGdlIVwiO1xuICAgIH1cblxuICAgIHZhciBpbmRleCA9IGVkZ2Uuc291cmNlLmVkZ2VzLmluZGV4T2YoZWRnZSk7XG4gICAgZWRnZS5zb3VyY2UuZWRnZXMuc3BsaWNlKGluZGV4LCAxKTtcbiAgICBpbmRleCA9IGVkZ2UudGFyZ2V0LmVkZ2VzLmluZGV4T2YoZWRnZSk7XG4gICAgZWRnZS50YXJnZXQuZWRnZXMuc3BsaWNlKGluZGV4LCAxKTtcblxuICAgIC8vIHJlbW92ZSBlZGdlIGZyb20gb3duZXIgZ3JhcGggbWFuYWdlcidzIGludGVyLWdyYXBoIGVkZ2UgbGlzdFxuXG4gICAgaWYgKCEoZWRnZS5zb3VyY2Uub3duZXIgIT0gbnVsbCAmJiBlZGdlLnNvdXJjZS5vd25lci5nZXRHcmFwaE1hbmFnZXIoKSAhPSBudWxsKSkge1xuICAgICAgdGhyb3cgXCJFZGdlIG93bmVyIGdyYXBoIG9yIG93bmVyIGdyYXBoIG1hbmFnZXIgaXMgbnVsbCFcIjtcbiAgICB9XG4gICAgaWYgKGVkZ2Uuc291cmNlLm93bmVyLmdldEdyYXBoTWFuYWdlcigpLmVkZ2VzLmluZGV4T2YoZWRnZSkgPT0gLTEpIHtcbiAgICAgIHRocm93IFwiTm90IGluIG93bmVyIGdyYXBoIG1hbmFnZXIncyBlZGdlIGxpc3QhXCI7XG4gICAgfVxuXG4gICAgdmFyIGluZGV4ID0gZWRnZS5zb3VyY2Uub3duZXIuZ2V0R3JhcGhNYW5hZ2VyKCkuZWRnZXMuaW5kZXhPZihlZGdlKTtcbiAgICBlZGdlLnNvdXJjZS5vd25lci5nZXRHcmFwaE1hbmFnZXIoKS5lZGdlcy5zcGxpY2UoaW5kZXgsIDEpO1xuICB9XG59O1xuXG5MR3JhcGhNYW5hZ2VyLnByb3RvdHlwZS51cGRhdGVCb3VuZHMgPSBmdW5jdGlvbiAoKVxue1xuICB0aGlzLnJvb3RHcmFwaC51cGRhdGVCb3VuZHModHJ1ZSk7XG59O1xuXG5MR3JhcGhNYW5hZ2VyLnByb3RvdHlwZS5nZXRHcmFwaHMgPSBmdW5jdGlvbiAoKVxue1xuICByZXR1cm4gdGhpcy5ncmFwaHM7XG59O1xuXG5MR3JhcGhNYW5hZ2VyLnByb3RvdHlwZS5nZXRBbGxOb2RlcyA9IGZ1bmN0aW9uICgpXG57XG4gIGlmICh0aGlzLmFsbE5vZGVzID09IG51bGwpXG4gIHtcbiAgICB2YXIgbm9kZUxpc3QgPSBbXTtcbiAgICB2YXIgZ3JhcGhzID0gdGhpcy5nZXRHcmFwaHMoKTtcbiAgICB2YXIgcyA9IGdyYXBocy5sZW5ndGg7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzOyBpKyspXG4gICAge1xuICAgICAgbm9kZUxpc3QgPSBub2RlTGlzdC5jb25jYXQoZ3JhcGhzW2ldLmdldE5vZGVzKCkpO1xuICAgIH1cbiAgICB0aGlzLmFsbE5vZGVzID0gbm9kZUxpc3Q7XG4gIH1cbiAgcmV0dXJuIHRoaXMuYWxsTm9kZXM7XG59O1xuXG5MR3JhcGhNYW5hZ2VyLnByb3RvdHlwZS5yZXNldEFsbE5vZGVzID0gZnVuY3Rpb24gKClcbntcbiAgdGhpcy5hbGxOb2RlcyA9IG51bGw7XG59O1xuXG5MR3JhcGhNYW5hZ2VyLnByb3RvdHlwZS5yZXNldEFsbEVkZ2VzID0gZnVuY3Rpb24gKClcbntcbiAgdGhpcy5hbGxFZGdlcyA9IG51bGw7XG59O1xuXG5MR3JhcGhNYW5hZ2VyLnByb3RvdHlwZS5yZXNldEFsbE5vZGVzVG9BcHBseUdyYXZpdGF0aW9uID0gZnVuY3Rpb24gKClcbntcbiAgdGhpcy5hbGxOb2Rlc1RvQXBwbHlHcmF2aXRhdGlvbiA9IG51bGw7XG59O1xuXG5MR3JhcGhNYW5hZ2VyLnByb3RvdHlwZS5nZXRBbGxFZGdlcyA9IGZ1bmN0aW9uICgpXG57XG4gIGlmICh0aGlzLmFsbEVkZ2VzID09IG51bGwpXG4gIHtcbiAgICB2YXIgZWRnZUxpc3QgPSBbXTtcbiAgICB2YXIgZ3JhcGhzID0gdGhpcy5nZXRHcmFwaHMoKTtcbiAgICB2YXIgcyA9IGdyYXBocy5sZW5ndGg7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBncmFwaHMubGVuZ3RoOyBpKyspXG4gICAge1xuICAgICAgZWRnZUxpc3QgPSBlZGdlTGlzdC5jb25jYXQoZ3JhcGhzW2ldLmdldEVkZ2VzKCkpO1xuICAgIH1cblxuICAgIGVkZ2VMaXN0ID0gZWRnZUxpc3QuY29uY2F0KHRoaXMuZWRnZXMpO1xuXG4gICAgdGhpcy5hbGxFZGdlcyA9IGVkZ2VMaXN0O1xuICB9XG4gIHJldHVybiB0aGlzLmFsbEVkZ2VzO1xufTtcblxuTEdyYXBoTWFuYWdlci5wcm90b3R5cGUuZ2V0QWxsTm9kZXNUb0FwcGx5R3Jhdml0YXRpb24gPSBmdW5jdGlvbiAoKVxue1xuICByZXR1cm4gdGhpcy5hbGxOb2Rlc1RvQXBwbHlHcmF2aXRhdGlvbjtcbn07XG5cbkxHcmFwaE1hbmFnZXIucHJvdG90eXBlLnNldEFsbE5vZGVzVG9BcHBseUdyYXZpdGF0aW9uID0gZnVuY3Rpb24gKG5vZGVMaXN0KVxue1xuICBpZiAodGhpcy5hbGxOb2Rlc1RvQXBwbHlHcmF2aXRhdGlvbiAhPSBudWxsKSB7XG4gICAgdGhyb3cgXCJhc3NlcnQgZmFpbGVkXCI7XG4gIH1cblxuICB0aGlzLmFsbE5vZGVzVG9BcHBseUdyYXZpdGF0aW9uID0gbm9kZUxpc3Q7XG59O1xuXG5MR3JhcGhNYW5hZ2VyLnByb3RvdHlwZS5nZXRSb290ID0gZnVuY3Rpb24gKClcbntcbiAgcmV0dXJuIHRoaXMucm9vdEdyYXBoO1xufTtcblxuTEdyYXBoTWFuYWdlci5wcm90b3R5cGUuc2V0Um9vdEdyYXBoID0gZnVuY3Rpb24gKGdyYXBoKVxue1xuICBpZiAoZ3JhcGguZ2V0R3JhcGhNYW5hZ2VyKCkgIT0gdGhpcykge1xuICAgIHRocm93IFwiUm9vdCBub3QgaW4gdGhpcyBncmFwaCBtZ3IhXCI7XG4gIH1cblxuICB0aGlzLnJvb3RHcmFwaCA9IGdyYXBoO1xuICAvLyByb290IGdyYXBoIG11c3QgaGF2ZSBhIHJvb3Qgbm9kZSBhc3NvY2lhdGVkIHdpdGggaXQgZm9yIGNvbnZlbmllbmNlXG4gIGlmIChncmFwaC5wYXJlbnQgPT0gbnVsbClcbiAge1xuICAgIGdyYXBoLnBhcmVudCA9IHRoaXMubGF5b3V0Lm5ld05vZGUoXCJSb290IG5vZGVcIik7XG4gIH1cbn07XG5cbkxHcmFwaE1hbmFnZXIucHJvdG90eXBlLmdldExheW91dCA9IGZ1bmN0aW9uICgpXG57XG4gIHJldHVybiB0aGlzLmxheW91dDtcbn07XG5cbkxHcmFwaE1hbmFnZXIucHJvdG90eXBlLmlzT25lQW5jZXN0b3JPZk90aGVyID0gZnVuY3Rpb24gKGZpcnN0Tm9kZSwgc2Vjb25kTm9kZSlcbntcbiAgaWYgKCEoZmlyc3ROb2RlICE9IG51bGwgJiYgc2Vjb25kTm9kZSAhPSBudWxsKSkge1xuICAgIHRocm93IFwiYXNzZXJ0IGZhaWxlZFwiO1xuICB9XG5cbiAgaWYgKGZpcnN0Tm9kZSA9PSBzZWNvbmROb2RlKVxuICB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbiAgLy8gSXMgc2Vjb25kIG5vZGUgYW4gYW5jZXN0b3Igb2YgdGhlIGZpcnN0IG9uZT9cbiAgdmFyIG93bmVyR3JhcGggPSBmaXJzdE5vZGUuZ2V0T3duZXIoKTtcbiAgdmFyIHBhcmVudE5vZGU7XG5cbiAgZG9cbiAge1xuICAgIHBhcmVudE5vZGUgPSBvd25lckdyYXBoLmdldFBhcmVudCgpO1xuXG4gICAgaWYgKHBhcmVudE5vZGUgPT0gbnVsbClcbiAgICB7XG4gICAgICBicmVhaztcbiAgICB9XG5cbiAgICBpZiAocGFyZW50Tm9kZSA9PSBzZWNvbmROb2RlKVxuICAgIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIG93bmVyR3JhcGggPSBwYXJlbnROb2RlLmdldE93bmVyKCk7XG4gICAgaWYgKG93bmVyR3JhcGggPT0gbnVsbClcbiAgICB7XG4gICAgICBicmVhaztcbiAgICB9XG4gIH0gd2hpbGUgKHRydWUpO1xuICAvLyBJcyBmaXJzdCBub2RlIGFuIGFuY2VzdG9yIG9mIHRoZSBzZWNvbmQgb25lP1xuICBvd25lckdyYXBoID0gc2Vjb25kTm9kZS5nZXRPd25lcigpO1xuXG4gIGRvXG4gIHtcbiAgICBwYXJlbnROb2RlID0gb3duZXJHcmFwaC5nZXRQYXJlbnQoKTtcblxuICAgIGlmIChwYXJlbnROb2RlID09IG51bGwpXG4gICAge1xuICAgICAgYnJlYWs7XG4gICAgfVxuXG4gICAgaWYgKHBhcmVudE5vZGUgPT0gZmlyc3ROb2RlKVxuICAgIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIG93bmVyR3JhcGggPSBwYXJlbnROb2RlLmdldE93bmVyKCk7XG4gICAgaWYgKG93bmVyR3JhcGggPT0gbnVsbClcbiAgICB7XG4gICAgICBicmVhaztcbiAgICB9XG4gIH0gd2hpbGUgKHRydWUpO1xuXG4gIHJldHVybiBmYWxzZTtcbn07XG5cbkxHcmFwaE1hbmFnZXIucHJvdG90eXBlLmNhbGNMb3dlc3RDb21tb25BbmNlc3RvcnMgPSBmdW5jdGlvbiAoKVxue1xuICB2YXIgZWRnZTtcbiAgdmFyIHNvdXJjZU5vZGU7XG4gIHZhciB0YXJnZXROb2RlO1xuICB2YXIgc291cmNlQW5jZXN0b3JHcmFwaDtcbiAgdmFyIHRhcmdldEFuY2VzdG9yR3JhcGg7XG5cbiAgdmFyIGVkZ2VzID0gdGhpcy5nZXRBbGxFZGdlcygpO1xuICB2YXIgcyA9IGVkZ2VzLmxlbmd0aDtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBzOyBpKyspXG4gIHtcbiAgICBlZGdlID0gZWRnZXNbaV07XG5cbiAgICBzb3VyY2VOb2RlID0gZWRnZS5zb3VyY2U7XG4gICAgdGFyZ2V0Tm9kZSA9IGVkZ2UudGFyZ2V0O1xuICAgIGVkZ2UubGNhID0gbnVsbDtcbiAgICBlZGdlLnNvdXJjZUluTGNhID0gc291cmNlTm9kZTtcbiAgICBlZGdlLnRhcmdldEluTGNhID0gdGFyZ2V0Tm9kZTtcblxuICAgIGlmIChzb3VyY2VOb2RlID09IHRhcmdldE5vZGUpXG4gICAge1xuICAgICAgZWRnZS5sY2EgPSBzb3VyY2VOb2RlLmdldE93bmVyKCk7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBzb3VyY2VBbmNlc3RvckdyYXBoID0gc291cmNlTm9kZS5nZXRPd25lcigpO1xuXG4gICAgd2hpbGUgKGVkZ2UubGNhID09IG51bGwpXG4gICAge1xuICAgICAgZWRnZS50YXJnZXRJbkxjYSA9IHRhcmdldE5vZGU7ICBcbiAgICAgIHRhcmdldEFuY2VzdG9yR3JhcGggPSB0YXJnZXROb2RlLmdldE93bmVyKCk7XG5cbiAgICAgIHdoaWxlIChlZGdlLmxjYSA9PSBudWxsKVxuICAgICAge1xuICAgICAgICBpZiAodGFyZ2V0QW5jZXN0b3JHcmFwaCA9PSBzb3VyY2VBbmNlc3RvckdyYXBoKVxuICAgICAgICB7XG4gICAgICAgICAgZWRnZS5sY2EgPSB0YXJnZXRBbmNlc3RvckdyYXBoO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRhcmdldEFuY2VzdG9yR3JhcGggPT0gdGhpcy5yb290R3JhcGgpXG4gICAgICAgIHtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChlZGdlLmxjYSAhPSBudWxsKSB7XG4gICAgICAgICAgdGhyb3cgXCJhc3NlcnQgZmFpbGVkXCI7XG4gICAgICAgIH1cbiAgICAgICAgZWRnZS50YXJnZXRJbkxjYSA9IHRhcmdldEFuY2VzdG9yR3JhcGguZ2V0UGFyZW50KCk7XG4gICAgICAgIHRhcmdldEFuY2VzdG9yR3JhcGggPSBlZGdlLnRhcmdldEluTGNhLmdldE93bmVyKCk7XG4gICAgICB9XG5cbiAgICAgIGlmIChzb3VyY2VBbmNlc3RvckdyYXBoID09IHRoaXMucm9vdEdyYXBoKVxuICAgICAge1xuICAgICAgICBicmVhaztcbiAgICAgIH1cblxuICAgICAgaWYgKGVkZ2UubGNhID09IG51bGwpXG4gICAgICB7XG4gICAgICAgIGVkZ2Uuc291cmNlSW5MY2EgPSBzb3VyY2VBbmNlc3RvckdyYXBoLmdldFBhcmVudCgpO1xuICAgICAgICBzb3VyY2VBbmNlc3RvckdyYXBoID0gZWRnZS5zb3VyY2VJbkxjYS5nZXRPd25lcigpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChlZGdlLmxjYSA9PSBudWxsKSB7XG4gICAgICB0aHJvdyBcImFzc2VydCBmYWlsZWRcIjtcbiAgICB9XG4gIH1cbn07XG5cbkxHcmFwaE1hbmFnZXIucHJvdG90eXBlLmNhbGNMb3dlc3RDb21tb25BbmNlc3RvciA9IGZ1bmN0aW9uIChmaXJzdE5vZGUsIHNlY29uZE5vZGUpXG57XG4gIGlmIChmaXJzdE5vZGUgPT0gc2Vjb25kTm9kZSlcbiAge1xuICAgIHJldHVybiBmaXJzdE5vZGUuZ2V0T3duZXIoKTtcbiAgfVxuICB2YXIgZmlyc3RPd25lckdyYXBoID0gZmlyc3ROb2RlLmdldE93bmVyKCk7XG5cbiAgZG9cbiAge1xuICAgIGlmIChmaXJzdE93bmVyR3JhcGggPT0gbnVsbClcbiAgICB7XG4gICAgICBicmVhaztcbiAgICB9XG4gICAgdmFyIHNlY29uZE93bmVyR3JhcGggPSBzZWNvbmROb2RlLmdldE93bmVyKCk7XG5cbiAgICBkb1xuICAgIHtcbiAgICAgIGlmIChzZWNvbmRPd25lckdyYXBoID09IG51bGwpXG4gICAgICB7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuXG4gICAgICBpZiAoc2Vjb25kT3duZXJHcmFwaCA9PSBmaXJzdE93bmVyR3JhcGgpXG4gICAgICB7XG4gICAgICAgIHJldHVybiBzZWNvbmRPd25lckdyYXBoO1xuICAgICAgfVxuICAgICAgc2Vjb25kT3duZXJHcmFwaCA9IHNlY29uZE93bmVyR3JhcGguZ2V0UGFyZW50KCkuZ2V0T3duZXIoKTtcbiAgICB9IHdoaWxlICh0cnVlKTtcblxuICAgIGZpcnN0T3duZXJHcmFwaCA9IGZpcnN0T3duZXJHcmFwaC5nZXRQYXJlbnQoKS5nZXRPd25lcigpO1xuICB9IHdoaWxlICh0cnVlKTtcblxuICByZXR1cm4gZmlyc3RPd25lckdyYXBoO1xufTtcblxuTEdyYXBoTWFuYWdlci5wcm90b3R5cGUuY2FsY0luY2x1c2lvblRyZWVEZXB0aHMgPSBmdW5jdGlvbiAoZ3JhcGgsIGRlcHRoKSB7XG4gIGlmIChncmFwaCA9PSBudWxsICYmIGRlcHRoID09IG51bGwpIHtcbiAgICBncmFwaCA9IHRoaXMucm9vdEdyYXBoO1xuICAgIGRlcHRoID0gMTtcbiAgfVxuICB2YXIgbm9kZTtcblxuICB2YXIgbm9kZXMgPSBncmFwaC5nZXROb2RlcygpO1xuICB2YXIgcyA9IG5vZGVzLmxlbmd0aDtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBzOyBpKyspXG4gIHtcbiAgICBub2RlID0gbm9kZXNbaV07XG4gICAgbm9kZS5pbmNsdXNpb25UcmVlRGVwdGggPSBkZXB0aDtcblxuICAgIGlmIChub2RlLmNoaWxkICE9IG51bGwpXG4gICAge1xuICAgICAgdGhpcy5jYWxjSW5jbHVzaW9uVHJlZURlcHRocyhub2RlLmNoaWxkLCBkZXB0aCArIDEpO1xuICAgIH1cbiAgfVxufTtcblxuTEdyYXBoTWFuYWdlci5wcm90b3R5cGUuaW5jbHVkZXNJbnZhbGlkRWRnZSA9IGZ1bmN0aW9uICgpXG57XG4gIHZhciBlZGdlO1xuXG4gIHZhciBzID0gdGhpcy5lZGdlcy5sZW5ndGg7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgczsgaSsrKVxuICB7XG4gICAgZWRnZSA9IHRoaXMuZWRnZXNbaV07XG5cbiAgICBpZiAodGhpcy5pc09uZUFuY2VzdG9yT2ZPdGhlcihlZGdlLnNvdXJjZSwgZWRnZS50YXJnZXQpKVxuICAgIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgfVxuICByZXR1cm4gZmFsc2U7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IExHcmFwaE1hbmFnZXI7XG4iLCJmdW5jdGlvbiBMR3JhcGhPYmplY3QodkdyYXBoT2JqZWN0KSB7XG4gIHRoaXMudkdyYXBoT2JqZWN0ID0gdkdyYXBoT2JqZWN0O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IExHcmFwaE9iamVjdDtcbiIsInZhciBMR3JhcGhPYmplY3QgPSByZXF1aXJlKCcuL0xHcmFwaE9iamVjdCcpO1xudmFyIEludGVnZXIgPSByZXF1aXJlKCcuL0ludGVnZXInKTtcbnZhciBSZWN0YW5nbGVEID0gcmVxdWlyZSgnLi9SZWN0YW5nbGVEJyk7XG52YXIgTGF5b3V0Q29uc3RhbnRzID0gcmVxdWlyZSgnLi9MYXlvdXRDb25zdGFudHMnKTtcbnZhciBSYW5kb21TZWVkID0gcmVxdWlyZSgnLi9SYW5kb21TZWVkJyk7XG52YXIgUG9pbnREID0gcmVxdWlyZSgnLi9Qb2ludEQnKTtcbnZhciBIYXNoU2V0ID0gcmVxdWlyZSgnLi9IYXNoU2V0Jyk7XG5cbmZ1bmN0aW9uIExOb2RlKGdtLCBsb2MsIHNpemUsIHZOb2RlKSB7XG4gIC8vQWx0ZXJuYXRpdmUgY29uc3RydWN0b3IgMSA6IExOb2RlKExHcmFwaE1hbmFnZXIgZ20sIFBvaW50IGxvYywgRGltZW5zaW9uIHNpemUsIE9iamVjdCB2Tm9kZSlcbiAgaWYgKHNpemUgPT0gbnVsbCAmJiB2Tm9kZSA9PSBudWxsKSB7XG4gICAgdk5vZGUgPSBsb2M7XG4gIH1cblxuICBMR3JhcGhPYmplY3QuY2FsbCh0aGlzLCB2Tm9kZSk7XG5cbiAgLy9BbHRlcm5hdGl2ZSBjb25zdHJ1Y3RvciAyIDogTE5vZGUoTGF5b3V0IGxheW91dCwgT2JqZWN0IHZOb2RlKVxuICBpZiAoZ20uZ3JhcGhNYW5hZ2VyICE9IG51bGwpXG4gICAgZ20gPSBnbS5ncmFwaE1hbmFnZXI7XG5cbiAgdGhpcy5lc3RpbWF0ZWRTaXplID0gSW50ZWdlci5NSU5fVkFMVUU7XG4gIHRoaXMuaW5jbHVzaW9uVHJlZURlcHRoID0gSW50ZWdlci5NQVhfVkFMVUU7XG4gIHRoaXMudkdyYXBoT2JqZWN0ID0gdk5vZGU7XG4gIHRoaXMuZWRnZXMgPSBbXTtcbiAgdGhpcy5ncmFwaE1hbmFnZXIgPSBnbTtcblxuICBpZiAoc2l6ZSAhPSBudWxsICYmIGxvYyAhPSBudWxsKVxuICAgIHRoaXMucmVjdCA9IG5ldyBSZWN0YW5nbGVEKGxvYy54LCBsb2MueSwgc2l6ZS53aWR0aCwgc2l6ZS5oZWlnaHQpO1xuICBlbHNlXG4gICAgdGhpcy5yZWN0ID0gbmV3IFJlY3RhbmdsZUQoKTtcbn1cblxuTE5vZGUucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShMR3JhcGhPYmplY3QucHJvdG90eXBlKTtcbmZvciAodmFyIHByb3AgaW4gTEdyYXBoT2JqZWN0KSB7XG4gIExOb2RlW3Byb3BdID0gTEdyYXBoT2JqZWN0W3Byb3BdO1xufVxuXG5MTm9kZS5wcm90b3R5cGUuZ2V0RWRnZXMgPSBmdW5jdGlvbiAoKVxue1xuICByZXR1cm4gdGhpcy5lZGdlcztcbn07XG5cbkxOb2RlLnByb3RvdHlwZS5nZXRDaGlsZCA9IGZ1bmN0aW9uICgpXG57XG4gIHJldHVybiB0aGlzLmNoaWxkO1xufTtcblxuTE5vZGUucHJvdG90eXBlLmdldE93bmVyID0gZnVuY3Rpb24gKClcbntcbi8vICBpZiAodGhpcy5vd25lciAhPSBudWxsKSB7XG4vLyAgICBpZiAoISh0aGlzLm93bmVyID09IG51bGwgfHwgdGhpcy5vd25lci5nZXROb2RlcygpLmluZGV4T2YodGhpcykgPiAtMSkpIHtcbi8vICAgICAgdGhyb3cgXCJhc3NlcnQgZmFpbGVkXCI7XG4vLyAgICB9XG4vLyAgfVxuXG4gIHJldHVybiB0aGlzLm93bmVyO1xufTtcblxuTE5vZGUucHJvdG90eXBlLmdldFdpZHRoID0gZnVuY3Rpb24gKClcbntcbiAgcmV0dXJuIHRoaXMucmVjdC53aWR0aDtcbn07XG5cbkxOb2RlLnByb3RvdHlwZS5zZXRXaWR0aCA9IGZ1bmN0aW9uICh3aWR0aClcbntcbiAgdGhpcy5yZWN0LndpZHRoID0gd2lkdGg7XG59O1xuXG5MTm9kZS5wcm90b3R5cGUuZ2V0SGVpZ2h0ID0gZnVuY3Rpb24gKClcbntcbiAgcmV0dXJuIHRoaXMucmVjdC5oZWlnaHQ7XG59O1xuXG5MTm9kZS5wcm90b3R5cGUuc2V0SGVpZ2h0ID0gZnVuY3Rpb24gKGhlaWdodClcbntcbiAgdGhpcy5yZWN0LmhlaWdodCA9IGhlaWdodDtcbn07XG5cbkxOb2RlLnByb3RvdHlwZS5nZXRDZW50ZXJYID0gZnVuY3Rpb24gKClcbntcbiAgcmV0dXJuIHRoaXMucmVjdC54ICsgdGhpcy5yZWN0LndpZHRoIC8gMjtcbn07XG5cbkxOb2RlLnByb3RvdHlwZS5nZXRDZW50ZXJZID0gZnVuY3Rpb24gKClcbntcbiAgcmV0dXJuIHRoaXMucmVjdC55ICsgdGhpcy5yZWN0LmhlaWdodCAvIDI7XG59O1xuXG5MTm9kZS5wcm90b3R5cGUuZ2V0Q2VudGVyID0gZnVuY3Rpb24gKClcbntcbiAgcmV0dXJuIG5ldyBQb2ludEQodGhpcy5yZWN0LnggKyB0aGlzLnJlY3Qud2lkdGggLyAyLFxuICAgICAgICAgIHRoaXMucmVjdC55ICsgdGhpcy5yZWN0LmhlaWdodCAvIDIpO1xufTtcblxuTE5vZGUucHJvdG90eXBlLmdldExvY2F0aW9uID0gZnVuY3Rpb24gKClcbntcbiAgcmV0dXJuIG5ldyBQb2ludEQodGhpcy5yZWN0LngsIHRoaXMucmVjdC55KTtcbn07XG5cbkxOb2RlLnByb3RvdHlwZS5nZXRSZWN0ID0gZnVuY3Rpb24gKClcbntcbiAgcmV0dXJuIHRoaXMucmVjdDtcbn07XG5cbkxOb2RlLnByb3RvdHlwZS5nZXREaWFnb25hbCA9IGZ1bmN0aW9uICgpXG57XG4gIHJldHVybiBNYXRoLnNxcnQodGhpcy5yZWN0LndpZHRoICogdGhpcy5yZWN0LndpZHRoICtcbiAgICAgICAgICB0aGlzLnJlY3QuaGVpZ2h0ICogdGhpcy5yZWN0LmhlaWdodCk7XG59O1xuXG5MTm9kZS5wcm90b3R5cGUuc2V0UmVjdCA9IGZ1bmN0aW9uICh1cHBlckxlZnQsIGRpbWVuc2lvbilcbntcbiAgdGhpcy5yZWN0LnggPSB1cHBlckxlZnQueDtcbiAgdGhpcy5yZWN0LnkgPSB1cHBlckxlZnQueTtcbiAgdGhpcy5yZWN0LndpZHRoID0gZGltZW5zaW9uLndpZHRoO1xuICB0aGlzLnJlY3QuaGVpZ2h0ID0gZGltZW5zaW9uLmhlaWdodDtcbn07XG5cbkxOb2RlLnByb3RvdHlwZS5zZXRDZW50ZXIgPSBmdW5jdGlvbiAoY3gsIGN5KVxue1xuICB0aGlzLnJlY3QueCA9IGN4IC0gdGhpcy5yZWN0LndpZHRoIC8gMjtcbiAgdGhpcy5yZWN0LnkgPSBjeSAtIHRoaXMucmVjdC5oZWlnaHQgLyAyO1xufTtcblxuTE5vZGUucHJvdG90eXBlLnNldExvY2F0aW9uID0gZnVuY3Rpb24gKHgsIHkpXG57XG4gIHRoaXMucmVjdC54ID0geDtcbiAgdGhpcy5yZWN0LnkgPSB5O1xufTtcblxuTE5vZGUucHJvdG90eXBlLm1vdmVCeSA9IGZ1bmN0aW9uIChkeCwgZHkpXG57XG4gIHRoaXMucmVjdC54ICs9IGR4O1xuICB0aGlzLnJlY3QueSArPSBkeTtcbn07XG5cbkxOb2RlLnByb3RvdHlwZS5nZXRFZGdlTGlzdFRvTm9kZSA9IGZ1bmN0aW9uICh0bylcbntcbiAgdmFyIGVkZ2VMaXN0ID0gW107XG4gIHZhciBlZGdlO1xuICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgc2VsZi5lZGdlcy5mb3JFYWNoKGZ1bmN0aW9uKGVkZ2UpIHtcbiAgICBcbiAgICBpZiAoZWRnZS50YXJnZXQgPT0gdG8pXG4gICAge1xuICAgICAgaWYgKGVkZ2Uuc291cmNlICE9IHNlbGYpXG4gICAgICAgIHRocm93IFwiSW5jb3JyZWN0IGVkZ2Ugc291cmNlIVwiO1xuXG4gICAgICBlZGdlTGlzdC5wdXNoKGVkZ2UpO1xuICAgIH1cbiAgfSk7XG5cbiAgcmV0dXJuIGVkZ2VMaXN0O1xufTtcblxuTE5vZGUucHJvdG90eXBlLmdldEVkZ2VzQmV0d2VlbiA9IGZ1bmN0aW9uIChvdGhlcilcbntcbiAgdmFyIGVkZ2VMaXN0ID0gW107XG4gIHZhciBlZGdlO1xuICBcbiAgdmFyIHNlbGYgPSB0aGlzO1xuICBzZWxmLmVkZ2VzLmZvckVhY2goZnVuY3Rpb24oZWRnZSkge1xuXG4gICAgaWYgKCEoZWRnZS5zb3VyY2UgPT0gc2VsZiB8fCBlZGdlLnRhcmdldCA9PSBzZWxmKSlcbiAgICAgIHRocm93IFwiSW5jb3JyZWN0IGVkZ2Ugc291cmNlIGFuZC9vciB0YXJnZXRcIjtcblxuICAgIGlmICgoZWRnZS50YXJnZXQgPT0gb3RoZXIpIHx8IChlZGdlLnNvdXJjZSA9PSBvdGhlcikpXG4gICAge1xuICAgICAgZWRnZUxpc3QucHVzaChlZGdlKTtcbiAgICB9XG4gIH0pO1xuXG4gIHJldHVybiBlZGdlTGlzdDtcbn07XG5cbkxOb2RlLnByb3RvdHlwZS5nZXROZWlnaGJvcnNMaXN0ID0gZnVuY3Rpb24gKClcbntcbiAgdmFyIG5laWdoYm9ycyA9IG5ldyBIYXNoU2V0KCk7XG4gIHZhciBlZGdlO1xuICBcbiAgdmFyIHNlbGYgPSB0aGlzO1xuICBzZWxmLmVkZ2VzLmZvckVhY2goZnVuY3Rpb24oZWRnZSkge1xuXG4gICAgaWYgKGVkZ2Uuc291cmNlID09IHNlbGYpXG4gICAge1xuICAgICAgbmVpZ2hib3JzLmFkZChlZGdlLnRhcmdldCk7XG4gICAgfVxuICAgIGVsc2VcbiAgICB7XG4gICAgICBpZiAoZWRnZS50YXJnZXQgIT0gc2VsZikge1xuICAgICAgICB0aHJvdyBcIkluY29ycmVjdCBpbmNpZGVuY3khXCI7XG4gICAgICB9XG4gICAgXG4gICAgICBuZWlnaGJvcnMuYWRkKGVkZ2Uuc291cmNlKTtcbiAgICB9XG4gIH0pO1xuXG4gIHJldHVybiBuZWlnaGJvcnM7XG59O1xuXG5MTm9kZS5wcm90b3R5cGUud2l0aENoaWxkcmVuID0gZnVuY3Rpb24gKClcbntcbiAgdmFyIHdpdGhOZWlnaGJvcnNMaXN0ID0gbmV3IFNldCgpO1xuICB2YXIgY2hpbGROb2RlO1xuICB2YXIgY2hpbGRyZW47XG5cbiAgd2l0aE5laWdoYm9yc0xpc3QuYWRkKHRoaXMpO1xuXG4gIGlmICh0aGlzLmNoaWxkICE9IG51bGwpXG4gIHtcbiAgICB2YXIgbm9kZXMgPSB0aGlzLmNoaWxkLmdldE5vZGVzKCk7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBub2Rlcy5sZW5ndGg7IGkrKylcbiAgICB7XG4gICAgICBjaGlsZE5vZGUgPSBub2Rlc1tpXTtcbiAgICAgIGNoaWxkcmVuID0gY2hpbGROb2RlLndpdGhDaGlsZHJlbigpO1xuICAgICAgY2hpbGRyZW4uZm9yRWFjaChmdW5jdGlvbihub2RlKSB7XG4gICAgICAgIHdpdGhOZWlnaGJvcnNMaXN0LmFkZChub2RlKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiB3aXRoTmVpZ2hib3JzTGlzdDtcbn07XG5cbkxOb2RlLnByb3RvdHlwZS5nZXROb09mQ2hpbGRyZW4gPSBmdW5jdGlvbiAoKVxue1xuICB2YXIgbm9PZkNoaWxkcmVuID0gMDtcbiAgdmFyIGNoaWxkTm9kZTtcblxuICBpZih0aGlzLmNoaWxkID09IG51bGwpe1xuICAgIG5vT2ZDaGlsZHJlbiA9IDE7XG4gIH1cbiAgZWxzZVxuICB7XG4gICAgdmFyIG5vZGVzID0gdGhpcy5jaGlsZC5nZXROb2RlcygpO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbm9kZXMubGVuZ3RoOyBpKyspXG4gICAge1xuICAgICAgY2hpbGROb2RlID0gbm9kZXNbaV07XG5cbiAgICAgIG5vT2ZDaGlsZHJlbiArPSBjaGlsZE5vZGUuZ2V0Tm9PZkNoaWxkcmVuKCk7XG4gICAgfVxuICB9XG4gIFxuICBpZihub09mQ2hpbGRyZW4gPT0gMCl7XG4gICAgbm9PZkNoaWxkcmVuID0gMTtcbiAgfVxuICByZXR1cm4gbm9PZkNoaWxkcmVuO1xufTtcblxuTE5vZGUucHJvdG90eXBlLmdldEVzdGltYXRlZFNpemUgPSBmdW5jdGlvbiAoKSB7XG4gIGlmICh0aGlzLmVzdGltYXRlZFNpemUgPT0gSW50ZWdlci5NSU5fVkFMVUUpIHtcbiAgICB0aHJvdyBcImFzc2VydCBmYWlsZWRcIjtcbiAgfVxuICByZXR1cm4gdGhpcy5lc3RpbWF0ZWRTaXplO1xufTtcblxuTE5vZGUucHJvdG90eXBlLmNhbGNFc3RpbWF0ZWRTaXplID0gZnVuY3Rpb24gKCkge1xuICBpZiAodGhpcy5jaGlsZCA9PSBudWxsKVxuICB7XG4gICAgcmV0dXJuIHRoaXMuZXN0aW1hdGVkU2l6ZSA9ICh0aGlzLnJlY3Qud2lkdGggKyB0aGlzLnJlY3QuaGVpZ2h0KSAvIDI7XG4gIH1cbiAgZWxzZVxuICB7XG4gICAgdGhpcy5lc3RpbWF0ZWRTaXplID0gdGhpcy5jaGlsZC5jYWxjRXN0aW1hdGVkU2l6ZSgpO1xuICAgIHRoaXMucmVjdC53aWR0aCA9IHRoaXMuZXN0aW1hdGVkU2l6ZTtcbiAgICB0aGlzLnJlY3QuaGVpZ2h0ID0gdGhpcy5lc3RpbWF0ZWRTaXplO1xuXG4gICAgcmV0dXJuIHRoaXMuZXN0aW1hdGVkU2l6ZTtcbiAgfVxufTtcblxuTE5vZGUucHJvdG90eXBlLnNjYXR0ZXIgPSBmdW5jdGlvbiAoKSB7XG4gIHZhciByYW5kb21DZW50ZXJYO1xuICB2YXIgcmFuZG9tQ2VudGVyWTtcblxuICB2YXIgbWluWCA9IC1MYXlvdXRDb25zdGFudHMuSU5JVElBTF9XT1JMRF9CT1VOREFSWTtcbiAgdmFyIG1heFggPSBMYXlvdXRDb25zdGFudHMuSU5JVElBTF9XT1JMRF9CT1VOREFSWTtcbiAgcmFuZG9tQ2VudGVyWCA9IExheW91dENvbnN0YW50cy5XT1JMRF9DRU5URVJfWCArXG4gICAgICAgICAgKFJhbmRvbVNlZWQubmV4dERvdWJsZSgpICogKG1heFggLSBtaW5YKSkgKyBtaW5YO1xuXG4gIHZhciBtaW5ZID0gLUxheW91dENvbnN0YW50cy5JTklUSUFMX1dPUkxEX0JPVU5EQVJZO1xuICB2YXIgbWF4WSA9IExheW91dENvbnN0YW50cy5JTklUSUFMX1dPUkxEX0JPVU5EQVJZO1xuICByYW5kb21DZW50ZXJZID0gTGF5b3V0Q29uc3RhbnRzLldPUkxEX0NFTlRFUl9ZICtcbiAgICAgICAgICAoUmFuZG9tU2VlZC5uZXh0RG91YmxlKCkgKiAobWF4WSAtIG1pblkpKSArIG1pblk7XG5cbiAgdGhpcy5yZWN0LnggPSByYW5kb21DZW50ZXJYO1xuICB0aGlzLnJlY3QueSA9IHJhbmRvbUNlbnRlcllcbn07XG5cbkxOb2RlLnByb3RvdHlwZS51cGRhdGVCb3VuZHMgPSBmdW5jdGlvbiAoKSB7XG4gIGlmICh0aGlzLmdldENoaWxkKCkgPT0gbnVsbCkge1xuICAgIHRocm93IFwiYXNzZXJ0IGZhaWxlZFwiO1xuICB9XG4gIGlmICh0aGlzLmdldENoaWxkKCkuZ2V0Tm9kZXMoKS5sZW5ndGggIT0gMClcbiAge1xuICAgIC8vIHdyYXAgdGhlIGNoaWxkcmVuIG5vZGVzIGJ5IHJlLWFycmFuZ2luZyB0aGUgYm91bmRhcmllc1xuICAgIHZhciBjaGlsZEdyYXBoID0gdGhpcy5nZXRDaGlsZCgpO1xuICAgIGNoaWxkR3JhcGgudXBkYXRlQm91bmRzKHRydWUpO1xuXG4gICAgdGhpcy5yZWN0LnggPSBjaGlsZEdyYXBoLmdldExlZnQoKTtcbiAgICB0aGlzLnJlY3QueSA9IGNoaWxkR3JhcGguZ2V0VG9wKCk7XG5cbiAgICB0aGlzLnNldFdpZHRoKGNoaWxkR3JhcGguZ2V0UmlnaHQoKSAtIGNoaWxkR3JhcGguZ2V0TGVmdCgpKTtcbiAgICB0aGlzLnNldEhlaWdodChjaGlsZEdyYXBoLmdldEJvdHRvbSgpIC0gY2hpbGRHcmFwaC5nZXRUb3AoKSk7XG4gICAgXG4gICAgLy8gVXBkYXRlIGNvbXBvdW5kIGJvdW5kcyBjb25zaWRlcmluZyBpdHMgbGFiZWwgcHJvcGVydGllcyAgICBcbiAgICBpZihMYXlvdXRDb25zdGFudHMuTk9ERV9ESU1FTlNJT05TX0lOQ0xVREVfTEFCRUxTKXtcbiAgICAgICAgXG4gICAgICB2YXIgd2lkdGggPSBjaGlsZEdyYXBoLmdldFJpZ2h0KCkgLSBjaGlsZEdyYXBoLmdldExlZnQoKTtcbiAgICAgIHZhciBoZWlnaHQgPSBjaGlsZEdyYXBoLmdldEJvdHRvbSgpIC0gY2hpbGRHcmFwaC5nZXRUb3AoKTtcblxuICAgICAgaWYodGhpcy5sYWJlbFdpZHRoID4gd2lkdGgpe1xuICAgICAgICB0aGlzLnJlY3QueCAtPSAodGhpcy5sYWJlbFdpZHRoIC0gd2lkdGgpIC8gMjtcbiAgICAgICAgdGhpcy5zZXRXaWR0aCh0aGlzLmxhYmVsV2lkdGgpO1xuICAgICAgfVxuXG4gICAgICBpZih0aGlzLmxhYmVsSGVpZ2h0ID4gaGVpZ2h0KXtcbiAgICAgICAgaWYodGhpcy5sYWJlbFBvcyA9PSBcImNlbnRlclwiKXtcbiAgICAgICAgICB0aGlzLnJlY3QueSAtPSAodGhpcy5sYWJlbEhlaWdodCAtIGhlaWdodCkgLyAyO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYodGhpcy5sYWJlbFBvcyA9PSBcInRvcFwiKXtcbiAgICAgICAgICB0aGlzLnJlY3QueSAtPSAodGhpcy5sYWJlbEhlaWdodCAtIGhlaWdodCk7IFxuICAgICAgICB9XG4gICAgICAgIHRoaXMuc2V0SGVpZ2h0KHRoaXMubGFiZWxIZWlnaHQpO1xuICAgICAgfVxuICAgIH1cbiAgfVxufTtcblxuTE5vZGUucHJvdG90eXBlLmdldEluY2x1c2lvblRyZWVEZXB0aCA9IGZ1bmN0aW9uICgpXG57XG4gIGlmICh0aGlzLmluY2x1c2lvblRyZWVEZXB0aCA9PSBJbnRlZ2VyLk1BWF9WQUxVRSkge1xuICAgIHRocm93IFwiYXNzZXJ0IGZhaWxlZFwiO1xuICB9XG4gIHJldHVybiB0aGlzLmluY2x1c2lvblRyZWVEZXB0aDtcbn07XG5cbkxOb2RlLnByb3RvdHlwZS50cmFuc2Zvcm0gPSBmdW5jdGlvbiAodHJhbnMpXG57XG4gIHZhciBsZWZ0ID0gdGhpcy5yZWN0Lng7XG5cbiAgaWYgKGxlZnQgPiBMYXlvdXRDb25zdGFudHMuV09STERfQk9VTkRBUlkpXG4gIHtcbiAgICBsZWZ0ID0gTGF5b3V0Q29uc3RhbnRzLldPUkxEX0JPVU5EQVJZO1xuICB9XG4gIGVsc2UgaWYgKGxlZnQgPCAtTGF5b3V0Q29uc3RhbnRzLldPUkxEX0JPVU5EQVJZKVxuICB7XG4gICAgbGVmdCA9IC1MYXlvdXRDb25zdGFudHMuV09STERfQk9VTkRBUlk7XG4gIH1cblxuICB2YXIgdG9wID0gdGhpcy5yZWN0Lnk7XG5cbiAgaWYgKHRvcCA+IExheW91dENvbnN0YW50cy5XT1JMRF9CT1VOREFSWSlcbiAge1xuICAgIHRvcCA9IExheW91dENvbnN0YW50cy5XT1JMRF9CT1VOREFSWTtcbiAgfVxuICBlbHNlIGlmICh0b3AgPCAtTGF5b3V0Q29uc3RhbnRzLldPUkxEX0JPVU5EQVJZKVxuICB7XG4gICAgdG9wID0gLUxheW91dENvbnN0YW50cy5XT1JMRF9CT1VOREFSWTtcbiAgfVxuXG4gIHZhciBsZWZ0VG9wID0gbmV3IFBvaW50RChsZWZ0LCB0b3ApO1xuICB2YXIgdkxlZnRUb3AgPSB0cmFucy5pbnZlcnNlVHJhbnNmb3JtUG9pbnQobGVmdFRvcCk7XG5cbiAgdGhpcy5zZXRMb2NhdGlvbih2TGVmdFRvcC54LCB2TGVmdFRvcC55KTtcbn07XG5cbkxOb2RlLnByb3RvdHlwZS5nZXRMZWZ0ID0gZnVuY3Rpb24gKClcbntcbiAgcmV0dXJuIHRoaXMucmVjdC54O1xufTtcblxuTE5vZGUucHJvdG90eXBlLmdldFJpZ2h0ID0gZnVuY3Rpb24gKClcbntcbiAgcmV0dXJuIHRoaXMucmVjdC54ICsgdGhpcy5yZWN0LndpZHRoO1xufTtcblxuTE5vZGUucHJvdG90eXBlLmdldFRvcCA9IGZ1bmN0aW9uICgpXG57XG4gIHJldHVybiB0aGlzLnJlY3QueTtcbn07XG5cbkxOb2RlLnByb3RvdHlwZS5nZXRCb3R0b20gPSBmdW5jdGlvbiAoKVxue1xuICByZXR1cm4gdGhpcy5yZWN0LnkgKyB0aGlzLnJlY3QuaGVpZ2h0O1xufTtcblxuTE5vZGUucHJvdG90eXBlLmdldFBhcmVudCA9IGZ1bmN0aW9uICgpXG57XG4gIGlmICh0aGlzLm93bmVyID09IG51bGwpXG4gIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIHJldHVybiB0aGlzLm93bmVyLmdldFBhcmVudCgpO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBMTm9kZTtcbiIsInZhciBMYXlvdXRDb25zdGFudHMgPSByZXF1aXJlKCcuL0xheW91dENvbnN0YW50cycpO1xudmFyIEhhc2hNYXAgPSByZXF1aXJlKCcuL0hhc2hNYXAnKTtcbnZhciBMR3JhcGhNYW5hZ2VyID0gcmVxdWlyZSgnLi9MR3JhcGhNYW5hZ2VyJyk7XG52YXIgTE5vZGUgPSByZXF1aXJlKCcuL0xOb2RlJyk7XG52YXIgTEVkZ2UgPSByZXF1aXJlKCcuL0xFZGdlJyk7XG52YXIgTEdyYXBoID0gcmVxdWlyZSgnLi9MR3JhcGgnKTtcbnZhciBQb2ludEQgPSByZXF1aXJlKCcuL1BvaW50RCcpO1xudmFyIFRyYW5zZm9ybSA9IHJlcXVpcmUoJy4vVHJhbnNmb3JtJyk7XG52YXIgRW1pdHRlciA9IHJlcXVpcmUoJy4vRW1pdHRlcicpO1xudmFyIEhhc2hTZXQgPSByZXF1aXJlKCcuL0hhc2hTZXQnKTtcblxuZnVuY3Rpb24gTGF5b3V0KGlzUmVtb3RlVXNlKSB7XG4gIEVtaXR0ZXIuY2FsbCggdGhpcyApO1xuXG4gIC8vTGF5b3V0IFF1YWxpdHk6IDA6cHJvb2YsIDE6ZGVmYXVsdCwgMjpkcmFmdFxuICB0aGlzLmxheW91dFF1YWxpdHkgPSBMYXlvdXRDb25zdGFudHMuREVGQVVMVF9RVUFMSVRZO1xuICAvL1doZXRoZXIgbGF5b3V0IHNob3VsZCBjcmVhdGUgYmVuZHBvaW50cyBhcyBuZWVkZWQgb3Igbm90XG4gIHRoaXMuY3JlYXRlQmVuZHNBc05lZWRlZCA9XG4gICAgICAgICAgTGF5b3V0Q29uc3RhbnRzLkRFRkFVTFRfQ1JFQVRFX0JFTkRTX0FTX05FRURFRDtcbiAgLy9XaGV0aGVyIGxheW91dCBzaG91bGQgYmUgaW5jcmVtZW50YWwgb3Igbm90XG4gIHRoaXMuaW5jcmVtZW50YWwgPSBMYXlvdXRDb25zdGFudHMuREVGQVVMVF9JTkNSRU1FTlRBTDtcbiAgLy9XaGV0aGVyIHdlIGFuaW1hdGUgZnJvbSBiZWZvcmUgdG8gYWZ0ZXIgbGF5b3V0IG5vZGUgcG9zaXRpb25zXG4gIHRoaXMuYW5pbWF0aW9uT25MYXlvdXQgPVxuICAgICAgICAgIExheW91dENvbnN0YW50cy5ERUZBVUxUX0FOSU1BVElPTl9PTl9MQVlPVVQ7XG4gIC8vV2hldGhlciB3ZSBhbmltYXRlIHRoZSBsYXlvdXQgcHJvY2VzcyBvciBub3RcbiAgdGhpcy5hbmltYXRpb25EdXJpbmdMYXlvdXQgPSBMYXlvdXRDb25zdGFudHMuREVGQVVMVF9BTklNQVRJT05fRFVSSU5HX0xBWU9VVDtcbiAgLy9OdW1iZXIgaXRlcmF0aW9ucyB0aGF0IHNob3VsZCBiZSBkb25lIGJldHdlZW4gdHdvIHN1Y2Nlc3NpdmUgYW5pbWF0aW9uc1xuICB0aGlzLmFuaW1hdGlvblBlcmlvZCA9IExheW91dENvbnN0YW50cy5ERUZBVUxUX0FOSU1BVElPTl9QRVJJT0Q7XG4gIC8qKlxuICAgKiBXaGV0aGVyIG9yIG5vdCBsZWFmIG5vZGVzIChub24tY29tcG91bmQgbm9kZXMpIGFyZSBvZiB1bmlmb3JtIHNpemVzLiBXaGVuXG4gICAqIHRoZXkgYXJlLCBib3RoIHNwcmluZyBhbmQgcmVwdWxzaW9uIGZvcmNlcyBiZXR3ZWVuIHR3byBsZWFmIG5vZGVzIGNhbiBiZVxuICAgKiBjYWxjdWxhdGVkIHdpdGhvdXQgdGhlIGV4cGVuc2l2ZSBjbGlwcGluZyBwb2ludCBjYWxjdWxhdGlvbnMsIHJlc3VsdGluZ1xuICAgKiBpbiBtYWpvciBzcGVlZC11cC5cbiAgICovXG4gIHRoaXMudW5pZm9ybUxlYWZOb2RlU2l6ZXMgPVxuICAgICAgICAgIExheW91dENvbnN0YW50cy5ERUZBVUxUX1VOSUZPUk1fTEVBRl9OT0RFX1NJWkVTO1xuICAvKipcbiAgICogVGhpcyBpcyB1c2VkIGZvciBjcmVhdGlvbiBvZiBiZW5kcG9pbnRzIGJ5IHVzaW5nIGR1bW15IG5vZGVzIGFuZCBlZGdlcy5cbiAgICogTWFwcyBhbiBMRWRnZSB0byBpdHMgZHVtbXkgYmVuZHBvaW50IHBhdGguXG4gICAqL1xuICB0aGlzLmVkZ2VUb0R1bW15Tm9kZXMgPSBuZXcgSGFzaE1hcCgpO1xuICB0aGlzLmdyYXBoTWFuYWdlciA9IG5ldyBMR3JhcGhNYW5hZ2VyKHRoaXMpO1xuICB0aGlzLmlzTGF5b3V0RmluaXNoZWQgPSBmYWxzZTtcbiAgdGhpcy5pc1N1YkxheW91dCA9IGZhbHNlO1xuICB0aGlzLmlzUmVtb3RlVXNlID0gZmFsc2U7XG5cbiAgaWYgKGlzUmVtb3RlVXNlICE9IG51bGwpIHtcbiAgICB0aGlzLmlzUmVtb3RlVXNlID0gaXNSZW1vdGVVc2U7XG4gIH1cbn1cblxuTGF5b3V0LlJBTkRPTV9TRUVEID0gMTtcblxuTGF5b3V0LnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoIEVtaXR0ZXIucHJvdG90eXBlICk7XG5cbkxheW91dC5wcm90b3R5cGUuZ2V0R3JhcGhNYW5hZ2VyID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4gdGhpcy5ncmFwaE1hbmFnZXI7XG59O1xuXG5MYXlvdXQucHJvdG90eXBlLmdldEFsbE5vZGVzID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4gdGhpcy5ncmFwaE1hbmFnZXIuZ2V0QWxsTm9kZXMoKTtcbn07XG5cbkxheW91dC5wcm90b3R5cGUuZ2V0QWxsRWRnZXMgPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiB0aGlzLmdyYXBoTWFuYWdlci5nZXRBbGxFZGdlcygpO1xufTtcblxuTGF5b3V0LnByb3RvdHlwZS5nZXRBbGxOb2Rlc1RvQXBwbHlHcmF2aXRhdGlvbiA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIHRoaXMuZ3JhcGhNYW5hZ2VyLmdldEFsbE5vZGVzVG9BcHBseUdyYXZpdGF0aW9uKCk7XG59O1xuXG5MYXlvdXQucHJvdG90eXBlLm5ld0dyYXBoTWFuYWdlciA9IGZ1bmN0aW9uICgpIHtcbiAgdmFyIGdtID0gbmV3IExHcmFwaE1hbmFnZXIodGhpcyk7XG4gIHRoaXMuZ3JhcGhNYW5hZ2VyID0gZ207XG4gIHJldHVybiBnbTtcbn07XG5cbkxheW91dC5wcm90b3R5cGUubmV3R3JhcGggPSBmdW5jdGlvbiAodkdyYXBoKVxue1xuICByZXR1cm4gbmV3IExHcmFwaChudWxsLCB0aGlzLmdyYXBoTWFuYWdlciwgdkdyYXBoKTtcbn07XG5cbkxheW91dC5wcm90b3R5cGUubmV3Tm9kZSA9IGZ1bmN0aW9uICh2Tm9kZSlcbntcbiAgcmV0dXJuIG5ldyBMTm9kZSh0aGlzLmdyYXBoTWFuYWdlciwgdk5vZGUpO1xufTtcblxuTGF5b3V0LnByb3RvdHlwZS5uZXdFZGdlID0gZnVuY3Rpb24gKHZFZGdlKVxue1xuICByZXR1cm4gbmV3IExFZGdlKG51bGwsIG51bGwsIHZFZGdlKTtcbn07XG5cbkxheW91dC5wcm90b3R5cGUuY2hlY2tMYXlvdXRTdWNjZXNzID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiAodGhpcy5ncmFwaE1hbmFnZXIuZ2V0Um9vdCgpID09IG51bGwpXG4gICAgICAgICAgfHwgdGhpcy5ncmFwaE1hbmFnZXIuZ2V0Um9vdCgpLmdldE5vZGVzKCkubGVuZ3RoID09IDBcbiAgICAgICAgICB8fCB0aGlzLmdyYXBoTWFuYWdlci5pbmNsdWRlc0ludmFsaWRFZGdlKCk7XG59O1xuXG5MYXlvdXQucHJvdG90eXBlLnJ1bkxheW91dCA9IGZ1bmN0aW9uICgpXG57XG4gIHRoaXMuaXNMYXlvdXRGaW5pc2hlZCA9IGZhbHNlO1xuICBcbiAgaWYgKHRoaXMudGlsaW5nUHJlTGF5b3V0KSB7XG4gICAgdGhpcy50aWxpbmdQcmVMYXlvdXQoKTtcbiAgfVxuXG4gIHRoaXMuaW5pdFBhcmFtZXRlcnMoKTtcbiAgdmFyIGlzTGF5b3V0U3VjY2Vzc2Z1bGw7XG5cbiAgaWYgKHRoaXMuY2hlY2tMYXlvdXRTdWNjZXNzKCkpXG4gIHtcbiAgICBpc0xheW91dFN1Y2Nlc3NmdWxsID0gZmFsc2U7XG4gIH1cbiAgZWxzZVxuICB7XG4gICAgaXNMYXlvdXRTdWNjZXNzZnVsbCA9IHRoaXMubGF5b3V0KCk7XG4gIH1cbiAgXG4gIGlmIChMYXlvdXRDb25zdGFudHMuQU5JTUFURSA9PT0gJ2R1cmluZycpIHtcbiAgICAvLyBJZiB0aGlzIGlzIGEgJ2R1cmluZycgbGF5b3V0IGFuaW1hdGlvbi4gTGF5b3V0IGlzIG5vdCBmaW5pc2hlZCB5ZXQuIFxuICAgIC8vIFdlIG5lZWQgdG8gcGVyZm9ybSB0aGVzZSBpbiBpbmRleC5qcyB3aGVuIGxheW91dCBpcyByZWFsbHkgZmluaXNoZWQuXG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIFxuICBpZiAoaXNMYXlvdXRTdWNjZXNzZnVsbClcbiAge1xuICAgIGlmICghdGhpcy5pc1N1YkxheW91dClcbiAgICB7XG4gICAgICB0aGlzLmRvUG9zdExheW91dCgpO1xuICAgIH1cbiAgfVxuXG4gIGlmICh0aGlzLnRpbGluZ1Bvc3RMYXlvdXQpIHtcbiAgICB0aGlzLnRpbGluZ1Bvc3RMYXlvdXQoKTtcbiAgfVxuXG4gIHRoaXMuaXNMYXlvdXRGaW5pc2hlZCA9IHRydWU7XG5cbiAgcmV0dXJuIGlzTGF5b3V0U3VjY2Vzc2Z1bGw7XG59O1xuXG4vKipcbiAqIFRoaXMgbWV0aG9kIHBlcmZvcm1zIHRoZSBvcGVyYXRpb25zIHJlcXVpcmVkIGFmdGVyIGxheW91dC5cbiAqL1xuTGF5b3V0LnByb3RvdHlwZS5kb1Bvc3RMYXlvdXQgPSBmdW5jdGlvbiAoKVxue1xuICAvL2Fzc2VydCAhaXNTdWJMYXlvdXQgOiBcIlNob3VsZCBub3QgYmUgY2FsbGVkIG9uIHN1Yi1sYXlvdXQhXCI7XG4gIC8vIFByb3BhZ2F0ZSBnZW9tZXRyaWMgY2hhbmdlcyB0byB2LWxldmVsIG9iamVjdHNcbiAgaWYoIXRoaXMuaW5jcmVtZW50YWwpe1xuICAgIHRoaXMudHJhbnNmb3JtKCk7XG4gIH1cbiAgdGhpcy51cGRhdGUoKTtcbn07XG5cbi8qKlxuICogVGhpcyBtZXRob2QgdXBkYXRlcyB0aGUgZ2VvbWV0cnkgb2YgdGhlIHRhcmdldCBncmFwaCBhY2NvcmRpbmcgdG9cbiAqIGNhbGN1bGF0ZWQgbGF5b3V0LlxuICovXG5MYXlvdXQucHJvdG90eXBlLnVwZGF0ZTIgPSBmdW5jdGlvbiAoKSB7XG4gIC8vIHVwZGF0ZSBiZW5kIHBvaW50c1xuICBpZiAodGhpcy5jcmVhdGVCZW5kc0FzTmVlZGVkKVxuICB7XG4gICAgdGhpcy5jcmVhdGVCZW5kcG9pbnRzRnJvbUR1bW15Tm9kZXMoKTtcblxuICAgIC8vIHJlc2V0IGFsbCBlZGdlcywgc2luY2UgdGhlIHRvcG9sb2d5IGhhcyBjaGFuZ2VkXG4gICAgdGhpcy5ncmFwaE1hbmFnZXIucmVzZXRBbGxFZGdlcygpO1xuICB9XG5cbiAgLy8gcGVyZm9ybSBlZGdlLCBub2RlIGFuZCByb290IHVwZGF0ZXMgaWYgbGF5b3V0IGlzIG5vdCBjYWxsZWRcbiAgLy8gcmVtb3RlbHlcbiAgaWYgKCF0aGlzLmlzUmVtb3RlVXNlKVxuICB7XG4gICAgLy8gdXBkYXRlIGFsbCBlZGdlc1xuICAgIHZhciBlZGdlO1xuICAgIHZhciBhbGxFZGdlcyA9IHRoaXMuZ3JhcGhNYW5hZ2VyLmdldEFsbEVkZ2VzKCk7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhbGxFZGdlcy5sZW5ndGg7IGkrKylcbiAgICB7XG4gICAgICBlZGdlID0gYWxsRWRnZXNbaV07XG4vLyAgICAgIHRoaXMudXBkYXRlKGVkZ2UpO1xuICAgIH1cblxuICAgIC8vIHJlY3Vyc2l2ZWx5IHVwZGF0ZSBub2Rlc1xuICAgIHZhciBub2RlO1xuICAgIHZhciBub2RlcyA9IHRoaXMuZ3JhcGhNYW5hZ2VyLmdldFJvb3QoKS5nZXROb2RlcygpO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbm9kZXMubGVuZ3RoOyBpKyspXG4gICAge1xuICAgICAgbm9kZSA9IG5vZGVzW2ldO1xuLy8gICAgICB0aGlzLnVwZGF0ZShub2RlKTtcbiAgICB9XG5cbiAgICAvLyB1cGRhdGUgcm9vdCBncmFwaFxuICAgIHRoaXMudXBkYXRlKHRoaXMuZ3JhcGhNYW5hZ2VyLmdldFJvb3QoKSk7XG4gIH1cbn07XG5cbkxheW91dC5wcm90b3R5cGUudXBkYXRlID0gZnVuY3Rpb24gKG9iaikge1xuICBpZiAob2JqID09IG51bGwpIHtcbiAgICB0aGlzLnVwZGF0ZTIoKTtcbiAgfVxuICBlbHNlIGlmIChvYmogaW5zdGFuY2VvZiBMTm9kZSkge1xuICAgIHZhciBub2RlID0gb2JqO1xuICAgIGlmIChub2RlLmdldENoaWxkKCkgIT0gbnVsbClcbiAgICB7XG4gICAgICAvLyBzaW5jZSBub2RlIGlzIGNvbXBvdW5kLCByZWN1cnNpdmVseSB1cGRhdGUgY2hpbGQgbm9kZXNcbiAgICAgIHZhciBub2RlcyA9IG5vZGUuZ2V0Q2hpbGQoKS5nZXROb2RlcygpO1xuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBub2Rlcy5sZW5ndGg7IGkrKylcbiAgICAgIHtcbiAgICAgICAgdXBkYXRlKG5vZGVzW2ldKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBpZiB0aGUgbC1sZXZlbCBub2RlIGlzIGFzc29jaWF0ZWQgd2l0aCBhIHYtbGV2ZWwgZ3JhcGggb2JqZWN0LFxuICAgIC8vIHRoZW4gaXQgaXMgYXNzdW1lZCB0aGF0IHRoZSB2LWxldmVsIG5vZGUgaW1wbGVtZW50cyB0aGVcbiAgICAvLyBpbnRlcmZhY2UgVXBkYXRhYmxlLlxuICAgIGlmIChub2RlLnZHcmFwaE9iamVjdCAhPSBudWxsKVxuICAgIHtcbiAgICAgIC8vIGNhc3QgdG8gVXBkYXRhYmxlIHdpdGhvdXQgYW55IHR5cGUgY2hlY2tcbiAgICAgIHZhciB2Tm9kZSA9IG5vZGUudkdyYXBoT2JqZWN0O1xuXG4gICAgICAvLyBjYWxsIHRoZSB1cGRhdGUgbWV0aG9kIG9mIHRoZSBpbnRlcmZhY2VcbiAgICAgIHZOb2RlLnVwZGF0ZShub2RlKTtcbiAgICB9XG4gIH1cbiAgZWxzZSBpZiAob2JqIGluc3RhbmNlb2YgTEVkZ2UpIHtcbiAgICB2YXIgZWRnZSA9IG9iajtcbiAgICAvLyBpZiB0aGUgbC1sZXZlbCBlZGdlIGlzIGFzc29jaWF0ZWQgd2l0aCBhIHYtbGV2ZWwgZ3JhcGggb2JqZWN0LFxuICAgIC8vIHRoZW4gaXQgaXMgYXNzdW1lZCB0aGF0IHRoZSB2LWxldmVsIGVkZ2UgaW1wbGVtZW50cyB0aGVcbiAgICAvLyBpbnRlcmZhY2UgVXBkYXRhYmxlLlxuXG4gICAgaWYgKGVkZ2UudkdyYXBoT2JqZWN0ICE9IG51bGwpXG4gICAge1xuICAgICAgLy8gY2FzdCB0byBVcGRhdGFibGUgd2l0aG91dCBhbnkgdHlwZSBjaGVja1xuICAgICAgdmFyIHZFZGdlID0gZWRnZS52R3JhcGhPYmplY3Q7XG5cbiAgICAgIC8vIGNhbGwgdGhlIHVwZGF0ZSBtZXRob2Qgb2YgdGhlIGludGVyZmFjZVxuICAgICAgdkVkZ2UudXBkYXRlKGVkZ2UpO1xuICAgIH1cbiAgfVxuICBlbHNlIGlmIChvYmogaW5zdGFuY2VvZiBMR3JhcGgpIHtcbiAgICB2YXIgZ3JhcGggPSBvYmo7XG4gICAgLy8gaWYgdGhlIGwtbGV2ZWwgZ3JhcGggaXMgYXNzb2NpYXRlZCB3aXRoIGEgdi1sZXZlbCBncmFwaCBvYmplY3QsXG4gICAgLy8gdGhlbiBpdCBpcyBhc3N1bWVkIHRoYXQgdGhlIHYtbGV2ZWwgb2JqZWN0IGltcGxlbWVudHMgdGhlXG4gICAgLy8gaW50ZXJmYWNlIFVwZGF0YWJsZS5cblxuICAgIGlmIChncmFwaC52R3JhcGhPYmplY3QgIT0gbnVsbClcbiAgICB7XG4gICAgICAvLyBjYXN0IHRvIFVwZGF0YWJsZSB3aXRob3V0IGFueSB0eXBlIGNoZWNrXG4gICAgICB2YXIgdkdyYXBoID0gZ3JhcGgudkdyYXBoT2JqZWN0O1xuXG4gICAgICAvLyBjYWxsIHRoZSB1cGRhdGUgbWV0aG9kIG9mIHRoZSBpbnRlcmZhY2VcbiAgICAgIHZHcmFwaC51cGRhdGUoZ3JhcGgpO1xuICAgIH1cbiAgfVxufTtcblxuLyoqXG4gKiBUaGlzIG1ldGhvZCBpcyB1c2VkIHRvIHNldCBhbGwgbGF5b3V0IHBhcmFtZXRlcnMgdG8gZGVmYXVsdCB2YWx1ZXNcbiAqIGRldGVybWluZWQgYXQgY29tcGlsZSB0aW1lLlxuICovXG5MYXlvdXQucHJvdG90eXBlLmluaXRQYXJhbWV0ZXJzID0gZnVuY3Rpb24gKCkge1xuICBpZiAoIXRoaXMuaXNTdWJMYXlvdXQpXG4gIHtcbiAgICB0aGlzLmxheW91dFF1YWxpdHkgPSBMYXlvdXRDb25zdGFudHMuREVGQVVMVF9RVUFMSVRZO1xuICAgIHRoaXMuYW5pbWF0aW9uRHVyaW5nTGF5b3V0ID0gTGF5b3V0Q29uc3RhbnRzLkRFRkFVTFRfQU5JTUFUSU9OX0RVUklOR19MQVlPVVQ7XG4gICAgdGhpcy5hbmltYXRpb25QZXJpb2QgPSBMYXlvdXRDb25zdGFudHMuREVGQVVMVF9BTklNQVRJT05fUEVSSU9EO1xuICAgIHRoaXMuYW5pbWF0aW9uT25MYXlvdXQgPSBMYXlvdXRDb25zdGFudHMuREVGQVVMVF9BTklNQVRJT05fT05fTEFZT1VUO1xuICAgIHRoaXMuaW5jcmVtZW50YWwgPSBMYXlvdXRDb25zdGFudHMuREVGQVVMVF9JTkNSRU1FTlRBTDtcbiAgICB0aGlzLmNyZWF0ZUJlbmRzQXNOZWVkZWQgPSBMYXlvdXRDb25zdGFudHMuREVGQVVMVF9DUkVBVEVfQkVORFNfQVNfTkVFREVEO1xuICAgIHRoaXMudW5pZm9ybUxlYWZOb2RlU2l6ZXMgPSBMYXlvdXRDb25zdGFudHMuREVGQVVMVF9VTklGT1JNX0xFQUZfTk9ERV9TSVpFUztcbiAgfVxuXG4gIGlmICh0aGlzLmFuaW1hdGlvbkR1cmluZ0xheW91dClcbiAge1xuICAgIHRoaXMuYW5pbWF0aW9uT25MYXlvdXQgPSBmYWxzZTtcbiAgfVxufTtcblxuTGF5b3V0LnByb3RvdHlwZS50cmFuc2Zvcm0gPSBmdW5jdGlvbiAobmV3TGVmdFRvcCkge1xuICBpZiAobmV3TGVmdFRvcCA9PSB1bmRlZmluZWQpIHtcbiAgICB0aGlzLnRyYW5zZm9ybShuZXcgUG9pbnREKDAsIDApKTtcbiAgfVxuICBlbHNlIHtcbiAgICAvLyBjcmVhdGUgYSB0cmFuc2Zvcm1hdGlvbiBvYmplY3QgKGZyb20gRWNsaXBzZSB0byBsYXlvdXQpLiBXaGVuIGFuXG4gICAgLy8gaW52ZXJzZSB0cmFuc2Zvcm0gaXMgYXBwbGllZCwgd2UgZ2V0IHVwcGVyLWxlZnQgY29vcmRpbmF0ZSBvZiB0aGVcbiAgICAvLyBkcmF3aW5nIG9yIHRoZSByb290IGdyYXBoIGF0IGdpdmVuIGlucHV0IGNvb3JkaW5hdGUgKHNvbWUgbWFyZ2luc1xuICAgIC8vIGFscmVhZHkgaW5jbHVkZWQgaW4gY2FsY3VsYXRpb24gb2YgbGVmdC10b3ApLlxuXG4gICAgdmFyIHRyYW5zID0gbmV3IFRyYW5zZm9ybSgpO1xuICAgIHZhciBsZWZ0VG9wID0gdGhpcy5ncmFwaE1hbmFnZXIuZ2V0Um9vdCgpLnVwZGF0ZUxlZnRUb3AoKTtcblxuICAgIGlmIChsZWZ0VG9wICE9IG51bGwpXG4gICAge1xuICAgICAgdHJhbnMuc2V0V29ybGRPcmdYKG5ld0xlZnRUb3AueCk7XG4gICAgICB0cmFucy5zZXRXb3JsZE9yZ1kobmV3TGVmdFRvcC55KTtcblxuICAgICAgdHJhbnMuc2V0RGV2aWNlT3JnWChsZWZ0VG9wLngpO1xuICAgICAgdHJhbnMuc2V0RGV2aWNlT3JnWShsZWZ0VG9wLnkpO1xuXG4gICAgICB2YXIgbm9kZXMgPSB0aGlzLmdldEFsbE5vZGVzKCk7XG4gICAgICB2YXIgbm9kZTtcblxuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBub2Rlcy5sZW5ndGg7IGkrKylcbiAgICAgIHtcbiAgICAgICAgbm9kZSA9IG5vZGVzW2ldO1xuICAgICAgICBub2RlLnRyYW5zZm9ybSh0cmFucyk7XG4gICAgICB9XG4gICAgfVxuICB9XG59O1xuXG5MYXlvdXQucHJvdG90eXBlLnBvc2l0aW9uTm9kZXNSYW5kb21seSA9IGZ1bmN0aW9uIChncmFwaCkge1xuXG4gIGlmIChncmFwaCA9PSB1bmRlZmluZWQpIHtcbiAgICAvL2Fzc2VydCAhdGhpcy5pbmNyZW1lbnRhbDtcbiAgICB0aGlzLnBvc2l0aW9uTm9kZXNSYW5kb21seSh0aGlzLmdldEdyYXBoTWFuYWdlcigpLmdldFJvb3QoKSk7XG4gICAgdGhpcy5nZXRHcmFwaE1hbmFnZXIoKS5nZXRSb290KCkudXBkYXRlQm91bmRzKHRydWUpO1xuICB9XG4gIGVsc2Uge1xuICAgIHZhciBsTm9kZTtcbiAgICB2YXIgY2hpbGRHcmFwaDtcblxuICAgIHZhciBub2RlcyA9IGdyYXBoLmdldE5vZGVzKCk7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBub2Rlcy5sZW5ndGg7IGkrKylcbiAgICB7XG4gICAgICBsTm9kZSA9IG5vZGVzW2ldO1xuICAgICAgY2hpbGRHcmFwaCA9IGxOb2RlLmdldENoaWxkKCk7XG5cbiAgICAgIGlmIChjaGlsZEdyYXBoID09IG51bGwpXG4gICAgICB7XG4gICAgICAgIGxOb2RlLnNjYXR0ZXIoKTtcbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKGNoaWxkR3JhcGguZ2V0Tm9kZXMoKS5sZW5ndGggPT0gMClcbiAgICAgIHtcbiAgICAgICAgbE5vZGUuc2NhdHRlcigpO1xuICAgICAgfVxuICAgICAgZWxzZVxuICAgICAge1xuICAgICAgICB0aGlzLnBvc2l0aW9uTm9kZXNSYW5kb21seShjaGlsZEdyYXBoKTtcbiAgICAgICAgbE5vZGUudXBkYXRlQm91bmRzKCk7XG4gICAgICB9XG4gICAgfVxuICB9XG59O1xuXG4vKipcbiAqIFRoaXMgbWV0aG9kIHJldHVybnMgYSBsaXN0IG9mIHRyZWVzIHdoZXJlIGVhY2ggdHJlZSBpcyByZXByZXNlbnRlZCBhcyBhXG4gKiBsaXN0IG9mIGwtbm9kZXMuIFRoZSBtZXRob2QgcmV0dXJucyBhIGxpc3Qgb2Ygc2l6ZSAwIHdoZW46XG4gKiAtIFRoZSBncmFwaCBpcyBub3QgZmxhdCBvclxuICogLSBPbmUgb2YgdGhlIGNvbXBvbmVudChzKSBvZiB0aGUgZ3JhcGggaXMgbm90IGEgdHJlZS5cbiAqL1xuTGF5b3V0LnByb3RvdHlwZS5nZXRGbGF0Rm9yZXN0ID0gZnVuY3Rpb24gKClcbntcbiAgdmFyIGZsYXRGb3Jlc3QgPSBbXTtcbiAgdmFyIGlzRm9yZXN0ID0gdHJ1ZTtcblxuICAvLyBRdWljayByZWZlcmVuY2UgZm9yIGFsbCBub2RlcyBpbiB0aGUgZ3JhcGggbWFuYWdlciBhc3NvY2lhdGVkIHdpdGhcbiAgLy8gdGhpcyBsYXlvdXQuIFRoZSBsaXN0IHNob3VsZCBub3QgYmUgY2hhbmdlZC5cbiAgdmFyIGFsbE5vZGVzID0gdGhpcy5ncmFwaE1hbmFnZXIuZ2V0Um9vdCgpLmdldE5vZGVzKCk7XG5cbiAgLy8gRmlyc3QgYmUgc3VyZSB0aGF0IHRoZSBncmFwaCBpcyBmbGF0XG4gIHZhciBpc0ZsYXQgPSB0cnVlO1xuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgYWxsTm9kZXMubGVuZ3RoOyBpKyspXG4gIHtcbiAgICBpZiAoYWxsTm9kZXNbaV0uZ2V0Q2hpbGQoKSAhPSBudWxsKVxuICAgIHtcbiAgICAgIGlzRmxhdCA9IGZhbHNlO1xuICAgIH1cbiAgfVxuXG4gIC8vIFJldHVybiBlbXB0eSBmb3Jlc3QgaWYgdGhlIGdyYXBoIGlzIG5vdCBmbGF0LlxuICBpZiAoIWlzRmxhdClcbiAge1xuICAgIHJldHVybiBmbGF0Rm9yZXN0O1xuICB9XG5cbiAgLy8gUnVuIEJGUyBmb3IgZWFjaCBjb21wb25lbnQgb2YgdGhlIGdyYXBoLlxuXG4gIHZhciB2aXNpdGVkID0gbmV3IEhhc2hTZXQoKTtcbiAgdmFyIHRvQmVWaXNpdGVkID0gW107XG4gIHZhciBwYXJlbnRzID0gbmV3IEhhc2hNYXAoKTtcbiAgdmFyIHVuUHJvY2Vzc2VkTm9kZXMgPSBbXTtcblxuICB1blByb2Nlc3NlZE5vZGVzID0gdW5Qcm9jZXNzZWROb2Rlcy5jb25jYXQoYWxsTm9kZXMpO1xuXG4gIC8vIEVhY2ggaXRlcmF0aW9uIG9mIHRoaXMgbG9vcCBmaW5kcyBhIGNvbXBvbmVudCBvZiB0aGUgZ3JhcGggYW5kXG4gIC8vIGRlY2lkZXMgd2hldGhlciBpdCBpcyBhIHRyZWUgb3Igbm90LiBJZiBpdCBpcyBhIHRyZWUsIGFkZHMgaXQgdG8gdGhlXG4gIC8vIGZvcmVzdCBhbmQgY29udGludWVkIHdpdGggdGhlIG5leHQgY29tcG9uZW50LlxuXG4gIHdoaWxlICh1blByb2Nlc3NlZE5vZGVzLmxlbmd0aCA+IDAgJiYgaXNGb3Jlc3QpXG4gIHtcbiAgICB0b0JlVmlzaXRlZC5wdXNoKHVuUHJvY2Vzc2VkTm9kZXNbMF0pO1xuXG4gICAgLy8gU3RhcnQgdGhlIEJGUy4gRWFjaCBpdGVyYXRpb24gb2YgdGhpcyBsb29wIHZpc2l0cyBhIG5vZGUgaW4gYVxuICAgIC8vIEJGUyBtYW5uZXIuXG4gICAgd2hpbGUgKHRvQmVWaXNpdGVkLmxlbmd0aCA+IDAgJiYgaXNGb3Jlc3QpXG4gICAge1xuICAgICAgLy9wb29sIG9wZXJhdGlvblxuICAgICAgdmFyIGN1cnJlbnROb2RlID0gdG9CZVZpc2l0ZWRbMF07XG4gICAgICB0b0JlVmlzaXRlZC5zcGxpY2UoMCwgMSk7XG4gICAgICB2aXNpdGVkLmFkZChjdXJyZW50Tm9kZSk7XG5cbiAgICAgIC8vIFRyYXZlcnNlIGFsbCBuZWlnaGJvcnMgb2YgdGhpcyBub2RlXG4gICAgICB2YXIgbmVpZ2hib3JFZGdlcyA9IGN1cnJlbnROb2RlLmdldEVkZ2VzKCk7XG5cbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbmVpZ2hib3JFZGdlcy5sZW5ndGg7IGkrKylcbiAgICAgIHtcbiAgICAgICAgdmFyIGN1cnJlbnROZWlnaGJvciA9XG4gICAgICAgICAgICAgICAgbmVpZ2hib3JFZGdlc1tpXS5nZXRPdGhlckVuZChjdXJyZW50Tm9kZSk7XG5cbiAgICAgICAgLy8gSWYgQkZTIGlzIG5vdCBncm93aW5nIGZyb20gdGhpcyBuZWlnaGJvci5cbiAgICAgICAgaWYgKHBhcmVudHMuZ2V0KGN1cnJlbnROb2RlKSAhPSBjdXJyZW50TmVpZ2hib3IpXG4gICAgICAgIHtcbiAgICAgICAgICAvLyBXZSBoYXZlbid0IHByZXZpb3VzbHkgdmlzaXRlZCB0aGlzIG5laWdoYm9yLlxuICAgICAgICAgIGlmICghdmlzaXRlZC5jb250YWlucyhjdXJyZW50TmVpZ2hib3IpKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgIHRvQmVWaXNpdGVkLnB1c2goY3VycmVudE5laWdoYm9yKTtcbiAgICAgICAgICAgIHBhcmVudHMucHV0KGN1cnJlbnROZWlnaGJvciwgY3VycmVudE5vZGUpO1xuICAgICAgICAgIH1cbiAgICAgICAgICAvLyBTaW5jZSB3ZSBoYXZlIHByZXZpb3VzbHkgdmlzaXRlZCB0aGlzIG5laWdoYm9yIGFuZFxuICAgICAgICAgIC8vIHRoaXMgbmVpZ2hib3IgaXMgbm90IHBhcmVudCBvZiBjdXJyZW50Tm9kZSwgZ2l2ZW5cbiAgICAgICAgICAvLyBncmFwaCBjb250YWlucyBhIGNvbXBvbmVudCB0aGF0IGlzIG5vdCB0cmVlLCBoZW5jZVxuICAgICAgICAgIC8vIGl0IGlzIG5vdCBhIGZvcmVzdC5cbiAgICAgICAgICBlbHNlXG4gICAgICAgICAge1xuICAgICAgICAgICAgaXNGb3Jlc3QgPSBmYWxzZTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIC8vIFRoZSBncmFwaCBjb250YWlucyBhIGNvbXBvbmVudCB0aGF0IGlzIG5vdCBhIHRyZWUuIEVtcHR5XG4gICAgLy8gcHJldmlvdXNseSBmb3VuZCB0cmVlcy4gVGhlIG1ldGhvZCB3aWxsIGVuZC5cbiAgICBpZiAoIWlzRm9yZXN0KVxuICAgIHtcbiAgICAgIGZsYXRGb3Jlc3QgPSBbXTtcbiAgICB9XG4gICAgLy8gU2F2ZSBjdXJyZW50bHkgdmlzaXRlZCBub2RlcyBhcyBhIHRyZWUgaW4gb3VyIGZvcmVzdC4gUmVzZXRcbiAgICAvLyB2aXNpdGVkIGFuZCBwYXJlbnRzIGxpc3RzLiBDb250aW51ZSB3aXRoIHRoZSBuZXh0IGNvbXBvbmVudCBvZlxuICAgIC8vIHRoZSBncmFwaCwgaWYgYW55LlxuICAgIGVsc2VcbiAgICB7XG4gICAgICB2YXIgdGVtcCA9IFtdO1xuICAgICAgdmlzaXRlZC5hZGRBbGxUbyh0ZW1wKTtcbiAgICAgIGZsYXRGb3Jlc3QucHVzaCh0ZW1wKTtcbiAgICAgIC8vZmxhdEZvcmVzdCA9IGZsYXRGb3Jlc3QuY29uY2F0KHRlbXApO1xuICAgICAgLy91blByb2Nlc3NlZE5vZGVzLnJlbW92ZUFsbCh2aXNpdGVkKTtcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGVtcC5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgdmFsdWUgPSB0ZW1wW2ldO1xuICAgICAgICB2YXIgaW5kZXggPSB1blByb2Nlc3NlZE5vZGVzLmluZGV4T2YodmFsdWUpO1xuICAgICAgICBpZiAoaW5kZXggPiAtMSkge1xuICAgICAgICAgIHVuUHJvY2Vzc2VkTm9kZXMuc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgdmlzaXRlZCA9IG5ldyBIYXNoU2V0KCk7XG4gICAgICBwYXJlbnRzID0gbmV3IEhhc2hNYXAoKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gZmxhdEZvcmVzdDtcbn07XG5cbi8qKlxuICogVGhpcyBtZXRob2QgY3JlYXRlcyBkdW1teSBub2RlcyAoYW4gbC1sZXZlbCBub2RlIHdpdGggbWluaW1hbCBkaW1lbnNpb25zKVxuICogZm9yIHRoZSBnaXZlbiBlZGdlIChvbmUgcGVyIGJlbmRwb2ludCkuIFRoZSBleGlzdGluZyBsLWxldmVsIHN0cnVjdHVyZVxuICogaXMgdXBkYXRlZCBhY2NvcmRpbmdseS5cbiAqL1xuTGF5b3V0LnByb3RvdHlwZS5jcmVhdGVEdW1teU5vZGVzRm9yQmVuZHBvaW50cyA9IGZ1bmN0aW9uIChlZGdlKVxue1xuICB2YXIgZHVtbXlOb2RlcyA9IFtdO1xuICB2YXIgcHJldiA9IGVkZ2Uuc291cmNlO1xuXG4gIHZhciBncmFwaCA9IHRoaXMuZ3JhcGhNYW5hZ2VyLmNhbGNMb3dlc3RDb21tb25BbmNlc3RvcihlZGdlLnNvdXJjZSwgZWRnZS50YXJnZXQpO1xuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgZWRnZS5iZW5kcG9pbnRzLmxlbmd0aDsgaSsrKVxuICB7XG4gICAgLy8gY3JlYXRlIG5ldyBkdW1teSBub2RlXG4gICAgdmFyIGR1bW15Tm9kZSA9IHRoaXMubmV3Tm9kZShudWxsKTtcbiAgICBkdW1teU5vZGUuc2V0UmVjdChuZXcgUG9pbnQoMCwgMCksIG5ldyBEaW1lbnNpb24oMSwgMSkpO1xuXG4gICAgZ3JhcGguYWRkKGR1bW15Tm9kZSk7XG5cbiAgICAvLyBjcmVhdGUgbmV3IGR1bW15IGVkZ2UgYmV0d2VlbiBwcmV2IGFuZCBkdW1teSBub2RlXG4gICAgdmFyIGR1bW15RWRnZSA9IHRoaXMubmV3RWRnZShudWxsKTtcbiAgICB0aGlzLmdyYXBoTWFuYWdlci5hZGQoZHVtbXlFZGdlLCBwcmV2LCBkdW1teU5vZGUpO1xuXG4gICAgZHVtbXlOb2Rlcy5hZGQoZHVtbXlOb2RlKTtcbiAgICBwcmV2ID0gZHVtbXlOb2RlO1xuICB9XG5cbiAgdmFyIGR1bW15RWRnZSA9IHRoaXMubmV3RWRnZShudWxsKTtcbiAgdGhpcy5ncmFwaE1hbmFnZXIuYWRkKGR1bW15RWRnZSwgcHJldiwgZWRnZS50YXJnZXQpO1xuXG4gIHRoaXMuZWRnZVRvRHVtbXlOb2Rlcy5wdXQoZWRnZSwgZHVtbXlOb2Rlcyk7XG5cbiAgLy8gcmVtb3ZlIHJlYWwgZWRnZSBmcm9tIGdyYXBoIG1hbmFnZXIgaWYgaXQgaXMgaW50ZXItZ3JhcGhcbiAgaWYgKGVkZ2UuaXNJbnRlckdyYXBoKCkpXG4gIHtcbiAgICB0aGlzLmdyYXBoTWFuYWdlci5yZW1vdmUoZWRnZSk7XG4gIH1cbiAgLy8gZWxzZSwgcmVtb3ZlIHRoZSBlZGdlIGZyb20gdGhlIGN1cnJlbnQgZ3JhcGhcbiAgZWxzZVxuICB7XG4gICAgZ3JhcGgucmVtb3ZlKGVkZ2UpO1xuICB9XG5cbiAgcmV0dXJuIGR1bW15Tm9kZXM7XG59O1xuXG4vKipcbiAqIFRoaXMgbWV0aG9kIGNyZWF0ZXMgYmVuZHBvaW50cyBmb3IgZWRnZXMgZnJvbSB0aGUgZHVtbXkgbm9kZXNcbiAqIGF0IGwtbGV2ZWwuXG4gKi9cbkxheW91dC5wcm90b3R5cGUuY3JlYXRlQmVuZHBvaW50c0Zyb21EdW1teU5vZGVzID0gZnVuY3Rpb24gKClcbntcbiAgdmFyIGVkZ2VzID0gW107XG4gIGVkZ2VzID0gZWRnZXMuY29uY2F0KHRoaXMuZ3JhcGhNYW5hZ2VyLmdldEFsbEVkZ2VzKCkpO1xuICBlZGdlcyA9IHRoaXMuZWRnZVRvRHVtbXlOb2Rlcy5rZXlTZXQoKS5jb25jYXQoZWRnZXMpO1xuXG4gIGZvciAodmFyIGsgPSAwOyBrIDwgZWRnZXMubGVuZ3RoOyBrKyspXG4gIHtcbiAgICB2YXIgbEVkZ2UgPSBlZGdlc1trXTtcblxuICAgIGlmIChsRWRnZS5iZW5kcG9pbnRzLmxlbmd0aCA+IDApXG4gICAge1xuICAgICAgdmFyIHBhdGggPSB0aGlzLmVkZ2VUb0R1bW15Tm9kZXMuZ2V0KGxFZGdlKTtcblxuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBwYXRoLmxlbmd0aDsgaSsrKVxuICAgICAge1xuICAgICAgICB2YXIgZHVtbXlOb2RlID0gcGF0aFtpXTtcbiAgICAgICAgdmFyIHAgPSBuZXcgUG9pbnREKGR1bW15Tm9kZS5nZXRDZW50ZXJYKCksXG4gICAgICAgICAgICAgICAgZHVtbXlOb2RlLmdldENlbnRlclkoKSk7XG5cbiAgICAgICAgLy8gdXBkYXRlIGJlbmRwb2ludCdzIGxvY2F0aW9uIGFjY29yZGluZyB0byBkdW1teSBub2RlXG4gICAgICAgIHZhciBlYnAgPSBsRWRnZS5iZW5kcG9pbnRzLmdldChpKTtcbiAgICAgICAgZWJwLnggPSBwLng7XG4gICAgICAgIGVicC55ID0gcC55O1xuXG4gICAgICAgIC8vIHJlbW92ZSB0aGUgZHVtbXkgbm9kZSwgZHVtbXkgZWRnZXMgaW5jaWRlbnQgd2l0aCB0aGlzXG4gICAgICAgIC8vIGR1bW15IG5vZGUgaXMgYWxzbyByZW1vdmVkICh3aXRoaW4gdGhlIHJlbW92ZSBtZXRob2QpXG4gICAgICAgIGR1bW15Tm9kZS5nZXRPd25lcigpLnJlbW92ZShkdW1teU5vZGUpO1xuICAgICAgfVxuXG4gICAgICAvLyBhZGQgdGhlIHJlYWwgZWRnZSB0byBncmFwaFxuICAgICAgdGhpcy5ncmFwaE1hbmFnZXIuYWRkKGxFZGdlLCBsRWRnZS5zb3VyY2UsIGxFZGdlLnRhcmdldCk7XG4gICAgfVxuICB9XG59O1xuXG5MYXlvdXQudHJhbnNmb3JtID0gZnVuY3Rpb24gKHNsaWRlclZhbHVlLCBkZWZhdWx0VmFsdWUsIG1pbkRpdiwgbWF4TXVsKSB7XG4gIGlmIChtaW5EaXYgIT0gdW5kZWZpbmVkICYmIG1heE11bCAhPSB1bmRlZmluZWQpIHtcbiAgICB2YXIgdmFsdWUgPSBkZWZhdWx0VmFsdWU7XG5cbiAgICBpZiAoc2xpZGVyVmFsdWUgPD0gNTApXG4gICAge1xuICAgICAgdmFyIG1pblZhbHVlID0gZGVmYXVsdFZhbHVlIC8gbWluRGl2O1xuICAgICAgdmFsdWUgLT0gKChkZWZhdWx0VmFsdWUgLSBtaW5WYWx1ZSkgLyA1MCkgKiAoNTAgLSBzbGlkZXJWYWx1ZSk7XG4gICAgfVxuICAgIGVsc2VcbiAgICB7XG4gICAgICB2YXIgbWF4VmFsdWUgPSBkZWZhdWx0VmFsdWUgKiBtYXhNdWw7XG4gICAgICB2YWx1ZSArPSAoKG1heFZhbHVlIC0gZGVmYXVsdFZhbHVlKSAvIDUwKSAqIChzbGlkZXJWYWx1ZSAtIDUwKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdmFsdWU7XG4gIH1cbiAgZWxzZSB7XG4gICAgdmFyIGEsIGI7XG5cbiAgICBpZiAoc2xpZGVyVmFsdWUgPD0gNTApXG4gICAge1xuICAgICAgYSA9IDkuMCAqIGRlZmF1bHRWYWx1ZSAvIDUwMC4wO1xuICAgICAgYiA9IGRlZmF1bHRWYWx1ZSAvIDEwLjA7XG4gICAgfVxuICAgIGVsc2VcbiAgICB7XG4gICAgICBhID0gOS4wICogZGVmYXVsdFZhbHVlIC8gNTAuMDtcbiAgICAgIGIgPSAtOCAqIGRlZmF1bHRWYWx1ZTtcbiAgICB9XG5cbiAgICByZXR1cm4gKGEgKiBzbGlkZXJWYWx1ZSArIGIpO1xuICB9XG59O1xuXG4vKipcbiAqIFRoaXMgbWV0aG9kIGZpbmRzIGFuZCByZXR1cm5zIHRoZSBjZW50ZXIgb2YgdGhlIGdpdmVuIG5vZGVzLCBhc3N1bWluZ1xuICogdGhhdCB0aGUgZ2l2ZW4gbm9kZXMgZm9ybSBhIHRyZWUgaW4gdGhlbXNlbHZlcy5cbiAqL1xuTGF5b3V0LmZpbmRDZW50ZXJPZlRyZWUgPSBmdW5jdGlvbiAobm9kZXMpXG57XG4gIHZhciBsaXN0ID0gW107XG4gIGxpc3QgPSBsaXN0LmNvbmNhdChub2Rlcyk7XG5cbiAgdmFyIHJlbW92ZWROb2RlcyA9IFtdO1xuICB2YXIgcmVtYWluaW5nRGVncmVlcyA9IG5ldyBIYXNoTWFwKCk7XG4gIHZhciBmb3VuZENlbnRlciA9IGZhbHNlO1xuICB2YXIgY2VudGVyTm9kZSA9IG51bGw7XG5cbiAgaWYgKGxpc3QubGVuZ3RoID09IDEgfHwgbGlzdC5sZW5ndGggPT0gMilcbiAge1xuICAgIGZvdW5kQ2VudGVyID0gdHJ1ZTtcbiAgICBjZW50ZXJOb2RlID0gbGlzdFswXTtcbiAgfVxuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGlzdC5sZW5ndGg7IGkrKylcbiAge1xuICAgIHZhciBub2RlID0gbGlzdFtpXTtcbiAgICB2YXIgZGVncmVlID0gbm9kZS5nZXROZWlnaGJvcnNMaXN0KCkuc2l6ZSgpO1xuICAgIHJlbWFpbmluZ0RlZ3JlZXMucHV0KG5vZGUsIG5vZGUuZ2V0TmVpZ2hib3JzTGlzdCgpLnNpemUoKSk7XG5cbiAgICBpZiAoZGVncmVlID09IDEpXG4gICAge1xuICAgICAgcmVtb3ZlZE5vZGVzLnB1c2gobm9kZSk7XG4gICAgfVxuICB9XG5cbiAgdmFyIHRlbXBMaXN0ID0gW107XG4gIHRlbXBMaXN0ID0gdGVtcExpc3QuY29uY2F0KHJlbW92ZWROb2Rlcyk7XG5cbiAgd2hpbGUgKCFmb3VuZENlbnRlcilcbiAge1xuICAgIHZhciB0ZW1wTGlzdDIgPSBbXTtcbiAgICB0ZW1wTGlzdDIgPSB0ZW1wTGlzdDIuY29uY2F0KHRlbXBMaXN0KTtcbiAgICB0ZW1wTGlzdCA9IFtdO1xuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsaXN0Lmxlbmd0aDsgaSsrKVxuICAgIHtcbiAgICAgIHZhciBub2RlID0gbGlzdFtpXTtcblxuICAgICAgdmFyIGluZGV4ID0gbGlzdC5pbmRleE9mKG5vZGUpO1xuICAgICAgaWYgKGluZGV4ID49IDApIHtcbiAgICAgICAgbGlzdC5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgfVxuXG4gICAgICB2YXIgbmVpZ2hib3VycyA9IG5vZGUuZ2V0TmVpZ2hib3JzTGlzdCgpO1xuXG4gICAgICBPYmplY3Qua2V5cyhuZWlnaGJvdXJzLnNldCkuZm9yRWFjaChmdW5jdGlvbihqKSB7XG4gICAgICAgIHZhciBuZWlnaGJvdXIgPSBuZWlnaGJvdXJzLnNldFtqXTtcbiAgICAgICAgaWYgKHJlbW92ZWROb2Rlcy5pbmRleE9mKG5laWdoYm91cikgPCAwKVxuICAgICAgICB7XG4gICAgICAgICAgdmFyIG90aGVyRGVncmVlID0gcmVtYWluaW5nRGVncmVlcy5nZXQobmVpZ2hib3VyKTtcbiAgICAgICAgICB2YXIgbmV3RGVncmVlID0gb3RoZXJEZWdyZWUgLSAxO1xuXG4gICAgICAgICAgaWYgKG5ld0RlZ3JlZSA9PSAxKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgIHRlbXBMaXN0LnB1c2gobmVpZ2hib3VyKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICByZW1haW5pbmdEZWdyZWVzLnB1dChuZWlnaGJvdXIsIG5ld0RlZ3JlZSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cblxuICAgIHJlbW92ZWROb2RlcyA9IHJlbW92ZWROb2Rlcy5jb25jYXQodGVtcExpc3QpO1xuXG4gICAgaWYgKGxpc3QubGVuZ3RoID09IDEgfHwgbGlzdC5sZW5ndGggPT0gMilcbiAgICB7XG4gICAgICBmb3VuZENlbnRlciA9IHRydWU7XG4gICAgICBjZW50ZXJOb2RlID0gbGlzdFswXTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gY2VudGVyTm9kZTtcbn07XG5cbi8qKlxuICogRHVyaW5nIHRoZSBjb2Fyc2VuaW5nIHByb2Nlc3MsIHRoaXMgbGF5b3V0IG1heSBiZSByZWZlcmVuY2VkIGJ5IHR3byBncmFwaCBtYW5hZ2Vyc1xuICogdGhpcyBzZXR0ZXIgZnVuY3Rpb24gZ3JhbnRzIGFjY2VzcyB0byBjaGFuZ2UgdGhlIGN1cnJlbnRseSBiZWluZyB1c2VkIGdyYXBoIG1hbmFnZXJcbiAqL1xuTGF5b3V0LnByb3RvdHlwZS5zZXRHcmFwaE1hbmFnZXIgPSBmdW5jdGlvbiAoZ20pXG57XG4gIHRoaXMuZ3JhcGhNYW5hZ2VyID0gZ207XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IExheW91dDtcbiIsImZ1bmN0aW9uIExheW91dENvbnN0YW50cygpIHtcbn1cblxuLyoqXG4gKiBMYXlvdXQgUXVhbGl0eVxuICovXG5MYXlvdXRDb25zdGFudHMuUFJPT0ZfUVVBTElUWSA9IDA7XG5MYXlvdXRDb25zdGFudHMuREVGQVVMVF9RVUFMSVRZID0gMTtcbkxheW91dENvbnN0YW50cy5EUkFGVF9RVUFMSVRZID0gMjtcblxuLyoqXG4gKiBEZWZhdWx0IHBhcmFtZXRlcnNcbiAqL1xuTGF5b3V0Q29uc3RhbnRzLkRFRkFVTFRfQ1JFQVRFX0JFTkRTX0FTX05FRURFRCA9IGZhbHNlO1xuLy9MYXlvdXRDb25zdGFudHMuREVGQVVMVF9JTkNSRU1FTlRBTCA9IHRydWU7XG5MYXlvdXRDb25zdGFudHMuREVGQVVMVF9JTkNSRU1FTlRBTCA9IGZhbHNlO1xuTGF5b3V0Q29uc3RhbnRzLkRFRkFVTFRfQU5JTUFUSU9OX09OX0xBWU9VVCA9IHRydWU7XG5MYXlvdXRDb25zdGFudHMuREVGQVVMVF9BTklNQVRJT05fRFVSSU5HX0xBWU9VVCA9IGZhbHNlO1xuTGF5b3V0Q29uc3RhbnRzLkRFRkFVTFRfQU5JTUFUSU9OX1BFUklPRCA9IDUwO1xuTGF5b3V0Q29uc3RhbnRzLkRFRkFVTFRfVU5JRk9STV9MRUFGX05PREVfU0laRVMgPSBmYWxzZTtcblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbi8vIFNlY3Rpb246IEdlbmVyYWwgb3RoZXIgY29uc3RhbnRzXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuLypcbiAqIE1hcmdpbnMgb2YgYSBncmFwaCB0byBiZSBhcHBsaWVkIG9uIGJvdWRpbmcgcmVjdGFuZ2xlIG9mIGl0cyBjb250ZW50cy4gV2VcbiAqIGFzc3VtZSBtYXJnaW5zIG9uIGFsbCBmb3VyIHNpZGVzIHRvIGJlIHVuaWZvcm0uXG4gKi9cbkxheW91dENvbnN0YW50cy5ERUZBVUxUX0dSQVBIX01BUkdJTiA9IDE1O1xuXG4vKlxuICogV2hldGhlciB0byBjb25zaWRlciBsYWJlbHMgaW4gbm9kZSBkaW1lbnNpb25zIG9yIG5vdFxuICovXG5MYXlvdXRDb25zdGFudHMuTk9ERV9ESU1FTlNJT05TX0lOQ0xVREVfTEFCRUxTID0gZmFsc2U7XG5cbi8qXG4gKiBEZWZhdWx0IGRpbWVuc2lvbiBvZiBhIG5vbi1jb21wb3VuZCBub2RlLlxuICovXG5MYXlvdXRDb25zdGFudHMuU0lNUExFX05PREVfU0laRSA9IDQwO1xuXG4vKlxuICogRGVmYXVsdCBkaW1lbnNpb24gb2YgYSBub24tY29tcG91bmQgbm9kZS5cbiAqL1xuTGF5b3V0Q29uc3RhbnRzLlNJTVBMRV9OT0RFX0hBTEZfU0laRSA9IExheW91dENvbnN0YW50cy5TSU1QTEVfTk9ERV9TSVpFIC8gMjtcblxuLypcbiAqIEVtcHR5IGNvbXBvdW5kIG5vZGUgc2l6ZS4gV2hlbiBhIGNvbXBvdW5kIG5vZGUgaXMgZW1wdHksIGl0cyBib3RoXG4gKiBkaW1lbnNpb25zIHNob3VsZCBiZSBvZiB0aGlzIHZhbHVlLlxuICovXG5MYXlvdXRDb25zdGFudHMuRU1QVFlfQ09NUE9VTkRfTk9ERV9TSVpFID0gNDA7XG5cbi8qXG4gKiBNaW5pbXVtIGxlbmd0aCB0aGF0IGFuIGVkZ2Ugc2hvdWxkIHRha2UgZHVyaW5nIGxheW91dFxuICovXG5MYXlvdXRDb25zdGFudHMuTUlOX0VER0VfTEVOR1RIID0gMTtcblxuLypcbiAqIFdvcmxkIGJvdW5kYXJpZXMgdGhhdCBsYXlvdXQgb3BlcmF0ZXMgb25cbiAqL1xuTGF5b3V0Q29uc3RhbnRzLldPUkxEX0JPVU5EQVJZID0gMTAwMDAwMDtcblxuLypcbiAqIFdvcmxkIGJvdW5kYXJpZXMgdGhhdCByYW5kb20gcG9zaXRpb25pbmcgY2FuIGJlIHBlcmZvcm1lZCB3aXRoXG4gKi9cbkxheW91dENvbnN0YW50cy5JTklUSUFMX1dPUkxEX0JPVU5EQVJZID0gTGF5b3V0Q29uc3RhbnRzLldPUkxEX0JPVU5EQVJZIC8gMTAwMDtcblxuLypcbiAqIENvb3JkaW5hdGVzIG9mIHRoZSB3b3JsZCBjZW50ZXJcbiAqL1xuTGF5b3V0Q29uc3RhbnRzLldPUkxEX0NFTlRFUl9YID0gMTIwMDtcbkxheW91dENvbnN0YW50cy5XT1JMRF9DRU5URVJfWSA9IDkwMDtcblxubW9kdWxlLmV4cG9ydHMgPSBMYXlvdXRDb25zdGFudHM7XG4iLCIvKlxuICpUaGlzIGNsYXNzIGlzIHRoZSBqYXZhc2NyaXB0IGltcGxlbWVudGF0aW9uIG9mIHRoZSBQb2ludC5qYXZhIGNsYXNzIGluIGpka1xuICovXG5mdW5jdGlvbiBQb2ludCh4LCB5LCBwKSB7XG4gIHRoaXMueCA9IG51bGw7XG4gIHRoaXMueSA9IG51bGw7XG4gIGlmICh4ID09IG51bGwgJiYgeSA9PSBudWxsICYmIHAgPT0gbnVsbCkge1xuICAgIHRoaXMueCA9IDA7XG4gICAgdGhpcy55ID0gMDtcbiAgfVxuICBlbHNlIGlmICh0eXBlb2YgeCA9PSAnbnVtYmVyJyAmJiB0eXBlb2YgeSA9PSAnbnVtYmVyJyAmJiBwID09IG51bGwpIHtcbiAgICB0aGlzLnggPSB4O1xuICAgIHRoaXMueSA9IHk7XG4gIH1cbiAgZWxzZSBpZiAoeC5jb25zdHJ1Y3Rvci5uYW1lID09ICdQb2ludCcgJiYgeSA9PSBudWxsICYmIHAgPT0gbnVsbCkge1xuICAgIHAgPSB4O1xuICAgIHRoaXMueCA9IHAueDtcbiAgICB0aGlzLnkgPSBwLnk7XG4gIH1cbn1cblxuUG9pbnQucHJvdG90eXBlLmdldFggPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiB0aGlzLng7XG59XG5cblBvaW50LnByb3RvdHlwZS5nZXRZID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4gdGhpcy55O1xufVxuXG5Qb2ludC5wcm90b3R5cGUuZ2V0TG9jYXRpb24gPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiBuZXcgUG9pbnQodGhpcy54LCB0aGlzLnkpO1xufVxuXG5Qb2ludC5wcm90b3R5cGUuc2V0TG9jYXRpb24gPSBmdW5jdGlvbiAoeCwgeSwgcCkge1xuICBpZiAoeC5jb25zdHJ1Y3Rvci5uYW1lID09ICdQb2ludCcgJiYgeSA9PSBudWxsICYmIHAgPT0gbnVsbCkge1xuICAgIHAgPSB4O1xuICAgIHRoaXMuc2V0TG9jYXRpb24ocC54LCBwLnkpO1xuICB9XG4gIGVsc2UgaWYgKHR5cGVvZiB4ID09ICdudW1iZXInICYmIHR5cGVvZiB5ID09ICdudW1iZXInICYmIHAgPT0gbnVsbCkge1xuICAgIC8vaWYgYm90aCBwYXJhbWV0ZXJzIGFyZSBpbnRlZ2VyIGp1c3QgbW92ZSAoeCx5KSBsb2NhdGlvblxuICAgIGlmIChwYXJzZUludCh4KSA9PSB4ICYmIHBhcnNlSW50KHkpID09IHkpIHtcbiAgICAgIHRoaXMubW92ZSh4LCB5KTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICB0aGlzLnggPSBNYXRoLmZsb29yKHggKyAwLjUpO1xuICAgICAgdGhpcy55ID0gTWF0aC5mbG9vcih5ICsgMC41KTtcbiAgICB9XG4gIH1cbn1cblxuUG9pbnQucHJvdG90eXBlLm1vdmUgPSBmdW5jdGlvbiAoeCwgeSkge1xuICB0aGlzLnggPSB4O1xuICB0aGlzLnkgPSB5O1xufVxuXG5Qb2ludC5wcm90b3R5cGUudHJhbnNsYXRlID0gZnVuY3Rpb24gKGR4LCBkeSkge1xuICB0aGlzLnggKz0gZHg7XG4gIHRoaXMueSArPSBkeTtcbn1cblxuUG9pbnQucHJvdG90eXBlLmVxdWFscyA9IGZ1bmN0aW9uIChvYmopIHtcbiAgaWYgKG9iai5jb25zdHJ1Y3Rvci5uYW1lID09IFwiUG9pbnRcIikge1xuICAgIHZhciBwdCA9IG9iajtcbiAgICByZXR1cm4gKHRoaXMueCA9PSBwdC54KSAmJiAodGhpcy55ID09IHB0LnkpO1xuICB9XG4gIHJldHVybiB0aGlzID09IG9iajtcbn1cblxuUG9pbnQucHJvdG90eXBlLnRvU3RyaW5nID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4gbmV3IFBvaW50KCkuY29uc3RydWN0b3IubmFtZSArIFwiW3g9XCIgKyB0aGlzLnggKyBcIix5PVwiICsgdGhpcy55ICsgXCJdXCI7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gUG9pbnQ7XG4iLCJmdW5jdGlvbiBQb2ludEQoeCwgeSkge1xuICBpZiAoeCA9PSBudWxsICYmIHkgPT0gbnVsbCkge1xuICAgIHRoaXMueCA9IDA7XG4gICAgdGhpcy55ID0gMDtcbiAgfSBlbHNlIHtcbiAgICB0aGlzLnggPSB4O1xuICAgIHRoaXMueSA9IHk7XG4gIH1cbn1cblxuUG9pbnRELnByb3RvdHlwZS5nZXRYID0gZnVuY3Rpb24gKClcbntcbiAgcmV0dXJuIHRoaXMueDtcbn07XG5cblBvaW50RC5wcm90b3R5cGUuZ2V0WSA9IGZ1bmN0aW9uICgpXG57XG4gIHJldHVybiB0aGlzLnk7XG59O1xuXG5Qb2ludEQucHJvdG90eXBlLnNldFggPSBmdW5jdGlvbiAoeClcbntcbiAgdGhpcy54ID0geDtcbn07XG5cblBvaW50RC5wcm90b3R5cGUuc2V0WSA9IGZ1bmN0aW9uICh5KVxue1xuICB0aGlzLnkgPSB5O1xufTtcblxuUG9pbnRELnByb3RvdHlwZS5nZXREaWZmZXJlbmNlID0gZnVuY3Rpb24gKHB0KVxue1xuICByZXR1cm4gbmV3IERpbWVuc2lvbkQodGhpcy54IC0gcHQueCwgdGhpcy55IC0gcHQueSk7XG59O1xuXG5Qb2ludEQucHJvdG90eXBlLmdldENvcHkgPSBmdW5jdGlvbiAoKVxue1xuICByZXR1cm4gbmV3IFBvaW50RCh0aGlzLngsIHRoaXMueSk7XG59O1xuXG5Qb2ludEQucHJvdG90eXBlLnRyYW5zbGF0ZSA9IGZ1bmN0aW9uIChkaW0pXG57XG4gIHRoaXMueCArPSBkaW0ud2lkdGg7XG4gIHRoaXMueSArPSBkaW0uaGVpZ2h0O1xuICByZXR1cm4gdGhpcztcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gUG9pbnREO1xuIiwiZnVuY3Rpb24gUmFuZG9tU2VlZCgpIHtcbn1cblJhbmRvbVNlZWQuc2VlZCA9IDE7XG5SYW5kb21TZWVkLnggPSAwO1xuXG5SYW5kb21TZWVkLm5leHREb3VibGUgPSBmdW5jdGlvbiAoKSB7XG4gIFJhbmRvbVNlZWQueCA9IE1hdGguc2luKFJhbmRvbVNlZWQuc2VlZCsrKSAqIDEwMDAwO1xuICByZXR1cm4gUmFuZG9tU2VlZC54IC0gTWF0aC5mbG9vcihSYW5kb21TZWVkLngpO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBSYW5kb21TZWVkO1xuIiwiZnVuY3Rpb24gUmVjdGFuZ2xlRCh4LCB5LCB3aWR0aCwgaGVpZ2h0KSB7XG4gIHRoaXMueCA9IDA7XG4gIHRoaXMueSA9IDA7XG4gIHRoaXMud2lkdGggPSAwO1xuICB0aGlzLmhlaWdodCA9IDA7XG5cbiAgaWYgKHggIT0gbnVsbCAmJiB5ICE9IG51bGwgJiYgd2lkdGggIT0gbnVsbCAmJiBoZWlnaHQgIT0gbnVsbCkge1xuICAgIHRoaXMueCA9IHg7XG4gICAgdGhpcy55ID0geTtcbiAgICB0aGlzLndpZHRoID0gd2lkdGg7XG4gICAgdGhpcy5oZWlnaHQgPSBoZWlnaHQ7XG4gIH1cbn1cblxuUmVjdGFuZ2xlRC5wcm90b3R5cGUuZ2V0WCA9IGZ1bmN0aW9uICgpXG57XG4gIHJldHVybiB0aGlzLng7XG59O1xuXG5SZWN0YW5nbGVELnByb3RvdHlwZS5zZXRYID0gZnVuY3Rpb24gKHgpXG57XG4gIHRoaXMueCA9IHg7XG59O1xuXG5SZWN0YW5nbGVELnByb3RvdHlwZS5nZXRZID0gZnVuY3Rpb24gKClcbntcbiAgcmV0dXJuIHRoaXMueTtcbn07XG5cblJlY3RhbmdsZUQucHJvdG90eXBlLnNldFkgPSBmdW5jdGlvbiAoeSlcbntcbiAgdGhpcy55ID0geTtcbn07XG5cblJlY3RhbmdsZUQucHJvdG90eXBlLmdldFdpZHRoID0gZnVuY3Rpb24gKClcbntcbiAgcmV0dXJuIHRoaXMud2lkdGg7XG59O1xuXG5SZWN0YW5nbGVELnByb3RvdHlwZS5zZXRXaWR0aCA9IGZ1bmN0aW9uICh3aWR0aClcbntcbiAgdGhpcy53aWR0aCA9IHdpZHRoO1xufTtcblxuUmVjdGFuZ2xlRC5wcm90b3R5cGUuZ2V0SGVpZ2h0ID0gZnVuY3Rpb24gKClcbntcbiAgcmV0dXJuIHRoaXMuaGVpZ2h0O1xufTtcblxuUmVjdGFuZ2xlRC5wcm90b3R5cGUuc2V0SGVpZ2h0ID0gZnVuY3Rpb24gKGhlaWdodClcbntcbiAgdGhpcy5oZWlnaHQgPSBoZWlnaHQ7XG59O1xuXG5SZWN0YW5nbGVELnByb3RvdHlwZS5nZXRSaWdodCA9IGZ1bmN0aW9uICgpXG57XG4gIHJldHVybiB0aGlzLnggKyB0aGlzLndpZHRoO1xufTtcblxuUmVjdGFuZ2xlRC5wcm90b3R5cGUuZ2V0Qm90dG9tID0gZnVuY3Rpb24gKClcbntcbiAgcmV0dXJuIHRoaXMueSArIHRoaXMuaGVpZ2h0O1xufTtcblxuUmVjdGFuZ2xlRC5wcm90b3R5cGUuaW50ZXJzZWN0cyA9IGZ1bmN0aW9uIChhKVxue1xuICBpZiAodGhpcy5nZXRSaWdodCgpIDwgYS54KVxuICB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgaWYgKHRoaXMuZ2V0Qm90dG9tKCkgPCBhLnkpXG4gIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBpZiAoYS5nZXRSaWdodCgpIDwgdGhpcy54KVxuICB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgaWYgKGEuZ2V0Qm90dG9tKCkgPCB0aGlzLnkpXG4gIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICByZXR1cm4gdHJ1ZTtcbn07XG5cblJlY3RhbmdsZUQucHJvdG90eXBlLmdldENlbnRlclggPSBmdW5jdGlvbiAoKVxue1xuICByZXR1cm4gdGhpcy54ICsgdGhpcy53aWR0aCAvIDI7XG59O1xuXG5SZWN0YW5nbGVELnByb3RvdHlwZS5nZXRNaW5YID0gZnVuY3Rpb24gKClcbntcbiAgcmV0dXJuIHRoaXMuZ2V0WCgpO1xufTtcblxuUmVjdGFuZ2xlRC5wcm90b3R5cGUuZ2V0TWF4WCA9IGZ1bmN0aW9uICgpXG57XG4gIHJldHVybiB0aGlzLmdldFgoKSArIHRoaXMud2lkdGg7XG59O1xuXG5SZWN0YW5nbGVELnByb3RvdHlwZS5nZXRDZW50ZXJZID0gZnVuY3Rpb24gKClcbntcbiAgcmV0dXJuIHRoaXMueSArIHRoaXMuaGVpZ2h0IC8gMjtcbn07XG5cblJlY3RhbmdsZUQucHJvdG90eXBlLmdldE1pblkgPSBmdW5jdGlvbiAoKVxue1xuICByZXR1cm4gdGhpcy5nZXRZKCk7XG59O1xuXG5SZWN0YW5nbGVELnByb3RvdHlwZS5nZXRNYXhZID0gZnVuY3Rpb24gKClcbntcbiAgcmV0dXJuIHRoaXMuZ2V0WSgpICsgdGhpcy5oZWlnaHQ7XG59O1xuXG5SZWN0YW5nbGVELnByb3RvdHlwZS5nZXRXaWR0aEhhbGYgPSBmdW5jdGlvbiAoKVxue1xuICByZXR1cm4gdGhpcy53aWR0aCAvIDI7XG59O1xuXG5SZWN0YW5nbGVELnByb3RvdHlwZS5nZXRIZWlnaHRIYWxmID0gZnVuY3Rpb24gKClcbntcbiAgcmV0dXJuIHRoaXMuaGVpZ2h0IC8gMjtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gUmVjdGFuZ2xlRDtcbiIsInZhciBQb2ludEQgPSByZXF1aXJlKCcuL1BvaW50RCcpO1xuXG5mdW5jdGlvbiBUcmFuc2Zvcm0oeCwgeSkge1xuICB0aGlzLmx3b3JsZE9yZ1ggPSAwLjA7XG4gIHRoaXMubHdvcmxkT3JnWSA9IDAuMDtcbiAgdGhpcy5sZGV2aWNlT3JnWCA9IDAuMDtcbiAgdGhpcy5sZGV2aWNlT3JnWSA9IDAuMDtcbiAgdGhpcy5sd29ybGRFeHRYID0gMS4wO1xuICB0aGlzLmx3b3JsZEV4dFkgPSAxLjA7XG4gIHRoaXMubGRldmljZUV4dFggPSAxLjA7XG4gIHRoaXMubGRldmljZUV4dFkgPSAxLjA7XG59XG5cblRyYW5zZm9ybS5wcm90b3R5cGUuZ2V0V29ybGRPcmdYID0gZnVuY3Rpb24gKClcbntcbiAgcmV0dXJuIHRoaXMubHdvcmxkT3JnWDtcbn1cblxuVHJhbnNmb3JtLnByb3RvdHlwZS5zZXRXb3JsZE9yZ1ggPSBmdW5jdGlvbiAod294KVxue1xuICB0aGlzLmx3b3JsZE9yZ1ggPSB3b3g7XG59XG5cblRyYW5zZm9ybS5wcm90b3R5cGUuZ2V0V29ybGRPcmdZID0gZnVuY3Rpb24gKClcbntcbiAgcmV0dXJuIHRoaXMubHdvcmxkT3JnWTtcbn1cblxuVHJhbnNmb3JtLnByb3RvdHlwZS5zZXRXb3JsZE9yZ1kgPSBmdW5jdGlvbiAod295KVxue1xuICB0aGlzLmx3b3JsZE9yZ1kgPSB3b3k7XG59XG5cblRyYW5zZm9ybS5wcm90b3R5cGUuZ2V0V29ybGRFeHRYID0gZnVuY3Rpb24gKClcbntcbiAgcmV0dXJuIHRoaXMubHdvcmxkRXh0WDtcbn1cblxuVHJhbnNmb3JtLnByb3RvdHlwZS5zZXRXb3JsZEV4dFggPSBmdW5jdGlvbiAod2V4KVxue1xuICB0aGlzLmx3b3JsZEV4dFggPSB3ZXg7XG59XG5cblRyYW5zZm9ybS5wcm90b3R5cGUuZ2V0V29ybGRFeHRZID0gZnVuY3Rpb24gKClcbntcbiAgcmV0dXJuIHRoaXMubHdvcmxkRXh0WTtcbn1cblxuVHJhbnNmb3JtLnByb3RvdHlwZS5zZXRXb3JsZEV4dFkgPSBmdW5jdGlvbiAod2V5KVxue1xuICB0aGlzLmx3b3JsZEV4dFkgPSB3ZXk7XG59XG5cbi8qIERldmljZSByZWxhdGVkICovXG5cblRyYW5zZm9ybS5wcm90b3R5cGUuZ2V0RGV2aWNlT3JnWCA9IGZ1bmN0aW9uICgpXG57XG4gIHJldHVybiB0aGlzLmxkZXZpY2VPcmdYO1xufVxuXG5UcmFuc2Zvcm0ucHJvdG90eXBlLnNldERldmljZU9yZ1ggPSBmdW5jdGlvbiAoZG94KVxue1xuICB0aGlzLmxkZXZpY2VPcmdYID0gZG94O1xufVxuXG5UcmFuc2Zvcm0ucHJvdG90eXBlLmdldERldmljZU9yZ1kgPSBmdW5jdGlvbiAoKVxue1xuICByZXR1cm4gdGhpcy5sZGV2aWNlT3JnWTtcbn1cblxuVHJhbnNmb3JtLnByb3RvdHlwZS5zZXREZXZpY2VPcmdZID0gZnVuY3Rpb24gKGRveSlcbntcbiAgdGhpcy5sZGV2aWNlT3JnWSA9IGRveTtcbn1cblxuVHJhbnNmb3JtLnByb3RvdHlwZS5nZXREZXZpY2VFeHRYID0gZnVuY3Rpb24gKClcbntcbiAgcmV0dXJuIHRoaXMubGRldmljZUV4dFg7XG59XG5cblRyYW5zZm9ybS5wcm90b3R5cGUuc2V0RGV2aWNlRXh0WCA9IGZ1bmN0aW9uIChkZXgpXG57XG4gIHRoaXMubGRldmljZUV4dFggPSBkZXg7XG59XG5cblRyYW5zZm9ybS5wcm90b3R5cGUuZ2V0RGV2aWNlRXh0WSA9IGZ1bmN0aW9uICgpXG57XG4gIHJldHVybiB0aGlzLmxkZXZpY2VFeHRZO1xufVxuXG5UcmFuc2Zvcm0ucHJvdG90eXBlLnNldERldmljZUV4dFkgPSBmdW5jdGlvbiAoZGV5KVxue1xuICB0aGlzLmxkZXZpY2VFeHRZID0gZGV5O1xufVxuXG5UcmFuc2Zvcm0ucHJvdG90eXBlLnRyYW5zZm9ybVggPSBmdW5jdGlvbiAoeClcbntcbiAgdmFyIHhEZXZpY2UgPSAwLjA7XG4gIHZhciB3b3JsZEV4dFggPSB0aGlzLmx3b3JsZEV4dFg7XG4gIGlmICh3b3JsZEV4dFggIT0gMC4wKVxuICB7XG4gICAgeERldmljZSA9IHRoaXMubGRldmljZU9yZ1ggK1xuICAgICAgICAgICAgKCh4IC0gdGhpcy5sd29ybGRPcmdYKSAqIHRoaXMubGRldmljZUV4dFggLyB3b3JsZEV4dFgpO1xuICB9XG5cbiAgcmV0dXJuIHhEZXZpY2U7XG59XG5cblRyYW5zZm9ybS5wcm90b3R5cGUudHJhbnNmb3JtWSA9IGZ1bmN0aW9uICh5KVxue1xuICB2YXIgeURldmljZSA9IDAuMDtcbiAgdmFyIHdvcmxkRXh0WSA9IHRoaXMubHdvcmxkRXh0WTtcbiAgaWYgKHdvcmxkRXh0WSAhPSAwLjApXG4gIHtcbiAgICB5RGV2aWNlID0gdGhpcy5sZGV2aWNlT3JnWSArXG4gICAgICAgICAgICAoKHkgLSB0aGlzLmx3b3JsZE9yZ1kpICogdGhpcy5sZGV2aWNlRXh0WSAvIHdvcmxkRXh0WSk7XG4gIH1cblxuXG4gIHJldHVybiB5RGV2aWNlO1xufVxuXG5UcmFuc2Zvcm0ucHJvdG90eXBlLmludmVyc2VUcmFuc2Zvcm1YID0gZnVuY3Rpb24gKHgpXG57XG4gIHZhciB4V29ybGQgPSAwLjA7XG4gIHZhciBkZXZpY2VFeHRYID0gdGhpcy5sZGV2aWNlRXh0WDtcbiAgaWYgKGRldmljZUV4dFggIT0gMC4wKVxuICB7XG4gICAgeFdvcmxkID0gdGhpcy5sd29ybGRPcmdYICtcbiAgICAgICAgICAgICgoeCAtIHRoaXMubGRldmljZU9yZ1gpICogdGhpcy5sd29ybGRFeHRYIC8gZGV2aWNlRXh0WCk7XG4gIH1cblxuXG4gIHJldHVybiB4V29ybGQ7XG59XG5cblRyYW5zZm9ybS5wcm90b3R5cGUuaW52ZXJzZVRyYW5zZm9ybVkgPSBmdW5jdGlvbiAoeSlcbntcbiAgdmFyIHlXb3JsZCA9IDAuMDtcbiAgdmFyIGRldmljZUV4dFkgPSB0aGlzLmxkZXZpY2VFeHRZO1xuICBpZiAoZGV2aWNlRXh0WSAhPSAwLjApXG4gIHtcbiAgICB5V29ybGQgPSB0aGlzLmx3b3JsZE9yZ1kgK1xuICAgICAgICAgICAgKCh5IC0gdGhpcy5sZGV2aWNlT3JnWSkgKiB0aGlzLmx3b3JsZEV4dFkgLyBkZXZpY2VFeHRZKTtcbiAgfVxuICByZXR1cm4geVdvcmxkO1xufVxuXG5UcmFuc2Zvcm0ucHJvdG90eXBlLmludmVyc2VUcmFuc2Zvcm1Qb2ludCA9IGZ1bmN0aW9uIChpblBvaW50KVxue1xuICB2YXIgb3V0UG9pbnQgPVxuICAgICAgICAgIG5ldyBQb2ludEQodGhpcy5pbnZlcnNlVHJhbnNmb3JtWChpblBvaW50LngpLFxuICAgICAgICAgICAgICAgICAgdGhpcy5pbnZlcnNlVHJhbnNmb3JtWShpblBvaW50LnkpKTtcbiAgcmV0dXJuIG91dFBvaW50O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFRyYW5zZm9ybTtcbiIsImZ1bmN0aW9uIFVuaXF1ZUlER2VuZXJldG9yKCkge1xufVxuXG5VbmlxdWVJREdlbmVyZXRvci5sYXN0SUQgPSAwO1xuXG5VbmlxdWVJREdlbmVyZXRvci5jcmVhdGVJRCA9IGZ1bmN0aW9uIChvYmopIHtcbiAgaWYgKFVuaXF1ZUlER2VuZXJldG9yLmlzUHJpbWl0aXZlKG9iaikpIHtcbiAgICByZXR1cm4gb2JqO1xuICB9XG4gIGlmIChvYmoudW5pcXVlSUQgIT0gbnVsbCkge1xuICAgIHJldHVybiBvYmoudW5pcXVlSUQ7XG4gIH1cbiAgb2JqLnVuaXF1ZUlEID0gVW5pcXVlSURHZW5lcmV0b3IuZ2V0U3RyaW5nKCk7XG4gIFVuaXF1ZUlER2VuZXJldG9yLmxhc3RJRCsrO1xuICByZXR1cm4gb2JqLnVuaXF1ZUlEO1xufVxuXG5VbmlxdWVJREdlbmVyZXRvci5nZXRTdHJpbmcgPSBmdW5jdGlvbiAoaWQpIHtcbiAgaWYgKGlkID09IG51bGwpXG4gICAgaWQgPSBVbmlxdWVJREdlbmVyZXRvci5sYXN0SUQ7XG4gIHJldHVybiBcIk9iamVjdCNcIiArIGlkICsgXCJcIjtcbn1cblxuVW5pcXVlSURHZW5lcmV0b3IuaXNQcmltaXRpdmUgPSBmdW5jdGlvbiAoYXJnKSB7XG4gIHZhciB0eXBlID0gdHlwZW9mIGFyZztcbiAgcmV0dXJuIGFyZyA9PSBudWxsIHx8ICh0eXBlICE9IFwib2JqZWN0XCIgJiYgdHlwZSAhPSBcImZ1bmN0aW9uXCIpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFVuaXF1ZUlER2VuZXJldG9yO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgRGltZW5zaW9uRCA9IHJlcXVpcmUoJy4vRGltZW5zaW9uRCcpO1xudmFyIEhhc2hNYXAgPSByZXF1aXJlKCcuL0hhc2hNYXAnKTtcbnZhciBIYXNoU2V0ID0gcmVxdWlyZSgnLi9IYXNoU2V0Jyk7XG52YXIgSUdlb21ldHJ5ID0gcmVxdWlyZSgnLi9JR2VvbWV0cnknKTtcbnZhciBJTWF0aCA9IHJlcXVpcmUoJy4vSU1hdGgnKTtcbnZhciBJbnRlZ2VyID0gcmVxdWlyZSgnLi9JbnRlZ2VyJyk7XG52YXIgUG9pbnQgPSByZXF1aXJlKCcuL1BvaW50Jyk7XG52YXIgUG9pbnREID0gcmVxdWlyZSgnLi9Qb2ludEQnKTtcbnZhciBSYW5kb21TZWVkID0gcmVxdWlyZSgnLi9SYW5kb21TZWVkJyk7XG52YXIgUmVjdGFuZ2xlRCA9IHJlcXVpcmUoJy4vUmVjdGFuZ2xlRCcpO1xudmFyIFRyYW5zZm9ybSA9IHJlcXVpcmUoJy4vVHJhbnNmb3JtJyk7XG52YXIgVW5pcXVlSURHZW5lcmV0b3IgPSByZXF1aXJlKCcuL1VuaXF1ZUlER2VuZXJldG9yJyk7XG52YXIgTEdyYXBoT2JqZWN0ID0gcmVxdWlyZSgnLi9MR3JhcGhPYmplY3QnKTtcbnZhciBMR3JhcGggPSByZXF1aXJlKCcuL0xHcmFwaCcpO1xudmFyIExFZGdlID0gcmVxdWlyZSgnLi9MRWRnZScpO1xudmFyIExHcmFwaE1hbmFnZXIgPSByZXF1aXJlKCcuL0xHcmFwaE1hbmFnZXInKTtcbnZhciBMTm9kZSA9IHJlcXVpcmUoJy4vTE5vZGUnKTtcbnZhciBMYXlvdXQgPSByZXF1aXJlKCcuL0xheW91dCcpO1xudmFyIExheW91dENvbnN0YW50cyA9IHJlcXVpcmUoJy4vTGF5b3V0Q29uc3RhbnRzJyk7XG52YXIgRkRMYXlvdXQgPSByZXF1aXJlKCcuL0ZETGF5b3V0Jyk7XG52YXIgRkRMYXlvdXRDb25zdGFudHMgPSByZXF1aXJlKCcuL0ZETGF5b3V0Q29uc3RhbnRzJyk7XG52YXIgRkRMYXlvdXRFZGdlID0gcmVxdWlyZSgnLi9GRExheW91dEVkZ2UnKTtcbnZhciBGRExheW91dE5vZGUgPSByZXF1aXJlKCcuL0ZETGF5b3V0Tm9kZScpO1xudmFyIENvU0VDb25zdGFudHMgPSByZXF1aXJlKCcuL0NvU0VDb25zdGFudHMnKTtcbnZhciBDb1NFRWRnZSA9IHJlcXVpcmUoJy4vQ29TRUVkZ2UnKTtcbnZhciBDb1NFR3JhcGggPSByZXF1aXJlKCcuL0NvU0VHcmFwaCcpO1xudmFyIENvU0VHcmFwaE1hbmFnZXIgPSByZXF1aXJlKCcuL0NvU0VHcmFwaE1hbmFnZXInKTtcbnZhciBDb1NFTGF5b3V0ID0gcmVxdWlyZSgnLi9Db1NFTGF5b3V0Jyk7XG52YXIgQ29TRU5vZGUgPSByZXF1aXJlKCcuL0NvU0VOb2RlJyk7XG5cbnZhciBkZWZhdWx0cyA9IHtcbiAgLy8gQ2FsbGVkIG9uIGBsYXlvdXRyZWFkeWBcbiAgcmVhZHk6IGZ1bmN0aW9uICgpIHtcbiAgfSxcbiAgLy8gQ2FsbGVkIG9uIGBsYXlvdXRzdG9wYFxuICBzdG9wOiBmdW5jdGlvbiAoKSB7XG4gIH0sXG4gIC8vIGluY2x1ZGUgbGFiZWxzIGluIG5vZGUgZGltZW5zaW9uc1xuICBub2RlRGltZW5zaW9uc0luY2x1ZGVMYWJlbHM6IGZhbHNlLFxuICAvLyBudW1iZXIgb2YgdGlja3MgcGVyIGZyYW1lOyBoaWdoZXIgaXMgZmFzdGVyIGJ1dCBtb3JlIGplcmt5XG4gIHJlZnJlc2g6IDMwLFxuICAvLyBXaGV0aGVyIHRvIGZpdCB0aGUgbmV0d29yayB2aWV3IGFmdGVyIHdoZW4gZG9uZVxuICBmaXQ6IHRydWUsXG4gIC8vIFBhZGRpbmcgb24gZml0XG4gIHBhZGRpbmc6IDEwLFxuICAvLyBXaGV0aGVyIHRvIGVuYWJsZSBpbmNyZW1lbnRhbCBtb2RlXG4gIHJhbmRvbWl6ZTogdHJ1ZSxcbiAgLy8gTm9kZSByZXB1bHNpb24gKG5vbiBvdmVybGFwcGluZykgbXVsdGlwbGllclxuICBub2RlUmVwdWxzaW9uOiA0NTAwLFxuICAvLyBJZGVhbCBlZGdlIChub24gbmVzdGVkKSBsZW5ndGhcbiAgaWRlYWxFZGdlTGVuZ3RoOiA1MCxcbiAgLy8gRGl2aXNvciB0byBjb21wdXRlIGVkZ2UgZm9yY2VzXG4gIGVkZ2VFbGFzdGljaXR5OiAwLjQ1LFxuICAvLyBOZXN0aW5nIGZhY3RvciAobXVsdGlwbGllcikgdG8gY29tcHV0ZSBpZGVhbCBlZGdlIGxlbmd0aCBmb3IgbmVzdGVkIGVkZ2VzXG4gIG5lc3RpbmdGYWN0b3I6IDAuMSxcbiAgLy8gR3Jhdml0eSBmb3JjZSAoY29uc3RhbnQpXG4gIGdyYXZpdHk6IDAuMjUsXG4gIC8vIE1heGltdW0gbnVtYmVyIG9mIGl0ZXJhdGlvbnMgdG8gcGVyZm9ybVxuICBudW1JdGVyOiAyNTAwLFxuICAvLyBGb3IgZW5hYmxpbmcgdGlsaW5nXG4gIHRpbGU6IHRydWUsXG4gIC8vIFR5cGUgb2YgbGF5b3V0IGFuaW1hdGlvbi4gVGhlIG9wdGlvbiBzZXQgaXMgeydkdXJpbmcnLCAnZW5kJywgZmFsc2V9XG4gIGFuaW1hdGU6ICdlbmQnLFxuICAvLyBEdXJhdGlvbiBmb3IgYW5pbWF0ZTplbmRcbiAgYW5pbWF0aW9uRHVyYXRpb246IDUwMCxcbiAgLy8gUmVwcmVzZW50cyB0aGUgYW1vdW50IG9mIHRoZSB2ZXJ0aWNhbCBzcGFjZSB0byBwdXQgYmV0d2VlbiB0aGUgemVybyBkZWdyZWUgbWVtYmVycyBkdXJpbmcgdGhlIHRpbGluZyBvcGVyYXRpb24oY2FuIGFsc28gYmUgYSBmdW5jdGlvbilcbiAgdGlsaW5nUGFkZGluZ1ZlcnRpY2FsOiAxMCxcbiAgLy8gUmVwcmVzZW50cyB0aGUgYW1vdW50IG9mIHRoZSBob3Jpem9udGFsIHNwYWNlIHRvIHB1dCBiZXR3ZWVuIHRoZSB6ZXJvIGRlZ3JlZSBtZW1iZXJzIGR1cmluZyB0aGUgdGlsaW5nIG9wZXJhdGlvbihjYW4gYWxzbyBiZSBhIGZ1bmN0aW9uKVxuICB0aWxpbmdQYWRkaW5nSG9yaXpvbnRhbDogMTAsXG4gIC8vIEdyYXZpdHkgcmFuZ2UgKGNvbnN0YW50KSBmb3IgY29tcG91bmRzXG4gIGdyYXZpdHlSYW5nZUNvbXBvdW5kOiAxLjUsXG4gIC8vIEdyYXZpdHkgZm9yY2UgKGNvbnN0YW50KSBmb3IgY29tcG91bmRzXG4gIGdyYXZpdHlDb21wb3VuZDogMS4wLFxuICAvLyBHcmF2aXR5IHJhbmdlIChjb25zdGFudClcbiAgZ3Jhdml0eVJhbmdlOiAzLjgsXG4gIC8vIEluaXRpYWwgY29vbGluZyBmYWN0b3IgZm9yIGluY3JlbWVudGFsIGxheW91dFxuICBpbml0aWFsRW5lcmd5T25JbmNyZW1lbnRhbDogMC41XG59O1xuXG5mdW5jdGlvbiBleHRlbmQoZGVmYXVsdHMsIG9wdGlvbnMpIHtcbiAgdmFyIG9iaiA9IHt9O1xuXG4gIGZvciAodmFyIGkgaW4gZGVmYXVsdHMpIHtcbiAgICBvYmpbaV0gPSBkZWZhdWx0c1tpXTtcbiAgfVxuXG4gIGZvciAodmFyIGkgaW4gb3B0aW9ucykge1xuICAgIG9ialtpXSA9IG9wdGlvbnNbaV07XG4gIH1cblxuICByZXR1cm4gb2JqO1xufTtcblxuZnVuY3Rpb24gX0NvU0VMYXlvdXQoX29wdGlvbnMpIHtcbiAgdGhpcy5vcHRpb25zID0gZXh0ZW5kKGRlZmF1bHRzLCBfb3B0aW9ucyk7XG4gIGdldFVzZXJPcHRpb25zKHRoaXMub3B0aW9ucyk7XG59XG5cbnZhciBnZXRVc2VyT3B0aW9ucyA9IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gIGlmIChvcHRpb25zLm5vZGVSZXB1bHNpb24gIT0gbnVsbClcbiAgICBDb1NFQ29uc3RhbnRzLkRFRkFVTFRfUkVQVUxTSU9OX1NUUkVOR1RIID0gRkRMYXlvdXRDb25zdGFudHMuREVGQVVMVF9SRVBVTFNJT05fU1RSRU5HVEggPSBvcHRpb25zLm5vZGVSZXB1bHNpb247XG4gIGlmIChvcHRpb25zLmlkZWFsRWRnZUxlbmd0aCAhPSBudWxsKVxuICAgIENvU0VDb25zdGFudHMuREVGQVVMVF9FREdFX0xFTkdUSCA9IEZETGF5b3V0Q29uc3RhbnRzLkRFRkFVTFRfRURHRV9MRU5HVEggPSBvcHRpb25zLmlkZWFsRWRnZUxlbmd0aDtcbiAgaWYgKG9wdGlvbnMuZWRnZUVsYXN0aWNpdHkgIT0gbnVsbClcbiAgICBDb1NFQ29uc3RhbnRzLkRFRkFVTFRfU1BSSU5HX1NUUkVOR1RIID0gRkRMYXlvdXRDb25zdGFudHMuREVGQVVMVF9TUFJJTkdfU1RSRU5HVEggPSBvcHRpb25zLmVkZ2VFbGFzdGljaXR5O1xuICBpZiAob3B0aW9ucy5uZXN0aW5nRmFjdG9yICE9IG51bGwpXG4gICAgQ29TRUNvbnN0YW50cy5QRVJfTEVWRUxfSURFQUxfRURHRV9MRU5HVEhfRkFDVE9SID0gRkRMYXlvdXRDb25zdGFudHMuUEVSX0xFVkVMX0lERUFMX0VER0VfTEVOR1RIX0ZBQ1RPUiA9IG9wdGlvbnMubmVzdGluZ0ZhY3RvcjtcbiAgaWYgKG9wdGlvbnMuZ3Jhdml0eSAhPSBudWxsKVxuICAgIENvU0VDb25zdGFudHMuREVGQVVMVF9HUkFWSVRZX1NUUkVOR1RIID0gRkRMYXlvdXRDb25zdGFudHMuREVGQVVMVF9HUkFWSVRZX1NUUkVOR1RIID0gb3B0aW9ucy5ncmF2aXR5O1xuICBpZiAob3B0aW9ucy5udW1JdGVyICE9IG51bGwpXG4gICAgQ29TRUNvbnN0YW50cy5NQVhfSVRFUkFUSU9OUyA9IEZETGF5b3V0Q29uc3RhbnRzLk1BWF9JVEVSQVRJT05TID0gb3B0aW9ucy5udW1JdGVyO1xuICBpZiAob3B0aW9ucy5ncmF2aXR5UmFuZ2UgIT0gbnVsbClcbiAgICBDb1NFQ29uc3RhbnRzLkRFRkFVTFRfR1JBVklUWV9SQU5HRV9GQUNUT1IgPSBGRExheW91dENvbnN0YW50cy5ERUZBVUxUX0dSQVZJVFlfUkFOR0VfRkFDVE9SID0gb3B0aW9ucy5ncmF2aXR5UmFuZ2U7XG4gIGlmKG9wdGlvbnMuZ3Jhdml0eUNvbXBvdW5kICE9IG51bGwpXG4gICAgQ29TRUNvbnN0YW50cy5ERUZBVUxUX0NPTVBPVU5EX0dSQVZJVFlfU1RSRU5HVEggPSBGRExheW91dENvbnN0YW50cy5ERUZBVUxUX0NPTVBPVU5EX0dSQVZJVFlfU1RSRU5HVEggPSBvcHRpb25zLmdyYXZpdHlDb21wb3VuZDtcbiAgaWYob3B0aW9ucy5ncmF2aXR5UmFuZ2VDb21wb3VuZCAhPSBudWxsKVxuICAgIENvU0VDb25zdGFudHMuREVGQVVMVF9DT01QT1VORF9HUkFWSVRZX1JBTkdFX0ZBQ1RPUiA9IEZETGF5b3V0Q29uc3RhbnRzLkRFRkFVTFRfQ09NUE9VTkRfR1JBVklUWV9SQU5HRV9GQUNUT1IgPSBvcHRpb25zLmdyYXZpdHlSYW5nZUNvbXBvdW5kO1xuICBpZiAob3B0aW9ucy5pbml0aWFsRW5lcmd5T25JbmNyZW1lbnRhbCAhPSBudWxsKVxuICAgIENvU0VDb25zdGFudHMuREVGQVVMVF9DT09MSU5HX0ZBQ1RPUl9JTkNSRU1FTlRBTCA9IEZETGF5b3V0Q29uc3RhbnRzLkRFRkFVTFRfQ09PTElOR19GQUNUT1JfSU5DUkVNRU5UQUwgPSBvcHRpb25zLmluaXRpYWxFbmVyZ3lPbkluY3JlbWVudGFsO1xuXG4gIENvU0VDb25zdGFudHMuTk9ERV9ESU1FTlNJT05TX0lOQ0xVREVfTEFCRUxTID0gRkRMYXlvdXRDb25zdGFudHMuTk9ERV9ESU1FTlNJT05TX0lOQ0xVREVfTEFCRUxTID0gTGF5b3V0Q29uc3RhbnRzLk5PREVfRElNRU5TSU9OU19JTkNMVURFX0xBQkVMUyA9IG9wdGlvbnMubm9kZURpbWVuc2lvbnNJbmNsdWRlTGFiZWxzO1xuICBDb1NFQ29uc3RhbnRzLkRFRkFVTFRfSU5DUkVNRU5UQUwgPSBGRExheW91dENvbnN0YW50cy5ERUZBVUxUX0lOQ1JFTUVOVEFMID0gTGF5b3V0Q29uc3RhbnRzLkRFRkFVTFRfSU5DUkVNRU5UQUwgPVxuICAgICAgICAgICEob3B0aW9ucy5yYW5kb21pemUpO1xuICBDb1NFQ29uc3RhbnRzLkFOSU1BVEUgPSBGRExheW91dENvbnN0YW50cy5BTklNQVRFID0gTGF5b3V0Q29uc3RhbnRzLkFOSU1BVEUgPSBvcHRpb25zLmFuaW1hdGU7XG4gIENvU0VDb25zdGFudHMuVElMRSA9IG9wdGlvbnMudGlsZTtcbiAgQ29TRUNvbnN0YW50cy5USUxJTkdfUEFERElOR19WRVJUSUNBTCA9IFxuICAgICAgICAgIHR5cGVvZiBvcHRpb25zLnRpbGluZ1BhZGRpbmdWZXJ0aWNhbCA9PT0gJ2Z1bmN0aW9uJyA/IG9wdGlvbnMudGlsaW5nUGFkZGluZ1ZlcnRpY2FsLmNhbGwoKSA6IG9wdGlvbnMudGlsaW5nUGFkZGluZ1ZlcnRpY2FsO1xuICBDb1NFQ29uc3RhbnRzLlRJTElOR19QQURESU5HX0hPUklaT05UQUwgPSBcbiAgICAgICAgICB0eXBlb2Ygb3B0aW9ucy50aWxpbmdQYWRkaW5nSG9yaXpvbnRhbCA9PT0gJ2Z1bmN0aW9uJyA/IG9wdGlvbnMudGlsaW5nUGFkZGluZ0hvcml6b250YWwuY2FsbCgpIDogb3B0aW9ucy50aWxpbmdQYWRkaW5nSG9yaXpvbnRhbDtcbn07XG5cbl9Db1NFTGF5b3V0LnByb3RvdHlwZS5ydW4gPSBmdW5jdGlvbiAoKSB7XG4gIHZhciByZWFkeTtcbiAgdmFyIGZyYW1lSWQ7XG4gIHZhciBvcHRpb25zID0gdGhpcy5vcHRpb25zO1xuICB2YXIgaWRUb0xOb2RlID0gdGhpcy5pZFRvTE5vZGUgPSB7fTtcbiAgdmFyIGxheW91dCA9IHRoaXMubGF5b3V0ID0gbmV3IENvU0VMYXlvdXQoKTtcbiAgdmFyIHNlbGYgPSB0aGlzO1xuICBcbiAgc2VsZi5zdG9wcGVkID0gZmFsc2U7XG5cbiAgdGhpcy5jeSA9IHRoaXMub3B0aW9ucy5jeTtcblxuICB0aGlzLmN5LnRyaWdnZXIoeyB0eXBlOiAnbGF5b3V0c3RhcnQnLCBsYXlvdXQ6IHRoaXMgfSk7XG5cbiAgdmFyIGdtID0gbGF5b3V0Lm5ld0dyYXBoTWFuYWdlcigpO1xuICB0aGlzLmdtID0gZ207XG5cbiAgdmFyIG5vZGVzID0gdGhpcy5vcHRpb25zLmVsZXMubm9kZXMoKTtcbiAgdmFyIGVkZ2VzID0gdGhpcy5vcHRpb25zLmVsZXMuZWRnZXMoKTtcblxuICB0aGlzLnJvb3QgPSBnbS5hZGRSb290KCk7XG4gIHRoaXMucHJvY2Vzc0NoaWxkcmVuTGlzdCh0aGlzLnJvb3QsIHRoaXMuZ2V0VG9wTW9zdE5vZGVzKG5vZGVzKSwgbGF5b3V0KTtcblxuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgZWRnZXMubGVuZ3RoOyBpKyspIHtcbiAgICB2YXIgZWRnZSA9IGVkZ2VzW2ldO1xuICAgIHZhciBzb3VyY2VOb2RlID0gdGhpcy5pZFRvTE5vZGVbZWRnZS5kYXRhKFwic291cmNlXCIpXTtcbiAgICB2YXIgdGFyZ2V0Tm9kZSA9IHRoaXMuaWRUb0xOb2RlW2VkZ2UuZGF0YShcInRhcmdldFwiKV07XG4gICAgaWYoc291cmNlTm9kZS5nZXRFZGdlc0JldHdlZW4odGFyZ2V0Tm9kZSkubGVuZ3RoID09IDApe1xuICAgICAgdmFyIGUxID0gZ20uYWRkKGxheW91dC5uZXdFZGdlKCksIHNvdXJjZU5vZGUsIHRhcmdldE5vZGUpO1xuICAgICAgZTEuaWQgPSBlZGdlLmlkKCk7XG4gICAgfVxuICB9XG4gIFxuICAgdmFyIGdldFBvc2l0aW9ucyA9IGZ1bmN0aW9uKGVsZSwgaSl7XG4gICAgaWYodHlwZW9mIGVsZSA9PT0gXCJudW1iZXJcIikge1xuICAgICAgZWxlID0gaTtcbiAgICB9XG4gICAgdmFyIHRoZUlkID0gZWxlLmRhdGEoJ2lkJyk7XG4gICAgdmFyIGxOb2RlID0gc2VsZi5pZFRvTE5vZGVbdGhlSWRdO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIHg6IGxOb2RlLmdldFJlY3QoKS5nZXRDZW50ZXJYKCksXG4gICAgICB5OiBsTm9kZS5nZXRSZWN0KCkuZ2V0Q2VudGVyWSgpXG4gICAgfTtcbiAgfTtcbiAgXG4gIC8qXG4gICAqIFJlcG9zaXRpb24gbm9kZXMgaW4gaXRlcmF0aW9ucyBhbmltYXRlZGx5XG4gICAqL1xuICB2YXIgaXRlcmF0ZUFuaW1hdGVkID0gZnVuY3Rpb24gKCkge1xuICAgIC8vIFRoaWdzIHRvIHBlcmZvcm0gYWZ0ZXIgbm9kZXMgYXJlIHJlcG9zaXRpb25lZCBvbiBzY3JlZW5cbiAgICB2YXIgYWZ0ZXJSZXBvc2l0aW9uID0gZnVuY3Rpb24oKSB7XG4gICAgICBpZiAob3B0aW9ucy5maXQpIHtcbiAgICAgICAgb3B0aW9ucy5jeS5maXQob3B0aW9ucy5lbGVzLm5vZGVzKCksIG9wdGlvbnMucGFkZGluZyk7XG4gICAgICB9XG5cbiAgICAgIGlmICghcmVhZHkpIHtcbiAgICAgICAgcmVhZHkgPSB0cnVlO1xuICAgICAgICBzZWxmLmN5Lm9uZSgnbGF5b3V0cmVhZHknLCBvcHRpb25zLnJlYWR5KTtcbiAgICAgICAgc2VsZi5jeS50cmlnZ2VyKHt0eXBlOiAnbGF5b3V0cmVhZHknLCBsYXlvdXQ6IHNlbGZ9KTtcbiAgICAgIH1cbiAgICB9O1xuICAgIFxuICAgIHZhciB0aWNrc1BlckZyYW1lID0gc2VsZi5vcHRpb25zLnJlZnJlc2g7XG4gICAgdmFyIGlzRG9uZTtcblxuICAgIGZvciggdmFyIGkgPSAwOyBpIDwgdGlja3NQZXJGcmFtZSAmJiAhaXNEb25lOyBpKysgKXtcbiAgICAgIGlzRG9uZSA9IHNlbGYuc3RvcHBlZCB8fCBzZWxmLmxheW91dC50aWNrKCk7XG4gICAgfVxuICAgIFxuICAgIC8vIElmIGxheW91dCBpcyBkb25lXG4gICAgaWYgKGlzRG9uZSkge1xuICAgICAgLy8gSWYgdGhlIGxheW91dCBpcyBub3QgYSBzdWJsYXlvdXQgYW5kIGl0IGlzIHN1Y2Nlc3NmdWwgcGVyZm9ybSBwb3N0IGxheW91dC5cbiAgICAgIGlmIChsYXlvdXQuY2hlY2tMYXlvdXRTdWNjZXNzKCkgJiYgIWxheW91dC5pc1N1YkxheW91dCkge1xuICAgICAgICBsYXlvdXQuZG9Qb3N0TGF5b3V0KCk7XG4gICAgICB9XG4gICAgICBcbiAgICAgIC8vIElmIGxheW91dCBoYXMgYSB0aWxpbmdQb3N0TGF5b3V0IGZ1bmN0aW9uIHByb3BlcnR5IGNhbGwgaXQuXG4gICAgICBpZiAobGF5b3V0LnRpbGluZ1Bvc3RMYXlvdXQpIHtcbiAgICAgICAgbGF5b3V0LnRpbGluZ1Bvc3RMYXlvdXQoKTtcbiAgICAgIH1cbiAgICAgIFxuICAgICAgbGF5b3V0LmlzTGF5b3V0RmluaXNoZWQgPSB0cnVlO1xuICAgICAgXG4gICAgICBzZWxmLm9wdGlvbnMuZWxlcy5ub2RlcygpLnBvc2l0aW9ucyhnZXRQb3NpdGlvbnMpO1xuICAgICAgXG4gICAgICBhZnRlclJlcG9zaXRpb24oKTtcbiAgICAgIFxuICAgICAgLy8gdHJpZ2dlciBsYXlvdXRzdG9wIHdoZW4gdGhlIGxheW91dCBzdG9wcyAoZS5nLiBmaW5pc2hlcylcbiAgICAgIHNlbGYuY3kub25lKCdsYXlvdXRzdG9wJywgc2VsZi5vcHRpb25zLnN0b3ApO1xuICAgICAgc2VsZi5jeS50cmlnZ2VyKHsgdHlwZTogJ2xheW91dHN0b3AnLCBsYXlvdXQ6IHNlbGYgfSk7XG5cbiAgICAgIGlmIChmcmFtZUlkKSB7XG4gICAgICAgIGNhbmNlbEFuaW1hdGlvbkZyYW1lKGZyYW1lSWQpO1xuICAgICAgfVxuICAgICAgXG4gICAgICByZWFkeSA9IGZhbHNlO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBcbiAgICB2YXIgYW5pbWF0aW9uRGF0YSA9IHNlbGYubGF5b3V0LmdldFBvc2l0aW9uc0RhdGEoKTsgLy8gR2V0IHBvc2l0aW9ucyBvZiBsYXlvdXQgbm9kZXMgbm90ZSB0aGF0IGFsbCBub2RlcyBtYXkgbm90IGJlIGxheW91dCBub2RlcyBiZWNhdXNlIG9mIHRpbGluZ1xuICAgIFxuICAgIC8vIFBvc2l0aW9uIG5vZGVzLCBmb3IgdGhlIG5vZGVzIHdob3NlIGlkIGRvZXMgbm90IGluY2x1ZGVkIGluIGRhdGEgKGJlY2F1c2UgdGhleSBhcmUgcmVtb3ZlZCBmcm9tIHRoZWlyIHBhcmVudHMgYW5kIGluY2x1ZGVkIGluIGR1bW15IGNvbXBvdW5kcylcbiAgICAvLyB1c2UgcG9zaXRpb24gb2YgdGhlaXIgYW5jZXN0b3JzIG9yIGR1bW15IGFuY2VzdG9yc1xuICAgIG9wdGlvbnMuZWxlcy5ub2RlcygpLnBvc2l0aW9ucyhmdW5jdGlvbiAoZWxlLCBpKSB7XG4gICAgICBpZiAodHlwZW9mIGVsZSA9PT0gXCJudW1iZXJcIikge1xuICAgICAgICBlbGUgPSBpO1xuICAgICAgfVxuICAgICAgdmFyIHRoZUlkID0gZWxlLmlkKCk7XG4gICAgICB2YXIgcE5vZGUgPSBhbmltYXRpb25EYXRhW3RoZUlkXTtcbiAgICAgIHZhciB0ZW1wID0gZWxlO1xuICAgICAgLy8gSWYgcE5vZGUgaXMgdW5kZWZpbmVkIHNlYXJjaCB1bnRpbCBmaW5kaW5nIHBvc2l0aW9uIGRhdGEgb2YgaXRzIGZpcnN0IGFuY2VzdG9yIChJdCBtYXkgYmUgZHVtbXkgYXMgd2VsbClcbiAgICAgIHdoaWxlIChwTm9kZSA9PSBudWxsKSB7XG4gICAgICAgIHBOb2RlID0gYW5pbWF0aW9uRGF0YVt0ZW1wLmRhdGEoJ3BhcmVudCcpXSB8fCBhbmltYXRpb25EYXRhWydEdW1teUNvbXBvdW5kXycgKyB0ZW1wLmRhdGEoJ3BhcmVudCcpXTtcbiAgICAgICAgYW5pbWF0aW9uRGF0YVt0aGVJZF0gPSBwTm9kZTtcbiAgICAgICAgdGVtcCA9IHRlbXAucGFyZW50KClbMF07XG4gICAgICAgIGlmKHRlbXAgPT0gdW5kZWZpbmVkKXtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYocE5vZGUgIT0gbnVsbCl7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgeDogcE5vZGUueCxcbiAgICAgICAgICB5OiBwTm9kZS55XG4gICAgICAgIH07XG4gICAgICB9XG4gICAgICBlbHNle1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIHg6IGVsZS54LFxuICAgICAgICAgIHk6IGVsZS55XG4gICAgICAgIH07XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICBhZnRlclJlcG9zaXRpb24oKTtcblxuICAgIGZyYW1lSWQgPSByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoaXRlcmF0ZUFuaW1hdGVkKTtcbiAgfTtcbiAgXG4gIC8qXG4gICogTGlzdGVuICdsYXlvdXRzdGFydGVkJyBldmVudCBhbmQgc3RhcnQgYW5pbWF0ZWQgaXRlcmF0aW9uIGlmIGFuaW1hdGUgb3B0aW9uIGlzICdkdXJpbmcnXG4gICovXG4gIGxheW91dC5hZGRMaXN0ZW5lcignbGF5b3V0c3RhcnRlZCcsIGZ1bmN0aW9uICgpIHtcbiAgICBpZiAoc2VsZi5vcHRpb25zLmFuaW1hdGUgPT09ICdkdXJpbmcnKSB7XG4gICAgICBmcmFtZUlkID0gcmVxdWVzdEFuaW1hdGlvbkZyYW1lKGl0ZXJhdGVBbmltYXRlZCk7XG4gICAgfVxuICB9KTtcbiAgXG4gIGxheW91dC5ydW5MYXlvdXQoKTsgLy8gUnVuIGNvc2UgbGF5b3V0XG4gIFxuICAvKlxuICAgKiBJZiBhbmltYXRlIG9wdGlvbiBpcyBub3QgJ2R1cmluZycgKCdlbmQnIG9yIGZhbHNlKSBwZXJmb3JtIHRoZXNlIGhlcmUgKElmIGl0IGlzICdkdXJpbmcnIHNpbWlsYXIgdGhpbmdzIGFyZSBhbHJlYWR5IHBlcmZvcm1lZClcbiAgICovXG4gIGlmKHRoaXMub3B0aW9ucy5hbmltYXRlICE9PSBcImR1cmluZ1wiKXtcbiAgICBzZWxmLm9wdGlvbnMuZWxlcy5ub2RlcygpLm5vdChcIjpwYXJlbnRcIikubGF5b3V0UG9zaXRpb25zKHNlbGYsIHNlbGYub3B0aW9ucywgZ2V0UG9zaXRpb25zKTsgLy8gVXNlIGxheW91dCBwb3NpdGlvbnMgdG8gcmVwb3NpdGlvbiB0aGUgbm9kZXMgaXQgY29uc2lkZXJzIHRoZSBvcHRpb25zIHBhcmFtZXRlclxuICAgIHJlYWR5ID0gZmFsc2U7XG4gIH1cblxuICByZXR1cm4gdGhpczsgLy8gY2hhaW5pbmdcbn07XG5cbi8vR2V0IHRoZSB0b3AgbW9zdCBvbmVzIG9mIGEgbGlzdCBvZiBub2Rlc1xuX0NvU0VMYXlvdXQucHJvdG90eXBlLmdldFRvcE1vc3ROb2RlcyA9IGZ1bmN0aW9uKG5vZGVzKSB7XG4gIHZhciBub2Rlc01hcCA9IHt9O1xuICBmb3IgKHZhciBpID0gMDsgaSA8IG5vZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBub2Rlc01hcFtub2Rlc1tpXS5pZCgpXSA9IHRydWU7XG4gIH1cbiAgdmFyIHJvb3RzID0gbm9kZXMuZmlsdGVyKGZ1bmN0aW9uIChlbGUsIGkpIHtcbiAgICAgIGlmKHR5cGVvZiBlbGUgPT09IFwibnVtYmVyXCIpIHtcbiAgICAgICAgZWxlID0gaTtcbiAgICAgIH1cbiAgICAgIHZhciBwYXJlbnQgPSBlbGUucGFyZW50KClbMF07XG4gICAgICB3aGlsZShwYXJlbnQgIT0gbnVsbCl7XG4gICAgICAgIGlmKG5vZGVzTWFwW3BhcmVudC5pZCgpXSl7XG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIHBhcmVudCA9IHBhcmVudC5wYXJlbnQoKVswXTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0cnVlO1xuICB9KTtcblxuICByZXR1cm4gcm9vdHM7XG59O1xuXG5fQ29TRUxheW91dC5wcm90b3R5cGUucHJvY2Vzc0NoaWxkcmVuTGlzdCA9IGZ1bmN0aW9uIChwYXJlbnQsIGNoaWxkcmVuLCBsYXlvdXQpIHtcbiAgdmFyIHNpemUgPSBjaGlsZHJlbi5sZW5ndGg7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgc2l6ZTsgaSsrKSB7XG4gICAgdmFyIHRoZUNoaWxkID0gY2hpbGRyZW5baV07XG4gICAgdmFyIGNoaWxkcmVuX29mX2NoaWxkcmVuID0gdGhlQ2hpbGQuY2hpbGRyZW4oKTtcbiAgICB2YXIgdGhlTm9kZTsgICAgXG5cbiAgICB2YXIgZGltZW5zaW9ucyA9IHRoZUNoaWxkLmxheW91dERpbWVuc2lvbnMoe1xuICAgICAgbm9kZURpbWVuc2lvbnNJbmNsdWRlTGFiZWxzOiB0aGlzLm9wdGlvbnMubm9kZURpbWVuc2lvbnNJbmNsdWRlTGFiZWxzXG4gICAgfSk7XG5cbiAgICBpZiAodGhlQ2hpbGQub3V0ZXJXaWR0aCgpICE9IG51bGxcbiAgICAgICAgICAgICYmIHRoZUNoaWxkLm91dGVySGVpZ2h0KCkgIT0gbnVsbCkge1xuICAgICAgdGhlTm9kZSA9IHBhcmVudC5hZGQobmV3IENvU0VOb2RlKGxheW91dC5ncmFwaE1hbmFnZXIsXG4gICAgICAgICAgICAgIG5ldyBQb2ludEQodGhlQ2hpbGQucG9zaXRpb24oJ3gnKSAtIGRpbWVuc2lvbnMudyAvIDIsIHRoZUNoaWxkLnBvc2l0aW9uKCd5JykgLSBkaW1lbnNpb25zLmggLyAyKSxcbiAgICAgICAgICAgICAgbmV3IERpbWVuc2lvbkQocGFyc2VGbG9hdChkaW1lbnNpb25zLncpLCBwYXJzZUZsb2F0KGRpbWVuc2lvbnMuaCkpKSk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgdGhlTm9kZSA9IHBhcmVudC5hZGQobmV3IENvU0VOb2RlKHRoaXMuZ3JhcGhNYW5hZ2VyKSk7XG4gICAgfVxuICAgIC8vIEF0dGFjaCBpZCB0byB0aGUgbGF5b3V0IG5vZGVcbiAgICB0aGVOb2RlLmlkID0gdGhlQ2hpbGQuZGF0YShcImlkXCIpO1xuICAgIC8vIEF0dGFjaCB0aGUgcGFkZGluZ3Mgb2YgY3kgbm9kZSB0byBsYXlvdXQgbm9kZVxuICAgIHRoZU5vZGUucGFkZGluZ0xlZnQgPSBwYXJzZUludCggdGhlQ2hpbGQuY3NzKCdwYWRkaW5nJykgKTtcbiAgICB0aGVOb2RlLnBhZGRpbmdUb3AgPSBwYXJzZUludCggdGhlQ2hpbGQuY3NzKCdwYWRkaW5nJykgKTtcbiAgICB0aGVOb2RlLnBhZGRpbmdSaWdodCA9IHBhcnNlSW50KCB0aGVDaGlsZC5jc3MoJ3BhZGRpbmcnKSApO1xuICAgIHRoZU5vZGUucGFkZGluZ0JvdHRvbSA9IHBhcnNlSW50KCB0aGVDaGlsZC5jc3MoJ3BhZGRpbmcnKSApO1xuICAgIFxuICAgIC8vQXR0YWNoIHRoZSBsYWJlbCBwcm9wZXJ0aWVzIHRvIGNvbXBvdW5kIGlmIGxhYmVscyB3aWxsIGJlIGluY2x1ZGVkIGluIG5vZGUgZGltZW5zaW9ucyAgXG4gICAgaWYodGhpcy5vcHRpb25zLm5vZGVEaW1lbnNpb25zSW5jbHVkZUxhYmVscyl7XG4gICAgICBpZih0aGVDaGlsZC5pc1BhcmVudCgpKXtcbiAgICAgICAgICB2YXIgbGFiZWxXaWR0aCA9IHRoZUNoaWxkLmJvdW5kaW5nQm94KHsgaW5jbHVkZUxhYmVsczogdHJ1ZSwgaW5jbHVkZU5vZGVzOiBmYWxzZSB9KS53OyAgICAgICAgICBcbiAgICAgICAgICB2YXIgbGFiZWxIZWlnaHQgPSB0aGVDaGlsZC5ib3VuZGluZ0JveCh7IGluY2x1ZGVMYWJlbHM6IHRydWUsIGluY2x1ZGVOb2RlczogZmFsc2UgfSkuaDtcbiAgICAgICAgICB2YXIgbGFiZWxQb3MgPSB0aGVDaGlsZC5jc3MoXCJ0ZXh0LWhhbGlnblwiKTtcbiAgICAgICAgICB0aGVOb2RlLmxhYmVsV2lkdGggPSBsYWJlbFdpZHRoO1xuICAgICAgICAgIHRoZU5vZGUubGFiZWxIZWlnaHQgPSBsYWJlbEhlaWdodDtcbiAgICAgICAgICB0aGVOb2RlLmxhYmVsUG9zID0gbGFiZWxQb3M7XG4gICAgICB9XG4gICAgfVxuICAgIFxuICAgIC8vIE1hcCB0aGUgbGF5b3V0IG5vZGVcbiAgICB0aGlzLmlkVG9MTm9kZVt0aGVDaGlsZC5kYXRhKFwiaWRcIildID0gdGhlTm9kZTtcblxuICAgIGlmIChpc05hTih0aGVOb2RlLnJlY3QueCkpIHtcbiAgICAgIHRoZU5vZGUucmVjdC54ID0gMDtcbiAgICB9XG5cbiAgICBpZiAoaXNOYU4odGhlTm9kZS5yZWN0LnkpKSB7XG4gICAgICB0aGVOb2RlLnJlY3QueSA9IDA7XG4gICAgfVxuXG4gICAgaWYgKGNoaWxkcmVuX29mX2NoaWxkcmVuICE9IG51bGwgJiYgY2hpbGRyZW5fb2ZfY2hpbGRyZW4ubGVuZ3RoID4gMCkge1xuICAgICAgdmFyIHRoZU5ld0dyYXBoO1xuICAgICAgdGhlTmV3R3JhcGggPSBsYXlvdXQuZ2V0R3JhcGhNYW5hZ2VyKCkuYWRkKGxheW91dC5uZXdHcmFwaCgpLCB0aGVOb2RlKTtcbiAgICAgIHRoaXMucHJvY2Vzc0NoaWxkcmVuTGlzdCh0aGVOZXdHcmFwaCwgY2hpbGRyZW5fb2ZfY2hpbGRyZW4sIGxheW91dCk7XG4gICAgfVxuICB9XG59O1xuXG4vKipcbiAqIEBicmllZiA6IGNhbGxlZCBvbiBjb250aW51b3VzIGxheW91dHMgdG8gc3RvcCB0aGVtIGJlZm9yZSB0aGV5IGZpbmlzaFxuICovXG5fQ29TRUxheW91dC5wcm90b3R5cGUuc3RvcCA9IGZ1bmN0aW9uICgpIHtcbiAgdGhpcy5zdG9wcGVkID0gdHJ1ZTtcblxuICByZXR1cm4gdGhpczsgLy8gY2hhaW5pbmdcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gZ2V0KGN5dG9zY2FwZSkge1xuICByZXR1cm4gX0NvU0VMYXlvdXQ7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4vLyByZWdpc3RlcnMgdGhlIGV4dGVuc2lvbiBvbiBhIGN5dG9zY2FwZSBsaWIgcmVmXG52YXIgZ2V0TGF5b3V0ID0gcmVxdWlyZSgnLi9MYXlvdXQnKTtcblxudmFyIHJlZ2lzdGVyID0gZnVuY3Rpb24oIGN5dG9zY2FwZSApe1xuICB2YXIgTGF5b3V0ID0gZ2V0TGF5b3V0KCBjeXRvc2NhcGUgKTtcblxuICBjeXRvc2NhcGUoJ2xheW91dCcsICdjb3NlLWJpbGtlbnQnLCBMYXlvdXQpO1xufTtcblxuLy8gYXV0byByZWcgZm9yIGdsb2JhbHNcbmlmKCB0eXBlb2YgY3l0b3NjYXBlICE9PSAndW5kZWZpbmVkJyApe1xuICByZWdpc3RlciggY3l0b3NjYXBlICk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gcmVnaXN0ZXI7XG4iXX0=
