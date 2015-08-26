(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('d3')) :
  typeof define === 'function' && define.amd ? define(['exports', 'd3'], factory) :
  factory((global.compass = {}),d3);
}(this, function (exports,d3) { 'use strict';

  var math = Math;
  var abs = math.abs;
  var cos = math.cos;
  var sin = math.sin;
  var sqrt = math.sqrt;
  var mmin = math.min;
  var mmax = math.max;

  var atan2 = math.atan2;

  var round = math.round;
  var floor = math.floor;
  var PI = math.PI;
  var random = math.random;

  function toRad(deg, over360) {
  	over360 = over360 || false;
  	deg = over360 ? deg : (deg % 360);
  	return deg * PI / 180;
  }

  function snapToGrid(val, gridSize) { return gridSize * Math.round(val / gridSize); }

  function toDeg(rad) { return (180 * rad / PI) % 360; }

  function normalizeAngle(angle) { return (angle % 360) + (angle < 0 ? 360 : 0); }

  function point(x, y) {
  	if (!(this instanceof point))
  		return new point(x, y);
  	var xy;
  	if (y === undefined && Object(x) !== x) {
  		xy = x.split(x.indexOf('@') === -1 ? ' ' : '@');
  		this.x = parseInt(xy[0], 10);
  		this.y = parseInt(xy[1], 10);
  	} else if (Object(x) === x) {
  		this.x = x.x;
  		this.y = x.y;
  	} else {
  		this.x = x;
  		this.y = y;
  	}
  }

  point.prototype = {
  	toString: function() {
  		return this.x + '@' + this.y;
  	},
  	// If point lies outside rectangle `r`, return the nearest point on the boundary of rect `r`,
  	// otherwise return point itself.
  	// (see Squeak Smalltalk, Point>>adhereTo:)
  	adhereToRect: function(r) {
  		if (r.containsPoint(this)) {
  			return this;
  		}
  		this.x = mmin(mmax(this.x, r.x), r.x + r.width);
  		this.y = mmin(mmax(this.y, r.y), r.y + r.height);
  		return this;
  	},
  	// Compute the angle between me and `p` and the x axis.
  	// (cartesian-to-polar coordinates conversion)
  	// Return theta angle in degrees.
  	theta: function(p) {
  		p = point(p);
  		// Invert the y-axis.
  		var y = -(p.y - this.y);
  		var x = p.x - this.x;
  		// Makes sure that the comparison with zero takes rounding errors into account.
  		var PRECISION = 10;
  		// Note that `atan2` is not defined for `x`, `y` both equal zero.
  		var rad = (y.toFixed(PRECISION) == 0 && x.toFixed(PRECISION) == 0) ? 0 : atan2(y, x);

  		// Correction for III. and IV. quadrant.
  		if (rad < 0) {
  			rad = 2 * PI + rad;
  		}
  		return 180 * rad / PI;
  	},
  	// Returns distance between me and point `p`.
  	distance: function(p) {
  		return line(this, p).length();
  	},
  	// Returns a manhattan (taxi-cab) distance between me and point `p`.
  	manhattanDistance: function(p) {
  		return abs(p.x - this.x) + abs(p.y - this.y);
  	},
  	// Offset me by the specified amount.
  	offset: function(dx, dy) {
  		this.x += dx || 0;
  		this.y += dy || 0;
  		return this;
  	},
  	magnitude: function() {
  		return sqrt((this.x * this.x) + (this.y * this.y)) || 0.01;
  	},
  	update: function(x, y) {
  		this.x = x || 0;
  		this.y = y || 0;
  		return this;
  	},
  	round: function(decimals) {
  		this.x = decimals ? this.x.toFixed(decimals) : round(this.x);
  		this.y = decimals ? this.y.toFixed(decimals) : round(this.y);
  		return this;
  	},
  	// Scale the line segment between (0,0) and me to have a length of len.
  	normalize: function(len) {
  		var s = (len || 1) / this.magnitude();
  		this.x = s * this.x;
  		this.y = s * this.y;
  		return this;
  	},
  	difference: function(p) {
  		return point(this.x - p.x, this.y - p.y);
  	},
  	// Return the bearing between me and point `p`.
  	bearing: function(p) {
  		return line(this, p).bearing();
  	},
  	// Converts rectangular to polar coordinates.
  	// An origin can be specified, otherwise it's 0@0.
  	toPolar: function(o) {
  		o = (o && point(o)) || point(0, 0);
  		var x = this.x;
  		var y = this.y;
  		this.x = sqrt((x - o.x) * (x - o.x) + (y - o.y) * (y - o.y)); // r
  		this.y = toRad(o.theta(point(x, y)));
  		return this;
  	},
  	// Rotate point by angle around origin o.
  	rotate: function(o, angle) {
  		angle = (angle + 360) % 360;
  		this.toPolar(o);
  		this.y += toRad(angle);
  		var p = point.fromPolar(this.x, this.y, o);
  		this.x = p.x;
  		this.y = p.y;
  		return this;
  	},
  	// Move point on line starting from ref ending at me by
  	// distance distance.
  	move: function(ref, distance) {
  		var theta = toRad(point(ref).theta(this));
  		return this.offset(cos(theta) * distance, -sin(theta) * distance);
  	},
  	// Returns change in angle from my previous position (-dx, -dy) to my new position
  	// relative to ref point.
  	changeInAngle: function(dx, dy, ref) {
  		// Revert the translation and measure the change in angle around x-axis.
  		return point(this).offset(-dx, -dy).theta(ref) - this.theta(ref);
  	},
  	equals: function(p) {
  		return this.x === p.x && this.y === p.y;
  	},
  	snapToGrid: function(gx, gy) {
  		this.x = snapToGrid(this.x, gx);
  		this.y = snapToGrid(this.y, gy || gx);
  		return this;
  	},
  	// Returns a point that is the reflection of me with
  	// the center of inversion in ref point.
  	reflection: function(ref) {
  		return point(ref).move(this, this.distance(ref));
  	}
  };

  // Alternative constructor, from polar coordinates.
  // @param {number} r Distance.
  // @param {number} angle Angle in radians.
  // @param {point} [optional] o Origin.
  point.fromPolar = function(r, angle, o) {
  	o = (o && point(o)) || point(0, 0);
  	var x = abs(r * cos(angle));
  	var y = abs(r * sin(angle));
  	var deg = normalizeAngle(toDeg(angle));

  	if (deg < 90) {
  		y = -y;
  	} else if (deg < 180) {
  		x = -x;
  		y = -y;
  	} else if (deg < 270) {
  		x = -x;
  	}

  	return point(o.x + x, o.y + y);
  };

  // Create a point with random coordinates that fall into the range `[x1, x2]` and `[y1, y2]`.
  point.random = function(x1, x2, y1, y2) {
  	return point(floor(random() * (x2 - x1 + 1) + x1), floor(random() * (y2 - y1 + 1) + y1));
  };


  // Line.
  // -----
  function line(p1, p2) {
  	if (!(this instanceof line))
  		return new line(p1, p2);
  	this.start = point(p1);
  	this.end = point(p2);
  }

  line.prototype = {
  	toString: function() {
  		return this.start.toString() + ' ' + this.end.toString();
  	},
  	// @return {double} length of the line
  	length: function() {
  		return sqrt(this.squaredLength());
  	},
  	// @return {integer} length without sqrt
  	// @note for applications where the exact length is not necessary (e.g. compare only)
  	squaredLength: function() {
  		var x0 = this.start.x;
  		var y0 = this.start.y;
  		var x1 = this.end.x;
  		var y1 = this.end.y;
  		return (x0 -= x1) * x0 + (y0 -= y1) * y0;
  	},
  	// @return {point} my midpoint
  	midpoint: function() {
  		return point((this.start.x + this.end.x) / 2,
  					 (this.start.y + this.end.y) / 2);
  	},
  	// @return {point} Point where I'm intersecting l.
  	// @see Squeak Smalltalk, LineSegment>>intersectionWith:
  	intersection: function(l) {
  		var pt1Dir = point(this.end.x - this.start.x, this.end.y - this.start.y);
  		var pt2Dir = point(l.end.x - l.start.x, l.end.y - l.start.y);
  		var det = (pt1Dir.x * pt2Dir.y) - (pt1Dir.y * pt2Dir.x);
  		var deltaPt = point(l.start.x - this.start.x, l.start.y - this.start.y);
  		var alpha = (deltaPt.x * pt2Dir.y) - (deltaPt.y * pt2Dir.x);
  		var beta = (deltaPt.x * pt1Dir.y) - (deltaPt.y * pt1Dir.x);

  		if (det === 0 ||
  			alpha * det < 0 ||
  			beta * det < 0) {
  			// No intersection found.
  			return null;
  		}
  		if (det > 0) {
  			if (alpha > det || beta > det) {
  				return null;
  			}
  		} else {
  			if (alpha < det || beta < det) {
  				return null;
  			}
  		}
  		return point(this.start.x + (alpha * pt1Dir.x / det),
  					 this.start.y + (alpha * pt1Dir.y / det));
  	},

  	// @return the bearing (cardinal direction) of the line. For example N, W, or SE.
  	// @returns {String} One of the following bearings : NE, E, SE, S, SW, W, NW, N.
  	bearing: function() {

  		var lat1 = toRad(this.start.y);
  		var lat2 = toRad(this.end.y);
  		var lon1 = this.start.x;
  		var lon2 = this.end.x;
  		var dLon = toRad(lon2 - lon1);
  		var y = sin(dLon) * cos(lat2);
  		var x = cos(lat1) * sin(lat2) - sin(lat1) * cos(lat2) * cos(dLon);
  		var brng = toDeg(atan2(y, x));

  		var bearings = ['NE', 'E', 'SE', 'S', 'SW', 'W', 'NW', 'N'];

  		var index = brng - 22.5;
  		if (index < 0)
  			index += 360;
  		index = parseInt(index / 45);

  		return bearings[index];
  	},

  	// @return {point} my point at 't' <0,1>
  	pointAt: function(t) {
  		var x = (1 - t) * this.start.x + t * this.end.x;
  		var y = (1 - t) * this.start.y + t * this.end.y;
  		return point(x, y);
  	},

  	// @return {number} the offset of the point `p` from the line. + if the point `p` is on the right side of the line, - if on the left and 0 if on the line.
  	pointOffset: function(p) {
  		// Find the sign of the determinant of vectors (start,end), where p is the query point.
  		return ((this.end.x - this.start.x) * (p.y - this.start.y) - (this.end.y - this.start.y) * (p.x - this.start.x)) / 2;
  	}
  };

  function rect(x, y, w, h) {
  	if (!(this instanceof rect))
  		return new rect(x, y, w, h);
  	if (y === undefined) {
  		y = x.y;
  		w = x.width;
  		h = x.height;
  		x = x.x;
  	}
  	this.x = x;
  	this.y = y;
  	this.width = w;
  	this.height = h;
  }

  rect.prototype = {
  	toString: function() {
  		return this.origin().toString() + ' ' + this.corner().toString();
  	},
  	origin: function() {
  		return point(this.x, this.y);
  	},
  	corner: function() {
  		return point(this.x + this.width, this.y + this.height);
  	},
  	topRight: function() {
  		return point(this.x + this.width, this.y);
  	},
  	bottomLeft: function() {
  		return point(this.x, this.y + this.height);
  	},
  	center: function() {
  		return point(this.x + this.width / 2, this.y + this.height / 2);
  	},
  	// @return {boolean} true if rectangles intersect
  	intersect: function(r) {
  		var myOrigin = this.origin();
  		var myCorner = this.corner();
  		var rOrigin = r.origin();
  		var rCorner = r.corner();

  		if (rCorner.x <= myOrigin.x ||
  			rCorner.y <= myOrigin.y ||
  			rOrigin.x >= myCorner.x ||
  			rOrigin.y >= myCorner.y) return false;
  		return true;
  	},
  	// @return {string} (left|right|top|bottom) side which is nearest to point
  	// @see Squeak Smalltalk, Rectangle>>sideNearestTo:
  	sideNearestToPoint: function(p) {
  		p = point(p);
  		var distToLeft = p.x - this.x;
  		var distToRight = (this.x + this.width) - p.x;
  		var distToTop = p.y - this.y;
  		var distToBottom = (this.y + this.height) - p.y;
  		var closest = distToLeft;
  		var side = 'left';

  		if (distToRight < closest) {
  			closest = distToRight;
  			side = 'right';
  		}
  		if (distToTop < closest) {
  			closest = distToTop;
  			side = 'top';
  		}
  		if (distToBottom < closest) {
  			closest = distToBottom;
  			side = 'bottom';
  		}
  		return side;
  	},
  	// @return {bool} true if point p is insight me
  	containsPoint: function(p) {
  		p = point(p);
  		if (p.x >= this.x && p.x <= this.x + this.width &&
  			p.y >= this.y && p.y <= this.y + this.height) {
  			return true;
  		}
  		return false;
  	},
  	// Algorithm ported from java.awt.Rectangle from OpenJDK.
  	// @return {bool} true if rectangle `r` is inside me.
  	containsRect: function(r) {
  		var nr = rect(r).normalize();
  		var W = nr.width;
  		var H = nr.height;
  		var X = nr.x;
  		var Y = nr.y;
  		var w = this.width;
  		var h = this.height;
  		if ((w | h | W | H) < 0) {
  			// At least one of the dimensions is negative...
  			return false;
  		}
  		// Note: if any dimension is zero, tests below must return false...
  		var x = this.x;
  		var y = this.y;
  		if (X < x || Y < y) {
  			return false;
  		}
  		w += x;
  		W += X;
  		if (W <= X) {
  			// X+W overflowed or W was zero, return false if...
  			// either original w or W was zero or
  			// x+w did not overflow or
  			// the overflowed x+w is smaller than the overflowed X+W
  			if (w >= x || W > w) return false;
  		} else {
  			// X+W did not overflow and W was not zero, return false if...
  			// original w was zero or
  			// x+w did not overflow and x+w is smaller than X+W
  			if (w >= x && W > w) return false;
  		}
  		h += y;
  		H += Y;
  		if (H <= Y) {
  			if (h >= y || H > h) return false;
  		} else {
  			if (h >= y && H > h) return false;
  		}
  		return true;
  	},
  	// @return {point} a point on my boundary nearest to p
  	// @see Squeak Smalltalk, Rectangle>>pointNearestTo:
  	pointNearestToPoint: function(p) {
  		p = point(p);
  		if (this.containsPoint(p)) {
  			var side = this.sideNearestToPoint(p);
  			switch (side){
  				case 'right': return point(this.x + this.width, p.y);
  				case 'left': return point(this.x, p.y);
  				case 'bottom': return point(p.x, this.y + this.height);
  				case 'top': return point(p.x, this.y);
  			}
  		}
  		return p.adhereToRect(this);
  	},
  	// Find point on my boundary where line starting
  	// from my center ending in point p intersects me.
  	// @param {number} angle If angle is specified, intersection with rotated rectangle is computed.
  	intersectionWithLineFromCenterToPoint: function(p, angle) {
  		p = point(p);
  		var center = point(this.x + this.width / 2, this.y + this.height / 2);
  		var result;
  		if (angle) p.rotate(center, angle);

  		// (clockwise, starting from the top side)
  		var sides = [
  			line(this.origin(), this.topRight()),
  			line(this.topRight(), this.corner()),
  			line(this.corner(), this.bottomLeft()),
  			line(this.bottomLeft(), this.origin())
  		];
  		var connector = line(center, p);

  		for (var i = sides.length - 1; i >= 0; --i) {
  			var intersection = sides[i].intersection(connector);
  			if (intersection !== null) {
  				result = intersection;
  				break;
  			}
  		}
  		if (result && angle) result.rotate(center, -angle);
  		return result;
  	},
  	// Move and expand me.
  	// @param r {rectangle} representing deltas
  	moveAndExpand: function(r) {
  		this.x += r.x || 0;
  		this.y += r.y || 0;
  		this.width += r.width || 0;
  		this.height += r.height || 0;
  		return this;
  	},
  	round: function(decimals) {
  		this.x = decimals ? this.x.toFixed(decimals) : round(this.x);
  		this.y = decimals ? this.y.toFixed(decimals) : round(this.y);
  		this.width = decimals ? this.width.toFixed(decimals) : round(this.width);
  		this.height = decimals ? this.height.toFixed(decimals) : round(this.height);
  		return this;
  	},
  	// Normalize the rectangle; i.e., make it so that it has a non-negative width and height.
  	// If width < 0 the function swaps the left and right corners,
  	// and it swaps the top and bottom corners if height < 0
  	// like in http://qt-project.org/doc/qt-4.8/qrectf.html#normalized
  	normalize: function() {
  		var newx = this.x;
  		var newy = this.y;
  		var newwidth = this.width;
  		var newheight = this.height;
  		if (this.width < 0) {
  			newx = this.x + this.width;
  			newwidth = -this.width;
  		}
  		if (this.height < 0) {
  			newy = this.y + this.height;
  			newheight = -this.height;
  		}
  		this.x = newx;
  		this.y = newy;
  		this.width = newwidth;
  		this.height = newheight;
  		return this;
  	},
  	// Find my bounding box when I'm rotated with the center of rotation in the center of me.
  	// @return r {rectangle} representing a bounding box
  	bbox: function(angle) {
  		var theta = toRad(angle || 0);
  		var st = abs(sin(theta));
  		var ct = abs(cos(theta));
  		var w = this.width * ct + this.height * st;
  		var h = this.width * st + this.height * ct;
  		return rect(this.x + (this.width - w) / 2, this.y + (this.height - h) / 2, w, h);
  	}
  };

  function TiledSurface(parent, pattern) {
    var width = parent.clientWidth,
        height = parent.clientHeight,
        surface = d3.select(parent).append("rect");

    surface
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", width)
      .attr("height", height)
      .style("fill", "url(#" + pattern.id + ")");

    return surface;
  }

  function TilingPattern(id, parent, width, height) {
    var defs = d3.select(parent).append("defs"),
        pattern = defs.append("pattern")
                      .attr("id", id)
                      .attr("patternUnits", "userSpaceOnUse")
                      .attr("width", width)
                      .attr("height", height);

    var centerX = width / 2,
        centerY = height / 2;

    var contents = pattern.append("g")
        .attr("transform", "translate(" + centerX + "," + centerY + ")");

    var rotatableContents = contents.append("g")
        .attr("transform", "rotate(0)");

    var zoomableContents = rotatableContents.append("g")
        .attr("transform", "scale(1)");

    var canvas = zoomableContents.append("g")
        .attr("transform", "translate(" + -width/2 + "," + -height/2 + ")");

    return {
      id: id,

      width: width,
      height: height,

      contents: contents,
      rotatableContents: rotatableContents,
      zoomableContents: zoomableContents,

      createLayer: function(layerClass, scale, rotation, dx, dy) {
        var layer = canvas.append("g").attr("class", layerClass),
            transform = d3.transform(),
            scaleFactor = scale || 1,
            rotateBy = rotation || 0,
            translateX = dx || 0,
            translateY = dy || 0;

        transform.scale = [scaleFactor, scaleFactor];
        transform.rotate = rotateBy;
        transform.translate = [translateX, translateY];

        layer.attr("transform", transform.toString());

        return layer;
      }
    }
  }

  exports.τ = 2 * Math.PI; // http://tauday.com/tau-manifesto
  exports.φ = (Math.sqrt(5) - 1) / 2;
  exports.Φ = 1 + exports.φ;

  function AnimationSequence(defaultStepDuration) {

    const ORIGIN = { x: 0, y: 0 };

    var steps = [],
        current = 0;

    var api = {
      addStep: function (type, options, duration) {
        steps.push({
          name: type,
          options: options,
          duration: duration || defaultStepDuration || 0
        })

        return api;
      },

      play: function () {
        var step = steps[current],
            command = commands[step.name],
            duration = step.duration,
            options = step.options || { target: d3.select(window) },
            target = options.target || options.onto;

        var afterStep = function(){
          if (++current < steps.length) {
            api.play();
          } else {
            console.log("all done")
          }
        }

        if (duration) {
          target.call(command, duration, options, afterStep);
        } else {
          target.call(command, 0, options);
          afterStep();
        }

        return api;
      }
    }

    var commands = {
      "draw circle": function (target, duration, options, onComplete) {
        var clockwise = (options.dir === "cw");

        options.from = clockwise ? 0 : exports.τ;
        options.to = clockwise ? exports.τ : 0;

        commands["draw arc"](target, duration, options, onComplete);
      },

      "draw arc": function (target, duration, options, onComplete) {
        var locus = options.at || ORIGIN,
            radius = options.r || 1,
            rotateBy = options.rotation || 0,
            opacity = options.opacity || 1,
            style = options.style || "line-c";

        var startAngle = options.from,
            endAngle = options.to;

        var location = "translate(" + locus.x + "," + locus.y + ")",
            rotation = "rotate(" + rotateBy + ")";

        var path = d3.svg.arc()
            .innerRadius(radius)
            .outerRadius(radius)
            .startAngle(startAngle);

        var arc = target.append("g").attr("transform", [location,rotation].join(" "));

        var line = arc.append("path")
            .datum({endAngle: startAngle})
            .attr("class", style)
            .attr("d", path)
            .style("opacity", opacity);

        line
          .transition()
          .duration(duration)
          .ease(options.ease || "cubic-in-out")
          .call(arcTween, path, endAngle)
          .each("end", onComplete);
      },

      "draw line": function (target, duration, options, onComplete) {
        var line = target.append("line");

        var a = options.from || ORIGIN,
            b = options.to || ORIGIN,
            style = options.style || "line-a";

        line
          .attr("class", style)
          .attr("x1", a.x)
          .attr("x2", a.x)
          .attr("y1", a.y)
          .attr("y2", a.y)

        if (duration && onComplete) {
          line
            .transition()
            .duration(duration)
            .attr("x2", b.x)
            .attr("y2", b.y)
            .each("end", onComplete);
        } else {
          line
            .attr("x2", b.x)
            .attr("y2", b.y)
        }

      },

      "draw point": function (target, duration, options, onComplete) {
        var locus = options.at || ORIGIN,
            radius = options.r || 3,
            style = options.style || "whole";

        var center = "translate(" + locus.x + "," + locus.y + ")";

        var point = target.append("g").attr("transform", center),
            circle = point.append("circle");

        point
          .attr("class", "point")
          .classed(style, true);

        circle
          .attr("r", 1e-8)
          .transition()
          .duration(duration)
          .attr("r", radius)
          .each("end", onComplete);
      },

      "rotate": function (target, duration, options, onComplete) {
        var targetAngle = options.by,
            transformation = "rotate(" + targetAngle + ")";

        target
          .transition()
          .duration(duration)
          .attr('transform', transformation)
          .each("end", onComplete);
      },

      "zoom": function (target, duration, options, onComplete) {
        var targetScale = options.times,
            transformation = "scale(" + targetScale + ")",
            easing = options.ease || "linear";

        target
          .transition()
          .duration(duration)
          .ease(easing)
          .attr('transform', transformation)
          .each("end", onComplete);
      },

      "fade": function (target, duration, options, onComplete) {
        target
          .transition()
          .duration(duration)
          .style('opacity', 1e-8)
          .each("end", onComplete);
      },

      "pause": function (target, duration, options, onComplete) {
        var doc = d3.select(window),
            resume = function() {
              console.log("resume!")
              doc.on(".continue", null);
              doc.on("message", null);
              onComplete();
            };

        doc.on("click.continue", resume);
        doc.on("message", resume);
      }

    }

    // See http://bl.ocks.org/mbostock/5100636
    function arcTween(transition, arc, newAngle) {

      transition.attrTween("d", function(d) {

        var interpolate = d3.interpolate(d.endAngle, newAngle);

        return function(t) {

          d.endAngle = interpolate(t);

          return arc(d);
        };

      });
    }

    return api;
  }

  function AnimationCanvas(container, aspectRatio, marginPct) {

    var containerWidth = container.clientWidth,
        containerHeight = container.clientHeight;

    var unit = Math.min(
          containerWidth / aspectRatio.w,
          containerHeight / aspectRatio.h
        );

    var width = unit * aspectRatio.w,
        height = unit * aspectRatio.h;

    var svg = d3.select(container)
        .append("svg")
        .attr("width", containerWidth)
        .attr("height", containerHeight);

    var centerX = containerWidth / 2,
        centerY = containerHeight / 2;

    var contents = svg.append("g")
        .attr("transform", "translate(" + centerX + "," + centerY + ")");

    var rotatableContents = contents.append("g")
        .attr("transform", "rotate(0)");

    var zoomableContents = rotatableContents.append("g")
        .attr("transform", "scale(" + (1 - marginPct) + ")");

    var canvas = zoomableContents.append("g")
        .attr("transform", "translate(" + -width/2 + "," + -height/2 + ")");

    return {
      width: width,
      height: height,

      origin: {
        x: centerX,
        y: centerY,
      },

      contents: contents,
      rotatableContents: rotatableContents,
      zoomableContents: zoomableContents,

      createLayer: function(layerClass, scale, rotation, dx, dy) {
        var layer = canvas.append("g").attr("class", layerClass),
            transform = d3.transform(),
            scaleFactor = scale || 1,
            rotateBy = rotation || 0,
            translateX = dx || 0,
            translateY = dy || 0;

        transform.scale = [scaleFactor, scaleFactor];
        transform.rotate = rotateBy;
        transform.translate = [translateX, translateY];

        layer.attr("transform", transform.toString());

        return layer;
      }
    }
  }

  exports.AnimationCanvas = AnimationCanvas;
  exports.AnimationSequence = AnimationSequence;
  exports.TilingPattern = TilingPattern;
  exports.TiledSurface = TiledSurface;
  exports.line = line;
  exports.point = point;
  exports.toDeg = toDeg;
  exports.toRad = toRad;
  exports.rect = rect;

}));