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

// Format a string to an atomic Javascript value
function valToJS(value, type) {
    switch (type) {
        case "string":
            return `"${value}"`;
        case "number":
            return `${parseFloat(value, 10) || "0"}`;
        case "boolean":
            return ["1", "t", "y", "true", "yes", "on"].includes(value.toLowerCase()) ? "true" : "false";
    }
}

const nodes = {
    // Input Nodes
    "var": (context) => {
        const nodeBuilder = context.instantiate("Ripple/Input", "var");
        nodeBuilder.setTitle("Var");
        nodeBuilder.setDescription("Define a var");

        const ui = nodeBuilder.createUIBuilder();
        ui.addTextInput({
            componentId: "name",
            label: "Name",
            defaultValue: "string",
            triggerUpdate: false,
        }, { multiline: false });

        ui.addDropdown({
            componentId: "type",
            label: "Type",
            defaultValue: "string",
            triggerUpdate: true,
        }, {
          options: {
            "string": "string",
            "number": "number",
            "boolean": "boolean",
          }
        });

        ui.addTextInput({
            componentId: "value",
            label: "Value",
            defaultValue: "string",
            triggerUpdate: true,
        }, { multiline: false });

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
            const { id, name, value, type } = uiInput;
            switch(type){
                case "string": return { var: {id, value: `"${value}"` } };
                default: return { var: { id, value } };
            }
        });

        nodeBuilder.addOutput("Ripple var", "var", "Var");
    },
    // Control nodes
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

        nodeBuilder.addInput("Ripple var", "cond", "Condition");
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
        nodeBuilder.addInput("Ripple var", "iters", "Iterations");
        nodeBuilder.addInput("Ripple var", "counter", "Counter");
        nodeBuilder.addOutput("Ripple flow", "flow", "Flow");
    },
    //Output nodes
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
                    script: `\nlog(${JSON.stringify(message) + (content?.id != null ? ` + ": " + JSON.stringify(${content.id})` : '')});\n${nextFlow?.script ?? ''}`
                }
            };
        });

        nodeBuilder.setDescription("Log an output");

        nodeBuilder.addInput("Ripple var", "content", "content");
        nodeBuilder.addInput("Ripple flow", "nextFlow", "Next Flow");
        nodeBuilder.addOutput("Ripple flow", "flow", "Flow");
    },
    //Functions
    "type": (context) => {
        const nodeBuilder = context.instantiate("Ripple/Input", "type");
        nodeBuilder.setTitle("Create Type");
        nodeBuilder.setDescription("Create a Ripple type");
    },
        //Var functions
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
        nodeBuilder.addOutput("Ripple var", "res", "Res");
    },
        // String functions
    "concat": (context) => {
        const nodeBuilder = context.instantiate("Ripple/Functions", "concat");
        nodeBuilder.setTitle("Concat");
        nodeBuilder.setDescription("Concatenate two Ripple strings");

        nodeBuilder.define(async (input, uiInput, from) => {
            const { strA, strB } = input;

            return { res: `"${strA.replaceAll('"', '') + strB.replaceAll('"', '')}"` };
        });

        nodeBuilder.addInput("Ripple var", "strA", "String A");
        nodeBuilder.addInput("Ripple var", "strB", "String B");
        nodeBuilder.addOutput("Ripple var", "res", "Res");
    },

        // Logic functions
    "logic": (context) => {
        const nodeBuilder = context.instantiate("Ripple/Functions", "logic");
        nodeBuilder.setTitle("Logic");
        nodeBuilder.setDescription("Performs a logical operation (AND/OR/XOR) on two inputs and returns a single output");
      
        nodeBuilder.define((input, uiInputs, requiredOutputs) => {
            const { op } = uiInputs;
            const { boolA, boolB } = input;

            let script;
            switch (op) {
                case "and":  script = `(${boolA.id} && ${boolB.id})`; break;
                case "or": script = `(${boolA.id} || ${boolB.id})`; break;
                case "xor":  script = `(${boolA.id} !== ${boolB.id})`;
            };

            return {res: {
                    globals: {
                        types: {},
                        vars: {
                            [boolA?.id]: boolA,
                            [boolB?.id]: boolB
                        },
                    },
                    script
                }
            };
        });

        const ui = nodeBuilder.createUIBuilder();
        ui.addDropdown({
            componentId: "op",
            label: "Operation",
            defaultValue: "and",
            triggerUpdate: true,
        }, {
          options: {
            "And": "and",
            "Or": "or",
            "Xor": "xor",
          }
        });

        nodeBuilder.setUI(ui);
      
        nodeBuilder.addInput("Ripple var", "boolA", "A");
        nodeBuilder.addInput("Ripple var", "boolB", "B");
        nodeBuilder.addOutput("Ripple var", "res", "Result");
      },
      // Math functions
    "binary": (context) => {
        // TODO
        const nodeBuilder = context.instantiate("Ripple/Functions", "binary");
        nodeBuilder.setTitle("Binary Math");
        nodeBuilder.setDescription("Performs Binary math operations taking two number inputs and returning one number output");
      
        nodeBuilder.define((input, uiInput, requiredOutputs) => {
        
            const { op } = uiInput;
            const { num1, num2 } = input;

            switch (op) {
                case "add": return { res: num1 + num2             }
                case "subtract": return { res: num1 - num2        }
                case "multiply": return { res: num1 * num2        }
                case "divide": return { res: num2 === 0 ? 0 : num1 / num2 }
                case "power": return { res: Math.pow(num1, num2)  }
                case "modulo": return { res: num1 % num2          }
                case "max": return { res: Math.max(num1, num2)    }
                case "min": return { res: Math.min(num1, num2)    }
            }
        });

        const ui = nodeBuilder.createUIBuilder();
        ui.addDropdown({
            componentId: "operator",
            label: "Operator",
            defaultValue: "add",
            updateBackend: true,
        }, {
          options: {
            "Add": "add",
            "Subtract": "subtract",
            "Multiply": "multiply",
            "Divide": "divide",
            "Power": "power",
            "Modulo": "modulo",
            "Max": "max",
            "Min": "min"
          }
        });

        nodeBuilder.setUI(ui);
      
        nodeBuilder.addInput("Ripple var", "num1", "Num1");
        nodeBuilder.addInput("Ripple var", "num2", "Num2");
        nodeBuilder.addOutput("Ripple var", "res", "Result");
      },
    "instantiate": (context) => {
        const nodeBuilder = context.instantiate("Ripple/Input", "instantiate");
        nodeBuilder.setTitle("Instantiate");
        nodeBuilder.setDescription("Instantiate a Ripple type");
    },

    "assign": (context) => {

        const nodeBuilder = context.instantiate("Ripple/Control", "assign");
        nodeBuilder.setTitle("Assign");

        const ui = nodeBuilder.createUIBuilder();
        ui.addDropdown({
            componentId: "type",
            label: "Type",
            defaultValue: "string",
            triggerUpdate: true,
        }, {
          options: {
            "string": "string",
            "number": "number",
            "boolean": "boolean",
          }
        });

        ui.addTextInput({
            componentId: "value",
            label: "Value",
            defaultValue: "",
            triggerUpdate: true,
        }, { multiline: false });

        nodeBuilder.setUI(ui);

        nodeBuilder.setUIInitializer((x) => {
            const id = getId();
            return { id, name: id.slice(1) };
        });

        nodeBuilder.define(async (input, uiInput, from) => {
            const { message } = uiInput;
            const { content, nextFlow } = input;
            return {
                flow: {
                    globals: {
                        types: {},
                        vars: nextFlow?.globals?.vars ?? {},
                    },
                    script: `\nlog(${JSON.stringify(message) + (content?.value != null ? ` + ": " + JSON.stringify(${content.value})` : '')});\n${nextFlow?.script ?? ''}`
                }
            };
        });

        nodeBuilder.define(async (input, uiInput, from) => {
            const { id, value, type } = uiInput;
            const { content, nextFlow } = input;
            const vars = nextFlow?.globals?.vars ?? {};
        });

        nodeBuilder.setDescription("Log an output");

        nodeBuilder.addInput("Ripple var", "content", "content");
        nodeBuilder.addInput("Ripple var", "content", "content");
        nodeBuilder.addInput("Ripple flow", "nextFlow", "Next Flow");
        nodeBuilder.addOutput("Ripple flow", "flow", "Flow");
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

    // const termBooleanTypeBuilder = context.createTypeclassBuilder("Ripple boolean");
    // termBooleanTypeBuilder.setDisplayConfigurator(stringConfigurator);

    // const termNumberTypeBuilder = context.createTypeclassBuilder("Ripple number");
    // termNumberTypeBuilder.setDisplayConfigurator(stringConfigurator);

    // const termStringTypeBuilder = context.createTypeclassBuilder("Ripple string");
    // termStringTypeBuilder.setDisplayConfigurator(stringConfigurator);

}


module.exports = {
    nodes,
    commands,
    tiles,
    init
};