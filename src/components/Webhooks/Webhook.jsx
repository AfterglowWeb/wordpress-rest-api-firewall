import { useState } from '@wordpress/element';

import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';

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
		<Stack maxWidth="xl" p={4} flexGrow={ 1 } spacing={ 3 }>
			<Stack
				direction={ { xs: 'column', sm: 'row' } }
				spacing={ 2 }
				flexWrap="wrap"
				alignItems="flex-start"
			>
				<FormControl size="small" sx={ { minWidth: 180 } }>
					<InputLabel>
						{ __( 'Service Format', 'rest-api-firewall' ) }
					</InputLabel>
					<Select
						value={ form.type || 'custom' }
						onChange={ ( e ) => setField( 'type', e.target.value ) }
						label={ __( 'Service Format', 'rest-api-firewall' ) }
					>
						{ WEBHOOK_FORMATS.map( ( t ) => (
							<MenuItem key={ t.value } value={ t.value }>
								{ t.label }
							</MenuItem>
						) ) }
					</Select>
				</FormControl>
			</Stack>
				<WebhookAuth
					setHasSecret={ setHasSecret }
					hasSecret={ hasSecret }
					form={ form }
					setField={ setField }
				/>


				<Divider
					sx={ { display: { xs: 'none', xl: 'block' } } }
					orientation="vertical"
					variant="middle"
					flexItem
				/>

				<WordpressEvents form={ form } setField={ setField } />

				<Divider
					sx={ { display: { xs: 'block', xl: 'none' } } }
					orientation="horizontal"
					variant="middle"
					flexItem
				/>


				<WebhookTest hasSecret={ hasSecret } />
			</Stack>
		</Stack>
	);
}
