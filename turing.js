/* @author Mitchell Kwock and Julian Morris
 * Library for TM simulation to be used in DataViz Final Project
 */

/*
 * A Turing Machine is static and does not change once executed
 * Its properties should be changed via API, but can be configured by a JSON file
 */
function TuringMachine(config){
    config = config || {};
    this.tape = config.tape || {
        alphabet: [">", " "],
        head: ">",
        blank: " ",
    };
    this.states = config.states || {};

    // Ensures major states exist
    this.states.start = this.states.start || { "delta": {}, "x": 0, "y": 0 };
    this.states.accept = this.states.accept || { "delta": {}, "x": 50, "y": 0 };
    this.states.reject = this.states.reject || { "delta": {}, "x": 0, "y": 50 };
}

// Has check/add/edit/delete functionality for alphabet, states, and deltas
TuringMachine.prototype = {
    // stringify this Turing Machine to save as JSON
    stringify: function() {
        var obj = {
            tape: this.tape,
            states: this.states
        };
        return JSON.stringify(obj, null, 4);
    },

    // Convert his Turing Machine to one defined by the loadstring
    load: function(configString){
        var obj = JSON.parse(configString);
        this.tape = obj.tape;
        this.states = obj.states;
    },

    // returns true if specified state currently exists
    checkState: function(state){
        if(this.states[state]){
            console.log("Is a state: " + state);
            return true;
        }
        console.log("NOT a state: " + state);
        return false;
    },

    // return true if specified string is a valid alphabet member
    checkAlphabet: function(string){
        if(this.alphabet.indexOf(string) >= 0){
            console.log("In the alphabet: " + string);
            return true;
        }
        console.log("NOT in alphabet: " + string);
        return false;
    },

    // Returns true if specified delta exists
    checkDelta: function(state, read, idx){
        if(checkState(state)){
            if(this.states[read]){
                if(this.state[read].length > idx){
                    console.log("Is a delta");
                    return true;
                }
                console.log("NOT a delta idx: " + idx);
                return false;
            }
            console.log("NOT a delta read: " + read)
            return false;
        }
        console.log("NOT a delta state: " + state)
        return false;
    },

    // Get/Add/Edit/Delete functionality for states
    getStates: function(){
        var self = this;
        return Object.getOwnPropertyNames(this.states).map(function(stateName){
            return {
                name: stateName,
                x: self.states[stateName].x,
                y: self.states[stateName].y
            };
        });
    },
    addState: function(name){
        if(this.checkState(name)){
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
    //TODO: Allow color functionality to define state information
    editState: function(state, x, y){
        if(!this.checkState(state)){
            console.error("editState failed");
            return false;
        }
        this.states[state].x = x;
        this.states[state].y = y;
        return true;
    },
    deleteState: function(state){
        if(!this.checkState(state)){
            console.log("deleteState failed");
            return false;
        }
        if(state === "start" || state === "accept" || state === "reject"){
            console.error("Cannot delete critical state: " + state)
            return false;
        }
        return delete states[state];
    },

    // Add, edit, delete functionality for deltas
    getDeltas: function(){
        var self = this;
        return Object.getOwnPropertyNames(self.states).reduce(function(acc, name){
            var delta = self.states[name].delta;
            return acc.concat(Object.getOwnPropertyNames(delta).reduce(function(ac2, read){
                return ac2.concat(delta[read].map(function(d, idx){
                    return { "from": name, "to": d.to, "idx": idx, "read": read, "write": d.write, "move": d.move };
                }));
            }, []));
        }, []);
    },
    addDelta: function(state, read, to, write, move){
        if(!this.checkState(state) || !this.checkState(to) ||
            !this.checkAlphabet(read) || !this.checkAlphabet(write)){
            console.log("addDelta failed");
            return false;
        }
        this.states[state].delta[read].push({
            "move": parseInt(move),
            "to": to,
            "write": write
        });
        return true;
    },
    // Modifies an already existing delta
    editDelta: function(state, read, deltaIdx, to, write, move){
        console.error("Magic not implemented");
    },
    deleteDelta: function(state, read, deltaIdx){
        console.error("Magic not implemented");
    },

    addAlphabet: function(string){
        console.error("Magic not implemented");
    },
    // Not sure if this is necessary
    // Perhaps if this allows modification of tape.head and tape.blank
    editAlphabet: function(string){
        console.error("Magic not implemented");
    },
    editTapeHead: function(string){
        console.error("Magic not implemented");
    },
    editTapeBlank: function(string){
        console.error("Magic not implemented");
    },
    deleteAlphabet: function(string){
        console.error("Magic not implemented");
    }
}

/*
 * An Execution is made with a Turing Machine.
 * It is capable of following more than one thread with nondeterminism
 * It is, however, initialized with only one thread and requires a start state of "start"
 * Pausing and Restarting capabilities may be implemented later
 */
function Execution(tm){
    this.machine = tm;
    this.threads = [
        {
            active: "start",
            tape: [tm.tape.head],
            pointer: 0,
            lastmove: 0
        }
    ];
}

Execution.prototype = {
    // Saves current execution to be loaded for later
    // TODO: Determine if the Turing Machine used for this execution should be returned as well!
    stringify: function(){
        return JSON.stringify(this.threads, null, 4);
    },

    load: function(executionSave){
        this.threads = JSON.parse(executionSave);
    },

    // Advances each thread by one delta
    advance: function(){
        var self = this;
        this.threads.forEach(function(thread, idx){
            if(thread.active === "accept" || thread.active === "reject"){
                // Do not execute anything for accepted/rejected threads
                return;
            }
            // Pointer went too far to the left.  Segfault
            if(thread.pointer < 0){
                thread.active = "reject";
                return;
            }

            var deltas = self.machine.states[thread.active]
                .delta[thread.tape[thread.pointer]];
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
                self.addThread(delta.to, newTape, thread.pointer + delta.move); // Append thread to execute
            }

            // Edit current thread
            delta = deltas[0]
            thread.active = delta.to;
            thread.tape[thread.pointer] = delta.write;
            thread.pointer += delta.move;
            thread.lastmove = delta.move;

            // Pushes blanks until pointer is on a valid space
            while(thread.tape.length <= thread.pointer){
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
    deleteThread: function(threadIdx){
        if(threadIdx < this.threads.length){
            this.threads.splice(threadIdx, 1);
            return true;
        }
        return false;
    },
    // To be used for setting up tape when executing
    editTape: function(threadNum, idx, val){
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
    getThreads: function(){
        return this.threads;
    },
    getActives: function(){
        return this.threads.map(function(thread){
            return {
                state: thread.active,
                color: "rgba(255, 0, 0, 0.2)"
            }
        })
    }
}
