import { useState, useCallback, useEffect } from '@wordpress/element';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormHelperText from '@mui/material/FormHelperText';
import LinearProgress from '@mui/material/LinearProgress';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';

import { useAdminData } from '../../contexts/AdminDataContext';
import { useDialog, DIALOG_TYPES } from '../../contexts/DialogContext';
import CopyButton from '../CopyButton';

function FileActionSwitch( {
	checked,
	name,
	label,
	helperText,
	ajaxAction,
	confirmMessage,
	pendingMessage,
	protectedMessage,
	isProtected,
	onToggle,
} ) {
	const { __ } = wp.i18n || {};
	const { adminData } = useAdminData();
	const { openDialog, closeDialog } = useDialog();

	const [ busy,   setBusy   ] = useState( false );
	const [ result, setResult ] = useState( null ); // { success: bool, message: string } | null

	const runAction = useCallback( async () => {
		setBusy( true );
		setResult( null );

		try {
			const response = await fetch( adminData.ajaxurl, {
				method: 'POST',
				headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
				body: new URLSearchParams( {
					action: ajaxAction,
					nonce:  adminData.nonce,
				} ),
			} );
			const json = await response.json();
			setResult( {
				success: !! json?.success,
				message: json?.data?.message || ( json?.success
					? __( 'Done.', 'rest-api-firewall' )
					: __( 'An error occurred.', 'rest-api-firewall' ) ),
			} );
		} catch ( err ) {
			setResult( { success: false, message: err.message } );
		} finally {
			setBusy( false );
		}
	}, [ adminData, ajaxAction, __ ] );

	const handleChange = ( e ) => {
		onToggle( e );

		if ( e.target.checked ) {
			openDialog( {
				type: DIALOG_TYPES.CONFIRM,
				title: label,
				content: confirmMessage,
				confirmLabel: __( 'Apply now', 'rest-api-firewall' ),
				onConfirm: () => {
					closeDialog();
					runAction();
				},
			} );
		} else {
			setResult( null );
		}
	};

	const showDefault = ! busy && ! result;

	return (
		<FormControl>
			<FormControlLabel
				control={
					<Switch
						size="small"
						checked={ checked }
						name={ name }
						onChange={ handleChange }
						disabled={ busy }
					/>
				}
				label={ label }
			/>
			{ helperText && <FormHelperText>{ helperText }</FormHelperText> }

			{ busy && (
				<Box sx={ { mt: 1 } }>
					<Typography variant="caption" color="text.secondary">
						{ pendingMessage }
					</Typography>
					<LinearProgress sx={ { mt: 0.5 } } />
				</Box>
			) }

			{ ! busy && result && (
				<Alert
					severity={ result.success ? 'success' : 'error' }
					sx={ { mt: 1, whiteSpace: 'pre-wrap', fontSize: '0.75rem' } }
				>
					{ result.message }
				</Alert>
			) }

			{ showDefault && isProtected === true && (
				<Alert severity="success" sx={ { mt: 1, fontSize: '0.75rem' } }>
				{ protectedMessage || __( 'Currently protected.', 'rest-api-firewall' ) }
			</Alert>
		) }

			{ showDefault && isProtected !== true && (
				<Alert
					severity="info"
					sx={ { mt: 1, fontSize: '0.75rem', color: 'text.secondary', borderColor: 'grey.300', backgroundColor: 'grey.50' } }
				>
					{ confirmMessage }
				</Alert>
			) }
		</FormControl>
	);
}

export default function GlobalSecurity( { form, setField } ) {
	const { __ } = wp.i18n || {};
	const { adminData } = useAdminData();

	const [ fileStatus, setFileStatus ] = useState( null );

	useEffect( () => {
		fetch( adminData.ajaxurl, {
			method: 'POST',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
			body: new URLSearchParams( { action: 'get_file_status', nonce: adminData.nonce } ),
		} )
			.then( ( r ) => r.json() )
			.then( ( json ) => { if ( json?.success ) setFileStatus( json.data ); } )
			.catch( () => {} );
	}, [ adminData ] );

	return (
		<Stack p={ 4 } flexGrow={ 1 } spacing={ 3 }>

			<Stack spacing={ 3 } maxWidth={ 600 }>

				<Stack spacing={ 3 }>
					<Typography variant="subtitle1" fontWeight={ 600 }>
						{ __( 'Data Exposure', 'rest-api-firewall' ) }
					</Typography>

					<FormControl>
						<FormControlLabel
							control={
								<Switch
									size="small"
									checked={ !! form.theme_disable_xmlrpc }
									name="theme_disable_xmlrpc"
									onChange={ setField }
								/>
							}
							label={ __( 'Disable XML-RPC endpoint', 'rest-api-firewall' ) }
						/>
					</FormControl>

					<FormControl>
						<FormControlLabel
							control={
								<Switch
									size="small"
									checked={ !! form.theme_disable_comments }
									name="theme_disable_comments"
									onChange={ setField }
								/>
							}
							label={ __( 'Disable Comments', 'rest-api-firewall' ) }
						/>
						<FormHelperText>
							{ __( 'Deactivate comments site wide.', 'rest-api-firewall' ) }
						</FormHelperText>
					</FormControl>

					<FormControl>
						<FormControlLabel
							control={
								<Switch
									size="small"
									checked={ !! form.theme_disable_pingbacks }
									name="theme_disable_pingbacks"
									onChange={ setField }
								/>
							}
							label={ __( 'Disable Pingbacks', 'rest-api-firewall' ) }
						/>
						<FormHelperText>
							{ __( 'Deactivate pingbacks site wide.', 'rest-api-firewall' ) }
						</FormHelperText>
					</FormControl>

					<FormControl>
						<FormControlLabel
							control={
								<Switch
									size="small"
									checked={ !! form.theme_disable_rss }
									name="theme_disable_rss"
									onChange={ setField }
								/>
							}
							label={ __( 'Disable RSS feeds', 'rest-api-firewall' ) }
						/>
						<FormHelperText>
							{ __( 'Disable all RSS/Atom feeds.', 'rest-api-firewall' ) }
						</FormHelperText>
					</FormControl>

					<FormControl>
						<FormControlLabel
							control={
								<Switch
									size="small"
									checked={ !! form.theme_disable_sitemap }
									name="theme_disable_sitemap"
									onChange={ setField }
								/>
							}
							label={ __( 'Disable XML Sitemap', 'rest-api-firewall' ) }
						/>
						<FormHelperText>
							{ __( 'Disable the built-in XML sitemap functionality.', 'rest-api-firewall' ) }
						</FormHelperText>
					</FormControl>
				</Stack>

                <Divider />

				<Stack spacing={ 3 }>
					<Typography variant="subtitle1" fontWeight={ 600 }>
						{ __( 'Files', 'rest-api-firewall' ) }
					</Typography>

					<FormControl>
						<FormControlLabel
							control={
								<Switch
									size="small"
									checked={ !! form.theme_disable_filedit }
									name="theme_disable_filedit"
									onChange={ setField }
								/>
							}
							label={ __( 'Disable theme file editor', 'rest-api-firewall' ) }
						/>
					</FormControl>

					<FileActionSwitch
						checked={ !! form.theme_enforce_wpconfig_permissions }
						name="theme_enforce_wpconfig_permissions"
						label={ __( 'Secure wp-config.php file', 'rest-api-firewall' ) }
						helperText={ __( 'Set wp-config.php file permissions to 440.', 'rest-api-firewall' ) }
						ajaxAction="update_file_permissions"
						confirmMessage={ __( 'This will set wp-config.php to read-only (chmod 440). Make sure your server user owns the file before proceeding.', 'rest-api-firewall' ) }
						pendingMessage={ __( 'Updating file permissions…', 'rest-api-firewall' ) }
						isProtected={ fileStatus?.wpconfig_secure ?? null }
						protectedMessage={
							fileStatus?.wpconfig_perms
								? __( 'Protected — permissions: ', 'rest-api-firewall' ) + fileStatus.wpconfig_perms + ' (read-only)'
								: __( 'Currently protected.', 'rest-api-firewall' )
						}
						onToggle={ setField }
					/>

					<FileActionSwitch
						checked={ !! form.theme_secure_uploads_dir }
						name="theme_secure_uploads_dir"
						label={ __( 'Protect Uploads Directory', 'rest-api-firewall' ) }
						helperText={ __( 'Protect the uploads directory from file execution and directory listing.', 'rest-api-firewall' ) }
						ajaxAction="protect_uploads_dir"
						confirmMessage={ __( 'This will write security rules (.htaccess / web.config) into the uploads directory to block PHP execution and directory listing.', 'rest-api-firewall' ) }
						pendingMessage={ __( 'Writing protection rules…', 'rest-api-firewall' ) }
						isProtected={ fileStatus?.uploads_protected ?? null }
						protectedMessage={ __( 'Protected — .htaccess and web.config rules are in place.', 'rest-api-firewall' ) }
						onToggle={ setField }
					/>

					{ fileStatus?.nginx_snippet && (
						<Box>
							<Typography variant="caption" color="text.secondary" display="block" mb={ 0.5 }>
								{ __( 'Nginx — add to your server config:', 'rest-api-firewall' ) }
							</Typography>
							<Box sx={ { position: 'relative', bgcolor: 'grey.900', borderRadius: 1, p: 1.5 } }>
								<Box sx={ { position: 'absolute', top: 4, right: 4 } }>
									<CopyButton toCopy={ fileStatus.nginx_snippet } sx={ { color: 'grey.400' } } />
								</Box>
								<Typography
									component="pre"
									variant="caption"
									sx={ { m: 0, color: 'grey.100', fontFamily: 'monospace', whiteSpace: 'pre', overflowX: 'auto', display: 'block' } }
								>
									{ fileStatus.nginx_snippet }
								</Typography>
							</Box>
						</Box>
					) }
				</Stack>

                <Divider />

				<Stack spacing={ 3 }>
					<Typography variant="subtitle1" fontWeight={ 600 }>
						{ __( 'HTTP Headers', 'rest-api-firewall' ) }
					</Typography>

					<FormControl>
						<FormControlLabel
							control={
								<Switch
									size="small"
									checked={ !! form.theme_secure_http_headers }
									name="theme_secure_http_headers"
									onChange={ setField }
								/>
							}
							label={ __( 'Enforce Secure HTTP Headers', 'rest-api-firewall' ) }
						/>
						<FormHelperText>
							{ __( 'Enforce secure HTTP headers for enhanced security.', 'rest-api-firewall' ) }
						</FormHelperText>
					</FormControl>

					<FormControl>
						<FormControlLabel
							control={
								<Switch
									size="small"
									checked={ !! form.theme_compression_http_headers }
									name="theme_compression_http_headers"
									onChange={ setField }
								/>
							}
							label={ __( 'Enforce Compression HTTP Headers', 'rest-api-firewall' ) }
						/>
						<FormHelperText>
							{ __( 'Enforce compression HTTP headers for enhanced performance.', 'rest-api-firewall' ) }
						</FormHelperText>
					</FormControl>

					<FormControl>
						<FormControlLabel
							control={
								<Switch
									size="small"
									checked={ !! form.theme_wp_http_headers }
									name="theme_wp_http_headers"
									onChange={ setField }
								/>
							}
							label={ __( 'Enforce HTTP Headers site-wide', 'rest-api-firewall' ) }
						/>
						<FormHelperText>
							{ __( 'Enforce HTTP headers on the WordPress front pages.', 'rest-api-firewall' ) }
						</FormHelperText>
					</FormControl>
				</Stack>

			</Stack>

		</Stack>
	);
}
