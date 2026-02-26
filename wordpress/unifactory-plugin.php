<?php
/**
Plugin Name: UniFactory - DEX
Description: Decentralized exchange (DEX) built on Uniswap V2 fork for EVM blockchains
Author: NoxonThemes
Author URI: https://onout.org
Requires PHP: 7.4
Text Domain: unifactory
Domain Path: /lang
Version: 1.0.0
*/

/* Define Plugin Constants */
defined( 'ABSPATH' ) || exit;

define( 'UNIFACTORY_TEMPLATE_DIR', __DIR__ . '/templates' );
define( 'UNIFACTORY_BASE_DIR', __DIR__ );
define( 'UNIFACTORY_BASE_FILE', __FILE__ );
define( 'UNIFACTORY_VER', '1.0.0' );
define( 'UNIFACTORY_URL', plugin_dir_url( __FILE__ ) );
define( 'UNIFACTORY_PATH', plugin_dir_path( __FILE__ ) );

/**
 * Plugin Init - Load autoloader and controllers
 */
require __DIR__ . '/pro/autoload.php';

/**
 * Permalink setup for standalone page
 */
function unifactory_default_slug() {
	return 'dex';
}

function unifactory_page_slug() {
	$slug = unifactory_default_slug();
	if ( get_option( 'unifactory_slug' ) ) {
		$slug = get_option( 'unifactory_slug' );
	}
	return esc_html( $slug );
}

function unifactory_page_url() {
	$page_url = home_url( '/' . unifactory_page_slug() . '/' );
	return esc_url( trailingslashit( $page_url ) );
}

add_filter( 'query_vars', function( $vars ) {
	$vars[] = 'unifactory_page';
	return $vars;
} );

function unifactory_add_rewrite_rules() {
	$slug = 'dex';
	if ( get_option( 'unifactory_slug' ) ) {
		$slug = get_option( 'unifactory_slug' );
	}
	global $wp_rewrite;
	$wp_rewrite->flush_rules();
	add_rewrite_rule( $slug . '/?$', 'index.php?unifactory_page=1', 'top' );
}
add_action( 'init', 'unifactory_add_rewrite_rules' );

function unifactory_include_template( $template ) {
	if ( get_query_var( 'unifactory_page' ) ) {
		$template = UNIFACTORY_TEMPLATE_DIR . DIRECTORY_SEPARATOR . "main.php";
	}
	return $template;
}
add_filter( 'template_include', 'unifactory_include_template' );

/**
 * Shortcode support
 */
function unifactory_shortcode( $attrs ) {
	ob_start();
	?>
	<div class="unifactory_widget">
		<?php include UNIFACTORY_TEMPLATE_DIR . DIRECTORY_SEPARATOR . "widget.php"; ?>
	</div>
	<?php
	return ob_get_clean();
}
add_shortcode( 'unifactory_widget', 'unifactory_shortcode' );

/**
 * Page template support
 */
function unifactory_page_template( $page_template ) {
	if ( get_page_template_slug() == 'unifactory_pagetemplate' ) {
		$page_template = UNIFACTORY_TEMPLATE_DIR . DIRECTORY_SEPARATOR . "main.php";
	}
	return $page_template;
}
add_filter( 'page_template', 'unifactory_page_template' );

function unifactory_custom_template( $single ) {
	global $post;
	$meta = get_post_meta( $post->ID );
	if ( isset( $meta['_wp_page_template'] ) && isset( $meta['_wp_page_template'][0] ) && ( $meta['_wp_page_template'][0] == 'unifactory_pagetemplate' ) ) {
		$single = UNIFACTORY_TEMPLATE_DIR . DIRECTORY_SEPARATOR . "main.php";
	}
	return $single;
}
add_filter( 'single_template', 'unifactory_custom_template' );

function unifactory_add_template_to_select( $post_templates, $wp_theme, $post, $post_type ) {
	$post_templates['unifactory_pagetemplate'] = __( 'UniFactory DEX', 'unifactory' );
	return $post_templates;
}
add_filter( 'theme_page_templates', 'unifactory_add_template_to_select', 10, 4 );
add_filter( 'theme_post_templates', 'unifactory_add_template_to_select', 10, 4 );

/**
 * Prepare vendor files (React build artifacts)
 */
function unifactory_prepare_vendor() {
	$version = UNIFACTORY_VER ? UNIFACTORY_VER : 'no';
	$SEP = DIRECTORY_SEPARATOR;

	$cache_dir = UNIFACTORY_BASE_DIR . $SEP . 'vendor_cache' . $SEP . UNIFACTORY_VER . $SEP;
	$vendor_source = UNIFACTORY_BASE_DIR . $SEP . 'vendor_source' . $SEP . 'static' . $SEP . 'js' . $SEP;

	if ( ! file_exists( $cache_dir ) ) {
		if ( ! file_exists( $vendor_source ) ) {
			return;
		}

		$js_files = scandir( $vendor_source );
		mkdir( $cache_dir, 0777, true );

		foreach ( $js_files as $file ) {
			if ( is_file( $vendor_source . $file ) ) {
				$filename = basename( $file );
				$file_ext = explode( ".", $filename );
				$file_ext = strtoupper( $file_ext[ count( $file_ext ) - 1 ] );

				if ( $file_ext === 'JS' ) {
					$source = file_get_contents( $vendor_source . $filename );
					$modified = str_replace(
						array(
							'static/js/',
							'./images/',
							'images/',
							'n.p+"static/media/',
							'"./locales/'
						),
						array(
							UNIFACTORY_URL . 'vendor_cache/' . UNIFACTORY_VER . '/static/js/',
							'images/',
							UNIFACTORY_URL . 'vendor_source/images/',
							'"' . UNIFACTORY_URL . 'vendor_source/static/media/',
							'"' . UNIFACTORY_URL . 'vendor_source/locales/'
						),
						$source
					);
					file_put_contents( $cache_dir . $filename, $modified );
					chmod( $cache_dir . $filename, 0777 );
				}
			}
		}
	}
}

/**
 * Enqueue admin scripts and styles
 */
function unifactory_admin_enqueue_scripts() {
	wp_enqueue_media();
	wp_enqueue_script(
		"unifactory-admin",
		esc_url( plugins_url( '/assets/js/admin.js', UNIFACTORY_BASE_FILE ) ),
		array( "jquery" ),
		UNIFACTORY_VER,
		true
	);
	wp_enqueue_style(
		"unifactory-admin",
		esc_url( plugins_url( '/assets/css/admin.css', UNIFACTORY_BASE_FILE ) ),
		array(),
		UNIFACTORY_VER
	);
}
add_action( 'admin_enqueue_scripts', 'unifactory_admin_enqueue_scripts', 500 );

/**
 * Load the plugin text domain for translation
 */
function unifactory_load_plugin_textdomain() {
	load_plugin_textdomain( 'unifactory', false, dirname( plugin_basename( __FILE__ ) ) . '/lang/' );
}
add_action( 'plugins_loaded', 'unifactory_load_plugin_textdomain' );

/**
 * Plugin activation hook
 */
function unifactory_activate() {
	unifactory_add_rewrite_rules();
	flush_rewrite_rules();
}
register_activation_hook( __FILE__, 'unifactory_activate' );

/**
 * Plugin deactivation hook
 */
function unifactory_deactivate() {
	flush_rewrite_rules();
}
register_deactivation_hook( __FILE__, 'unifactory_deactivate' );
