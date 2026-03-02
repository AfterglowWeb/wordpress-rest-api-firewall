import { useCallback } from '@wordpress/element';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Collapse from '@mui/material/Collapse';
import FormControl from '@mui/material/FormControl';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useState } from '@wordpress/element';
import ListItemText from '@mui/material/ListItemText';

const PROP_TYPES = [ 'string', 'number', 'boolean', 'object', 'array', 'null' ];

const TYPE_COLORS = {
	string: 'default',
	number: 'primary',
	boolean: 'info',
	object: 'secondary',
	array: 'warning',
	null: 'default',
};

function PropertyRow( {
	propKey,
	propDef,
	onUpdate,
	onRemove,
	availableBindings,
	readOnly,
	depth,
} ) {
	const { __ } = wp.i18n || {};
	const [ expanded, setExpanded ] = useState( false );
	const [ localKey, setLocalKey ] = useState( propKey );

	const type = propDef.type || 'string';
	const bind = propDef.bind || '';
	const staticVal = propDef.staticValue || '';
	const properties = propDef.properties || {};

	const isObject = type === 'object';
	const isArray = type === 'array';
	const hasChildren = isObject && Object.keys( properties ).length > 0;

	const update = ( patch ) => onUpdate( propKey, { ...propDef, ...patch } );

	const handleKeyBlur = () => {
		if ( localKey !== propKey ) {
			onUpdate( propKey, propDef, localKey );
		}
	};

	const handleAddSubProp = () => {
		const subKey = `property_${ Object.keys( properties ).length + 1 }`;
		update( {
			properties: {
				...properties,
				[ subKey ]: { type: 'string', bind: '' },
			},
		} );
		setExpanded( true );
	};

	const handleSubUpdate = ( subKey, subDef, newSubKey ) => {
		if ( newSubKey && newSubKey !== subKey ) {
			const rebuilt = {};
			for ( const [ k, v ] of Object.entries( properties ) ) {
				rebuilt[ k === subKey ? newSubKey : k ] =
					k === subKey ? subDef : v;
			}
			update( { properties: rebuilt } );
		} else {
			update( { properties: { ...properties, [ subKey ]: subDef } } );
		}
	};

	const handleSubRemove = ( subKey ) => {
		const updated = { ...properties };
		delete updated[ subKey ];
		update( { properties: updated } );
	};

	return (
		<Stack
			sx={ {
				pl: depth > 0 ? 2 : 0,
				borderLeft: depth > 0 ? '2px solid' : 'none',
				borderColor: 'divider',
			} }
		>
			<Stack
				direction="row"
				gap={ 1 }
				py={1 }
				alignItems="center"
			>
				{ isObject && (
					<IconButton
						size="small"
						onClick={ () => setExpanded( ( v ) => ! v ) }
						sx={ {
							p: 0.25,
							transform: expanded
								? 'rotate(0deg)'
								: 'rotate(-90deg)',
							transition: 'transform 0.2s',
							flexShrink: 0,
						} }
					>
						<ExpandMoreIcon
							fontSize="small"
							sx={ { fontSize: 18 } }
						/>
					</IconButton>
				) }

				<TextField
					size="small"
					value={ localKey }
					onChange={ ( e ) => setLocalKey( e.target.value ) }
					onBlur={ handleKeyBlur }
					disabled={ readOnly }
					placeholder={ __( 'property_name', 'rest-api-firewall' ) }
					sx={ { 
					flex: 1, 
					maxWidth: 300,
					'.MuiInputBase-input': { 
						padding: '10.5px 14px!important',
						minHeight: 'unset!important',
						height: '25px!important',
						fontFamily: 'monospace', 
						fontSize: '0.82rem' 
					}
					} }
				/>

				<FormControl
					size="small"
					sx={ { width: 100 } }
					disabled={ readOnly }
				>
					<Select
						value={ type }
						onChange={ ( e ) =>
							update( {
								type: e.target.value,
								bind: '',
								properties: {},
								itemType: 'string',
							} )
						}
						renderValue={ ( v ) => (
							<Chip
								label={ v }
								size="small"
								color={ TYPE_COLORS[ v ] || 'default' }
								sx={ { height: 20, fontSize: '0.7rem' } }
							/>
						) }
					>
						{ PROP_TYPES.map( ( t ) => (
							<MenuItem key={ t } value={ t }>
								<Chip
									label={ t }
									size="small"
									color={ TYPE_COLORS[ t ] || 'default' }
									sx={ { height: 20, fontSize: '0.7rem' } }
								/>
							</MenuItem>
						) ) }
					</Select>
				</FormControl>

				{ ! isObject &&
					( availableBindings && availableBindings.length > 0 ? (
						<FormControl
							size="small"
							sx={ { 
								flex: 1, 
								maxWidth: 300,
							} }
							disabled={ readOnly }
						>
							<InputLabel sx={ { fontSize: '0.8rem' } }>
								{ __( 'Source', 'rest-api-firewall' ) }
							</InputLabel>
							<Select
								value={ bind }
								label={ __( 'Source', 'rest-api-firewall' ) }
								onChange={ ( e ) =>
									update( {
										bind: e.target.value,
										staticValue: '',
									} )
								}
								renderValue={ ( val ) => {
									const found = availableBindings.find( ( o ) => o.key === val );
									return found?.key ?? val;
								} }
							>
								<MenuItem value="">
								  	<ListItemText
										primary={ __(
											'static value',
											'rest-api-firewall'
										) }
									/>
								</MenuItem>
								{ availableBindings.map( ( b ) => (
									<MenuItem key={ b.key } value={ b.key }>
										<ListItemText
											primary={ b.key }
											secondary={  b.label && b.label !== b.key ? b.label : null }
										/>
									</MenuItem>
								) ) }
							</Select>
						</FormControl>
					) : null ) }

				{ ! isObject && ! bind && (
					<TextField
						size="small"
						value={ staticVal }
						onChange={ ( e ) =>
							update( { staticValue: e.target.value } )
						}
						disabled={ readOnly }
						placeholder={ __(
							'static value',
							'rest-api-firewall'
						) }
						sx={ { 
						flex: 1, 
						maxWidth: 300,
						'.MuiInputBase-input': { 
							padding: '10.5px 14px!important',
							minHeight: 'unset!important',
							height: '25px!important',
							fontFamily: 'monospace', 
							fontSize: '0.82rem' 
						}
						} }
					/>
				) }

				{ isArray && (
					<FormControl
						size="small"
						sx={ { width: 100, height: '25px!important' } }
						disabled={ readOnly }
					>
						<InputLabel 
						id={`array-items-label-${propKey}`}
						sx={ { fontSize: '0.8rem' } }>
							{ __( 'Items', 'rest-api-firewall' ) }
						</InputLabel>
						<Select
							labelId={`array-items-label-${propKey}`}
							value={ propDef.itemType || 'string' }
							onChange={ ( e ) =>
								update( { itemType: e.target.value } )
							}
						>
							{ [ 'string', 'number', 'boolean', 'object' ].map(
								( t ) => (
									<MenuItem key={ t } value={ t }>
										{ t }
									</MenuItem>
								)
							) }
						</Select>
					</FormControl>
				) }

				{ ! readOnly && (
					<IconButton
						size="small"
						color="error"
						onClick={ () => onRemove( propKey ) }
						sx={ { flexShrink: 0 } }
					>
						<DeleteOutlineIcon fontSize="small" />
					</IconButton>
				) }
			</Stack>

			{ isObject && (
				<Collapse in={ expanded }>
					<Stack spacing={ 0 } sx={ { mt: 0.25 } }>
						{ Object.entries( properties ).map(
							( [ subKey, subDef ] ) => (
								<PropertyRow
									key={ subKey }
									propKey={ subKey }
									propDef={
										typeof subDef === 'object' &&
										subDef !== null
											? subDef
											: { type: 'string' }
									}
									onUpdate={ handleSubUpdate }
									onRemove={ handleSubRemove }
									availableBindings={ availableBindings }
									readOnly={ readOnly }
									depth={ depth + 1 }
								/>
							)
						) }
						{ ! readOnly && (
							<Button
								size="small"
								startIcon={ <AddIcon /> }
								onClick={ handleAddSubProp }
								sx={ {
									alignSelf: 'flex-start',
									ml: 4,
									mt: 0.5,
								} }
							>
								{ __(
									'Add sub-property',
									'rest-api-firewall'
								) }
							</Button>
						) }
					</Stack>
				</Collapse>
			) }
		</Stack>
	);
}

export default function JsonSchemaBuilder( {
	value = {},
	onChange,
	availableBindings = [],
	readOnly = false,
} ) {
	const { __ } = wp.i18n || {};

	const handleUpdate = useCallback(
		( key, def, newKey ) => {
			if ( newKey && newKey !== key ) {
				const next = {};
				for ( const [ k, v ] of Object.entries( value ) ) {
					next[ k === key ? newKey : k ] =
						k === key ? def : v;
				}
				onChange( next );
			} else {
				onChange( { ...value, [ key ]: def } );
			}
		},
		[ value, onChange ]
	);

	const handleRemove = useCallback(
		( key ) => {
			const next = { ...value };
			delete next[ key ];
			onChange( next );
		},
		[ value, onChange ]
	);

	const handleAdd = useCallback( () => {
		const key = `property_${ Object.keys( value ).length + 1 }`;
		onChange( { ...value, [ key ]: { type: 'string', bind: '' } } );
	}, [ value, onChange ] );

	return (
		<Stack spacing={ 0 }>
			<Stack
				direction="row"
				spacing={ 1 }
				sx={ { px: 0.5, pb: 0.5 } }
				alignItems="center"
			>
				<Box sx={ { width: 28 } } />
				<Typography
					variant="caption"
					color="text.secondary"
					sx={ { width: 160, fontWeight: 600 } }
				>
					{ __( 'Name', 'rest-api-firewall' ) }
				</Typography>
				<Typography
					variant="caption"
					color="text.secondary"
					sx={ { width: 110 } }
				>
					{ __( 'Type', 'rest-api-firewall' ) }
				</Typography>
				<Typography
					variant="caption"
					color="text.secondary"
					sx={ { flex: 1 } }
				>
					{ availableBindings.length > 0
						? __( 'Source / Value', 'rest-api-firewall' )
						: __( 'Value', 'rest-api-firewall' ) }
				</Typography>
			</Stack>

			{ Object.entries( value ).map( ( [ key, def ] ) => (
				<PropertyRow
					key={ key }
					propKey={ key }
					propDef={
						typeof def === 'object' && def !== null
							? def
							: { type: 'string' }
					}
					onUpdate={ handleUpdate }
					onRemove={ handleRemove }
					availableBindings={ availableBindings }
					readOnly={ readOnly }
					depth={ 0 }
				/>
			) ) }

			{ ! readOnly && (
				<Button
					size="small"
					startIcon={ <AddIcon /> }
					onClick={ handleAdd }
					sx={ { alignSelf: 'flex-start' } }
				>
					{ __( 'Add Property', 'rest-api-firewall' ) }
				</Button>
			) }
		</Stack>
	);
}
