<!doctype html>
<html <?php language_attributes(); ?>>
<head>
    <meta charset="<?php bloginfo( 'charset' ); ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title><?php bloginfo( 'name' ); ?> — DEX</title>
<?php
// Enqueue Vite-built CSS
$css = UNIFACTORY_BASE_DIR . '/build/assets/app.css'; // renamed from index.css by Vite WP build
if ( file_exists( $css ) ) :
?>
    <link rel="stylesheet" href="<?php echo esc_url( UNIFACTORY_URL . 'build/assets/app.css' ); ?>?v=<?php echo UNIFACTORY_VER; ?>">
<?php endif; ?>
</head>
<body>
<noscript>You need to enable JavaScript to run this app.</noscript>
<div id="root"></div>
<?php
// Load Vite entry point (ES module, relative paths work from plugin URL)
$js = UNIFACTORY_BASE_DIR . '/build/app.js';
if ( file_exists( $js ) ) :
?>
<script type="module" src="<?php echo esc_url( UNIFACTORY_URL . 'build/app.js' ); ?>?v=<?php echo UNIFACTORY_VER; ?>"></script>
<?php else : ?>
<p style="color:red;text-align:center;margin-top:40px">
    UniFactory DEX build files not found. Please re-install the plugin.
</p>
<?php endif; ?>
<?php wp_footer(); ?>
</body>
</html>
