import { useState } from '@wordpress/element';
import { useNavigation } from '../../contexts/NavigationContext';
import useSettingsForm from '../../hooks/useSettingsForm';
import useSaveOptions from '../../hooks/useSaveOptions';
import { useAdminData } from '../../contexts/AdminDataContext';

import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';

import RuleOutlinedIcon from '@mui/icons-material/RuleOutlined';
import TuneOutlinedIcon from '@mui/icons-material/TuneOutlined';

import GlobalProperties from './GlobalProperties';
import Models from './Models';

export default function ModelsPanel() {
	const { adminData } = useAdminData();
	const { subKey, navigate } = useNavigation();
	const { __ } = wp.i18n || {};

	const { form, setField, pickGroup } = useSettingsForm( { adminData } );
	const { save: saveOutput, saving: savingOutput } = useSaveOptions();

	const [ isEditing, setIsEditing ] = useState( false );
	const currentTab = subKey === 'models' ? 1 : 0;

	return (
		<Stack p={ 4 } flexGrow={ 1 } spacing={ 3 }>
			{ ! isEditing && (
				<Tabs
					value={ currentTab }
					onChange={ ( e, v ) =>
						navigate( 'models-properties', v === 1 ? 'models' : null )
					}
					sx={ { borderBottom: 1, borderColor: 'divider' } }
				>
					<Tab
						icon={ <TuneOutlinedIcon /> }
						iconPosition="start"
						label={ __( 'Global Settings', 'rest-api-firewall' ) }
					/>
					<Tab
						icon={ <RuleOutlinedIcon /> }
						iconPosition="start"
						label={ __( 'Property Models', 'rest-api-firewall' ) }
					/>
				</Tabs>
			) }

			{ ! isEditing && currentTab === 0 && (
				<Stack spacing={ 3 } sx={ { maxWidth: 600 } }>
					<GlobalProperties form={ form } setField={ setField } />
					<Stack direction="row">
						<Button
							size="small"
							variant="contained"
							disableElevation
							disabled={ savingOutput }
							onClick={ () => {
								const { rest_models_enabled: _ignored, ...applyOpts } =
									pickGroup( 'models_properties' );
								saveOutput( applyOpts, {
									confirmTitle: __( 'Apply to all models', 'rest-api-firewall' ),
									confirmMessage: __(
										'This will apply the selected output filters as defaults across all your models. Each model can then override these settings individually.',
										'rest-api-firewall'
									),
									confirmLabel: __( 'Apply', 'rest-api-firewall' ),
									successTitle: __( 'Settings Applied', 'rest-api-firewall' ),
									successMessage: __(
										'Global output settings have been applied.',
										'rest-api-firewall'
									),
								} );
							} }
						>
							{ __( 'Save Global Settings', 'rest-api-firewall' ) }
						</Button>
					</Stack>
				</Stack>
			) }

			{ currentTab === 1 && <Models globalForm={ form } onEditingChange={ setIsEditing } /> }
		</Stack>
	);
}
