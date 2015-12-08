/*
 * A Turing Machine is static and does not change
 * Its properties should never change once made
 */
function TuringMachine(config){
    this.tape = config.tape || {
        alphabet: [">", " "],
        head: ">",
        blank: " ",
    };
    this.states = config.states || {
        "start": {
            "delta": {

            },
            "x": -1,
            "y": -1,
        },
        "final": {
            "delta": {

            },
            "x": 101,
            "y": 101
        }
    };
}

TuringMachine.prototype = {
    print: function() {

    },
    addState: function(name){
        if(this.states[name]){
            console.error("State already exists");
            return false;
        }
        var state = {
            "delta": {},
            "x": -1,
            "y": -1
        };
        this.states[name] = state;
        return true;
    },
    moveState: function(state, x, y){
        if(!this.states[state]){
            console.error("State doesn't exist");
            return false;
        }
        this.states[name].x = x;
        this.states[name].y = y;
        return true;
    },
    deleteState: function(state){
        if(!this.states[state]){
            console.error("State doesn't exist");
            return false;
        }
        delete states[state];
    },
    addDelta: function(state, read, to, write, move){
        if(!this.states[state]){
            console.error("State does not exist: " + state);
            return false;
        }
        if(this.alphabet.indexOf(read) < 0){
            console.error("Not in Turing Machine Alphabet: " + read);
            return false;
        }
        if(!this.states[to]){
            console.error("State does not exist: " + to);
            return false;
        }
        if(this.alphabet.indexOf(write) < 0){
            console.error("Not in Turing Machine Alphabet: " + write);
            return false;
        }
        this.states[state].delta[read].push({
            "move": parseInt(move),
            "to": to,
            "write": write
        });
        return true;
    }
}

/*
 * Am Execution is made with a Turing Machine.
 * It is capable of following more than one thread
 * It is, however, initialized with only one thread.
 * Pausing and Restarting capabilities may be implemented later
 */
function Execution(tm){
    this.machine = tm;
    this.threads = [
        {
            active: "start",
            tape: [tm.tape.head],
            pointer: 0
        }
    ];
}

Execution.prototype = {
    // Advances each thread by one delta
    advance: function(){
        var self = this;
        this.threads.forEach(function(thread, idx){
            if(thread.active === "accept" || thread.active === "reject"){
                // Do not execute anything for accepted/rejected threads
                return;
            }
            // Pointer went too far to the left.  Segfault
            if(pointer < 0){
                thread.active = "reject";
                return;
            }

            var deltas = self.machine.states[thread.active]
                .delta[thread.tape[pointer]];
            if(!deltas || deltas.length < 1){ // No delta found.  Is now rejecting
                thread.active = "reject";
                return;
            }

            var delta;

            // Append new threads for nondeterminism
            for(var i = 1; i < deltas.length; i++){
                delta = deltas[i];
                var newTape = thread.tape.slice(); // Copy current tape
                newTape[pointer] = delta.write; // Edit tape with new write
                self.addThread(delta.to, newTape, pointer + delta.move); // Append thread to execute
            }

            // Edit current thread
            delta = deltas[0]
            thread.active = delta.to;
            thread.tape[pointer] = delta.write;
            thread.pointer += delta.move

            // Pushes blanks until pointer is on a valid space
            while(thread.tape.length <= pointer){
                thread.tape.push(self.machine.tape.blank);
            }
        });
    },
    // Adds new thread to the threads to run
    addThread: function(active, tape, pointer){
        this.threads.push({
            "active": active,
            "tape": tape,
            "pointer": pointer
        });
    },
    editTapeSection: function(threadNum, idx, val){
        if(idx < 1){
            console.error("Index < 1: " + idx)
            return false;
        }
        if(this.machine.tape.alphabet.indexOf(val) < 0){
            console.error("Tape alphabet does not include: " + val);
            return false;
        }
        if(this.threads.length <= threadNum){
            console.error("Reached invalid thread number: " + threadNum);
            return false;
        }
        var tape = this.threads[threadNum].tape
        while(idx >= tape.length){
            tape.push(this.machine.tape.blank);
        }
        tape[idx] = val;
        return true;
    },
    get: function(){
        return this.threads;
    }
}
