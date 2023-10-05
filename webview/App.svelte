<script lang="ts">
    import { Canvas, T } from "@threlte/core";
    import Scene from "./Scene.svelte";
    import { onMount } from "svelte";

    export let media: any;

    $: reload($media);

    function reload(media: any) {
        // if (media) { window.location.reload(); }
    }

    let logData = [];


    onMount(() => {
        return;
        function log(msg: string) {
            logData = [...logData, msg];
        }

        // exec($media);
    });
</script>

<div class="container">
    {#key $media}
    <Canvas>
        <Scene />
    </Canvas>
    {/key}
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
        position: absolute;
        top: 1em;
        left: 1em;
        color: white;
    }
</style>