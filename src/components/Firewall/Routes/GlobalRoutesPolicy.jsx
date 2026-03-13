import { useLicense } from '../../../contexts/LicenseContext';
import { useAdminData } from '../../../contexts/AdminDataContext';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormControl from '@mui/material/FormControl';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';

import ObjectTypeSelect from '../../ObjectTypeSelect';
import Divider from '@mui/material/Divider';

const HTTP_METHODS = [ 'GET', 'POST', 'PUT', 'DELETE', 'PATCH' ];

export default function GlobalRoutesPolicy( { form, setField } ) {
	const { hasValidLicense } = useLicense();
	const { adminData } = useAdminData();
	const isModuleEnabled = !! adminData?.admin_options?.firewall_routes_policy_enabled;
	const { __ } = wp.i18n || {};

	const handleMethodToggle = ( method ) => ( e ) => {
		const lower = method.toLowerCase();
		const current = form.disabled_methods || [];
		const next = e.target.checked
			? [ ...new Set( [ ...current, lower ] ) ]
			: current.filter( ( m ) => m !== lower );
		setField( 'disabled_methods', next );
	};

	return (
		<Stack spacing={ 2 } maxWidth={ 640 }>
			
			<Stack spacing={ 0 }>
			<Typography
				variant="subtitle1"
				fontWeight={ 600 }
			>
				{ __( 'Auth. & Rate Limiting', 'rest-api-firewall' ) }
			</Typography>
			<Typography variant="body2" color="text.secondary">
				{ __(
					'Can be overlapped on per-route basis.',
					'rest-api-firewall'
				) }
			</Typography>
			</Stack>

			<FormControl>
				<FormControlLabel
					disabled={ ! isModuleEnabled }
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
					disabled={ ! isModuleEnabled }
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

			
			<Divider />

			<Stack spacing={ 0 }>
				<Typography
					variant="subtitle1"
					fontWeight={ 600 }
				>
					{ __( 'Disable Routes', 'rest-api-firewall' ) }
				</Typography>

				<Typography
					variant="body2"
				>
					{ __( 'WordPress Core routes needs specific handling to ensure proper disabling. Can be overlapped on per-route basis.', 'rest-api-firewall' ) }
				</Typography>
			</Stack>

			<FormControl>
				<FormControlLabel
					disabled={ ! isModuleEnabled }
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

			<FormControl>
				<FormControlLabel
					disabled={ ! isModuleEnabled }
					control={
						<Switch
							checked={ !! form.hide_batch_routes }
							name="hide_batch_routes"
							size="small"
							onChange={ setField }
						/>
					}
					label={ __(
						'Disable /wp/v2/batch/1.0/* Routes',
						'rest-api-firewall'
					) }
				/>
			</FormControl>

			<FormControl>
				<FormControlLabel
					disabled={ ! isModuleEnabled }
					control={
						<Switch
							checked={ !! form.hide_oembed_routes }
							name="hide_oembed_routes"
							size="small"
							onChange={ setField }
						/>
					}
					label={ __(
						'Disable /wp/v2/oembed/1.0/* Routes',
						'rest-api-firewall'
					) }
				/>
			</FormControl>


			<Divider />

			<Stack spacing={ 2 }>
				<Tooltip
					title={
						! hasValidLicense
							? __( 'Licence required', 'rest-api-firewall' )
							: ''
					}
					followCursor
				>
					<Stack spacing={ 1 }>
						<Stack spacing={ 0 }>
							<Typography variant="subtitle1" fontWeight={ 600 }>
								{ __(
									'Disable HTTP Methods',
									'rest-api-firewall'
								) }
							</Typography>
							<Typography variant="body2" color="text.secondary">
								{ __(
									'Toggle to disable an HTTP method globally across all routes. Can be overlapped on per-route basis.',
									'rest-api-firewall'
								) }
							</Typography>
						</Stack>
						<Stack
							direction="row"
							spacing={ 1 }
							flexWrap="wrap"
							pt={ 0.5 }
						>
							{ HTTP_METHODS.map( ( method ) => (
								<FormControlLabel
									key={ method }
								disabled={ ! hasValidLicense || ! isModuleEnabled }
									control={
										<Switch
											size="small"
											checked={ (
												form.disabled_methods || []
											).includes( method.toLowerCase() ) }
											onChange={ handleMethodToggle(
												method
											) }
										/>
									}
									label={
										<Typography
											variant="body2"
											sx={ {
												fontFamily: 'monospace',
												fontWeight: 600,
												fontSize: '0.8rem',
											} }
										>
											{ method }
										</Typography>
									}
								/>
							) ) }
						</Stack>
					</Stack>
				</Tooltip>
			</Stack>

			<Divider />

			<Stack spacing={ 2 }>
				<Tooltip
					title={
						! hasValidLicense
							? __( 'Licence required', 'rest-api-firewall' )
							: ''
					}
					followCursor
				>
					<Stack spacing={ 1 }>
						<Stack spacing={ 0 }>
							<Typography variant="subtitle1" fontWeight={ 600 }>
								{ __(
									'Disable Post Types and Taxonomies',
									'rest-api-firewall'
								) }
							</Typography>
							<Typography variant="body2" color="text.secondary">
								{ __(
									'Toggle to disable post types and taxonomies globally across all routes. Can be overlapped on per-route basis.',
									'rest-api-firewall'
								) }
							</Typography>
						</Stack>
						<Stack>
							<ObjectTypeSelect
								disabled={ ! hasValidLicense || ! isModuleEnabled }
								name="disabled_post_types"
								label={ __(
									'Disable Object Types',
									'rest-api-firewall'
								) }
								value={ form.disabled_post_types || [] }
								helperText={
									<Typography variant="caption" color="inherit">
										{ __(
											'Object types will be blocked in the REST API.',
											'rest-api-firewall'
										) }
									</Typography>
								}
								onChange={ setField }
							/>
						</Stack>
					</Stack>
				</Tooltip>
			</Stack>
		</Stack>
	);
}
