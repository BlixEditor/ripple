<script lang="ts">
  export let script = "";
  export let log: (msg: string | null) => void = () => {};
</script>


<code>
    {script}
</code>

<style>
    code {
        color: grey;
    }
</style>