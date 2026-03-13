import { useState, useEffect, useCallback } from '@wordpress/element';
import { useLicense } from '../../../contexts/LicenseContext';
import { useAdminData } from '../../../contexts/AdminDataContext';
import { useApplication } from '../../../contexts/ApplicationContext';
import useProActions from '../../../hooks/useProActions';

import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import ListItemText from '@mui/material/ListItemText';
import ListSubheader from '@mui/material/ListSubheader';
import OutlinedInput from '@mui/material/OutlinedInput';

import ObjectTypeSelect from '../../ObjectTypeSelect';

const HTTP_METHODS = [ 'GET', 'POST', 'PUT', 'DELETE', 'PATCH' ];

const getDisableBehaviors = ( __ ) => [
	{ value: '404',      label: __( '404 Not Found',          'rest-api-firewall' ), desc: __( 'Returns a standard not-found response. The route appears to never have existed.',                                'rest-api-firewall' ) },
	{ value: '410',      label: __( '410 Gone',               'rest-api-firewall' ), desc: __( 'Signals the resource was intentionally and permanently removed.',                                             'rest-api-firewall' ) },
	{ value: '301_url',  label: __( '301 Custom URL Redirect',       'rest-api-firewall' ), desc: __( 'Permanently redirects to a custom URL.',                                                                        'rest-api-firewall' ) },
	{ value: '301_page', label: __( '301 WordPress Page Redirect',   'rest-api-firewall' ), desc: __( 'Permanently redirects to a WordPress page.',                                                                    'rest-api-firewall' ) },
	{ value: 'empty',    label: __( 'Empty (no response)',    'rest-api-firewall' ), desc: __( 'Closes the connection without a response body. The server appears to not exist on this route.',              'rest-api-firewall' ) },
];

export default function GlobalRoutesPolicy( { form, setField } ) {
	const { hasValidLicense, proNonce } = useLicense();
	const { adminData } = useAdminData();
	const nonce = proNonce || adminData?.nonce;
	const { selectedApplicationId } = useApplication();
	const { save } = useProActions();

	const isModuleEnabled = !! adminData?.admin_options?.firewall_routes_policy_enabled;
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

	const handleMethodToggle = ( method ) => ( e ) => {
		const lower = method.toLowerCase();
		const current = proSettings.disabled_methods || [];
		const next = e.target.checked
			? [ ...new Set( [ ...current, lower ] ) ]
			: current.filter( ( m ) => m !== lower );
		setProSettings( ( prev ) => ( { ...prev, disabled_methods: next } ) );
	};

	const behavior = proSettings.disable_behavior || '404';
	const DISABLE_BEHAVIORS = getDisableBehaviors( __ );

	const MenuItemStyled = ( { option } ) => {
		return (
			<MenuItem
				key={ option.value }
				value={ option.value }
				sx={ { pl: 3} }
			>
			<ListItemText
				primary={ option.label }
				secondary={ option.secondary ?? null }
				sx={{
					'.MuiListItemText-root': {
						maxWidth: 300,
					},
					'.MuiListItemText-primary, .MuiListItemText-secondary': {
						overflow: 'hidden',
						textOverflow: 'ellipsis',
						whiteSpace: 'nowrap',
					}
				}}
			/>
			</MenuItem>
		);
	}

	const loadAppSettings = useCallback( async () => {
		if ( ! selectedApplicationId ) return;
		try {
			const response = await fetch( adminData.ajaxurl, {
				method: 'POST',
				headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
				body: new URLSearchParams( {
					action: 'get_application_entry',
					nonce,
					id: selectedApplicationId,
				} ),
			} );
			const result = await response.json();
			if ( result?.success && result.data?.entry ) {
				const entry = result.data.entry;
				setAppEntry( entry );
				const s = entry.settings || {};
				setProSettings( {
					disable_behavior:         s.disable_behavior         || '404',
					disable_redirect_url:     s.disable_redirect_url     || '',
					disable_redirect_page_id: s.disable_redirect_page_id || '',
					disabled_methods:         s.disabled_methods         || [],
					disabled_post_types:      s.disabled_post_types      || [],
				} );
			}
		} catch {}
	}, [ adminData, nonce, selectedApplicationId ] );

	const saveRoutesPolicy = useCallback( () => {
		if ( ! selectedApplicationId || ! appEntry ) return;
		const existingSettings = appEntry.settings || {};
		save(
			{
				action:   'update_application_entry',
				id:       selectedApplicationId,
				title:    appEntry.title || '',
				settings: JSON.stringify( { ...existingSettings, ...proSettings } ),
			},
			{
				confirmTitle:   __( 'Save Routes Policy', 'rest-api-firewall' ),
				confirmMessage: __( 'Save routes policy settings for this application?', 'rest-api-firewall' ),
				successTitle:   __( 'Routes Policy Saved', 'rest-api-firewall' ),
				successMessage: __( 'Routes policy saved successfully.', 'rest-api-firewall' ),
				onSuccess: loadAppSettings,
			}
		);
	}, [ selectedApplicationId, appEntry, proSettings, save, loadAppSettings, __ ] );

	useEffect( () => {
		loadAppSettings();
	}, [ loadAppSettings ] );

	useEffect( () => {
		if ( behavior !== '301_page' ) return;
		fetch( adminData.ajaxurl, {
			method: 'POST',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
			body: new URLSearchParams( {
				action: 'get_wordpress_pages',
				nonce: nonce,
				id: selectedApplicationId,
			} ),
		} )
			.then( ( r ) => r.json() )
			.then( ( result ) => setWpPages( result?.data?.pages || { special_pages: [], wordpress_pages: [] } ) )
			.catch( () => {} );
	}, [ behavior, adminData ] );

	return (
		<Stack spacing={ 2 } maxWidth={ 640 }>
			
			<Stack spacing={ 2 }>
			
				<Stack spacing={ 0 }>
				<Typography
					variant="subtitle1"
					fontWeight={ 600 }
				>
					{ __( 'Auth. & Rate Limiting', 'rest-api-firewall' ) }
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

			</Stack>

			<Divider />

			<Tooltip
				title={ ! hasValidLicense ? __( 'Licence required', 'rest-api-firewall' ) : '' }
				followCursor
			>
				<Stack spacing={ 2 }>
					<Stack spacing={ 0 }>
						<Typography variant="subtitle1" fontWeight={ 600 }>
							{ __( 'Disabled Route Response', 'rest-api-firewall' ) }
						</Typography>
						<Typography variant="body2" color="text.secondary">
							{ __( 'Defines how the server responds when a route is disabled.', 'rest-api-firewall' ) }
						</Typography>
					</Stack>

					<FormControl size="small" disabled={ ! isModuleEnabled || ! hasValidLicense } sx={ { maxWidth: 320 } }>
						<InputLabel>{ __( 'Response Type', 'rest-api-firewall' ) }</InputLabel>
						<Select
							value={ hasValidLicense ? behavior : '404' }
							name="disable_behavior"
							label={ __( 'Response Type', 'rest-api-firewall' ) }
							onChange={ handleProChange }
						>
							{ hasValidLicense
								? DISABLE_BEHAVIORS.map( ( b ) => (
									<MenuItem 
									key={ b.value } 
									value={ b.value }>{ b.label }</MenuItem>
								) )
								: <MenuItem 
								value="404"
								>{ __( '404 Not Found', 'rest-api-firewall' ) }</MenuItem>
							}
						</Select>
					</FormControl>

					{ hasValidLicense && (
						<Typography variant="caption" color="text.secondary">
							{ DISABLE_BEHAVIORS.find( ( b ) => b.value === behavior )?.desc }
						</Typography>
					) }

					{ hasValidLicense && behavior === '301_url' && (
						<TextField
							size="small"
							label={ __( 'Redirect URL', 'rest-api-firewall' ) }
							name="disable_redirect_url"
						value={ proSettings.disable_redirect_url || '' }
						onChange={ handleProChange }
							disabled={ ! isModuleEnabled }
							placeholder="https://example.com/not-found"
							sx={ { maxWidth: 400 } }
						/>
					) }

					{ hasValidLicense && behavior === '301_page' && (
						<FormControl size="small" disabled={ ! isModuleEnabled } sx={ { maxWidth: 320 } }>
							<InputLabel id="disable-redirect-page-label">{ __( 'WordPress Page', 'rest-api-firewall' ) }</InputLabel>
							<Select
								labelId="disable-redirect-page-label"
							value={ proSettings.disable_redirect_page_id || '' }
							name="disable_redirect_page_id"
							onChange={ handleProChange }
								input={ <OutlinedInput label={ __( 'WordPress Page', 'rest-api-firewall' ) } /> }
								renderValue={ ( val ) => {
									const all = [ ...( wpPages.special_pages || [] ), ...( wpPages.wordpress_pages || [] ) ];
									return all.find( ( p ) => String( p.value ) === String( val ) )?.label ?? val;
								} }
								MenuProps={ { PaperProps: { style: { maxHeight: 48 * 8 + 8, maxWidth: 320 } } } }
							>
								{ ( wpPages.special_pages || [] ).length > 0 && (
									<ListSubheader 
									sx={ { 
										fontWeight: 700, 
										fontSize: '0.75rem', 
										lineHeight: '28px', 
										textTransform: 'uppercase', 
										letterSpacing: 0.5 
									} }
									>
										{ __( 'Special Pages', 'rest-api-firewall' ) }
									</ListSubheader>
								) }
								{ ( wpPages.special_pages || [] ).map( ( page ) => (
									<MenuItemStyled key={ page.value } option={ page } />
								) ) }
								{ ( wpPages.wordpress_pages || [] ).length > 0 && (
									<ListSubheader sx={ { fontWeight: 700, fontSize: '0.75rem', lineHeight: '28px', textTransform: 'uppercase', letterSpacing: 0.5 } }>
										{ __( 'Pages', 'rest-api-firewall' ) }
									</ListSubheader>
								) }
								{ ( wpPages.wordpress_pages || [] ).map( ( page ) => (
									<MenuItemStyled key={ page.value } option={ page } />
								) ) }
							</Select>
						</FormControl>
					) }
					{ hasValidLicense && (
						<Stack direction="row" justifyContent="flex-end">
							<Button
								variant="contained"
								disableElevation
								size="small"
								disabled={ ! selectedApplicationId || ! appEntry }
								onClick={ saveRoutesPolicy }
							>
								{ __( 'Save', 'rest-api-firewall' ) }
							</Button>
						</Stack>
					) }
				</Stack>
			</Tooltip>

			<Divider />

			<Stack spacing={ 2 }>

				<Stack spacing={ 0 }>
					<Typography
						variant="subtitle1"
						fontWeight={ 600 }
					>
						{ __( 'Disable Routes', 'rest-api-firewall' ) }
					</Typography>

					<Typography
						variant="body2"
						color="text.secondary"
					>
						{ __( 'WordPress Core routes require specific handling to be properly disabled.', 'rest-api-firewall' ) }
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
											onChange={ handleMethodToggle(
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
									disabled={ ! selectedApplicationId || ! appEntry }
									onClick={ saveRoutesPolicy }
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
							? __( 'Licence required', 'rest-api-firewall' )
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
								onChange={ handleProChange }
							/>
						</Stack>
						{ hasValidLicense && (
							<Stack direction="row" justifyContent="flex-end">
								<Button
									variant="contained"
									disableElevation
									size="small"
									disabled={ ! selectedApplicationId || ! appEntry }
									onClick={ saveRoutesPolicy }
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
