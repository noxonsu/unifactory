<?php
/**
 * Plugin Name: UniFactory DEX
 * Description: White-label Uniswap V3 decentralized exchange for WordPress
 * Author: Noxon Digital
 * Requires PHP: 7.4
 * Text Domain: unifactory-dex
 * Domain Path: /lang
 * Version: 3.26.0305
 */

defined( 'ABSPATH' ) || exit;

define( 'UNIFACTORY_TEMPLATE_DIR', __DIR__ . '/templates' );
define( 'UNIFACTORY_BASE_DIR', __DIR__ );
define( 'UNIFACTORY_BASE_FILE', __FILE__ );
define( 'UNIFACTORY_VER', '3.26.0305' );
define( 'UNIFACTORY_URL', plugin_dir_url( __FILE__ ) );

// ── Permalink helpers ──────────────────────────────────────────────────────

function unifactory_default_slug() {
	return 'dex';
}

function unifactory_page_slug() {
	$slug = get_option( 'unifactory_slug' ) ?: unifactory_default_slug();
	return esc_html( $slug );
}

function unifactory_page_url() {
	return esc_url( trailingslashit( home_url( '/' . unifactory_page_slug() . '/' ) ) );
}

// ── Rewrite rules ──────────────────────────────────────────────────────────

add_filter( 'query_vars', function ( $vars ) {
	$vars[] = 'unifactory_page';
	return $vars;
} );

function unifactory_add_rewrite_rules() {
	$slug = unifactory_page_slug();
	// Match slug and any sub-path (for HashRouter: /dex/#/swap)
	add_rewrite_rule( $slug . '/?.*$', 'index.php?unifactory_page=1', 'top' );
}
add_action( 'init', 'unifactory_add_rewrite_rules' );

// ── Template override ──────────────────────────────────────────────────────

function unifactory_include_template( $template ) {
	if ( get_query_var( 'unifactory_page' ) ) {
		return UNIFACTORY_TEMPLATE_DIR . '/home.php';
	}
	return $template;
}
add_filter( 'template_include', 'unifactory_include_template' );

// ── Admin settings ─────────────────────────────────────────────────────────

function unifactory_save_settings() {
	if ( isset( $_POST['unifactory_save_setting'] ) && current_user_can( 'manage_options' ) ) {
		if ( isset( $_POST['unifactory_slug'] ) ) {
			update_option( 'unifactory_slug', sanitize_text_field( $_POST['unifactory_slug'] ) );
		}
		flush_rewrite_rules();
	}
}
add_action( 'admin_init', 'unifactory_save_settings' );

function unifactory_admin_menu() {
	add_menu_page(
		'UniFactory DEX',
		'UniFactory DEX',
		'manage_options',
		'unifactory-dex',
		'unifactory_settings_page',
		'dashicons-money-alt'
	);
}
add_action( 'admin_menu', 'unifactory_admin_menu' );

function unifactory_settings_page() {
	include UNIFACTORY_TEMPLATE_DIR . '/settings.php';
}

// ── i18n ───────────────────────────────────────────────────────────────────

function unifactory_load_textdomain() {
	load_plugin_textdomain( 'unifactory-dex', false, dirname( plugin_basename( __FILE__ ) ) . '/lang/' );
}
add_action( 'plugins_loaded', 'unifactory_load_textdomain' );

// ── Activation: flush rewrite rules ───────────────────────────────────────

register_activation_hook( __FILE__, function () {
	unifactory_add_rewrite_rules();
	flush_rewrite_rules();
} );

register_deactivation_hook( __FILE__, function () {
	flush_rewrite_rules();
} );
