import { useState, useEffect, useCallback } from '@wordpress/element';
import { useLicense } from '../../../contexts/LicenseContext';

import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Tooltip from '@mui/material/Tooltip';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import ObjectTypeSelect from '../../ObjectTypeSelect';
import DisabledRouteResponse from './DisabledRouteResponse';

const HTTP_METHODS = [ 'GET', 'POST', 'PUT', 'DELETE', 'PATCH' ];

export default function GlobalRoutesPolicy( { form, setField, proSettings, onProChange, onMethodToggle, onSave, canSave, isModuleEnabled } ) {
	const { hasValidLicense } = useLicense();
	const { __ } = wp.i18n || {};
	const [ wpPages, setWpPages ] = useState( { special_pages: [], wordpress_pages: [] } );
	const [ appEntry, setAppEntry ] = useState( null );
	const [ proSettings, setProSettings ] = useState( {
		disable_behavior:         '404',
		disable_redirect_url:     '',
		disable_redirect_page_id: '',
		disabled_methods:         [],
		disabled_post_types:      [],
	} );

	const handleProChange = useCallback( ( e ) => {
		const { name, value } = e.target;
		setProSettings( ( prev ) => ( { ...prev, [ name ]: value } ) );
	}, [] );

	return (
		<Stack spacing={ 2 } maxWidth={ 640 }>

			<Stack spacing={ 2 }>

				<Stack spacing={ 0 }>
					<Typography variant="subtitle1" fontWeight={ 600 }>
						{ __( 'Auth. & Rate Limiting', 'rest-api-firewall' ) }
					</Typography>
				</Stack>

				<FormControl>
					<FormControlLabel
						disabled={ ! isModuleEnabled }
						control={
							<Switch
								checked={ hasValidLicense ? !! proSettings.enforce_auth : !! form.enforce_auth }
								name="enforce_auth"
								size="small"
								onChange={ hasValidLicense ? onProChange : setField }
							/>
						}
						label={ __( 'Enforce Authentication on All Routes', 'rest-api-firewall' ) }
					/>
				</FormControl>

				<FormControl>
					<FormControlLabel
						disabled={ ! isModuleEnabled }
						control={
							<Switch
								checked={ hasValidLicense ? !! proSettings.enforce_rate_limit : !! form.enforce_rate_limit }
								name="enforce_rate_limit"
								size="small"
								onChange={ hasValidLicense ? onProChange : setField }
							/>
						}
						label={ __( 'Enforce Rate Limiting on All Routes', 'rest-api-firewall' ) }
					/>
				</FormControl>

				{ hasValidLicense && (
					<Stack direction="row" justifyContent="flex-end">
						<Button
							variant="contained"
							disableElevation
							size="small"
							disabled={ ! canSave }
							onClick={ onSave }
						>
							{ __( 'Save', 'rest-api-firewall' ) }
						</Button>
					</Stack>
				) }

			</Stack>
	
			<Divider />

			<Stack spacing={ 2 }>

				<Stack spacing={ 0 }>
					<Typography variant="subtitle1" fontWeight={ 600 }>
						{ __( 'Disable Routes', 'rest-api-firewall' ) }
					</Typography>
					<Typography variant="body2" color="text.secondary">
						{ __( 'WordPress Core routes require specific handling to be properly disabled.', 'rest-api-firewall' ) }
					</Typography>
				</Stack>

				<FormControl>
					<FormControlLabel
						disabled={ ! isModuleEnabled }
						control={
							<Switch
								checked={ hasValidLicense ? !! proSettings.hide_user_routes : !! form.hide_user_routes }
								name="hide_user_routes"
								size="small"
								onChange={ hasValidLicense ? onProChange : setField }
							/>
						}
						label={ __( 'Disable /wp/v2/users/* Routes', 'rest-api-firewall' ) }
					/>
				</FormControl>

				<Tooltip
					title={ ! hasValidLicense ? __( 'License required', 'rest-api-firewall' ) : '' }
					followCursor
				>
					<Stack spacing={ 2 }>
						<FormControl>
							<FormControlLabel
								disabled={ ! hasValidLicense || ! isModuleEnabled }
								control={
									<Switch
										checked={ !! proSettings.hide_oembed_routes }
										name="hide_oembed_routes"
										size="small"
										onChange={ onProChange }
									/>
								}
								label={ __( 'Disable /wp/v2/oembed/1.0/* Routes', 'rest-api-firewall' ) }
							/>
						</FormControl>

						<FormControl>
							<FormControlLabel
								disabled={ ! hasValidLicense || ! isModuleEnabled }
								control={
									<Switch
										checked={ proSettings.hide_batch_routes }
										name="hide_batch_routes"
										size="small"
										onChange={ onProChange }
									/>
								}
								label={ __( 'Disable /wp/v2/batch/v1 Routes', 'rest-api-firewall' ) }
							/>
						</FormControl>
					</Stack>
				</Tooltip>

				{ hasValidLicense && (
					<Stack direction="row" justifyContent="flex-end">
						<Button
							variant="contained"
							disableElevation
							size="small"
							disabled={ ! canSave }
							onClick={ onSave }
						>
							{ __( 'Save', 'rest-api-firewall' ) }
						</Button>
					</Stack>
				) }

			</Stack>
		

			<Divider />

			<DisabledRouteResponse
				proSettings={ proSettings }
				onChange={ onProChange }
				onSave={ onSave }
				canSave={ canSave }
				isModuleEnabled={ isModuleEnabled }
			/>

			<Divider />

			<Stack spacing={ 2 }>
				<Tooltip
					title={
						! hasValidLicense
							? __( 'License required', 'rest-api-firewall' )
							: ''
					}
					followCursor
				>
					<Stack spacing={ 2 }>
						
						<Stack spacing={ 0 }>
							<Typography variant="subtitle1" fontWeight={ 600 }>
								{ __(
									'Disable HTTP Methods',
									'rest-api-firewall'
								) }
							</Typography>
							<Typography variant="body2" color="text.secondary">
								{ __(
								'Disables an HTTP method globally across all routes.',
									'rest-api-firewall'
								) }
	
							</Typography>
						</Stack>
						
						<Stack
							direction="row"
							gap={ 1 }
							flexWrap="wrap"
						>
							{ HTTP_METHODS.map( ( method ) => (
								<FormControlLabel
									key={ method }
								disabled={ ! hasValidLicense || ! isModuleEnabled }
									control={
										<Switch
											size="small"
											checked={ (
											proSettings.disabled_methods || []
											).includes( method.toLowerCase() ) }
											onChange={ onMethodToggle(
												method
											) }
										/>
									}
									label={
										<Typography
											variant="body2"
											sx={ { fontFamily: 'monospace', fontWeight: 600 } }
										>
											{ method.toUpperCase() }
										</Typography>
									}
									sx={ {
										m: 0,
										px: 1.5,
										py: 0.5,
										userSelect: 'none',
									} }
								/>
							) ) }
						</Stack>
						{ hasValidLicense && (
							<Stack direction="row" justifyContent="flex-end">
								<Button
									variant="contained"
									disableElevation
									size="small"
									disabled={ ! canSave }
									onClick={ onSave }
								>
									{ __( 'Save', 'rest-api-firewall' ) }
								</Button>
							</Stack>
						) }
					</Stack>
				</Tooltip>
			</Stack>

			<Divider />

			<Stack spacing={ 2 }>
				<Tooltip
					title={
						! hasValidLicense
							? __( 'License required', 'rest-api-firewall' )
							: ''
					}
					followCursor
				>
					<Stack spacing={ 2 }>
						<Stack spacing={ 0 }>
							<Typography variant="subtitle1" fontWeight={ 600 }>
								{ __(
									'Disable Post Types and Taxonomies',
									'rest-api-firewall'
								) }
							</Typography>
							<Typography variant="body2" color="text.secondary">
								{ __(
								'Disables post types and taxonomies globally across all routes.',
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
								value={ proSettings.disabled_post_types || [] }
								onChange={ onProChange }
							/>
						</Stack>
						{ hasValidLicense && (
							<Stack direction="row" justifyContent="flex-end">
								<Button
									variant="contained"
									disableElevation
									size="small"
									disabled={ ! canSave }
									onClick={ onSave }
								>
									{ __( 'Save', 'rest-api-firewall' ) }
								</Button>
							</Stack>
						) }
					</Stack>
				</Tooltip>
			</Stack>
		</Stack>
	);
}
