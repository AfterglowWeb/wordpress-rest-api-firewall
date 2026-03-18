import { useState, useEffect, useCallback, useMemo, useRef } from '@wordpress/element';
import { useAdminData } from '../../../contexts/AdminDataContext';
import { useLicense } from '../../../contexts/LicenseContext';
import useProActions from '../../../hooks/useProActions';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import LoadingMessage from '../../LoadingMessage';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { DataGrid, useGridApiRef, gridFilteredSortedRowIdsSelector } from '@mui/x-data-grid';
import * as Flags from 'country-flag-icons/react/3x2';

export default function CountryBlockList( { listType = 'blacklist' } ) {
	const { adminData } = useAdminData();
	const { hasValidLicense, proNonce } = useLicense();
	const { save, saving } = useProActions();
	const { __ } = wp.i18n || {};

	const [ loading, setLoading ] = useState( true );
	const [ allCountries, setAllCountries ] = useState( [] );
	const [ stats, setStats ] = useState( [] );
	const [ savedBlockedCountries, setSavedBlockedCountries ] = useState( [] );
	const [ rowSelectionModel, setRowSelectionModel ] = useState( {
		type: 'include',
		ids: new Set(),
	} );
	const blockedFetchedRef = useRef( false );
	const apiRef = useGridApiRef();

	const fetchCountries = useCallback( async () => {
		setLoading( true );
		try {
			const response = await fetch( adminData.ajaxurl, {
				method: 'POST',
				headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
				body: new URLSearchParams( {
					action: 'get_country_stats',
					nonce: adminData.nonce,
					list_type: listType,
				} ),
			} );
			const result = await response.json();
			if ( result?.success && result?.data ) {
				if ( Array.isArray( result.data.countries ) ) {
					setAllCountries( result.data.countries );
				}
				setStats( result.data.stats || [] );
			}
		} catch {
			// Silent fail.
		} finally {
			setLoading( false );
		}
	}, [ adminData, listType ] );

	const fetchBlockedCountries = useCallback( async () => {
		if ( ! proNonce ) return;
		try {
			const response = await fetch( adminData.ajaxurl, {
				method: 'POST',
				headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
				body: new URLSearchParams( {
					action: 'get_country_stats_pro',
					nonce: proNonce,
					list_type: listType,
				} ),
			} );
			const result = await response.json();
			if ( result?.success && result?.data?.blocked_countries !== undefined ) {
				const blocked = result.data.blocked_countries;
				setSavedBlockedCountries( blocked );
				setRowSelectionModel( { type: 'include', ids: new Set( blocked ) } );
			}
		} catch {
			// Silent fail.
		}
	}, [ adminData, proNonce, listType ] );

	useEffect( () => {
		if ( ! allCountries?.length ) {
			fetchCountries();
		}
	}, [ fetchCountries, allCountries?.length ] );

	useEffect( () => {
		if ( ! blockedFetchedRef.current && hasValidLicense && proNonce ) {
			blockedFetchedRef.current = true;
			fetchBlockedCountries();
		}
	}, [ hasValidLicense, proNonce, fetchBlockedCountries ] );

	const hasChanges = useMemo( () => {
		const saved = new Set( savedBlockedCountries );
		if ( saved.size !== rowSelectionModel.ids.size ) return true;
		for ( const id of rowSelectionModel.ids ) {
			if ( ! saved.has( id ) ) return true;
		}
		return false;
	}, [ rowSelectionModel.ids, savedBlockedCountries ] );

	const handleSave = () => {
		save(
			{
				action: 'update_blocked_countries',
				list_type: listType,
				countries: JSON.stringify( [ ...rowSelectionModel.ids ] ),
			},
			{
				confirmTitle: __( 'Confirm Country Block', 'rest-api-firewall' ),
				confirmMessage: __(
							'Are you sure you want to update the blocked countries? This will affect all traffic from the selected countries.',
							'rest-api-firewall'
					  ),
				successTitle: __( 'Saved', 'rest-api-firewall' ),
				successMessage: __( 'Blocked countries updated.', 'rest-api-firewall' ),
				onSuccess: ( data ) => {
					const updated = data?.blocked_countries || [];
					setSavedBlockedCountries( updated );
				},
			}
		);
	};

	const countryMap = useMemo(
		() => new Map( allCountries.map( ( c ) => [ c.country_code, c.country_name ] ) ),
		[ allCountries ]
	);

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
			>
				<Stack direction="row" alignItems="center" spacing={ 1 }>
					<Typography variant="h6" fontWeight={600}>
						{ __( 'Block by Country', 'rest-api-firewall' ) }
					</Typography>
				</Stack>

				{ hasValidLicense && (
					<Button
						variant="contained"
						size="small"
						disableElevation
						onClick={ handleSave }
						disabled={ saving || ! hasChanges }
					>
						{ __( 'Save', 'rest-api-firewall' ) }
					</Button>
				) }
			</Stack>

			{ hasValidLicense && savedBlockedCountries.length > 0 && (
				<Stack spacing={ 1 }>
					<Stack direction="row" gap={ 1 } alignItems="center">
						<Typography variant="body2">
							{ __( 'Blocked countries', 'rest-api-firewall' ) }
						</Typography>
						<Chip
							label={ savedBlockedCountries.length }
							size="small"
							color="primary"
							variant="outlined"
						/>
					</Stack>
					<Stack direction="row" flexWrap="wrap" gap={ 1 }>
						{ savedBlockedCountries.map( ( code ) => {
							const FlagIcon = Flags[ code ];
							return (
								<Chip
									key={ code }
									size="small"
									color="primary"
									variant="outlined"
									disabled
									label={
										<Stack component="span" direction="row" spacing={ 0.5 } alignItems="center">
											{ FlagIcon && <FlagIcon style={ { width: 14, height: 'auto', borderRadius: 1 } } /> }
											<span>{ countryMap.get( code ) || code }</span>
										</Stack>
									}
								/>
							);
						} ) }
					</Stack>
				</Stack>
			) }

			{ hasValidLicense && rowSelectionModel.ids.size > 0 && (
				<Stack spacing={ 1 }>
					<Stack direction="row" gap={ 1 } alignItems="center">
						<Typography variant="body2">
							{ __( 'Selected countries', 'rest-api-firewall' ) }
						</Typography>
						<Chip
							label={ rowSelectionModel.ids.size }
							size="small"
							color="default"
						/>
					</Stack>
					<Stack direction="row" flexWrap="wrap" gap={ 1 }>
						{ [ ...rowSelectionModel.ids ].map( ( code ) => {
							const FlagIcon = Flags[ code ];
							return (
								<Chip
									key={ code }
									size="small"
									color={ savedBlockedCountries.includes( code ) ? 'primary' : 'default' }
									variant="outlined"
									onDelete={ () => {
										const next = new Set( rowSelectionModel.ids );
										next.delete( code );
										setRowSelectionModel( { type: 'include', ids: next } );
									} }
									label={
										<Stack component="span" direction="row" spacing={ 0.5 } alignItems="center">
											{ FlagIcon && <FlagIcon style={ { width: 14, height: 'auto', borderRadius: 1 } } /> }
											<span>{ countryMap.get( code ) || code }</span>
										</Stack>
									}
								/>
							);
						} ) }
					</Stack>
				</Stack>
			) }

			{ ! hasValidLicense && (
				<Box sx={ { p: 1.5, bgcolor: 'action.hover', borderRadius: 1 } }>
					<Typography variant="body2" color="text.secondary">
						{ __( 'License required to block countries', 'rest-api-firewall' ) }
					</Typography>
				</Box>
			) }

			<DataGrid
				apiRef={ apiRef }
				showToolbar
				rows={ rows }
				columns={ columns }
				getRowId={ ( row ) => row.country_code }
				checkboxSelection={ hasValidLicense }
				rowSelectionModel={ rowSelectionModel }
				onRowSelectionModelChange={ ( model ) => {
					if ( ! hasValidLicense ) return;
					const visibleIds = new Set( gridFilteredSortedRowIdsSelector( apiRef ) );
					const hiddenSelected = [ ...rowSelectionModel.ids ].filter( ( id ) => ! visibleIds.has( id ) );
					setRowSelectionModel( {
						type: 'include',
						ids: new Set( [ ...hiddenSelected, ...model.ids ] ),
					} );
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
