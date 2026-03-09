import { useState, useEffect, useCallback } from '@wordpress/element';
import { useAdminData } from '../../contexts/AdminDataContext';
import { useLicense } from '../../contexts/LicenseContext';
import { useApplication } from '../../contexts/ApplicationContext';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import { DataGrid } from '@mui/x-data-grid';

import useSettingsForm from '../../hooks/useSettingsForm';
import useSaveOptions from '../../hooks/useSaveOptions';
import GlobalProperties from './GlobalProperties';

import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import BuildOutlinedIcon from '@mui/icons-material/BuildOutlined';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

import useProActions from '../../hooks/useProActions';
import formatDate from '../../utils/formatDate';
import ModelEditor from './ModelEditor';

export default function Models() {
	const { adminData } = useAdminData();
	const { proNonce } = useLicense();
	const { selectedApplicationId } = useApplication();
	const nonce = proNonce || adminData.nonce;
	const { __ } = wp.i18n || {};

	const { remove } = useProActions();

	const { form: outputForm, setField: setOutputField, pickGroup: pickOutputGroup } = useSettingsForm( { adminData } );
	const { save: saveOutput, saving: savingOutput } = useSaveOptions();

	const [ models, setModels ] = useState( [] );
	const [ loading, setLoading ] = useState( false );
	const [ rowSelectionModel, setRowSelectionModel ] = useState( {
		type: 'include',
		ids: new Set(),
	} );
	const [ editing, setEditing ] = useState( null ); // null = list, object = editor

	const fetchModels = useCallback( async () => {
		if ( ! selectedApplicationId ) {
			return;
		}
		setLoading( true );
		try {
			const res = await fetch( adminData.ajaxurl, {
				method: 'POST',
				body: new URLSearchParams( {
					action: 'get_model_entries',
					nonce,
					application_id: selectedApplicationId,
				} ),
			} );
			const json = await res.json();
			if ( json.success ) {
				setModels( json.data.entries ?? [] );
			}
		} finally {
			setLoading( false );
		}
	}, [ adminData, nonce, selectedApplicationId ] );

	useEffect( () => {
		fetchModels();
	}, [ fetchModels ] );

	const handleToggle = useCallback(
		async ( id, enabled ) => {
			setModels( ( prev ) =>
				prev.map( ( m ) => ( m.id === id ? { ...m, enabled } : m ) )
			);
			await fetch( adminData.ajaxurl, {
				method: 'POST',
				body: new URLSearchParams( {
					action: 'toggle_model_entry',
					nonce,
					id,
					enabled: enabled ? '1' : '0',
				} ),
			} );
			fetchModels();
		},
		[ adminData, nonce, fetchModels ]
	);

	const handleDeleteOne = useCallback(
		( id, label ) => {
			remove(
				{ action: 'delete_model_entry', nonce, id },
				{
					confirmTitle: __( 'Delete Model', 'rest-api-firewall' ),
					confirmMessage: `${ __(
						'Permanently delete',
						'rest-api-firewall'
					) } "${ label }"? ${ __(
						'This action cannot be undone.',
						'rest-api-firewall'
					) }`,
					confirmLabel: __( 'Delete', 'rest-api-firewall' ),
					onSuccess: fetchModels,
				}
			);
		},
		[ remove, nonce, fetchModels, __ ]
	);

	const handleBulkDelete = useCallback( () => {
		const selectedIds = [ ...rowSelectionModel.ids ];
		if ( ! selectedIds.length ) {
			return;
		}
		remove(
			{
				action: 'delete_model_entries',
				nonce,
				ids: JSON.stringify( selectedIds ),
			},
			{
				confirmTitle: __( 'Delete Models', 'rest-api-firewall' ),
				confirmMessage: `${ __( 'Delete', 'rest-api-firewall' ) } ${
					selectedIds.length
				} ${ __(
					'models? This cannot be undone.',
					'rest-api-firewall'
				) }`,
				confirmLabel: __( 'Delete', 'rest-api-firewall' ),
				onSuccess: () => {
					setRowSelectionModel( { type: 'include', ids: new Set() } );
					fetchModels();
				},
			}
		);
	}, [ remove, nonce, rowSelectionModel, fetchModels, __ ] );

	if ( editing !== null ) {
		return (
			<ModelEditor
				model={ editing }
				onBack={ () => {
					setEditing( null );
					fetchModels();
				} }
			/>
		);
	}

	const columns = [
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
			minWidth: 150,
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
			field: 'object_type',
			headerName: __( 'Object Type', 'rest-api-firewall' ),
			width: 160,
			renderCell: ( { value } ) =>
				value ? (
					<Chip
						label={ value }
						size="small"
						variant="outlined"
						sx={ { fontFamily: 'monospace', fontSize: '0.72rem' } }
					/>
				) : (
					'—'
				),
		},
		{
			field: 'is_custom',
			headerName: __( 'Type', 'rest-api-firewall' ),
			width: 110,
			renderCell: ( { value } ) => (
				<Chip
					label={
						value
							? __( 'Custom', 'rest-api-firewall' )
							: __( 'WP Schema', 'rest-api-firewall' )
					}
					size="small"
					color={ value ? 'secondary' : 'default' }
					icon={ value ? <BuildOutlinedIcon /> : undefined }
					sx={ { fontSize: '0.7rem' } }
				/>
			),
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
	];

	return (
		<Stack p={4} spacing={ 2 } sx={ { height: '100%', flexGrow: 1 } }>
			<Stack spacing={ 2 } sx={ { maxWidth: 720 } }>
				<Stack direction="row" alignItems="center" justifyContent="space-between">
					<Box>
						<Typography variant="subtitle1" fontWeight={ 600 }>
							{ __( 'Output Settings', 'rest-api-firewall' ) }
						</Typography>
						<Typography variant="body2" color="text.secondary">
							{ __( 'Global output transformations applied to REST API responses.', 'rest-api-firewall' ) }
						</Typography>
					</Box>
					<Button
						size="small"
						variant="outlined"
						disabled={ savingOutput }
						onClick={ () => saveOutput( pickOutputGroup( 'models_properties' ), {
							successTitle: __( 'Properties Saved', 'rest-api-firewall' ),
							successMessage: __( 'Properties settings saved successfully.', 'rest-api-firewall' ),
							confirmMessage: __( 'Save properties settings?', 'rest-api-firewall' ),
						} ) }
					>
						{ __( 'Save Output Settings', 'rest-api-firewall' ) }
					</Button>
				</Stack>
				<GlobalProperties form={ outputForm } setField={ setOutputField } />
			</Stack>

			<Divider />

			<Toolbar
				disableGutters
				sx={ { gap: 2, flexWrap: 'wrap' } }
			>
				
				<Button
					size="small"
					variant="contained"
					disableElevation
					onClick={ () =>
						setEditing( {
							id: null,
							label: '',
							object_type: '',
							is_custom: false,
							enabled: false,
							properties: {},
							application_id: selectedApplicationId,
						} )
					}
					disabled={ ! selectedApplicationId }
				>
					{ __( 'New Model', 'rest-api-firewall' ) }
				</Button>

				{ rowSelectionModel.ids.size > 0 && (
					<Button
						size="small"
						color="error"
						startIcon={ <DeleteOutlineIcon /> }
						onClick={ handleBulkDelete }
					>
						{ __( 'Delete', 'rest-api-firewall' ) } (
						{ rowSelectionModel.ids.size })
					</Button>
				) }

			</Toolbar>

			<DataGrid
				rows={ models }
				columns={ columns }
				loading={ loading }
				checkboxSelection
				disableRowSelectionOnClick
				rowSelectionModel={ rowSelectionModel }
				onRowSelectionModelChange={ setRowSelectionModel }
				onRowDoubleClick={ ( { row } ) => setEditing( row ) }
				getRowHeight={ () => 'auto' }
				showToolbar={ true }
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
