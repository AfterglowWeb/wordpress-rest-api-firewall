import { useState, useEffect } from '@wordpress/element';
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

export function PostOrderList( { items, orderedIds, originalOrderedIds, objectKind, loading, onReorder, singleItem } ) {
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

	useEffect( () => {
		if ( dragId !== null && ! items.some( ( i ) => i.id === dragId ) ) {
			setDragId( null );
			setDragOverIdx( null );
		}
	}, [ items ] ); // eslint-disable-line react-hooks/exhaustive-deps

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
				const currentPos = orderedIds.indexOf( item.id );
				const isOrdered = currentPos !== -1;
				const origGlobalIdx = ( originalOrderedIds || [] ).indexOf( item.id );
				const hasMoved = origGlobalIdx !== -1 && origGlobalIdx !== currentPos;
				const isDragging = dragId === item.id;
				const isOver = dragOverIdx === idx && dragId !== null && dragId !== item.id;
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
					draggable={ ! singleItem }
					onDragStart={ singleItem ? undefined : ( e ) => handleDragStart( e, idx ) }
					onDragOver={ singleItem ? undefined : ( e ) => handleDragOver( e, idx ) }
					onDrop={ singleItem ? undefined : ( e ) => handleDrop( e, idx ) }
					onDragEnd={ singleItem ? undefined : handleDragEnd }
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
						cursor: singleItem ? 'default' : 'grab',
						opacity: isDragging ? 0.45 : 1,
						transition: 'background-color 0.1s',
						'&:hover': { bgcolor: isDragging ? 'action.selected' : ( singleItem ? 'background.paper' : 'action.hover' ) },
						} }
					>
						<DragIndicatorIcon sx={ { fontSize: 16, color: singleItem ? 'transparent' : 'text.disabled', flexShrink: 0 } } />
                        <Box sx={ { display: 'flex', alignItems: 'center', gap: 0.75, flexShrink: 0 } }>
                            { isOrdered && ! singleItem ? (
                                <Chip label={ `${ currentPos + 1 }` } size="small" color={ hasMoved ? 'primary' : 'default' } />
                            ) : (
                                <Chip label={ `${ idx + 1 }` } size="small" />
                            ) }
                            { hasMoved && (
                                <Typography variant="caption" color="text.secondary" sx={ { flexShrink: 0, lineHeight: 'normal' } }>
                                    { __( 'was', 'rest-api-firewall' ) }<br/>{ origGlobalIdx + 1 }
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
							{ 'post_type' === objectKind && item.taxonomies && Object.keys( item.taxonomies ).length > 0 && (
								<Typography
									variant="caption"
									color="text.disabled"
									sx={ { display: 'block', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }
								>
									{ Object.entries( item.taxonomies )
										.map( ( [ tax, terms ] ) => `${ tax }: ${ terms.join( ', ' ) }` )
										.join( ' • ' ) }
								</Typography>
							) }
						</Stack>

						<Stack direction="row" spacing={ 0.5 } alignItems="center" flexShrink={ 0 }>
							{ 'post_type' === objectKind && item.status && item.status !== 'publish' && item.status !== 'inherit' && (
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

export function PageDropZone( { direction, disabled, onDrop, setPage } ) {
	const { __ } = wp.i18n || {};
	const [ dragOver, setDragOver ] = useState( null );
	const [ hovered, setHovered ] = useState( false );
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

	const isExpanded = hovered || !! dragOver;

	const pageLabel = isPrev
		? __( 'Drop in Prev. Page', 'rest-api-firewall' )
		: __( 'Drop in Next Page', 'rest-api-firewall' );

	const zoneLabel = ( zone ) =>
		zone === 'drop'
			? __( 'Drop', 'rest-api-firewall' )
			: __( 'Drop & See Page', 'rest-api-firewall' );

	const textSx = ( zone ) => ( {
		fontSize: '12px',
		lineHeight: 'normal',
		textTransform: 'uppercase',
		textAlign: 'center',
		whiteSpace: 'nowrap',
		writingMode: 'vertical-rl',
		transform: 'rotate(180deg)',
		color: dragOver === zone
			? 'primary.main'
			: 'text.disabled',
	} );

	return (
		<Box
			onMouseEnter={ () => setHovered( true ) }
			onMouseLeave={ () => setHovered( false ) }
			onDragEnter={ () => setHovered( true ) }
			onDragLeave={ ( e ) => {
				handleContainerDragLeave( e );
				if ( ! e.currentTarget.contains( e.relatedTarget ) ) setHovered( false );
			} }
			sx={ {
				width: isExpanded ? 78 : 32,
				flexShrink: 0,
				height: '70vh',
				position: 'sticky',
				top: '15vh',
				display: 'flex',
				justifyContent: 'center',
				flexDirection: isPrev ? 'row' : 'row-reverse',
				borderRadius: 1,
				border: '1px solid',
				borderColor: dragOver ? 'primary.main' : ( hovered ? 'primary.light' : 'divider' ),
				overflow: 'hidden',
				opacity: disabled ? 0.5 : 1,
				pointerEvents: disabled ? 'none' : 'auto',
				userSelect: 'none',
				cursor: 'pointer',
				transition: 'width 0.2s ease, border-color 0.15s',
			} }
		>
			<Box
			sx={ { width: 28, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 0.5, flexShrink: 0 } }
			>
				<Typography 
					variant="caption" 
					sx={ { 
						writingMode: 'vertical-rl',
						transform: 'rotate(180deg)',
						lineHeight: 'normal', 
						color: dragOver ? 'primary.main' : ( hovered ? 'text.primary' : 'text.disabled' ),
						textTransform: 'uppercase',
						fontSize: '10px',
					} }>
					{ pageLabel }
				</Typography>
			</Box>
			<Box sx={ { width: isExpanded ? 50 : 0, px: 0.5, py: 1, display: 'flex', flexDirection: 'column', gap: 1, flexShrink: 0,
				opacity: isExpanded ? 1 : 0, transition: 'all 0.15s ease', pointerEvents: isExpanded ? 'auto' : 'none',
			} }>

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
						borderRadius: 1,
						overflow: 'hidden',
						border: '1px dashed',
						borderColor: 'divider',
						bgcolor: dragOver === 'drop' ? 'action.hover' : 'background.paper',
						transition: 'background-color 0.15s',
					} }
				>
					<Typography sx={ textSx( 'drop' ) }>{ zoneLabel( 'drop' ) }</Typography>
				</Box>

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
						borderRadius: 1,
						overflow: 'hidden',
						border: '1px dashed',
						borderColor: 'divider',
						bgcolor: dragOver === 'see' ? 'action.hover' : 'background.paper',
						transition: 'all 0.25s',
					} }
				>
					<Typography sx={ textSx( 'see' ) }>{ zoneLabel( 'see' ) }</Typography>
				</Box>
			</Box>
		</Box>
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