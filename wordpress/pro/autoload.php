<?php
defined( 'ABSPATH' ) || exit;

/**
 * PSR-4 Autoloader for UniFactory
 *
 * Automatically loads classes from the UniFactory namespace.
 */
spl_autoload_register( function ( $class ) {

	if ( strpos( $class, 'UniFactory' ) !== false ) {
		require __DIR__ . '/../' . str_replace( [ '\\', 'UniFactory' ], [ '/', 'pro' ], $class ) . '.php';
	}
} );

/**
 * Auto-instantiate all controllers
 */
foreach ( glob( __DIR__ . '/Controllers/*.php' ) as $file ) {
	$class = '\\UniFactory\Controllers\\' . basename( $file, '.php' );
	if ( class_exists( $class ) ) {
		$obj = new $class;
	}
}
