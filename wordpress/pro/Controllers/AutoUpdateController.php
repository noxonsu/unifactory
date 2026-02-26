<?php

namespace UniFactory\Controllers;

/**
 * AutoUpdateController
 *
 * Handles automatic plugin updates from a custom update server.
 */
class AutoUpdateController {

	const INFO_URL = 'https://onout.org/api/unifactory/info.json';
	const PLUGIN_SLUG = 'unifactory-plugin';
	const TRANSIENT_SLUG = 'unifactory_upgrade_plugin';

	public function __construct() {
		add_action( 'plugins_api', function( $res, $action, $args ) {
			return $this->setUpdateInfo( $res, $action, $args );
		}, 200, 3 );
		add_filter( 'site_transient_update_plugins', [ $this, 'pushUpdate' ] );
		add_filter( 'transient_update_plugins', [ $this, 'pushUpdate' ] );
		add_action( 'upgrader_process_complete', [ $this, 'afterUpdate' ], 10, 2 );
		add_action( 'current_screen', [ $this, 'updateForceCheck' ] );
	}

	public function setUpdateInfo( $res, $action, $args ) {

		if ( 'plugin_information' !== $action ) {
			return false;
		}

		if ( self::PLUGIN_SLUG !== $args->slug ) {
			return false;
		}

		if ( false == $remote = get_transient( self::TRANSIENT_SLUG ) ) {
			$remote = wp_remote_get( self::INFO_URL, array(
				'timeout' => 10,
				'headers' => array(
					'Accept' => 'application/json',
				),
			) );

			if ( ! is_wp_error( $remote ) && isset( $remote['response']['code'] ) && $remote['response']['code'] == 200 && ! empty( $remote['body'] ) ) {
				set_transient( self::TRANSIENT_SLUG, $remote, HOUR_IN_SECONDS );
			}
		}

		if ( ! is_wp_error( $remote ) && isset( $remote['response']['code'] ) && $remote['response']['code'] == 200 && ! empty( $remote['body'] ) ) {

			$remote = json_decode( $remote['body'] );
			$res = new \stdClass();

			$res->name           = $remote->name;
			$res->slug           = self::PLUGIN_SLUG;
			$res->version        = $remote->version;
			$res->tested         = $remote->tested;
			$res->requires       = $remote->requires;
			$res->author         = 'NoxonThemes';
			$res->author_profile = 'https://onout.org';
			$res->download_link  = $remote->download_url;
			$res->trunk          = $remote->download_url;
			$res->requires_php   = $remote->requires_php;
			$res->last_updated   = $remote->last_updated;
			$res->sections       = array(
				'description'  => $remote->sections->description,
				'installation' => $remote->sections->installation,
				'changelog'    => $remote->sections->changelog,
			);

			if ( ! empty( $remote->sections->screenshots ) ) {
				$res->sections['screenshots'] = $remote->sections->screenshots;
			}

			return $res;
		}

		return false;
	}

	public function pushUpdate( $transient ) {

		if ( empty( $transient->checked ) ) {
			return $transient;
		}

		if ( false == $remote = get_transient( self::TRANSIENT_SLUG ) ) {
			$remote = wp_remote_get( self::INFO_URL,
				array(
					'timeout' => 10,
					'headers' => array(
						'Accept' => 'application/json',
					),
				)
			);

			if ( ! is_wp_error( $remote ) && isset( $remote['response']['code'] ) && $remote['response']['code'] == 200 && ! empty( $remote['body'] ) ) {
				set_transient( self::TRANSIENT_SLUG, $remote, 43200 );
			}
		}

		if ( $remote ) {
			$remote = json_decode( $remote['body'] );

			if ( $remote && version_compare( UNIFACTORY_VER, $remote->version, '<' ) && version_compare( $remote->requires, get_bloginfo( 'version' ), '<' ) ) {
				$res                               = new \stdClass();
				$res->slug                         = self::PLUGIN_SLUG;
				$res->plugin                       = self::PLUGIN_SLUG . '/' . self::PLUGIN_SLUG . '.php';
				$res->new_version                  = $remote->version;
				$res->tested                       = $remote->tested;
				$res->package                      = $remote->download_url;
				$transient->response[ $res->plugin ] = $res;
			}
		}
		return $transient;
	}

	public function afterUpdate( $upgrader_object, $options ) {
		if ( $options['action'] == 'update' && $options['type'] === 'plugin' ) {
			delete_transient( self::TRANSIENT_SLUG );
		}
	}

	public function updateForceCheck() {
		if ( ! isset( $_GET['force-check'] ) ) {
			return;
		}
		$current_screen = get_current_screen();
		if ( 'update-core' === $current_screen->id ) {
			delete_transient( self::TRANSIENT_SLUG );
		}
	}
}
