import { useState, useEffect, useCallback } from '@wordpress/element';
import { useAdminData } from '../../contexts/AdminDataContext';
import { useLicense } from '../../contexts/LicenseContext';
import useProActions from '../../hooks/useProActions';
import useSettingsForm from '../../hooks/useSettingsForm';
import useSaveOptions from '../../hooks/useSaveOptions';
import GlobalProperties from '../ApiOutput/GlobalProperties';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
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

import AddIcon from '@mui/icons-material/Add';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';

import { isValidIpOrCidr } from '../../utils/sanitizeIp';
import { isValidOrigin } from '../../utils/sanitizeHost';
import formatDate from '../../utils/formatDate';
import LoadingMessage from '../LoadingMessage';

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

function ChipInput( {
	values,
	onChange,
	placeholder,
	validate,
	inputSx = {},
} ) {
	const [ inputValue, setInputValue ] = useState( '' );
	const [ inputError, setInputError ] = useState( '' );
	const { __ } = wp.i18n || {};

	const add = () => {
		const val = inputValue.trim();
		if ( ! val ) {
			return;
		}

		if ( validate ) {
			const msg = validate( val );
			if ( msg ) {
				setInputError( msg );
				return;
			}
		}

		setInputError( '' );
		if ( ! values.includes( val ) ) {
			onChange( [ ...values, val ] );
		}
		setInputValue( '' );
	};

	const remove = ( val ) => onChange( values.filter( ( v ) => v !== val ) );

	return (
		<Stack spacing={ 1 }>
			<Stack
				direction="row"
				spacing={ 1 }
				alignItems="flex-start"
				sx={ { maxWidth: 420, ...inputSx } }
			>
				<TextField
					value={ inputValue }
					onChange={ ( e ) => {
						setInputValue( e.target.value );
						if ( inputError ) {
							setInputError( '' );
						}
					} }
					onKeyDown={ ( e ) => {
						if ( e.key === 'Enter' ) {
							e.preventDefault();
							add();
						}
					} }
					placeholder={ placeholder }
					size="small"
					error={ !! inputError }
					helperText={ inputError || '' }
					sx={ { flex: 1 } }
				/>
				<IconButton
					size="small"
					onClick={ add }
					disabled={ ! inputValue.trim() }
					aria-label={ __( 'Add', 'rest-api-firewall' ) }
					sx={ { mt: '4px' } }
				>
					<AddIcon />
				</IconButton>
			</Stack>

			{ values.length > 0 && (
				<Box sx={ { display: 'flex', flexWrap: 'wrap', gap: 1 } }>
					{ values.map( ( val ) => (
						<Chip
							key={ val }
							label={ val }
							size="small"
							onDelete={ () => remove( val ) }
							sx={ { fontFamily: 'monospace' } }
						/>
					) ) }
				</Box>
			) }
		</Stack>
	);
}

export default function ApplicationEditor( { application, onBack } ) {
	const { adminData } = useAdminData();
	const { proNonce } = useLicense();
	const nonce = proNonce || adminData.nonce;

	const { form: outputForm, setField: setOutputField } = useSettingsForm( {
		adminData,
	} );
	const { save: saveOutput, saving: savingOutput } = useSaveOptions();
	const { __ } = wp.i18n || {};

	const { save, remove, saving } = useProActions();

	const isNew = ! application.id;
	const [ loading, setLoading ] = useState( ! isNew );
	const [ loadError, setLoadError ] = useState( '' );

	const [ title, setTitle ] = useState( application.title || '' );
	const [ enabled, setEnabled ] = useState( application.active ?? true );
	const [ description, setDescription ] = useState( '' );
	const [ allowedIps, setAllowedIps ] = useState( [] );
	const [ allowedOrigins, setAllowedOrigins ] = useState( [] );
	const [ rateLimitRequests, setRateLimitRequests ] = useState( 100 );
	const [ rateLimitWindow, setRateLimitWindow ] = useState( 60 );
	const [ policyActive, setPolicyActive ] = useState(
		application.policy ?? false
	);

	const [ author, setAuthor ] = useState( '' );
	const [ dateCreated, setDateCreated ] = useState( '' );
	const [ dateModified, setDateModified ] = useState( '' );

	const [ appUsers, setAppUsers ] = useState( [] );
	const [ usersLoading, setUsersLoading ] = useState( false );
	const [ addUserValue, setAddUserValue ] = useState( '' );
	const [ userError, setUserError ] = useState( '' );

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
					action: 'get_application_entry',
					nonce,
					id: application.id,
				} ),
			} );
			const result = await response.json();

			if ( result?.success && result?.data?.entry ) {
				const e = result.data.entry;
				setTitle( e.title || '' );
				setEnabled( e.active ?? true );
				setPolicyActive( e.policy ?? false );
				setAuthor( e.author_name || '' );
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

				const s = e.settings || {};
				setDescription( s.description || '' );
				setAllowedIps( s.allowed_ips || [] );
				setAllowedOrigins( s.allowed_origins || [] );
				setRateLimitRequests( s.rate_limit?.max_requests ?? 100 );
				setRateLimitWindow( s.rate_limit?.window_seconds ?? 60 );
			}
		} catch ( err ) {
			setLoadError( err.message );
		} finally {
			setLoading( false );
		}
	}, [ adminData, nonce, application.id ] );

	const loadUsers = useCallback( async () => {
		setUsersLoading( true );
		try {
			const response = await fetch( adminData.ajaxurl, {
				method: 'POST',
				headers: {
					'Content-Type':
						'application/x-www-form-urlencoded; charset=UTF-8',
				},
				body: new URLSearchParams( {
					action: 'get_application_users',
					nonce,
					application_id: application.id,
				} ),
			} );
			const result = await response.json();
			if ( result?.success && result?.data?.users ) {
				setAppUsers( result.data.users );
			}
		} finally {
			setUsersLoading( false );
		}
	}, [ adminData, nonce, application.id ] );

	useEffect( () => {
		if ( isNew ) {
			return;
		}
		loadEntry();
		loadUsers();
	}, [ isNew, loadEntry, loadUsers ] );

	const handleSave = () => {
		if ( ! title.trim() ) {
			return;
		}

		save(
			{
				action: isNew
					? 'add_application_entry'
					: 'update_application_entry',
				...( ! isNew && { id: application.id } ),
				title: title.trim(),
				enabled: enabled ? '1' : '0',
				settings: JSON.stringify( {
					description,
					allowed_ips: allowedIps,
					allowed_origins: allowedOrigins,
					rate_limit: {
						max_requests: parseInt( rateLimitRequests, 10 ) || 100,
						window_seconds: parseInt( rateLimitWindow, 10 ) || 60,
					},
				} ),
			},
			{
				skipConfirm: true,
				successTitle: __( 'Application Saved', 'rest-api-firewall' ),
				successMessage: __(
					'Application saved successfully.',
					'rest-api-firewall'
				),
				onSuccess: isNew ? onBack : undefined,
			}
		);
	};

	const handleDelete = () => {
		remove(
			{
				action: 'delete_application_entry',
				id: application.id,
			},
			{
				confirmTitle: __( 'Delete Application', 'rest-api-firewall' ),
				confirmMessage: __(
					'Are you sure you want to permanently delete this application? This action cannot be undone.',
					'rest-api-firewall'
				),
				confirmLabel: __( 'Delete', 'rest-api-firewall' ),
				successTitle: __( 'Application Deleted', 'rest-api-firewall' ),
				successMessage: __(
					'The application has been removed.',
					'rest-api-firewall'
				),
				onSuccess: onBack,
			}
		);
	};

	const handleAddUser = async () => {
		if ( ! addUserValue ) {
			return;
		}
		setUserError( '' );

		try {
			const response = await fetch( adminData.ajaxurl, {
				method: 'POST',
				headers: {
					'Content-Type':
						'application/x-www-form-urlencoded; charset=UTF-8',
				},
				body: new URLSearchParams( {
					action: 'add_application_user',
					nonce,
					application_id: application.id,
					wp_user_id: addUserValue,
				} ),
			} );
			const result = await response.json();

			if ( result?.success && result?.data?.user ) {
				setAppUsers( ( prev ) => [ ...prev, result.data.user ] );
				setAddUserValue( '' );
			} else {
				setUserError(
					result?.data?.message ||
						__( 'Failed to add user', 'rest-api-firewall' )
				);
			}
		} catch ( err ) {
			setUserError( err.message );
		}
	};

	const handleRemoveUser = async ( userId ) => {
		setAppUsers( ( prev ) => prev.filter( ( u ) => u.id !== userId ) );

		try {
			const response = await fetch( adminData.ajaxurl, {
				method: 'POST',
				headers: {
					'Content-Type':
						'application/x-www-form-urlencoded; charset=UTF-8',
				},
				body: new URLSearchParams( {
					action: 'remove_application_user',
					nonce,
					user_id: userId,
				} ),
			} );
			const result = await response.json();
			if ( ! result?.success ) {
				loadUsers();
			}
		} catch {
			loadUsers();
		}
	};

	const availableWpUsers = ( adminData?.users || [] ).filter(
		( wpUser ) =>
			! appUsers.some(
				( au ) => String( au.wp_user_id ) === String( wpUser.value )
			)
	);

	if ( loading ) {
		return <LoadingMessage />;
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
						<IconButton
							size="small"
							onClick={ onBack }
							aria-label={ __( 'Back', 'rest-api-firewall' ) }
						>
							<ArrowBackIcon />
						</IconButton>
					</Stack>
					<Stack
						spacing={ 0 }
						direction={ { xs: 'column', sm: 'row' } }
						alignItems={ { xs: 'flex-start', sm: 'center' } }
						gap={ { xs: 0, sm: 2 } }
					>
						<Typography
							variant="h6"
							fontWeight={ 600 }
							sx={ { flex: 1, minWidth: 0 } }
							noWrap
						>
							{ title || application.title }
						</Typography>
						{ ( author || dateCreated || dateModified ) && (
							<Stack
								direction={ { xs: 'column', sm: 'row' } }
								gap={ { xs: 0, xl: 2 } }
								flexWrap="wrap"
							>
								<FormControlLabel
									control={
										<Switch
											checked={ enabled }
											onChange={ ( e ) =>
												setEnabled( e.target.checked )
											}
											size="small"
										/>
									}
									label={ __(
										'Active',
										'rest-api-firewall'
									) }
								/>
								<Typography
									variant="caption"
									color="text.secondary"
								>
									{ author && (
										<span>
											{ author }
											{ dateCreated &&
												` @ ${ dateCreated }` }
										</span>
									) }
									{ dateModified && (
										<>
											<br />
											<span>
												{ __(
													'Mod.',
													'rest-api-firewall'
												) }{ ' ' }
												{ dateModified }
											</span>
										</>
									) }
								</Typography>
							</Stack>
						) }
					</Stack>
				</Stack>
				<Stack direction="row" gap={ 2 }>
					<Button
						variant="contained"
						size="small"
						disableElevation
						disabled={ saving || ! title.trim() }
						onClick={ handleSave }
					>
						{ __( 'Save', 'rest-api-firewall' ) }
					</Button>

					{ ! isNew && (
						<Button
							variant="outlined"
							color="error"
							size="small"
							startIcon={ <DeleteOutlineIcon /> }
							onClick={ handleDelete }
						>
							{ __( 'Delete', 'rest-api-firewall' ) }
						</Button>
					) }
				</Stack>
			</Toolbar>

			{ loadError && <Alert severity="error">{ loadError }</Alert> }

			<Stack
				p={ { xs: 2, sm: 4 } }
				spacing={ 3 }
				sx={ { maxWidth: 760 } }
			>
				<Stack spacing={ 2 }>
					<SectionHeader
						title={ __( 'General', 'rest-api-firewall' ) }
					/>

					<TextField
						label={ __( 'Title', 'rest-api-firewall' ) }
						value={ title }
						onChange={ ( e ) => setTitle( e.target.value ) }
						size="small"
						sx={ { maxWidth: 340 } }
					/>

					<TextField
						label={ __( 'Description', 'rest-api-firewall' ) }
						value={ description }
						onChange={ ( e ) => setDescription( e.target.value ) }
						size="small"
						multiline
						rows={ 3 }
						placeholder={ __(
							'Optional notes about this application, its purpose, or linked services.',
							'rest-api-firewall'
						) }
						sx={ { maxWidth: 560 } }
					/>
				</Stack>

				<Divider />

				<Stack spacing={ 2 }>
					<SectionHeader
						title={ __(
							'Allowed IPs & CIDR',
							'rest-api-firewall'
						) }
						description={ __(
							'If populated, only requests from these IPs or CIDR ranges are accepted. Leave empty to allow all IPs.',
							'rest-api-firewall'
						) }
					/>

					<ChipInput
						values={ allowedIps }
						onChange={ setAllowedIps }
						placeholder="203.0.113.0/24"
						validate={ ( val ) =>
							isValidIpOrCidr( val )
								? null
								: __(
										'Invalid IP address or CIDR range',
										'rest-api-firewall'
								  )
						}
					/>
				</Stack>

				<Divider />

				<Stack spacing={ 2 }>
					<SectionHeader
						title={ __( 'Allowed Origins', 'rest-api-firewall' ) }
						description={ __(
							'Filter by HTTP Origin header. Useful on shared/mutualized hosting where caller IPs are unstable (CDN, serverless).',
							'rest-api-firewall'
						) }
					/>

					<Alert
						severity="warning"
						icon={ <WarningAmberOutlinedIcon fontSize="small" /> }
						sx={ { maxWidth: 560 } }
					>
						{ __(
							'The Origin header is client-controlled and can be spoofed. Use as a supplementary check only — always combine with user authentication (JWT or WP Application Password).',
							'rest-api-firewall'
						) }
					</Alert>

					<ChipInput
						values={ allowedOrigins }
						onChange={ setAllowedOrigins }
						placeholder="https://app.example.com"
						validate={ ( val ) =>
							isValidOrigin( val )
								? null
								: __(
										'Invalid origin. Use https://domain.com[:port] format.',
										'rest-api-firewall'
								  )
						}
					/>
				</Stack>

				{ ! isNew && (
					<>
						<Divider />

						<Stack spacing={ 2 }>
							<SectionHeader
								title={ __(
									'Authorized Users',
									'rest-api-firewall'
								) }
								description={ __(
									'WordPress users allowed to authenticate with this application via Application Password or JWT.',
									'rest-api-firewall'
								) }
							/>

							<Stack
								direction="row"
								spacing={ 1 }
								alignItems="center"
								sx={ { maxWidth: 420 } }
							>
								<FormControl
									size="small"
									sx={ { flex: 1 } }
									disabled={ availableWpUsers.length === 0 }
								>
									<InputLabel>
										{ __(
											'Add User',
											'rest-api-firewall'
										) }
									</InputLabel>
									<Select
										value={ addUserValue }
										onChange={ ( e ) =>
											setAddUserValue( e.target.value )
										}
										label={ __(
											'Add User',
											'rest-api-firewall'
										) }
									>
										{ availableWpUsers.map( ( u ) => (
											<MenuItem
												key={ u.value }
												value={ u.value }
											>
												{ u.label }
											</MenuItem>
										) ) }
									</Select>
								</FormControl>

								<IconButton
									size="small"
									onClick={ handleAddUser }
									disabled={ ! addUserValue }
									aria-label={ __(
										'Add user',
										'rest-api-firewall'
									) }
								>
									<AddIcon />
								</IconButton>
							</Stack>

							{ userError && (
								<Typography variant="body2" color="error">
									{ userError }
								</Typography>
							) }

							{ ! usersLoading &&
								appUsers.length === 0 &&
								! userError && (
									<Typography
										variant="body2"
										color="text.secondary"
									>
										{ __(
											'No users linked yet.',
											'rest-api-firewall'
										) }
									</Typography>
								) }

							{ appUsers.length > 0 && (
								<Stack spacing={ 1 }>
									{ appUsers.map( ( user ) => (
										<Stack
											key={ user.id }
											direction="row"
											alignItems="center"
											justifyContent="space-between"
											sx={ {
												px: 2,
												py: 1,
												border: 1,
												borderColor: 'divider',
												borderRadius: 1,
												maxWidth: 420,
											} }
										>
											<Stack>
												<Typography variant="body2">
													{ user.display_name }
												</Typography>
												<Typography
													variant="caption"
													color="text.secondary"
												>
													{ user.status }
												</Typography>
											</Stack>

											<IconButton
												size="small"
												onClick={ () =>
													handleRemoveUser( user.id )
												}
												aria-label={ __(
													'Remove user',
													'rest-api-firewall'
												) }
											>
												<DeleteOutlineIcon fontSize="small" />
											</IconButton>
										</Stack>
									) ) }
								</Stack>
							) }
						</Stack>
					</>
				) }

				<Divider />

				<Stack spacing={ 2 }>
					<SectionHeader
						title={ __( 'Rate Limiting', 'rest-api-firewall' ) }
						description={ __(
							'Application-level cap applied across all routes and users.',
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
							inputProps={ { min: 1 } }
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
							inputProps={ { min: 1 } }
							sx={ { maxWidth: 200 } }
						/>
					</Stack>
				</Stack>

				<Divider />

				<Stack spacing={ 1 }>
					<SectionHeader
						title={ __( 'Route Policy', 'rest-api-firewall' ) }
						description={
							policyActive
								? __(
										'A route policy is active for this application. Configure access rules in the Routes panel.',
										'rest-api-firewall'
								  )
								: __(
										'No route policy yet. Use the Routes panel to define per-route access rules.',
										'rest-api-firewall'
								  )
						}
					/>
					<Box>
						<Chip
							label={
								policyActive
									? __( 'Policy active', 'rest-api-firewall' )
									: __( 'No policy', 'rest-api-firewall' )
							}
							color={ policyActive ? 'success' : 'default' }
							variant="outlined"
							size="small"
						/>
					</Box>
				</Stack>

				<Divider />

				{ /* REST Output Settings — global WP options displayed per-application */ }
				<Stack spacing={ 2 }>
					<Stack
						direction="row"
						alignItems="center"
						justifyContent="space-between"
					>
						<SectionHeader
							title={ __(
								'REST Output Settings',
								'rest-api-firewall'
							) }
							description={ __(
								'Global output transformations applied to REST responses. Changes here affect all applications.',
								'rest-api-firewall'
							) }
						/>
						<Button
							size="small"
							variant="outlined"
							disabled={ savingOutput }
							onClick={ () =>
								saveOutput(
									{
										models_properties:
											outputForm.models_properties,
									},
									{
										successTitle: __(
											'Output Settings Saved',
											'rest-api-firewall'
										),
										successMessage: __(
											'REST output settings saved successfully.',
											'rest-api-firewall'
										),
										confirmMessage: __(
											'Save REST output settings?',
											'rest-api-firewall'
										),
									}
								)
							}
						>
							{ __(
								'Save Output Settings',
								'rest-api-firewall'
							) }
						</Button>
					</Stack>
					<GlobalProperties
						form={ outputForm }
						setField={ setOutputField }
					/>
				</Stack>
			</Stack>
		</Stack>
	);
}
