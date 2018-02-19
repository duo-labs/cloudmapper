(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict"

module.exports = createRBTree

var RED   = 0
var BLACK = 1

function RBNode(color, key, value, left, right, count) {
  this._color = color
  this.key = key
  this.value = value
  this.left = left
  this.right = right
  this._count = count
}

function cloneNode(node) {
  return new RBNode(node._color, node.key, node.value, node.left, node.right, node._count)
}

function repaint(color, node) {
  return new RBNode(color, node.key, node.value, node.left, node.right, node._count)
}

function recount(node) {
  node._count = 1 + (node.left ? node.left._count : 0) + (node.right ? node.right._count : 0)
}

function RedBlackTree(compare, root) {
  this._compare = compare
  this.root = root
}

var proto = RedBlackTree.prototype

Object.defineProperty(proto, "keys", {
  get: function() {
    var result = []
    this.forEach(function(k,v) {
      result.push(k)
    })
    return result
  }
})

Object.defineProperty(proto, "values", {
  get: function() {
    var result = []
    this.forEach(function(k,v) {
      result.push(v)
    })
    return result
  }
})

//Returns the number of nodes in the tree
Object.defineProperty(proto, "length", {
  get: function() {
    if(this.root) {
      return this.root._count
    }
    return 0
  }
})

//Insert a new item into the tree
proto.insert = function(key, value) {
  var cmp = this._compare
  //Find point to insert new node at
  var n = this.root
  var n_stack = []
  var d_stack = []
  while(n) {
    var d = cmp(key, n.key)
    n_stack.push(n)
    d_stack.push(d)
    if(d <= 0) {
      n = n.left
    } else {
      n = n.right
    }
  }
  //Rebuild path to leaf node
  n_stack.push(new RBNode(RED, key, value, null, null, 1))
  for(var s=n_stack.length-2; s>=0; --s) {
    var n = n_stack[s]
    if(d_stack[s] <= 0) {
      n_stack[s] = new RBNode(n._color, n.key, n.value, n_stack[s+1], n.right, n._count+1)
    } else {
      n_stack[s] = new RBNode(n._color, n.key, n.value, n.left, n_stack[s+1], n._count+1)
    }
  }
  //Rebalance tree using rotations
  //console.log("start insert", key, d_stack)
  for(var s=n_stack.length-1; s>1; --s) {
    var p = n_stack[s-1]
    var n = n_stack[s]
    if(p._color === BLACK || n._color === BLACK) {
      break
    }
    var pp = n_stack[s-2]
    if(pp.left === p) {
      if(p.left === n) {
        var y = pp.right
        if(y && y._color === RED) {
          //console.log("LLr")
          p._color = BLACK
          pp.right = repaint(BLACK, y)
          pp._color = RED
          s -= 1
        } else {
          //console.log("LLb")
          pp._color = RED
          pp.left = p.right
          p._color = BLACK
          p.right = pp
          n_stack[s-2] = p
          n_stack[s-1] = n
          recount(pp)
          recount(p)
          if(s >= 3) {
            var ppp = n_stack[s-3]
            if(ppp.left === pp) {
              ppp.left = p
            } else {
              ppp.right = p
            }
          }
          break
        }
      } else {
        var y = pp.right
        if(y && y._color === RED) {
          //console.log("LRr")
          p._color = BLACK
          pp.right = repaint(BLACK, y)
          pp._color = RED
          s -= 1
        } else {
          //console.log("LRb")
          p.right = n.left
          pp._color = RED
          pp.left = n.right
          n._color = BLACK
          n.left = p
          n.right = pp
          n_stack[s-2] = n
          n_stack[s-1] = p
          recount(pp)
          recount(p)
          recount(n)
          if(s >= 3) {
            var ppp = n_stack[s-3]
            if(ppp.left === pp) {
              ppp.left = n
            } else {
              ppp.right = n
            }
          }
          break
        }
      }
    } else {
      if(p.right === n) {
        var y = pp.left
        if(y && y._color === RED) {
          //console.log("RRr", y.key)
          p._color = BLACK
          pp.left = repaint(BLACK, y)
          pp._color = RED
          s -= 1
        } else {
          //console.log("RRb")
          pp._color = RED
          pp.right = p.left
          p._color = BLACK
          p.left = pp
          n_stack[s-2] = p
          n_stack[s-1] = n
          recount(pp)
          recount(p)
          if(s >= 3) {
            var ppp = n_stack[s-3]
            if(ppp.right === pp) {
              ppp.right = p
            } else {
              ppp.left = p
            }
          }
          break
        }
      } else {
        var y = pp.left
        if(y && y._color === RED) {
          //console.log("RLr")
          p._color = BLACK
          pp.left = repaint(BLACK, y)
          pp._color = RED
          s -= 1
        } else {
          //console.log("RLb")
          p.left = n.right
          pp._color = RED
          pp.right = n.left
          n._color = BLACK
          n.right = p
          n.left = pp
          n_stack[s-2] = n
          n_stack[s-1] = p
          recount(pp)
          recount(p)
          recount(n)
          if(s >= 3) {
            var ppp = n_stack[s-3]
            if(ppp.right === pp) {
              ppp.right = n
            } else {
              ppp.left = n
            }
          }
          break
        }
      }
    }
  }
  //Return new tree
  n_stack[0]._color = BLACK
  return new RedBlackTree(cmp, n_stack[0])
}


//Visit all nodes inorder
function doVisitFull(visit, node) {
  if(node.left) {
    var v = doVisitFull(visit, node.left)
    if(v) { return v }
  }
  var v = visit(node.key, node.value)
  if(v) { return v }
  if(node.right) {
    return doVisitFull(visit, node.right)
  }
}

//Visit half nodes in order
function doVisitHalf(lo, compare, visit, node) {
  var l = compare(lo, node.key)
  if(l <= 0) {
    if(node.left) {
      var v = doVisitHalf(lo, compare, visit, node.left)
      if(v) { return v }
    }
    var v = visit(node.key, node.value)
    if(v) { return v }
  }
  if(node.right) {
    return doVisitHalf(lo, compare, visit, node.right)
  }
}

//Visit all nodes within a range
function doVisit(lo, hi, compare, visit, node) {
  var l = compare(lo, node.key)
  var h = compare(hi, node.key)
  var v
  if(l <= 0) {
    if(node.left) {
      v = doVisit(lo, hi, compare, visit, node.left)
      if(v) { return v }
    }
    if(h > 0) {
      v = visit(node.key, node.value)
      if(v) { return v }
    }
  }
  if(h > 0 && node.right) {
    return doVisit(lo, hi, compare, visit, node.right)
  }
}


proto.forEach = function rbTreeForEach(visit, lo, hi) {
  if(!this.root) {
    return
  }
  switch(arguments.length) {
    case 1:
      return doVisitFull(visit, this.root)
    break

    case 2:
      return doVisitHalf(lo, this._compare, visit, this.root)
    break

    case 3:
      if(this._compare(lo, hi) >= 0) {
        return
      }
      return doVisit(lo, hi, this._compare, visit, this.root)
    break
  }
}

//First item in list
Object.defineProperty(proto, "begin", {
  get: function() {
    var stack = []
    var n = this.root
    while(n) {
      stack.push(n)
      n = n.left
    }
    return new RedBlackTreeIterator(this, stack)
  }
})

//Last item in list
Object.defineProperty(proto, "end", {
  get: function() {
    var stack = []
    var n = this.root
    while(n) {
      stack.push(n)
      n = n.right
    }
    return new RedBlackTreeIterator(this, stack)
  }
})

//Find the ith item in the tree
proto.at = function(idx) {
  if(idx < 0) {
    return new RedBlackTreeIterator(this, [])
  }
  var n = this.root
  var stack = []
  while(true) {
    stack.push(n)
    if(n.left) {
      if(idx < n.left._count) {
        n = n.left
        continue
      }
      idx -= n.left._count
    }
    if(!idx) {
      return new RedBlackTreeIterator(this, stack)
    }
    idx -= 1
    if(n.right) {
      if(idx >= n.right._count) {
        break
      }
      n = n.right
    } else {
      break
    }
  }
  return new RedBlackTreeIterator(this, [])
}

proto.ge = function(key) {
  var cmp = this._compare
  var n = this.root
  var stack = []
  var last_ptr = 0
  while(n) {
    var d = cmp(key, n.key)
    stack.push(n)
    if(d <= 0) {
      last_ptr = stack.length
    }
    if(d <= 0) {
      n = n.left
    } else {
      n = n.right
    }
  }
  stack.length = last_ptr
  return new RedBlackTreeIterator(this, stack)
}

proto.gt = function(key) {
  var cmp = this._compare
  var n = this.root
  var stack = []
  var last_ptr = 0
  while(n) {
    var d = cmp(key, n.key)
    stack.push(n)
    if(d < 0) {
      last_ptr = stack.length
    }
    if(d < 0) {
      n = n.left
    } else {
      n = n.right
    }
  }
  stack.length = last_ptr
  return new RedBlackTreeIterator(this, stack)
}

proto.lt = function(key) {
  var cmp = this._compare
  var n = this.root
  var stack = []
  var last_ptr = 0
  while(n) {
    var d = cmp(key, n.key)
    stack.push(n)
    if(d > 0) {
      last_ptr = stack.length
    }
    if(d <= 0) {
      n = n.left
    } else {
      n = n.right
    }
  }
  stack.length = last_ptr
  return new RedBlackTreeIterator(this, stack)
}

proto.le = function(key) {
  var cmp = this._compare
  var n = this.root
  var stack = []
  var last_ptr = 0
  while(n) {
    var d = cmp(key, n.key)
    stack.push(n)
    if(d >= 0) {
      last_ptr = stack.length
    }
    if(d < 0) {
      n = n.left
    } else {
      n = n.right
    }
  }
  stack.length = last_ptr
  return new RedBlackTreeIterator(this, stack)
}

//Finds the item with key if it exists
proto.find = function(key) {
  var cmp = this._compare
  var n = this.root
  var stack = []
  while(n) {
    var d = cmp(key, n.key)
    stack.push(n)
    if(d === 0) {
      return new RedBlackTreeIterator(this, stack)
    }
    if(d <= 0) {
      n = n.left
    } else {
      n = n.right
    }
  }
  return new RedBlackTreeIterator(this, [])
}

//Removes item with key from tree
proto.remove = function(key) {
  var iter = this.find(key)
  if(iter) {
    return iter.remove()
  }
  return this
}

//Returns the item at `key`
proto.get = function(key) {
  var cmp = this._compare
  var n = this.root
  while(n) {
    var d = cmp(key, n.key)
    if(d === 0) {
      return n.value
    }
    if(d <= 0) {
      n = n.left
    } else {
      n = n.right
    }
  }
  return
}

//Iterator for red black tree
function RedBlackTreeIterator(tree, stack) {
  this.tree = tree
  this._stack = stack
}

var iproto = RedBlackTreeIterator.prototype

//Test if iterator is valid
Object.defineProperty(iproto, "valid", {
  get: function() {
    return this._stack.length > 0
  }
})

//Node of the iterator
Object.defineProperty(iproto, "node", {
  get: function() {
    if(this._stack.length > 0) {
      return this._stack[this._stack.length-1]
    }
    return null
  },
  enumerable: true
})

//Makes a copy of an iterator
iproto.clone = function() {
  return new RedBlackTreeIterator(this.tree, this._stack.slice())
}

//Swaps two nodes
function swapNode(n, v) {
  n.key = v.key
  n.value = v.value
  n.left = v.left
  n.right = v.right
  n._color = v._color
  n._count = v._count
}

//Fix up a double black node in a tree
function fixDoubleBlack(stack) {
  var n, p, s, z
  for(var i=stack.length-1; i>=0; --i) {
    n = stack[i]
    if(i === 0) {
      n._color = BLACK
      return
    }
    //console.log("visit node:", n.key, i, stack[i].key, stack[i-1].key)
    p = stack[i-1]
    if(p.left === n) {
      //console.log("left child")
      s = p.right
      if(s.right && s.right._color === RED) {
        //console.log("case 1: right sibling child red")
        s = p.right = cloneNode(s)
        z = s.right = cloneNode(s.right)
        p.right = s.left
        s.left = p
        s.right = z
        s._color = p._color
        n._color = BLACK
        p._color = BLACK
        z._color = BLACK
        recount(p)
        recount(s)
        if(i > 1) {
          var pp = stack[i-2]
          if(pp.left === p) {
            pp.left = s
          } else {
            pp.right = s
          }
        }
        stack[i-1] = s
        return
      } else if(s.left && s.left._color === RED) {
        //console.log("case 1: left sibling child red")
        s = p.right = cloneNode(s)
        z = s.left = cloneNode(s.left)
        p.right = z.left
        s.left = z.right
        z.left = p
        z.right = s
        z._color = p._color
        p._color = BLACK
        s._color = BLACK
        n._color = BLACK
        recount(p)
        recount(s)
        recount(z)
        if(i > 1) {
          var pp = stack[i-2]
          if(pp.left === p) {
            pp.left = z
          } else {
            pp.right = z
          }
        }
        stack[i-1] = z
        return
      }
      if(s._color === BLACK) {
        if(p._color === RED) {
          //console.log("case 2: black sibling, red parent", p.right.value)
          p._color = BLACK
          p.right = repaint(RED, s)
          return
        } else {
          //console.log("case 2: black sibling, black parent", p.right.value)
          p.right = repaint(RED, s)
          continue  
        }
      } else {
        //console.log("case 3: red sibling")
        s = cloneNode(s)
        p.right = s.left
        s.left = p
        s._color = p._color
        p._color = RED
        recount(p)
        recount(s)
        if(i > 1) {
          var pp = stack[i-2]
          if(pp.left === p) {
            pp.left = s
          } else {
            pp.right = s
          }
        }
        stack[i-1] = s
        stack[i] = p
        if(i+1 < stack.length) {
          stack[i+1] = n
        } else {
          stack.push(n)
        }
        i = i+2
      }
    } else {
      //console.log("right child")
      s = p.left
      if(s.left && s.left._color === RED) {
        //console.log("case 1: left sibling child red", p.value, p._color)
        s = p.left = cloneNode(s)
        z = s.left = cloneNode(s.left)
        p.left = s.right
        s.right = p
        s.left = z
        s._color = p._color
        n._color = BLACK
        p._color = BLACK
        z._color = BLACK
        recount(p)
        recount(s)
        if(i > 1) {
          var pp = stack[i-2]
          if(pp.right === p) {
            pp.right = s
          } else {
            pp.left = s
          }
        }
        stack[i-1] = s
        return
      } else if(s.right && s.right._color === RED) {
        //console.log("case 1: right sibling child red")
        s = p.left = cloneNode(s)
        z = s.right = cloneNode(s.right)
        p.left = z.right
        s.right = z.left
        z.right = p
        z.left = s
        z._color = p._color
        p._color = BLACK
        s._color = BLACK
        n._color = BLACK
        recount(p)
        recount(s)
        recount(z)
        if(i > 1) {
          var pp = stack[i-2]
          if(pp.right === p) {
            pp.right = z
          } else {
            pp.left = z
          }
        }
        stack[i-1] = z
        return
      }
      if(s._color === BLACK) {
        if(p._color === RED) {
          //console.log("case 2: black sibling, red parent")
          p._color = BLACK
          p.left = repaint(RED, s)
          return
        } else {
          //console.log("case 2: black sibling, black parent")
          p.left = repaint(RED, s)
          continue  
        }
      } else {
        //console.log("case 3: red sibling")
        s = cloneNode(s)
        p.left = s.right
        s.right = p
        s._color = p._color
        p._color = RED
        recount(p)
        recount(s)
        if(i > 1) {
          var pp = stack[i-2]
          if(pp.right === p) {
            pp.right = s
          } else {
            pp.left = s
          }
        }
        stack[i-1] = s
        stack[i] = p
        if(i+1 < stack.length) {
          stack[i+1] = n
        } else {
          stack.push(n)
        }
        i = i+2
      }
    }
  }
}

//Removes item at iterator from tree
iproto.remove = function() {
  var stack = this._stack
  if(stack.length === 0) {
    return this.tree
  }
  //First copy path to node
  var cstack = new Array(stack.length)
  var n = stack[stack.length-1]
  cstack[cstack.length-1] = new RBNode(n._color, n.key, n.value, n.left, n.right, n._count)
  for(var i=stack.length-2; i>=0; --i) {
    var n = stack[i]
    if(n.left === stack[i+1]) {
      cstack[i] = new RBNode(n._color, n.key, n.value, cstack[i+1], n.right, n._count)
    } else {
      cstack[i] = new RBNode(n._color, n.key, n.value, n.left, cstack[i+1], n._count)
    }
  }

  //Get node
  n = cstack[cstack.length-1]
  //console.log("start remove: ", n.value)

  //If not leaf, then swap with previous node
  if(n.left && n.right) {
    //console.log("moving to leaf")

    //First walk to previous leaf
    var split = cstack.length
    n = n.left
    while(n.right) {
      cstack.push(n)
      n = n.right
    }
    //Copy path to leaf
    var v = cstack[split-1]
    cstack.push(new RBNode(n._color, v.key, v.value, n.left, n.right, n._count))
    cstack[split-1].key = n.key
    cstack[split-1].value = n.value

    //Fix up stack
    for(var i=cstack.length-2; i>=split; --i) {
      n = cstack[i]
      cstack[i] = new RBNode(n._color, n.key, n.value, n.left, cstack[i+1], n._count)
    }
    cstack[split-1].left = cstack[split]
  }
  //console.log("stack=", cstack.map(function(v) { return v.value }))

  //Remove leaf node
  n = cstack[cstack.length-1]
  if(n._color === RED) {
    //Easy case: removing red leaf
    //console.log("RED leaf")
    var p = cstack[cstack.length-2]
    if(p.left === n) {
      p.left = null
    } else if(p.right === n) {
      p.right = null
    }
    cstack.pop()
    for(var i=0; i<cstack.length; ++i) {
      cstack[i]._count--
    }
    return new RedBlackTree(this.tree._compare, cstack[0])
  } else {
    if(n.left || n.right) {
      //Second easy case:  Single child black parent
      //console.log("BLACK single child")
      if(n.left) {
        swapNode(n, n.left)
      } else if(n.right) {
        swapNode(n, n.right)
      }
      //Child must be red, so repaint it black to balance color
      n._color = BLACK
      for(var i=0; i<cstack.length-1; ++i) {
        cstack[i]._count--
      }
      return new RedBlackTree(this.tree._compare, cstack[0])
    } else if(cstack.length === 1) {
      //Third easy case: root
      //console.log("ROOT")
      return new RedBlackTree(this.tree._compare, null)
    } else {
      //Hard case: Repaint n, and then do some nasty stuff
      //console.log("BLACK leaf no children")
      for(var i=0; i<cstack.length; ++i) {
        cstack[i]._count--
      }
      var parent = cstack[cstack.length-2]
      fixDoubleBlack(cstack)
      //Fix up links
      if(parent.left === n) {
        parent.left = null
      } else {
        parent.right = null
      }
    }
  }
  return new RedBlackTree(this.tree._compare, cstack[0])
}

//Returns key
Object.defineProperty(iproto, "key", {
  get: function() {
    if(this._stack.length > 0) {
      return this._stack[this._stack.length-1].key
    }
    return
  },
  enumerable: true
})

//Returns value
Object.defineProperty(iproto, "value", {
  get: function() {
    if(this._stack.length > 0) {
      return this._stack[this._stack.length-1].value
    }
    return
  },
  enumerable: true
})


//Returns the position of this iterator in the sorted list
Object.defineProperty(iproto, "index", {
  get: function() {
    var idx = 0
    var stack = this._stack
    if(stack.length === 0) {
      var r = this.tree.root
      if(r) {
        return r._count
      }
      return 0
    } else if(stack[stack.length-1].left) {
      idx = stack[stack.length-1].left._count
    }
    for(var s=stack.length-2; s>=0; --s) {
      if(stack[s+1] === stack[s].right) {
        ++idx
        if(stack[s].left) {
          idx += stack[s].left._count
        }
      }
    }
    return idx
  },
  enumerable: true
})

//Advances iterator to next element in list
iproto.next = function() {
  var stack = this._stack
  if(stack.length === 0) {
    return
  }
  var n = stack[stack.length-1]
  if(n.right) {
    n = n.right
    while(n) {
      stack.push(n)
      n = n.left
    }
  } else {
    stack.pop()
    while(stack.length > 0 && stack[stack.length-1].right === n) {
      n = stack[stack.length-1]
      stack.pop()
    }
  }
}

//Checks if iterator is at end of tree
Object.defineProperty(iproto, "hasNext", {
  get: function() {
    var stack = this._stack
    if(stack.length === 0) {
      return false
    }
    if(stack[stack.length-1].right) {
      return true
    }
    for(var s=stack.length-1; s>0; --s) {
      if(stack[s-1].left === stack[s]) {
        return true
      }
    }
    return false
  }
})

//Update value
iproto.update = function(value) {
  var stack = this._stack
  if(stack.length === 0) {
    throw new Error("Can't update empty node!")
  }
  var cstack = new Array(stack.length)
  var n = stack[stack.length-1]
  cstack[cstack.length-1] = new RBNode(n._color, n.key, value, n.left, n.right, n._count)
  for(var i=stack.length-2; i>=0; --i) {
    n = stack[i]
    if(n.left === stack[i+1]) {
      cstack[i] = new RBNode(n._color, n.key, n.value, cstack[i+1], n.right, n._count)
    } else {
      cstack[i] = new RBNode(n._color, n.key, n.value, n.left, cstack[i+1], n._count)
    }
  }
  return new RedBlackTree(this.tree._compare, cstack[0])
}

//Moves iterator backward one element
iproto.prev = function() {
  var stack = this._stack
  if(stack.length === 0) {
    return
  }
  var n = stack[stack.length-1]
  if(n.left) {
    n = n.left
    while(n) {
      stack.push(n)
      n = n.right
    }
  } else {
    stack.pop()
    while(stack.length > 0 && stack[stack.length-1].left === n) {
      n = stack[stack.length-1]
      stack.pop()
    }
  }
}

//Checks if iterator is at start of tree
Object.defineProperty(iproto, "hasPrev", {
  get: function() {
    var stack = this._stack
    if(stack.length === 0) {
      return false
    }
    if(stack[stack.length-1].left) {
      return true
    }
    for(var s=stack.length-1; s>0; --s) {
      if(stack[s-1].right === stack[s]) {
        return true
      }
    }
    return false
  }
})

//Default comparison function
function defaultCompare(a, b) {
  if(a < b) {
    return -1
  }
  if(a > b) {
    return 1
  }
  return 0
}

//Build a tree
function createRBTree(compare) {
  return new RedBlackTree(compare || defaultCompare, null)
}
},{}],2:[function(require,module,exports){
module.exports = function (cytoscape, cy,  $) {
    
    // Needed because parent nodes cannot be moved!
    function moveTopDown(node, dx, dy) {
        var nodes = node.union(node.descendants());

        nodes.positions(function (node, i) {
            if(typeof node === "number") {
              node = i;
            }
            var pos = node.position();
            return {
                x: pos.x + dx,
                y: pos.y + dy
            };
        });
    }

    function getTopMostNodes(nodes) {
        var nodesMap = {};
        for (var i = 0; i < nodes.length; i++) {
            nodesMap[nodes[i].id()] = true;
        }
        var roots = nodes.filter(function (ele, i) {
            if(typeof ele === "number") {
              ele = i;
            }
            
            var parent = ele.parent()[0];
            while(parent != null){
                if(nodesMap[parent.id()]){
                    return false;
                }
                parent = parent.parent()[0];
            }
            return true;
        });

        return roots;
    }


    cytoscape( "collection", "align", function (horizontal, vertical, alignTo) {

        var eles = getTopMostNodes(this.nodes(":visible"));

        var modelNode = alignTo ? alignTo : eles[0];

        eles = eles.not(modelNode);

        horizontal = horizontal ? horizontal : "none";
        vertical = vertical ? vertical : "none";


        // 0 for center
        var xFactor = 0;
        var yFactor = 0;

        if (vertical == "left")
            xFactor = -1;
        else if (vertical == "right")
            xFactor = 1;

        if (horizontal == "top")
            yFactor = -1;
        else if (horizontal == "bottom")
            yFactor = 1;


        for (var i = 0; i < eles.length; i++) {
            var node = eles[i];
            var oldPos = $.extend({}, node.position());
            var newPos = $.extend({}, node.position());

            if (vertical != "none")
                newPos.x = modelNode.position("x") + xFactor * (modelNode.outerWidth() - node.outerWidth()) / 2;


            if (horizontal != "none")
                newPos.y = modelNode.position("y") + yFactor * (modelNode.outerHeight() - node.outerHeight()) / 2;

            moveTopDown(node, newPos.x - oldPos.x, newPos.y - oldPos.y);
        }

        return this;
    });

    if (cy.undoRedo) {
        function getNodePositions() {
            var positionsAndSizes = {};
            var nodes = cy.nodes();

            for (var i = 0; i < nodes.length; i++) {
                var ele = nodes[i];
                positionsAndSizes[ele.id()] = {
                    x: ele.position("x"),
                    y: ele.position("y")
                };
            }

            return positionsAndSizes;
        }

        function returnToPositions(nodesData) {
            var currentPositions = {};
            cy.nodes().positions(function (ele, i) {
                if(typeof ele === "number") {
                  ele = i;
                }
                currentPositions[ele.id()] = {
                    x: ele.position("x"),
                    y: ele.position("y")
                };
                var data = nodesData[ele.id()];
                return {
                    x: data.x,
                    y: data.y
                };
            });

            return currentPositions
        }

        var ur = cy.undoRedo(null, true);

        ur.action("align", function (args) {

            var nodesData;
            if (args.firstTime){
                nodesData = getNodePositions();
                args.nodes.align(args.horizontal, args.vertical, args.alignTo);
            }
            else
                nodesData = returnToPositions(args);

            return nodesData;

        }, function (nodesData) {
            return returnToPositions(nodesData);
        });

    }



};

},{}],3:[function(require,module,exports){

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

module.exports = debounce;
},{}],4:[function(require,module,exports){
module.exports = function (opts, cy, $, debounce) {

    var options = opts;

    var changeOptions = function (opts) {
      options = opts;
    };


    var $canvas = $( '<canvas></canvas>' );
    var $container = $( cy.container() );
    var ctx = $canvas[ 0 ].getContext( '2d' );
    $container.append( $canvas );

    var drawGrid = function() {
        var zoom = cy.zoom();
        var canvasWidth = $container.width();
        var canvasHeight = $container.height();
        var increment = options.gridSpacing*zoom;
        var pan = cy.pan();
        var initialValueX = pan.x%increment;
        var initialValueY = pan.y%increment;

        ctx.strokeStyle = options.gridColor;
        ctx.lineWidth = options.lineWidth;

        var data = '\t<svg width="'+ canvasWidth + '" height="'+ canvasHeight + '" xmlns="http://www.w3.org/2000/svg">\n\
            <defs>\n\
                <pattern id="horizontalLines" width="' + increment + '" height="' + increment + '" patternUnits="userSpaceOnUse">\n\
                    <path d="M ' + increment + ' 0 L 0 0 0 ' + 0 + '" fill="none" stroke="' + options.gridColor + '" stroke-width="' + options.lineWidth + '" />\n\
                </pattern>\n\
                <pattern id="verticalLines" width="' + increment + '" height="' + increment + '" patternUnits="userSpaceOnUse">\n\
                    <path d="M ' + 0 + ' 0 L 0 0 0 ' + increment + '" fill="none" stroke="' + options.gridColor + '" stroke-width="' + options.lineWidth + '" />\n\
                </pattern>\n\
            </defs>\n\
            <rect width="100%" height="100%" fill="url(#horizontalLines)" transform="translate('+ 0 + ', ' + initialValueY + ')" />\n\
            <rect width="100%" height="100%" fill="url(#verticalLines)" transform="translate('+ initialValueX + ', ' + 0 + ')" />\n\
        </svg>\n';

        var DOMURL = window.URL || window.webkitURL || window;
        var img = new Image();
        var svg = new Blob([data], {type: 'image/svg+xml'});
        var url = DOMURL.createObjectURL(svg);
        
        img.onload = function () {
            clearDrawing();
            ctx.drawImage(img, 0, 0);
            DOMURL.revokeObjectURL(url);
        };
        
        img.src = url;
    };
    
    var clearDrawing = function() {
        var width = $container.width();
        var height = $container.height();

        ctx.clearRect( 0, 0, width, height );
    };

    var resizeCanvas = debounce(function() {
            $canvas
                .attr( 'height', $container.height() )
                .attr( 'width', $container.width() )
                .css( {
                    'position': 'absolute',
                    'top': 0,
                    'left': 0,
                    'z-index': options.gridStackOrder
                } );

            setTimeout( function() {
                var canvasBb = $canvas.offset();
                var containerBb = $container.offset();

                $canvas
                    .attr( 'height', $container.height() )
                    .attr( 'width', $container.width() )
                    .css( {
                        'top': -( canvasBb.top - containerBb.top ),
                        'left': -( canvasBb.left - containerBb.left )
                    } );
                drawGrid();
            }, 0 );

    }, 250);




    return {
        initCanvas: resizeCanvas,
        resizeCanvas: resizeCanvas,
        clearCanvas: clearDrawing,
        drawGrid: drawGrid,
        changeOptions: changeOptions,
        sizeCanvas: drawGrid
    };
};

},{}],5:[function(require,module,exports){
module.exports = function (cy, snap, resize, snapToGridDuringDrag, drawGrid, guidelines, parentPadding, $, opts) {

	var feature = function (func) {
		return function (enable) {
			func(enable);
		};
	};

	var controller = {
		snapToGridDuringDrag: new feature(setDiscreteDrag),
		resize: new feature(setResize),
		snapToGridOnRelease: new feature(setSnapToGrid),
		drawGrid: new feature(setDrawGrid),
		guidelines: new feature(setGuidelines),
		parentPadding: new feature(setParentPadding)
	};

	function applyToCyTarget(func, allowParent) {
		return function (e) {
            var cyTarget = e.target || e.cyTarget;
			if (!cyTarget.is(":parent") || allowParent)
				func(cyTarget);
		}
	}

	function applyToAllNodesButNoParent(func) {
		return function () {
			cy.nodes().not(":parent").each(function (ele, i) {
                if(typeof ele === "number") {
                  ele = i;
                }
                
				func(ele);
			});
		};
	}
	function applyToAllNodes(func) {
		return function () {
			cy.nodes().each(function (ele, i) {
                if(typeof ele === "number") {
                  ele = i;
                }
                
				func(ele);
			});
		};
	}

	function eventStatus(enable) {
		return enable ? "on" : "off";
	}


	// Discrete Drag
	function setDiscreteDrag(enable) {
		cy[eventStatus(enable)]("tapstart", "node", snapToGridDuringDrag.onTapStartNode);
	}

	// Resize
	var resizeAllNodes = applyToAllNodesButNoParent(resize.resizeNode);
	var resizeNode = applyToCyTarget(resize.resizeNode);
	var recoverAllNodeDimensions = applyToAllNodesButNoParent(resize.recoverNodeDimensions);

	function setResize(enable) {
		cy[eventStatus(enable)]("ready", resizeAllNodes);
		//  cy[eventStatus(enable)]("style", "node", resizeNode);
		enable ? resizeAllNodes() : recoverAllNodeDimensions();
	}

	// Snap To Grid
	var snapAllNodes = applyToAllNodes(snap.snapNodesTopDown);
	var recoverSnapAllNodes = applyToAllNodes(snap.recoverSnapNode);
	var snapCyTarget = applyToCyTarget(snap.snapNode, true);

	function setSnapToGrid(enable) {
		cy[eventStatus(enable)]("add", "node", snapCyTarget);
		cy[eventStatus(enable)]("ready", snapAllNodes);

		cy[eventStatus(enable)]("free", "node", snap.onFreeNode);

		if (enable) {
			snapAllNodes();
		} else {
			recoverSnapAllNodes();
		}
	}

	// Draw Grid
	var drawGridOnZoom = function () {
		if (currentOptions.zoomDash) drawGrid.drawGrid()
	};
	var drawGridOnPan = function () {
		if (currentOptions.panGrid) drawGrid.drawGrid()
	};

	function setDrawGrid(enable) {
		cy[eventStatus(enable)]('zoom', drawGridOnZoom);
		cy[eventStatus(enable)]('pan', drawGridOnPan);
		cy[eventStatus(enable)]('ready', drawGrid.resizeCanvas);

		if (enable) {
			drawGrid.initCanvas();
			$(window).on('resize', drawGrid.resizeCanvas);
		} else {
			drawGrid.clearCanvas();
			$(window).off('resize', drawGrid.resizeCanvas);
		}
	}

	// Guidelines
	var activeTopMostNodes = null;
	var guidelinesGrabHandler = function(e){
        var cyTarget = e.target || e.cyTarget;
		var nodes = cyTarget.selected() ? e.cy.$(":selected") : cyTarget;
		activeTopMostNodes = guidelines.getTopMostNodes(nodes.nodes());
		guidelines.lines.init(activeTopMostNodes);
	}
	var guidelinesDragHandler = function(e){
		if (this.id() == activeTopMostNodes.id()){
			guidelines.lines.update(activeTopMostNodes);

			if (opts.snapToAlignmentLocationDuringDrag)
				guidelines.lines.snapToAlignmentLocation(activeTopMostNodes);
		}
	};
	var guidelinesFreeHandler = function(e){
		if (opts.snapToAlignmentLocationOnRelease)
			guidelines.lines.snapToAlignmentLocation(activeTopMostNodes);

		guidelines.lines.destroy();
		activeTopMostNodes = null;
	};
	var guidelinesWindowResizeHandler = function(e){
		guidelines.lines.resize();
	};
	var guidelinesTapHandler = function(e){
		guidelines.getMousePos(e);
	};
	var guidelinesPanHandler = function(e){
		if (activeTopMostNodes){
			guidelines.setMousePos(cy.pan());
			guidelines.lines.init(activeTopMostNodes);
		}
	}
	function setGuidelines(enable) {
		if (enable){
			guidelines.resizeCanvas();
			cy.on("tapstart", "node", guidelinesTapHandler);
			cy.on("grab", guidelinesGrabHandler);
			cy.on("pan", guidelinesPanHandler);
			cy.on("drag", "node", guidelinesDragHandler);
			cy.on("free", guidelinesFreeHandler);
			$(window).on("resize", guidelinesWindowResizeHandler);
		}
		else{
			cy.off("tapstart", "node", guidelinesTapHandler);
			cy.off("grab", guidelinesGrabHandler);
			cy.off("pan", guidelinesPanHandler);
			cy.off("drag", "node", guidelinesDragHandler);
			cy.off("free", guidelinesFreeHandler);
			$(window).off("resize", guidelinesWindowResizeHandler);
		}
	}

	// Parent Padding
	var setAllParentPaddings = function (enable) {
		parentPadding.setPaddingOfParent(cy.nodes(":parent"), enable);
	};
	var enableParentPadding = function (node) {
		parentPadding.setPaddingOfParent(node, true);
	};


	function setParentPadding(enable) {

		setAllParentPaddings(enable);

		cy[eventStatus(enable)]('ready', setAllParentPaddings);
		cy[eventStatus(enable)]("add", "node:parent", applyToCyTarget(enableParentPadding, true));
	}

	// Sync with options: Enables/disables changed via options.
	var latestOptions = {};
	var currentOptions;

	var specialOpts = {
		drawGrid: ["gridSpacing", "zoomDash", "panGrid", "gridStackOrder", "gridColor", "lineWidth", "lineDash"],
		guidelines: ["gridSpacing", "guidelinesStackOrder", "guidelinesTolerance", "guidelinesStyle", "distributionGuidelines", "range", "minDistRange",  "geometricGuidelineRange"],
		resize: ["gridSpacing"],
		parentPadding: ["gridSpacing", "parentSpacing"],
		snapToGridOnRelease: ["gridSpacing"]
	};

	function syncWithOptions(options) {
		currentOptions = $.extend(true, {}, options);
		options.guidelines = options.initPosAlignment ||  options.distributionGuidelines || options.geometricGuideline;
		for (var key in options)
			if (latestOptions[key] != options[key])
				if (controller.hasOwnProperty(key)) {
					controller[key](options[key]);
				} else {
					for (var optsKey in specialOpts) {
						var opts = specialOpts[optsKey];
						if (opts.indexOf(key) >= 0) {
							if(optsKey == "drawGrid") {
								drawGrid.changeOptions(options);
								if (options.drawGrid)
									drawGrid.resizeCanvas();
							}

							if (optsKey == "snapToGridOnRelease"){
								snap.changeOptions(options);
								if (options.snapToGridOnRelease)
									snapAllNodes();
							}

							if(optsKey == "guidelines")
								guidelines.changeOptions(options);

							if (optsKey == "resize") {
								resize.changeOptions(options);
								if (options.resize)
									resizeAllNodes();
							}

							if (optsKey == "parentPadding")
								parentPadding.changeOptions(options);


						}
					}
				}
		latestOptions = $.extend(true, latestOptions, options);
	}

	return {
		init: syncWithOptions,
		syncWithOptions: syncWithOptions
	};

};

},{}],6:[function(require,module,exports){
module.exports = function (opts, cy, $, debounce) {


	var RBTree = require("functional-red-black-tree");

	var options = opts;

	var changeOptions = function (opts) {
		options = opts;

		// RBTree always returns null, when low == high
		// to avoid this:
		if (options.guidelinesTolerance == 0)
			options.guidelinesTolerance = 0.001;
	};

	var getCyScratch = function () {
		var sc = cy.scratch("_guidelines");
		if (!sc)
			sc = cy.scratch("_guidelines", {});

		return sc;
	};

	/* Resize canvas */
	var resizeCanvas = debounce(function () {
		clearDrawing();
		$canvas
			.attr('height', $container.height())
			.attr('width', $container.width())
			.css({
				'position': 'absolute',
				'top': 0,
				'left': 0,
				'z-index': options.guidelinesStackOrder
			});
		setTimeout(function () {
			var canvasBb = $canvas.offset();
			var containerBb = $container.offset();

			$canvas
				.attr('height', $container.height())
				.attr('width', $container.width())
				.css({
					'top': -( canvasBb.top - containerBb.top ),
					'left': -( canvasBb.left - containerBb.left )
				});
		}, 0);
	}, 250);

	/* Clear canvas */
	var clearDrawing = function () {
		var width = $container.width();
		var height = $container.height();
		ctx.clearRect(0, 0, width, height);
	};

	/* Create a canvas */
	var $canvas = $('<canvas></canvas>');
	var $container = $(cy.container());
	var ctx = $canvas[0].getContext('2d');
	$container.append($canvas);
	resizeCanvas();

	/* Global variables */
	var VTree = null;
	var HTree = null;
	var nodeInitPos;
	var excludedNodes;
	var lines = {};
	var panInitPos = {};
	var alignedLocations = {"h" : null, "v" : null};

	/**
	 * Get positions of sides of a node
	 * @param node : a node
	 * @return : object of positions
	 */ 
	lines.getDims = function (node) {
		var pos = node.renderedPosition();
		var width = node.renderedWidth();
		var height = node.renderedHeight();
		var padding = {
			left: Number(node.renderedStyle("padding-left").replace("px", "")),
			right: Number(node.renderedStyle("padding-right").replace("px", "")),
			top: Number(node.renderedStyle("padding-top").replace("px", "")),
			bottom: Number(node.renderedStyle("padding-bottom").replace("px", ""))
		};

		return {
			horizontal: {
				center: (pos.x),
				left: Math.round(pos.x - (padding.left + width / 2)),
				right: Math.round(pos.x + (padding.right + width / 2))
			},
			vertical: {
				center: (pos.y),
				top: Math.round(pos.y - (padding.top + height / 2)),
				bottom: Math.round(pos.y + (padding.bottom + height / 2))
			}
		};
	};

	/**
	 * Initialize trees and initial position of node
	 * @param activeNodes : top most active nodes
	 */
	lines.init = function (activeNodes) {
		VTree = RBTree();
		HTree = RBTree();
		// TODO: seperate initialization of nodeInitPos
		// not necessary to init trees when geometric and distribution alignments are disabled,
		// but reference guideline is enables
		if (!nodeInitPos){
			panInitPos.x = cy.pan("x"); panInitPos.y = cy.pan("y");
			nodeInitPos = activeNodes.renderedPosition();
		}

		var nodes = cy.nodes(":visible");
		excludedNodes = activeNodes.union(activeNodes.ancestors());
		excludedNodes = excludedNodes.union(activeNodes.descendants());
		nodes.not(excludedNodes).each(function (node, i) {
            if(typeof node === "number") {
              node = i;
            }
			var dims = lines.getDims(node);

			["left", "center", "right"].forEach(function (val) {
				var hKey = dims.horizontal[val];
				if (HTree.get(hKey))
				HTree.get(hKey).push(node);
				else
				HTree = HTree.insert(hKey, [node]);
			});

			["top", "center", "bottom"].forEach(function (val) {
				var vKey = dims.vertical[val];
				if (VTree.get(vKey))
				VTree.get(vKey).push(node);
				else
				VTree = VTree.insert(vKey, [node]);
			});

		});
		ctx.lineWidth=options.lineWidth;
		lines.update(activeNodes);
	};

	/* Destroy gobal variables */
	lines.destroy = function () {
		lines.clear();
		VTree = null; HTree = null;
		nodeInitPos = null;
		mouseInitPos = {};
		alignedLocations = {"h" : null, "v" : null};
		if (nodeToAlign){
			nodeToAlign.unlock();
			nodeToAlign = undefined;
		}
	};

	lines.clear = clearDrawing;

	/**
	 * Draw straight line
	 * @param from : initial position
	 * @param to : final position
	 * @param color : color of the line
	 * @param lineStyle : whether line is solid or dashed
	 */
	lines.drawLine = function (from, to, color, lineStyle) {
		ctx.setLineDash(lineStyle);
		ctx.beginPath();
		ctx.moveTo(from.x, from.y);
		ctx.lineTo(to.x, to.y);
		ctx.strokeStyle = color;
		ctx.stroke();
	};

	/**
	 * Draw an arrow
	 * @param position : position of the arrow
	 * @param type : type/directşon of the arrow
	 */
	lines.drawArrow = function(position, type){
		if (type == "right"){
			// right arrow
			ctx.setLineDash([]);	
			ctx.beginPath();
			ctx.moveTo(position.x-5, position.y-5);
			ctx.lineTo(position.x, position.y);
			ctx.lineTo(position.x-5, position.y+5);
			ctx.stroke();
		}
		else if (type == "left"){
			// left arrow
			ctx.setLineDash([]);	
			ctx.beginPath();
			ctx.moveTo(position.x+5, position.y-5);
			ctx.lineTo(position.x, position.y);
			ctx.lineTo(position.x+5, position.y+5);
			ctx.stroke();
		}
		else if (type == "top"){
			// up arrow
			ctx.setLineDash([]);	
			ctx.beginPath();
			ctx.moveTo(position.x-5, position.y+5);
			ctx.lineTo(position.x, position.y);
			ctx.lineTo(position.x+5, position.y+5);
			ctx.stroke();
		}
		else if (type == "bottom"){
			// down arrow
			ctx.setLineDash([]);	
			ctx.beginPath();
			ctx.moveTo(position.x-5, position.y-5);
			ctx.lineTo(position.x, position.y);
			ctx.lineTo(position.x+5, position.y-5);
			ctx.stroke();
		}

	}

	/**
	 * Draw a cross - x
	 * @param position : position of the cross
	 */
	lines.drawCross = function(position){
		ctx.setLineDash([]);	
		ctx.beginPath();
		ctx.moveTo(position.x - 5, position.y + 5);
		ctx.lineTo(position.x + 5, position.y - 5);
		ctx.moveTo(position.x - 5, position.y - 5);
		ctx.lineTo(position.x + 5, position.y + 5);
		ctx.stroke();
	};
	
	/**
	 * Calculate the amount of offset for distribution guidelines
	 * @param nodes - list of nodes
	 * @param type - horizontal or vertical
	 */
	calculateOffset = function(nodes, type){
			var minNode = nodes[0], min = lines.getDims(minNode)[type]["center"];
			var maxNode = nodes[0], max = lines.getDims(maxNode)[type]["center"];

			for (node of nodes){
				if (lines.getDims(node)[type]["center"] < min){
					min = lines.getDims(node)[type]["center"]; minNode = node;
				}
				if (lines.getDims(node)[type]["center"] > max){
					max = lines.getDims(node)[type]["center"]; maxNode = node;
				}
			}

			if (type == "horizontal")
				var offset = (min + max) / 2 < lines.getDims(nodes[1])[type]["center"] ? max + (0.5*maxNode.width() + options.guidelinesStyle.distGuidelineOffset)*cy.zoom() : min - (0.5*minNode.width() + options.guidelinesStyle.distGuidelineOffset)*cy.zoom();
			else
				var offset = (min + max) / 2 < lines.getDims(nodes[1])[type]["center"] ? max + (0.5*maxNode.height() + options.guidelinesStyle.distGuidelineOffset)*cy.zoom() : min - (0.5*minNode.height() + options.guidelinesStyle.distGuidelineOffset)*cy.zoom();

			return offset;
	}
	/** Guidelines for horizontally distributed alignment
	 * @param: node the node to be aligned
	 */
	lines.horizontalDistribution = function(node){
		// variables
		var leftNode = null, rightNode = null;
		var nodeDim = lines.getDims(node);
		var Xcenter = nodeDim["horizontal"]["center"];
		var Ycenter = nodeDim["vertical"]["center"];
		// Find nodes in range and check if they align
		HTree.forEach(function(key, nodes){

			for (left of nodes){
				var leftDim = lines.getDims(left);
				if (Math.abs(leftDim["vertical"]["center"] - nodeDim["vertical"]["center"]) < options.guidelinesStyle.range*cy.zoom()){
					if ((leftDim["horizontal"]["right"]) == key && 
						nodeDim["horizontal"]["left"] - leftDim["horizontal"]["right"] > options.guidelinesStyle.minDistRange){
							var ripo = Math.round(2*Xcenter)-key;
							HTree.forEach(function($, rightNodes){
								for (right of rightNodes){
									if (Math.abs(lines.getDims(right)["vertical"]["center"] - Ycenter) < options.guidelinesStyle.range*cy.zoom()){
										if (Math.abs(ripo - lines.getDims(right)["horizontal"]["left"]) < 2*options.guidelinesTolerance){
											leftNode = left; rightNode = right;
										}
									}
								}
							}, ripo - options.guidelinesTolerance, ripo + options.guidelinesTolerance);
						}
				}
			}
		}, Xcenter - options.guidelinesStyle.range*cy.zoom(), Xcenter);

		// Draw the lines
		if (leftNode){
			alignedLocations.hd = Xcenter - (lines.getDims(rightNode)["horizontal"]["left"] + lines.getDims(leftNode)["horizontal"]["right"]) / 2.0;
			if (!options.geometricGuideline || alignedLocations.h == null || Math.abs(alignedLocations.h) > Math.abs(alignedLocations.hd)){
				alignedLocations.h = alignedLocations.hd;
			}
			var offset = calculateOffset([leftNode, node, rightNode], "vertical");
	
			lines.drawLine({
				x: lines.getDims(leftNode)["horizontal"]["right"],
				y: offset
			}, {
				x: nodeDim["horizontal"]["left"],
				y: offset
			}, options.guidelinesStyle.horizontalDistColor, options.guidelinesStyle.horizontalDistLine);

			lines.drawLine({
				x: lines.getDims(rightNode)["horizontal"]["left"],
				y: offset
			}, {
				x: nodeDim["horizontal"]["right"],
				y: offset
			}, options.guidelinesStyle.horizontalDistColor, options.guidelinesStyle.horizontalDistLine);

			lines.drawLine({
				x: lines.getDims(leftNode)["horizontal"]["right"],
				y: offset
			}, {
				x: lines.getDims(leftNode)["horizontal"]["right"],
				y: lines.getDims(leftNode)["vertical"]["center"]
			}, options.guidelinesStyle.horizontalDistColor, options.guidelinesStyle.horizontalDistLine);

			lines.drawLine({
				x: lines.getDims(rightNode)["horizontal"]["left"],
				y: offset
			}, {
				x: lines.getDims(rightNode)["horizontal"]["left"],
				y: lines.getDims(rightNode)["vertical"]["center"]
			}, options.guidelinesStyle.horizontalDistColor, options.guidelinesStyle.horizontalDistLine);

			lines.drawLine({
				x: nodeDim["horizontal"]["left"],
				y: offset
			}, {
				x: nodeDim["horizontal"]["left"],
				y: Ycenter
			}, options.guidelinesStyle.horizontalDistColor, options.guidelinesStyle.horizontalDistLine);

			lines.drawLine({
				x: nodeDim["horizontal"]["right"],
				y: offset
			}, {
				x: nodeDim["horizontal"]["right"],
				y: Ycenter
			}, options.guidelinesStyle.horizontalDistColor, options.guidelinesStyle.horizontalDistLine);

			lines.drawArrow({
				x: lines.getDims(leftNode)["horizontal"]["right"],
				y: offset}, "left");

			lines.drawArrow({
				x: nodeDim["horizontal"]["left"],
				y: offset}, "right");

			lines.drawArrow({
				x: nodeDim["horizontal"]["right"],
				y: offset}, "left");

			lines.drawArrow({
				x: lines.getDims(rightNode)["horizontal"]["left"],
				y: offset}, "right");

		}
		else{
			var state = lines.horizontalDistributionNext(node,"left" );

			if (!state)  
				lines.horizontalDistributionNext(node,"right" );
		}
	}

	/** Guidelines for horizontally distributed alignment
	 * @param: node the node to be aligned
	 */
	lines.verticalDistribution = function(node){
		// variables
		var belowNode = null, aboveNode = null;
		var nodeDim = lines.getDims(node);
		var Xcenter = nodeDim["horizontal"]["center"];
		var Ycenter = nodeDim["vertical"]["center"];
		// Find nodes in range and check if they align
		VTree.forEach(function(key, nodes){

			for (below of nodes){
				var belowDim = lines.getDims(below);
				if (Math.abs(belowDim["horizontal"]["center"] - nodeDim["horizontal"]["center"]) < options.guidelinesStyle.range*cy.zoom()){
					if (belowDim["vertical"]["bottom"] == key &&
						nodeDim["vertical"]["top"] - belowDim["vertical"]["bottom"] > options.guidelinesStyle.minDistRange){
							var abpo = Math.round((2*Ycenter)-key);
							VTree.forEach(function($, aboveNodes){
								//if (aboveNodes){
								for (above of aboveNodes){
									if (Math.abs(lines.getDims(above)["horizontal"]["center"] - Xcenter) < options.guidelinesStyle.range*cy.zoom()){
										if (Math.abs(abpo - lines.getDims(above)["vertical"]["top"]) < 2*options.guidelinesTolerance){
											belowNode = below; aboveNode = above;
										}
									}
								}
								//}
							}, abpo - options.guidelinesTolerance, abpo + options.guidelinesTolerance);
						}
				}
			}
		}, Ycenter - options.guidelinesStyle.range*cy.zoom(), Ycenter);

		if (belowNode){
			alignedLocations.vd = Ycenter - (lines.getDims(belowNode)["vertical"]["bottom"] + lines.getDims(aboveNode)["vertical"]["top"]) / 2.0;
			if (!options.geometricGuideline || alignedLocations.v == null || Math.abs(alignedLocations.v) > Math.abs(alignedLocations.vd)){
				alignedLocations.v = alignedLocations.vd;
			}
			var offset = calculateOffset([belowNode, node, aboveNode], "horizontal");
			lines.drawLine({
				y: lines.getDims(belowNode)["vertical"]["bottom"],//renderedPosition("x"),
				x: offset
			}, {
				y: nodeDim["vertical"]["top"],
				x: offset
			}, options.guidelinesStyle.verticalDistColor, options.guidelinesStyle.verticalDistLine);

			lines.drawLine({
				y: lines.getDims(aboveNode)["vertical"]["top"],//renderedPosition("x"),
				x: offset
			}, {
				y: nodeDim["vertical"]["bottom"],
				x: offset
			}, options.guidelinesStyle.verticalDistColor, options.guidelinesStyle.verticalDistLine);

			lines.drawLine({
				y: lines.getDims(belowNode)["vertical"]["bottom"],//renderedPosition("x"),
				x: offset
			}, {
				y: lines.getDims(belowNode)["vertical"]["bottom"],
				x: lines.getDims(belowNode)["horizontal"]["center"]
			}, options.guidelinesStyle.verticalDistColor, options.guidelinesStyle.verticalDistLine);

			lines.drawLine({
				y: lines.getDims(aboveNode)["vertical"]["top"],//renderedPosition("x"),
				x: offset
			}, {
				y: lines.getDims(aboveNode)["vertical"]["top"],
				x: lines.getDims(aboveNode)["horizontal"]["center"]
			}, options.guidelinesStyle.verticalDistColor, options.guidelinesStyle.verticalDistLine);

			lines.drawLine({
				y: nodeDim["vertical"]["bottom"],//renderedPosition("x"),
				x: offset
			}, {
				y: nodeDim["vertical"]["bottom"],//renderedPosition("x"),
				x: Xcenter
			}, options.guidelinesStyle.verticalDistColor, options.guidelinesStyle.verticalDistLine);

			lines.drawLine({
				y: nodeDim["vertical"]["top"],//renderedPosition("x"),
				x: offset
			}, {
				y: nodeDim["vertical"]["top"],//renderedPosition("x"),
				x: Xcenter
			}, options.guidelinesStyle.verticalDistColor, options.guidelinesStyle.verticalDistLine);

			lines.drawArrow({
				x: offset,
				y: lines.getDims(belowNode)["vertical"]["bottom"]}, "top");

			lines.drawArrow({
				x: offset,
				y: nodeDim["vertical"]["top"]}, "bottom");

			lines.drawArrow({
				x: offset,
			y: lines.getDims(aboveNode)["vertical"]["top"]}, "bottom");

			lines.drawArrow({
				x: offset,
				y: nodeDim["vertical"]["bottom"]}, "top");
			}
		else{
			var state = lines.verticalDistributionNext(node,"below" );

			if (!state)  
				lines.verticalDistributionNext(node,"above" );
		}
	}    

	/**
	 * Find geometric alignment lines and draw them
	 * @param type: horizontal or vertical
	 * @param node: the node to be aligned
	 */
	lines.searchForLine = function (type, node) {

		// variables
		var position, target, center, axis, otherAxis, Tree, closestKey;
		var dims = lines.getDims(node)[type];
		var targetKey = Number.MAX_SAFE_INTEGER;

		// initialize Tree
		if ( type == "horizontal"){
			Tree = HTree;
			axis = "y";
			otherAxis = "x";
			alignedLocations.h = null;
		} else{
			Tree = VTree;
			axis = "x";
			otherAxis = "y";
			alignedLocations.v = null;
		}

		center = node.renderedPosition(axis);
		// check if node aligned in any dimension:
		// {center, left, right} or {center, top, bottom}
		for (var dimKey in dims) {
			position = dims[dimKey];

			// find the closest alignment in range of tolerance
			Tree.forEach(function (exKey, nodes) {
				for (n of nodes){
					if (options.centerToEdgeAlignment || (dimKey != "center" && n.renderedPosition(otherAxis) != exKey) || (dimKey == "center" && n.renderedPosition(otherAxis) == exKey)){
					var dif = Math.abs(center - n.renderedPosition(axis));
					if ( dif < targetKey && dif < options.guidelinesStyle.geometricGuidelineRange*cy.zoom()){
						target = n;
						targetKey = dif;
						closestKey = exKey;
					}
					}
				}
			}, position - Number(options.guidelinesTolerance), position + Number(options.guidelinesTolerance));

			// if alignment found, draw lines and break
			if (target) {
				targetKey = lines.getDims(node)[type][dimKey];
				
				// Draw horizontal or vertical alignment line
				if (type == "horizontal") {
					alignedLocations.h = targetKey - closestKey;
					lines.drawLine({
						x: targetKey,
						y: node.renderedPosition("y")
					}, {
						x: targetKey,
						y: target.renderedPosition("y")
					}, options.guidelinesStyle.strokeStyle, options.guidelinesStyle.lineDash);
				} else {
					alignedLocations.v = targetKey - closestKey;
					lines.drawLine({
						x: node.renderedPosition("x"),
						y: targetKey
					}, {
						x: target.renderedPosition("x"),
						y: targetKey
					}, options.guidelinesStyle.strokeStyle, options.guidelinesStyle.lineDash);
				}
				break;
			}
		}
	};

	lines.horizontalDistributionNext = function(node, type){

		// variables
		var leftNode = null, rightNode = null;
		var nodeDim = lines.getDims(node);
		var Xcenter = nodeDim["horizontal"]["center"];
		var Ycenter = nodeDim["vertical"]["center"];
		var side = "right", otherSide = "left";
		var lowerBound = Xcenter;
		if (type == "left"){
			side = "left"; otherSide = "right";
			var lowerBound = Xcenter - options.guidelinesStyle.range*cy.zoom();
		}

		var compare = {
			"left": function (x, y) { return y - x > options.guidelinesStyle.minDistRange},
			"right": function (x, y) { return x - y > options.guidelinesStyle.minDistRange}
		}

		// Find nodes in range and check if they align
		HTree.forEach(function(key, nodes){
			for (left of nodes){
				var leftDim = lines.getDims(left);
				if (Math.abs(leftDim["vertical"]["center"] - nodeDim["vertical"]["center"]) < options.guidelinesStyle.range*cy.zoom()){
					if ((leftDim["horizontal"][otherSide]) == key && 
						compare[type](leftDim["horizontal"][otherSide], nodeDim["horizontal"][side])){
							var ll = leftDim["horizontal"][side]-(nodeDim["horizontal"][side] - key);
							HTree.forEach(function($, rightNodes){
								for (right of rightNodes){
									if (Math.abs(lines.getDims(right)["vertical"]["center"] - Ycenter) < options.guidelinesStyle.range*cy.zoom()){
										if (Math.abs(ll - lines.getDims(right)["horizontal"][otherSide]) < 2*options.guidelinesTolerance){
											leftNode = left; rightNode = right;
										}
									}
								}
							}, ll - options.guidelinesTolerance, ll + options.guidelinesTolerance);
						}
				}
			}
		}, lowerBound, lowerBound + options.guidelinesStyle.range*cy.zoom());

		// Draw the lines
		if (leftNode){
			alignedLocations.hd =(lines.getDims(node)["horizontal"][side] - lines.getDims(leftNode)["horizontal"][otherSide]) - (lines.getDims(leftNode)["horizontal"][side] - lines.getDims(rightNode)["horizontal"][otherSide]);
			if (!options.geometricGuideline || alignedLocations.h == null || Math.abs(alignedLocations.h) > Math.abs(alignedLocations.hd)){
				alignedLocations.h = alignedLocations.hd;
			}
			
			lines.drawDH(node, leftNode, rightNode, type);
			return true;
		}
		else if (!options.geometricGuideline){
			alignedLocations.h = null;
		}
		return false;

	}

	lines.drawDH = function(node, leftNode, rightNode, type){
		var Ycenter = lines.getDims(node)["vertical"]["center"];
		var side = "right", otherSide = "left";
		if (type == "left"){
			side = "left"; otherSide = "right";
		}
		var offset = calculateOffset([leftNode, node, rightNode], "vertical");

		lines.drawLine({
			x: lines.getDims(leftNode)["horizontal"][otherSide],
			y: offset
		}, {
			x: lines.getDims(node)["horizontal"][side],
			y: offset
		}, options.guidelinesStyle.horizontalDistColor, options.guidelinesStyle.horizontalDistLine);

		lines.drawLine({
			x: lines.getDims(node)["horizontal"][side],
			y: offset
		}, {
			x: lines.getDims(node)["horizontal"][side],
			y: Ycenter,//lines.getDims(leftNode)["vertical"]["center"]
		}, options.guidelinesStyle.horizontalDistColor, options.guidelinesStyle.horizontalDistLine);

		lines.drawLine({
			x: lines.getDims(rightNode)["horizontal"][otherSide],
			y: offset
		}, {
			x: lines.getDims(leftNode)["horizontal"][side],
			y: offset
		}, options.guidelinesStyle.horizontalDistColor, options.guidelinesStyle.horizontalDistLine);
		lines.drawLine({
			x: lines.getDims(rightNode)["horizontal"][otherSide],
			y: offset
		}, {
			x: lines.getDims(rightNode)["horizontal"][otherSide],
			y: lines.getDims(rightNode)["vertical"]["center"]
		}, options.guidelinesStyle.horizontalDistColor, options.guidelinesStyle.horizontalDistLine);

		lines.drawLine({
			x: lines.getDims(leftNode)["horizontal"][otherSide],
			y: offset
		}, {
			x: lines.getDims(leftNode)["horizontal"][otherSide],
			y: lines.getDims(leftNode)["vertical"]["center"]
		}, options.guidelinesStyle.horizontalDistColor, options.guidelinesStyle.horizontalDistLine);

		lines.drawLine({
			x: lines.getDims(leftNode)["horizontal"][side],
			y: offset
		}, {
			x: lines.getDims(leftNode)["horizontal"][side],
			y: lines.getDims(leftNode)["vertical"]["center"]
		}, options.guidelinesStyle.horizontalDistColor, options.guidelinesStyle.horizontalDistLine);


		lines.drawArrow({
			x: lines.getDims(node)["horizontal"][side],
			y: offset}, otherSide);

		lines.drawArrow({
			x: lines.getDims(leftNode)["horizontal"][otherSide],
			y: offset}, side);

		lines.drawArrow({
			x: lines.getDims(leftNode)["horizontal"][side],
			y: offset}, otherSide);

		lines.drawArrow({
			x: lines.getDims(rightNode)["horizontal"][otherSide],
			y: offset}, side);

	}

	lines.verticalDistributionNext = function(node, type){
		// variables
		var belowNode = null, aboveNode = null;
		var nodeDim = lines.getDims(node);
		var Xcenter = nodeDim["horizontal"]["center"];
		var Ycenter = nodeDim["vertical"]["center"];
		var side = "top", otherSide = "bottom";
		var lowerBound = Ycenter - options.guidelinesStyle.range*cy.zoom();
		if (type == "above"){
			side = "bottom"; otherSide = "top";
			lowerBound = Ycenter;
		}

		var compare = {
			"below": function (x, y) { return y - x > options.guidelinesStyle.minDistRange},
			"above": function (x, y) { return x - y > options.guidelinesStyle.minDistRange}
		}
		// Find nodes in range and check if they align
		VTree.forEach(function(key, nodes){

			for (below of nodes){
				var belowDim = lines.getDims(below);
				if (Math.abs(belowDim["horizontal"]["center"] - nodeDim["horizontal"]["center"]) < options.guidelinesStyle.range*cy.zoom()){
					if (belowDim["vertical"][otherSide] == key &&
						compare[type](belowDim["vertical"][otherSide], nodeDim["vertical"][side])){
							var ll = belowDim["vertical"][side]-(nodeDim["vertical"][side]-key);
							VTree.forEach(function($, aboveNodes){
								for (above of aboveNodes){
									if (Math.abs(lines.getDims(above)["horizontal"]["center"] - Xcenter) < options.guidelinesStyle.range*cy.zoom()){
										if (Math.abs(ll - lines.getDims(above)["vertical"][otherSide]) < 2*options.guidelinesTolerance){
											belowNode = below; aboveNode = above;
										}
									}
								}
							}, ll - options.guidelinesTolerance, ll + options.guidelinesTolerance);
						}
				}
			}
		}, lowerBound, lowerBound+options.guidelinesStyle.range*cy.zoom());

		if (belowNode){
			alignedLocations.vd =(lines.getDims(node)["vertical"][side] - lines.getDims(belowNode)["vertical"][otherSide]) - (lines.getDims(belowNode)["vertical"][side] - lines.getDims(aboveNode)["vertical"][otherSide]);
			if (!options.geometricGuideline || alignedLocations.v == null || Math.abs(alignedLocations.v) > Math.abs(alignedLocations.vd)){
				alignedLocations.v = alignedLocations.vd;
			}
			lines.drawDV(node, belowNode, aboveNode, type);
			return true;
		}
		else if (!options.geometricGuideline){
			alignedLocations.v = null;
		}
		return false;
	}



	lines.drawDV = function(node, belowNode, aboveNode, type){
		var nodeDim = lines.getDims(node);
		var Xcenter = nodeDim["horizontal"]["center"];
		var side = "top", otherSide = "bottom";
		if (type == "above"){
			side = "bottom"; otherSide = "top";
		}

		var offset = calculateOffset([belowNode, node, aboveNode], "horizontal");
		lines.drawLine({
			x: offset,
			y: nodeDim["vertical"][side]
		}, {
			x: offset,
			y: lines.getDims(belowNode)["vertical"][otherSide]
		}, options.guidelinesStyle.verticalDistColor, options.guidelinesStyle.verticalDistLine);

		lines.drawLine({
			x: offset,
			y: lines.getDims(belowNode)["vertical"][side]
		}, {
			x: offset,
			y: lines.getDims(aboveNode)["vertical"][otherSide]
		}, options.guidelinesStyle.verticalDistColor, options.guidelinesStyle.verticalDistLine);

		lines.drawLine({
			x: Xcenter,
			y: nodeDim["vertical"][side]
		}, {
			x: offset,
			y: nodeDim["vertical"][side]
		}, options.guidelinesStyle.verticalDistColor, options.guidelinesStyle.verticalDistLine);

		lines.drawLine({
			x: lines.getDims(belowNode)["horizontal"]["center"],
			y: lines.getDims(belowNode)["vertical"][otherSide]
		}, {
			x: offset,
			y: lines.getDims(belowNode)["vertical"][otherSide]
		}, options.guidelinesStyle.verticalDistColor, options.guidelinesStyle.verticalDistLine);

		lines.drawLine({
			x: lines.getDims(belowNode)["horizontal"]["center"],
			y: lines.getDims(belowNode)["vertical"][side]
		}, {
			x: offset,
			y: lines.getDims(belowNode)["vertical"][side]
		}, options.guidelinesStyle.verticalDistColor, options.guidelinesStyle.verticalDistLine);

		lines.drawLine({
			x: offset,//lines.getDims(aboveNode)["horizontal"]["center"],
			y: lines.getDims(aboveNode)["vertical"][otherSide]
		}, {
			x: lines.getDims(aboveNode)["horizontal"]["center"],
			y: lines.getDims(aboveNode)["vertical"][otherSide]
		}, options.guidelinesStyle.verticalDistColor, options.guidelinesStyle.verticalDistLine);

		lines.drawArrow({
			x: offset,
			y: nodeDim["vertical"][side]}, otherSide);

		lines.drawArrow({
			x: offset,
			y: lines.getDims(belowNode)["vertical"][otherSide]}, side);

		lines.drawArrow({
			x: offset,
			y: lines.getDims(belowNode)["vertical"][side]}, otherSide);

		lines.drawArrow({
			x: offset,
			y: lines.getDims(aboveNode)["vertical"][otherSide]}, side);

	}
	lines.update = function (activeNodes) {
		lines.clear();

		if (options.initPosAlignment){
			mouseLine(activeNodes);
		}

		activeNodes.each(function (node, i) {
            if(typeof node === "number") {
              node = i;
            }
			if (options.geometricGuideline){
				lines.searchForLine("horizontal", node);
				lines.searchForLine("vertical", node);
			}

			if (options.distributionGuidelines){
				lines.horizontalDistribution(node);
				lines.verticalDistribution(node);
			}
		});

	};

	lines.resize = function () {
		resizeCanvas();
	};

	function getTopMostNodes(nodes) {
		var nodesMap = {};

		for (var i = 0; i < nodes.length; i++) {
			nodesMap[nodes[i].id()] = true;
		}

		var roots = nodes.filter(function (ele, i) {
            if(typeof ele === "number") {
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
	}

	var mouseInitPos = {};
	var mouseRelativePos = {};
	var getMousePos = function(e){
		mouseInitPos = e.renderedPosition || e.cyRenderedPosition;
		mouseRelativePos.x = mouseInitPos.x;
		mouseRelativePos.y = mouseInitPos.y;
	}
	var setMousePos = function(panCurrPos){
		mouseRelativePos.x += (panCurrPos.x - panInitPos.x);
		mouseRelativePos.y += (panCurrPos.y - panInitPos.y);
		panInitPos.x = panCurrPos.x; panInitPos.y = panCurrPos.y;
	};
	var mouseLine = function(node){
		var nodeCurrentPos = node.renderedPosition();	
		if (Math.abs(nodeInitPos.y - nodeCurrentPos.y) < options.guidelinesTolerance){
			lines.drawLine({
				"x" : mouseRelativePos.x,
				"y" : mouseInitPos.y
			}, {
				"x" : nodeCurrentPos.x,
				"y" : mouseInitPos.y
			}, options.guidelinesStyle.initPosAlignmentColor, options.guidelinesStyle.initPosAlignmentLine);
			if (mouseInitPos.y == mouseRelativePos.y){
				lines.drawCross(mouseRelativePos);
			}
			else{
				lines.drawCross(mouseInitPos);
			}
		}
		else if (Math.abs(nodeInitPos.x - nodeCurrentPos.x) < options.guidelinesTolerance){
			lines.drawLine({
				"x" : mouseInitPos.x,
				"y" : mouseRelativePos.y
			}, {
				"x" : mouseInitPos.x,
				"y" : nodeCurrentPos.y
			}, options.guidelinesStyle.initPosAlignmentColor, options.guidelinesStyle.initPosAlignmentLine);
			if (mouseInitPos.x == mouseRelativePos.x){
				lines.drawCross(mouseRelativePos);
			}
			else{
				lines.drawCross(mouseInitPos);
			}
		}
	}

	function moveNodes(positionDiff, nodes) {
		// Get the descendants of top most nodes. Note that node.position() can move just the simple nodes.
		var topMostNodes = getTopMostNodes(nodes);
		var nodesToMove = topMostNodes.union(topMostNodes.descendants());

		nodesToMove.forEach(function(node, i) {
			if(typeof node === "number") {
			  node = i;
			}
			var newPos = {x: positionDiff.x + node.renderedPosition("x"),
				y: positionDiff.y + node.renderedPosition("y")};

			node.renderedPosition(newPos);
		});
	}

	var tappedNode;
	cy.on("tapstart", "node", function(){tappedNode = this});

	var currMousePos, oldMousePos = {"x": 0, "y": 0};
	cy.on("mousemove", function(e){
		currMousePos = e.renderedPosition || e.cyRenderedPosition;
		if (nodeToAlign)
		nodeToAlign.each(function (node, i){
			if(typeof node === "number") {
			  node = i;
			}
		if (node.locked() && (Math.abs(currMousePos.x - oldMousePos.x) > 2*options.guidelinesTolerance
			|| Math.abs(currMousePos.y - oldMousePos.y) > 2*options.guidelinesTolerance)){

			node.unlock();
			var diff = {};
			diff.x = currMousePos.x - tappedNode.renderedPosition("x");
			diff.y = currMousePos.y - tappedNode.renderedPosition("y");;
			moveNodes(diff, node);
		};
    });

	});
	var nodeToAlign;
	lines.snapToAlignmentLocation = function(activeNodes){
		nodeToAlign = activeNodes;
		activeNodes.each(function (node, i){
			if(typeof node === "number") {
			  node = i;
			}
			var newPos = node.renderedPosition();
			if (alignedLocations.h){
				oldMousePos = currMousePos;
				newPos.x -= alignedLocations.h;
				node.renderedPosition(newPos);
			}
			if (alignedLocations.v){
				oldMousePos = currMousePos;
				newPos.y -= alignedLocations.v;
				node.renderedPosition(newPos);
			};
			if (alignedLocations.v || alignedLocations.h){
				alignedLocations.h = null;
				alignedLocations.v = null;
				nodeToAlign.lock();
			}
		});
		lines.update(activeNodes);
	}

	return {
		changeOptions: changeOptions,
		lines: lines,
		getTopMostNodes: getTopMostNodes,
		getMousePos: getMousePos,
		setMousePos: setMousePos,
		resizeCanvas: resizeCanvas,
	}
};

},{"functional-red-black-tree":1}],7:[function(require,module,exports){
;(function(){ 'use strict';

	// registers the extension on a cytoscape lib ref
	var register = function( cytoscape ){

		if( !cytoscape ){ return; } // can't register if cytoscape unspecified

		var options = {
			// On/Off Modules
			/* From the following four snap options, at most one should be true at a given time */
			snapToGridOnRelease: true, // Snap to grid on release
			snapToGridDuringDrag: false, // Snap to grid during drag
			snapToAlignmentLocationOnRelease: false, // Snap to alignment location on release
			snapToAlignmentLocationDuringDrag: false, // Snap to alignment location during drag
			distributionGuidelines: false, //Distribution guidelines
			geometricGuideline: false, // Geometric guidelines
			initPosAlignment: false, // Guideline to initial mouse position
			centerToEdgeAlignment: false, // Center tı edge alignment
			resize: false, // Adjust node sizes to cell sizes
			parentPadding: false, // Adjust parent sizes to cell sizes by padding
			drawGrid: true, // Draw grid background

			// General
			gridSpacing: 20, // Distance between the lines of the grid.
			zoomDash: true, // Determines whether the size of the dashes should change when the drawing is zoomed in and out if grid is drawn.
			panGrid: false, // Determines whether the grid should move then the user moves the graph if grid is drawn.
			gridStackOrder: -1, // Namely z-index
			gridColor: '#dedede', // Color of grid lines
			lineWidth: 1.0, // Width of grid lines
			guidelinesStackOrder: 4, // z-index of guidelines
			guidelinesTolerance: 2.00, // Tolerance distance for rendered positions of nodes' interaction.
			guidelinesStyle: { // Set ctx properties of line. Properties are here:
				strokeStyle: "#8b7d6b", // color of geometric guidelines
				geometricGuidelineRange: 400, // range of geometric guidelines
				range: 100, // max range of distribution guidelines
				minDistRange: 10, // min range for distribution guidelines
				distGuidelineOffset: 10, // shift amount of distribution guidelines
				horizontalDistColor: "#ff0000", // color of horizontal distribution alignment
				verticalDistColor: "#00ff00", // color of vertical distribution alignment
				initPosAlignmentColor: "#0000ff", // color of alignment to initial location
				lineDash: [0, 0], // line style of geometric guidelines
				horizontalDistLine: [0, 0], // line style of horizontal distribıtion guidelines
				verticalDistLine: [0, 0], // line style of vertical distribıtion guidelines
				initPosAlignmentLine: [0, 0], // line style of alignment to initial mouse position
			},

			// Parent Padding
			parentSpacing: -1 // -1 to set paddings of parents to gridSpacing
		};
		var _snapOnRelease = require("./snap_on_release");
		var _snapToGridDuringDrag = require("./snap_during_drag");
		var _drawGrid = require("./draw_grid");
		var _resize = require("./resize");
		var _eventsController = require("./events_controller");
		var _guidelines = require("./guidelines");
		var _parentPadding = require("./parentPadding");
		var _alignment = require("./alignment");
		var debounce = require("./debounce");
		var snap, resize, snapToGridDuringDrag, drawGrid, eventsController, guidelines, parentPadding, alignment;

		function getScratch(cy) {
			if (!cy.scratch("_gridGuide")) {
				cy.scratch("_gridGuide", { });
			}

			return cy.scratch("_gridGuide");
		}

		cytoscape( 'core', 'gridGuide', function(opts){
			var cy = this;
			$.extend(true, options, opts);

			if (!getScratch(cy).initialized) {
				snap = _snapOnRelease(cy, options.gridSpacing);
				resize = _resize(options.gridSpacing);
				snapToGridDuringDrag = _snapToGridDuringDrag(cy, snap);
				drawGrid = _drawGrid(options, cy, $, debounce);
				guidelines = _guidelines(options, cy, $, debounce);
				parentPadding = _parentPadding(options, cy);

				eventsController = _eventsController(cy, snap, resize, snapToGridDuringDrag, drawGrid, guidelines, parentPadding, $, options);

				alignment = _alignment(cytoscape, cy, $);

				eventsController.init(options);
				getScratch(cy).initialized = true;
			} else
				eventsController.syncWithOptions(options);

			return this; // chainability
		} ) ;

	};

	if( typeof module !== 'undefined' && module.exports ){ // expose as a commonjs module
		module.exports = register;
	}

	if( typeof define !== 'undefined' && define.amd ){ // expose as an amd/requirejs module
		define('cytoscape-grid-guide', function(){
			return register;
		});
	}

	if( typeof cytoscape !== 'undefined' ){ // expose to global cytoscape (i.e. window.cytoscape)
		register( cytoscape );
	}

})();

},{"./alignment":2,"./debounce":3,"./draw_grid":4,"./events_controller":5,"./guidelines":6,"./parentPadding":8,"./resize":9,"./snap_during_drag":10,"./snap_on_release":11}],8:[function(require,module,exports){
module.exports = function (opts, cy) {

    var options = opts;
    var ppClass = "_gridParentPadding";

    function initPadding() {
        var padding = options.parentSpacing < 0 ? options.gridSpacing : options.parentSpacing;
        cy.style()
            .selector('.' + ppClass)
            .style("compound-sizing-wrt-labels", "exclude")
            .style("padding-left", padding)
            .style("padding-right", padding)
            .style("padding-top", padding)
            .style("padding-bottom", padding)
            .update();

    }

    function changeOptions(opts) {
        options = opts;
        padding = options.parentSpacing < 0 ? options.gridSpacing : options.parentSpacing;
        initPadding();
    }

    function setPaddingOfParent(node, enable) {
        if (enable)
            node.addClass(ppClass);
        else
            node.removeClass(ppClass);
    }

    return {
        changeOptions: changeOptions,
        setPaddingOfParent: setPaddingOfParent
    };
};
},{}],9:[function(require,module,exports){
module.exports = function (gridSpacing) {


    var changeOptions = function (opts) {
        gridSpacing = Number(opts.gridSpacing);
    };

    var getScratch = function (node) {
        if (!node.scratch("_gridGuide"))
            node.scratch("_gridGuide", {});

        return node.scratch("_gridGuide");
    };

    function resizeNode(node) {
        var width = node.width();
        var height = node.height();

        var newWidth = Math.round((width - gridSpacing) / (gridSpacing * 2)) * (gridSpacing * 2);
        var newHeight = Math.round((height - gridSpacing) / (gridSpacing * 2)) * (gridSpacing * 2);
        newWidth = newWidth > 0 ? newWidth + gridSpacing : gridSpacing;
        newHeight = newHeight > 0 ? newHeight + gridSpacing : gridSpacing;

        if (width != newWidth || height != newHeight) {
            node.style({
                "width": newWidth,
                "height": newHeight
            });
            getScratch(node).resize = {
                oldWidth: width,
                oldHeight: height
            };
        }
    }

    function recoverNodeDimensions(node) {
        var oldSizes = getScratch(node).resize;
        if (oldSizes) 
            node.style({
                "width": oldSizes.oldWidth,
                "height": oldSizes.oldHeight
            });


    }


    return {
        resizeNode: resizeNode,
        recoverNodeDimensions: recoverNodeDimensions,
        changeOptions: changeOptions
    };

};
},{}],10:[function(require,module,exports){
module.exports = function (cy, snap) {

    var snapToGridDuringDrag = {};

    var attachedNode;
    var draggedNodes;

    var startPos;
    var endPos;


    snapToGridDuringDrag.onTapStartNode = function (e) {
        // If user intends to do box selection, then return. Related issue #28
        if (e.originalEvent.altKey || e.originalEvent.ctrlKey
                || e.originalEvent.metaKey || e.originalEvent.shiftKey){
            return;
        }

        var cyTarget = e.target || e.cyTarget;
        if (cyTarget.selected())
            draggedNodes = e.cy.$(":selected");
        else
            draggedNodes = cyTarget;

        startPos = e.position || e.cyPosition;

        if (cyTarget.grabbable() && !cyTarget.locked()){
          attachedNode = cyTarget;
          attachedNode.lock();
          //attachedNode.trigger("grab");
          cy.on("tapdrag", onTapDrag);
          cy.on("tapend", onTapEndNode);
        }
    };

    var onTapEndNode = function (e) {
        //attachedNode.trigger("free");
        cy.off("tapdrag", onTapDrag);
        cy.off("tapend", onTapEndNode);
        attachedNode.unlock();
        e.preventDefault();
    };

    var getDist = function () {
        return {
            x: endPos.x - startPos.x,
            y: endPos.y - startPos.y
        }
    };

    function getTopMostNodes(nodes) {
        var nodesMap = {};

        for (var i = 0; i < nodes.length; i++) {
            nodesMap[nodes[i].id()] = true;
        }

        var roots = nodes.filter(function (ele, i) {
            if(typeof ele === "number") {
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
    }

    var moveNodesTopDown = function (nodes, dx, dy) {

/*
        console.log(nodes.map(function (e) {
            return e.id();
        }));
        for (var i = 0; i < nodes.length; i++) {
            var node = nodes[i];
            var pos = node.position();

            if (!node.isParent()) {
                node.position({
                    x: pos.x + dx,
                    y: pos.y + dy
                });
                console.log(node.id() + " " + dx + " " + dy);
            }

            moveNodesTopDown(nodes.children(), dx, dy);
        }
*/
    };

    var onTapDrag = function (e) {

        var nodePos = attachedNode.position();
        endPos = e.position || e.cyPosition;
        endPos = snap.snapPos(endPos);
        var dist = getDist();
        if (dist.x != 0 || dist.y != 0) {
            attachedNode.unlock();
            //var topMostNodes = getTopMostNodes(draggedNodes);
            var nodes = draggedNodes.union(draggedNodes.descendants());

            nodes.positions(function (node, i) {
                if(typeof node === "number") {
                  node = i;
                }
                var pos = node.position();
                return snap.snapPos({
                    x: pos.x + dist.x,
                    y: pos.y + dist.y
                });
            });

            startPos = endPos;
            attachedNode.lock();
            attachedNode.trigger("drag");
        }

    };

    return snapToGridDuringDrag;


};

},{}],11:[function(require,module,exports){
module.exports = function (cy, gridSpacing) {

    var snap = { };

    snap.changeOptions = function (opts) {
        gridSpacing = opts.gridSpacing;
    };

    var getScratch = function (node) {
        if (!node.scratch("_gridGuide"))
            node.scratch("_gridGuide", {});

        return node.scratch("_gridGuide");
    };


    function getTopMostNodes(nodes) {
        var nodesMap = {};

        for (var i = 0; i < nodes.length; i++) {
            nodesMap[nodes[i].id()] = true;
        }

        var roots = nodes.filter(function (ele, i) {
            if(typeof ele === "number") {
              ele = i;
            }
                
            var parent = ele.parent()[0];
            while(parent != null){
                if(nodesMap[parent.id()]){
                    return false;
                }
                parent = parent.parent()[0];
            }
            return true;
        });

        return roots;
    }

    snap.snapPos = function (pos) {
        var newPos = {
            x: (Math.floor(pos.x / gridSpacing) + 0.5) * gridSpacing,
            y: (Math.floor(pos.y / gridSpacing) + 0.5) * gridSpacing
        };

        return newPos;
    };

    snap.snapNode = function (node) {

        var pos = node.position();
        var newPos = snap.snapPos(pos);

        node.position(newPos);
    };

    function snapTopDown(nodes) {

        nodes.union(nodes.descendants()).positions(function (node, i) {
            if(typeof node === "number") {
              node = i;
            }
            var pos = node.position();
            return snap.snapPos(pos);
        });
        /*
        for (var i = 0; i < nodes.length; i++) {

            if (!nodes[i].isParent())
                snap.snapNode(nodes[i]);

            snapTopDown(nodes.children());
        }*/

    }

    snap.snapNodesTopDown = function (nodes) {
        // getTOpMostNodes -> nodes
        cy.startBatch();
        nodes.union(nodes.descendants()).positions(function (node, i) {
            if(typeof node === "number") {
              node = i;
            }
            var pos = node.position();
            return snap.snapPos(pos);
        });
        cy.endBatch();
    };

    snap.onFreeNode = function (e) {
        var nodes;
        var cyTarget = e.target || e.cyTarget;
        if (cyTarget.selected())
            nodes = e.cy.$(":selected");
        else
            nodes = cyTarget;

        snap.snapNodesTopDown(nodes);

    };


    snap.recoverSnapNode = function (node) {
        var snapScratch = getScratch(node).snap;
        if (snapScratch) {
            node.position(snapScratch.oldPos);
        }
    };

    return snap;





};

},{}]},{},[7]);
