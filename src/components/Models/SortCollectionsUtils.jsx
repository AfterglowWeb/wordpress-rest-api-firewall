import { useState } from '@wordpress/element';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';

export function mergeOrderPreview( savedOrder, page, perPage, newIds ) {
	const offset = page * perPage;
	const before = savedOrder.slice( 0, offset );
	const after = savedOrder.slice( offset + perPage );
	const otherIds = [ ...before, ...after ];
	const deduped = newIds.filter( ( id ) => ! otherIds.includes( id ) );

	return [ ...before, ...deduped, ...after ];
}

export function PostOrderList( { items, orderedIds, objectKind, loading, onReorder, originalOrder } ) {
	const { __ } = wp.i18n || {};
	const [ dragId, setDragId ] = useState( null );
	const [ dragOverIdx, setDragOverIdx ] = useState( null );

	const handleDragStart = ( e, idx ) => {
		setDragId( items[ idx ].id );
		e.dataTransfer.effectAllowed = 'move';
		e.dataTransfer.setData( 'application/json', JSON.stringify( { id: items[ idx ].id, idx } ) );
	};

	const handleDragOver = ( e, idx ) => {
		e.preventDefault();
		e.dataTransfer.dropEffect = 'move';
		if ( idx !== dragOverIdx ) {
			setDragOverIdx( idx );
		}
	};

	const handleDrop = ( e, idx ) => {
		e.preventDefault();
		const fromIdx = items.findIndex( ( i ) => i.id === dragId );
		if ( dragId === null || fromIdx === idx ) {
			setDragId( null );
			setDragOverIdx( null );
			return;
		}

		const next = [ ...items ];
		const [ moved ] = next.splice( fromIdx, 1 );
		next.splice( idx, 0, moved );
		onReorder( next );
		setDragId( null );
		setDragOverIdx( null );
	};

	const handleDragEnd = () => {
		setDragId( null );
		setDragOverIdx( null );
	};

	if ( loading ) {
		return (
			<Stack alignItems="center" py={ 4 }>
				<CircularProgress size={ 22 } />
			</Stack>
		);
	}

	if ( ! items.length ) {
		return (
			<Box sx={ { p: 3, textAlign: 'center', border: '1px solid', borderColor: 'divider', borderRadius: 1 } }>
				<Typography variant="body2" color="text.secondary">
					{ 'taxonomy' === objectKind
						? __( 'No taxonomy terms found for this taxonomy.', 'rest-api-firewall' )
						: __( 'No posts found for this post type.', 'rest-api-firewall' ) }
				</Typography>
			</Box>
		);
	}

	return (
		<Stack
			spacing={ 0 }
			sx={ { border: '1px solid', borderColor: 'divider', borderRadius: 1, overflow: 'hidden' } }
		>
			{ items.map( ( item, idx ) => {
				const savedPos = orderedIds.indexOf( item.id );
				const isOrdered = savedPos !== -1;
				const origIdx = ( originalOrder || [] ).findIndex( ( o ) => o.id === item.id );
				const hasMoved = origIdx !== -1 && origIdx !== idx;
				const isDragging = dragId === item.id;
				const isOver = dragOverIdx === idx && dragId !== null && items.findIndex( ( i ) => i.id === dragId ) !== idx;
				const secondaryMeta = 'taxonomy' === objectKind
					? [
						item.slug ? `${ __( 'Slug', 'rest-api-firewall' ) }: ${ item.slug }` : '',
						Number.isInteger( item.count ) ? `${ item.count } ${ __( 'items', 'rest-api-firewall' ) }` : '',
					]
					: [
						item.author_name,
						item.date_created,
						item.date_modified ? `${ __( 'Updated', 'rest-api-firewall' ) }: ${ item.date_modified }` : '',
					];

				return (
					<Box
						key={ item.id }
						draggable
						onDragStart={ ( e ) => handleDragStart( e, idx ) }
						onDragOver={ ( e ) => handleDragOver( e, idx ) }
						onDrop={ ( e ) => handleDrop( e, idx ) }
						onDragEnd={ handleDragEnd }
						sx={ {
							display: 'flex',
							alignItems: 'center',
							gap: 1.5,
							px: 2,
							py: 0.875,
							bgcolor: isDragging ? 'action.selected' : 'background.paper',
							borderBottom: idx < items.length - 1 ? '1px solid' : 'none',
							borderColor: 'divider',
							borderTop: isOver ? '2px solid' : undefined,
							borderTopColor: isOver ? 'primary.main' : undefined,
							cursor: 'grab',
							opacity: isDragging ? 0.45 : 1,
							transition: 'background-color 0.1s',
							'&:hover': { bgcolor: isDragging ? 'action.selected' : 'action.hover' },
						} }
					>
						<DragIndicatorIcon sx={ { fontSize: 16, color: 'text.disabled', flexShrink: 0 } } />
                        <Box sx={ { display: 'flex', alignItems: 'center', gap: 0.75, flexShrink: 0 } }>
                            { isOrdered ? (
                                <Chip label={ `${ savedPos + 1 }` } size="small" color="primary" />
                            ) : (
                                <Chip label={ `${ idx + 1 }` } size="small" />
                            ) }
                            { hasMoved && (
                                <Typography variant="caption" color="text.secondary" sx={ { flexShrink: 0, lineHeight: 'normal' } }>
                                    { __( 'was', 'rest-api-firewall' ) }<br/>{ origIdx + 1 }
                                </Typography>
                            ) }
                        </Box>
						<Stack spacing={ 0.375 } sx={ { flex: 1, minWidth: 0 } }>
							<Typography
								variant="body2"
								sx={ { minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 } }
							>
							{ decodeHtmlEntities( item.label ) || `#${ item.id }` }
							</Typography>
							<Typography
								variant="caption"
								color="text.secondary"
								sx={ { display: 'block', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }
							>
								{ secondaryMeta.filter( Boolean ).join( ' • ' ) || `#${ item.id }` }
							</Typography>
						</Stack>

						<Stack direction="row" spacing={ 0.5 } alignItems="center" flexShrink={ 0 }>
							{ 'post_type' === objectKind && item.status && item.status !== 'publish' && (
								<Chip
									label={ item.status }
									size="small"
									sx={ { fontSize: '0.65rem', height: 18, '& .MuiChip-label': { px: 0.75 } } }
								/>
							) }
							{ 'taxonomy' === objectKind && Number.isInteger( item.count ) && (
								<Chip
									label={ `${ item.count }` }
									size="small"
									sx={ { fontSize: '0.65rem', height: 18, '& .MuiChip-label': { px: 0.75 } } }
								/>
							) }
							
						</Stack>
					</Box>
				);
			} ) }
		</Stack>
	);
}

export function PageDropZone( { direction, disabled, onDrop } ) {
	const { __ } = wp.i18n || {};
	const [ dragOver, setDragOver ] = useState( null );
	const isPrev = direction === 'prev';

	const handleZoneDragOver = ( e, zone ) => {
		if ( disabled ) return;
		e.preventDefault();
		e.dataTransfer.dropEffect = 'move';
		if ( dragOver !== zone ) setDragOver( zone );
	};

	const handleZoneDrop = ( e, zone ) => {
		if ( disabled ) return;
		e.preventDefault();
		setDragOver( null );
		try {
			const raw = e.dataTransfer.getData( 'application/json' );
			const data = raw ? JSON.parse( raw ) : {};
			if ( data.id !== undefined ) {
				onDrop( data.id, direction, zone === 'see' );
			}
		} catch {}
	};

	const handleContainerDragLeave = ( e ) => {
		if ( ! e.currentTarget.contains( e.relatedTarget ) ) {
			setDragOver( null );
		}
	};

	const pageLabel = isPrev
		? __( 'Prev. Page', 'rest-api-firewall' )
		: __( 'Next Page', 'rest-api-firewall' );

	const zoneLabel = ( zone ) =>
		zone === 'drop'
			? __( 'Drop', 'rest-api-firewall' )
			: __( 'Drop & See', 'rest-api-firewall' );

	const textSx = ( zone ) => ( {
		fontSize: '14px',
		lineHeight: 1.2,
		color: dragOver === zone
			? ( zone === 'drop' ? 'text.primary' : 'main.primary' )
			: 'text.secondary',
	} );

	return (
		<>
		<Box sx={ { height: 20, position: 'absolute', top:'50%', left: 0, zIndex: 2 } }>
				<Typography sx={ { ...textSx( 'drop' ),
					textAlign: 'center',
					textTransform: 'uppercase',
					transform: 'rotate(-90deg)',
					color: 'text.secondary',
    				transform: 'translateX(-50px)',
				 } }>{ pageLabel }</Typography>
			</Box>
		<Box
			onDragLeave={ handleContainerDragLeave }
			sx={ {
				width: 50,
				flexShrink: 0,
				height: '70vh', 
				position: 'sticky', 
				top:'15vh',
				display: 'flex',
				flexDirection: 'column',
				border: '1px dashed',
				borderColor: 'divider',
				borderRadius: 1,
				overflow: 'hidden',
				opacity: disabled ? 0.5 : 1,
				pointerEvents: disabled ? 'none' : 'auto',
				userSelect: 'none',
			} }
		>
			
				{ /* Top half: Drop (stay on page) */ }
				<Box
					onDragOver={ ( e ) => handleZoneDragOver( e, 'drop' ) }
					onDrop={ ( e ) => handleZoneDrop( e, 'drop' ) }
					sx={ {
						height: '50%',
						display: 'flex',
						flexDirection: 'column',
						alignItems: 'center',
						justifyContent: 'center',
						gap: 0.5,
						px: 0.5,
						py: 1,
						borderBottom: '1px dashed',
						borderBottomColor: 'divider',
						bgcolor: dragOver === 'drop' ? 'primary.main' : 'action.hover',
						transition: 'background-color 0.15s',
					} }
				>
					<Typography sx={ textSx( 'drop' ) }>{ zoneLabel( 'drop' ) }</Typography>
				</Box>
				{ /* Bottom half: Drop & See (navigate to target page) */ }
				<Box
					onDragOver={ ( e ) => handleZoneDragOver( e, 'see' ) }
					onDrop={ ( e ) => handleZoneDrop( e, 'see' ) }
					sx={ {
						height: '50%',
						display: 'flex',
						flexDirection: 'column',
						alignItems: 'center',
						justifyContent: 'center',
						gap: 0.5,
						px: 0.5,
						py: 1,
						bgcolor: dragOver === 'see' ? 'info.main' : 'background.paper',
						transition: 'background-color 0.15s',
					} }
				>
					<Typography sx={ textSx( 'see' ) }>{ zoneLabel( 'see' ) }</Typography>
				</Box>
		</Box>
		</>
	);
}

function decodeHtmlEntities( str ) {
	if ( ! str || typeof str !== 'string' ) {
		return str;
	}
	const txt = document.createElement( 'textarea' );
	txt.innerHTML = str;
	return txt.value;
}