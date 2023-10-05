<script>
    import { Canvas, T } from "@threlte/core";
    import Scene from "./Scene.svelte";
    import { exec } from "child_process";
    import { onMount } from "svelte";

    export let media;

    $: reload($media);

    function reload(media) {
        if (media) { window.location.reload(); }
    }

    let logData = [];


    onMount(() => {
        return;
        function log(str) {
            logData = [...logData, str];
        }

        exec($media);
    });
</script>

<div class="container">
    <Canvas>
        <Scene />
    </Canvas>
</div>

<code>
    Media: {JSON.stringify($media)}
    Log: {#each logData as str} {str} <br /> {/each}
</code>

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
        color: white;
    }
</style>