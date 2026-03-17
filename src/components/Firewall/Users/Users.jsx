import { useState, useEffect, useCallback, useMemo } from '@wordpress/element';
import { useAdminData } from '../../../contexts/AdminDataContext';
import { useLicense } from '../../../contexts/LicenseContext';
import { useApplication } from '../../../contexts/ApplicationContext';
import { useNavigation } from '../../../contexts/NavigationContext';

import { DataGrid } from '@mui/x-data-grid';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import Chip from '@mui/material/Chip';
import Switch from '@mui/material/Switch';
import Divider from '@mui/material/Divider';
import FormControlLabel from '@mui/material/FormControlLabel';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';

import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

import UserEditor from './UserEditor';
import useProActions from '../../../hooks/useProActions';
import { DefaultRateLimit } from './RateLimit';
import { AUTH_METHODS } from './AuthManager';
import HttpMethodsSelector from './HttpMethodsSelector';

export default function Users() {
	const { adminData } = useAdminData();
	const { hasValidLicense, proNonce } = useLicense();
	const nonce = proNonce || adminData.nonce;
	const { __ } = wp.i18n || {};

	const { selectedApplicationId } = useApplication();
	const { subKey, navigate } = useNavigation();
	const { save, remove } = useProActions();

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
	const editingUser = subKey === 'new'
		? {
			id: null,
			application_id: selectedApplicationId,
			status: 'inactive',
			auth_method: 'any',
			allowed_methods: appDefaultMethods.length ? appDefaultMethods : [ 'get' ],
			rate_limit_max_requests: 100,
			rate_limit_window_seconds: 60,
		}
		: subKey ? { id: subKey } : null;

	const [ appDefaultMethods, setAppDefaultMethods ] = useState( [] );
	const [ appAllowedAuthMethods, setAppAllowedAuthMethods ] = useState( [] );
	const [ appEntry, setAppEntry ] = useState( null );

	const loadAppSettings = useCallback( async () => {
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
				const s = result.data.entry.settings || {};
				setAppDefaultMethods( s.default_http_methods || [] );
				setAppAllowedAuthMethods( s.allowed_auth_methods || [] );
				setAppEntry( result.data.entry );
			}
		} catch {}
	}, [ adminData, nonce, selectedApplicationId ] );

	const saveDefaultMethods = useCallback( () => {
		if ( ! selectedApplicationId || ! appEntry ) return;
		const existingSettings = appEntry.settings || {};
		save(
			{
				action: 'update_application_entry',
				id: selectedApplicationId,
				title: appEntry.title || '',
				settings: JSON.stringify( {
					...existingSettings,
					default_http_methods: appDefaultMethods,
				} ),
			},
			{
				confirmTitle: __( 'Save Default HTTP Methods', 'rest-api-firewall' ),
				confirmMessage: __( 'This will update the default HTTP methods pre-selected when creating new users. Existing users will not be affected.', 'rest-api-firewall' ),
				successTitle: __( 'Default HTTP Methods Saved', 'rest-api-firewall' ),
				successMessage: __( 'Default HTTP methods updated successfully.', 'rest-api-firewall' ),
				onSuccess: loadAppSettings,
			}
		);
	}, [ selectedApplicationId, appEntry, appDefaultMethods, save, loadAppSettings, __ ] );

	const saveAppSettings = useCallback( () => {
		if ( ! selectedApplicationId || ! appEntry ) return;
		const existingSettings = appEntry.settings || {};
		save(
			{
				action: 'update_application_entry',
				id: selectedApplicationId,
				title: appEntry.title || '',
				settings: JSON.stringify( {
					...existingSettings,
					allowed_auth_methods: appAllowedAuthMethods,
				} ),
			},
			{
				confirmTitle: __( 'Enforce Authentication Methods', 'rest-api-firewall' ),
				confirmMessage: __( 'This setting will immediately cascade to all existing users of this application and restrict their available authentication methods.', 'rest-api-firewall' ),
				confirmLabel: __( 'Save & Enforce', 'rest-api-firewall' ),
				successTitle: __( 'Authentication Methods Enforced', 'rest-api-firewall' ),
				successMessage: __( 'Allowed authentication methods updated and applied to all users.', 'rest-api-firewall' ),
				onSuccess: loadAppSettings,
			}
		);
	}, [ selectedApplicationId, appEntry, appAllowedAuthMethods, save, loadAppSettings, __ ] );

	useEffect( () => {
		loadAppSettings();
	}, [ loadAppSettings ] );

	const handleToggleEnabled = useCallback(
		async ( row ) => {
			const newEnabled = ! row.enabled;
			setRows( ( prev ) =>
				prev.map( ( r ) => ( r.id === row.id ? { ...r, enabled: newEnabled } : r ) )
			);
			try {
				await fetch( adminData.ajaxurl, {
					method: 'POST',
					headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
					body: new URLSearchParams( {
						action: 'update_user_entry',
						nonce,
						id: row.id,
						application_id: selectedApplicationId,
						enabled: newEnabled ? '1' : '0',
						auth_method: row.auth_method || 'any',
						auth_config: JSON.stringify( row.auth_config || {} ),
						allowed_methods: JSON.stringify( row.allowed_methods || [] ),
						rate_limit_max_requests: String( row.rate_limit_max_requests ?? 100 ),
						rate_limit_window_seconds: String( row.rate_limit_window_seconds ?? 60 ),
						rate_limit_release: String( row.rate_limit_release_seconds ?? 300 ),
						rate_limit_blacklist_after: String( row.rate_limit_blacklist_after ?? 0 ),
						rate_limit_blacklist_window: String( row.rate_limit_blacklist_window ?? 0 ),
					} ),
				} );
			} catch {
				setRows( ( prev ) =>
					prev.map( ( r ) => ( r.id === row.id ? { ...r, enabled: row.enabled } : r ) )
				);
			}
		},
		[ adminData, nonce, selectedApplicationId ]
	);

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
				width: 90,
				sortable: false,
				renderCell: ( params ) => (
					<Switch
						size="small"
						checked={ !! params.value }
						onChange={ () => handleToggleEnabled( params.row ) }
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
						onClick={ () => navigate( 'user-rate-limiting', params.row.id ) }
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
		[ hasValidLicense, handleDeleteOne, handleToggleEnabled, __ ]
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
				appAllowedAuthMethods={ appAllowedAuthMethods }
				onBack={ () => {
					navigate( 'user-rate-limiting', null, true );
					fetchEntries();
				} }
			/>
		);
	}

	return (
		<Stack spacing={ 2 } flexGrow={ 1 } p={ { xs: 2, sm: 4 } }>
			<Toolbar disableGutters sx={ { gap: 2, mb: 2, flexWrap: 'wrap' } }>
				<Button
					variant="contained"
					size="small"
					disableElevation
					onClick={ () => navigate( 'user-rate-limiting', 'new' ) }
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
