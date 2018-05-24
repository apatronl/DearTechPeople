/**
 * Draws an interactive sunburst chart.
 *
 * @author Alejandrina Patrón
 */

var visible = 1;
var invisible = 0.3;
var padding = {t: 60, r: 30, b: 60, l: 30};

var svg = d3.select('#sunburst_svg svg');
var svgWidth = +svg.attr('width');
var svgHeight = +svg.attr('height');

var radius = (svgWidth - padding.l - padding.r) / 4;

var vis = svg.append('svg:g')
    .attr('id', 'container')
    .attr('transform', 'translate(' + (padding.l + radius) + ',' + svgHeight / 2 + ')')
    .on('mouseleave', mouseleave);

var visDetails = svg.append('g')
    .attr('id', 'details_container')
    .attr('transform', 'translate(' + (padding.l + 3*svgWidth/4) + ',' + svgHeight / 2 + ')');

visDetails.append('text').attr('class', 'details-text').text('Test');

var colors = {white: '#fff', lightGray: '#888', purple: '#a442f4'};

var chartWidth = (svgWidth * 2/3) - padding.l - padding.r;
var chartHeight = svgHeight - padding.t - padding.b;

var formatNumber = d3.format(',d');

var x = d3.scaleLinear()
    .range([0, 2 * Math.PI]);

var y = d3.scaleSqrt()
    .range([0, radius]);

var color = d3.scaleOrdinal(d3.schemeCategory20);

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
    d3.csv('./data/DearTechPeople-Data.csv', function(error, data) {
        if (error) {
            console.error(error);
            return;
        }
        console.log(data);
        drawVisualization(json);
    });
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

    var path = vis.data([json]).selectAll('path')
        .data(nodes)
        .enter().append('svg:path')
        .attr('display', function(d) { return d.depth ? null : 'none'; })
        .attr('d', arc)
        .attr('fill-rule', 'evenodd')
        .style('fill', function(d) {
            if (d.data.name == 'percent_female') return '#ff66b7';
            if (d.data.name == 'percent_male') return '#66bcff';
            if (d.children) return color(d.data.name);
            return color(d.parent.data.name);
        })
        .style('opacity', 1)
        .on('mouseover', mouseover);

    showMainCenterText();
}

function showMainCenterText() {
    vis.selectAll('text').remove();
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
        vis.selectAll('path')
            .style('opacity', visible);
        return;
    }
    var sequenceArray = d.ancestors().reverse();

    d3.selectAll('path')
        .style('opacity', invisible);

    vis.selectAll('path')
        .filter(function(node) {
            return (sequenceArray.indexOf(node) >= 0);
        })
        .style('opacity', visible);
    vis.selectAll('.sunburst-text').remove();
    vis.append('text')
        .attr('class', 'sunburst-text')
        .text(toTitleCase(d.data.name));
    mouseoverPartition(d);
}

function mouseleave(d) {
    // Deactivate all segments during transition.
    vis.selectAll('path').on('mouseover', null);

    vis.selectAll('path')
        .transition()
        .duration(500)
        .style('opacity', visible)
        .on('end', function() {
            d3.select(this).on('mouseover', mouseover);
        });

    showMainCenterText();
}

/**
    Depth Mapping
    1 - Sector
    2 - Customer Base
    3 - Company
    4 - Gender Distribution
**/

function mouseoverPartition(d) {
    switch (d.depth) {
        case 4:
            mouseoverGender(d);
            break;
        default:
            return;
    }
}

function mouseoverGender(d) {
    var companyName = d.parent.data.name;
    var percent = d.value;
    var gender = d.data.name == 'percent_female' ? 'Female' : 'Male';
    vis.selectAll('.sunburst-text').remove();
    vis.append('text')
        .attr('class', 'sunburst-text')
        .attr('x', 0)
        .attr('y', -20)
        .append('svg:tspan')
        .attr('x', 0)
        .attr('dy', 5)
        .text(companyName + ' is')
        .append('svg:tspan')
        .attr('x', 0)
        .attr('dy', 20)
        .text(percent +'%')
        .append('svg:tspan')
        .attr('x', 0)
        .attr('dy', 20)
        .text(gender)
}

function toTitleCase(str) {
    return str.replace(/\w\S*/g, function(txt){
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
}
