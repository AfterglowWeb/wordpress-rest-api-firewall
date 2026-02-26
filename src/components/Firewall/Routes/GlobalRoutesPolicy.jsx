import { useAdminData } from '../../../contexts/AdminDataContext';
import { useLicense } from '../../../contexts/LicenseContext';

import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormControl from '@mui/material/FormControl';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';

import MultipleSelect from '../../MultipleSelect';

const HTTP_METHODS = [ 'GET', 'POST', 'PUT', 'DELETE', 'PATCH' ];

function buildGroupedPostTypeOptions( items, __ ) {
	const groups = [
		{ key: 'post_type', label: __( 'Posts', 'rest-api-firewall' ) },
		{ key: 'taxonomy', label: __( 'Taxonomies', 'rest-api-firewall' ) },
	];

	const result = [];

	for ( const { key, label } of groups ) {
		const typeItems = items.filter( ( item ) => item.type === key );
		if ( ! typeItems.length ) continue;

		const publicItems = typeItems.filter( ( item ) => item.public );
		const privateItems = typeItems.filter( ( item ) => ! item.public );

		result.push( { groupLabel: label } );

		if ( publicItems.length ) {
			result.push( { subGroupLabel: __( 'Public', 'rest-api-firewall' ) } );
			publicItems.forEach( ( item ) =>
				result.push( {
					value: item.value,
					label: item.label,
					secondary: item._builtin
						? __( 'builtin', 'rest-api-firewall' )
						: __( 'custom', 'rest-api-firewall' ),
				} )
			);
		}

		if ( privateItems.length ) {
			result.push( { subGroupLabel: __( 'Private', 'rest-api-firewall' ) } );
			privateItems.forEach( ( item ) =>
				result.push( {
					value: item.value,
					label: item.label,
					secondary: item._builtin
						? __( 'builtin', 'rest-api-firewall' )
						: __( 'custom', 'rest-api-firewall' ),
				} )
			);
		}
	}

	return result;
}

export default function GlobalRoutesPolicy( { form, setField } ) {
	const { adminData } = useAdminData();
	const { hasValidLicense } = useLicense();
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
							? __( 'Licence required', 'rest-api-firewall' )
							: ''
					}
					followCursor
				>
					<Stack spacing={ 0.5 }>
						<Typography variant="body2">
							{ __( 'Disable HTTP Methods', 'rest-api-firewall' ) }
						</Typography>
						<Typography variant="caption" color="text.secondary">
							{ __(
								'Toggle to disable an HTTP method globally across all routes.',
								'rest-api-firewall'
							) }
						</Typography>

						<Stack
							direction="row"
							spacing={ 1 }
							flexWrap="wrap"
							pt={ 0.5 }
						>
							{ HTTP_METHODS.map( ( method ) => (
								<FormControlLabel
									key={ method }
									disabled={ ! hasValidLicense }
									control={
										<Switch
											size="small"
											checked={ ( form.disabled_methods || [] ).includes(
												method.toLowerCase()
											) }
											onChange={ handleMethodToggle( method ) }
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

			{ adminData?.post_types && (
				<Stack spacing={ 1 }>
					<Tooltip
						title={
							! hasValidLicense
								? __( 'Licence required', 'rest-api-firewall' )
								: ''
						}
						followCursor
					>
						<Stack>
							<MultipleSelect
								disabled={ ! hasValidLicense }
								name="disabled_post_types"
								label={ __(
									'Disable Object Types',
									'rest-api-firewall'
								) }
								value={ form.disabled_post_types || [] }
								helperText={
									<Typography
										variant="caption"
										color="inherit"
									>
										{ __(
											'Object types will be blocked in the REST API.',
											'rest-api-firewall'
										) }
									</Typography>
								}
								options={ buildGroupedPostTypeOptions(
									adminData.post_types,
									__
								) }
								onChange={ setField }
							/>
						</Stack>
					</Tooltip>
				</Stack>
			) }
		</Stack>
	);
}
