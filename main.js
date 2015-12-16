window.addEventListener("load", run);

var machine;
var execution;
var playing = false;
var intervalLoop;

function run() {
    machine = new TuringMachine(evenAs);
    execution = new Execution(machine);
    execution.editTape(0, 1, "a");
    execution.editTape(0, 2, "a");
    execution.editTape(0, 3, "a");
    execution.editTape(0, 4, "a");
    newThread();
    execution.editTape(1, 1, "a");
    execution.editTape(1, 2, "a");
    execution.editTape(1, 3, "a");
    document.getElementById("playPause").onclick = playPause;
    document.getElementById("export-tm").onclick = exportTm;
    var updateTape = function(event){
        // if(event.keyCode === 13){ // Enter pressed
            editTape();
        // }
    };
    document.getElementById("thread-num").onkeyup = updateTape;
    document.getElementById("cell-num").onkeyup = updateTape;
    document.getElementById("cell-val").onkeyup = updateTape;
    graphDeltas(machine);
    graphStates(machine);
    graphActives(execution);
    graphThreads(execution);
}

function exportTm(){
    document.getElementById("io-box").value = machine.stringify();
}

function playPause(){
    if (playing) {
        playing = false;
        window.clearInterval(intervalLoop);
    }else{
        playing = true;
        intervalLoop=window.setInterval(function(){
            advance(750);
        },1000);
    }
}





function advance(delay){
    graphThreads(execution);
    execution.advance();
    updateActives(execution, delay);
    updateThreads(execution, delay);
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
    svg.selectAll("#viz-tm > .deltaLabel").remove();

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

    svg.selectAll(".deltaLabel").data(deltas).enter()
        .append("text")
        .attr("class", "deltaLabel")
        .text(function(d){
            // { "from", "to", "idx", "read", "write", "move"};
            var arr = [d.read, d.to, d.write, d.move];
            return arr.join(", ")
        })
        .attr("text-anchor", "middle")
        .attr("font-size", 12)
        .attr("x", function(d){
            return getDeltaPos(d).x;
        })
        .attr("y", function(d){
            return getDeltaPos(d).y;
        })

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
    duration = duration > 0 ? duration : 0;
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

// Constants to be used elsewhere
var GLOBALS = {
    tape: {
        cellWidth: 25,
        cellHeight: 20,
        visibleRadius: 15
    },
    vizex: {
        cx: -1,
        cy: -1
    },
    viztm: {
        cx: -1,
        cy: -1
    }
}

function updateThreads(exe, duration){
    duration = duration > 0 ? duration: 0;
    var deltas = exe.getThreads().map(function(thread){
        return thread.lastmove;
    });

    var svg = d3.select("#viz-ex");

    svg.selectAll("#viz-ex > .tapeText")
        .transition().duration(duration)
        .attr("x", function(d){
            return GLOBALS.vizex.cx + (d.idx - deltas[d.threadidx]) * GLOBALS.tape.cellWidth;
        });

    svg.selectAll("#viz-ex > .tapeCell")
        .transition().duration(duration)
        .attr("x", function(d){
            return GLOBALS.vizex.cx + (d.idx - deltas[d.threadidx] - 0.5) * GLOBALS.tape.cellWidth;
        })

    var states = exe.getActives();
    svg.selectAll("#viz-ex > .threadStatus")
        .attr("fill", function(d, idx){
            var colorCode = {
                "inactive": "rgba(0, 0, 0, 0.1)",
                "active": "rgba(0, 0, 0, 0.2)",
                "accept": "rgba(0, 255, 0, 0.1)",
                "reject": "rgba(255, 0, 0, 0.1)"
            };
            var state = states[idx].state;
            if(state === "accept" || state === "reject"){
                return colorCode[state];
            }
            if(state !== "start"){
                return colorCode.active;
            }
            return colorCode[d.status] ? colorCode[d.status] : "black"; // Black is an obvious error made somewhere
        })

}

function graphThreads(exe){
    var threads = exe.getThreads();
    var visibleRadius = GLOBALS.tape.visibleRadius; // Middle plus radius on each side
    var cellWidth = GLOBALS.tape.cellWidth; // Pixel Distance between cells
    var cellHeight = GLOBALS.tape.cellHeight;
    var threadPortions = threads.map(function(thread, threadidx){
        var returned = Array(visibleRadius * 2 + 1);
        for(var i = 0; i < returned.length; i++){
            var tapeidx = thread.pointer + i - visibleRadius;
            if(tapeidx >= 0){ // Handle normal cases
                returned[i] = {
                    "status": thread.status,
                    "threadidx": threadidx,       // Editing reference to thread, Controls Displayed Y Position
                    "tapeidx": tapeidx,           // Editing reference to tape
                    "idx": i - visibleRadius, // Controls Displayed X position
                    "val": tapeidx < thread.tape.length ? // Controls displayed value
                        thread.tape[tapeidx] : exe.machine.tape.blank
                };
            }
            else { // Handle cases where pointer is too far to the left (tapeidx < 0)
                returned[i] = {
                    "threadidx": threadidx,
                    "tapeidx": -1 * visibleRadius,
                    "idx": -100, // Should not be visible
                    "val": ""
                }
            }
        }
        return returned;
    });

    var pointers = threads.map(function(x, idx){
        return {
            idx: idx,
            status: x.status
        };
    });

    // Pull arrays up a level to linearize it
    var data = threadPortions.reduce(function(acc, arr){
        return acc.concat(arr)
    }, []);

    var svg = d3.select("#viz-ex");
    var cx = parseInt(svg.style("width")) / 2;
    GLOBALS.vizex.cx = cx;

    svg.selectAll("#viz-ex > .tapeText").remove();
    svg.selectAll("#viz-ex > .deleteThread").remove();
    svg.selectAll("#viz-ex > .resetThread").remove();
    svg.selectAll("#viz-ex > .threadStatus").remove();
    svg.selectAll("#viz-ex > .pointer").remove();

    svg.selectAll(".tapeText").data(data).enter()
        .append("text")
        .attr("class", "tapeText")
        .text(function(d){
            return d.val;
        })
        .attr("x", function(d){
            return cx + d.idx * cellWidth;
        })
        .attr("y", function(d){
            return 25 + d.threadidx * (cellHeight + 12);
        })
        .attr("font-size", 16)
        .attr("text-anchor", "middle")
        .attr("fill", "black");

    svg.selectAll(".deleteThread").data(pointers)
        .enter().append("text")
        .attr("class", "deleteThread")
        .attr("x", 12)
        .text("DELETE")
        .attr("y", function(d){
            return 25 + d.idx * (cellHeight + 12) + 16;
        })
        .attr("font-size", 8)
        .attr("fill", "black")
        .on("click", deleteThread);

    svg.selectAll(".resetThread").data(pointers)
        .enter().append("text")
        .attr("class", "resetThread")
        .attr("x", 54)
        .text("RESET")
        .attr("y", function(d){
            return 25 + d.idx * (cellHeight + 12) + 16;
        })
        .attr("font-size", 8)
        .attr("fill", "black")
        .on("click", resetThread);

    svg.selectAll(".threadStatus").data(pointers)
        .enter().append("rect")
        .attr("class", "threadStatus")
        .attr("x", function(d){
            return 0;
        })
        .attr("y", function(d){
            return 12 + d.idx * (cellHeight + 12);
        })
        .attr("width", cx * 2)
        .attr("height", cellHeight)
        .attr("fill", function(d){
            var colorCode = {
                "inactive": "rgba(0, 0, 0, 0.1)",
                "active": "rgba(0, 0, 0, 0.2)",
                "accept": "rgba(0, 255, 0, 0.1)",
                "reject": "rgba(255, 0, 0, 0.1)"
            };
            return colorCode[d.status];
        })

    svg.selectAll(".tapeCell").remove();
    // Clickable cells which border the sections
    svg.selectAll(".tapeCell").data(data).enter()
        .append("rect")
        .attr("class", "tapeCell")
        .attr("x", function(d){
            return cx + (d.idx-0.5) * cellWidth;
        })
        .attr("y", function(d){
            return 12 + d.threadidx * (cellHeight + 12);
        })
        .attr("width", cellWidth)
        .attr("height", cellHeight)
        .attr("fill", function(d){
            return "rgba(0, 0, 0, 0.1)";
        })
        .attr("stroke-width", 1)
        .attr("stroke", "black")
        .attr("stroke-opacity", 0.5)
        .on("click", selectTape);

    svg.selectAll(".pointer").data(pointers).enter()
        .append("text")
        .attr("class", "pointer")
        .text("^")
        .attr("x", cx)
        .attr("y", function(d){
            return 25 + d.idx * (cellHeight + 12) + 20;
        })
        .attr("font-size", 16)
        .attr("text-anchor", "middle")
        .attr("fill", "black");
}

function updateDeltas() {
    d3.selectAll("#viz-tm > g > path").attr("d", linkArc);
    d3.selectAll("#viz-tm > .deltaLabel")
    d3.selectAll("#viz-tm > .deltaLabel")
        .attr("x", function(d){
            return getDeltaPos(d).x;
        })
        .attr("y", function(d){
            return getDeltaPos(d).y;
        })
}

// Using target and source, find an X/Y position to place the label
function getDeltaPos(d){
    var target = machine.states[d.to],
        source = machine.states[d.from],
        vec = {
            x: target.x - source.x,
            y: target.y - source.y
        },
        perpVec = {
            x: vec.y * -1,
            y: vec.x
        },
        output = { // Can be compressed into one or two lines later
            x: vec.x * 0.5 + perpVec.x * -0.25 + source.x,
            y: vec.y * 0.5 + perpVec.y * -0.25 + source.y
        };

    return output;
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

function selectTape(d){
    d3.select("#thread-num").property("value", d.threadidx);
    d3.select("#cell-num").property("value", d.tapeidx);
    d3.select("#cell-val").property("value", d.val);
    execution.threads[d.threadidx].pointer = d.tapeidx;
    var input = document.getElementById("cell-val");
    input.focus();
    input.setSelectionRange(0, input.value.length);
    graphThreads(execution);
}

function editTape(){
    var threadNum = d3.select("#thread-num").property("value");
    var cellNum = d3.select("#cell-num").property("value");
    var cellVal = d3.select("#cell-val").property("value");
    execution.editTape(threadNum, cellNum, cellVal);
    graphThreads(execution);
}

function newThread() {
    execution.addThread("start", [execution.machine.tape.head], 0);
    graphThreads(execution);
    graphActives(execution);
}

function deleteThread(d) {
    execution.deleteThread(d.idx);
    graphThreads(execution);
    graphActives(execution);
}

function resetThread(d) {
    execution.resetThread(d.idx);
    graphThreads(execution);
    graphActives(execution);
}
