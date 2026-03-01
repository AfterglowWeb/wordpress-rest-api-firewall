import { useState, useEffect, useCallback } from '@wordpress/element';
import { useAdminData } from '../../contexts/AdminDataContext';
import { useLicense } from '../../contexts/LicenseContext';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Toolbar from '@mui/material/Toolbar';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import AddIcon from '@mui/icons-material/Add';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';

import JsonSchemaBuilder from '../shared/JsonSchemaBuilder';
import useProActions from '../../hooks/useProActions';
import formatDate from '../../utils/formatDate';

const CONDITION_OPERATORS = [
	{ value: 'eq', label: '=' },
	{ value: 'neq', label: '≠' },
	{ value: 'contains', label: 'contains' },
	{ value: 'starts_with', label: 'starts with' },
	{ value: 'gt', label: '>' },
	{ value: 'lt', label: '<' },
];

const BASE_BINDINGS = [
	{ key: 'event.type', label: 'Event type', type: 'string' },
	{ key: 'event.timestamp', label: 'Timestamp', type: 'string' },
	{ key: 'firewall.ip', label: 'Client IP', type: 'string' },
	{ key: 'firewall.route', label: 'Route', type: 'string' },
	{ key: 'firewall.reason', label: 'Block reason', type: 'string' },
	{ key: 'event.post_id', label: 'Post ID', type: 'number' },
	{ key: 'event.post_title', label: 'Post title', type: 'string' },
	{ key: 'event.post_type', label: 'Post type', type: 'string' },
	{ key: 'event.post_status', label: 'Post status', type: 'string' },
	{ key: 'event.term_id', label: 'Term ID', type: 'number' },
	{ key: 'event.taxonomy', label: 'Taxonomy', type: 'string' },
	{ key: 'application.id', label: 'Application ID', type: 'string' },
	{ key: 'application.title', label: 'Application name', type: 'string' },
	{ key: 'site.url', label: 'Site URL', type: 'string' },
	{ key: 'site.name', label: 'Site name', type: 'string' },
];

function ConditionRow( { condition, onChange, onRemove } ) {
	const { __ } = wp.i18n || {};
	return (
		<Stack direction="row" spacing={ 1 } alignItems="center">
			<TextField
				size="small"
				value={ condition.field || '' }
				onChange={ ( e ) =>
					onChange( { ...condition, field: e.target.value } )
				}
				placeholder={ __( 'field', 'rest-api-firewall' ) }
				sx={ { width: 140 } }
				inputProps={ {
					style: { fontFamily: 'monospace', fontSize: '0.82rem' },
				} }
			/>
			<FormControl size="small" sx={ { width: 110 } }>
				<Select
					value={ condition.operator || 'eq' }
					onChange={ ( e ) =>
						onChange( { ...condition, operator: e.target.value } )
					}
				>
					{ CONDITION_OPERATORS.map( ( op ) => (
						<MenuItem key={ op.value } value={ op.value }>
							{ op.label }
						</MenuItem>
					) ) }
				</Select>
			</FormControl>
			<TextField
				size="small"
				value={ condition.value || '' }
				onChange={ ( e ) =>
					onChange( { ...condition, value: e.target.value } )
				}
				placeholder={ __( 'value', 'rest-api-firewall' ) }
				sx={ { flex: 1 } }
			/>
			<IconButton size="small" color="error" onClick={ onRemove }>
				<DeleteOutlineIcon fontSize="small" />
			</IconButton>
		</Stack>
	);
}

function WebhookCheckList( { webhooks, selectedIds, onChange } ) {
	const { __ } = wp.i18n || {};
	if ( ! webhooks.length ) {
		return (
			<Typography variant="body2" color="text.secondary">
				{ __(
					'No webhooks available. Create a webhook first.',
					'rest-api-firewall'
				) }
			</Typography>
		);
	}
	return (
		<Stack spacing={ 0.5 }>
			{ webhooks.map( ( w ) => {
				const checked = selectedIds.includes( w.id );
				return (
					<FormControlLabel
						key={ w.id }
						control={
							<Switch
								size="small"
								checked={ checked }
								onChange={ () =>
									onChange(
										checked
											? selectedIds.filter(
													( id ) => id !== w.id
											  )
											: [ ...selectedIds, w.id ]
									)
								}
							/>
						}
						label={
							<Stack
								direction="row"
								spacing={ 1 }
								alignItems="center"
							>
								<Typography variant="body2">
									{ w.title || w.id }
								</Typography>
								<Typography
									variant="caption"
									color="text.secondary"
									sx={ { fontFamily: 'monospace' } }
								>
									{ w.endpoint }
								</Typography>
							</Stack>
						}
					/>
				);
			} ) }
		</Stack>
	);
}

function MailCheckList( { mails, selectedIds, onChange } ) {
	const { __ } = wp.i18n || {};
	if ( ! mails.length ) {
		return (
			<Typography variant="body2" color="text.secondary">
				{ __(
					'No mail templates available. Create one first.',
					'rest-api-firewall'
				) }
			</Typography>
		);
	}
	return (
		<Stack spacing={ 0.5 }>
			{ mails.map( ( m ) => {
				const checked = selectedIds.includes( m.id );
				return (
					<FormControlLabel
						key={ m.id }
						control={
							<Switch
								size="small"
								checked={ checked }
								onChange={ () =>
									onChange(
										checked
											? selectedIds.filter(
													( id ) => id !== m.id
											  )
											: [ ...selectedIds, m.id ]
									)
								}
							/>
						}
						label={
							<Stack
								direction="row"
								spacing={ 1 }
								alignItems="center"
							>
								<Typography variant="body2">
									{ m.title || m.id }
								</Typography>
								<Typography
									variant="caption"
									color="text.secondary"
								>
									→ { m.recipient }
								</Typography>
							</Stack>
						}
					/>
				);
			} ) }
		</Stack>
	);
}

export default function AutomationEditor( { automation, onBack } ) {
	const { adminData } = useAdminData();
	const { proNonce } = useLicense();
	const nonce = proNonce || adminData.nonce;
	const { __ } = wp.i18n || {};

	const { save, remove, saving } = useProActions();

	const isNew = ! automation.id;

	const [ event, setEvent ] = useState( automation.event || '' );
	const [ conditions, setConditions ] = useState(
		automation.conditions || []
	);
	const [ payloadMap, setPayloadMap ] = useState(
		automation.payload_map || {}
	);
	const [ webhookIds, setWebhookIds ] = useState(
		automation.webhook_ids || []
	);
	const [ mailIds, setMailIds ] = useState( automation.mail_ids || [] );
	const [ active, setActive ] = useState( automation.active !== false );

	const [ events, setEvents ] = useState( [] );
	const [ webhooks, setWebhooks ] = useState( [] );
	const [ mails, setMails ] = useState( [] );
	const [ loaded, setLoaded ] = useState( false );

	useEffect( () => {
		const fetchAll = async () => {
			const [ eventsRes, webhooksRes, mailsRes ] = await Promise.all( [
				fetch( adminData.ajaxurl, {
					method: 'POST',
					body: new URLSearchParams( {
						action: 'get_automation_events',
						nonce,
					} ),
				} ),
				fetch( adminData.ajaxurl, {
					method: 'POST',
					body: new URLSearchParams( {
						action: 'get_webhook_entries',
						nonce,
					} ),
				} ),
				fetch( adminData.ajaxurl, {
					method: 'POST',
					body: new URLSearchParams( {
						action: 'get_mail_entries',
						nonce,
					} ),
				} ),
			] );
			const [ ej, wj, mj ] = await Promise.all( [
				eventsRes.json(),
				webhooksRes.json(),
				mailsRes.json(),
			] );
			if ( ej.success ) {
				setEvents( ej.data.events || [] );
			}
			if ( wj.success ) {
				setWebhooks( wj.data.entries || [] );
			}
			if ( mj.success ) {
				setMails( mj.data.entries || [] );
			}

			if ( ! isNew ) {
				const entryRes = await fetch( adminData.ajaxurl, {
					method: 'POST',
					body: new URLSearchParams( {
						action: 'get_automation_entry',
						nonce,
						id: automation.id,
					} ),
				} );
				const entryJson = await entryRes.json();
				if ( entryJson.success ) {
					const e = entryJson.data.entry;
					setEvent( e.event || '' );
					setConditions( e.conditions || [] );
					setPayloadMap( e.payload_map || {} );
					setWebhookIds( e.webhook_ids || [] );
					setMailIds( e.mail_ids || [] );
					setActive( e.active !== false );
				}
			}
			setLoaded( true );
		};
		fetchAll();
	}, [ isNew, automation.id, adminData, nonce ] );

	const eventsByGroup = events.reduce( ( acc, ev ) => {
		const g = ev.group || 'other';
		if ( ! acc[ g ] ) {
			acc[ g ] = [];
		}
		acc[ g ].push( ev );
		return acc;
	}, {} );

	const buildPayload = () => ( {
		nonce,
		event,
		conditions: JSON.stringify( conditions ),
		payload_map: JSON.stringify( payloadMap ),
		active: active ? '1' : '0',
		webhook_ids: JSON.stringify( webhookIds ),
		mail_ids: JSON.stringify( mailIds ),
	} );

	const handleSave = useCallback( () => {
		if ( isNew ) {
			save(
				{ action: 'add_automation_entry', ...buildPayload() },
				{
					onSuccess: ( data ) => {
						if ( data?.entry ) {
							onBack();
						}
					},
				}
			);
		} else {
			save(
				{
					action: 'update_automation_entry',
					id: automation.id,
					...buildPayload(),
				},
				{}
			);
		}
	}, [
		isNew,
		automation.id,
		event,
		conditions,
		payloadMap,
		webhookIds,
		mailIds,
		active,
		nonce,
	] );

	const handleDelete = useCallback( () => {
		remove(
			{ action: 'delete_automation_entry', id: automation.id },
			{
				confirmTitle: __( 'Delete Automation', 'rest-api-firewall' ),
				confirmMessage: `${ __(
					'Permanently delete this automation?',
					'rest-api-firewall'
				) } ${ __(
					'This action cannot be undone.',
					'rest-api-firewall'
				) }`,
				confirmLabel: __( 'Delete', 'rest-api-firewall' ),
				onSuccess: onBack,
			}
		);
	}, [ remove, automation.id, onBack, __ ] );

	const handleAddCondition = () => {
		setConditions( ( prev ) => [
			...prev,
			{ field: '', operator: 'eq', value: '' },
		] );
	};

	if ( ! loaded ) {
		return (
			<Stack
				alignItems="center"
				justifyContent="center"
				sx={ { height: 200 } }
			>
				<CircularProgress size={ 32 } />
			</Stack>
		);
	}

	return (
		<Stack spacing={ 0 } sx={ { height: '100%' } }>
			{ /* Toolbar */ }
			<Toolbar
				variant="dense"
				sx={ { gap: 1, px: 0, minHeight: 56, flexWrap: 'wrap' } }
				disableGutters
			>
				<IconButton size="small" onClick={ onBack }>
					<ArrowBackIcon />
				</IconButton>

				<Typography variant="h6" fontWeight={ 600 } sx={ { flex: 1 } }>
					{ isNew
						? __( 'New Automation', 'rest-api-firewall' )
						: event ||
						  __( 'Edit Automation', 'rest-api-firewall' ) }
				</Typography>

				{ ! isNew && (
					<FormControlLabel
						control={
							<Switch
								size="small"
								checked={ active }
								onChange={ ( e ) =>
									setActive( e.target.checked )
								}
							/>
						}
						label={
							<Typography variant="body2">
								{ __( 'Active', 'rest-api-firewall' ) }
							</Typography>
						}
					/>
				) }

				{ automation.date_modified && (
					<Typography variant="caption" color="text.secondary">
						{ __( 'Modified', 'rest-api-firewall' ) }{ ' ' }
						{ formatDate( automation.date_modified ) }
					</Typography>
				) }

				{ ! isNew && (
					<IconButton
						size="small"
						color="error"
						onClick={ handleDelete }
					>
						<DeleteOutlineIcon />
					</IconButton>
				) }

				<Button
					size="small"
					variant="contained"
					onClick={ handleSave }
					disabled={ saving }
				>
					{ isNew
						? __( 'Create', 'rest-api-firewall' )
						: __( 'Save', 'rest-api-firewall' ) }
				</Button>
			</Toolbar>

			<Stack spacing={ 3 } sx={ { overflowY: 'auto', flex: 1, pb: 3 } }>
				{ /* 1. Trigger event */ }
				<Paper variant="outlined" sx={ { p: 2 } }>
					<Typography
						variant="caption"
						sx={ {
							textTransform: 'uppercase',
							letterSpacing: 0.5,
							color: 'text.secondary',
							display: 'block',
							mb: 1.5,
						} }
					>
						{ __( '1 · Trigger Event', 'rest-api-firewall' ) }
					</Typography>

					<FormControl size="small" fullWidth>
						<InputLabel>
							{ __( 'Event', 'rest-api-firewall' ) }
						</InputLabel>
						<Select
							value={ event }
							label={ __( 'Event', 'rest-api-firewall' ) }
							onChange={ ( e ) => setEvent( e.target.value ) }
						>
							{ Object.entries( eventsByGroup ).map(
								( [ group, evList ] ) => [
									<MenuItem
										key={ `__g_${ group }` }
										disabled
										sx={ {
											fontWeight: 700,
											fontSize: '0.72rem',
											textTransform: 'uppercase',
											letterSpacing: 0.5,
										} }
									>
										{ group }
									</MenuItem>,
									...evList.map( ( ev ) => (
										<MenuItem
											key={ ev.key }
											value={ ev.key }
										>
											{ ev.label || ev.key }
										</MenuItem>
									) ),
								]
							) }
						</Select>
					</FormControl>
				</Paper>

				{ /* 2. Conditions */ }
				<Paper variant="outlined" sx={ { p: 2 } }>
					<Stack
						direction="row"
						alignItems="center"
						justifyContent="space-between"
						sx={ { mb: 1.5 } }
					>
						<Typography
							variant="caption"
							sx={ {
								textTransform: 'uppercase',
								letterSpacing: 0.5,
								color: 'text.secondary',
							} }
						>
							{ __( '2 · Conditions', 'rest-api-firewall' ) }
						</Typography>
						<Chip
							label={ __( 'AND logic', 'rest-api-firewall' ) }
							size="small"
							variant="outlined"
							sx={ { height: 20, fontSize: '0.65rem' } }
						/>
					</Stack>

					<Stack spacing={ 1 }>
						{ conditions.map( ( cond, i ) => (
							<ConditionRow
								key={ i }
								condition={ cond }
								onChange={ ( updated ) =>
									setConditions( ( prev ) =>
										prev.map( ( c, idx ) =>
											idx === i ? updated : c
										)
									)
								}
								onRemove={ () =>
									setConditions( ( prev ) =>
										prev.filter( ( _, idx ) => idx !== i )
									)
								}
							/>
						) ) }
						<Button
							size="small"
							startIcon={ <AddIcon /> }
							onClick={ handleAddCondition }
							sx={ { alignSelf: 'flex-start' } }
						>
							{ __( 'Add Condition', 'rest-api-firewall' ) }
						</Button>
					</Stack>
				</Paper>

				{ /* 3. Payload mapping */ }
				<Paper variant="outlined" sx={ { p: 2 } }>
					<Typography
						variant="caption"
						sx={ {
							textTransform: 'uppercase',
							letterSpacing: 0.5,
							color: 'text.secondary',
							display: 'block',
							mb: 1.5,
						} }
					>
						{ __( '3 · Payload Mapping', 'rest-api-firewall' ) }
					</Typography>
					<JsonSchemaBuilder
						value={ payloadMap }
						onChange={ setPayloadMap }
						availableBindings={ BASE_BINDINGS }
					/>
				</Paper>

				{ /* 4. Actions — Webhooks */ }
				<Paper variant="outlined" sx={ { p: 2 } }>
					<Stack
						direction="row"
						alignItems="center"
						spacing={ 1 }
						sx={ { mb: 1.5 } }
					>
						<Typography
							variant="caption"
							sx={ {
								textTransform: 'uppercase',
								letterSpacing: 0.5,
								color: 'text.secondary',
							} }
						>
							{ __(
								'4 · Send to Webhooks',
								'rest-api-firewall'
							) }
						</Typography>
						{ webhookIds.length > 0 && (
							<Chip
								label={ webhookIds.length }
								size="small"
								color="primary"
								sx={ { height: 20 } }
							/>
						) }
					</Stack>
					<WebhookCheckList
						webhooks={ webhooks }
						selectedIds={ webhookIds }
						onChange={ setWebhookIds }
					/>
				</Paper>

				{ /* 5. Actions — Emails */ }
				<Paper variant="outlined" sx={ { p: 2 } }>
					<Stack
						direction="row"
						alignItems="center"
						spacing={ 1 }
						sx={ { mb: 1.5 } }
					>
						<Typography
							variant="caption"
							sx={ {
								textTransform: 'uppercase',
								letterSpacing: 0.5,
								color: 'text.secondary',
							} }
						>
							{ __(
								'5 · Send Email Notifications',
								'rest-api-firewall'
							) }
						</Typography>
						{ mailIds.length > 0 && (
							<Chip
								label={ mailIds.length }
								size="small"
								color="secondary"
								sx={ { height: 20 } }
							/>
						) }
					</Stack>
					<MailCheckList
						mails={ mails }
						selectedIds={ mailIds }
						onChange={ setMailIds }
					/>
				</Paper>
			</Stack>
		</Stack>
	);
}
