<script>
    import { onMount } from "svelte";
    import { goto } from "$app/navigation";
    import { setToken, userStore } from "$lib/api.js";

    onMount(() => {
        setToken(null);
        userStore.set(null);
        goto("/login");
    });
</script>

