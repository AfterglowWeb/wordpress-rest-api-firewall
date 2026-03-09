import { useState, useEffect, useCallback } from '@wordpress/element';
import { useAdminData } from '../../contexts/AdminDataContext';
import { useLicense } from '../../contexts/LicenseContext';
import { useApplication } from '../../contexts/ApplicationContext';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import SendIcon from '@mui/icons-material/Send';

import useProActions from '../../hooks/useProActions';
import formatDate from '../../utils/formatDate';
import EntryToolbar from '../shared/EntryToolbar';

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
	const { selectedApplicationId, setDirtyFlag } = useApplication();
	const { __ } = wp.i18n || {};

	const { save, remove, saving } = useProActions();

	const isNew = ! mail.id;

	useEffect( () => {
		setDirtyFlag( { has: true, message: __( 'You are editing a mail template. Unsaved changes will be lost.', 'rest-api-firewall' ) } );
		return () => setDirtyFlag( { has: false, message: '' } );
	}, [] ); // eslint-disable-line react-hooks/exhaustive-deps

	const clearDirty = useCallback(
		() => setDirtyFlag( { has: false, message: '' } ),
		[ setDirtyFlag ]
	);

	const [ title, setTitle ] = useState( mail.title || '' );
	const [ recipient, setRecipient ] = useState( mail.recipient || '' );
	const [ cc, setCc ] = useState( mail.cc || '' );
	const [ cci, setCci ] = useState( mail.cci || '' );
	const [ subject, setSubject ] = useState( mail.subject || '' );
	const [ content, setContent ] = useState( mail.content || '' );
	const [ enabled, setEnabled ] = useState( mail.enabled !== false );
	const [ author, setAuthor ] = useState( '' );
	const [ dateCreated, setDateCreated ] = useState( '' );
	const [ dateModified, setDateModified ] = useState( '' );

	const [ dirty, setDirty ] = useState( isNew );

	const [ testStatus, setTestStatus ] = useState( '' );
	const [ testLoading, setTestLoading ] = useState( false );

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
					setEnabled( e.enabled !== false );
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
					setAuthor( e.author_name || '' );
				}
			} finally {
				setLoaded( true );
			}
		} )();
	}, [ isNew, mail.id, adminData, nonce ] );

	const buildPayload = () => ( {
		nonce,
		application_id: selectedApplicationId,
		title,
		recipient,
		cc,
		cci,
		subject,
		content,
		enabled: enabled ? '1' : '0',
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
				{ onSuccess: () => { clearDirty(); setDirty( false ); } }
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
		enabled,
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
				onSuccess: () => { clearDirty(); onBack(); },
			}
		);
	}, [ remove, mail.id, title, onBack, clearDirty, __ ] );

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
		<Stack spacing={ 3 } flexGrow={ 1 }>
			<EntryToolbar
				isNew={ isNew }
				title={ title }
				author={ author }
				dateCreated={ dateCreated }
				dateModified={ dateModified }
				handleBack={ () => { clearDirty(); onBack(); } }
				handleSave={ handleSave }
				handleDelete={ handleDelete }
				saving={ saving }
				enabled={ isNew ? null : enabled }
				setEnabled={ isNew ? null : ( checked ) => { setEnabled( checked ); setDirty( true ); } }
			>
				<Tooltip
					title={
						dirty || isNew
							? __( 'Save the template first to send a test', 'rest-api-firewall' )
							: __( 'Send a test email to the recipient', 'rest-api-firewall' )
					}
				>
					<span>
						<Button
							size="small"
							disableElevation
							startIcon={
								testLoading ? (
									<CircularProgress size={ 14 } />
								) : (
									<SendIcon />
								)
							}
							onClick={ handleTest }
							disabled={ testLoading || dirty || isNew }
						>
							{ __( 'Send Test', 'rest-api-firewall' ) }
						</Button>
					</span>
				</Tooltip>
			</EntryToolbar>

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

			<Stack spacing={ 3 } sx={ { flex: 1, pb: 3 } }>
				<TextField
					label={ __( 'Title', 'rest-api-firewall' ) }
					value={ title }
					onChange={ ( e ) => { setTitle( e.target.value ); setDirty( true ); } }
					size="small"
					fullWidth
					required
					helperText={ __(
						'Internal name for this mail template',
						'rest-api-firewall'
					) }
					sx={{
						maxWidth: 370,
					}}
				/>

				<Divider />

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
					label={ __( 'TO', 'rest-api-firewall' ) }
					value={ recipient }
					onChange={ ( e ) => { setRecipient( e.target.value ); setDirty( true ); } }
					size="small"
					fullWidth
					type="email"
					required
					placeholder="user@example.com"
					helperText={ __(
						'Email addresses separated by commas.',
						'rest-api-firewall'
					) }
				/>

				<TextField
					label={ __( 'CC', 'rest-api-firewall' ) }
					value={ cc }
					onChange={ ( e ) => { setCc( e.target.value ); setDirty( true ); } }
					size="small"
					fullWidth
					placeholder="cc@example.com"
					helperText={ __(
					'Email addresses separated by commas.',
					'rest-api-firewall'
				) }
				/>

				<TextField
					label={ __( 'BCC', 'rest-api-firewall' ) }
					value={ cci }
					onChange={ ( e ) => { setCci( e.target.value ); setDirty( true ); } }
					size="small"
					fullWidth
					placeholder="bcc@example.com"
					helperText={ __(
					'Email addresses separated by commas.',
					'rest-api-firewall'
				) }
				/>

				<Divider />

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
					onChange={ ( e ) => { setSubject( e.target.value ); setDirty( true ); } }
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
					onChange={ ( e ) => { setContent( e.target.value ); setDirty( true ); } }
					size="small"
					fullWidth
					multiline
					rows={ 10 }
					placeholder={
						'<p>Event: {{event.type}}</p>\n<p>IP: {{event.ip}}</p>'
					}
				/>

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
