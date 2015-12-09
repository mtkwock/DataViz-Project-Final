window.addEventListener("load", run);

var machine;
var execution;

function run() {
    machine = new TuringMachine(evenAs);
    execution = new Execution(machine);
    execution.editTape(0, 1, "a");
    console.log(execution.getThreads());
    document.getElementById("exampleAdvance").onclick = exampleAdvance;
    document.getElementById("export-tm").onclick = exportTm;
    graphDeltas(machine);
    graphStates(machine);
    graphActives(execution);
}

function exportTm(){
    document.getElementById("io-box").value = machine.stringify();
}

function exampleAdvance(){
    execution.advance();
    updateActives(execution, 750);
    console.log(execution.getThreads());
}

function graphStates(tm){
    var drag = d3.behavior.drag().on("dragstart", dragstarted)
    .origin(function(d) { return d; })
    .on("drag", dragged)
    .on("dragend", dragended);
    var svg = d3.select("#viz-tm");
    svg.selectAll("#viz-tm > .state").remove();
    svg.selectAll("#viz-tm > .state-label").remove();
    var height = svg.attr('height');
    var width = svg.attr('width');

    svg.selectAll(".state").data(tm.getStates()).enter()
        .append("circle")
        .attr("cx", function(dat){
            return dat.x;
        })
        .attr("id", function(dat){
            return "state-" + dat.name;
        })
        .attr("cy", function(dat){
            return dat.y;
        })
        .attr("r", 25)
        .attr("class", "state")
        .style("fill", "#BBBBBB")
        .call(drag)

    svg.selectAll(".state-label").data(tm.getStates()).enter()
        .append("text")
        .attr("class", "state-label")
        .attr("id", function(dat){
            return "state-label-" + dat.name;
        })
        .text(function(d){
            return d.name;
        })
        .attr("x", function(d){
            return d.x;
        })
        .attr("y", function(d){
            return d.y + 36;
        })
        .attr("font-size", 12)
        .attr("text-anchor", "middle")
        .attr("fill", "red");
}

function graphDeltas(tm) {
    var deltas = tm.getDeltas();
    var svg = d3.select("#viz-tm");
    svg.selectAll("#viz-tm > .delta").remove();
    svg.selectAll("#viz-tm > g > .link").remove();

    svg.append("defs").selectAll("marker").data(["triangle"]).enter()
        .append("marker")
        .attr("id", function(dat){
            return "delta-marker-" + dat;
        })
        .attr("class", "delta")
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 36)
        .attr("refY", -3.5)
        .attr("markerWidth", 6)
        .attr("markerHeight", 6)
        .attr("orient", "auto")
        .append("path")
        .attr("d", "M0,-5L10,0L0,5");

    var path = svg.append("g").selectAll("path")
        .data(deltas).enter().append("path")
        .attr("class", "link")
        .attr("marker-end", function(dat){
            return "url(#delta-marker-triangle)";
        })
        .attr("d", linkArc);
}

function graphActives(exe){
    var states = exe.getActives();
    var svg = d3.select("#viz-tm");
    svg.selectAll("#viz-tm > .state-active").remove();
    svg.selectAll(".state-active").data(states).enter()
        .append("circle")
        .attr("class", "state-active")
        .attr("cx", function(d){
            return exe.machine.states[d.state].x;
        })
        .attr("cy", function (d){
            return exe.machine.states[d.state].y;
        })
        .attr("r", 20)
        .attr("fill", function(d){
            return d.color;
        });
}

// Try different easing functions:
// http://bl.ocks.org/hunzy/9929724
function updateActives(exe, duration){
    duration = duration > 0 ? duration : 0
    var states = exe.getActives();
    d3.selectAll(".state-active")
        .transition()
        .ease("quad")
        .duration(duration)
        .delay(0)
        .attr("cx", function(d, idx){
            return exe.machine.states[states[idx].state].x;
        })
        .attr("cy", function(d, idx){
            return exe.machine.states[states[idx].state].y;
        })
}

function updateDeltas() {
    d3.selectAll("#viz-tm > g > path").attr("d", linkArc);
}

// Obtained from: https://gist.github.com/mbostock/1153292
function linkArc(d) {
    var target = machine.states[d.to],
        source = machine.states[d.from],
        dx = target.x - source.x,
        dy = target.y - source.y,
        dr = Math.sqrt(dx * dx + dy * dy);
  return "M" + source.x + "," + source.y + "A" + dr + "," + dr + " 0 0,1 " + target.x + "," + target.y;
}

// Obtained from: http://bl.ocks.org/mbostock/6123708
function dragstarted(d) {
    d3.event.sourceEvent.stopPropagation();
    d3.select(this).classed("dragging", true);
}

function dragged(d) {
    machine.editState(d.name, d3.event.x, d3.event.y);
    updateDeltas();
    updateActives(execution, -1);
    d3.select("#viz-tm > #state-label-" + d.name)
        .attr("x", d.x = d3.event.x)
        .attr("y", d.y = d3.event.y + 36);
    d3.select(this)
        .attr("cx", d.x = d3.event.x)
        .attr("cy", d.y = d3.event.y);
}

function dragended(d) {
    d3.select(this).classed("dragging", false);
    graphDeltas(machine);
    graphStates(machine);
    graphActives(execution);
}
