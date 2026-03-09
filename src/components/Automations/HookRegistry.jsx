import { useState, useEffect } from '@wordpress/element';
import { useAdminData } from '../../contexts/AdminDataContext';
import { useLicense } from '../../contexts/LicenseContext';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SaveIcon from '@mui/icons-material/Save';

const HOOK_RE = /[^a-z0-9_\-\/]/g;
const ARG_RE  = /[^a-z0-9_]/g;

function sanitizeHook( value ) {
	return value.toLowerCase().replace( HOOK_RE, '' );
}

function sanitizeArg( value ) {
	return value.toLowerCase().replace( ARG_RE, '' );
}

export default function HookRegistry() {
	const { adminData } = useAdminData();
	const { proNonce } = useLicense();
	const nonce = proNonce || adminData.nonce;
	const { __ } = wp.i18n || {};

	const [ open, setOpen ] = useState( false );
	const [ rows, setRows ] = useState( [] );
	const [ saving, setSaving ] = useState( false );
	const [ dirty, setDirty ] = useState( false );

	const [ argDrafts, setArgDrafts ] = useState( {} );

	useEffect( () => {
		if ( ! open ) {
			return;
		}
		fetch( adminData.ajaxurl, {
			method: 'POST',
			body: new URLSearchParams( { action: 'get_hook_registry', nonce } ),
		} )
			.then( ( r ) => r.json() )
			.then( ( json ) => {
				if ( json.success ) {
					setRows(
						( json.data.registry || [] ).map( ( r ) => ( {
							...r,
							args: r.args || [],
						} ) )
					);
					setDirty( false );
					setArgDrafts( {} );
				}
			} )
			.catch( () => {} );
	}, [ open ] );

	const addRow = () => {
		setRows( ( prev ) => [ ...prev, { label: '', hook: '', args: [] } ] );
		setDirty( true );
	};

	const updateRow = ( index, field, value ) => {
		setRows( ( prev ) =>
			prev.map( ( r, i ) => {
				if ( i !== index ) return r;
				if ( field === 'hook' ) return { ...r, hook: sanitizeHook( value ) };
				return { ...r, [ field ]: value };
			} )
		);
		setDirty( true );
	};

	const removeRow = ( index ) => {
		setRows( ( prev ) => prev.filter( ( _, i ) => i !== index ) );
		setArgDrafts( ( prev ) => {
			const next = {};
			Object.keys( prev ).forEach( ( k ) => {
				const ki = parseInt( k, 10 );
				if ( ki < index ) next[ ki ] = prev[ k ];
				else if ( ki > index ) next[ ki - 1 ] = prev[ k ];
			} );
			return next;
		} );
		setDirty( true );
	};

	const setArgDraft = ( rowIdx, val ) =>
		setArgDrafts( ( prev ) => ( { ...prev, [ rowIdx ]: val } ) );

	const commitArg = ( rowIdx ) => {
		const clean = sanitizeArg( argDrafts[ rowIdx ] || '' );
		if ( clean ) {
			updateRow( rowIdx, 'args', [ ...( rows[ rowIdx ]?.args || [] ), clean ] );
			setArgDraft( rowIdx, '' );
		}
	};

	const removeArg = ( rowIdx, argIdx ) => {
		updateRow(
			rowIdx,
			'args',
			( rows[ rowIdx ]?.args || [] ).filter( ( _, i ) => i !== argIdx )
		);
	};

	const handleSave = async () => {
		setSaving( true );
		try {
			const res = await fetch( adminData.ajaxurl, {
				method: 'POST',
				body: new URLSearchParams( {
					action: 'save_hook_registry',
					nonce,
					registry: JSON.stringify( rows ),
				} ),
			} );
			const json = await res.json();
			if ( json.success ) {
				setRows( json.data.registry );
				setDirty( false );
			}
		} finally {
			setSaving( false );
		}
	};

	const inputSx = {
		'.MuiInputBase-input': {
			padding: '10.5px 14px!important',
			minHeight: 'unset!important',
			height: '25px!important',
		},
	};

	return (
		<Box
			sx={ {
				border: '1px solid',
				borderColor: 'divider',
				borderRadius: 1,
				overflow: 'hidden',
				mb: 2,
			} }
		>
			<Stack
				direction="row"
				alignItems="center"
				gap={ 1.5 }
				sx={ {
					px: 2,
					py: 1.25,
					cursor: 'pointer',
				} }
				onClick={ () => setOpen( ( v ) => ! v ) }
			>
				<Typography variant="subtitle2" fontWeight={ 600 } sx={ { flex: 1 } }>
					{ __( 'Custom Hooks', 'rest-api-firewall' ) }
				</Typography>

				<ExpandMoreIcon
					fontSize="small"
					sx={ {
						color: 'text.secondary',
						transform: open ? 'rotate(180deg)' : 'none',
						transition: 'transform 0.2s',
					} }
				/>
			</Stack>

			<Collapse in={ open }>
				<Stack spacing={ 1.5 } sx={ { p: 2 } }>
					<Typography variant="body2" color="text.secondary">
						{ __(
							'Register custom hooks as automation triggers. Declare each argument the hook passes so it becomes available in conditions and payload mapping.',
							'rest-api-firewall'
						) }
					</Typography>

					{ rows.length > 0 && (
						<Stack spacing={ 1 }>
							{ rows.map( ( row, i ) => (
								<Box
									key={ i }
									sx={ {
										border: '1px solid',
										borderColor: 'divider',
										borderRadius: 1,
										p: 1,
									} }
								>
									{ /* Label + Hook + Delete */ }
									<Stack
										direction="row"
										spacing={ 1 }
										alignItems="center"
										sx={ { mb: 0.75 } }
									>
										<TextField
											size="small"
											placeholder={ __( 'Label', 'rest-api-firewall' ) }
											value={ row.label }
											onChange={ ( e ) =>
												updateRow( i, 'label', e.target.value )
											}
											sx={ { flex: 1, ...inputSx } }
										/>
										<TextField
											size="small"
											placeholder="hook_name"
											value={ row.hook }
											onChange={ ( e ) =>
												updateRow( i, 'hook', e.target.value )
											}
											sx={ {
												flex: 1,
												'.MuiInputBase-input': {
													...inputSx[ '.MuiInputBase-input' ],
													fontFamily: 'monospace',
													fontSize: '0.82rem',
												},
											} }
										/>
										<IconButton
											size="small"
											color="error"
											onClick={ () => removeRow( i ) }
										>
											<DeleteOutlineIcon fontSize="small" />
										</IconButton>
									</Stack>

									{ /* Args row */ }
									<Stack
										direction="row"
										spacing={ 0.5 }
										alignItems="center"
										flexWrap="wrap"
										useFlexGap
									>
										<Typography
											variant="caption"
											color="text.secondary"
											sx={ { fontFamily: 'monospace', mr: 0.5 } }
										>
											args:
										</Typography>

										{ ( row.args || [] ).map( ( arg, ai ) => (
											<Chip
												key={ ai }
												label={ arg }
												size="small"
												onDelete={ () => removeArg( i, ai ) }
												sx={ {
													height: 20,
													fontSize: '0.72rem',
													fontFamily: 'monospace',
												} }
											/>
										) ) }

										<TextField
											size="small"
											placeholder="arg_name"
											value={ argDrafts[ i ] || '' }
											onChange={ ( e ) =>
												setArgDraft( i, sanitizeArg( e.target.value ) )
											}
											onKeyDown={ ( e ) => {
												if ( e.key === 'Enter' ) {
													e.preventDefault();
													commitArg( i );
												}
											} }
											onBlur={ () => commitArg( i ) }
											sx={ {
												width: 110,
												'.MuiInputBase-input': {
													padding: '2px 8px!important',
													minHeight: 'unset!important',
													height: '18px!important',
													fontFamily: 'monospace',
													fontSize: '0.72rem',
												},
											} }
										/>
									</Stack>
								</Box>
							) ) }
						</Stack>
					) }

					<Stack direction="row" spacing={ 1 }>
						<Button
							size="small"
							startIcon={ <AddIcon /> }
							onClick={ addRow }
						>
							{ __( 'Add hook', 'rest-api-firewall' ) }
						</Button>

						{ dirty && (
							<Button
								size="small"
								variant="contained"
								disableElevation
								startIcon={ <SaveIcon /> }
								onClick={ handleSave }
								disabled={ saving }
							>
								{ __( 'Save', 'rest-api-firewall' ) }
							</Button>
						) }
					</Stack>
				</Stack>
			</Collapse>
		</Box>
	);
}
