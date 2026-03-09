import { useState, useEffect, useCallback, useMemo } from '@wordpress/element';
import { useAdminData } from '../../../contexts/AdminDataContext';
import { useLicense } from '../../../contexts/LicenseContext';
import { useApplication } from '../../../contexts/ApplicationContext';

import { DataGrid } from '@mui/x-data-grid';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';

import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

import UserEditor from './UserEditor';
import useProActions from '../../../hooks/useProActions';

export default function Users() {
	const { adminData } = useAdminData();
	const { hasValidLicense, proNonce } = useLicense();
	const nonce = proNonce || adminData.nonce;
	const { __ } = wp.i18n || {};

	const { selectedApplicationId } = useApplication();
	const { remove } = useProActions();

	const [ rows, setRows ] = useState( [] );
	const [ loading, setLoading ] = useState( true );
	const [ paginationModel, setPaginationModel ] = useState( {
		page: 0,
		pageSize: 25,
	} );
	const [ sortModel, setSortModel ] = useState( [
		{ field: 'date_created', sort: 'desc' },
	] );
	const [ rowSelectionModel, setRowSelectionModel ] = useState( {
		type: 'include',
		ids: new Set( [] ),
	} );
	const [ fetchError, setFetchError ] = useState( '' );
	const [ editingUser, setEditingUser ] = useState( null );

	const [ rlMax, setRlMax ] = useState( '' );
	const [ rlWindow, setRlWindow ] = useState( '' );
	const [ rlRelease, setRlRelease ] = useState( '' );
	const [ rlBlacklistAfter, setRlBlacklistAfter ] = useState( '' );
	const [ rlBlacklistWindow, setRlBlacklistWindow ] = useState( '' );
	const [ rateLimitSaving, setRateLimitSaving ] = useState( false );

	const loadAppRateLimit = useCallback( async () => {
		if ( ! selectedApplicationId ) return;
		try {
			const res = await fetch( adminData.ajaxurl, {
				method: 'POST',
				headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
				body: new URLSearchParams( {
					action: 'get_application_entry',
					nonce,
					id: selectedApplicationId,
				} ),
			} );
			const result = await res.json();
			if ( result?.success && result?.data?.entry ) {
				const rl = result.data.entry.settings?.rate_limit || {};
				setRlMax( rl.max_requests ?? '' );
				setRlWindow( rl.window_seconds ?? '' );
				setRlRelease( rl.release_seconds ?? '' );
				setRlBlacklistAfter( rl.blacklist_after ?? '' );
				setRlBlacklistWindow( rl.blacklist_window ?? '' );
			}
		} catch {}
	}, [ adminData, nonce, selectedApplicationId ] );

	const saveAppRateLimit = useCallback( async () => {
		if ( ! selectedApplicationId ) return;
		setRateLimitSaving( true );
		try {
			const res = await fetch( adminData.ajaxurl, {
				method: 'POST',
				headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
				body: new URLSearchParams( {
					action: 'get_application_entry',
					nonce,
					id: selectedApplicationId,
				} ),
			} );
			const result = await res.json();
			const entry = result?.success ? result.data.entry : {};
			const existingSettings = entry.settings || {};
			await fetch( adminData.ajaxurl, {
				method: 'POST',
				headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
				body: new URLSearchParams( {
					action: 'update_application_entry',
					nonce,
					id: selectedApplicationId,
					title: entry.title || '',
					settings: JSON.stringify( {
						...existingSettings,
						rate_limit: {
							max_requests: Number( rlMax ) || 0,
							window_seconds: Number( rlWindow ) || 0,
							release_seconds: Number( rlRelease ) || 0,
							blacklist_after: Number( rlBlacklistAfter ) || 0,
							blacklist_window: Number( rlBlacklistWindow ) || 0,
						},
					} ),
				} ),
			} );
		} catch {} finally {
			setRateLimitSaving( false );
		}
	}, [ adminData, nonce, selectedApplicationId, rlMax, rlWindow, rlRelease, rlBlacklistAfter, rlBlacklistWindow ] );

	useEffect( () => {
		loadAppRateLimit();
	}, [ loadAppRateLimit ] );

	const handleDeleteOne = useCallback(
		( id, displayName ) => {
			remove(
				{ action: 'delete_user_entry', id },
				{
					confirmTitle: __( 'Delete User', 'rest-api-firewall' ),
					confirmMessage: displayName
						? `${ __(
								'Permanently delete',
								'rest-api-firewall'
						  ) } "${ displayName }"? ${ __(
								'This action cannot be undone.',
								'rest-api-firewall'
						  ) }`
						: __(
								'Permanently delete this user? This action cannot be undone.',
								'rest-api-firewall'
						  ),
					confirmLabel: __( 'Delete', 'rest-api-firewall' ),
					onSuccess: () =>
						setRows( ( prev ) =>
							prev.filter( ( row ) => row.id !== id )
						),
				}
			);
		},
		[ remove, __ ]
	);

	const columns = useMemo(
		() => [
			{
				field: 'actions',
				headerName: __( 'Actions', 'rest-api-firewall' ),
				width: 80,
				sortable: false,
				filterable: false,
				renderCell: ( params ) => (
					<IconButton
						size="small"
						color="default"
						onClick={ () =>
							handleDeleteOne(
								params.row.id,
								params.row.display_name
							)
						}
					>
						<DeleteOutlineIcon fontSize="small" />
					</IconButton>
				),
			},
			{
				field: 'enabled',
				headerName: __( 'Status', 'rest-api-firewall' ),
				width: 100,
				renderCell: ( params ) =>
					!! params.value ? (
						<Chip
							label={ __( 'Active', 'rest-api-firewall' ) }
							size="small"
							color="success"
							variant="outlined"
						/>
					) : (
						<Chip
							label={ __( 'Inactive', 'rest-api-firewall' ) }
							size="small"
							variant="outlined"
						/>
					),
			},
			{
				field: 'display_name',
				headerName: __( 'User', 'rest-api-firewall' ),
				flex: 1,
				minWidth: 150,
				renderCell: ( params ) => (
					<Stack
						direction="row"
						spacing={ 0.5 }
						alignItems="center"
						sx={ { cursor: 'pointer' } }
						onClick={ () => setEditingUser( params.row ) }
					>
						<Typography
							variant="body2"
							sx={ {
								color: 'primary.main',
								'&:hover': { textDecoration: 'underline' },
							} }
						>
							{ params.value }
						</Typography>
						<OpenInNewIcon
							sx={ { fontSize: 13, color: 'text.disabled' } }
						/>
					</Stack>
				),
			},
			{
				field: 'auth_method',
				headerName: __( 'Auth Method', 'rest-api-firewall' ),
				width: 140,
				renderCell: ( params ) => (
					<Typography
						variant="body2"
						sx={ { fontFamily: 'monospace' } }
					>
						{ params.value || 'any' }
					</Typography>
				),
			},
			{
				field: 'allowed_methods',
				headerName: __( 'HTTP Methods', 'rest-api-firewall' ),
				width: 210,
				sortable: false,
				renderCell: ( params ) => {
					const methods = params.value || [];
					if ( methods.length === 0 ) {
						return <Typography variant="body2">-</Typography>;
					}
					return (
						<Stack direction="row" gap={ 0.5 } flexWrap="wrap">
							{ methods.map( ( m ) => (
								<Chip
									key={ m }
									label={ m.toUpperCase() }
									size="small"
									variant="outlined"
									sx={ { fontSize: 10, height: 18 } }
								/>
							) ) }
						</Stack>
					);
				},
			},
			{
				field: 'rate_limit_max_requests',
				headerName: __( 'Rate Limit', 'rest-api-firewall' ),
				width: 120,
				renderCell: ( params ) => (
					<Typography
						variant="body2"
						sx={ { fontFamily: 'monospace' } }
					>
						{ params.value ?? '-' }
						{ params.value
							? ` / ${ params.row.rate_limit_window_seconds }s`
							: '' }
					</Typography>
				),
			},
			{
				field: 'date_created',
				headerName: __( 'Date Created', 'rest-api-firewall' ),
				width: 150,
				renderCell: ( params ) => params.value || '-',
			},
		],
		[ hasValidLicense, handleDeleteOne, __ ]
	);

	const fetchEntries = useCallback( async () => {
		if ( ! selectedApplicationId ) {
			setRows( [] );
			setLoading( false );
			return;
		}

		setLoading( true );
		setFetchError( '' );

		try {
			const response = await fetch( adminData.ajaxurl, {
				method: 'POST',
				headers: {
					'Content-Type':
						'application/x-www-form-urlencoded; charset=UTF-8',
				},
				body: new URLSearchParams( {
					action: 'get_user_entries',
					nonce,
					application_id: selectedApplicationId,
				} ),
			} );

			const result = await response.json();

			if ( result?.success && result?.data ) {
				setRows( result.data.entries || [] );
			}
		} catch ( error ) {
			setFetchError( 'Error fetching users: ' + JSON.stringify( error ) );
		} finally {
			setLoading( false );
		}
	}, [ adminData, nonce, selectedApplicationId ] );

	useEffect( () => {
		fetchEntries();
	}, [ fetchEntries ] );

	const handleDeleteSelected = () => {
		const selectedIds = [ ...rowSelectionModel.ids ];
		const count = selectedIds.length;
		if ( count === 0 ) {
			return;
		}

		const selectedSet = new Set( selectedIds );

		remove(
			{
				action: 'delete_user_entries',
				ids: JSON.stringify( selectedIds ),
			},
			{
				confirmTitle: __( 'Delete Users', 'rest-api-firewall' ),
				confirmMessage: `${ count } ${ __(
					'users will be permanently deleted. This action cannot be undone.',
					'rest-api-firewall'
				) }`,
				confirmLabel: __( 'Delete', 'rest-api-firewall' ),
				onSuccess: () => {
					setRows( ( prev ) =>
						prev.filter( ( row ) => ! selectedSet.has( row.id ) )
					);
					setRowSelectionModel( { type: 'include', ids: new Set() } );
				},
			}
		);
	};

	if ( editingUser ) {
		return (
			<UserEditor
				user={ editingUser }
				onBack={ () => {
					setEditingUser( null );
					fetchEntries();
				} }
			/>
		);
	}

	return (
		<Stack spacing={ 2 } flexGrow={ 1 } p={ { xs: 2, sm: 4 } }>
			{ selectedApplicationId && (
				<>
					<Stack spacing={ 2 }>
						<Box>
							<Typography variant="subtitle1" fontWeight={ 600 }>
								{ __( 'App Rate Limit', 'rest-api-firewall' ) }
							</Typography>
							<Typography variant="body2" color="text.secondary">
								{ __( 'Default rate limit for all users of this application.', 'rest-api-firewall' ) }
							</Typography>
						</Box>
						<Stack direction={ { xs: 'column', sm: 'row' } } spacing={ 2 } sx={ { maxWidth: 700 } }>
							<TextField
								size="small"
								label={ __( 'Max Requests', 'rest-api-firewall' ) }
								type="number"
								value={ rlMax }
								onChange={ ( e ) => setRlMax( e.target.value ) }
								sx={ { flex: 1 } }
							/>
							<TextField
								size="small"
								label={ __( 'Window (s)', 'rest-api-firewall' ) }
								type="number"
								value={ rlWindow }
								onChange={ ( e ) => setRlWindow( e.target.value ) }
								sx={ { flex: 1 } }
							/>
							<TextField
								size="small"
								label={ __( 'Release (s)', 'rest-api-firewall' ) }
								type="number"
								value={ rlRelease }
								onChange={ ( e ) => setRlRelease( e.target.value ) }
								sx={ { flex: 1 } }
							/>
						</Stack>
						<Stack direction={ { xs: 'column', sm: 'row' } } spacing={ 2 } sx={ { maxWidth: 700 } }>
							<TextField
								size="small"
								label={ __( 'Blacklist After (violations)', 'rest-api-firewall' ) }
								type="number"
								value={ rlBlacklistAfter }
								onChange={ ( e ) => setRlBlacklistAfter( e.target.value ) }
								sx={ { flex: 1 } }
							/>
							<TextField
								size="small"
								label={ __( 'Blacklist Window (s)', 'rest-api-firewall' ) }
								type="number"
								value={ rlBlacklistWindow }
								onChange={ ( e ) => setRlBlacklistWindow( e.target.value ) }
								sx={ { flex: 1 } }
							/>
							<Box sx={ { flex: 1, display: 'flex', alignItems: 'flex-end' } }>
								<Button
									variant="outlined"
									size="small"
									onClick={ saveAppRateLimit }
									disabled={ rateLimitSaving }
								>
									{ __( 'Save Rate Limit', 'rest-api-firewall' ) }
								</Button>
							</Box>
						</Stack>
					</Stack>
					<Divider />
				</>
			) }
			<Toolbar disableGutters sx={ { gap: 2, mb: 2, flexWrap: 'wrap' } }>
				<Button
					variant="contained"
					size="small"
					disableElevation
					onClick={ () =>
						setEditingUser( {
							id: null,
							application_id: selectedApplicationId,
							status: 'inactive',
							auth_method: 'any',
							allowed_methods: [ 'get' ],
							rate_limit_max_requests: 100,
							rate_limit_window_seconds: 60,
						} )
					}
				>
					{ __( 'New User', 'rest-api-firewall' ) }
				</Button>

				<Box sx={ { flexGrow: 1 } } />

				{ rowSelectionModel.ids.size > 0 && (
					<Button
						variant="outlined"
						color="error"
						size="small"
						onClick={ handleDeleteSelected }
						startIcon={ <DeleteOutlineIcon /> }
					>
						{ __( 'Delete', 'rest-api-firewall' ) } (
						{ rowSelectionModel.ids.size })
					</Button>
				) }
			</Toolbar>

			{ fetchError && (
				<Typography variant="body2" color="error">
					{ fetchError }
				</Typography>
			) }

			<DataGrid
				showToolbar={ true }
				rows={ rows }
				columns={ columns }
				loading={ loading }
				pageSizeOptions={ [ 10, 25, 50, 100 ] }
				paginationModel={ paginationModel }
				onPaginationModelChange={ setPaginationModel }
				sortModel={ sortModel }
				onSortModelChange={ setSortModel }
				checkboxSelection={ true }
				disableRowSelectionOnClick={ true }
				rowSelectionModel={ rowSelectionModel }
				onRowSelectionModelChange={ setRowSelectionModel }
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
