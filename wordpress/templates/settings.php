<div class="wrap">
    <h1><?php echo esc_html( get_admin_page_title() ); ?></h1>

    <?php if ( isset( $_POST['unifactory_save_setting'] ) ) : ?>
        <div class="notice notice-success is-dismissible"><p>Settings saved.</p></div>
    <?php endif; ?>

    <form action="#" method="post">
        <input type="hidden" name="unifactory_save_setting" value="yes">
        <table class="form-table">
            <tbody>
                <tr>
                    <th scope="row"><label for="unifactory_slug">DEX URL slug</label></th>
                    <td>
                        <code><?php echo esc_url( home_url( '/' ) ); ?></code>
                        <input
                            name="unifactory_slug"
                            id="unifactory_slug"
                            type="text"
                            value="<?php echo esc_attr( unifactory_page_slug() ); ?>"
                            class="regular-text code"
                        >
                        <code>/</code>
                        <a href="<?php echo unifactory_page_url(); ?>" class="button" target="_blank">
                            Open DEX →
                        </a>
                        <p class="description">
                            URL path where the DEX will be accessible. Default: <code>dex</code><br>
                            Example: <code><?php echo esc_url( home_url( '/dex/' ) ); ?></code>
                        </p>
                    </td>
                </tr>
                <tr>
                    <th scope="row">Plugin version</th>
                    <td>
                        <code><?php echo UNIFACTORY_VER; ?></code>
                        &nbsp;
                        <?php
                        $js_exists = file_exists( UNIFACTORY_BASE_DIR . '/build/app.js' );
                        if ( $js_exists ) :
                        ?>
                            <span style="color:green">✓ Build files present</span>
                        <?php else : ?>
                            <span style="color:red">✗ Build files missing — reinstall plugin</span>
                        <?php endif; ?>
                    </td>
                </tr>
                <tr>
                    <th scope="row">BSC Storage config</th>
                    <td>
                        <p class="description">
                            DEX contracts and token lists are stored on-chain in the BSC Storage contract.<br>
                            Register your domain: use the Admin panel inside the DEX or run<br>
                            <code>PRIVATE_KEY=0x... DOMAIN=yourdomain.com node scripts/register-mainnet.cjs</code>
                        </p>
                    </td>
                </tr>
            </tbody>
        </table>
        <?php submit_button( 'Save Settings' ); ?>
    </form>
</div>
