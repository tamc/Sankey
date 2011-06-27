(function() {
  var EnergyLine, Sankey, TransformationBox;
  var __hasProp = Object.prototype.hasOwnProperty, __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
  Sankey = (function() {
    function Sankey() {
      this.display_in_element = 'sankey';
      this.display_width = $('#sankey').width();
      this.display_height = $('#sankey').height();
      this.left_margin = 100;
      this.right_margin = 100;
      this.TWh = (this.display_width / 1000) * 0.1;
      this.x_step = (this.display_width - this.left_margin - this.right_margin) / 8;
      this.y_space = 100 * this.TWh;
      this.threshold_for_drawing = 0;
      this.box_width = 50;
      this.flow_edge_width = 2;
      this.flow_curve = 0.25;
      this.boxes = {};
      this.lines = {};
    }
    Sankey.prototype.find_or_create_trasformation_box = function(name) {
      if (this.boxes[name] == null) {
        this.boxes[name] = new TransformationBox(sankey, name);
      }
      return this.boxes[name];
    };
    Sankey.prototype.setData = function(data) {
      var datum, _i, _len, _results;
      _results = [];
      for (_i = 0, _len = data.length; _i < _len; _i++) {
        datum = data[_i];
        _results.push(datum[0] !== 0 ? this.lines[datum[0] + "-" + datum[2]] = new EnergyLine(sankey, datum[0], datum[1], datum[2]) : void 0);
      }
      return _results;
    };
    Sankey.prototype.stack = function(x, box_names, y) {
      var box, name, _i, _len;
      if (y == null) {
        y = 10;
      }
      for (_i = 0, _len = box_names.length; _i < _len; _i++) {
        name = box_names[_i];
        box = this.boxes[name];
        if (box == null) {
          alert("Can't find transformation called " + name);
        } else {
          box.y = y;
          box.x = this.left_margin + (x * this.x_step);
          y = box.b() + this.y_space;
        }
      }
      return y;
    };
    Sankey.prototype.setColors = function(colors) {
      var box, name, _ref, _results;
      _ref = this.boxes;
      _results = [];
      for (name in _ref) {
        if (!__hasProp.call(_ref, name)) continue;
        box = _ref[name];
        box.line_colour = colors[name];
        _results.push(box.position_and_colour_lines());
      }
      return _results;
    };
    Sankey.prototype.recolour = function(lines, new_colour) {
      var line, _i, _len, _results;
      _results = [];
      for (_i = 0, _len = lines.length; _i < _len; _i++) {
        line = lines[_i];
        _results.push(line.colour = new_colour);
      }
      return _results;
    };
    Sankey.prototype.draw = function() {
      var box, line, name, r, sorted_lines, _i, _len, _ref, _ref2, _results;
      r = Raphael(this.display_in_element, this.display_width, this.display_height);
      sorted_lines = [];
      _ref = this.lines;
      for (name in _ref) {
        if (!__hasProp.call(_ref, name)) continue;
        line = _ref[name];
        sorted_lines.push(line);
        void 0;
      }
      sorted_lines.sort(function(a, b) {
        return b.size - a.size;
      });
      for (_i = 0, _len = sorted_lines.length; _i < _len; _i++) {
        line = sorted_lines[_i];
        if (line.size > this.threshold_for_drawing) {
          line.draw(r);
        }
      }
      _ref2 = this.boxes;
      _results = [];
      for (name in _ref2) {
        if (!__hasProp.call(_ref2, name)) continue;
        box = _ref2[name];
        _results.push(box.size() > this.threshold_for_drawing ? box.draw(r) : void 0);
      }
      return _results;
    };
    return Sankey;
  })();
  EnergyLine = (function() {
    function EnergyLine(sankey, left_box_name, energy, right_box_name) {
      this.sankey = sankey;
      this.energy = energy;
      this.hover_stop = __bind(this.hover_stop, this);
      this.hover_start = __bind(this.hover_start, this);
      this.size = energy * this.sankey.TWh;
      this.colour = void 0;
      this.ox = 0;
      this.oy = 0;
      this.dx = 0;
      this.dy = 0;
      this.left_box = this.sankey.find_or_create_trasformation_box(left_box_name);
      this.right_box = this.sankey.find_or_create_trasformation_box(right_box_name);
      this.left_box.right_lines.push(this);
      this.right_box.left_lines.push(this);
    }
    EnergyLine.prototype.draw = function(r) {
      var curve, flow_edge_width, flow_path, inner_colour, inner_width;
      curve = (this.dx - this.ox) * this.sankey.flow_curve;
      flow_edge_width = this.sankey.flow_edge_width;
      inner_colour = Raphael.rgb2hsb(this.colour);
      inner_colour.b = inner_colour.b + 0.5;
      this.left_label = r.text(this.ox + 1, this.oy - (this.size / 2) - 5, Math.round(this.energy)).attr({
        'text-anchor': 'start'
      });
      this.right_label = r.text(this.dx - 1, this.dy - (this.size / 2) - 5, Math.round(this.energy)).attr({
        'text-anchor': 'end'
      });
      this.left_label.hide();
      this.right_label.hide();
      flow_path = "M " + this.ox + "," + this.oy + " Q " + (this.ox + curve) + "," + this.oy + " " + ((this.ox + this.dx) / 2) + "," + ((this.oy + this.dy) / 2) + " Q " + (this.dx - curve) + "," + this.dy + " " + this.dx + "," + this.dy;
      this.outer_line = r.path(flow_path).attr({
        'stroke': this.colour,
        'stroke-width': this.size
      });
      if (this.size > flow_edge_width) {
        inner_width = this.size - flow_edge_width;
      } else {
        inner_width = this.size;
      }
      this.inner_line = r.path(flow_path).attr({
        'stroke-width': inner_width,
        'stroke': inner_colour
      });
      return r.set().push(this.inner_line, this.outer_line).hover(this.hover_start, this.hover_stop);
    };
    EnergyLine.prototype.hover_start = function(event) {
      var box, line, name, _ref, _ref2, _results;
      this.highlight(true, true);
      _ref = this.sankey.lines;
      for (name in _ref) {
        if (!__hasProp.call(_ref, name)) continue;
        line = _ref[name];
        line.fade_unless_highlighted();
      }
      _ref2 = this.sankey.boxes;
      _results = [];
      for (name in _ref2) {
        if (!__hasProp.call(_ref2, name)) continue;
        box = _ref2[name];
        _results.push(box.fade_unless_highlighted());
      }
      return _results;
    };
    EnergyLine.prototype.hover_stop = function(event) {
      var box, line, name, _ref, _ref2, _results;
      this.un_highlight(true, true);
      _ref = this.sankey.lines;
      for (name in _ref) {
        if (!__hasProp.call(_ref, name)) continue;
        line = _ref[name];
        line.un_fade();
      }
      _ref2 = this.sankey.boxes;
      _results = [];
      for (name in _ref2) {
        if (!__hasProp.call(_ref2, name)) continue;
        box = _ref2[name];
        _results.push(box.un_fade());
      }
      return _results;
    };
    EnergyLine.prototype.fade_unless_highlighted = function() {
      if (this.outer_line == null) {
        return false;
      }
      if (this.inner_line == null) {
        return false;
      }
      if (this.highlighed === true) {
        return false;
      }
      this.outer_line.attr({
        'opacity': '0.1'
      });
      return this.inner_line.attr({
        'opacity': '0.1'
      });
    };
    EnergyLine.prototype.un_fade = function() {
      if (this.outer_line == null) {
        return false;
      }
      if (this.inner_line == null) {
        return false;
      }
      if (this.highlighed === true) {
        return false;
      }
      this.outer_line.attr({
        'opacity': '1.0'
      });
      return this.inner_line.attr({
        'opacity': '1.0'
      });
    };
    EnergyLine.prototype.highlight = function(left, right) {
      if (this.outer_line == null) {
        return false;
      }
      if (this.inner_line == null) {
        return false;
      }
      this.highlighed = true;
      if (left) {
        this.left_label.toFront();
        this.left_label.show();
        this.left_box.highlight();
      }
      if (right) {
        this.right_label.toFront();
        this.right_label.show();
        return this.right_box.highlight();
      }
    };
    EnergyLine.prototype.un_highlight = function(left, right) {
      if (this.outer_line == null) {
        return false;
      }
      this.highlighed = false;
      if (left) {
        this.left_label.hide();
        this.left_box.un_highlight();
      }
      if (right) {
        this.right_label.hide();
        return this.right_box.un_highlight();
      }
    };
    return EnergyLine;
  })();
  TransformationBox = (function() {
    function TransformationBox(sankey, name) {
      this.sankey = sankey;
      this.name = name;
      this.label_text = name;
      this.line_colour = "orange";
      this.left_lines = [];
      this.right_lines = [];
      this.x = 0;
      this.y = 0;
      this.ghg = null;
    }
    TransformationBox.prototype.b = function() {
      return this.y + this.size();
    };
    TransformationBox.prototype.is_left_box = function() {
      return this.left_lines.length === 0;
    };
    TransformationBox.prototype.is_right_box = function() {
      return this.right_lines.length === 0;
    };
    TransformationBox.prototype.size = function() {
      var line, lines, s, _i, _len;
      s = 0;
      if (this.is_left_box()) {
        lines = this.right_lines;
      } else {
        lines = this.left_lines;
      }
      for (_i = 0, _len = lines.length; _i < _len; _i++) {
        line = lines[_i];
        if (line.size > this.sankey.threshold_for_drawing) {
          s = s + line.size;
        }
      }
      return s;
    };
    TransformationBox.prototype.position_and_colour_lines = function() {
      var box_width, left_lines, line, ly, right_lines, ry, _i, _j, _len, _len2, _ref, _results;
      ly = this.y;
      left_lines = this.left_lines;
      left_lines.sort(function(a, b) {
        return a.left_box.y - b.left_box.y;
      });
      for (_i = 0, _len = left_lines.length; _i < _len; _i++) {
        line = left_lines[_i];
        line.dx = this.x;
        line.dy = ly + (line.size / 2);
        ly = ly + line.size;
      }
      ry = this.y;
      right_lines = this.right_lines;
      right_lines.sort(function(a, b) {
        return a.right_box.y - b.right_box.y;
      });
      box_width = this.sankey.box_width;
      _results = [];
      for (_j = 0, _len2 = right_lines.length; _j < _len2; _j++) {
        line = right_lines[_j];
                if ((_ref = line.colour) != null) {
          _ref;
        } else {
          line.colour = this.line_colour;
        };
        line.ox = this.x + box_width;
        line.oy = ry + (line.size / 2);
        _results.push(ry = ry + line.size);
      }
      return _results;
    };
    TransformationBox.prototype.draw = function(r) {
      var box_width, transformation_box, _ref;
      box_width = this.sankey.box_width;
      this.box = r.rect(this.x, this.y, box_width, this.size()).attr({
        'fill': "#E8E2FF",
        "stroke": "#D4CBF2"
      });
      if (this.is_left_box()) {
        this.label = r.text(this.x - 3.0, this.y + (this.size() / 2), this.label_text).attr({
          'text-anchor': 'end'
        });
      } else if (this.is_right_box()) {
        this.label = r.text(this.x + box_width + 3.0, this.y + (this.size() / 2), this.label_text).attr({
          'text-anchor': 'start'
        });
      } else {
        this.label = r.text(this.x + (box_width / 2), this.y + (this.size() / 2), this.label_text.replace(/[^a-zA-Z0-9]/, "\n"));
      }
      if (this.ghg !== null) {
        this.emissions_circle = r.circle(this.x + box_width, this.y, 12).attr({
          'fill': (_ref = this.ghg > 0) != null ? _ref : {
            '#000': '#0a0'
          },
          'stroke-width': 0
        });
        this.emissions_measure = r.text(this.x + box_width, this.y, this.ghg).attr({
          'stroke': '#fff',
          'text-anchor': 'middle'
        });
      }
      this.number_label = r.text(this.x + (box_width / 2), this.y - 5, Math.round(this.size() / this.sankey.TWh));
      this.number_label.hide();
      transformation_box = this;
      return r.set().push(this.number_label, this.label, this.box).hover(function(event) {
        var box, line, name, _i, _j, _len, _len2, _ref2, _ref3, _ref4, _ref5, _results;
        transformation_box.highlight();
        transformation_box.number_label.toFront();
        transformation_box.number_label.show();
        _ref2 = transformation_box.left_lines;
        for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
          line = _ref2[_i];
          line.highlight(true, false);
        }
        _ref3 = transformation_box.right_lines;
        for (_j = 0, _len2 = _ref3.length; _j < _len2; _j++) {
          line = _ref3[_j];
          line.highlight(false, true);
        }
        _ref4 = transformation_box.sankey.lines;
        for (name in _ref4) {
          if (!__hasProp.call(_ref4, name)) continue;
          line = _ref4[name];
          line.fade_unless_highlighted();
        }
        _ref5 = transformation_box.sankey.boxes;
        _results = [];
        for (name in _ref5) {
          if (!__hasProp.call(_ref5, name)) continue;
          box = _ref5[name];
          _results.push(box.fade_unless_highlighted());
        }
        return _results;
      }, function(event) {
        var box, line, name, _i, _j, _len, _len2, _ref2, _ref3, _ref4, _ref5, _results;
        transformation_box.un_highlight();
        transformation_box.number_label.hide();
        _ref2 = transformation_box.left_lines;
        for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
          line = _ref2[_i];
          line.un_highlight(true, false);
        }
        _ref3 = transformation_box.right_lines;
        for (_j = 0, _len2 = _ref3.length; _j < _len2; _j++) {
          line = _ref3[_j];
          line.un_highlight(false, true);
        }
        _ref4 = transformation_box.sankey.lines;
        for (name in _ref4) {
          if (!__hasProp.call(_ref4, name)) continue;
          line = _ref4[name];
          line.un_fade();
        }
        _ref5 = transformation_box.sankey.boxes;
        _results = [];
        for (name in _ref5) {
          if (!__hasProp.call(_ref5, name)) continue;
          box = _ref5[name];
          _results.push(box.un_fade());
        }
        return _results;
      });
    };
    TransformationBox.prototype.highlight = function() {
      if (this.box == null) {
        return false;
      }
      return this.highlighed = true;
    };
    TransformationBox.prototype.un_highlight = function() {
      if (this.box == null) {
        return false;
      }
      return this.highlighed = false;
    };
    TransformationBox.prototype.fade_unless_highlighted = function() {
      if (this.box == null) {
        return false;
      }
      if (this.highlighed === true) {
        return false;
      }
      this.box.attr({
        'opacity': '0.1'
      });
      return this.label.attr({
        'opacity': '0.1'
      });
    };
    TransformationBox.prototype.un_fade = function() {
      if (this.box == null) {
        return false;
      }
      if (this.highlighed === true) {
        return false;
      }
      this.box.attr({
        'opacity': '1.0'
      });
      return this.label.attr({
        'opacity': '1.0'
      });
    };
    return TransformationBox;
  })();
  window.Sankey = Sankey;
}).call(this);
