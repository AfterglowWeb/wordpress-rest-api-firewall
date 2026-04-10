import { useAdminData } from '../../contexts/AdminDataContext';
import { useLicense } from '../../contexts/LicenseContext';
import MultipleSelect from '../shared/MultipleSelect';

import Stack from '@mui/material/Stack';

export default function WordpressEvents( { form, setField } ) {
	const { adminData } = useAdminData();
	const { hasValidLicense } = useLicense();
	const { __ } = wp.i18n || {};

	const webhookEvents = adminData?.webhook_events || {};
	const webhookEventGroups = adminData?.webhook_event_groups || {};
	const selectedEvents = form.application_webhook_auto_trigger_events || [];
	const contextKey = hasValidLicense ? 'pro' : 'free';

	const options = Object.entries( webhookEvents )
		.filter( ( [ , eventConfig ] ) => {
			const ctx = eventConfig.context ?? [ 'free', 'pro' ];
			return ctx.includes( contextKey );
		} )
		.map( ( [ eventKey, eventConfig ] ) => {
			const groupLabel = webhookEventGroups[ eventConfig.group ] || '';
			return {
				value: eventKey,
				label: groupLabel
					? `${ eventConfig.label }`
					: eventConfig.label,
			};
		} );

	return (
		<Stack spacing={ 2 } flex={ 1 } width={ '100%' } maxWidth={ 500 }>
			<MultipleSelect
				label={ __( 'Auto-trigger Events', 'rest-api-firewall' ) }
				helperText={ __(
					'Select WordPress events that will automatically trigger the webhook.',
					'rest-api-firewall'
				) }
				name="application_webhook_auto_trigger_events"
				value={ selectedEvents }
				options={ options }
				onChange={ setField }
			/>
		</Stack>
	);
}
