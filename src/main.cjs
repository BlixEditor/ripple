// Use UI input if anchor not defined
function chooseInput(input, uiInput, inputKey) {
    if (input[inputKey]) {
        return input[inputKey];
    }
    return uiInput[inputKey];
}

function id() {
    return "_" + Math.random().toString(36).substr(2, 9); 
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
        }, { multiline: false } );

        ui.addNumberInput({
            componentId: "value",
            label: "Value",
            defaultValue: 0,
            triggerUpdate: true,
        }, {} );

        // TODO: Add id buffer
        ui.addBuffer({
            componentId: "id",
            label: "Id",
            defaultValue: { id: "_id" },
            triggerUpdate: true,
        }, {} );

        nodeBuilder.setUIInitializer((x) => {
            const id = id();
            return { id: { id }, name: id.slice(1) };
        });

        nodeBuilder.setUI(ui);

        nodeBuilder.define(async (input, uiInput, from) => {
            // `name` is just used for debug output
            // `id` is the actual variable name
            const { id, name, value } = uiInput;

            return {
                var: {
                    data: { id, name },
                    code: `${id} = ${value};`
                },
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
            const { condition, tBody, fBody } = input;
            return { flow: `if (${condition ?? "false"}) {${tBody ?? ""}} else {${fBody ?? ""}}` };
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
        }, { min: 0, step: 1 } );

        nodeBuilder.setUI(ui);

        nodeBuilder.define(async (input, uiInput, from) => {
            const { body, iters, counter } = input;
            const { count } = uiInput;
            const i = counter?.data?.id ?? id();

            // TODO: Make flow into object
            // This will have to keep track of variables globally

            return { flow: `for (${counter?.data?.id ?? "let " + i} = 0; ${i} < ${iters ?? count}; ${i}++) {${body ?? ""}}` };
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

            return { flow: `log(${content ?? JSON.stringify(message)});\n${nextFlow ?? ""}` };
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
            return { program: `
const onStart = () => { ${startFlow} };
const onTick  = () => { ${tickFlow} };
const onEnd   = () => { ${endFlow} };`
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
            content: null
        },
        contentProp: "content",
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