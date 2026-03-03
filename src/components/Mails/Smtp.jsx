import { useState } from '@wordpress/element';
import { useAdminData } from '../../contexts/AdminDataContext';
import { useLicense } from '../../contexts/LicenseContext';
import useSettingsForm from '../../hooks/useSettingsForm';
import useSaveOptions from '../../hooks/useSaveOptions';

import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import FormControlLabel from '@mui/material/FormControlLabel';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Toolbar from '@mui/material/Toolbar';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import SendIcon from '@mui/icons-material/Send';

function isValidEmail( email ) {
	return email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test( email.trim() );
}

export default function Smtp() {
	const { __ } = wp.i18n || {};
	const { adminData } = useAdminData();
	const { proNonce } = useLicense();
	const nonce = proNonce || adminData.nonce;
	const { form, setField, pickGroup } = useSettingsForm( { adminData } );
	const { save, saving } = useSaveOptions();

	const [ dirty, setDirty ] = useState( false );
	const [ testStatus, setTestStatus ] = useState( '' );
	const [ testLoading, setTestLoading ] = useState( false );

	const isValid = !! (
		form.mail_smtp_host?.trim() &&
		form.mail_smtp_port &&
		isValidEmail( form.mail_smtp_from_email )
	);

	const handleFieldChange = ( e ) => {
		setField( e );
		setDirty( true );
	};

	const handleSave = () => {
		save( pickGroup( 'email' ), {
			successTitle: __( 'Emails Saved', 'rest-api-firewall' ),
			successMessage: __(
				'SMTP settings saved successfully.',
				'rest-api-firewall'
			),
			confirmMessage: __(
				'Save SMTP settings?',
				'rest-api-firewall'
			),
			onSuccess: () => setDirty( false ),
		} );
	};

	const handleTest = async () => {
		setTestLoading( true );
		setTestStatus( '' );
		try {
			const res = await fetch( adminData.ajaxurl, {
				method: 'POST',
				body: new URLSearchParams( {
					action: 'test_smtp',
					nonce,
				} ),
			} );
			const json = await res.json();
			setTestStatus(
				json.success
					? json.data?.message ||
					  __( 'Test email sent!', 'rest-api-firewall' )
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
	};

	const testDisabled = testLoading || dirty || ! isValid;
	const testTooltip = dirty
		? __( 'Save settings first to test SMTP', 'rest-api-firewall' )
		: ! isValid
		? __( 'Fill in Host, Port and From Email first', 'rest-api-firewall' )
		: __( 'Send a test email using the saved SMTP settings', 'rest-api-firewall' );

	return (
		<Stack spacing={ 3 }>
			<Toolbar
				disableGutters
				sx={ {
					gap: 2,
					justifyContent: 'space-between',
					alignItems: 'center',
					flexWrap: 'wrap',
					py: { xs: 2, sm: 1 },
				} }
			>
				<Stack direction="row" gap={ 2 } alignItems="center">
					<Typography variant="h6" sx={ { fontWeight: 600 } }>
						{ __( 'SMTP', 'rest-api-firewall' ) }
					</Typography>

					<Tooltip
						title={
							! isValid
								? __(
									'Fill in Host, Port and From Email before enabling',
									'rest-api-firewall'
								  )
								: ''
						}
					>
						<span>
							<FormControlLabel
								sx={ { mr: 0 } }
								control={
									<Switch
										size="small"
										checked={ !! form.mail_smtp_enabled }
										name="mail_smtp_enabled"
										onChange={ handleFieldChange }
										disabled={ ! isValid }
									/>
								}
								label={ __( 'Enable', 'rest-api-firewall' ) }
							/>
						</span>
					</Tooltip>
				</Stack>

				<Stack sx={ { flex: 1 } } />

				<Stack direction="row" gap={ 2 }>
					<Tooltip title={ testTooltip }>
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
								disabled={ testDisabled }
							>
								{ __( 'Send Test', 'rest-api-firewall' ) }
							</Button>
						</span>
					</Tooltip>

					<Button
						size="small"
						variant="contained"
						disableElevation
						disabled={ saving || ! isValid }
						onClick={ handleSave }
					>
						{ __( 'Save', 'rest-api-firewall' ) }
					</Button>
				</Stack>
			</Toolbar>

			{ testStatus && (
				<Alert
					severity={
						testStatus.includes( __( 'sent', 'rest-api-firewall' ) )
							? 'success'
							: 'error'
					}
					onClose={ () => setTestStatus( '' ) }
				>
					{ testStatus }
				</Alert>
			) }

			<Stack spacing={ 3 } maxWidth={ 375 }>
				<TextField
					label={ __( 'SMTP Host', 'rest-api-firewall' ) }
					value={ form.mail_smtp_host }
					onChange={ handleFieldChange }
					name="mail_smtp_host"
					required
					fullWidth
					placeholder={ __( 'Enter the SMTP host', 'rest-api-firewall' ) }
				/>

				<TextField
					label={ __( 'SMTP Port', 'rest-api-firewall' ) }
					type="number"
					value={ form.mail_smtp_port || '' }
					onChange={ handleFieldChange }
					name="mail_smtp_port"
					fullWidth
					required
					placeholder={ __( 'Enter the SMTP Port', 'rest-api-firewall' ) }
				/>

				<TextField
					select
					label={ __( 'Encryption', 'rest-api-firewall' ) }
					value={ form.mail_smtp_encryption ?? 'tls' }
					onChange={ handleFieldChange }
					name="mail_smtp_encryption"
					fullWidth
				>
					<MenuItem value="">{ __( 'None', 'rest-api-firewall' ) }</MenuItem>
					<MenuItem value="tls">{ __( 'TLS (STARTTLS)', 'rest-api-firewall' ) }</MenuItem>
					<MenuItem value="ssl">{ __( 'SSL / TLS', 'rest-api-firewall' ) }</MenuItem>
				</TextField>

				<FormControlLabel
					control={
						<Switch
							size="small"
							checked={ !! form.mail_smtp_auth }
							name="mail_smtp_auth"
							onChange={ handleFieldChange }
						/>
					}
					label={ __( 'SMTP Authentication', 'rest-api-firewall' ) }
				/>

				{ !! form.mail_smtp_auth && (
					<>
						<TextField
							label={ __( 'Username', 'rest-api-firewall' ) }
							value={ form.mail_smtp_username }
							onChange={ handleFieldChange }
							name="mail_smtp_username"
							fullWidth
							placeholder={ __( 'Enter the SMTP username', 'rest-api-firewall' ) }
						/>

						<TextField
							label={ __( 'Password', 'rest-api-firewall' ) }
							type="password"
							value={ form.mail_smtp_password }
							onChange={ handleFieldChange }
							name="mail_smtp_password"
							fullWidth
							placeholder={ __( 'Enter the SMTP password', 'rest-api-firewall' ) }
						/>
					</>
				) }

				<TextField
					label={ __( 'From Email', 'rest-api-firewall' ) }
					type="email"
					value={ form.mail_smtp_from_email }
					onChange={ handleFieldChange }
					name="mail_smtp_from_email"
					fullWidth
					required
					placeholder={ __( 'Enter the default from email', 'rest-api-firewall' ) }
				/>

				<TextField
					label={ __( 'From Name', 'rest-api-firewall' ) }
					value={ form.mail_smtp_from_name }
					onChange={ handleFieldChange }
					name="mail_smtp_from_name"
					fullWidth
					placeholder={ __( 'Enter the default from name', 'rest-api-firewall' ) }
				/>
			</Stack>
		</Stack>
	);
}
