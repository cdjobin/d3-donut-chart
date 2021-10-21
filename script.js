var width = 600,
    height = 600,
    margin = 100,
    radius = Math.min(width, height) / 2 - margin;

var color = d3.scale.category20();

var pie = d3.layout.pie()
    .value(function (d) { return d.count; })
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
    .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

svg.append("g")
    .attr("class", "slices");

svg.append("g")
    .attr("class", "labels");

svg.append("g")
    .attr("class", "lines");

var path = svg.select(".slices").selectAll("path");
var polyline = svg.select(".lines").selectAll("allPolylines");
var labels = svg.select(".labels").selectAll("allLabels");

d3.csv("tbl01-en.csv", type, function (error, data) {
    var newData = [];
    data.forEach(function (d) {
        newData.push({ provinceTerritory: d.provinceTerritory, salary: "$45,916 or less", count: d.amt1 });
        newData.push({ provinceTerritory: d.provinceTerritory, salary: "$45,917 - $91,831", count: d.amt2 });
        newData.push({ provinceTerritory: d.provinceTerritory, salary: "$91,832 - $142,353", count: d.amt3 });
        newData.push({ provinceTerritory: d.provinceTerritory, salary: "$142,354 - $202,800", count: d.amt4 });
        newData.push({ provinceTerritory: d.provinceTerritory, salary: "$202,801 or more", count: d.amt5 });
    });
    data = newData;

    var salaryByRegion = d3.nest()
        .key(function (d) { return d.provinceTerritory; })
        .entries(data);

    //console.log(salaryByRegion);

    var label = d3.select("form").selectAll("div")
        .data(salaryByRegion)
        .enter().append("div")
        .attr("class", "checkbox").append("label");

    label.append("input")
        .attr("type", "checkbox")
        .attr("name", "provinceTerritory")
        .attr("value", function (d) { return d.key; })
        // JC --> La ligne ci-dessous fait en sorte que toutes les cases seront cochées en affichage initial
        .on("change", updateGraph)
        .property("checked", true);
        
    label.append("span")
        .text(function (d) { return d.key; });

    // Create graph in screen
    updateGraph();

    /**
    * JC --> Ceci est mon début de fonction qui sert à afficher les résultats dans le graphique
    * En résumé, il faut avant tout récupérer les éléments qui sont sélectionnés par les cases à cocher. 
    * Le reste n'est pas important dans le graphique.
    * Autrement dit, on refaire un array de valeur mais contenant seulement les valeurs sélectionnés.
    */
    function updateGraph() {
        // Variable that will contain selected provinces/territories
        var selectedDataSet = [];
        
        // Verify all checkbox in the form
        d3.select("form").selectAll('input[type="checkbox"]').each(function (d) {
            cb = d3.select(this);
            // If the checkbox is selected
            if (cb.property("checked")) {
                // Gather information selected with checkboxes
                for (i = 0; i < salaryByRegion.length; i++) {
                    if (salaryByRegion[i].key == cb.property("value")) {
                        selectedDataSet.push(salaryByRegion[i]);
                    }
                }
            }
        });
        // console.log(selectedDataSet);

        var newDataSet = [];
        selectedDataSet.forEach(function(d) {
            d.values.forEach(function(e) {
                newDataSet.push({salary: e.salary, count: e.count});
            });
        });
        // console.log(newDataSet);

        var r = {};

        newDataSet.forEach(function(d) {
            r[d.salary] = (r[d.salary] || 0) + parseInt(d.count);
        });

        var result = Object.keys(r).map(function(k){
            return { salary: k, count: r[k] }
        });

        // console.log(result);
        
        var data0 = path.data(),
            data1 = pie(result);

        // console.log(result);

        path = path.data(data1, key);
        polyline = polyline.data(data1, key);
        labels = labels.data(data1, key);
        
        path.enter().append("path")
            .each(function (d, i) { this._current = findNeighborArc(i, data0, data1, key) || d; })
            .attr("fill", function (d) { return color(d.data.salary); })
            .attr("stroke", "white")
            .append("title")
            .text(function (d) { return d.data.salary; });
        
        path.exit()
            .datum(function (d, i) { return findNeighborArc(i, data1, data0, key) || d; })
            .transition()
            .duration(750)
            .attrTween("d", arcTween)
            .remove();
        
        path.transition()
            .duration(750)
            .attrTween("d", arcTween);
        
        polyline.enter().append("polyline")
            .each(function (d, i) { this._current = findNeighborArc(i, data0, data1, key) || d; })
            .attr("stroke", "black")
            .style("fill", "none")
            .attr("stroke-width", 1)
            .attr("points", linePoints);
        
        polyline.exit()
            .datum(function (d, i) { return findNeighborArc(i, data1, data0, key) || d; })
            .transition()
            .duration(750)
            .attrTween("points", arcTweenPoints)
            .remove();
        
        polyline.transition()
            .duration(750)
            .attrTween("points", arcTweenPoints);
            
        labels.enter().append("text")
            .each(function (d, i) {
                this._current = findNeighborArc(i, data0, data1, key) || d;
            })
            .text(function (d) { return d.data.salary; })
            .attr("transform", labelsTransform)
            .style("text-anchor", labelsAnchor)
            .append("span");
        
        labels.exit()
            .datum(function (d, i) { return findNeighborArc(i, data1, data0, key) || d; })
            .transition()
            .duration(750)
            .attrTween("transform", arcTweenTransfrom)
            .styleTween("text-anchor", styleTweenTransform)
            .remove();
        
        labels.transition()
            .attrTween("transform", arcTweenTransfrom)
            .styleTween("text-anchor", styleTweenTransform)
            .duration(750);
    }
});

function key(d) {
    return d.data.salary;
}

function type(d) {
    d.count = +d.count;
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

function linePoints(d) {
    var posA = arc.centroid(d);
    var posB = outerArc.centroid(d);
    var posC = outerArc.centroid(d);
    posC[0] = radius * 0.9 * (midAngle(d) < Math.PI ? 1 : -1);

    return [posA, posB, posC];
}

function labelsTransform(d) {
    var pos = outerArc.centroid(d);
    pos[0] = radius * 0.99 * (midAngle(d) < Math.PI ? 1 : -1);

    return 'translate(' + pos + ')';
}

function labelsAnchor(d) {
    return (midAngle(d) < Math.PI ? 'start' : 'end');
}

function arcTween(d) {
    var i = d3.interpolate(this._current, d);
    this._current = i(0);
    return function (t) { return arc(i(t)); };
}

function arcTweenPoints(d) {
    this._current = this._current;
    var interpolate = d3.interpolate(this._current, d);
    var _this = this;
    return function (t) {
        var d2 = interpolate(t);
        _this._current = d2;
        var pos = outerArc.centroid(d2);
        pos[0] = radius * 0.95 * (midAngle(d2) < Math.PI ? 1 : -1);
        return [arc.centroid(d2), outerArc.centroid(d2), pos];
    };
}

function arcTweenTransfrom(d) {
    var interpolate = d3.interpolate(this._current, d);
    var _this = this;
    return function (t) {
        var d2 = interpolate(t);
        _this._current = d2;
        var pos = outerArc.centroid(d2);
        pos[0] = radius * (midAngle(d2) < Math.PI ? 1 : -1);
        return "translate(" + pos + ")";
    };
}

function styleTweenTransform(d) {
    var interpolate = d3.interpolate(this._current, d);
    return function (t) {
        var d2 = interpolate(t);
        return midAngle(d2) < Math.PI ? "start" : "end";
    };
}
