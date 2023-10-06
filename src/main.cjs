// Use UI input if anchor not defined
function chooseInput(input, uiInput, inputKey) {
    if (input[inputKey]) {
        return input[inputKey];
    }
    return uiInput[inputKey];
}

function getId() {
    return "_" + Math.random().toString(36).substr(2, 9);
}

function unpack() {
    let types = {};
    let vars = {};

    for (const arg of arguments) {
        if (arg?.globals == null) continue;

        if (arg.globals.types) types = { ...types, ...arg.globals.types };
        if (arg.globals.vars) vars = { ...vars, ...arg.globals.vars };
    }

    return { types, vars };
}

const nodes = {
    //========== LOGIC NODES ==========//
    "var": (context) => {
        const nodeBuilder = context.instantiate("Ripple/Input", "var");
        nodeBuilder.setTitle("Var");
        nodeBuilder.setDescription("Define a variable");

        const ui = nodeBuilder.createUIBuilder();
        ui.addTextInput({
            componentId: "name",
            label: "Name",
            defaultValue: "var",
            triggerUpdate: true,
        }, { multiline: false });

        ui.addNumberInput({
            componentId: "value",
            label: "Value",
            defaultValue: 0,
            triggerUpdate: true,
        }, {});

        ui.addBuffer({
            componentId: "id",
            label: "Id",
            defaultValue: { id: null },
            triggerUpdate: true,
        }, {});

        // ui.addTweakDial("tweaks", {});

        nodeBuilder.setUI(ui);

        nodeBuilder.setUIInitializer((x) => {
            const id = getId();
            return { id, name: id.slice(1) };
        });

        nodeBuilder.define(async (input, uiInput, from) => {
            // `name` is just used for debug output
            // `id` is the actual variable name
            const { id, name, value } = uiInput;

            return {
                var: { id, name, value },
                value
            };
        });

        nodeBuilder.addOutput("Ripple var", "var", "Var");
        nodeBuilder.addOutput("Ripple number", "value", "Value");
    },
    "if": (context) => {
        const nodeBuilder = context.instantiate("Ripple/Control", "if");
        nodeBuilder.setTitle("If");
        nodeBuilder.setDescription("Change flow based on a condition");

        nodeBuilder.define(async (input, uiInput, from) => {
            const { cond, tBody, fBody } = input;
            return {
                flow: {
                    globals: {
                        ...unpack(cond, tBody, fBody)
                    },
                    script: `\nif (${cond?.script ?? "false"}) {${tBody?.script ?? ""}} else {${fBody?.script ?? ""}}`
                }
            };
        });

        nodeBuilder.addInput("Ripple boolean", "cond", "Condition");
        nodeBuilder.addInput("Ripple flow", "tBody", "True Body");
        nodeBuilder.addInput("Ripple flow", "fBody", "False Body");
        nodeBuilder.addOutput("Ripple flow", "flow", "Flow");
    },
    "for": (context) => {
        const nodeBuilder = context.instantiate("Ripple/Control", "for");
        nodeBuilder.setTitle("For");
        nodeBuilder.setDescription("Loop flow a certain number of iterations");

        const ui = nodeBuilder.createUIBuilder();
        ui.addNumberInput({
            componentId: "count",
            label: "Count",
            defaultValue: 1,
            triggerUpdate: true,
        }, { min: 0, step: 1 });

        nodeBuilder.setUI(ui);

        nodeBuilder.define(async (input, uiInput, from) => {
            const { body, iters, counter } = input;
            const { count } = uiInput;

            const customCounter = counter?.id != null;
            const i = counter?.id ?? getId();

            const bodyVars = body?.globals?.vars ?? {};
            // TODO: Make flow into object
            // This will have to keep track of variables globally

            return {
                flow: {
                    globals: {
                        types: {},
                        vars: customCounter ? { [i]: counter, ...bodyVars } : bodyVars,
                    },
                    script: `\nfor (${counter?.id ?? "let " + i} = 0; ${i} < ${iters ?? count}; ${i}++) {${body?.script ?? ""}}`
                }
            };
        });

        nodeBuilder.addInput("Ripple flow", "body", "Body");
        nodeBuilder.addInput("Ripple number", "iters", "Iterations");
        nodeBuilder.addInput("Ripple var", "counter", "Counter");
        nodeBuilder.addOutput("Ripple flow", "flow", "Flow");
    },
    "log": (context) => {
        const nodeBuilder = context.instantiate("Ripple/Output", "log");
        nodeBuilder.setTitle("Log");

        const ui = nodeBuilder.createUIBuilder();
        ui.addTextInput({
            componentId: "message",
            label: "Message",
            defaultValue: "",
            triggerUpdate: true,
        }, { multiline: true });

        nodeBuilder.setUI(ui);

        nodeBuilder.define(async (input, uiInput, from) => {
            const { message } = uiInput;
            const { content, nextFlow } = input;

            return {
                flow: {
                    globals: {
                        types: {},
                        vars: nextFlow?.globals?.vars ?? {},
                    },
                    script: `\nlog(${content ?? JSON.stringify(message)});\n${nextFlow?.script ?? ""}`
                }
            };
        });

        nodeBuilder.setDescription("Log an output");

        nodeBuilder.addInput("Ripple string", "content", "content");
        nodeBuilder.addInput("Ripple flow", "nextFlow", "Next Flow");
        nodeBuilder.addOutput("Ripple flow", "flow", "Flow");
    },
    "type": (context) => {
        const nodeBuilder = context.instantiate("Ripple/Input", "type");
        nodeBuilder.setTitle("Create Type");
        nodeBuilder.setDescription("Create a Ripple type");
    },
    "compare": (context) => {
        const nodeBuilder = context.instantiate("Ripple/Functions", "compare");
        nodeBuilder.setTitle("Compare");
        nodeBuilder.setDescription("Compare two Ripple numbers");

        const ui = nodeBuilder.createUIBuilder();
        ui.addDropdown({
            componentId: "op",
            label: "Operation",
            defaultValue: ">",
            triggerUpdate: true,
        }, {
          options: {
            ">": ">",
            "≥": ">=",
            "<": "<",
            "≤": "<=",
            "=": "=",
          }
        });

        nodeBuilder.setUI(ui);

        nodeBuilder.define((input, uiInput, from) => {
            const { op } = uiInput;
            const { varA, varB } = input;

            let script;
            switch (op) {
                case ">":  script = `(${varA.id} > ${varB.id})`; break;
                case ">=": script = `(${varA.id} >= ${varB.id})`; break;
                case "<":  script = `(${varA.id} < ${varB.id})`; break;
                case "<=": script = `(${varA.id} <= ${varB.id})`; break;
                case "=":  script = `(${varA.id} === ${varB.id})`;
            };

            return {
                res: {
                    globals: {
                        types: {},
                        vars: {
                            [varA?.id]: varA,
                            [varB?.id]: varB
                        },
                    },
                    script
                }
            }
        });

        nodeBuilder.addInput("Ripple var", "varA", "Var A");
        nodeBuilder.addInput("Ripple var", "varB", "Var B");
        nodeBuilder.addOutput("Ripple boolean", "res", "Res");
    },
    "concat": (context) => {
        const nodeBuilder = context.instantiate("Ripple/Functions", "concat");
        nodeBuilder.setTitle("Concat");
        nodeBuilder.setDescription("Concatenate two Ripple strings");

        nodeBuilder.define(async (input, uiInput, from) => {
            const { strA, strB } = input;

            return { res: strA + strB };
        });

        nodeBuilder.addInput("Ripple string", "strA", "String A");
        nodeBuilder.addInput("Ripple string", "strB", "String B");
        nodeBuilder.addOutput("Ripple string", "res", "Res");
    },
    "instantiate": (context) => {
        const nodeBuilder = context.instantiate("Ripple/Input", "instantiate");
        nodeBuilder.setTitle("Instantiate");
        nodeBuilder.setDescription("Instantiate a Ripple type");
    },
    "program": (context) => {
        const nodeBuilder = context.instantiate("Ripple", "program");
        nodeBuilder.setTitle("Ripple Program");
        nodeBuilder.setDescription("Compile a Ripple program");

        const ui = nodeBuilder.createUIBuilder();

        nodeBuilder.define(async (input, uiInput, from) => {
            const { startFlow, tickFlow, endFlow } = input;
            const flows = [
                { flow: startFlow, event: "onStart" },
                { flow: tickFlow,  event: "onTick" },
                { flow: endFlow,   event: "onEnd" }
            ].filter((x) => x.flow != null);

            let program = "";

            for (const f of flows) {
                const globals = f.flow?.globals;
                if (!globals) continue;

                // Create global types
                // TODO

                // Create global vars
                if (globals.vars) {
                    for (const [id, varData] of Object.entries(globals.vars)) {
                        program += `let ${id} = ${varData.value};\n`;
                    }
                }
            }
            
            program += "\nreturn {";
            for (const f of flows) {
                program += `\n${f.event}: () => {${f.flow.script}},`;
            }
            program += "\n};";

            return {
                program
            };
        });

        nodeBuilder.setUI(ui);
        nodeBuilder.addInput("Ripple flow", "startFlow", "On Start");
        nodeBuilder.addInput("Ripple flow", "tickFlow", "On Tick");
        nodeBuilder.addInput("Ripple flow", "endFlow", "On End");
        nodeBuilder.addOutput("Ripple program", "program", "Program");
    },
}

const commands = {}
const tiles = {}

function init(context) {

    const programConfigurator = (data) => ({
        displayType: "webview",
        props: {
            renderer: `${context.pluginId}/rippleRenderer`,
            media: null
        },
        contentProp: "media"
    });

    const stringConfigurator = (data) => ({
        displayType: "textbox",
        props: {
            content: JSON.stringify(data, null, 2),
            align: "left"
        },
        contentProp: null
    });

    const programTypeBuilder = context.createTypeclassBuilder("Ripple program");
    programTypeBuilder.setDisplayConfigurator(programConfigurator);

    // Flows
    const flowTypeBuilder = context.createTypeclassBuilder("Ripple flow");
    flowTypeBuilder.setDisplayConfigurator(stringConfigurator);
    // flowTypeBuilder.setStyling({
    //     shape: "arrow-left",
    //     fill: "#f43e5c",
    //     stroke: "#000000"
    // });

    // Types
    const typeTypeBuilder = context.createTypeclassBuilder("Ripple type");
    typeTypeBuilder.setDisplayConfigurator(stringConfigurator);

    // Expressions
    const expressionTypeBuilder = context.createTypeclassBuilder("Ripple expression");
    expressionTypeBuilder.setDisplayConfigurator(stringConfigurator);

    // Variables
    const varTypeBuilder = context.createTypeclassBuilder("Ripple var");
    varTypeBuilder.setDisplayConfigurator(stringConfigurator);

    // Terms
    const termTypeBuilder = context.createTypeclassBuilder("Ripple term");
    termTypeBuilder.setDisplayConfigurator(stringConfigurator);

    const termBooleanTypeBuilder = context.createTypeclassBuilder("Ripple boolean");
    termBooleanTypeBuilder.setDisplayConfigurator(stringConfigurator);

    const termNumberTypeBuilder = context.createTypeclassBuilder("Ripple number");
    termNumberTypeBuilder.setDisplayConfigurator(stringConfigurator);

    const termStringTypeBuilder = context.createTypeclassBuilder("Ripple string");
    termStringTypeBuilder.setDisplayConfigurator(stringConfigurator);

}


module.exports = {
    nodes,
    commands,
    tiles,
    init
};