import { useState, useEffect, useCallback, useMemo } from '@wordpress/element';
import { useAdminData } from '../../contexts/AdminDataContext';
import { useLicense } from '../../contexts/LicenseContext';

import { DataGrid } from '@mui/x-data-grid';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Link from '@mui/material/Link';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';

import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

import MailEditor from './MailEditor';
import useProActions from '../../hooks/useProActions';
import formatDate from '../../utils/formatDate';

export default function Mails() {
	const { adminData } = useAdminData();
	const { hasValidLicense, proNonce } = useLicense();
	const nonce = proNonce || adminData.nonce;
	const { __ } = wp.i18n || {};

	const { remove } = useProActions();

	const [ rows, setRows ] = useState( [] );
	const [ loading, setLoading ] = useState( true );
	const [ fetchError, setFetchError ] = useState( '' );
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
	const [ editing, setEditing ] = useState( null );

	const fetchEntries = useCallback( async () => {
		setLoading( true );
		setFetchError( '' );
		try {
			const res = await fetch( adminData.ajaxurl, {
				method: 'POST',
				body: new URLSearchParams( {
					action: 'get_mail_entries',
					nonce,
				} ),
			} );
			const json = await res.json();
			if ( json.success ) {
				setRows( json.data.entries || [] );
			} else {
				setFetchError(
					json.data?.message ||
						__(
							'Failed to load mail templates',
							'rest-api-firewall'
						)
				);
			}
		} catch {
			setFetchError( __( 'Network error', 'rest-api-firewall' ) );
		} finally {
			setLoading( false );
		}
	}, [ adminData, nonce, __ ] );

	useEffect( () => {
		fetchEntries();
	}, [ fetchEntries ] );

	const handleDeleteOne = useCallback(
		( id, title ) => {
			remove(
				{ action: 'delete_mail_entry', id },
				{
					confirmTitle: __(
						'Delete Mail Template',
						'rest-api-firewall'
					),
					confirmMessage: title
						? `${ __(
								'Permanently delete',
								'rest-api-firewall'
						  ) } "${ title }"? ${ __(
								'This action cannot be undone.',
								'rest-api-firewall'
						  ) }`
						: __(
								'Permanently delete this mail template? This action cannot be undone.',
								'rest-api-firewall'
						  ),
					confirmLabel: __( 'Delete', 'rest-api-firewall' ),
					onSuccess: () =>
						setRows( ( prev ) =>
							prev.filter( ( r ) => r.id !== id )
						),
				}
			);
		},
		[ remove, __ ]
	);

	const handleDeleteSelected = useCallback( () => {
		const ids = Array.from( rowSelectionModel.ids );
		if ( ! ids.length ) {
			return;
		}
		remove(
			{ action: 'delete_mail_entries', ids: JSON.stringify( ids ) },
			{
				confirmTitle: __(
					'Delete Mail Templates',
					'rest-api-firewall'
				),
				confirmMessage: `${ __(
					'Permanently delete',
					'rest-api-firewall'
				) } ${ ids.length } ${ __(
					'mail template(s)? This action cannot be undone.',
					'rest-api-firewall'
				) }`,
				confirmLabel: __( 'Delete', 'rest-api-firewall' ),
				onSuccess: () => {
					setRows( ( prev ) =>
						prev.filter( ( r ) => ! ids.includes( r.id ) )
					);
					setRowSelectionModel( {
						type: 'include',
						ids: new Set( [] ),
					} );
				},
			}
		);
	}, [ remove, rowSelectionModel, __ ] );

	const columns = useMemo(
		() => [
			{
				field: '_actions',
				headerName: __( 'Actions', 'rest-api-firewall' ),
				width: 80,
				sortable: false,
				filterable: false,
				renderCell: ( params ) => (
					<IconButton
						size="small"
						color="default"
						onClick={ () =>
							handleDeleteOne( params.row.id, params.row.title )
						}
					>
						<DeleteOutlineIcon fontSize="small" />
					</IconButton>
				),
			},
			{
				field: 'enabled',
				headerName: __( 'Active', 'rest-api-firewall' ),
				width: 100,
				renderCell: ( params ) =>
					params.value ? (
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
				field: 'title',
				headerName: __( 'Title', 'rest-api-firewall' ),
				flex: 1,
				minWidth: 140,
				renderCell: ( params ) => (
					<a
					href="#"
					style={ {
						display: 'flex',
						alignItems: 'center',
						gap: '4px',
						fontFamily: 'monospace',
						color: 'primary.main',
					} }
					onClick={ () => setEditing( params.row ) }
					>
					{ params.value }
						<OpenInNewIcon
							sx={ { fontSize: 13, color: 'primary.main' } }
						/>
					</a>
				),
			},
			{
				field: 'recipient',
				headerName: __( 'TO', 'rest-api-firewall' ),
				width: 200,
				renderCell: ( params ) => (
					<Typography
						variant="body2"
						noWrap
						sx={ { fontFamily: 'monospace', fontSize: '0.8rem' } }
					>
						{ params.value }
					</Typography>
				),
			},
			{
				field: 'cc',
				headerName: __( 'CC', 'rest-api-firewall' ),
				width: 200,
				renderCell: ( params ) => (
					<Typography
						variant="body2"
						noWrap
						sx={ { fontFamily: 'monospace', fontSize: '0.8rem' } }
					>
						{ params.value }
					</Typography>
				),
			},
			{
				field: 'cci',
				headerName: __( 'CCI', 'rest-api-firewall' ),
				width: 200,
				renderCell: ( params ) => (
					<Typography
						variant="body2"
						noWrap
						sx={ { fontFamily: 'monospace', fontSize: '0.8rem' } }
					>
						{ params.value }
					</Typography>
				),
			},
			{
				field: 'subject',
				headerName: __( 'Subject', 'rest-api-firewall' ),
				flex: 1,
				minWidth: 160,
				renderCell: ( params ) => params.value || '-',
			},
			{
				field: 'date_created',
				headerName: __( 'Date Created', 'rest-api-firewall' ),
				width: 150,
				renderCell: ( params ) => params.value || '-',
			},
			{
				field: 'date_modified',
				headerName: __( 'Date Modified', 'rest-api-firewall' ),
				width: 150,
				renderCell: ( params ) => params.value || '-',
			},
		],
		[ __, handleDeleteOne ]
	);

	if ( editing ) {
		return (
			<MailEditor
				mail={ editing }
				onBack={ () => {
					setEditing( null );
					fetchEntries();
				} }
			/>
		);
	}

	const selectedCount = rowSelectionModel.ids.size;

	return (
		<Stack spacing={ 0 } flexGrow={ 1 }>
			<Toolbar
				disableGutters
				sx={ {
					gap: 2,
					justifyContent: 'space-between',
					alignItems: 'center',
					flexWrap: 'wrap',
					py: { xs: 2, sm: 1 },
				} }
			>
				<Typography variant="h6" fontWeight={ 600 }>
					{ __( 'Mail Templates', 'rest-api-firewall' ) }
				</Typography>

				<Box sx={ { flex: 1 } } />

				{ selectedCount > 0 && (
					<>
						<Chip
							label={ `${ selectedCount } ${ __(
								'selected',
								'rest-api-firewall'
							) }` }
							size="small"
						/>
						<Button
							size="small"
							color="error"
							variant="outlined"
							disableElevation
							onClick={ handleDeleteSelected }
						>
							{ __( 'Delete selected', 'rest-api-firewall' ) }
						</Button>
					</>
				) }

				<Button
					size="small"
					variant="contained"
					disableElevation
					onClick={ () =>
						setEditing( {
							id: null,
							title: '',
							recipient: '',
							cc: '',
							cci: '',
							subject: '',
							content: '',
							enabled: true,
							date_created: null,
							date_modified: null,
						} )
					}
					disabled={ ! hasValidLicense }
				>
					{ __( 'New Template', 'rest-api-firewall' ) }
				</Button>
			</Toolbar>

			{ fetchError && (
				<Alert severity="error" sx={ { mb: 1 } }>
					{ fetchError }
				</Alert>
			) }

			<Box sx={ { flex: 1, minHeight: 0 } }>
				<DataGrid
					rows={ rows }
					columns={ columns }
					loading={ loading }
					pageSizeOptions={ [ 25, 50, 100 ] }
					paginationModel={ paginationModel }
					onPaginationModelChange={ setPaginationModel }
					sortModel={ sortModel }
					onSortModelChange={ setSortModel }
					checkboxSelection
					rowSelectionModel={ rowSelectionModel }
					onRowSelectionModelChange={ setRowSelectionModel }
					onRowDoubleClick={ ( params ) =>
						setEditing( params.row )
					}
					disableColumnFilter
					disableColumnSelector
					disableDensitySelector
					sx={ {
						'& .MuiDataGrid-cell': {
							display: 'flex',
							alignItems: 'center',
						},
					} }
				/>
			</Box>
		</Stack>
	);
}
