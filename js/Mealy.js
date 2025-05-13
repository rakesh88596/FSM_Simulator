/**
 * Automaton JSON data structure.
 * @typedef {Object} Automaton
 * @property {Object} transitions - The transition table.
 * @property {?String} startState - The starting state.
 */

/**
 * Class representing an Mealy.
 */
class MealyModel {
    /**
     * Create an Mealy data model.
     */
    constructor() {
        this.transitions = {};
        this.startState = null;
        
    }

    /**
     * Create a transition between two states, reading one character and producing an output.
     * @param {String} stateA - The name of the source state.
     * @param {String} character - The character read in the transition.
     * @param {String} stateB - The name of the target state.
     * @param {String} output - The output produced during the transition.
     */
    addTransition(stateA, character, stateB, output) {
        if (!this.transitions[stateA]) {
            this.transitions[stateA] = {};
        }
        this.transitions[stateA][character] = { state: stateB, output: output };
    }

    /**
     * Remove a single character transition between two states.
     * @param {String} stateA - The name of the source state.
     * @param {String} character - The character read in the transition.
     * @param {String} stateB - The name of the target state.
     */
    removeTransition (stateA, character, stateB) {
        if (this.transitions[stateA] && this.transitions[stateA][character]) {
            if (this.transitions[stateA][character].state === stateB) {
                delete this.transitions[stateA][character];
            }
        }
    }

    /**
     * Remove all of the transitions in and out of a state.
     * @param {String} state - The name of the source state.
     */
    removeTransitions (state) {
        // Remove transitions coming from this state
        this.transitions[state] = {};
        // Remove transitions going into this state
        Object.keys(this.transitions).forEach(stateA => {
            Object.keys(this.transitions[stateA]).forEach(character => {
                if (this.transitions[stateA][character].state === state) {
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
    hasTransition (stateA, stateB) {
        let found = false;
        if (this.transitions[stateA] !== null) {
            Object.keys(this.transitions[stateA]).forEach(character => {
                if (this.transitions[stateA][character].state === stateB) {
                    found = true;
                }
            });
        }
        return found;   
    }

    /**
     * Perform a transition from a source state, reading a character,
     * and return the target state and output.
     * @param {String} stateA - The name of the source state.
     * @param {String} character - The character read in the transition.
     * @returns {?Object} Object containing the target state and output.
     */
    doTransition(stateA, character) {
        if (this.transitions[stateA] && this.transitions[stateA][character]) {
            return this.transitions[stateA][character];
        } else {
            return null;
        }
    }


    /**
     * Serialise the model into a JSON format.
     * @returns {Automaton} JSON object.
     */
    serialize () {
        return {
            transitions: this.transitions,
            startState: this.startState
        };
    }

    /**
     * Deserialise the model from a JSON format and load it's attributes
     * into the current instance.
     * @param {Automaton} json - The JSON object to load.
     */
    deserialize (json) {
        this.transitions = json.transitions;
        this.startState = json.startState;
    }
}

/**
 * Class containing the code for simulating an Mealy.
 */
class MealySimulator {
    /**
     * 
     * @param {MealyModel} model 
     */
    constructor(model) {
        this.model = model;
        this.status = null;
        this.nextStep = null;
        this.input = null;
        this.index = 0;
        this.states = [];
        this.output = "";
    }

    /**
     * Check if a string is accepted by the Mealy.
     * @param {String} input - The input string to test for acceptance.
     * @returns {Boolean} Input string was accepted.
     */
    accepts (input) {
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
    initialize (input) {
        this.status = "running";
        this.input = input;
        this.index = 0;
        this.states = [this.model.startState];
        this.output = ""; // Initialize output
    }

    /**
     * Perform one step, following a transition and producing output.
     */
    step() {
        if (this.status === "running" && this.index < this.input.length) {
            let char = this.input[this.index];
            let newStates = [];
            let outputs = [];
            this.states.forEach(state => {
                let transition = this.model.doTransition(state, char);
                if (transition) {
                    newStates.push(transition.state);
                    outputs.push(transition.output);
                }
            });

            // Update the current states and output
            this.index++;
            this.states = newStates;
            this.output += outputs.join("");

            // Check if there are no valid transitions
            if (this.states.length === 0) {
                this.status = "reject";
            } 
            
        }
    }
}