/**
 * Draws an interactive sunburst chart.
 *
 * @author Alejandrina Patrón
 */

var highlighted = 1;
var visible = 0.8;
var invisible = 0.3;

var svg = d3.select('#sunburst_svg svg');
var svgWidth = +svg.attr('width');
var svgHeight = +svg.attr('height');

var vis = svg.append("svg:g")
    .attr("id", "container")
    .attr("transform", "translate(" + svgWidth / 2 + "," + svgHeight / 2 + ")")
    .on('mouseleave', mouseleave);

var padding = {t: 60, r: 50, b: 60, l: 50};
var colors = {white: '#fff', lightGray: '#888', purple: '#a442f4'};

var chartWidth = (svgWidth * 2/3) - padding.l - padding.r;
var chartHeight = svgHeight - padding.t - padding.b;

var formatNumber = d3.format(",d");

var x = d3.scaleLinear()
    .range([0, 2 * Math.PI]);

var y = d3.scaleSqrt()
    .range([0, radius]);

var color = d3.scaleOrdinal(d3.schemeCategory20);

var radius = 280;

var partition = d3.partition()
    .size([2 * Math.PI, radius * radius]);

var arc = d3.arc()
    .startAngle(function(d) { return d.x0; })
    .endAngle(function(d) { return d.x1; })
    .innerRadius(function(d) { return Math.sqrt(d.y0); })
    .outerRadius(function(d) { return Math.sqrt(d.y1); });

d3.json('./json/data_hierarchy.json', function(error, json) {
    if (error) {
        console.error(error);
        return;
    }
    drawVisualization(json);
});

/** Helper functions **/

function drawVisualization(json) {
    var root = d3.hierarchy(json)
        .sum(function(d) { return d.size; })
        .sort(function(a, b) { return b.value - a.value; });

    // root.count();

    var nodes = partition(root).descendants()
        .filter(function(d) {
            return (d.x1 - d.x0 > 0.005);
        });

    var path = vis.data([json]).selectAll("path")
        .data(nodes)
        .enter().append("svg:path")
        .attr("display", function(d) { return d.depth ? null : "none"; })
        .attr("d", arc)
        .attr("fill-rule", "evenodd")
        .style("fill", function(d) {
            if (d.children) return color(d.data.name);
            return color(d.parent.data.name);
        })
        .style("opacity", 1)
        .on('mouseover', mouseover);

    showMainCenterText();
}

function showMainCenterText() {
    vis.selectAll('text').text('');
    vis.append('text')
        .attr('class', 'sunburst-text')
        .attr('x', 0)
        .attr('y', -20)
        .append('svg:tspan')
        .attr('x', 0)
        .attr('dy', 5)
        .text('"Most of us agree')
        .append('svg:tspan')
        .attr('x', 0)
        .attr('dy', 20)
        .text('that tech could be a')
        .append('svg:tspan')
        .attr('x', 0)
        .attr('dy', 20)
        .text('little more diverse."')
}

function mouseover(d) {
    if (d.data.name == 'deartechpeople') {
        vis.selectAll("path")
            .style("opacity", 1);
        return;
    }
  // var percentage = (100 * d.value / totalSize).toPrecision(3);
  // var percentageString = percentage + "%";
  // if (percentage < 0.1) {
  //   percentageString = "< 0.1%";
  // }
  //
  // d3.select("#percentage")
  //     .text(percentageString);
  //
  // d3.select("#explanation")
  //     .style("visibility", "");
  //
    var sequenceArray = d.ancestors().reverse();
  // updateBreadcrumbs(sequenceArray, percentageString);

  d3.selectAll("path")
      .style("opacity", 0.3);

  vis.selectAll("path")
      .filter(function(node) {
          return (sequenceArray.indexOf(node) >= 0);
      })
      .style("opacity", 1);
    vis.selectAll('.sunburst-text').remove();
    vis.append('text')
        .attr('class', 'sunburst-text')
        .text(d.data.name);
}

function mouseleave(d) {
    vis.selectAll("path")
        .style("opacity", 1);
    showMainCenterText();
}
