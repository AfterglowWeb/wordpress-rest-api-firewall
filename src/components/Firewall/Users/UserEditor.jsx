import { useState, useEffect, useCallback } from '@wordpress/element';
import { useAdminData } from '../../../contexts/AdminDataContext';
import { useLicense } from '../../../contexts/LicenseContext';
import useProActions from '../../../hooks/useProActions';
import formatDate from '../../../utils/formatDate';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';

function SectionHeader( { title, description } ) {
	return (
		<Box>
			<Typography variant="subtitle1" fontWeight={ 600 }>
				{ title }
			</Typography>
			{ description && (
				<Typography variant="body2" color="text.secondary">
					{ description }
				</Typography>
			) }
		</Box>
	);
}

const HTTP_METHODS = [ 'get', 'post', 'put', 'patch', 'delete' ];

const AUTH_METHODS = [
	{ value: 'any',          label: 'Any (no restriction)' },
	{ value: 'jwt',          label: 'JWT' },
	{ value: 'app_password', label: 'Application Password' },
	{ value: 'wp_auth',      label: 'WordPress Cookie / Session' },
];

export default function UserEditor( { user, onBack } ) {
	const { adminData } = useAdminData();
	const { proNonce } = useLicense();
	const nonce = proNonce || adminData.nonce;
	const { __ } = wp.i18n || {};

	const { save, remove, saving } = useProActions();

	const [ loading, setLoading ] = useState( true );
	const [ loadError, setLoadError ] = useState( '' );

	// read-only identity fields
	const [ displayName, setDisplayName ] = useState( user.display_name || '' );
	const [ appTitle, setAppTitle ]       = useState( user.app_title || '' );
	const [ dateCreated, setDateCreated ] = useState( '' );
	const [ dateModified, setDateModified ] = useState( '' );

	// editable fields
	const [ status, setStatus ]                   = useState( user.status === 'active' );
	const [ authMethod, setAuthMethod ]           = useState( 'any' );
	const [ allowedMethods, setAllowedMethods ]   = useState( user.allowed_methods || [ 'get' ] );
	const [ rateLimitRequests, setRateLimitRequests ] = useState( 100 );
	const [ rateLimitWindow, setRateLimitWindow ]     = useState( 60 );

	const loadEntry = useCallback( async () => {
		setLoading( true );
		try {
			const response = await fetch( adminData.ajaxurl, {
				method: 'POST',
				headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
				body: new URLSearchParams( {
					action: 'get_user_entry',
					nonce,
					id: user.id,
				} ),
			} );
			const result = await response.json();

			if ( result?.success && result?.data?.entry ) {
				const e = result.data.entry;
				setDisplayName( e.display_name || '' );
				setAppTitle( e.app_title || '' );
				setStatus( e.status === 'active' );
				setAuthMethod( e.auth_method || 'any' );
				setAllowedMethods( e.allowed_methods || [ 'get' ] );
				setRateLimitRequests( e.rate_limit?.max_requests ?? 100 );
				setRateLimitWindow( e.rate_limit?.window_seconds ?? 60 );
				setDateCreated( formatDate( e.date_created, adminData.date_format, adminData.time_format ) );
				setDateModified( formatDate( e.date_modified, adminData.date_format, adminData.time_format ) );
			} else {
				setLoadError( result?.data?.message || __( 'Failed to load user', 'rest-api-firewall' ) );
			}
		} catch ( err ) {
			setLoadError( err.message );
		} finally {
			setLoading( false );
		}
	}, [ adminData, nonce, user.id ] );

	useEffect( () => {
		loadEntry();
	}, [ loadEntry ] );

	const toggleMethod = ( method ) => {
		setAllowedMethods( ( prev ) =>
			prev.includes( method )
				? prev.filter( ( m ) => m !== method )
				: [ ...prev, method ]
		);
	};

	const handleSave = () => {
		save(
			{
				action:          'update_user_entry',
				id:              user.id,
				status:          status ? 'active' : 'inactive',
				allowed_methods: JSON.stringify( allowedMethods ),
				settings:        JSON.stringify( {
					auth_method: authMethod,
					rate_limit: {
						max_requests:   parseInt( rateLimitRequests, 10 ) || 100,
						window_seconds: parseInt( rateLimitWindow, 10 ) || 60,
					},
				} ),
			},
			{
				skipConfirm:    true,
				successTitle:   __( 'User Saved', 'rest-api-firewall' ),
				successMessage: __( 'User settings saved successfully.', 'rest-api-firewall' ),
			}
		);
	};

	const handleDelete = () => {
		remove(
			{ action: 'delete_user_entry', id: user.id },
			{
				confirmTitle:   __( 'Delete User', 'rest-api-firewall' ),
				confirmMessage: __( 'Are you sure you want to permanently delete this user? This action cannot be undone.', 'rest-api-firewall' ),
				confirmLabel:   __( 'Delete', 'rest-api-firewall' ),
				successTitle:   __( 'User Deleted', 'rest-api-firewall' ),
				successMessage: __( 'The user has been removed.', 'rest-api-firewall' ),
				onSuccess:      onBack,
			}
		);
	};

	if ( loading ) {
		return (
			<Box sx={ { py: 4 } }>
				<Typography color="text.secondary">
					{ __( 'Loading…', 'rest-api-firewall' ) }
				</Typography>
			</Box>
		);
	}

	return (
		<Stack spacing={ 0 }>
			<Toolbar
				sx={ {
					gap: 2,
					justifyContent: 'space-between',
					alignItems: 'center',
					borderBottom: 1,
					borderColor: 'divider',
					flexWrap: 'wrap',
					py: { xs: 2, sm: 1 },
				} }
			>
				<Stack direction="row" gap={ 2 }>
					<Stack alignItems="center" justifyContent="center">
						<IconButton size="small" onClick={ onBack } aria-label={ __( 'Back', 'rest-api-firewall' ) }>
							<ArrowBackIcon />
						</IconButton>
					</Stack>
					<Stack spacing={ 0 }>
						<Typography variant="h6" fontWeight={ 600 } noWrap>
							{ displayName }
						</Typography>
						<Stack direction={ { xs: 'column', xl: 'row' } } gap={ { xs: 0, xl: 2 } } flexWrap="wrap" alignItems={ { xl: 'center' } }>
							<FormControlLabel
								control={
									<Switch
										checked={ status }
										onChange={ ( e ) => setStatus( e.target.checked ) }
										size="small"
									/>
								}
								label={ __( 'Active', 'rest-api-firewall' ) }
							/>
							{ appTitle && (
								<Chip label={ appTitle } size="small" variant="outlined" sx={ { fontFamily: 'monospace' } } />
							) }
							{ ( dateCreated || dateModified ) && (
								<Typography variant="caption" color="text.secondary">
									{ dateCreated && <span>{ dateCreated }</span> }
									{ dateModified && (
										<>
											<br />
											<span>{ __( 'Mod.', 'rest-api-firewall' ) } { dateModified }</span>
										</>
									) }
								</Typography>
							) }
						</Stack>
					</Stack>
				</Stack>

				<Stack direction="row" gap={ 2 }>
					<Button
						variant="contained"
						size="small"
						disableElevation
						disabled={ saving }
						onClick={ handleSave }
					>
						{ __( 'Save', 'rest-api-firewall' ) }
					</Button>

					<Button
						variant="outlined"
						color="error"
						size="small"
						startIcon={ <DeleteOutlineIcon /> }
						onClick={ handleDelete }
					>
						{ __( 'Delete', 'rest-api-firewall' ) }
					</Button>
				</Stack>
			</Toolbar>

			{ loadError && <Alert severity="error">{ loadError }</Alert> }

			<Stack p={ { xs: 2, sm: 4 } } spacing={ 3 } sx={ { maxWidth: 760 } }>

				{ /* Auth method */ }
				<Stack spacing={ 2 }>
					<SectionHeader
						title={ __( 'Authentication Method', 'rest-api-firewall' ) }
						description={ __( 'Restrict which authentication mechanism this user must use. "Any" allows all configured methods.', 'rest-api-firewall' ) }
					/>

					<FormControl size="small" sx={ { maxWidth: 280 } }>
						<InputLabel>{ __( 'Auth Method', 'rest-api-firewall' ) }</InputLabel>
						<Select
							value={ authMethod }
							onChange={ ( e ) => setAuthMethod( e.target.value ) }
							label={ __( 'Auth Method', 'rest-api-firewall' ) }
						>
							{ AUTH_METHODS.map( ( opt ) => (
								<MenuItem key={ opt.value } value={ opt.value }>
									{ opt.label }
								</MenuItem>
							) ) }
						</Select>
					</FormControl>
				</Stack>

				<Divider />

				{ /* Allowed HTTP methods */ }
				<Stack spacing={ 2 }>
					<SectionHeader
						title={ __( 'Allowed HTTP Methods', 'rest-api-firewall' ) }
						description={ __( 'Which HTTP verbs this user is allowed to use against the API.', 'rest-api-firewall' ) }
					/>

					<Stack direction="row" flexWrap="wrap" gap={ 1 }>
						{ HTTP_METHODS.map( ( method ) => (
							<FormControlLabel
								key={ method }
								label={
									<Typography variant="body2" sx={ { fontFamily: 'monospace', fontWeight: 600 } }>
										{ method.toUpperCase() }
									</Typography>
								}
								control={
									<Checkbox
										checked={ allowedMethods.includes( method ) }
										onChange={ () => toggleMethod( method ) }
										size="small"
									/>
								}
								sx={ {
									m: 0,
									px: 1.5,
									py: 0.5,
									border: 1,
									borderColor: allowedMethods.includes( method ) ? 'primary.main' : 'divider',
									borderRadius: 1,
									userSelect: 'none',
								} }
							/>
						) ) }
					</Stack>
				</Stack>

				<Divider />

				{ /* Rate limit */ }
				<Stack spacing={ 2 }>
					<SectionHeader
						title={ __( 'Rate Limiting', 'rest-api-firewall' ) }
						description={ __( 'Per-user request cap. Overrides the application-level rate limit when stricter limits are needed.', 'rest-api-firewall' ) }
					/>

					<Stack direction={ { xs: 'column', sm: 'row' } } spacing={ 2 }>
						<TextField
							label={ __( 'Max Requests', 'rest-api-firewall' ) }
							type="number"
							size="small"
							value={ rateLimitRequests }
							onChange={ ( e ) => setRateLimitRequests( e.target.value ) }
							helperText={ __( 'Requests allowed per window', 'rest-api-firewall' ) }
							inputProps={ { min: 1 } }
							sx={ { maxWidth: 200 } }
						/>
						<TextField
							label={ __( 'Window (seconds)', 'rest-api-firewall' ) }
							type="number"
							size="small"
							value={ rateLimitWindow }
							onChange={ ( e ) => setRateLimitWindow( e.target.value ) }
							helperText={ __( 'Rolling time window', 'rest-api-firewall' ) }
							inputProps={ { min: 1 } }
							sx={ { maxWidth: 200 } }
						/>
					</Stack>
				</Stack>

			</Stack>
		</Stack>
	);
}
