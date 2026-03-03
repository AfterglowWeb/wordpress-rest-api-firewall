import { useState } from '@wordpress/element';

import Stack from '@mui/material/Stack';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';

import Mails from './Mails';
import Smtp from './Smtp';

export default function MailsPanel() {
	const { __ } = wp.i18n || {};
	const [ emailTab, setEmailTab ] = useState( 0 );

	return (
		<Stack spacing={ 0 } p={4} flexGrow={ 1 }>
			<Stack
				direction="row"
				alignItems="center"
				sx={ { borderBottom: 1, borderColor: 'divider' } }
			>
				<Tabs
					value={ emailTab }
					onChange={ ( _, v ) => setEmailTab( v ) }
					sx={ { flex: 1 } }
				>
					<Tab
						label={ __(
							'Mail Templates',
							'rest-api-firewall'
						) }
					/>
					<Tab
						label={ __(
							'SMTP Settings',
							'rest-api-firewall'
						) }
					/>
				</Tabs>

			</Stack>

			{ emailTab === 0 && <Mails /> }
			{ emailTab === 1 && <Smtp />}
		</Stack>
	);
}
