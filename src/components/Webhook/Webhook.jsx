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

const WEBHOOK_TYPES = [
	{ value: 'general', label: 'General' },
	{ value: 'notification', label: 'Notification' },
	{ value: 'automation', label: 'Automation' },
	{ value: 'data_sync', label: 'Data Sync' },
	{ value: 'alert', label: 'Alert' },
];

export default function Webhook( { form, setField } ) {
	const { __ } = wp.i18n || {};
	const [ hasSecret, setHasSecret ] = useState( null );

	return (
		<Stack maxWidth="xl" spacing={ 3 }>
			{ /* ── New properties: type + body payload ── */ }
			<Stack
				direction={ { xs: 'column', sm: 'row' } }
				spacing={ 2 }
				flexWrap="wrap"
				alignItems="flex-start"
			>
				<FormControl size="small" sx={ { minWidth: 180 } }>
					<InputLabel>
						{ __( 'Type', 'rest-api-firewall' ) }
					</InputLabel>
					<Select
						value={ form.type || 'general' }
						onChange={ ( e ) => setField( 'type', e.target.value ) }
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

			<TextField
				label={ __( 'Body Payload', 'rest-api-firewall' ) }
				size="small"
				multiline
				rows={ 5 }
				value={ form.body_payload || '' }
				onChange={ ( e ) => setField( 'body_payload', e.target.value ) }
				placeholder={ '{\n  "event": "{{event_type}}",\n  "data": {{payload}}\n}' }
				helperText={ __(
					'Optional JSON body template. Use {{placeholders}} for dynamic values.',
					'rest-api-firewall'
				) }
				inputProps={ {
					sx: { fontFamily: 'monospace', fontSize: '0.85rem' },
				} }
			/>

			<Divider />

			{ /* ── Existing auth / events / test sections ── */ }
			<Stack
				direction={ { xs: 'column', xl: 'row' } }
				flexWrap={ 'wrap' }
				gap={ 4 }
			>
				<WebhookAuth
					setHasSecret={ setHasSecret }
					hasSecret={ hasSecret }
					form={ form }
					setField={ setField }
				/>

				<Divider
					sx={ { display: { xs: 'block', xl: 'none' } } }
					orientation="horizontal"
					variant="middle"
					flexItem
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
				<Divider
					sx={ { display: { xs: 'none', xl: 'block' } } }
					orientation="vertical"
					variant="middle"
					flexItem
				/>

				<WebhookTest hasSecret={ hasSecret } />
			</Stack>
		</Stack>
	);
}
