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

var biPartiteWidth = (svgWidth / 2) - padding.l - padding.r;
var biPartiteHeight = svgHeight - 3*padding.t - padding.b;

var radius = (svgWidth - padding.l - padding.r) / 4;

var vis = svg.append('svg:g')
    .attr('id', 'container')
    .attr('transform', 'translate(' + (padding.l + radius) + ',' + svgHeight / 2 + ')')
    .on('mouseleave', mouseleave);

var visDetails = svg.append('g')
    .attr('id', 'details_container')
    .attr('transform', 'translate(' + (padding.l + svgWidth/2) + ',' + ((svgHeight/2) - (biPartiteHeight/2)) + ')');

visDetails.append('text')
    .attr('class', 'details-text-company')
    .attr('transform', 'translate(' + (biPartiteWidth/2) + ', -60)');

visDetails.append('text')
    .attr('class', 'details-text-sector')
    .attr('transform', 'translate(' + (biPartiteWidth/2) + ', ' + (biPartiteHeight + padding.b)+ ')');

visDetails.append('text')
    .attr('class', 'details-text-customer')
    .attr('transform', 'translate(' + (biPartiteWidth/2) + ', ' + (biPartiteHeight + padding.b + 20)+ ')');

visDetails.append('text')
    .attr('class', 'details-text-x')
    .attr('x', biPartiteWidth/2)
    .attr('y', biPartiteHeight/2)
    .append('svg:tspan')
    .attr('x', biPartiteWidth/2)
    .attr('dy', 5)
    .text('Hover over the sunburst chart to see ')
    .append('svg:tspan')
    .attr('x', biPartiteWidth/2)
    .attr('dy', 20)
    .text('more details about each company.');

var colors = {white: '#fff', lightGray: '#888', purple: '#a442f4'};

var genders = ['male', 'female'];
var races = ['white', 'asian', 'black', 'latinx', 'other'];

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
        dataByCompanyDict = {};
        dataByCompany = d3.nest()
                          .key(function(d){ return d.company_name; })
                          .entries(data)
                          .forEach(function(d) {
                              dataByCompanyDict[d.key] = d.values[0];
                          });
        console.log(dataByCompanyDict);
        biPartiteDataByCompany = {};
        data.forEach(function(d) {
            var companyData = [];
            genders.forEach(function(g) {
                races.forEach(function(r) {
                    companyData.push([g, r, d['overall_' + g + '_' + r]]);
                });
            });
            biPartiteDataByCompany[d.company_name] = companyData;
        });
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
        case 3:
            mouseoverCompany(d);
            break;
        case 4:
            mouseoverCompany(d.parent);
            mouseoverGender(d);
            break;
        default:
            return;
    }
}

function mouseoverCompany(d) {
    visDetails.select('.details-text-x').remove();
    visDetails.select('.details-text-company').text(toTitleCase(d.data.name));
    visDetails.select('.details-text-sector').text(function() {
        var sector = dataByCompanyDict[d.data.name]['sector_1'];
        if (sector) return 'Sector: ' + toTitleCase(sector);
        return 'No Sector'
    });
    visDetails.select('.details-text-customer').text('Customer Base: ' + toTitleCase(dataByCompanyDict[d.data.name]['customer_base_1']));
    bP = viz.biPartite()
                .fill(fill())
                .data(biPartiteDataByCompany[d.data.name])
                .orient('horizontal')
                .width(biPartiteWidth)
                .height(biPartiteHeight);
    bPg = visDetails.call(bP);

    bPg.selectAll('.viz-biPartite-mainBar')
        .append("text")
        .attr("class","perc")
        .text(function(d) {
            if (d.percent == 0) return '';
            return d3.format(".0%")(d.percent);
        });

    bPg.selectAll('.viz-biPartite-mainBar').append('text')
        .attr('class', 'perc')
        .attr('text-anchor', 'start')
        .attr('alignment-baseline' ,d=>(d.part=='primary' ? 'baseline' : 'hanging'))
        .attr('transform', function(d) {
            var dx = d.part == 'primary' ? 0 : -10;
            var dy = d.part == 'primary' ? -d.height - 10 : 2*d.height + 5;
            var dr = d.part == 'primary' ? 0 : 300;
            return 'translate(' + dx + ',' + dy +') rotate(' + dr + ')';
        })
    	.text(function(d) {
            if (d.percent == 0) return '';
            return toTitleCase(d.key);
        })
        .attr('fill', 'white');

    bPg.selectAll('.viz-biPartite-mainBar')
    	.on('mouseover', bPgMouseover)
    	.on('mouseout', bPgMouseout);
}

function bPgMouseover(d) {
    bP.mouseover(d)

    bPg.selectAll(".viz-biPartite-mainBar")
        .select(".perc")
        .text(function(d) {
            if (d.percent == 0) return '';
            return d3.format(".0%")(d.percent)
        });
}

function bPgMouseout(d) {
    bP.mouseout(d)

    bPg.selectAll(".viz-biPartite-mainBar")
        .select(".perc")
        .text(function(d) {
            if (d.percent == 0) return '';
            return d3.format(".0%")(d.percent)
        });
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
        .text(gender);
}

function fill() {
  var color = {'female':'#ff66b7','male':'#66bcff'}
  return function(d) { return color[d.primary] }
}

function toTitleCase(str) {
    return str.replace(/\w\S*/g, function(txt){
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
}
