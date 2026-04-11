import { useState, useCallback, useEffect, useMemo } from '@wordpress/element';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormHelperText from '@mui/material/FormHelperText';
import LinearProgress from '@mui/material/LinearProgress';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Typography from '@mui/material/Typography';

import { useAdminData } from '../../contexts/AdminDataContext';
import { useApplication } from '../../contexts/ApplicationContext';
import { useLicense } from '../../contexts/LicenseContext';
import { useDialog, DIALOG_TYPES } from '../../contexts/DialogContext';
import useSaveOptions from '../../hooks/useSaveOptions';
import AllowedIps from '../IpFilter/AllowedIps';
import CopyButton from '../shared/CopyButton';

export default function WordPressMode() {
	const { __ } = wp.i18n || {};
	const { adminData } = useAdminData();
	const { setDirtyFlag } = useApplication();
	const { hasValidLicense } = useLicense();
	const { openDialog, closeDialog } = useDialog();

	const initialOptions = adminData.admin_options;

	const [ applicationsOnly, setApplicationsOnly ] = useState(
		() => !! initialOptions?.applications_only_mode
	);
	const [ savedApplicationsOnly, setSavedApplicationsOnly ] = useState(
		() => !! initialOptions?.applications_only_mode
	);

	const [ whitelist, setWhitelist ] = useState(
		() => Array.isArray( initialOptions?.absolute_whitelist ) ? initialOptions.absolute_whitelist : []
	);
	const [ savedWhitelist, setSavedWhitelist ] = useState(
		() => Array.isArray( initialOptions?.absolute_whitelist ) ? initialOptions.absolute_whitelist : []
	);

	const [ tokenGenerating, setTokenGenerating ] = useState( false );
	const [ generatedToken, setGeneratedToken ]   = useState( null ); // { url: string } | null
	const hasStoredToken = !! initialOptions?.emergency_token_hash;

	const isDirty = useMemo( () => {
		return (
			applicationsOnly !== savedApplicationsOnly ||
			JSON.stringify( whitelist ) !== JSON.stringify( savedWhitelist )
		);
	}, [ applicationsOnly, savedApplicationsOnly, whitelist, savedWhitelist ] );

	const { save, saving } = useSaveOptions();

	const handleSave = useCallback( () => {
		const options = {
			applications_only_mode: applicationsOnly,
			absolute_whitelist:     whitelist,
		};
		// Auto-enable required dependencies when activating Applications Only.
		if ( applicationsOnly ) {
			options.theme_redirect_templates_enabled = true;
			options.theme_disable_xmlrpc             = true;
		}
		save( options, {
			confirmTitle:   __( 'Save WordPress Mode', 'rest-api-firewall' ),
			confirmMessage: __( 'Save WordPress Mode settings?', 'rest-api-firewall' ),
			successTitle:   __( 'WordPress Mode Saved', 'rest-api-firewall' ),
			successMessage: __( 'WordPress Mode settings saved successfully.', 'rest-api-firewall' ),
			onSuccess: () => {
				setSavedApplicationsOnly( applicationsOnly );
				setSavedWhitelist( [ ...whitelist ] );
			},
		} );
	}, [ save, applicationsOnly, whitelist, __ ] );

	useEffect( () => {
		setDirtyFlag( { has: isDirty, save: handleSave, saving } );
	}, [ isDirty, handleSave, saving, setDirtyFlag ] );

	useEffect( () => () => setDirtyFlag( { has: false } ), [ setDirtyFlag ] );

	const handleGenerateToken = useCallback( () => {
		openDialog( {
			type: DIALOG_TYPES.CONFIRM,
			title: __( 'Generate Emergency Token', 'rest-api-firewall' ),
			content: __( 'A new single-use token will be generated. Any existing token will be invalidated. Store the resulting URL safely — it will only be shown once.', 'rest-api-firewall' ),
			confirmLabel: __( 'Generate', 'rest-api-firewall' ),
			onConfirm: async () => {
				closeDialog();
				setTokenGenerating( true );
				setGeneratedToken( null );
				try {
					const response = await fetch( adminData.ajaxurl, {
						method: 'POST',
						headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
						body: new URLSearchParams( {
							action: 'rest_api_firewall_generate_emergency_token',
							nonce:  adminData.nonce,
						} ),
					} );
					const json = await response.json();
					if ( json?.success && json?.data?.reset_url ) {
						setGeneratedToken( { url: json.data.reset_url } );
					}
				} catch ( e ) {
					// noop — user can retry
				} finally {
					setTokenGenerating( false );
				}
			},
		} );
	}, [ adminData, openDialog, closeDialog, __ ] );

	if ( ! hasValidLicense ) {
		return (
			<Stack flexGrow={ 1 } overflow="auto">
				<Stack p={ 4 } flexGrow={ 1 } spacing={ 3 } maxWidth={ 600 }>
					<Alert severity="info">
						{ __( 'WordPress Mode is a Pro feature. Upgrade to unlock Applications Only mode, Trusted IPs, and Emergency Token.', 'rest-api-firewall' ) }
					</Alert>
				</Stack>
			</Stack>
		);
	}

	return (
		<Stack flexGrow={ 1 } overflow="auto">
			<Stack p={ 4 } flexGrow={ 1 } spacing={ 3 }>
				<Stack spacing={ 3 } maxWidth={ 600 }>

					{/* — Applications Only — */}
					<Stack spacing={ 3 }>
						<Typography variant="subtitle1" fontWeight={ 600 }>
							{ __( 'Applications Only', 'rest-api-firewall' ) }
						</Typography>

						<FormControl>
							<FormControlLabel
								control={
									<Switch
										size="small"
										checked={ applicationsOnly }
										onChange={ ( e ) => setApplicationsOnly( e.target.checked ) }
									/>
								}
								label={ __( 'WordPress Applications Only', 'rest-api-firewall' ) }
							/>
							<FormHelperText>
								{ __( 'Block all non-REST-API WordPress traffic. Activating this auto-enables template redirect and XML-RPC block. Unmatched REST API requests are redirected instead of returning a 404.', 'rest-api-firewall' ) }
							</FormHelperText>
						</FormControl>
					</Stack>

					<Divider />

					{/* — Trusted IPs — */}
					<Stack spacing={ 2 }>
						<Stack>
							<Typography variant="subtitle1" fontWeight={ 600 }>
								{ __( 'Trusted IPs', 'rest-api-firewall' ) }
							</Typography>
							<Typography variant="body2" color="text.secondary">
								{ __( 'IPs in this list bypass all enforcement: IP blacklist, REST rate limiting, and login rate limiting. Logged-in administrators are always exempt regardless of this list.', 'rest-api-firewall' ) }
							</Typography>
						</Stack>
						<AllowedIps
							value={ whitelist }
							onChange={ setWhitelist }
							saving={ saving }
							inline
						/>
					</Stack>

					<Divider />

					{/* — Emergency Reset Token — */}
					<Stack spacing={ 2 }>
						<Stack>
							<Typography variant="subtitle1" fontWeight={ 600 }>
								{ __( 'Emergency Reset Token', 'rest-api-firewall' ) }
							</Typography>
							<Typography variant="body2" color="text.secondary">
								{ __( 'If you get locked out, visit the emergency reset URL to disable Applications Only mode and clear Trusted IPs. The token is single-use and rotates on use.', 'rest-api-firewall' ) }
							</Typography>
						</Stack>

						{ hasStoredToken && ! generatedToken && (
							<Alert severity="info" sx={ { fontSize: '0.75rem' } }>
								{ __( 'An active emergency token exists.', 'rest-api-firewall' ) }
							</Alert>
						) }

						{ tokenGenerating && <LinearProgress /> }

						{ generatedToken && (
							<Stack spacing={ 1 }>
								<Alert severity="warning" sx={ { fontSize: '0.75rem' } }>
									{ __( 'Copy this URL now — it will not be shown again.', 'rest-api-firewall' ) }
								</Alert>
								<Box sx={ { position: 'relative', bgcolor: 'grey.900', borderRadius: 1, p: 1.5 } }>
									<Box sx={ { position: 'absolute', top: 4, right: 4 } }>
										<CopyButton toCopy={ generatedToken.url } sx={ { color: 'grey.400' } } />
									</Box>
									<Typography
										component="pre"
										variant="caption"
										sx={ {
											m: 0,
											color: 'grey.100',
											fontFamily: 'monospace',
											whiteSpace: 'pre-wrap',
											wordBreak: 'break-all',
											display: 'block',
											pr: 4,
										} }
									>
										{ generatedToken.url }
									</Typography>
								</Box>
							</Stack>
						) }

						<Box>
							<Button
								variant="outlined"
								size="small"
								onClick={ handleGenerateToken }
								disabled={ tokenGenerating || saving }
							>
								{ __( 'Generate Emergency Token', 'rest-api-firewall' ) }
							</Button>
						</Box>

						<Alert severity="info" sx={ { fontSize: '0.75rem' } }>
							{ __( "No fixed IP? Use WP-CLI as a fallback: wp option patch update rest_api_firewall_options applications_only_mode false", 'rest-api-firewall' ) }
						</Alert>
					</Stack>

				</Stack>
			</Stack>
		</Stack>
	);
}
