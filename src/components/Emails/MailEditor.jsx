import { useState, useEffect, useCallback } from '@wordpress/element';
import { useAdminData } from '../../contexts/AdminDataContext';
import { useLicense } from '../../contexts/LicenseContext';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import FormControlLabel from '@mui/material/FormControlLabel';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Toolbar from '@mui/material/Toolbar';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import SendIcon from '@mui/icons-material/Send';

import useProActions from '../../hooks/useProActions';
import formatDate from '../../utils/formatDate';

const TEMPLATE_VARS = [
	'{{event.type}}',
	'{{event.message}}',
	'{{event.ip}}',
	'{{event.route}}',
	'{{application.title}}',
	'{{site.url}}',
	'{{site.name}}',
];

export default function MailEditor( { mail, onBack } ) {
	const { adminData } = useAdminData();
	const { proNonce } = useLicense();
	const nonce = proNonce || adminData.nonce;
	const { __ } = wp.i18n || {};

	const { save, remove, saving } = useProActions();

	const isNew = ! mail.id;

	const [ title, setTitle ] = useState( mail.title || '' );
	const [ recipient, setRecipient ] = useState( mail.recipient || '' );
	const [ cc, setCc ] = useState( mail.cc || '' );
	const [ cci, setCci ] = useState( mail.cci || '' );
	const [ subject, setSubject ] = useState( mail.subject || '' );
	const [ content, setContent ] = useState( mail.content || '' );
	const [ active, setActive ] = useState( mail.active !== false );

	const [ testStatus, setTestStatus ] = useState( '' );
	const [ testLoading, setTestLoading ] = useState( false );

	// If editing an existing entry, reload from server on mount.
	const [ loaded, setLoaded ] = useState( isNew );

	useEffect( () => {
		if ( isNew ) {
			return;
		}

		( async () => {
			try {
				const res = await fetch( adminData.ajaxurl, {
					method: 'POST',
					body: new URLSearchParams( {
						action: 'get_mail_entry',
						nonce,
						id: mail.id,
					} ),
				} );
				const json = await res.json();
				if ( json.success ) {
					const e = json.data.entry;
					setTitle( e.title || '' );
					setRecipient( e.recipient || '' );
					setCc( e.cc || '' );
					setCci( e.cci || '' );
					setSubject( e.subject || '' );
					setContent( e.content || '' );
					setActive( e.active !== false );
				}
			} finally {
				setLoaded( true );
			}
		} )();
	}, [ isNew, mail.id, adminData, nonce ] );

	const buildPayload = () => ( {
		nonce,
		title,
		recipient,
		cc,
		cci,
		subject,
		content,
		active: active ? '1' : '0',
	} );

	const handleSave = useCallback( () => {
		if ( isNew ) {
			save(
				{ action: 'add_mail_entry', ...buildPayload() },
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
				{ action: 'update_mail_entry', id: mail.id, ...buildPayload() },
				{}
			);
		}
	}, [
		isNew,
		mail.id,
		title,
		recipient,
		cc,
		cci,
		subject,
		content,
		active,
		nonce,
	] );

	const handleDelete = useCallback( () => {
		remove(
			{ action: 'delete_mail_entry', id: mail.id },
			{
				confirmTitle: __( 'Delete Mail Template', 'rest-api-firewall' ),
				confirmMessage: `${ __(
					'Permanently delete',
					'rest-api-firewall'
				) } "${ title }"? ${ __(
					'This action cannot be undone.',
					'rest-api-firewall'
				) }`,
				confirmLabel: __( 'Delete', 'rest-api-firewall' ),
				onSuccess: onBack,
			}
		);
	}, [ remove, mail.id, title, onBack, __ ] );

	const handleTest = useCallback( async () => {
		if ( ! mail.id ) {
			return;
		}
		setTestLoading( true );
		setTestStatus( '' );
		try {
			const res = await fetch( adminData.ajaxurl, {
				method: 'POST',
				body: new URLSearchParams( {
					action: 'test_mail_entry',
					nonce,
					id: mail.id,
				} ),
			} );
			const json = await res.json();
			setTestStatus(
				json.success
					? __( 'Test email sent!', 'rest-api-firewall' )
					: json.data?.message ||
							__(
								'Failed to send test email',
								'rest-api-firewall'
							)
			);
		} catch {
			setTestStatus( __( 'Network error', 'rest-api-firewall' ) );
		} finally {
			setTestLoading( false );
		}
	}, [ adminData, nonce, mail.id, __ ] );

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
						? __( 'New Mail Template', 'rest-api-firewall' )
						: title ||
						  __( 'Edit Mail Template', 'rest-api-firewall' ) }
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

				{ mail.date_modified && (
					<Typography variant="caption" color="text.secondary">
						{ __( 'Modified', 'rest-api-firewall' ) }{ ' ' }
						{ formatDate( mail.date_modified ) }
					</Typography>
				) }

				{ ! isNew && (
					<Tooltip
						title={ __(
							'Send a test email to the recipient',
							'rest-api-firewall'
						) }
					>
						<span>
							<Button
								size="small"
								variant="outlined"
								startIcon={
									testLoading ? (
										<CircularProgress size={ 14 } />
									) : (
										<SendIcon />
									)
								}
								onClick={ handleTest }
								disabled={ testLoading }
							>
								{ __( 'Send Test', 'rest-api-firewall' ) }
							</Button>
						</span>
					</Tooltip>
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

			{ testStatus && (
				<Alert
					severity={
						testStatus.includes( __( 'sent', 'rest-api-firewall' ) )
							? 'success'
							: 'error'
					}
					onClose={ () => setTestStatus( '' ) }
					sx={ { mb: 1 } }
				>
					{ testStatus }
				</Alert>
			) }

			<Stack spacing={ 3 } sx={ { overflowY: 'auto', flex: 1, pb: 3 } }>
				{ /* Label */ }
				<TextField
					label={ __( 'Label', 'rest-api-firewall' ) }
					value={ title }
					onChange={ ( e ) => setTitle( e.target.value ) }
					size="small"
					fullWidth
					helperText={ __(
						'Internal name for this mail template',
						'rest-api-firewall'
					) }
				/>

				<Divider />

				{ /* Recipients */ }
				<Typography
					variant="caption"
					sx={ {
						textTransform: 'uppercase',
						letterSpacing: 0.5,
						color: 'text.secondary',
					} }
				>
					{ __( 'Recipients', 'rest-api-firewall' ) }
				</Typography>

				<TextField
					label={ __( 'Recipient', 'rest-api-firewall' ) }
					value={ recipient }
					onChange={ ( e ) => setRecipient( e.target.value ) }
					size="small"
					fullWidth
					type="email"
					required
					placeholder="user@example.com"
				/>

				<Stack direction="row" spacing={ 2 }>
					<TextField
						label={ __( 'CC', 'rest-api-firewall' ) }
						value={ cc }
						onChange={ ( e ) => setCc( e.target.value ) }
						size="small"
						fullWidth
						placeholder="cc@example.com"
					/>
					<TextField
						label={ __( 'BCC', 'rest-api-firewall' ) }
						value={ cci }
						onChange={ ( e ) => setCci( e.target.value ) }
						size="small"
						fullWidth
						placeholder="bcc@example.com"
					/>
				</Stack>

				<Divider />

				{ /* Message */ }
				<Typography
					variant="caption"
					sx={ {
						textTransform: 'uppercase',
						letterSpacing: 0.5,
						color: 'text.secondary',
					} }
				>
					{ __( 'Message', 'rest-api-firewall' ) }
				</Typography>

				<TextField
					label={ __( 'Subject', 'rest-api-firewall' ) }
					value={ subject }
					onChange={ ( e ) => setSubject( e.target.value ) }
					size="small"
					fullWidth
					placeholder={ __(
						'Firewall alert: {{event.type}}',
						'rest-api-firewall'
					) }
				/>

				<TextField
					label={ __( 'Content (HTML)', 'rest-api-firewall' ) }
					value={ content }
					onChange={ ( e ) => setContent( e.target.value ) }
					size="small"
					fullWidth
					multiline
					rows={ 10 }
					inputProps={ {
						style: { fontFamily: 'monospace', fontSize: '0.85rem' },
					} }
					placeholder={
						'<p>Event: {{event.type}}</p>\n<p>IP: {{event.ip}}</p>'
					}
				/>

				{ /* Template variables hint */ }
				<Box>
					<Typography
						variant="caption"
						color="text.secondary"
						sx={ { display: 'block', mb: 0.75 } }
					>
						{ __(
							'Available template variables:',
							'rest-api-firewall'
						) }
					</Typography>
					<Stack direction="row" flexWrap="wrap" gap={ 0.75 }>
						{ TEMPLATE_VARS.map( ( v ) => (
							<Chip
								key={ v }
								label={ v }
								size="small"
								variant="outlined"
								onClick={ () => setContent( ( c ) => c + v ) }
								sx={ {
									fontFamily: 'monospace',
									fontSize: '0.7rem',
									cursor: 'pointer',
								} }
							/>
						) ) }
					</Stack>
				</Box>
			</Stack>
		</Stack>
	);
}
