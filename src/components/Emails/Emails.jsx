import { useState } from '@wordpress/element';
import { useAdminData } from '../../contexts/AdminDataContext';

import useSettingsForm from '../../hooks/useSettingsForm';
import useSaveOptions from '../../hooks/useSaveOptions';

import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';

import Mails from './Mails';
import Smtp from './Smtp';

export default function Emails() {
	const { adminData } = useAdminData();
	const { __ } = wp.i18n || {};

	const { form, setField, pickGroup } = useSettingsForm( { adminData } );
	const { save, saving } = useSaveOptions();

	const [ emailTab, setEmailTab ] = useState( 0 );

	const handleSave = () => {
		save( pickGroup( 'email' ), {
			successTitle: __( 'Emails Saved', 'rest-api-firewall' ),
			successMessage: __(
				'Email settings saved successfully.',
				'rest-api-firewall'
			),
			confirmMessage: __(
				'Save email settings?',
				'rest-api-firewall'
			),
		} );
	};

	return (
		<Stack spacing={ 0 } sx={ { flexGrow: 1 } }>
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

				{ emailTab === 1 && (
					<Button
						size="small"
						variant="contained"
						disableElevation
						disabled={ saving }
						onClick={ handleSave }
						sx={ { mr: 2 } }
					>
						{ __( 'Save', 'rest-api-firewall' ) }
					</Button>
				) }
			</Stack>

			{ emailTab === 0 && <Mails /> }
			{ emailTab === 1 && (
				<Stack p={ 4 }>
					<Smtp form={ form } setField={ setField } />
				</Stack>
			) }
		</Stack>
	);
}
