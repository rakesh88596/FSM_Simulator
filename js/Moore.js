/**
 * Automaton JSON data structure.
 * @typedef {Object} Automaton
 * @property {Object} transitions - The transition table.
 * @property {?String} startState - The starting state.
 * @property {Array} acceptStates - A list of accepting states.
 */

/**
 * Class representing an Moore.
 */
class MooreModel {
    /**
     * Create an Moore data model.
     */
    constructor() {
        this.transitions = {};
        this.startState = null;
        // this.acceptStates = [];
        this.stateOutputs = {}; // Store outputs for each state
    }

    /**
     * Create a transition between two states, reading one character.
     * @param {String} stateA - The name of the source state.
     * @param {String} character - The character read in the transition.
     * @param {String} stateB - The name of the target state.
     */
    addTransition(stateA, character, stateB) {
        if (!this.transitions[stateA]) {
            this.transitions[stateA] = {};
        }
        this.transitions[stateA][character] = stateB;
    }

    /**
     * Set the output for a state.
     * @param {String} state - The name of the state.
     * @param {String} output - The output for the state.
     */
    setStateOutput(state, output) {
        this.stateOutputs[state] = output;
    }

    /**
     * Get the output for a state.
     * @param {String} state - The name of the state.
     * @returns {String} The output for the state.
     */
    getStateOutput(state) {
        return this.stateOutputs[state] || "";
    }

    /**
     * Remove a single character transition between two states.
     * @param {String} stateA - The name of the source state.
     * @param {String} character - The character read in the transition.
     * @param {String} stateB - The name of the target state.
     */
    removeTransition(stateA, character, stateB) {
        if (this.transitions[stateA] && this.transitions[stateA][character]) {
            if (this.transitions[stateA][character] === stateB) {
                delete this.transitions[stateA][character];
            }
        }
    }

    /**
     * Remove all of the transitions in and out of a state.
     * @param {String} state - The name of the source state.
     */
    removeTransitions(state) {
        // Remove transitions coming from this state
        this.transitions[state] = {};
        // Remove transitions going into this state
        Object.keys(this.transitions).forEach(stateA => {
            Object.keys(this.transitions[stateA]).forEach(character => {
                if (this.transitions[stateA][character] === state) {
                    delete this.transitions[stateA][character];
                }
            });
        });
    }

    /**
     * Check if a transition exists between a source and target state.
     * @param {String} stateA - The name of the source state.
     * @param {String} stateB - The name of the target state.
     * @returns {Boolean} State was found.
     */
    hasTransition(stateA, stateB) {
        let found = false;
        if (this.transitions[stateA] !== null) {
            Object.keys(this.transitions[stateA]).forEach(character => {
                if (this.transitions[stateA][character] === stateB) {
                    found = true;
                }
            });
        }
        return found;
    }

    /**
     * Perform a transition from a source state, reading a character,
     * and return the target state.
     * @param {String} stateA - The name of the source state.
     * @param {String} character - The character read in the transition.
     * @returns {?String} The target state.
     */
    doTransition(stateA, character) {
        if (this.transitions[stateA] && this.transitions[stateA][character]) {
            return this.transitions[stateA][character];
        } else {
            return null;
        }
    }

    // /**
    //  * Mark a state as an accepting state.
    //  * @param {String} state - The name of the state.
    //  */
    // addAcceptState(state) {
    //     if (!this.acceptStates.includes(state)) {
    //         this.acceptStates.push(state);
    //     }
    // }

    // /**
    //  * Mark a state as a non-accepting state.
    //  * @param {String} state - The name of the state.
    //  */
    // removeAcceptState(state) {
    //     if (this.acceptStates.includes(state)) {
    //         let index = this.acceptStates.indexOf(state);
    //         this.acceptStates.splice(index);
    //     }
    // }

    // /**
    //  * Check if a state is an accepting state.
    //  * @param {String} state - The name of the state.
    //  * @returns {Boolean} State is accepting.
    //  */
    // isAcceptState(state) {
    //     return this.acceptStates.indexOf(state) > -1;
    // }

    /**
     * Set the automatons start state to a given state.
     * @param {String} state - The name of the state.
     */
    setStartState(state) {
        this.startState = state;
    }

    /**
     * Serialise the model into a JSON format.
     * @returns {Automaton} JSON object.
     */
    serialize() {
        return {
            transitions: this.transitions,
            // acceptStates: this.acceptStates,
            startState: this.startState,
            stateOutputs: this.stateOutputs
        };
    }

    /**
     * Deserialise the model from a JSON format and load its attributes
     * into the current instance.
     * @param {Automaton} json - The JSON object to load.
     */
    deserialize(json) {
        this.transitions = json.transitions;
        // this.acceptStates = json.acceptStates;
        this.startState = json.startState;
        this.stateOutputs = json.stateOutputs || {};
    }
}

/**
 * Class containing the code for simulating an Moore.
 */
class MooreSimulator {
    /**
     * 
     * @param {MooreModel} model 
     */
    constructor(model) {
        this.model = model;
        this.status = null;
        this.input = null;
        this.index = 0;
        this.states = [];
        this.output = "";
    }

    /**
     * Check if a string is accepted by the Moore.
     * @param {String} input - The input string to test for acceptance.
     * @returns {Boolean} Input string was accepted.
     */
    accepts(input) {
        this.initialize(input);
        while (this.status === "running") {
            this.step();
        }
        return this.status === "accept";
    }

    /**
     * Initialise the simulator with an input.
     * @param {String} input - The input string to simulate.
     */
    initialize(input) {
        this.status = "running";
        this.input = input;
        this.index = 0;
        this.states = [this.model.startState];
        this.output = ""; // Do not initialize with the start state's output
    }

    /**
     * Perform one step, following a transition and producing output.
     */
    step() {
        if (this.status === "running" && this.index < this.input.length) {
            let char = this.input[this.index];
            let newStates = [];
            this.states.forEach(state => {
                let nextState = this.model.doTransition(state, char);
                if (nextState) {
                    newStates.push(nextState);
                }
            });

            this.index++;
            this.states = newStates;

            // Collect outputs from the new states
            this.states.forEach(state => {
                this.output += this.model.getStateOutput(state);
            });

            // if (this.states.length === 0) {
            //     this.status = "reject";
            // } else if (this.index === this.input.length) {
            //     this.status = this.states.some(state => this.model.isAcceptState(state)) ? "accept" : "reject";
            // }
        }
    }
}