<script lang="ts">
  import { T } from '@threlte/core'
  import { onMount } from 'svelte';

  export let script = "";
  export let log: (msg: string | null) => void = () => {};

  onMount(() => {
    if (!script || typeof script !== "string") return;
    log(null);

    try {
      const { onStart, onTick, onEnd } = new Function("log", script)(log);
      console.log("RES", onStart, onTick, onEnd);
      if (onStart) onStart();

    } catch (e) {
      console.error("SCRIPT ERR:", e);
    }
  });
</script>

<T.PerspectiveCamera
  makeDefault
  position={[10, 10, 10]}
  on:create={({ ref }) => {
    ref.lookAt(0, 1, 0)
  }}
/>

<T.DirectionalLight position={[0, 10, 10]} castShadow intensity={3} />

<T.Mesh rotation.x={-Math.PI/2} receiveShadow>
  <T.CircleGeometry args={[4, 40]}/>
  <T.MeshStandardMaterial color="#1e1e2e" />
</T.Mesh>