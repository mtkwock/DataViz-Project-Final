window.addEventListener("load", run);

var example;
var execution;

function run() {
    example = new TuringMachine(evenAs);
    execution = new Execution(example);
    execution.editTape(0, 1, "a");
    console.log(execution.getThreads());
    console.log("Here")
    document.getElementById("exampleAdvance").onclick = exampleAdvance;
}

function exampleAdvance(){
    execution.advance();
    console.log(execution.getThreads());
}
