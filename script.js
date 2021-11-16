var width = 600,
    height = 600,
    margin = 50,
    radius = Math.min(width, height) / 2 - margin;

var color = d3.scale.category20();

var pie = d3.layout.pie()
    .value(function (d) { return d.value; })
    .sort(null);

var arc = d3.svg.arc()
    .innerRadius(radius * 0.8)
    .outerRadius(radius * 0.4);

var outerArc = d3.svg.arc()
    .innerRadius(radius * 0.9)
    .outerRadius(radius * 0.9);

var svg = d3.select(".donut-chart")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .append("g")
    .attr("transform", "translate(" + (width / 2 - (margin * 2)) + "," + height / 2 + ")");

svg.append("g").attr("class", "slices");
svg.append("g").attr("class", "legend").attr("transform", "translate(" + (width / 2 - (margin * 1.5)) + ",-" + margin + ")");

var path = svg.select(".slices").selectAll("path");


d3.csv("http://workzone/WET4/development/qtt972/d3-visualisation/tbl01-en.csv", type, function (error, data) {
    if (error) throw error;

    var table = d3.select('.chart-table')
        .append('table')
        .attr("class", "table table-condensed table-hover");

    console.log(d3.keys(data[0]));
    var titles = d3.keys(data[0]);

    var headers = table.append('thead')
        .append('tr')
        .selectAll('th')
        .data(titles).enter()
        .append('th')
        .text(function (d) {
            return d;
        });
        
    var rows = table.append('tbody')
        .selectAll('tr')
        .data(data).enter()
        .append('tr');

    rows.selectAll('td')
        .data(function (d) {
            return titles.map(function (k) {
                return { 'value': d[k], 'name': k};
        });
    }).enter()
    .append('td')
    .attr('data-th', function (d) {
        return d.name;
    })
    .text(function (d) {
        return d.value;
    });


    var newData = [];
    data.forEach(function (d) {
        newData.push({ name: d["Province or Territory"], category: "$45,916 or less", value: d["$45,916 or less"] });
        newData.push({ name: d["Province or Territory"], category: "$45,917 - $91,831", value: d["$45,917 - $91,831"] });
        newData.push({ name: d["Province or Territory"], category: "$91,832 - $142,353", value: d["$91,832 - $142,353"] });
        newData.push({ name: d["Province or Territory"], category: "$142,354 - $202,800", value: d["$142,354 - $202,800"] });
        newData.push({ name: d["Province or Territory"], category: "$202,801 or more", value: d["$202,801 or more"] });
    });
    data = newData;

    var categoryByName = d3.nest()
        .key(function (d) { return d.name; })
        .entries(data);

    //console.log(categoryByName);

    var label = d3.select("form").selectAll("div")
        .data(categoryByName)
        .enter().append("div")
        .attr("class", "checkbox").append("label");

    label.append("input")
        .attr("type", "checkbox")
        .attr("name", "provinceTerritory")
        .attr("value", function (d) { return d.key; })
        .on("change", updateGraph)
        .property("checked", true);
        
    label.append("span")
        .text(function (d) { return d.key; });


    // Create graph in screen
    updateGraph();

    function updateGraph() {
        // Variable that will contain selected provinces/territories
        var selectedDataSet = [];
        
        // Verify all checkbox in the form
        d3.select("form").selectAll('input[type="checkbox"]').each(function (d) {
            cb = d3.select(this);
            // If the checkbox is selected
            if (cb.property("checked")) {
                // Gather information selected with checkboxes
                for (i = 0; i < categoryByName.length; i++) {
                    if (categoryByName[i].key == cb.property("value")) {
                        selectedDataSet.push(categoryByName[i]);
                    }
                }
            }
        });
        //console.log(selectedDataSet);
        
        var newDataSet = [];
        selectedDataSet.forEach(function(d) {
            d.values.forEach(function(e) {
                newDataSet.push({category: e.category, value: e.value});
            });
        });
        //console.log(newDataSet);

        var r = {};

        newDataSet.forEach(function(d) {
            r[d.category] = (r[d.category] || 0) + parseInt(d.value);
        });

        var result = Object.keys(r).map(function(k){
            return { category: k, value: r[k] }
        });

        //console.log(result);
        
        var data0 = path.data(),
            data1 = pie(result);

        //console.log(result);

        path = path.data(data1, key);
        
        path.enter().append("path")
            .each(function (d, i) { this._current = findNeighborArc(i, data0, data1, key) || d; })
            .attr("fill", function (d) { return color(d.data.category); })
            .attr("stroke", "white")
            .append("title")
            .text(function (d) { return d.data.category; });
        
        path.exit()
            .datum(function (d, i) { return findNeighborArc(i, data1, data0, key) || d; })
            .transition()
            .duration(750)
            .attrTween("d", arcTween)
            .remove();
        
        path.transition()
            .duration(750)
            .attrTween("d", arcTween);

        /* We append the legend with the current information */
        var legend = svg.select(".legend")
            .selectAll('.legend-entry')
            .data(result)
            .enter()
            .append('g')
            .attr('class', 'legend-entry')
            .attr("transform", function(d, i) { return "translate(0," + i * 25 + ")"; });

        legend.append('rect')
            .attr('class', 'legend-rect')
            .attr('width', 18)
            .attr('height', 18)
            .attr('fill', function (d) {
                return color(d.category);
            });
        
        legend.append('text')
            .attr('class', 'legend-text')
            .attr('x', 25)
            .attr('y', 10)
            .attr("dy", "0.35em")
            .text(function (d) {
                return d.category;
            });
        
    }
});

function key(d) {
    return d.data.category;
}

function type(d) {
    d.value = +d.value;
    return d;
}

function findNeighborArc(i, data0, data1, key) {
    var d;
    return (d = findPreceding(i, data0, data1, key)) ? { startAngle: d.endAngle, endAngle: d.endAngle }
    : (d = findFollowing(i, data0, data1, key)) ? { startAngle: d.startAngle, endAngle: d.startAngle }
    : null;
}

// Find the element in data0 that joins the highest preceding element in data1.
function findPreceding(i, data0, data1, key) {
    var m = data0.length;
    while (--i >= 0) {
        var k = key(data1[i]);
        for (var j = 0; j < m; ++j) {
            if (key(data0[j]) === k) return data0[j];
        }
    }
}

// Find the element in data0 that joins the lowest following element in data1.
function findFollowing(i, data0, data1, key) {
    var n = data1.length, m = data0.length;
    while (++i < n) {
        var k = key(data1[i]);
        for (var j = 0; j < m; ++j) {
            if (key(data0[j]) === k) return data0[j];
        }
    }
}

function midAngle(d) {
    return d.startAngle + (d.endAngle - d.startAngle) / 2;
}

function arcTween(d) {
    var i = d3.interpolate(this._current, d);
    this._current = i(0);
    return function (t) { return arc(i(t)); };
}
