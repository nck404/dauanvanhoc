<script>
    import { onMount } from "svelte";
    import LamDongMap from "$lib/components/LamDongMap.svelte";

    onMount(() => {
        document.body.classList.add("paper-theme");
        return () => {
            document.body.classList.remove("paper-theme");
        };
    });
</script>

<svelte:head>
    <title>Bản đồ Văn học Dân tộc - Dấu Ấn Văn Học</title>
</svelte:head>

<div class="side-rail left">
    <div class="rail-text">Bản đồ Văn học Dân tộc</div>
</div>
<div class="side-rail right">
    <div class="rail-text">Vol. 01 / Số 01 - MMXXVI</div>
</div>

<div class="page-container">
    <header class="page-header reveal">
        <div class="header-label">
            <span class="header-label-bar"></span>
            <span>Văn học các Dân tộc</span>
        </div>
        
        <h1 class="page-title">
            Bản đồ <em class="page-accent">Văn học</em> Dân tộc Tây Nguyên & Duyên hải<span class="page-dot">.</span>
        </h1>
        
        <p class="page-lead">
            Khám phá kho tàng văn học dân gian, truyền thuyết và sử thi theo từng dân tộc: người Mạ (Lâm Đồng cũ), người M'nông (Đắk Nông cũ) và người Chăm (Bình Thuận cũ).
        </p>
    </header>

    <LamDongMap />
</div>

<style>
    .page-container {
        max-width: 1280px;
        margin: 0 auto;
        padding: 48px 24px;
    }
</style>
