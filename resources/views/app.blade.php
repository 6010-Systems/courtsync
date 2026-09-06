<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        <title inertia>{{ config('app.name', 'CourtSync') }}</title>

        <!-- Fonts & Preload -->
        <link rel="preload" href="/fonts/Quicksand/Quicksand-VariableFont_wght.ttf" as="font" type="font/ttf" crossorigin>
        <link rel="preload" href="/fonts/Poppins/Poppins-Bold.ttf" as="font" type="font/ttf" crossorigin>
        <link rel="preload" href="/fonts/Poppins/Poppins-SemiBold.ttf" as="font" type="font/ttf" crossorigin>
        <link rel="preload" href="/fonts/Poppins/Poppins-Black.ttf" as="font" type="font/ttf" crossorigin>
        <link rel="preload" href="/fonts/Poppins/Poppins-Regular.ttf" as="font" type="font/ttf" crossorigin>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800;900&family=Quicksand:wght@400;500;600;700&display=swap" rel="stylesheet">

        <!-- Scripts -->
        @routes
        @viteReactRefresh
        @vite(['resources/js/app.jsx', "resources/js/Pages/{$page['component']}.jsx"])
        @inertiaHead
    </head>
    <body class="font-sans antialiased">
        @inertia
    </body>
</html>
