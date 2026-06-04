<script>
    import { onMount } from "svelte";
    import "./layout.css";
    import Navbar from "$lib/Navbar.svelte";
    import favicon from "$lib/assets/favicon.svg";
    import Background from "$lib/components/Background.svelte";
    import PageLoader from "$lib/components/PageLoader.svelte";
    import ScrollReveal from "$lib/components/ScrollReveal.svelte";
    import { beforeNavigate, afterNavigate, goto } from "$app/navigation";
    import { page } from "$app/state";
    import { userStore, loadUser } from "$lib/api.js";

    let { children } = $props();

    let loading = $state(false);
    let timer = null;
    let initialized = $state(false);
    let currentUser = $state(null);

    userStore.subscribe((val) => {
        currentUser = val;
    });

    beforeNavigate(() => {
        clearTimeout(timer);
        loading = true;
    });

    afterNavigate(() => {
        timer = setTimeout(() => {
            loading = false;
        }, 350);
    });

    onMount(async () => {
        await loadUser();
        initialized = true;
        timer = setTimeout(() => {
            loading = false;
        }, 400);
        return () => {
            clearTimeout(timer);
        };
    });

    let isAuthPage = $derived(page.url.pathname === "/login" || page.url.pathname === "/register");

    $effect(() => {
        if (!initialized) return;
        const pathname = page.url.pathname;
        const isAuth = pathname === "/login" || pathname === "/register";
        const isAdminPath = pathname.startsWith("/admin");

        if (!currentUser && !isAuth) {
            goto(`/login?callback=${encodeURIComponent(pathname + page.url.search)}`);
        } else if (currentUser && isAuth) {
            goto("/");
        } else if (isAdminPath && currentUser?.role !== "admin") {
            goto("/");
        }
    });
</script>

<svelte:head>
    <link rel="icon" href={favicon} />
    <title>Văn học địa phương Media</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300..700&family=Playfair+Display:ital,wght@0,400..900;1,400..900&display=swap');
    </style>
</svelte:head>

<Background />
<PageLoader bind:visible={loading} />

{#if initialized}
    <Navbar user={currentUser} />

    <main class="main-content" class:auth-layout={isAuthPage}>
        <ScrollReveal>
            {@render children()}
        </ScrollReveal>
    </main>
{/if}

<style>
    .main-content {
        position: relative;
        z-index: 1;
        padding-top: 100px;
        min-height: 100vh;
    }
    .main-content.auth-layout {
        padding-top: 0;
    }
</style>

