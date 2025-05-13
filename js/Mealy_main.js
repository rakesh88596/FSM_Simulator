// Mealy Model and Simulator
var model = new MealyModel();
var Mealy = new MealySimulator(model);
// Keep track of highlighted (active) components
var highlightedStates = [];
var highlightedTransitions = [];
// Number of states, used for naming states s0, s1, s2, etc...
var numStates = 0;

function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function createStateElement (id, name) {
    var state = $('<div></div>')
        .attr('data-state-name', name)
        .text(name)
        .attr('id', id)
        .addClass('control')
        .css('position', 'absolute');
    return state;
}

function addStateElementToDiagram (instance, state, x, y) {
    $(state).css({top: y, left: x});
    $(instance.getContainer()).append(state);
    instance.draggable(state.attr("id"), { "containment": true });
    instance.addEndpoint(state.attr("id"), {
        endpoint: [ "Dot", { radius: 6 } ],
        anchor: [ "Perimeter", { shape: "Circle"} ],
        isSource: true,
        maxConnections: -1,
        connectionType: "default-connection",
        connectionsDetachable: false
    });
    instance.makeTarget(state, {
        endpoint: [ "Dot", { radius: 1 } ],
        anchor: [ "Perimeter", { shape: "Circle"} ],
        connectionType: "default-connection",
        connectionsDetachable: false
    });
    numStates++;
}

// State context menu handler
$("#diagram").on("contextmenu", ".control", function (event) {
    event.preventDefault();
    window.selectedControl = $(this);
    $("#state-context-menu").css({display: "block", top: event.pageY, left: event.pageX});
    $("#transition-context-menu").css({display: "none"});
    $("#body-context-menu").css({display: "none"});
});

// Background context menu handler
$("#diagram").on("contextmenu", function (event) {
    if (event.target.id == "diagram") {
        event.preventDefault();
        $("#state-context-menu").css({display: "none"});
        $("#transition-context-menu").css({display: "none"});
        $("#body-context-menu").css({display: "block", top: event.pageY, left: event.pageX});
    }
});

// Hide context menus when anywhere is left clicked
$(document).bind("click", function (event) {
    $("#state-context-menu").css({display: "none"});
    $("#transition-context-menu").css({display: "none"});
    $("#body-context-menu").css({display: "none"});
});

// Context menu -> Delete state
$(".context-menu").on("click", ".delete-state", function (event) {
    let stateName = window.selectedControl.attr("data-state-name");
    // Remove inbound/outbound transitions for this state
    Mealy.model.removeTransitions(stateName);
    // Null out start state if it is deleted
    if (Mealy.model.startState === stateName) {
        Mealy.model.startState = null;
    }
    // Remove accept state if deleted
    if (Mealy.model.acceptStates.includes(stateName)) {
        Mealy.model.acceptStates.splice(Mealy.model.acceptStates.indexOf(stateName));
    }
    // Delete the control from JSPlumb
    instance.remove(window.selectedControl);
});

// Context menu -> Rename state
$(".context-menu").on("click", ".rename-state", function (event) {
    let state = window.selectedControl;
    let oldName = state.attr("data-state-name");
    let newName = prompt("Rename state", oldName);
    // Check this state name is not already in use
    let nameAlreadyUsed = false;
    Object.keys(Mealy.model.transitions).forEach(stateA => {
        Object.keys(Mealy.model.transitions[stateA]).forEach(character => {
            Mealy.model.transitions[stateA][character].forEach(stateB => {
                if (stateA === newName || stateB === newName) {
                    nameAlreadyUsed = true;
                }
            });
        });
    });
    if (nameAlreadyUsed) {
        alert("State name already in use. Please pick a unique state name.");
    }
    else if (newName !== null && newName !== "") {
        // Update transitions where this state is the target
        Object.keys(Mealy.model.transitions).forEach(stateA => {
            Object.keys(Mealy.model.transitions[stateA]).forEach(character => {
                Mealy.model.transitions[stateA][character].forEach((stateB, index) => {
                    if (stateB === oldName) {
                        Mealy.model.transitions[stateA][character][index] = newName;
                    }
                });
            });
        });
        // Update transitions where this state is the source
        Object.keys(Mealy.model.transitions).forEach(stateA => {
            if (stateA === oldName) {
                Mealy.model.transitions[newName] = Mealy.model.transitions[oldName];
                Mealy.model.transitions[oldName] = {};
            }
        });
        // Update names of starting state if necessary
        if (Mealy.model.startState === oldName) {
            Mealy.model.startState = newName;
        }
        // Update names of accepting states if necessary
        Mealy.model.acceptStates.forEach((acceptState, index) => {
            if (acceptState === oldName) {
                Mealy.model.acceptStates[index] = newName;
            }
        });
        // Update DOM element
        state.attr("data-state-name", newName);
        state.text(newName);
    }
});

// Context menu -> Make starting state
$(".context-menu").on("click", ".make-starting-state", function (event) {
    let oldStart = $("#diagram").find(`[data-state-name='${Mealy.model.startState}']`);
    console.log(Mealy.model.startState, oldStart)
    let state = window.selectedControl;
    let stateName = state.attr("data-state-name");
    if (!state.hasClass("starting")) {
        state.addClass("starting");
        Mealy.model.startState = stateName;
        if (oldStart !== null && oldStart !== undefined) {
            oldStart.removeClass("starting");
        }
    }
});

// Context menu -> Delete transition
$(".context-menu").on("click", ".delete-transition", function (event) {
    let sourceName = window.selectedConnection.source.dataset.stateName;
    let targetName = window.selectedConnection.target.dataset.stateName;
    let characters = window.selectedConnection.getLabel().split(",");
    // Remove this transition within the Mealy model
    characters.forEach(character => {
        Mealy.model.removeTransition(sourceName, character, targetName);
    });
    // Remove transition from highlighted transitions list
    let index = highlightedTransitions.indexOf(window.selectedConnection);
    if (index > -1) {
        highlightedTransitions.splice(index, 1);
    }
    // Delete the connection from JSPlumb
    instance.deleteConnection(window.selectedConnection);
});

// Context menu -> Edit transition
$(".context-menu").on("click", ".edit-transition", function (event) {
    let sourceName = window.selectedConnection.source.dataset.stateName;
    let targetName = window.selectedConnection.target.dataset.stateName;
    // Create a list of the characters that exist in the transition before editing
    let oldTransitions = [];
    Object.keys(Mealy.model.transitions[sourceName]).forEach(character => {
        if (Mealy.model.transitions[sourceName][character].indexOf(targetName) > -1) {
            oldTransitions.push(character);
        }
    });
    // Prompt the user for the characters and outputs to be in the updated transition
    let newTransition = prompt("Edit transitions (format: input/output).", oldTransitions.join(","))
    if (newTransition !== null && newTransition !== "") {
        let newTransitions = newTransition.replace(/[^a-zA-Z0-9_,/]/g, "")
                                          .toLowerCase()
                                          .split(",")
                                          .filter(trans => trans.includes("/"));
        // Add transition characters that are new (not in the old transition)
        newTransitions.forEach(newTrans => {
            if (oldTransitions.indexOf(newTrans) < 0) {
                let [input, output] = newTrans.split("/");
                Mealy.model.addTransition(sourceName, input, targetName, output);
            }
        });
        // Remove transition characters that are not in the new transition
        oldTransitions.forEach(oldTrans => {
            if (newTransitions.indexOf(oldTrans) < 0) {
                let [input, output] = oldTrans.split("/");
                Mealy.model.removeTransition(sourceName, input, targetName);
            }
        })
    }
    // Update the transition label in JSPlumb
    window.selectedConnection.setLabel(newTransitions.join(","));
});

// Context menu -> Create state
$(".context-menu").on("click", ".create-state", function (event) {
    let rect = instance.getContainer().getBoundingClientRect();
    let x = event.pageX - rect.left;
    let y = event.pageY - rect.top;
    const state = createStateElement(uuidv4(), "s"+numStates);
    addStateElementToDiagram(instance, state, x, y);
});

// Toolbox -> Test string
$("#toolbox-wrapper").on("click", "#instant-simulation", function (event) {
    let string = $('#enter-string').val();
    let outputBox = $('#instant-simulation-output');
    Mealy.initialize(string);
    while (Mealy.status === "running") {
        Mealy.step();
    }
    outputBox.val(`Output: ${Mealy.output}`);
});

// Toolbox -> Stop simulation
$("#toolbox-wrapper").on("click", "#stop-simulation", function (event) {
    highlightedStates.forEach(state => $(state).removeClass("highlighted"));
    highlightedTransitions.forEach(transition => transition.setPaintStyle({ stroke: "black", strokeWidth: 2}));
    $("#stop-simulation").prop("disabled", true);
    $("#start-simulation").prop("disabled", false);
    $("#step-simulation").prop("disabled", true);
    $("#instant-simulation").prop("disabled", false);
    $("#simulation-output").val("");
    // Clear tape
    $("#tape-wrapper #start").text("");
    $("#tape-wrapper #middle").text("");
    $("#tape-wrapper #end").text("");
});

// Toolbox -> Start simulation
$("#toolbox-wrapper").on("click", "#start-simulation", function (event) {
    Mealy.initialize($('#enter-string').val());
    // Highlight the active state
    let startState = $("#diagram").find(`[data-state-name='${Mealy.model.startState}']`);
    startState.addClass("highlighted");
    highlightedStates.push(startState);
    $("#stop-simulation").prop("disabled", false);
    $("#start-simulation").prop("disabled", true);
    $("#step-simulation").prop("disabled", false);
    $("#instant-simulation").prop("disabled", true);
    // Initialize tape
    $("#tape-wrapper #start").text(Mealy.input.substring(0, Mealy.index));
    $("#tape-wrapper #middle").text(Mealy.input[Mealy.index] || "");
    $("#tape-wrapper #end").text(Mealy.input.substring(Mealy.index + 1));
    $("#simulation-output").val(`Output: ${Mealy.output}`);
});

// Toolbox -> Step simulation
$("#toolbox-wrapper").on("click", "#step-simulation", function (event) {
    highlightedTransitions.forEach(transition => transition.setPaintStyle({ stroke: "black", strokeWidth: 2 }));
    if (Mealy.status === "running") {
        // Unhighlight all transitions and states from the previous step
        highlightedStates.forEach(state => $(state).removeClass("highlighted"));
        let previousStates = highlightedStates;
        highlightedStates = [];
        // Perform one step of the automaton
        Mealy.step();
        // Highlight newly active states and transitions
        Mealy.states.forEach(stateName => {
            // Highlight the active state
            let highlightedState = $("#diagram").find(`[data-state-name='${stateName}']`);
            $(highlightedState).addClass("highlighted");
            highlightedStates.push(highlightedState);
            // Highlight the transitions that lead to the current states
            previousStates.forEach(previousState => {
                let connection = instance.getConnections({
                    source: previousState,
                    target: highlightedState
                })[0];
                if (connection) {
                    highlightedTransitions.push(connection);
                    connection.setPaintStyle({ stroke: "green", strokeWidth: 2 });
                }
            });
        });
        // Update the tape and output
        $("#tape-wrapper #start").text(Mealy.input.substring(0, Mealy.index));
        $("#tape-wrapper #middle").text(Mealy.input[Mealy.index] || "");
        $("#tape-wrapper #end").text(Mealy.input.substring(Mealy.index + 1));
        $("#simulation-output").val(`Output: ${Mealy.output}`);
    }
    // Check for acceptance or rejection after the step completes
    else if (Mealy.status !== "running") {
        $("#stop-simulation").prop("disabled", false);
        $("#start-simulation").prop("disabled", true);
        $("#step-simulation").prop("disabled", true);
        $("#simulation-output").val(`Output: ${Mealy.output}`);
    }
});

instance = jsPlumb.getInstance({});
instance.setContainer("diagram");
instance.registerConnectionTypes({
    "default-connection": {
        paintStyle: { stroke: "#000",  strokeWidth: 2 },
        hoverPaintStyle: { stroke: "green", strokeWidth: 6 },
        connector: [ "StateMachine" ],
        overlays: [
            [ "Arrow", { location: 1, width: 20, length: 20 } ],
            [ "Label", { location: 0.5 } ]
        ]
    }
});

function onConnection (info) {
    let sourceName = info.source.innerText;
    let targetName = info.target.innerText;
    let connection = info.connection;
    let transitionCharacters = prompt("Enter the transitions for this connection in the format input/output, separated by commas."
                                    + "\nFor example a/0,b/1 will create transitions for a->0 and b->1.");
    if (transitionCharacters === null || transitionCharacters === "") {
        instance.deleteConnection(connection);
    } else {
        let transitions = transitionCharacters
                            .replace(/[^a-zA-Z0-9_,/]/g, "")
                            .toLowerCase()
                            .split(",")
                            .filter(trans => trans.includes("/"));
        transitions.forEach(function (trans) {
            let [input, output] = trans.split("/");
            Mealy.model.addTransition(sourceName, input, targetName, output);
        });
        connection.setLabel(transitions.join(","));
    }
}
instance.bind("connection", onConnection);

// Transition context menu handler
instance.bind("contextmenu", function (component, event) {
    if (component.hasClass("jtk-connector")) {
        event.preventDefault();
        window.selectedConnection = component;
        $("#state-context-menu").css({display: "none"});
        $("#transition-context-menu").css({display: "block", top: event.pageY, left: event.pageX});
        $("#body-context-menu").css({display: "none"});
    }
});