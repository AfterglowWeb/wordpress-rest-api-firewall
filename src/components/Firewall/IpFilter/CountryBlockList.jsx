import { useState, useEffect, useCallback, useMemo } from '@wordpress/element';
import { useAdminData } from '../../../contexts/AdminDataContext';
import { useLicense } from '../../../contexts/LicenseContext';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import LoadingMessage from '../../LoadingMessage';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import BlockIcon from '@mui/icons-material/Block';
import LockIcon from '@mui/icons-material/Lock';

import { DataGrid } from '@mui/x-data-grid';
import * as Flags from 'country-flag-icons/react/3x2';

export default function CountryBlockList( { listType = 'blacklist' } ) {
	const { adminData } = useAdminData();
	const { hasValidLicense, proNonce } = useLicense();
	const { __ } = wp.i18n || {};

	const [ loading, setLoading ] = useState( true );
	const [ saving, setSaving ] = useState( false );
	const [ allCountries, setAllCountries ] = useState( [] );
	const [ stats, setStats ] = useState( [] );
	const [ blockedCountries, setBlockedCountries ] = useState( [] );
	const [ rowSelectionModel, setRowSelectionModel ] = useState( {
		type: 'include',
		ids: new Set(),
	} );

	const fetchStats = useCallback( async () => {
		setLoading( true );
		try {
			const params = hasValidLicense
				? { action: 'get_country_stats_pro', 
					nonce: proNonce, 
					list_type: listType }
				: { action: 'get_country_stats', 
					nonce: adminData.nonce, 
					list_type: listType };
			const response = await fetch( adminData.ajaxurl, {
				method: 'POST',
				headers: {
					'Content-Type':
						'application/x-www-form-urlencoded; charset=UTF-8',
				},
				body: new URLSearchParams( params ),
			} );

			const result = await response.json();

			if ( result?.success && result?.data ) {
				if ( Array.isArray( result.data.countries ) ) {
					setAllCountries( result.data.countries );
				}
				setStats( result.data.stats || [] );
				if ( result.data.blocked_countries !== undefined ) {
					setBlockedCountries( result.data.blocked_countries );
					setRowSelectionModel( {
						type: 'include',
						ids: new Set( result.data.blocked_countries ),
					} );
				}
			}
		} catch {
			// Silent.
		} finally {
			setLoading( false );
		}
	}, [ adminData, hasValidLicense, proNonce, listType ] );

	useEffect( () => {
		fetchStats();
	}, [ fetchStats ] );

	const handleSaveBlockedCountries = async () => {
		if ( ! hasValidLicense || ! proNonce ) {
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
					nonce: proNonce,
					countries: JSON.stringify( [ ...rowSelectionModel.ids ] ),
				} ),
			} );

			const result = await response.json();

			if ( result?.success ) {
				setBlockedCountries( result.data.blocked_countries || [] );
			}
		} catch {
			// Silent.
		} finally {
			setSaving( false );
		}
	};

	const rows = useMemo( () => {
		const statsMap = new Map(
			stats.map( ( s ) => [ s.country_code, parseInt( s.count, 10 ) ] )
		);
		return allCountries.map( ( c ) => ( {
			...c,
			count: statsMap.get( c.country_code ) ?? null,
		} ) );
	}, [ allCountries, stats ] );

	const columns = useMemo( () => [
		{
			field: 'flag',
			headerName: '',
			width: 44,
			sortable: false,
			filterable: false,
			renderCell: ( params ) => {
				const FlagIcon = Flags[ params.row.country_code ];
				return FlagIcon ? (
					<FlagIcon
						title={ params.row.country_name }
						style={ { width: 20, height: 'auto', borderRadius: 2 } }
					/>
				) : null;
			},
		},
		{
			field: 'country_name',
			headerName: __( 'Country', 'rest-api-firewall' ),
			flex: 1,
			width: 170,
		},
		{
			field: 'country_code',
			headerName: __( 'Code', 'rest-api-firewall' ),
			width: 80,
		},
		{
			field: 'count',
			headerName: __( 'Blocked IPs', 'rest-api-firewall' ),
			width: 130,
			type: 'number',
			renderCell: ( params ) =>
				params.value !== null ? (
					<Chip
						label={ params.value }
						size="small"
						color="warning"
						variant="outlined"
					/>
				) : null,
		},
	], [ __ ] );

	if ( loading ) {
		return (
			<LoadingMessage message={ __( 'Loading country stats…', 'rest-api-firewall' ) } />
		);
	}

	return (
		<Stack maxWidth={ 800 } flexGrow={ 1 } spacing={ 3 }>
			<Stack
				direction="row"
				justifyContent="space-between"
				alignItems="center"
				sx={ { mb: 2 } }
			>
				<Stack direction="row" alignItems="center" spacing={ 1 }>
					<Typography variant="subtitle2">
						{ __( 'Block by Country', 'rest-api-firewall' ) }
					</Typography>
			{ rowSelectionModel.ids.size > 0 && (
					<Chip
						label={ rowSelectionModel.ids.size }
							size="small"
							color="error"
						/>
					) }
				</Stack>

				{ hasValidLicense && (
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

			<DataGrid
				showToolbar
				rows={ rows }
				columns={ columns }
				getRowId={ ( row ) => row.country_code }
				checkboxSelection={ hasValidLicense }
			disableRowSelectionOnClick
				rowSelectionModel={ rowSelectionModel }
				onRowSelectionModelChange={ ( model ) => {
					if ( hasValidLicense ) setRowSelectionModel( model );
				} }
				pageSizeOptions={ [ 25, 50, 100 ] }
				initialState={ {
					pagination: { paginationModel: { pageSize: 100 } },
				} }
				sx={ {
					'& .MuiDataGrid-cell': {
						display: 'flex',
						alignItems: 'center',
					},
				} }
			/>
		</Stack>
	);
}
