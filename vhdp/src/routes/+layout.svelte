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
    import { userStore, loadUser, apiFetch } from "$lib/api.js";

    let { children } = $props();

    let loading = $state(false);
    let timer = null;
    let initialized = $state(false);
    let currentUser = $state(null);
    let activeTimeText = $state("");
    let totalSaved = $state(0);

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
        
        // Update stats counter
        const startTime = new Date("2026-05-04T00:00:00");
        const updateCounter = () => {
            const now = new Date();
            const diff = now - startTime;
            if (diff < 0) return;
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            activeTimeText = `${days} ngày`;
        };
        updateCounter();
        const counterInterval = setInterval(updateCounter, 1000);
        
        // Fetch total saved count
        try {
            const res = await apiFetch("/api/homepage");
            if (res.ok) {
                const data = await res.json();
                totalSaved = data.totalSaved || 0;
            }
        } catch (e) {
            console.error(e);
        }
        
        timer = setTimeout(() => {
            loading = false;
        }, 400);
        
        return () => {
            clearTimeout(timer);
            clearInterval(counterInterval);
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
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&family=Playfair+Display:ital,wght@0,400;0,600;0,700;0,900;1,400;1,700&family=Lora:ital,wght@0,400;0,600;1,400&display=swap');
    </style>
</svelte:head>

<Background />
<PageLoader bind:visible={loading} />

{#if initialized}
    <Navbar user={currentUser} activeTime={activeTimeText} totalSaved={totalSaved} />

    <main class="main-content dot-grid-bg" class:auth-layout={isAuthPage}>
        <ScrollReveal>
            {@render children()}
        </ScrollReveal>
    </main>
{/if}

<style>
    .main-content {
        position: relative;
        z-index: 1;
        padding-top: 80px;
        min-height: 100vh;
    }
    .main-content.auth-layout {
        padding-top: 0;
    }
</style>
