import { useState, useEffect, useCallback, useMemo } from '@wordpress/element';
import { useAdminData } from '../../contexts/AdminDataContext';
import { useLicense } from '../../contexts/LicenseContext';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import FormControlLabel from '@mui/material/FormControlLabel';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import BlockIcon from '@mui/icons-material/Block';
import LockIcon from '@mui/icons-material/Lock';

/**
 * CountryBlockList component
 * @param {Object} props
 * @param {string} props.listType    - 'whitelist' or 'blacklist'
 * @param {Array}  props.freeEntries - For Free users: array of IP entries from local settings
 */
export default function CountryBlockList( {
	listType = 'blacklist',
	freeEntries = [],
} ) {
	const { adminData } = useAdminData();
	const { hasValidLicense } = useLicense();
	const { __ } = wp.i18n || {};

	const [ loading, setLoading ] = useState( true );
	const [ saving, setSaving ] = useState( false );
	const [ stats, setStats ] = useState( [] );
	const [ blockedCountries, setBlockedCountries ] = useState( [] );
	const [ selectedCountries, setSelectedCountries ] = useState( [] );

	const freeStats = useMemo( () => {
		if ( hasValidLicense ) {
			return [];
		}

		const countryMap = {};
		freeEntries.forEach( ( entry ) => {
			const countryCode =
				entry?.country_code || entry?.geoIp?.country || null;
			const countryName =
				entry?.country_name || entry?.geoIp?.countryName || null;
			if ( countryCode ) {
				if ( ! countryMap[ countryCode ] ) {
					countryMap[ countryCode ] = {
						country_code: countryCode,
						country_name: countryName,
						count: 0,
					};
				}
				countryMap[ countryCode ].count++;
			}
		} );

		return Object.values( countryMap ).sort(
			( a, b ) => b.count - a.count
		);
	}, [ freeEntries, hasValidLicense ] );

	const fetchStats = useCallback( async () => {
		if ( ! hasValidLicense ) {
			setStats( freeStats );
			setLoading( false );
			return;
		}

		setLoading( true );
		try {
			const response = await fetch( adminData.ajaxurl, {
				method: 'POST',
				headers: {
					'Content-Type':
						'application/x-www-form-urlencoded; charset=UTF-8',
				},
				body: new URLSearchParams( {
					action: 'get_country_stats',
					nonce: adminData.nonce,
					list_type: listType,
				} ),
			} );

			const result = await response.json();

			if ( result?.success && result?.data ) {
				setStats( result.data.stats || [] );
				setBlockedCountries( result.data.blocked_countries || [] );
				setSelectedCountries( result.data.blocked_countries || [] );
			}
		} catch ( error ) {
			// Handle error silently.
		} finally {
			setLoading( false );
		}
	}, [ adminData, listType, hasValidLicense, freeStats ] );

	useEffect( () => {
		fetchStats();
	}, [ fetchStats ] );

	const handleToggleCountry = ( countryCode ) => {
		if ( ! hasValidLicense ) {
			return;
		}

		setSelectedCountries( ( prev ) => {
			if ( prev.includes( countryCode ) ) {
				return prev.filter( ( c ) => c !== countryCode );
			}
			return [ ...prev, countryCode ];
		} );
	};

	const handleSaveBlockedCountries = async () => {
		if ( ! hasValidLicense ) {
			return;
		}

		setSaving( true );
		try {
			const response = await fetch( adminData.ajaxurl, {
				method: 'POST',
				headers: {
					'Content-Type':
						'application/x-www-form-urlencoded; charset=UTF-8',
				},
				body: new URLSearchParams( {
					action: 'update_blocked_countries',
					nonce: adminData.nonce,
					countries: JSON.stringify( selectedCountries ),
				} ),
			} );

			const result = await response.json();

			if ( result?.success ) {
				setBlockedCountries( result.data.blocked_countries || [] );
			}
		} catch ( error ) {
			// Handle error silently.
		} finally {
			setSaving( false );
		}
	};

	const hasChanges =
		JSON.stringify( selectedCountries.sort() ) !==
		JSON.stringify( blockedCountries.sort() );

	if ( loading ) {
		return (
			<Box sx={ { display: 'flex', justifyContent: 'center', py: 4 } }>
				<CircularProgress size={ 24 } />
			</Box>
		);
	}

	if ( stats.length === 0 ) {
		return (
			<Box sx={ { py: 2, textAlign: 'center' } }>
				<Typography color="text.secondary">
					{ __(
						'No country data available yet. IPs will be tagged with country info when blocked.',
						'rest-api-firewall'
					) }
				</Typography>
			</Box>
		);
	}

	return (
		<Box>
			<Stack
				direction="row"
				justifyContent="space-between"
				alignItems="center"
				sx={ { mb: 2 } }
			>
				<Typography variant="subtitle2">
					{ __( 'Blocked IPs by Country', 'rest-api-firewall' ) }
					<Chip
						label={ stats.length }
						size="small"
						sx={ { ml: 1 } }
					/>
				</Typography>

				{ hasValidLicense && hasChanges && (
					<Button
						variant="contained"
						size="small"
						onClick={ handleSaveBlockedCountries }
						disabled={ saving }
						startIcon={ <BlockIcon /> }
					>
						{ saving
							? __( 'Saving…', 'rest-api-firewall' )
							: __( 'Save Country Blocks', 'rest-api-firewall' ) }
					</Button>
				) }
			</Stack>

			{ ! hasValidLicense && (
				<Box
					sx={ {
						mb: 2,
						p: 1.5,
						bgcolor: 'action.hover',
						borderRadius: 1,
					} }
				>
					<Stack direction="row" spacing={ 1 } alignItems="center">
						<LockIcon fontSize="small" color="action" />
						<Typography variant="body2" color="text.secondary">
							{ __(
								'Upgrade to Pro to block entire countries',
								'rest-api-firewall'
							) }
						</Typography>
					</Stack>
				</Box>
			) }

			<Grid container spacing={ 1 }>
				{ stats.map( ( country ) => {
					const isBlocked = selectedCountries.includes(
						country.country_code
					);

					return (
						<Grid
							item
							xs={ 6 }
							sm={ 4 }
							md={ 3 }
							key={ country.country_code }
						>
							<Box
								sx={ {
									p: 1,
									border: '1px solid',
									borderColor: isBlocked
										? 'error.main'
										: 'divider',
									borderRadius: 1,
									bgcolor: isBlocked
										? 'error.lighter'
										: 'background.paper',
									opacity: hasValidLicense ? 1 : 0.7,
									cursor: hasValidLicense
										? 'pointer'
										: 'default',
									transition: 'all 0.2s',
									'&:hover': hasValidLicense
										? {
												borderColor: 'primary.main',
												bgcolor: isBlocked
													? 'error.light'
													: 'action.hover',
										  }
										: {},
								} }
								onClick={ () =>
									handleToggleCountry( country.country_code )
								}
							>
								<FormControlLabel
									control={
										<Checkbox
											checked={ isBlocked }
											disabled={ ! hasValidLicense }
											size="small"
											sx={ { p: 0.5 } }
										/>
									}
									label={
										<Stack
											direction="row"
											spacing={ 0.5 }
											alignItems="center"
											sx={ { ml: 0.5 } }
										>
											<Typography
												variant="body2"
												noWrap
												sx={ { maxWidth: 100 } }
											>
												{ country.country_name ||
													country.country_code }
											</Typography>
											<Chip
												label={ country.count }
												size="small"
												color={
													isBlocked
														? 'error'
														: 'default'
												}
												variant="outlined"
											/>
										</Stack>
									}
									sx={ { m: 0, width: '100%' } }
								/>
							</Box>
						</Grid>
					);
				} ) }
			</Grid>
		</Box>
	);
}
