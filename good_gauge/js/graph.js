var donut_license_colors = d3.scale.ordinal()
  .range(["#2d5f76", "#ffffff", "#acd7e2"]);

(function(global, undefined) {
  var defaults = {
    bindTo: 'body',
    className: 'donut',
    size: {
      width: 200,
      height: 200
    },
    margin: {
      top: 20,
      right: 20,
      bottom: 20,
      left: 20
    },
    startAngle: 0,
    endAngle: 360,
    thickness: null,
    offset: 0,
    sort: null,
    maxValue: null,
    background: false,
    colors: donut_license_colors,
    accessor: function(d, i) {
      return d;
    }
  };

  var Donut = global.Donut = function(config) {
    // need an extend fn
    this.config = extend({}, defaults, config);

    // setup radius
    this.config.radius = getRadius(this);

    // setup accessor
    this.accessor = this.config.accessor;

    // convenience method to map data to start/end angles
    this.pie = d3.layout.pie()
      .sort(this.config.sort)
      .startAngle(degToRad(this.config.startAngle))
      .endAngle(degToRad(this.config.endAngle))

    if (this.accessor && typeof this.accessor === 'function') {
      this.pie.value(this.accessor);
    }

    var thickness = getThickness(this);

    this.arc = d3.svg.arc()
      .innerRadius(this.config.radius - thickness - (this.config.offset / 4))
      .outerRadius(this.config.radius + (this.config.offset / 4));

    bindSvgToDom(this);
  };

  Donut.prototype.load = function(newOpts) {
    // store data on object
    var data = (newOpts && newOpts.data != null) ? newOpts.data : this.data.map(this.accessor);

    // convert to array if not already
    data = Array.isArray(data) ? data : [data];

    if (this.config.maxValue) {
      this.data = this.pieMaxValue(data);
    } else {
      this.data = this.pie(data);
    }

    // drawPaths
    drawPaths(this);
  };

  Donut.prototype.pieMaxValue = function(data) {
    var accessor = this.accessor,
      self = this;

    // Compute the numeric values for each data element.
    var values = data.map(function(d, i) { return +accessor.call(self, d, i); });

    var sum = d3.sum(values),
      max = d3.max([this.config.maxValue, sum]),
      diff = max - sum;

    // Compute the start angle.
    var a = +(degToRad(this.config.startAngle));

    // Compute the angular scale factor: from value to radians.
    // include the diff because it will help create angles with a maxValue in mind
    var k = (degToRad(this.config.endAngle) - a) / (sum + diff);

    var index = d3.range(data.length);

    // Compute the arcs!
    // They are stored in the original data's order.
    var arcs = [];
    index.forEach(function(i) {
      var d;
      arcs[i] = {
        data: data[i],
        value: d = values[i],
        startAngle: a,
        endAngle: a += d * k
      };
    });
    return arcs;
  };

  function getThickness(donut) {
    return donut.config.thickness || donut.config.radius;
  }

   /*
    * Setup the svg in the DOM and cache a ref to it
    */
  function bindSvgToDom(donut) {
    var width = getWidth(donut),
      height = getHeight(donut);

    donut.svg = d3.select(donut.config.bindTo)
      .append('svg')
      .attr('class', donut.config.classNames)
      .attr('width', width)
      .attr('height', height)
      .append('g')
        .attr('transform', 'translate(' + width / 2 + ',' + height / 2 + ')');

    if (donut.config.background) {
      donut.svg.append('path')
        .attr('class', 'donut-background')
        .attr('fill', '#eee')
        .transition()
        .duration(500)
        .attrTween('d', function(d, i) {
          var fullArc = {
            value: 0,
            startAngle: degToRad(donut.config.startAngle),
            endAngle: degToRad(donut.config.endAngle)
          };
          return arcTween.call(this, fullArc, i, donut);
        });
    }
  }

  function drawPaths(donut) {
    var paths = donut.svg.selectAll('path.donut-section').data(donut.data);

    // enter new data
    paths.enter()
      .append('path')
      .attr('class', function(d, i) { return 'donut-section value-' + i; })
      .attr('fill', function(d, i) {
        return (typeof donut.config.colors === 'function') ? donut.config.colors(i) : donut.config.colors[i];
      })
      .attr('stroke', '#fff')
      .attr('stroke-width', donut.config.offset / 2);

    // transition existing paths
    donut.svg.selectAll('path.donut-section')
      .transition()
      .duration(500)
      .attrTween('d', function(d, i) {
        return arcTween.call(this, d, i, donut);
      })

    // exit old data
    paths.exit()
      .transition()
      .duration(100)
      .attrTween('d', function(d, i) {
        return removeArcTween.call(this, d, i, donut);
      })
      .remove();
  }

  // Store the currently-displayed angles in this._current.
  // Then, interpolate from this._current to the new angles.
  function arcTween(a, i, donut) {
    var prevSiblingArc, startAngle, newArc, interpolate;


    if (!this._current) {
      prevSiblingArc = donut.svg.selectAll('path')[0][i - 1];// donut.data[i - 1];

      // start at the end of the previous one or start of entire donut
      startAngle = (prevSiblingArc && prevSiblingArc._current) ?
        prevSiblingArc._current.endAngle :
        degToRad(donut.config.startAngle);

      newArc = {
        startAngle: startAngle,
        endAngle: startAngle,
        value: 0
      };
    }

    interpolate = d3.interpolate(this._current || newArc, a);

    // cache a copy of data to each path
    this._current = interpolate(0);
    return function(t) {
      return donut.arc(interpolate(t));
    };
  }

  function removeArcTween(a, i, donut) {
    var emptyArc = {
        startAngle: degToRad(donut.config.endAngle),
        endAngle: degToRad(donut.config.endAngle),
        value: 0
      },
      i = d3.interpolate(a, emptyArc);
    return function(t) {
      return donut.arc(i(t));
    };
  }

  function getRadius(donut) {
    var width = getWidth(donut) - donut.config.margin.left - donut.config.margin.right,
      height = getHeight(donut) - donut.config.margin.top - donut.config.margin.bottom;

    return Math.min(width, height) / 2;
  }

  function getWidth(donut) {
    return donut.config.size && donut.config.size.width;
  }

  function getHeight(donut) {
    return donut.config.size && donut.config.size.height;
  }

  function degToRad(degree) {
    return degree * (Math.PI / 180);
  }

  function radToDeg(radian) {
    return radian * (180 / Math.PI);
  }

  function extend() {
    for (var i = 1; i < arguments.length; i++) {
      for (var prop in arguments[i]) {
        if (arguments[i].hasOwnProperty(prop)) {
          arguments[0][prop] = arguments[i][prop];
        }
      }
    }
    return arguments[0];
  }
})(window);


var httpRequest=null;

function getHttpRequest() {
    var httpReq = null;

    try {
        var httpReq = new XMLHttpRequest();
    } catch(err) {
        httpReq = null;
    }
    return httpReq;
}

function reqHttpData(url, callback) {
    if( httpRequest == null ) {
        httpRequest = getHttpRequest();
        if( httpRequest == null )
        return;
    }

    httpRequest.open("GET", url,true);
    httpRequest.onreadystatechange = callback;
    httpRequest.send(null);
}

var data_url = "../../main/php/parsing_result.txt";

function LoadFile() {
    reqHttpData("../../main/php/parsing_result.txt", onLoadHttpData);
}

function onLoadHttpData() {
    if( httpRequest.readyState != 4 ||httpRequest.status != 200 ) {
        var message = "Status - ReadyState:" + httpRequest.readyState
            + " / Status: " +httpRequest.status;

            $("#message").text(message);
        return;

    }
    var fileText = httpRequest.responseText;
    var prob = fileText.split('\n');

    $("#textFile").val(fileText);


    // dog = test2
    // entity2
    // prob[0]
    var fill = Number(prob[0]) * 100;

    var test2 = new Donut({
      bindTo: '#entity2 > .donut',
      background: true,
      thickness: 10,
      offset: 1,
      startAngle: 0,
      endAngle: 360
    });
    //var fill = Number(probability[0]) * 100;
    //var non_fill = 100 - fill;

    d = [fill , 100 - fill];
    test2.load({data: d});

    $('#entity2 .donut-section').hover(
      function() {
        if ($(this).attr('fill') === '#ffffff') {
          $('#entity2 .entity-lic').html('<span class="dark">73 Available</span> &nbsp; 15%');
          $('#entity2 .entity-count').html('73');
        }
        else {
          $('#entity2 .entity-lic').html('<span class="dark">427 Used</span> &nbsp; 85%');
          $('#entity2 .entity-count').html('427');
        }
      }, function() {
        $('#entity2 .entity-lic').html('427 of 500 Allowed');
        $('#entity2 .entity-count').html('427');
      }
  );
  fill = fill + "%";
  document.getElementById("dog").innerHTML = fill;

}


LoadFile();


var test1 = new Donut({
  bindTo: '#entity1 > .donut',
  background: true,
  thickness: 10,
  offset: 1,
  startAngle: 0,
  endAngle: 360
});

d = [25,75];
test1.load({data: d});

$('#entity1 .donut-section').hover(
  function() {
    if ($(this).attr('fill') === '#ffffff') {
      $('#entity1 .entity-lic').html('<span class="dark">75 Available</span> &nbsp; 75%');
      $('#entity1 .entity-count').html('75');
    }
    else {
      $('#entity1 .entity-lic').html('<span class="dark">25 Used</span> &nbsp; 25%');
      $('#entity1 .entity-count').html('25');
    }
  }, function() {
    $('#entity1 .entity-lic').html('25 of 100 Allowed');
    $('#entity1 .entity-count').html('25');
  }
);

var test3 = new Donut({
  bindTo: '#entity3 > .donut',
  background: true,
  thickness: 10,
  offset: 1,
  startAngle: 0,
  endAngle: 360
});
d = [0,0,6];
test3.load({data: d});

var test4 = new Donut({
  bindTo: '#entity4 > .donut',
  background: true,
  thickness: 10,
  offset: 1,
  startAngle: 0,
  endAngle: 360
});

d = [100];
test4.load({data: d});

$('#entity4 .donut-section').hover(
  function() {
    if ($(this).attr('fill') === '#ffffff') {
      $('#entity4 .entity-lic').html('<span class="dark">0 Available</span> &nbsp; 0%');
      $('#entity4 .entity-count').html('0');
    }
    else {
      $('#entity4 .entity-lic').html('<span class="dark">10 Used</span> &nbsp; 100%');
      $('#entity4 .entity-count').html('10');
    }
  }, function() {
    $('#entity4 .entity-lic').html('10 of 10 Allowed');
    $('#entity4 .entity-count').html('10');
  }
);

var test5 = new Donut({
  bindTo: '#entity5 > .donut',
  background: true,
  thickness: 10,
  offset: 1,
  startAngle: 0,
  endAngle: 360
});

d = [65, 35];
test5.load({data: d});

$('#entity5 .donut-section').hover(
  function() {
    if ($(this).attr('fill') === '#ffffff') {
      $('#entity5 .entity-lic').html('<span class="dark">35 Available</span> &nbsp; 35%');
      $('#entity5 .entity-count').html('35');
    }
    else {
      $('#entity5 .entity-lic').html('<span class="dark">65 Used</span> &nbsp; 65%');
      $('#entity5 .entity-count').html('65');
    }
  }, function() {
    $('#entity5 .entity-lic').html('2445 Pictures');
    $('#entity5 .entity-count').html('65%');
  }
);
