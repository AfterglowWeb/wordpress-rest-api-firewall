import { useState, useCallback, useEffect, useMemo } from '@wordpress/element';

import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormHelperText from '@mui/material/FormHelperText';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import RefreshOutlinedIcon from '@mui/icons-material/RefreshOutlined';
import LockOpenOutlinedIcon from '@mui/icons-material/LockOpenOutlined';

import { useAdminData } from '../../contexts/AdminDataContext';
import { useApplication } from '../../contexts/ApplicationContext';
import useSaveOptions from '../../hooks/useSaveOptions';

const FIELDS = [
	'login_rate_limit_enabled',
	'login_rate_limit_attempts',
	'login_rate_limit_window',
	'login_rate_limit_blacklist_time',
	'login_rate_limit_promote_after',
];

const DEFAULTS = {
	login_rate_limit_enabled:        false,
	login_rate_limit_attempts:       5,
	login_rate_limit_window:         300,
	login_rate_limit_blacklist_time: 3600,
	login_rate_limit_promote_after:  0,
};

function pickFields( source ) {
	return {
		login_rate_limit_enabled:        !! source?.login_rate_limit_enabled,
		login_rate_limit_attempts:       source?.login_rate_limit_attempts        ?? DEFAULTS.login_rate_limit_attempts,
		login_rate_limit_window:         source?.login_rate_limit_window          ?? DEFAULTS.login_rate_limit_window,
		login_rate_limit_blacklist_time: source?.login_rate_limit_blacklist_time  ?? DEFAULTS.login_rate_limit_blacklist_time,
		login_rate_limit_promote_after:  source?.login_rate_limit_promote_after   ?? DEFAULTS.login_rate_limit_promote_after,
	};
}

function formatRemaining( seconds ) {
	if ( seconds <= 0 ) return '0s';
	const h = Math.floor( seconds / 3600 );
	const m = Math.floor( ( seconds % 3600 ) / 60 );
	const s = seconds % 60;
	return [ h && `${ h }h`, m && `${ m }m`, s && `${ s }s` ].filter( Boolean ).join( ' ' );
}

export default function LoginHardening() {
	const { __ } = wp.i18n || {};
	const { adminData } = useAdminData();
	const { setDirtyFlag } = useApplication();

	const [ form, setFormState ]      = useState( () => pickFields( adminData.admin_options ) );
	const [ savedForm, setSavedForm ] = useState( () => pickFields( adminData.admin_options ) );

	const isDirty = useMemo(
		() => FIELDS.some( ( k ) => String( form[ k ] ) !== String( savedForm[ k ] ) ),
		[ form, savedForm ]
	);

	const setField = useCallback( ( e ) => {
		const { name, checked, value, type } = e.target;
		setFormState( ( prev ) => ( {
			...prev,
			[ name ]: type === 'checkbox' ? Boolean( checked ) : value,
		} ) );
	}, [] );

	const { save, saving } = useSaveOptions();

	const handleSave = useCallback( () => {
		save(
			{
				login_rate_limit_enabled:        form.login_rate_limit_enabled,
				login_rate_limit_attempts:       Number( form.login_rate_limit_attempts )       || DEFAULTS.login_rate_limit_attempts,
				login_rate_limit_window:         Number( form.login_rate_limit_window )         || DEFAULTS.login_rate_limit_window,
				login_rate_limit_blacklist_time: Number( form.login_rate_limit_blacklist_time ) || DEFAULTS.login_rate_limit_blacklist_time,
				login_rate_limit_promote_after:  Number( form.login_rate_limit_promote_after )  || 0,
			},
			{
				confirmTitle:   __( 'Save Login Hardening', 'rest-api-firewall' ),
				confirmMessage: __( 'Save login hardening settings?', 'rest-api-firewall' ),
				successTitle:   __( 'Login Hardening Saved', 'rest-api-firewall' ),
				successMessage: __( 'Login hardening settings saved successfully.', 'rest-api-firewall' ),
				onSuccess: () => setSavedForm( { ...form } ),
			}
		);
	}, [ save, form, __ ] );

	useEffect( () => {
		setDirtyFlag( { has: isDirty, save: handleSave, saving } );
	}, [ isDirty, handleSave, saving, setDirtyFlag ] );

	useEffect( () => () => setDirtyFlag( { has: false } ), [ setDirtyFlag ] );

	// ── Active Blocks ─────────────────────────────────────────────────────────

	const [ blocks, setBlocks ]           = useState( [] );
	const [ blocksLoading, setBlocksLoading ] = useState( false );
	const [ releasingIp, setReleasingIp ] = useState( null );

	const fetchBlocks = useCallback( () => {
		setBlocksLoading( true );
		fetch( adminData.ajaxurl, {
			method: 'POST',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
			body: new URLSearchParams( {
				action: 'rest_api_firewall_get_login_blocks',
				nonce:  adminData.nonce,
			} ),
		} )
			.then( ( r ) => r.json() )
			.then( ( json ) => {
				if ( json?.success ) setBlocks( json.data.blocks ?? [] );
			} )
			.catch( () => {} )
			.finally( () => setBlocksLoading( false ) );
	}, [ adminData ] );

	useEffect( () => { fetchBlocks(); }, [ fetchBlocks ] );

	const handleRelease = useCallback( ( ip ) => {
		setReleasingIp( ip );
		fetch( adminData.ajaxurl, {
			method: 'POST',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
			body: new URLSearchParams( {
				action: 'rest_api_firewall_release_login_block',
				nonce:  adminData.nonce,
				ip,
			} ),
		} )
			.then( ( r ) => r.json() )
			.then( ( json ) => {
				if ( json?.success ) {
					setBlocks( ( prev ) => prev.filter( ( b ) => b.ip !== ip ) );
				}
			} )
			.catch( () => {} )
			.finally( () => setReleasingIp( null ) );
	}, [ adminData ] );

	const enabled = form.login_rate_limit_enabled;

	return (
		<Stack flexGrow={ 1 } overflow="auto">
			<Stack p={ 4 } flexGrow={ 1 } spacing={ 3 }>
				<Stack spacing={ 3 } maxWidth={ 600 }>

					{/* ── Rate Limiting Settings ── */}
					<Stack spacing={ 3 }>
						<Stack>
							<Typography variant="subtitle1" fontWeight={ 600 }>
								{ __( 'Login Rate Limiting', 'rest-api-firewall' ) }
							</Typography>
							<Typography variant="body2" color="text.secondary">
								{ __( 'Block brute-force login attempts by IP. After too many failures the IP is temporarily blocked from the login endpoint.', 'rest-api-firewall' ) }
							</Typography>
						</Stack>

						<FormControl>
							<FormControlLabel
								control={
									<Switch
										size="small"
										checked={ enabled }
										name="login_rate_limit_enabled"
										onChange={ setField }
									/>
								}
								label={ __( 'Enable', 'rest-api-firewall' ) }
							/>
						</FormControl>

						<Stack direction={ { xs: 'column', sm: 'row' } } spacing={ 2 }>
							<TextField
								label={ __( 'Max Failures', 'rest-api-firewall' ) }
								type="number"
								size="small"
								disabled={ ! enabled }
								name="login_rate_limit_attempts"
								value={ form.login_rate_limit_attempts }
								onChange={ setField }
								helperText={ __( 'Failed attempts before block', 'rest-api-firewall' ) }
								inputProps={ { min: 1 } }
								sx={ { width: 160 } }
							/>
							<TextField
								label={ __( 'Window (seconds)', 'rest-api-firewall' ) }
								type="number"
								size="small"
								disabled={ ! enabled }
								name="login_rate_limit_window"
								value={ form.login_rate_limit_window }
								onChange={ setField }
								helperText={ __( 'Rolling window for failure count', 'rest-api-firewall' ) }
								inputProps={ { min: 1 } }
								sx={ { width: 160 } }
							/>
							<TextField
								label={ __( 'Block Duration (s)', 'rest-api-firewall' ) }
								type="number"
								size="small"
								disabled={ ! enabled }
								name="login_rate_limit_blacklist_time"
								value={ form.login_rate_limit_blacklist_time }
								onChange={ setField }
								helperText={ __( 'How long the IP stays blocked', 'rest-api-firewall' ) }
								inputProps={ { min: 1 } }
								sx={ { width: 160 } }
							/>
						</Stack>
					</Stack>

					<Divider />

					{/* ── Escalation ── */}
					<Stack spacing={ 2 }>
						<Stack>
							<Typography variant="subtitle1" fontWeight={ 600 }>
								{ __( 'Global Blacklist Escalation', 'rest-api-firewall' ) }
							</Typography>
							<Typography variant="body2" color="text.secondary">
								{ __( 'After N block cycles, promote the IP to the global IP blacklist (visible in IP Filter). Set to 0 to disable escalation.', 'rest-api-firewall' ) }
							</Typography>
						</Stack>
						<TextField
							label={ __( 'Promote After (block cycles)', 'rest-api-firewall' ) }
							type="number"
							size="small"
							disabled={ ! enabled }
							name="login_rate_limit_promote_after"
							value={ form.login_rate_limit_promote_after }
							onChange={ setField }
							helperText={ __( '0 = disabled', 'rest-api-firewall' ) }
							inputProps={ { min: 0 } }
							sx={ { width: 220 } }
						/>
					</Stack>

					<Divider />

					{/* ── Exemptions ── */}
					<Stack spacing={ 1 }>
						<Typography variant="subtitle2" color="text.secondary">
							{ __( 'Exemptions', 'rest-api-firewall' ) }
						</Typography>
						<Typography variant="body2" color="text.secondary">
							{ __( 'Only IPs in the Trusted IPs list (WordPress Mode, Pro) are exempt from login rate limiting. All other IPs — including administrators — are subject to the same rules.', 'rest-api-firewall' ) }
						</Typography>
					</Stack>

					<Divider />

					{/* ── Active Blocks ── */}
					<Stack spacing={ 2 }>
						<Stack direction="row" alignItems="center" justifyContent="space-between">
							<Stack>
								<Typography variant="subtitle1" fontWeight={ 600 }>
									{ __( 'Active Blocks', 'rest-api-firewall' ) }
								</Typography>
								<Typography variant="body2" color="text.secondary">
									{ __( 'IPs currently blocked from logging in. Blocks expire automatically.', 'rest-api-firewall' ) }
								</Typography>
							</Stack>
							<IconButton
								size="small"
								onClick={ fetchBlocks }
								disabled={ blocksLoading }
								title={ __( 'Refresh', 'rest-api-firewall' ) }
							>
								<RefreshOutlinedIcon fontSize="small" />
							</IconButton>
						</Stack>

						{ ! blocksLoading && blocks.length === 0 && (
							<Typography variant="body2" color="text.secondary">
								{ __( 'No active blocks.', 'rest-api-firewall' ) }
							</Typography>
						) }

						{ blocks.map( ( block ) => (
							<Stack
								key={ block.ip }
								direction="row"
								alignItems="center"
								justifyContent="space-between"
								sx={ {
									px: 1.5,
									py: 1,
									border: 1,
									borderColor: 'divider',
									borderRadius: 1,
									bgcolor: 'background.default',
								} }
							>
								<Stack direction="row" alignItems="center" spacing={ 1.5 }>
									<Typography
										variant="body2"
										sx={ { fontFamily: 'monospace', fontWeight: 500 } }
									>
										{ block.ip }
									</Typography>
									<Chip
										size="small"
										variant="outlined"
										label={ formatRemaining( block.remaining ) }
										sx={ { fontSize: '0.7rem' } }
									/>
								</Stack>
								<IconButton
									size="small"
									onClick={ () => handleRelease( block.ip ) }
									disabled={ releasingIp === block.ip }
									title={ __( 'Release block', 'rest-api-firewall' ) }
								>
									<LockOpenOutlinedIcon fontSize="small" />
								</IconButton>
							</Stack>
						) ) }
					</Stack>

				</Stack>
			</Stack>
		</Stack>
	);
}
