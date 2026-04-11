import { useState, useEffect, useCallback, useMemo, useRef } from '@wordpress/element';
import { useAdminData } from '../../contexts/AdminDataContext';
import { useLicense } from '../../contexts/LicenseContext';
import { useApplication } from '../../contexts/ApplicationContext';
import useProActions from '../../hooks/useProActions';
import formatDate from '../../utils/formatDate';
import useRegisterToolbar from '../../hooks/useRegisterToolbar';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import AddIcon from '@mui/icons-material/Add';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import WebhookIcon from '@mui/icons-material/Webhook';

import WebhookEditorSecretManager from './WebhookEditorSecretManager';
import ScheduleConfig from '../shared/ScheduleConfig';
import LoadingMessage from '../LoadingMessage';

const HTTP_METHODS = [ 'POST', 'PUT', 'PATCH', 'DELETE' ];

const WEBHOOK_TYPES = [
	{ value: 'general', label: 'General' },
	{ value: 'notification', label: 'Notification' },
	{ value: 'automation', label: 'Automation' },
	{ value: 'data_sync', label: 'Data Sync' },
	{ value: 'alert', label: 'Alert' },
	{ value: 'inbound', label: 'Incoming Webhook' },
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
	const { selectedApplicationId, setDirtyFlag } = useApplication();
	const nonce = proNonce || adminData.nonce;
	const { __ } = wp.i18n || {};

	const { save, remove, saving } = useProActions();

	const isNew = ! webhook.id;

	const handleSaveRef = useRef( null );
	const handleDeleteRef = useRef( null );
	const [ savedSnapshot, setSavedSnapshot ] = useState( null );

	const clearDirty = useCallback(
		() => setDirtyFlag( { has: false, message: '' } ),
		[ setDirtyFlag ]
	);

	const [ loading, setLoading ] = useState( ! isNew );
	const [ loadError, setLoadError ] = useState( '' );

	const [ title, setTitle ] = useState( webhook.title || '' );
	const [ description, setDescription ] = useState( webhook.description || '' );
	const [ endpoint, setEndpoint ] = useState( webhook.endpoint || '' );
	const [ method, setMethod ] = useState( webhook.method || 'POST' );
	const [ enabled, setEnabled ] = useState(
		webhook.enabled !== undefined ? webhook.enabled : true
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
	const [ linkedAutomationId, setLinkedAutomationId ] = useState( webhook.linked_automation_id || '' );
	const [ endpointUrl, setEndpointUrl ] = useState( webhook.endpoint_url || '' );
	const [ automations, setAutomations ] = useState( [] );
	const [ author, setAuthor ] = useState( '' );
	const [ dateCreated, setDateCreated ] = useState( '' );
	const [ dateModified, setDateModified ] = useState( '' );
	const [ hasSecret, setHasSecret ] = useState( false );
	const [ pendingSecret, setPendingSecret ] = useState( undefined );
	const [ copied, setCopied ] = useState( false );

	const isInbound = type === 'inbound';

	const isDirty = useMemo( () => {
		if ( isNew ) {
			return !! title.trim();
		}
		if ( ! savedSnapshot ) {
			return false;
		}
		if ( pendingSecret !== undefined ) {
			return true;
		}
		const s = savedSnapshot;
		return (
			title !== s.title ||
			description !== s.description ||
			endpoint !== s.endpoint ||
			method !== s.method ||
			enabled !== s.enabled ||
			JSON.stringify( headers.map( ( { key, value } ) => ( { key, value } ) ) ) !== s.headersJson ||
			String( timeoutSeconds ) !== s.timeoutSeconds ||
			String( retryCount ) !== s.retryCount ||
			bodyPayload !== s.bodyPayload ||
			type !== s.type ||
			linkedAutomationId !== s.linkedAutomationId
		);
	}, [ isNew, savedSnapshot, title, description, endpoint, method, enabled, headers, timeoutSeconds, retryCount, bodyPayload, type, linkedAutomationId, pendingSecret ] );

	useEffect( () => {
		setDirtyFlag(
			isDirty
				? { has: true, message: __( 'You are editing a webhook. Unsaved changes will be lost.', 'rest-api-firewall' ) }
				: { has: false, message: '' }
		);
	}, [ isDirty ] ); // eslint-disable-line react-hooks/exhaustive-deps

	useEffect( () => {
		const appId = selectedApplicationId || webhook.application_id || '';
		fetch( adminData.ajaxurl, {
			method: 'POST',
			body: new URLSearchParams( { action: 'get_automation_entries', nonce, application_id: appId } ),
		} )
			.then( ( r ) => r.json() )
			.then( ( j ) => { if ( j.success ) setAutomations( j.data.entries || [] ); } )
			.catch( () => {} );
	}, [ adminData.ajaxurl, nonce, selectedApplicationId, webhook.application_id ] ); // eslint-disable-line react-hooks/exhaustive-deps

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
				const loadedTitle             = e.title || '';
				const loadedDescription       = e.description || '';
				const loadedEndpoint          = e.endpoint || '';
				const loadedMethod            = e.method || 'POST';
				const loadedEnabled           = e.enabled !== undefined ? e.enabled : true;
				const loadedHeaders           = normalizeHeaders( e.headers );
				const loadedTimeoutSeconds    = e.timeout_seconds ?? 10;
				const loadedRetryCount        = e.retry_count ?? 0;
				const loadedBodyPayload       = e.body_payload || '';
				const loadedType              = e.type || 'general';
				const loadedLinkedAutomationId = e.linked_automation_id || '';
				setTitle( loadedTitle );
				setDescription( loadedDescription );
				setEndpoint( loadedEndpoint );
				setMethod( loadedMethod );
				setEnabled( loadedEnabled );
				setHeaders( loadedHeaders );
				setTimeoutSeconds( loadedTimeoutSeconds );
				setRetryCount( loadedRetryCount );
				setBodyPayload( loadedBodyPayload );
				setType( loadedType );
				setLinkedAutomationId( loadedLinkedAutomationId );
				setEndpointUrl( e.endpoint_url || '' );
				setHasSecret( e.has_secret || false );
				setAuthor( e.author_name || '' );
				setSavedSnapshot( {
					title:             loadedTitle,
					description:       loadedDescription,
					endpoint:          loadedEndpoint,
					method:            loadedMethod,
					enabled:           loadedEnabled,
					headersJson:       JSON.stringify( loadedHeaders.map( ( { key, value } ) => ( { key, value } ) ) ),
					timeoutSeconds:    String( loadedTimeoutSeconds ),
					retryCount:        String( loadedRetryCount ),
					bodyPayload:       loadedBodyPayload,
					type:              loadedType,
					linkedAutomationId: loadedLinkedAutomationId,
				} );
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
		description,
		endpoint,
		method,
		enabled: enabled ? '1' : '0',
		headers: JSON.stringify(
			headers.map( ( { key, value } ) => ( { key, value } ) )
		),
		timeout_seconds: String( parseInt( timeoutSeconds, 10 ) || 10 ),
		retry_count: String( parseInt( retryCount, 10 ) || 0 ),
		body_payload: bodyPayload,
		application_id: selectedApplicationId || webhook.application_id || '',
		type,
		linked_automation_id: linkedAutomationId || '',
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
					onSuccess: () => { clearDirty(); onBack(); },
				}
			);
		} else {
			const snapshotAtSave = {
				title,
				endpoint,
				method,
				enabled,
				headersJson:       JSON.stringify( headers.map( ( { key, value } ) => ( { key, value } ) ) ),
				timeoutSeconds:    String( parseInt( timeoutSeconds, 10 ) || 10 ),
				retryCount:        String( parseInt( retryCount, 10 ) || 0 ),
				bodyPayload,
				type,
				linkedAutomationId,
			};
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
					onSuccess: () => { setSavedSnapshot( snapshotAtSave ); setPendingSecret( undefined ); },
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
				onSuccess: () => { clearDirty(); onBack(); },
			}
		);
	};

	handleSaveRef.current = handleSave;
	handleDeleteRef.current = handleDelete;

	const updateToolbar = useRegisterToolbar( {
		isNew,
		breadcrumb: __( 'Webhooks', 'rest-api-firewall' ),
		newEntryLabel: __( 'New Webhook', 'rest-api-firewall' ),
		docPage: 'webhooks',
		handleBack: () => { clearDirty(); onBack(); },
		handleSave: () => handleSaveRef.current?.(),
		handleDelete: () => handleDeleteRef.current?.(),
		setEnabled,
	} );

	useEffect( () => {
		updateToolbar( {
			title,
			author,
			dateCreated,
			dateModified,
			saving,
			enabled,
			canSave: isDirty,
			dirtyFlag: isDirty
				? { has: true, message: __( 'You are editing a webhook. Unsaved changes will be lost.', 'rest-api-firewall' ) }
				: null,
		} );
	}, [ title, author, dateCreated, dateModified, saving, enabled, isDirty ] ); // eslint-disable-line react-hooks/exhaustive-deps

	if ( loading ) {
		return (
			<LoadingMessage message={ isNew ? __( 'Creating new webhook...', 'rest-api-firewall' ) : __( 'Loading webhook...', 'rest-api-firewall' ) } />
		);
	}

	return (
		<Stack spacing={ 0 }>

			{ loadError && <Alert severity="error">{ loadError }</Alert> }

			<Stack p={ { xs: 2, sm: 4 } } spacing={ 3 } sx={ { maxWidth: 760 } }>

				<Stack spacing={ 2 }>
					<SectionHeader
						title={ isInbound ? __( 'Incoming Webhook', 'rest-api-firewall' ) : __( 'Webhook', 'rest-api-firewall' ) }
						description={ isInbound
							? __( 'Receive signed HTTP requests from external services and trigger an automation.', 'rest-api-firewall' )
							: __( 'Configure the outgoing webhook endpoint.', 'rest-api-firewall' )
						}
					/>
					<TextField
						label={ __( 'Title', 'rest-api-firewall' ) }
						size="small"
						value={ title }
						onChange={ ( e ) => setTitle( e.target.value ) }
						required
						sx={ { maxWidth: 340 } }
						inputProps={ { maxLength: 100 } }
					/>
					<TextField
						label={ __( 'Description', 'rest-api-firewall' ) }
						size="small"
						value={ description }
						onChange={ ( e ) => setDescription( e.target.value ) }
						multiline
						rows={ 2 }
						sx={ { maxWidth: 600 } }
						inputProps={ { maxLength: 300 } }
					/>
					<FormControl size="small" sx={ { maxWidth: 220 } }>
						<InputLabel>{ __( 'Direction', 'rest-api-firewall' ) }</InputLabel>
						<Select
							value={ type }
							onChange={ ( e ) => setType( e.target.value ) }
							label={ __( 'Direction', 'rest-api-firewall' ) }
						>
							{ WEBHOOK_TYPES.map( ( t ) => (
								<MenuItem key={ t.value } value={ t.value }>{ t.label }</MenuItem>
							) ) }
						</Select>
					</FormControl>
				</Stack>

				<Divider />

				{ isInbound ? (
					<>
						<Stack spacing={ 2 }>
							<SectionHeader
								title={ __( 'Endpoint URL', 'rest-api-firewall' ) }
								description={ __( 'Share this URL with the external service. It is unique to this entry and generated automatically.', 'rest-api-firewall' ) }
							/>
							{ endpointUrl ? (
								<TextField
									size="small"
									value={ endpointUrl }
									InputProps={ {
										readOnly: true,
										sx: { fontFamily: 'monospace', fontSize: '0.85rem' },
										endAdornment: (
											<InputAdornment position="end">
												<IconButton size="small" onClick={ () => { navigator.clipboard.writeText( endpointUrl ); setCopied( true ); setTimeout( () => setCopied( false ), 2000 ); } }>
													<ContentCopyIcon fontSize="small" />
												</IconButton>
											</InputAdornment>
										),
									} }
									helperText={ copied ? __( 'Copied!', 'rest-api-firewall' ) : __( 'Copy and configure this URL as the webhook destination in your external service.', 'rest-api-firewall' ) }
								/>
							) : (
								<Alert severity="info" icon={ <WebhookIcon /> }>
									{ __( 'Save this webhook to generate an endpoint URL.', 'rest-api-firewall' ) }
								</Alert>
							) }
						</Stack>

						<Divider />

						<Stack spacing={ 2 }>
							<SectionHeader
								title={ __( 'Linked Automation', 'rest-api-firewall' ) }
								description={ __( 'The automation to trigger when a valid request is received. The automation must use the "Incoming webhook received" event.', 'rest-api-firewall' ) }
							/>
							<FormControl size="small" sx={ { maxWidth: 400 } }>
								<InputLabel>{ __( 'Automation', 'rest-api-firewall' ) }</InputLabel>
								<Select
									value={ linkedAutomationId }
									onChange={ ( e ) => setLinkedAutomationId( e.target.value ) }
									label={ __( 'Automation', 'rest-api-firewall' ) }
								>
									<MenuItem value=""><em>{ __( 'None', 'rest-api-firewall' ) }</em></MenuItem>
									{ automations.map( ( a ) => (
										<MenuItem key={ a.id } value={ a.id }>{ a.title || a.id }</MenuItem>
									) ) }
								</Select>
							</FormControl>
						</Stack>

						<Divider />

						<Stack spacing={ 2 }>
							<SectionHeader
								title={ __( 'Signing Secret', 'rest-api-firewall' ) }
								description={ __( 'The secret used to verify the HMAC-SHA256 signature on incoming requests. Configure your external service to sign requests with this key.', 'rest-api-firewall' ) }
							/>
							<WebhookEditorSecretManager
								initialHasSecret={ hasSecret }
								onChange={ setPendingSecret }
							/>
						</Stack>
					</>
				) : (
					<>
						<Stack spacing={ 2 }>
							<SectionHeader
								title={ __( 'Endpoint', 'rest-api-firewall' ) }
								description={ __( 'The URL to send webhook requests to.', 'rest-api-firewall' ) }
							/>
							<Stack direction={ { xs: 'column', sm: 'row' } } spacing={ 2 }>
								<TextField
									label={ __( 'Endpoint URL', 'rest-api-firewall' ) }
									size="small"
									value={ endpoint }
									onChange={ ( e ) => setEndpoint( e.target.value ) }
									placeholder="https://api.example.com/webhook"
									sx={ { flex: 1 } }
									helperText={ __( 'The URL to send the webhook request to.', 'rest-api-firewall' ) }
								/>
								<FormControl size="small" sx={ { minWidth: 120 } }>
									<InputLabel>{ __( 'Method', 'rest-api-firewall' ) }</InputLabel>
									<Select
										value={ method }
										onChange={ ( e ) => setMethod( e.target.value ) }
										label={ __( 'Method', 'rest-api-firewall' ) }
									>
										{ HTTP_METHODS.map( ( m ) => (
											<MenuItem key={ m } value={ m }>{ m }</MenuItem>
										) ) }
									</Select>
								</FormControl>
							</Stack>
						</Stack>

						<Divider />

						<Stack spacing={ 2 }>
							<SectionHeader
								title={ __( 'Authentication', 'rest-api-firewall' ) }
								description={ __( 'Configure a secret to sign outgoing webhook requests using HMAC-SHA256.', 'rest-api-firewall' ) }
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
								description={ __( 'Optional custom HTTP headers to include with every request.', 'rest-api-firewall' ) }
							/>
							<HeadersEditor headers={ headers } onChange={ setHeaders } />
						</Stack>

						<Divider />

						<Stack spacing={ 2 }>
							<SectionHeader
								title={ __( 'Body Payload', 'rest-api-firewall' ) }
								description={ __( 'Optional JSON body template sent with the request. Leave empty to use the default event payload.', 'rest-api-firewall' ) }
							/>
							<TextField
								label={ __( 'Body', 'rest-api-firewall' ) }
								size="small"
								multiline
								rows={ 6 }
								value={ bodyPayload }
								onChange={ ( e ) => setBodyPayload( e.target.value ) }
								placeholder={ '{\n  "event": "{{event_type}}",\n  "data": {{payload}}\n}' }
								helperText={ __( 'Use {{placeholders}} for dynamic values.', 'rest-api-firewall' ) }
								inputProps={ { sx: { fontFamily: 'monospace', fontSize: '0.85rem' } } }
							/>
						</Stack>

						<Divider />

						<Stack spacing={ 2 }>
							<SectionHeader
								title={ __( 'Advanced', 'rest-api-firewall' ) }
								description={ __( 'Timeout and retry behaviour for failed requests.', 'rest-api-firewall' ) }
							/>
							<Stack direction={ { xs: 'column', sm: 'row' } } spacing={ 2 }>
								<TextField
									label={ __( 'Timeout (seconds)', 'rest-api-firewall' ) }
									type="number"
									size="small"
									value={ timeoutSeconds }
									onChange={ ( e ) => setTimeoutSeconds( e.target.value ) }
									sx={ { maxWidth: 180 } }
									helperText={ __( 'Request timeout', 'rest-api-firewall' ) }
								/>
								<TextField
									label={ __( 'Retry Count', 'rest-api-firewall' ) }
									type="number"
									size="small"
									value={ retryCount }
									onChange={ ( e ) => setRetryCount( e.target.value ) }
									sx={ { maxWidth: 160 } }
									helperText={ __( 'Retries on failure', 'rest-api-firewall' ) }
								/>
							</Stack>
						</Stack>
					</>
				) }

			</Stack>

			{ ! isNew && (
				<Stack p={ { xs: 2, sm: 4 } } spacing={ 3 } sx={ { maxWidth: 760, borderTop: '1px solid', borderTopColor: 'divider' } }>
					<ScheduleConfig
						itemId={ webhook.id }
						itemType="webhook"
						nonce={ nonce }
						adminData={ adminData }
					/>
				</Stack>
			) }
		</Stack>
	);
}
