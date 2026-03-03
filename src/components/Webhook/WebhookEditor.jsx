import { useState, useEffect, useCallback } from '@wordpress/element';
import { useAdminData } from '../../contexts/AdminDataContext';
import { useLicense } from '../../contexts/LicenseContext';
import useProActions from '../../hooks/useProActions';
import formatDate from '../../utils/formatDate';

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

import WebhookEditorSecretManager from './WebhookEditorSecretManager';

const HTTP_METHODS = [ 'POST', 'PUT', 'PATCH' ];

const WEBHOOK_TYPES = [
	{ value: 'general', label: 'General' },
	{ value: 'notification', label: 'Notification' },
	{ value: 'automation', label: 'Automation' },
	{ value: 'data_sync', label: 'Data Sync' },
	{ value: 'alert', label: 'Alert' },
];

const normalizeHeaders = ( raw ) =>
	( Array.isArray( raw ) ? raw : [] ).map( ( h ) => ( {
		...h,
		_id: Math.random().toString( 36 ).slice( 2 ),
	} ) );

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

function HeadersEditor( { headers, onChange } ) {
	const { __ } = wp.i18n || {};

	const add = () =>
		onChange( [
			...headers,
			{
				_id: Math.random().toString( 36 ).slice( 2 ),
				key: '',
				value: '',
			},
		] );

	const remove = ( id ) =>
		onChange( headers.filter( ( h ) => h._id !== id ) );

	const update = ( id, field, val ) =>
		onChange(
			headers.map( ( h ) =>
				h._id === id ? { ...h, [ field ]: val } : h
			)
		);

	return (
		<Stack spacing={ 1 }>
			{ headers.map( ( h ) => (
				<Stack
					key={ h._id }
					direction="row"
					spacing={ 1 }
					alignItems="center"
				>
					<TextField
						label={ __( 'Name', 'rest-api-firewall' ) }
						size="small"
						value={ h.key }
						onChange={ ( e ) =>
							update( h._id, 'key', e.target.value )
						}
						placeholder="X-Api-Key"
						sx={ { maxWidth: 200 } }
						inputProps={ { sx: { fontFamily: 'monospace' } } }
					/>
					<TextField
						label={ __( 'Value', 'rest-api-firewall' ) }
						size="small"
						value={ h.value }
						onChange={ ( e ) =>
							update( h._id, 'value', e.target.value )
						}
						placeholder="..."
						sx={ { maxWidth: 300 } }
						inputProps={ { sx: { fontFamily: 'monospace' } } }
					/>
					<IconButton
						size="small"
						onClick={ () => remove( h._id ) }
						aria-label={ __(
							'Remove header',
							'rest-api-firewall'
						) }
					>
						<DeleteOutlineIcon fontSize="small" />
					</IconButton>
				</Stack>
			) ) }

			<Box>
				<Button
					size="small"
					variant="outlined"
					startIcon={ <AddIcon /> }
					onClick={ add }
				>
					{ __( 'Add Header', 'rest-api-firewall' ) }
				</Button>
			</Box>
		</Stack>
	);
}

export default function WebhookEditor( { webhook, onBack } ) {
	const { adminData } = useAdminData();
	const { proNonce } = useLicense();
	const nonce = proNonce || adminData.nonce;
	const { __ } = wp.i18n || {};

	const { save, remove, saving } = useProActions();

	const isNew = ! webhook.id;

	const [ loading, setLoading ] = useState( ! isNew );
	const [ loadError, setLoadError ] = useState( '' );

	const [ title, setTitle ] = useState( webhook.title || '' );
	const [ endpoint, setEndpoint ] = useState( webhook.endpoint || '' );
	const [ method, setMethod ] = useState( webhook.method || 'POST' );
	const [ active, setActive ] = useState(
		webhook.active !== undefined ? webhook.active : true
	);
	const [ headers, setHeaders ] = useState(
		normalizeHeaders( webhook.headers )
	);
	const [ timeoutSeconds, setTimeoutSeconds ] = useState(
		webhook.timeout_seconds ?? 10
	);
	const [ retryCount, setRetryCount ] = useState( webhook.retry_count ?? 0 );
	const [ bodyPayload, setBodyPayload ] = useState(
		webhook.body_payload || ''
	);
	const [ type, setType ] = useState( webhook.type || 'general' );
	const [ dateCreated, setDateCreated ] = useState( '' );
	const [ dateModified, setDateModified ] = useState( '' );
	const [ hasSecret, setHasSecret ] = useState( false );
	const [ pendingSecret, setPendingSecret ] = useState( undefined );

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
					action: 'get_webhook_entry',
					nonce,
					id: webhook.id,
				} ),
			} );
			const result = await response.json();

			if ( result?.success && result?.data?.entry ) {
				const e = result.data.entry;
				setTitle( e.title || '' );
				setEndpoint( e.endpoint || '' );
				setMethod( e.method || 'POST' );
				setActive( e.active !== undefined ? e.active : true );
				setHeaders( normalizeHeaders( e.headers ) );
				setTimeoutSeconds( e.timeout_seconds ?? 10 );
				setRetryCount( e.retry_count ?? 0 );
				setBodyPayload( e.body_payload || '' );
				setType( e.type || 'general' );
				setHasSecret( e.has_secret || false );
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
			} else {
				setLoadError(
					result?.data?.message ||
						__( 'Failed to load webhook', 'rest-api-firewall' )
				);
			}
		} catch ( err ) {
			setLoadError( err.message );
		} finally {
			setLoading( false );
		}
	}, [ adminData, nonce, webhook.id ] );

	useEffect( () => {
		if ( isNew ) {
			return;
		}
		loadEntry();
	}, [ isNew, loadEntry ] );

	const commonPayload = {
		title,
		endpoint,
		method,
		active: active ? '1' : '0',
		headers: JSON.stringify(
			headers.map( ( { key, value } ) => ( { key, value } ) )
		),
		timeout_seconds: String( parseInt( timeoutSeconds, 10 ) || 10 ),
		retry_count: String( parseInt( retryCount, 10 ) || 0 ),
		body_payload: bodyPayload,
		type,
		...( pendingSecret !== undefined
			? { secret: pendingSecret ?? '' }
			: {} ),
	};

	const handleSave = () => {
		if ( isNew ) {
			if ( ! title ) {
				return;
			}
			save(
				{ action: 'add_webhook_entry', ...commonPayload },
				{
					skipConfirm: true,
					successTitle: __( 'Webhook Created', 'rest-api-firewall' ),
					successMessage: __(
						'Webhook created successfully.',
						'rest-api-firewall'
					),
					onSuccess: onBack,
				}
			);
		} else {
			save(
				{
					action: 'update_webhook_entry',
					id: webhook.id,
					...commonPayload,
				},
				{
					skipConfirm: true,
					successTitle: __( 'Webhook Saved', 'rest-api-firewall' ),
					successMessage: __(
						'Webhook settings saved successfully.',
						'rest-api-firewall'
					),
					onSuccess: () => setPendingSecret( undefined ),
				}
			);
		}
	};

	const handleDelete = () => {
		remove(
			{ action: 'delete_webhook_entry', id: webhook.id },
			{
				confirmTitle: __( 'Delete Webhook', 'rest-api-firewall' ),
				confirmMessage: title
					? `${ __(
							'Permanently delete',
							'rest-api-firewall'
					  ) } "${ title }"? ${ __(
							'This action cannot be undone.',
							'rest-api-firewall'
					  ) }`
					: __(
							'Permanently delete this webhook? This action cannot be undone.',
							'rest-api-firewall'
					  ),
				confirmLabel: __( 'Delete', 'rest-api-firewall' ),
				successTitle: __( 'Webhook Deleted', 'rest-api-firewall' ),
				successMessage: __(
					'The webhook has been removed.',
					'rest-api-firewall'
				),
				onSuccess: onBack,
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
			{ /* Toolbar */ }
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
						<Typography variant="h6" fontWeight={ 600 } sx={ { flex: 1, minWidth: 0 } } noWrap>
							{ isNew
								? __( 'New Webhook', 'rest-api-firewall' )
								: title }
						</Typography>

						{ ! isNew && (
							<Stack
								direction={ { xs: 'column', sm: 'row' } }
								gap={ { xs: 0, xl: 2 } }
								flexWrap="wrap"
							>
								<FormControlLabel
									control={
										<Switch
											checked={ active }
											onChange={ ( e ) =>
												setActive( e.target.checked )
											}
											size="small"
										/>
									}
									label={ __(
										'Active',
										'rest-api-firewall'
									) }
								/>
								{ type && type !== 'general' && (
									<Chip
										label={ type }
										size="small"
										variant="outlined"
									/>
								) }
								{ ( dateCreated || dateModified ) && (
									<Typography
										variant="caption"
										color="text.secondary"
									>
										{ dateCreated && (
											<span>{ dateCreated }</span>
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
								) }
							</Stack>
						) }
					</Stack>
				</Stack>

				<Stack direction="row" gap={ 2 }>
					<Button
						variant="contained"
						size="small"
						disableElevation
						disabled={ saving || ( isNew && ! title ) }
						onClick={ handleSave }
					>
						{ isNew
							? __( 'Create Webhook', 'rest-api-firewall' )
							: __( 'Save', 'rest-api-firewall' ) }
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
				{ isNew && (
					<FormControlLabel
						control={
							<Switch
								checked={ active }
								onChange={ ( e ) =>
									setActive( e.target.checked )
								}
								size="small"
							/>
						}
						label={ __( 'Active', 'rest-api-firewall' ) }
					/>
				) }

				<Stack spacing={ 2 }>
					<SectionHeader
						title={ __( 'Webhook', 'rest-api-firewall' ) }
						description={ __(
							'Configure the outgoing webhook endpoint.',
							'rest-api-firewall'
						) }
					/>

					<TextField
						label={ __( 'Title', 'rest-api-firewall' ) }
						size="small"
						value={ title }
						onChange={ ( e ) => setTitle( e.target.value ) }
						required
						sx={ { 
							maxWidth: 340,
							'& .MuiInputLabel-root:not(.Mui-focused)': {
								transform: 'translate(14px, 16px) scale(1)',
							}
						}}
					/>

					<Stack
						direction={ { xs: 'column', sm: 'row' } }
						spacing={ 2 }
					>
						<TextField
							label={ __( 'Endpoint URL', 'rest-api-firewall' ) }
							size="small"
							value={ endpoint }
							onChange={ ( e ) => setEndpoint( e.target.value ) }
							placeholder="https://api.example.com/webhook"
							sx={ { 
								flex: 1,
								'& .MuiInputLabel-root:not(.Mui-focused)': {
									transform: 'translate(14px, 16px) scale(1)',
								}
							}}
							helperText={ __(
								'The URL to send the webhook request to.',
								'rest-api-firewall'
							) }
						/>

						<FormControl size="small" sx={ { minWidth: 120 } }>
							<InputLabel>
								{ __( 'Method', 'rest-api-firewall' ) }
							</InputLabel>
							<Select
								value={ method }
								onChange={ ( e ) =>
									setMethod( e.target.value )
								}
								label={ __( 'Method', 'rest-api-firewall' ) }
							>
								{ HTTP_METHODS.map( ( m ) => (
									<MenuItem key={ m } value={ m }>
										{ m }
									</MenuItem>
								) ) }
							</Select>
						</FormControl>
					</Stack>

					<FormControl size="small" sx={ { maxWidth: 220 } }>
						<InputLabel>
							{ __( 'Type', 'rest-api-firewall' ) }
						</InputLabel>
						<Select
							value={ type }
							onChange={ ( e ) => setType( e.target.value ) }
							label={ __( 'Type', 'rest-api-firewall' ) }
						>
							{ WEBHOOK_TYPES.map( ( t ) => (
								<MenuItem key={ t.value } value={ t.value }>
									{ t.label }
								</MenuItem>
							) ) }
						</Select>
					</FormControl>
				</Stack>

				<Divider />
				
				<Stack spacing={ 2 }>
					<SectionHeader
						title={ __(
							'Authentication',
							'rest-api-firewall'
						) }
						description={ __(
							'Configure a secret to sign outgoing webhook requests using HMAC-SHA256.',
							'rest-api-firewall'
						) }
					/>
					<WebhookEditorSecretManager
						initialHasSecret={ hasSecret }
						onChange={ setPendingSecret }
					/>
				</Stack>

				<Divider />

				<Stack spacing={ 2 }>
					<SectionHeader
						title={ __( 'Headers', 'rest-api-firewall' ) }
						description={ __(
							'Optional custom HTTP headers to include with every request.',
							'rest-api-firewall'
						) }
					/>
					<HeadersEditor
						headers={ headers }
						onChange={ setHeaders }
					/>
				</Stack>

				<Divider />

				<Stack spacing={ 2 }>
					<SectionHeader
						title={ __( 'Body Payload', 'rest-api-firewall' ) }
						description={ __(
							'Optional JSON body template sent with the request. Leave empty to use the default event payload.',
							'rest-api-firewall'
						) }
					/>
					<TextField
						label={ __( 'Body', 'rest-api-firewall' ) }
						size="small"
						multiline
						rows={ 6 }
						value={ bodyPayload }
						onChange={ ( e ) => setBodyPayload( e.target.value ) }
						placeholder={
							'{\n  "event": "{{event_type}}",\n  "data": {{payload}}\n}'
						}
						helperText={ __(
							'Use {{placeholders}} for dynamic values.',
							'rest-api-firewall'
						) }
						inputProps={ {
							sx: {
								fontFamily: 'monospace',
								fontSize: '0.85rem',
							},
						} }
					/>
				</Stack>

				<Divider />

				<Stack spacing={ 2 }>
					<SectionHeader
						title={ __( 'Advanced', 'rest-api-firewall' ) }
						description={ __(
							'Timeout and retry behaviour for failed requests.',
							'rest-api-firewall'
						) }
					/>
					<Stack
						direction={ { xs: 'column', sm: 'row' } }
						spacing={ 2 }
					>
						<TextField
							label={ __(
								'Timeout (seconds)',
								'rest-api-firewall'
							) }
							type="number"
							size="small"
							value={ timeoutSeconds }
							onChange={ ( e ) =>
								setTimeoutSeconds( e.target.value )
							}
							inputProps={ { min: 1, max: 60 } }
							sx={ { maxWidth: 180 } }
							helperText={ __(
								'Request timeout',
								'rest-api-firewall'
							) }
						/>
						<TextField
							label={ __( 'Retry Count', 'rest-api-firewall' ) }
							type="number"
							size="small"
							value={ retryCount }
							onChange={ ( e ) =>
								setRetryCount( e.target.value )
							}
							inputProps={ { min: 0, max: 10 } }
							sx={ { maxWidth: 160 } }
							helperText={ __(
								'Retries on failure',
								'rest-api-firewall'
							) }
						/>
					</Stack>
				</Stack>

				
			</Stack>
		</Stack>
	);
}
