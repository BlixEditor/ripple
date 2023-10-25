<script lang="ts">
    import { Canvas, T } from "@threlte/core";
    import Scene from "./Scene.svelte";
    import { onMount } from "svelte";
    import BlankScene from "./BlankScene.svelte";
    import Code from "./Code.svelte";

    export let media: any;

    const tabs = {
        "3d": {
            name: "3D",
            icon: ""
        },
        "code1": {},
        "code2": {},
        "code3": {},
        "code": {
            name: "Code",
            icon: ""
        }
    };
    let selectedTab = "code";

    $: reload($media);

    function reload(media: any) {
        // if (media) { window.location.reload(); }
    }

    let logData = [];

    function log(msg: string | null) {
        if (msg === null) {
            logData = [];
            return;
        }
        logData = [...logData, msg];
    }
</script>

<div class="tabs">
    {#each Object.keys(tabs) as tab}
    <div class="tab {selectedTab == tab ? 'selected' : ''}" on:click="{() => {selectedTab = tab}}">
        {tabs[tab].name ?? tab}
    </div>
    {/each}
</div>
<div class="container">
    {#key $media}
    {#if selectedTab == "3d"}
    <Canvas>
        {#if $media}
        <Scene script={$media} {log} />
        {:else}
        <BlankScene />
        {/if}
    </Canvas>
    {:else if selectedTab == "code"}
    <Code script={$media} />
    {/if}
    {/key}
</div>

<code>Media:<br />{$media}<br /><br />Log:<br />{#each logData as str} {str}<br />{/each}</code>

<style>
    .container {
        position: absolute;
        margin: 0px;
        padding: 0px;
        top: 2em;

        width: 100%;
        height: calc(100%-2em);
        /* border: 1px solid blue; */
    }

    .tabs {
        position: absolute;
        display: flex;
        margin: 0px;
        padding: 0px;
        top: 0px;

        flex-direction: row-reverse;

        width: 100%;
        height: 1.4em;
        /* border: 1px solid red; */
        border-bottom: 1px solid grey;
    }

    .tab {
        position: relative;
        background-color: #11111b;
        border: 1px solid grey;
        padding: 0.2em;
        margin-right: 0.1em;

        min-width: 3em;
        text-align: center;
        color: white;
        border-radius: 0.6em 0.6em 0px 0px;

        cursor: pointer;
    }

    .selected {
        background-color: grey;
    }

    code { 
        position: absolute;
        top: 1em;
        left: 1em;
        color: white;
        white-space: pre-wrap;
    }
</style>