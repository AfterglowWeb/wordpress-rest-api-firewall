import { useAdminData } from '../../contexts/AdminDataContext';
import { useLicense } from '../../contexts/LicenseContext';

import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormControl from '@mui/material/FormControl';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';

import MultipleSelect from '../MultipleSelect';

export default function GlobalRoutesPolicy( { form, setField } ) {
	const { adminData } = useAdminData();
	const { hasValidLicense } = useLicense();
	const { __ } = wp.i18n || {};

	return (
		<Stack spacing={ 3 } maxWidth={ 500 }>
			<Typography
				variant="caption"
				sx={ {
					display: 'block',
					mt: 1,
					textTransform: 'uppercase',
					letterSpacing: 0.5,
					fontSize: '0.75rem',
					color: 'text.secondary',
				} }
			>
				{ __( 'Global Settings', 'rest-api-firewall' ) }
			</Typography>

			<FormControl>
				<FormControlLabel
					control={
						<Switch
							checked={ !! form.enforce_auth }
							name="enforce_auth"
							size="small"
							onChange={ setField }
						/>
					}
					label={ __(
						'Enforce Authentication on All Routes',
						'rest-api-firewall'
					) }
				/>
			</FormControl>

			<FormControl>
				<FormControlLabel
					control={
						<Switch
							checked={ !! form.enforce_rate_limit }
							onChange={ setField }
							name="enforce_rate_limit"
							size="small"
						/>
					}
					label={ __(
						'Enforce Rate Limiting on All Routes',
						'rest-api-firewall'
					) }
				/>
			</FormControl>

			<FormControl>
				<FormControlLabel
					control={
						<Switch
							checked={ !! form.hide_user_routes }
							name="hide_user_routes"
							size="small"
							onChange={ setField }
						/>
					}
					label={ __(
						'Disable /wp/v2/users/* Routes',
						'rest-api-firewall'
					) }
				/>
			</FormControl>

			<Stack spacing={ 1 }>
				<Tooltip
					title={
						! hasValidLicense
							? __(
									'Licence required',
									'rest-api-firewall'
								)
							: ''
					}
					followCursor
				>
					<FormControl disabled={ ! hasValidLicense }>
						<FormControlLabel
							control={
								<Switch
									size="small"
									checked={
										!! form.rest_collections_allowed_post_types_enabled
									}
									name="rest_collections_allowed_post_types_enabled"
									onChange={ setField }
								/>
							}
							label={ __(
								'Restrict Post Types',
								'rest-api-firewall'
							) }
						/>
					</FormControl>
				</Tooltip>

				{ adminData?.post_types && (
					<Stack pl={ 3.5 }>
						<MultipleSelect
							disabled={ ! form.rest_collections_allowed_post_types_enabled || ! hasValidLicense }
							name="rest_collections_allowed_post_types"
							label={ __(
								'Select Post Types',
								'rest-api-firewall'
							) }
							value={
								form.rest_collections_allowed_post_types
							}
							helperText={
								<Stack>
									<Typography
										variant="caption"
										color="inherit"
									>
										{ __(
											'Only the selected post types will be exposed in the REST API.',
											'rest-api-firewall'
										) }
									</Typography>
									<Typography
										variant="caption"
										color="inherit"
									>
										{ __(
											'If left empty, default visibility settings apply.',
											'rest-api-firewall'
										) }
									</Typography>
								</Stack>
							}
							options={ adminData.post_types }
							onChange={ setField }
						/>
					</Stack>
				) }
			</Stack>
		</Stack>
	);
}
