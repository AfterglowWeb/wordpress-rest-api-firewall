import { useState, useEffect, useCallback } from '@wordpress/element';
import { useAdminData } from '../../contexts/AdminDataContext';
import { useLicense } from '../../contexts/LicenseContext';
import { useApplication } from '../../contexts/ApplicationContext';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';

import JsonSchemaBuilder from '../shared/JsonSchemaBuilder';
import useProActions from '../../hooks/useProActions';
import formatDate from '../../utils/formatDate';
import EntryToolbar from '../shared/EntryToolbar';
import LoadingMessage from '../LoadingMessage';

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
				sx={ { 
					flex: 1, 
					'.MuiInputBase-input': { 
						padding: '10.5px 14px!important',
						minHeight: 'unset!important',
						height: '25px!important',
						fontFamily: 'monospace', 
						fontSize: '0.82rem' 
					}
				} }
			/>
			<FormControl size="small" sx={ { width: 110} }>
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
				sx={ { 
					flex: 1, 
					'.MuiInputBase-input': { 
						padding: '10.5px 14px!important',
						minHeight: 'unset!important',
						height: '25px!important',
						fontFamily: 'monospace', 
						fontSize: '0.82rem' 
					}
				} }
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
	const { selectedApplicationId, setDirtyFlag } = useApplication();

	const isNew = ! automation.id;

	useEffect( () => {
		setDirtyFlag( { has: true, message: __( 'You are editing an automation. Unsaved changes will be lost.', 'rest-api-firewall' ) } );
		return () => setDirtyFlag( { has: false, message: '' } );
	}, [] ); // eslint-disable-line react-hooks/exhaustive-deps

	const clearDirty = useCallback(
		() => setDirtyFlag( { has: false, message: '' } ),
		[ setDirtyFlag ]
	);

	const [ title, setTitle ] = useState( automation.title || '' );
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
	const [ enabled, setEnabled ] = useState( automation.enabled !== false );

	const [ eventOptions, setEventOptions ] = useState( [] );
	const [ webhooks, setWebhooks ] = useState( [] );
	const [ mails, setMails ] = useState( [] );
	const [ loaded, setLoaded ] = useState( false );

	useEffect( () => {
		const fetchAll = async () => {
			const [ eventsRes, registryRes, webhooksRes, mailsRes ] = await Promise.all( [
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
						action: 'get_hook_registry',
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
			const [ ej, rj, wj, mj ] = await Promise.all( [
				eventsRes.json(),
				registryRes.json(),
				webhooksRes.json(),
				mailsRes.json(),
			] );

			const options = [];
			if ( ej.success ) {
				for ( const ev of ej.data.events || [] ) {
					options.push( {
						label: ev.label || ev.key,
						value: ev.key,
						group: ev.group || 'wordpress',
					} );
				}
			}
			if ( rj.success ) {
				for ( const entry of rj.data.registry || [] ) {
					options.push( {
						label: entry.label || entry.hook,
						value: entry.hook,
						group: __( 'custom', 'rest-api-firewall' ),
					} );
				}
			}
			setEventOptions( options );

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
					setTitle( e.title || '' );
					setEvent( e.event || '' );
					setConditions( e.conditions || [] );
					setPayloadMap( e.payload_map || {} );
					setWebhookIds( e.webhook_ids || [] );
					setMailIds( e.mail_ids || [] );
					setEnabled( e.enabled !== false );
				}
			}
			setLoaded( true );
		};
		fetchAll();
	}, [ isNew, automation.id, adminData, nonce ] );

	const buildPayload = () => ( {
		nonce,
		title,
		event,
		conditions: JSON.stringify( conditions ),
		payload_map: JSON.stringify( payloadMap ),
		enabled: enabled ? '1' : '0',
		webhook_ids: JSON.stringify( webhookIds ),
		mail_ids: JSON.stringify( mailIds ),
		application_id: selectedApplicationId || automation.application_id || '',
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
		title,
		event,
		conditions,
		payloadMap,
		webhookIds,
		mailIds,
		enabled,
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
				onSuccess: () => { clearDirty(); onBack(); },
			}
		);
	}, [ remove, automation.id, onBack, clearDirty, __ ] );

	const handleAddAnd = () => {
		setConditions( ( prev ) => [
			...prev,
			{ field: '', operator: 'eq', value: '' },
		] );
	};

	const handleAddOr = () => {
		setConditions( ( prev ) => [
			...prev,
			{ type: 'or' },
			{ field: '', operator: 'eq', value: '' },
		] );
	};

	const groupedEventOptions = eventOptions.reduce( ( acc, opt ) => {
		const g = opt.group || 'other';
		if ( ! acc[ g ] ) {
			acc[ g ] = [];
		}
		acc[ g ].push( opt );
		return acc;
	}, {} );

	if ( ! loaded ) {
		return (
			<LoadingMessage message={ isNew ? __( 'Creating new automation...', 'rest-api-firewall' ) : __( 'Loading automation...', 'rest-api-firewall' ) } />
		);
	}

	return (
		<Stack spacing={ 0 } sx={ { height: '100%' } }>
			<EntryToolbar
				isNew={ isNew }
				title={ title }
				dateModified={ automation.date_modified ? formatDate( automation.date_modified ) : '' }
				handleBack={ () => { clearDirty(); onBack(); } }
				handleSave={ handleSave }
				handleDelete={ handleDelete }
				saving={ saving }
				enabled={ isNew ? null : enabled }
				setEnabled={ isNew ? null : setEnabled }
				breadcrumb={ [ __( 'Automations', 'rest-api-firewall' ), __( 'Automation', 'rest-api-firewall' ) ] }
			/>

			<Stack spacing={ 3 } sx={ { overflowY: 'auto', flex: 1, p: 4 } }>
				<TextField
					size="small"
					label={ __( 'Title', 'rest-api-firewall' ) }
					value={ title }
					onChange={ ( e ) => setTitle( e.target.value ) }
					sx={ { maxWidth: 400 } }
					required
				/>
				{ /* 1. Trigger Event */ }
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
							{ __( 'Trigger Hook', 'rest-api-firewall' ) }
						</InputLabel>
						<Select
							value={ event }
							label={ __( 'Trigger Hook', 'rest-api-firewall' ) }
							onChange={ ( e ) => setEvent( e.target.value ) }
							renderValue={ ( value ) => {
								const opt = eventOptions.find(
									( o ) => o.value === value
								);
								return (
									<Stack>
										{ opt && opt.label !== opt.value && (
											<Typography variant="body2">
												{ opt.label }
											</Typography>
										) }
										<Typography
											variant="body2"
											sx={ {
												fontFamily: 'monospace',
												fontSize: '0.85rem',
												color: 'text.secondary',
											} }
										>
											{ value }
										</Typography>
									</Stack>
								);
							} }
						>
							{ Object.entries( groupedEventOptions ).flatMap(
								( [ group, opts ] ) => [
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
									...opts.map( ( opt ) => (
										<MenuItem
											key={ opt.value }
											value={ opt.value }
										>
											<Stack>
												<Typography variant="body2">
													{ opt.label }
												</Typography>
												{ opt.label !== opt.value && (
													<Typography
														variant="caption"
														color="text.secondary"
														sx={ {
															fontFamily:
																'monospace',
														} }
													>
														{ opt.value }
													</Typography>
												) }
											</Stack>
										</MenuItem>
									) ),
								]
							) }
						</Select>
					</FormControl>
				</Paper>

				{ /* 2. Conditions */ }
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
						{ __( '2 · Conditions', 'rest-api-firewall' ) }
					</Typography>

					<Stack spacing={ 1 }>
						{ conditions.map( ( item, i ) =>
							item.type === 'or' ? (
								<Stack
									key={ i }
									direction="row"
									alignItems="center"
									spacing={ 1 }
								>
									<Box
										sx={ {
											flex: 1,
											height: '1px',
											bgcolor: 'divider',
										} }
									/>
									<Chip
										label={ __( 'OR', 'rest-api-firewall' ) }
										size="small"
										variant="outlined"
										onDelete={ () =>
											setConditions( ( prev ) =>
												prev.filter(
													( _, idx ) => idx !== i
												)
											)
										}
										sx={ { height: 22, fontSize: '0.7rem' } }
									/>
									<Box
										sx={ {
											flex: 1,
											height: '1px',
											bgcolor: 'divider',
										} }
									/>
								</Stack>
							) : (
								<ConditionRow
									key={ i }
									condition={ item }
									onChange={ ( updated ) =>
										setConditions( ( prev ) =>
											prev.map( ( c, idx ) =>
												idx === i ? updated : c
											)
										)
									}
									onRemove={ () =>
										setConditions( ( prev ) =>
											prev.filter(
												( _, idx ) => idx !== i
											)
										)
									}
								/>
							)
						) }

						<Stack direction="row" spacing={ 1 } sx={ { mt: 0.5 } }>
							{ conditions.length === 0 ? (
								<Button
									size="small"
									startIcon={ <AddIcon /> }
									onClick={ handleAddAnd }
								>
									{ __( 'Add condition', 'rest-api-firewall' ) }
								</Button>
							) : (
								<>
									<Button
										size="small"
										startIcon={ <AddIcon /> }
										onClick={ handleAddAnd }
									>
										{ __( 'AND', 'rest-api-firewall' ) }
									</Button>
									<Button
										size="small"
										startIcon={ <AddIcon /> }
										onClick={ handleAddOr }
									>
										{ __( 'OR', 'rest-api-firewall' ) }
									</Button>
								</>
							) }
						</Stack>
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
