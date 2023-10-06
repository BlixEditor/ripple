<script lang="ts">
    import { Canvas, T } from "@threlte/core";
    import Scene from "./Scene.svelte";
    import { onMount } from "svelte";
    import BlankScene from "./BlankScene.svelte";

    export let media: any;

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

<div class="container">
    {#key $media}
    <Canvas>
        {#if $media}
        <Scene script={$media} {log} />
        {:else}
        <BlankScene />
        {/if}
    </Canvas>
    {/key}
</div>

<code>Media:<br />{$media}<br /><br />Log:<br />{#each logData as str} {str}<br />{/each}</code>

<style>
    .container {
        position: absolute;
        margin: 0px;
        padding: 0px;
        width: 100%;
        height: 100%;
        /* border: 1px solid blue; */
    }

    code { 
        position: absolute;
        top: 1em;
        left: 1em;
        color: white;
        white-space: pre-wrap;
    }
</style>