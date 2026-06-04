<script>
    import { onMount } from "svelte";

    let { selector = ".reveal", once = true, rootMargin = "0px 0px -40px 0px" } = $props();

    onMount(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add("visible");
                        once && observer.unobserve(entry.target);
                    } else if (!once) {
                        entry.target.classList.remove("visible");
                    }
                });
            },
            { threshold: 0.1, rootMargin }
        );

        const observeElements = (container) => {
            const elements = container.querySelectorAll(selector);
            elements.forEach((el) => {
                if (once && el.classList.contains("visible")) return;
                observer.observe(el);
            });
        };

        if (typeof document !== "undefined") {
            observeElements(document);
        }

        const mutationObserver = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                if (mutation.addedNodes.length) {
                    for (const node of mutation.addedNodes) {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            if (node.matches && node.matches(selector)) {
                                if (!(once && node.classList.contains("visible"))) {
                                    observer.observe(node);
                                }
                            }
                            observeElements(node);
                        }
                    }
                }
            }
        });

        if (typeof document !== "undefined" && document.body) {
            mutationObserver.observe(document.body, {
                childList: true,
                subtree: true
            });
        }

        return () => {
            observer.disconnect();
            mutationObserver.disconnect();
        };
    });
</script>

<slot />

