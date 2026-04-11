import { useMemo } from '@wordpress/element';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

/**
 * Shared grouped object-type left nav.
 *
 * @param {Object[]} objectTypes      All public object types: { value, label, source, type }.
 * @param {string}   selectedType     Currently selected value.
 * @param {Function} onSelect         Called with value when an item is clicked.
 * @param {Function} renderItemEnd    Optional (obj, isSelected) => ReactNode rendered at the
 *                                    right end of the label row (e.g. count chip in Collections).
 * @param {Function} renderItemBottom Optional (obj, isSelected) => ReactNode rendered as a
 *                                    second row below the label (e.g. badge chips in Collections).
 * @param {Object[]} extraItems       Optional pinned items appended after a Divider:
 *                                    { value, label, secondary }.
 */
export default function ObjectTypeNav( {
	objectTypes,
	selectedType,
	onSelect,
	renderItemEnd    = null,
	renderItemBottom = null,
	extraItems       = [],
} ) {
	const grouped = useMemo( () => {
		const groups = {};
		objectTypes.filter( ( obj ) => obj.type !== 'author' ).forEach( ( obj ) => {
			const src = obj.source || '';
			if ( ! groups[ src ] ) {
				groups[ src ] = [];
			}
			groups[ src ].push( obj );
		} );
		return Object.entries( groups )
			.sort( ( [ a ], [ b ] ) => {
				if ( a === 'WordPress' ) { return -1; }
				if ( b === 'WordPress' ) { return 1; }
				if ( a === '' ) { return 1; }
				if ( b === '' ) { return -1; }
				return a.localeCompare( b );
			} )
			.map( ( [ source, items ] ) => ( { source, items } ) );
	}, [ objectTypes ] );

	return (
		<Box sx={ { 
			width: 220, 
			flexShrink: 0, 
			borderRight: 1, 
			borderColor: 'divider', 
			py: 4 } }>
			<List dense disablePadding sx={{position: 'sticky', top: 0, bgcolor: 'background.paper'}}>
				{ grouped.map( ( { source, items } ) => (
					<li key={ source }>
						<ul style={ { padding: 0, margin: 0, listStyle: 'none' } }>
							{ items.map( ( obj ) => {
								const isSelected = selectedType === obj.value;
								const itemEnd    = renderItemEnd    ? renderItemEnd( obj, isSelected )    : null;
								const itemBottom = renderItemBottom ? renderItemBottom( obj, isSelected ) : null;
								return (
									<ListItemButton
										key={ obj.value }
										dense
										selected={ isSelected }
										onClick={ () => onSelect( obj.value ) }
										sx={ { borderRadius: 1, mx: 0.5, px: 1, py: 0.75 } }
									>
										<Stack width="100%" gap={ 0.5 }>
											<Stack direction="row" alignItems="center" justifyContent="space-between" gap={ 0.5 }>
												<Stack direction="row" alignItems="center" gap={ 0.75 } flex={ 1 } minWidth={ 0 }>
													<Typography variant="body2" noWrap fontWeight={ isSelected ? 600 : 400 }>
														{ obj.label }
													</Typography>
													<Chip
														label={ obj.value }
														size="small"
														variant="outlined"
														sx={ { fontFamily: 'monospace', fontSize: '0.6rem', height: 16, flexShrink: 0 } }
													/>
												</Stack>
												{ itemEnd }
											</Stack>
											{ itemBottom }
										</Stack>
									</ListItemButton>
								);
							} ) }
						</ul>
					</li>
				) ) }

				{ extraItems.length > 0 && (
					<>
						<Divider sx={ { my: 0.5 } } />
						{ extraItems.map( ( item ) => {
							const isSelected = selectedType === item.value;
							const ItemIcon   = item.icon;
							return (
								<ListItemButton
									key={ item.value }
									dense
									selected={ isSelected }
									onClick={ () => onSelect( item.value ) }
									sx={ { borderRadius: 1, mx: 0.5, px: 1, py: 0.75 } }
								>
									<Stack direction="row" alignItems="center" gap={ 0.75 } width="100%">
										{ ItemIcon && (
											<ItemIcon fontSize="small" sx={ { opacity: 0.7, flexShrink: 0 } } />
										) }
										<Stack flex={ 1 } minWidth={ 0 } gap={ 0 }>
											<Typography variant="body2" noWrap fontWeight={ isSelected ? 600 : 400 }>
												{ item.label }
											</Typography>
											{ item.secondary && (
												<Typography variant="caption" color="text.secondary" sx={ { fontFamily: 'monospace', fontSize: '0.65rem' } }>
													{ item.secondary }
												</Typography>
											) }
										</Stack>
									</Stack>
								</ListItemButton>
							);
						} ) }
					</>
				) }
			</List>
		</Box>
	);
}
