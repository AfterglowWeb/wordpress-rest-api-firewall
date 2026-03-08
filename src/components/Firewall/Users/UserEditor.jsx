import { useState, useEffect, useCallback } from '@wordpress/element';
import { useAdminData } from '../../../contexts/AdminDataContext';
import { useLicense } from '../../../contexts/LicenseContext';
import { useApplication } from '../../../contexts/ApplicationContext';

import useProActions from '../../../hooks/useProActions';
import formatDate from '../../../utils/formatDate';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import Divider from '@mui/material/Divider';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormControl from '@mui/material/FormControl';
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

import AuthManager from './AuthManager';
import LoadingMessage from '../../LoadingMessage';

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

export default function UserEditor( { user, onBack } ) {
	const { adminData } = useAdminData();
	const { proNonce } = useLicense();
	const { selectedApplicationId } = useApplication();
	
	const nonce = proNonce || adminData.nonce;
	const { __, sprintf } = wp.i18n || {};

	const { save, remove, saving } = useProActions();

	const isNew = ! user.id;

	const [ loading, setLoading ] = useState( ! isNew );
	const [ loadError, setLoadError ] = useState( '' );

	const [ wpUserId, setWpUserId ] = useState( '' );
	const [ title, setTitle ] = useState( user.display_name || '' );
	const [ author, setAuthor ] = useState( user.author_name || '' );
	const [ appTitle, setAppTitle ] = useState( user.app_title || '' );
	const [ dateCreated, setDateCreated ] = useState( '' );
	const [ dateModified, setDateModified ] = useState( '' );

	const [ enabled, setEnabled ] = useState( user.status === 'active' );
	const [ authMethod, setAuthMethod ] = useState( user.auth_method || 'any' );
	const [ authConfig, setAuthConfig ] = useState( user.auth_config || {} );
	const [ allowedMethods, setAllowedMethods ] = useState(
		user.allowed_methods || [ 'get' ]
	);
	const [ rateLimitRequests, setRateLimitRequests ] = useState(
		user.rate_limit_max_requests ?? 100
	);
	const [ rateLimitWindow, setRateLimitWindow ] = useState(
		user.rate_limit_window_seconds ?? 60
	);

	const [ rateLimitRelease, setRateLimitRelease] = useState(
		user.rate_limit_release_seconds ?? 300
	);

	const loadEntry = useCallback( async () => {
		setLoading( true );
		try {
			const response = await fetch( adminData.ajaxurl, {
				method: 'POST',
				headers: {
					'Content-Type':
						'application/x-www-form-urlencoded; charset=UTF-8',
				},
				body: new URLSearchParams( {
					action: 'get_user_entry',
					nonce,
					id: user.id,
				} ),
			} );
			const result = await response.json();

			if ( result?.success && result?.data?.entry ) {
				const e = result.data.entry;
				setTitle( e.display_name || '' );
				setAuthor( e.author_name || '' );
				setEnabled( e.status === 'active' );
				setDateCreated(
					formatDate(
						e.date_created,
						adminData.date_format,
						adminData.time_format
					)
				);
				setDateModified(
					formatDate(
						e.date_modified,
						adminData.date_format,
						adminData.time_format
					)
				);

				setAppTitle( e.app_title || '' );
				setAuthMethod( e.auth_method || 'any' );
				setAuthConfig( e.auth_config || {} );
				setAllowedMethods( e.allowed_methods || [ 'get' ] );
				setRateLimitRequests( e.rate_limit_max_requests ?? 100 );
				setRateLimitWindow( e.rate_limit_window_seconds ?? 60 );
				setRateLimitRelease( e.rate_limit_release_seconds ?? 300 );
				
			} else {
				setLoadError(
					result?.data?.message ||
						__( 'Failed to load user', 'rest-api-firewall' )
				);
			}
		} catch ( err ) {
			setLoadError( err.message );
		} finally {
			setLoading( false );
		}
	}, [ adminData, nonce, user.id ] );

	useEffect( () => {
		if ( isNew ) {
			return;
		}
		loadEntry();
	}, [ isNew, loadEntry ] );

	const toggleMethod = ( method ) => {
		setAllowedMethods( ( prev ) =>
			prev.includes( method )
				? prev.filter( ( m ) => m !== method )
				: [ ...prev, method ]
		);
	};

	const commonPayload = {
		application_id: selectedApplicationId,
		status: enabled ? 'active' : 'inactive',
		auth_method: authMethod,
		auth_config: JSON.stringify( authConfig ),
		allowed_methods: JSON.stringify( allowedMethods ),
		rate_limit_max_requests: String(
			parseInt( rateLimitRequests, 10 ) || 100
		),
		rate_limit_window_seconds: String(
			parseInt( rateLimitWindow, 10 ) || 60
		),
		rate_limit_release: String(
			parseInt( rateLimitRelease, 10 ) || 300
		),
	};

	const handleSave = () => {
		if ( isNew ) {
			if ( ! wpUserId ) {
				return;
			}
			save(
				{
					action: 'add_user_entry',
					application_id: user.application_id,
					wp_user_id: wpUserId,
					...commonPayload,
				},
				{
					skipConfirm: true,
					successTitle: __( 'User Added', 'rest-api-firewall' ),
					successMessage: __(
						'User added successfully.',
						'rest-api-firewall'
					),
					onSuccess: onBack,
				}
			);
		} else {
			save(
				{ action: 'update_user_entry', id: user.id, ...commonPayload },
				{
					skipConfirm: true,
					successTitle: __( 'User Saved', 'rest-api-firewall' ),
					successMessage: __(
						'User settings saved successfully.',
						'rest-api-firewall'
					),
				}
			);
		}
	};

	const handleDelete = () => {
		remove(
			{ action: 'delete_user_entry', id: user.id },
			{
				confirmTitle: __( 'Delete User', 'rest-api-firewall' ),
				confirmMessage: __(
					'Are you sure you want to permanently delete this user? This action cannot be undone.',
					'rest-api-firewall'
				),
				confirmLabel: __( 'Delete', 'rest-api-firewall' ),
				successTitle: __( 'User Deleted', 'rest-api-firewall' ),
				successMessage: __(
					'The user has been removed.',
					'rest-api-firewall'
				),
				onSuccess: onBack,
			}
		);
	};

	if ( loading ) {
		return <LoadingMessage />;
	}

	return (
		<Stack spacing={ 0 }>
			<EntryToolbar
				isNew={ isNew }
				title={ title }
				author={ author }
				dateCreated={ dateCreated }
				dateModified={ dateModified }
				handleBack={ onBack }
				handleSave={ handleSave }
				handleDelete={ handleDelete }
				saving={ saving }
				enabled={ isNew ? null : enabled }
				setEnabled={ isNew ? null : ( checked ) => { setEnabled( checked ); setDirty( true ); } }
			>
			{ appTitle && (
				<Typography
					variant="caption"
					color="text.secondary"
					sx={ { textAlign: 'left' } }
				>
					{ appTitle && (
						<span>
							{ sprintf(
								__(
									'Added to %s',
									'rest-api-firewall'
								),
								appTitle
							) }
						</span>
					) }
				</Typography>
			) }
			</EntryToolbar>

			{ loadError && <Alert severity="error">{ loadError }</Alert> }

			<Stack
				p={ { xs: 2, sm: 4 } }
				spacing={ 3 }
				sx={ { maxWidth: 760 } }
			>
				{ isNew && (
					<Stack spacing={ 2 }>
						<SectionHeader
							title={ __(
								'WordPress User',
								'rest-api-firewall'
							) }
							description={ __(
								'Select the WordPress user to link to this application.',
								'rest-api-firewall'
							) }
						/>
						<FormControl
							size="small"
							sx={ { maxWidth: 340 } }
							required
						>
							<InputLabel>
								{ __( 'WordPress User', 'rest-api-firewall' ) }
							</InputLabel>
							<Select
								value={ wpUserId }
								onChange={ ( e ) =>
									setWpUserId( e.target.value )
								}
								label={ __(
									'WordPress User',
									'rest-api-firewall'
								) }
							>
								{ ( adminData?.users || [] ).map( ( u ) => (
									<MenuItem key={ u.value } value={ u.value }>
										{ u.label }
									</MenuItem>
								) ) }
							</Select>
						</FormControl>

						<Divider />
					</Stack>
				) }

				<Stack spacing={ 2 }>
					<SectionHeader
						title={ __(
							'Authentication Method',
							'rest-api-firewall'
						) }
						description={ __(
							'Restrict which authentication mechanism this user must use. "Any" allows all configured methods.',
							'rest-api-firewall'
						) }
					/>
					<AuthManager
						authMethod={ authMethod }
						onAuthMethodChange={ setAuthMethod }
						authConfig={ authConfig }
						onAuthConfigChange={ setAuthConfig }
					/>
				</Stack>

				<Divider />

				<Stack spacing={ 2 }>
					<SectionHeader
						title={ __(
							'Allowed HTTP Methods',
							'rest-api-firewall'
						) }
						description={ __(
							'Which HTTP verbs this user is allowed to use against the API.',
							'rest-api-firewall'
						) }
					/>
					<Stack direction="row" flexWrap="wrap" gap={ 1 }>
						{ HTTP_METHODS.map( ( method ) => (
							<FormControlLabel
								key={ method }
								label={
									<Typography
										variant="body2"
										sx={ {
											fontFamily: 'monospace',
											fontWeight: 600,
										} }
									>
										{ method.toUpperCase() }
									</Typography>
								}
								control={
									<Checkbox
										checked={ allowedMethods.includes(
											method
										) }
										onChange={ () =>
											toggleMethod( method )
										}
										size="small"
									/>
								}
								sx={ {
									m: 0,
									px: 1.5,
									py: 0.5,
									border: 1,
									borderColor: allowedMethods.includes(
										method
									)
										? 'primary.main'
										: 'divider',
									borderRadius: 1,
									userSelect: 'none',
								} }
							/>
						) ) }
					</Stack>
				</Stack>

				<Divider />

				<Stack spacing={ 2 }>
					<SectionHeader
						title={ __( 'Rate Limiting', 'rest-api-firewall' ) }
						description={ __(
							'Per-user request cap. Overrides the application-level rate limit when stricter limits are needed.',
							'rest-api-firewall'
						) }
					/>
					<Stack
						direction={ { xs: 'column', sm: 'row' } }
						spacing={ 2 }
					>
						<TextField
							label={ __( 'Max Requests', 'rest-api-firewall' ) }
							type="number"
							size="small"
							value={ rateLimitRequests }
							onChange={ ( e ) =>
								setRateLimitRequests( e.target.value )
							}
							helperText={ __(
								'Requests allowed per window',
								'rest-api-firewall'
							) }
							sx={ { maxWidth: 200 } }
						/>
						<TextField
							label={ __(
								'Window (seconds)',
								'rest-api-firewall'
							) }
							type="number"
							size="small"
							value={ rateLimitWindow }
							onChange={ ( e ) =>
								setRateLimitWindow( e.target.value )
							}
							helperText={ __(
								'Rolling time window',
								'rest-api-firewall'
							) }
							sx={ { maxWidth: 200 } }
						/>
						<TextField
							label={ __(
								'Release (seconds)',
								'rest-api-firewall'
							) }
							type="number"
							size="small"
							helperText={ __(
								'Wait time before limitation resets',
								'rest-api-firewall'
							) }
							value={ rateLimitRelease }
							onChange={ ( e ) =>
								setRateLimitRelease( e.target.value ) }
							sx={ {  maxWidth: 200 } }
						/>
					</Stack>
				</Stack>
			</Stack>
		</Stack>
	);
}
