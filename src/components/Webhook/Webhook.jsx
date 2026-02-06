import { useState } from '@wordpress/element';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import WordpressEvents from './WordpressEvents';
import WebhookAuth from './WebhookAuth';
import WebhookTest from './WebhookTest';

export default function Webhook( { form, setField } ) {
	const [ hasSecret, setHasSecret ] = useState( null );

	return (
		<Stack maxWidth="xl" spacing={ 3 }>
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

				<WordpressEvents form={ form } set={ setField } />

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
