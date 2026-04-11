import { useState } from '@wordpress/element';

import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';

import WordpressEvents from './WordpressEvents';
import WebhookAuth from './WebhookAuth';
import WebhookTest from './WebhookTest';

const WEBHOOK_FORMATS = [
	{ value: 'custom', label: 'Custom' },
	{ value: 'slack', label: 'Slack' },
	{ value: 'discord', label: 'Discord' },
	{ value: 'n8n', label: 'n8n' },
	{ value: 'zapier', label: 'Zapier' },
	{ value: 'make', label: 'Make (Integromat)' },
	{ value: 'teams', label: 'Microsoft Teams' },
];

export default function Webhook( { form, setField } ) {
	const { __ } = wp.i18n || {};
	const [ hasSecret, setHasSecret ] = useState( null );

	return (
		<Stack maxWidth="xl" flexDirection={ { xs: 'column', lg: 'row' } } gap={ 4 } p={ 4 } flexGrow={ 1 }>
				<Stack spacing={ 3 }>
					<WordpressEvents form={ form } setField={ setField } />
					<FormControl size="small" sx={ { minWidth: 180, maxWidth: 500 } }>
						<InputLabel>
							{ __( 'Service Format', 'rest-api-firewall' ) }
						</InputLabel>
						<Select
							value={ form.application_webhook_type || 'custom' }
							onChange={ ( e ) => setField( 'application_webhook_type', e.target.value ) }
							label={ __( 'Service Format', 'rest-api-firewall' ) }
						>
							{ WEBHOOK_FORMATS.map( ( t ) => (
								<MenuItem key={ t.value } value={ t.value }>
									{ t.label }
								</MenuItem>
							) ) }
						</Select>
		
						<FormHelperText>
							{ __(
								'Choose a predefined format for popular services, or select Custom to use your own structure.',
								'rest-api-firewall'
							) }
						</FormHelperText>
								
					</FormControl>
					<WebhookAuth
						setHasSecret={ setHasSecret }
						hasSecret={ hasSecret }
						form={ form }
						setField={ setField }
					/>
				</Stack>
				<WebhookTest hasSecret={ hasSecret } />
		</Stack>
	);
}
