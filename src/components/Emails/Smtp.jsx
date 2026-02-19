import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import FormHelperText from '@mui/material/FormHelperText';
import TextField from '@mui/material/TextField';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';


export default function Smtp({form, setField}) {
	const { __ } = wp.i18n || {};

	return (
		<Card
		variant="outlined"
		sx={ {
			maxWidth:375,
			px: { xs: 2, xl: 4 },
			py: { xs: 2, xl: 4 },
		} }
		>
			<CardContent>

				<Stack spacing={ 3 }>

					<Stack direction="row" justifyContent="space-between" alignItems="center" gap={ 1 } mb={3}>

						<Typography variant="subtitle1" sx={ { fontWeight: 600 } }>
							{ __( 'SMTP', 'rest-api-firewall' ) }
						</Typography>

						<FormControlLabel
							control={
								<Switch
									size="small"
									checked={
										!! form.mail_smtp_enabled
									}
									name="mail_smtp_enabled"
									onChange={ setField }
								/>
							}
							label={ __(
								'Enable SMTP',
								'rest-api-firewall'
							) }
						/>

					</Stack>


					<TextField
						label={ __(
							'SMTP Host',
							'rest-api-firewall'
						) }
						value={ form.mail_smtp_host }
						onChange={ setField	}
						name="mail_smtp_host"
						fullWidth
						placeholder={ __(
							'Enter the SMTP host',
							'rest-api-firewall'
						) }
					/>

					<TextField
						label={ __(
							'SMTP Port',
							'rest-api-firewall'
						) }
						type="number"
						value={ form.mail_smtp_port }
						onChange={ setField	}
						name="mail_smtp_port"
						fullWidth
						placeholder={ __(
							'Enter the SMTP Port',
							'rest-api-firewall'
						) }
					/>

					<TextField
						label={ __(
							'Username',
							'rest-api-firewall'
						) }
						value={ form.mail_smtp_username }
						onChange={ setField	}
						name="mail_smtp_username"
						fullWidth
						placeholder={ __(
							'Enter the SMTP username',
							'rest-api-firewall'
						) }
					/>

					<TextField
						label={ __(
							'Password',
							'rest-api-firewall'
						) }
						type="password"
						value={ form.mail_smtp_password }
						onChange={ setField	}
						name="mail_smtp_password"
						fullWidth
						placeholder={ __(
							'Enter the SMTP password',
							'rest-api-firewall'
						) }
					/>

					<TextField
						label={ __(
							'From Email',
							'rest-api-firewall'
						) }
						type="email"
						value={ form.mail_smtp_from_email }
						onChange={ setField	}
						name="mail_smtp_default_from_email"
						fullWidth
						placeholder={ __(
							'Enter the default from email',
							'rest-api-firewall'
						) }
					/>

					<TextField
						label={ __(
							'From Name',
							'rest-api-firewall'
						) }
						value={ form.mail_smtp_from_name }
						onChange={ setField	}
						name="mail_smtp_default_from_name"
						fullWidth
						placeholder={ __(
							'Enter the default from name',
							'rest-api-firewall'
						) }
					/>

				</Stack>
			</CardContent>
		</Card>
	);


}
