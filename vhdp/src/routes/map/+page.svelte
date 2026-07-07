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
    <title>Bản đồ Văn học 3 Tỉnh - Dấu Ấn Văn Học</title>
</svelte:head>

<div class="side-rail left">
    <div class="rail-text">Bản đồ Văn học 3 Tỉnh</div>
</div>
<div class="side-rail right">
    <div class="rail-text">Vol. 01 / Sổ Số 01 - MMXXVI</div>
</div>

<div class="page-container">
    <header class="page-header reveal">
        <div class="header-label">
            <span class="header-label-bar"></span>
            <span>Bản đồ Tuyến điểm</span>
        </div>
        
        <h1 class="page-title">
            Địa lý <em class="page-accent">Văn học</em> Nam Tây Nguyên & Duyên hải<span class="page-dot">.</span>
        </h1>
        
        <p class="page-lead">
            Khám phá kho tàng văn học dân gian, truyền thuyết và sử thi theo từng địa danh cụ thể trên bản đồ các tỉnh Lâm Đồng, Đắk Nông và Bình Thuận.
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
