import { useState, useEffect, useCallback } from '@wordpress/element';
import { useAdminData } from '../../contexts/AdminDataContext';
import { useLicense } from '../../contexts/LicenseContext';
import { useApplication } from '../../contexts/ApplicationContext';
import useProActions from '../../hooks/useProActions';
import formatDate from '../../utils/formatDate';
import EntryToolbar from '../shared/EntryToolbar';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';

import WebhookEditorSecretManager from './WebhookEditorSecretManager';
import LoadingMessage from '../LoadingMessage';

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
	const { selectedApplicationId, setDirtyFlag } = useApplication();
	const nonce = proNonce || adminData.nonce;
	const { __ } = wp.i18n || {};

	const { save, remove, saving } = useProActions();

	const isNew = ! webhook.id;

	useEffect( () => {
		setDirtyFlag( { has: true, message: __( 'You are editing a webhook. Unsaved changes will be lost.', 'rest-api-firewall' ) } );
		return () => setDirtyFlag( { has: false, message: '' } );
	}, [] ); // eslint-disable-line react-hooks/exhaustive-deps

	const clearDirty = useCallback(
		() => setDirtyFlag( { has: false, message: '' } ),
		[ setDirtyFlag ]
	);

	const [ loading, setLoading ] = useState( ! isNew );
	const [ loadError, setLoadError ] = useState( '' );

	const [ title, setTitle ] = useState( webhook.title || '' );
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
				setEnabled( e.enabled !== undefined ? e.enabled : true );
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
		enabled: enabled ? '1' : '0',
		headers: JSON.stringify(
			headers.map( ( { key, value } ) => ( { key, value } ) )
		),
		timeout_seconds: String( parseInt( timeoutSeconds, 10 ) || 10 ),
		retry_count: String( parseInt( retryCount, 10 ) || 0 ),
		body_payload: bodyPayload,
		application_id: selectedApplicationId || webhook.application_id || '',
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
					onSuccess: () => { clearDirty(); onBack(); },
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
					onSuccess: () => { clearDirty(); setPendingSecret( undefined ); },
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

	if ( loading ) {
		return (
			<LoadingMessage message={ isNew ? __( 'Creating new webhook...', 'rest-api-firewall' ) : __( 'Loading webhook...', 'rest-api-firewall' ) } />
		);
	}

	return (
		<Stack spacing={ 0 }>
			<EntryToolbar
				isNew={ isNew }
				title={ title }
				dateCreated={ dateCreated }
				dateModified={ dateModified }
				handleBack={ () => { clearDirty(); onBack(); } }
				handleSave={ handleSave }
				handleDelete={ handleDelete }
				saving={ saving }
				enabled={ enabled }
				setEnabled={ setEnabled }
				breadcrumb={ [__( 'Webhook', 'rest-api-firewall' ) ] }
				docPage="webhooks"
			/>

			{ loadError && <Alert severity="error">{ loadError }</Alert> }

			<Stack
				p={ { xs: 2, sm: 4 } }
				spacing={ 3 }
				sx={ { maxWidth: 760 } }
			>

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
								flex: 1
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
