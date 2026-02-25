export function isTrulyCustomized( settings, enforceAuth, enforceRateLimit ) {
	const isProtectCustomized =
		settings.protect?.overridden &&
		settings.protect.value !== !! enforceAuth;
	const isRateCustomized =
		settings.rate_limit?.overridden &&
		settings.rate_limit.value !== !! enforceRateLimit;
	const isDisabledCustomized =
		settings.disabled?.overridden && settings.disabled.value !== false;
	return isProtectCustomized || isRateCustomized || isDisabledCustomized;
}

export function countNodeRules( settings, enforceAuth, enforceRateLimit, ownUserCount ) {
	return [
		settings.protect?.overridden &&
			settings.protect.value !== !! enforceAuth,
		settings.rate_limit?.overridden &&
			settings.rate_limit.value !== !! enforceRateLimit,
		settings.disabled?.overridden && settings.disabled.value !== false,
		ownUserCount > 0,
	].filter( Boolean ).length;
}

export function countModifiedDescendants( node, enforceAuth, enforceRateLimit ) {
	let count = 0;
	for ( const child of node.children || [] ) {
		if (
			isTrulyCustomized(
				child.settings || {},
				enforceAuth,
				enforceRateLimit
			)
		) {
			count++;
		}
		count += countModifiedDescendants( child, enforceAuth, enforceRateLimit );
	}
	return count;
}

export function findNodeById( items, id ) {
	for ( const item of items ) {
		if ( item.id === id ) {
			return item;
		}
		if ( item.children ) {
			const found = findNodeById( item.children, id );
			if ( found ) {
				return found;
			}
		}
	}
	return null;
}

export function getAllDescendantMethodIds( node ) {
	const ids = [];
	const collect = ( children ) => {
		for ( const child of children || [] ) {
			if ( child.isMethod ) {
				ids.push( child.id );
			}
			if ( child.children?.length ) {
				collect( child.children );
			}
		}
	};
	collect( node?.children );
	return ids;
}

export function propagateToDescendants( children, key, value ) {
	return ( children || [] ).map( ( child ) => {
		const updated = {
			...child,
			settings: {
				...child.settings,
				[ key ]: {
					value,
					inherited: true,
					overridden: child.settings?.[ key ]?.overridden ?? false,
				},
			},
		};
		if ( updated.children?.length ) {
			updated.children = propagateToDescendants(
				updated.children,
				key,
				value
			);
		}
		return updated;
	} );
}

export function rehydrateApplyToChildren( nodes ) {
	return nodes.map( ( node ) => {
		const updated = { ...node };
		if ( updated.settings?.applyToChildren && updated.children?.length ) {
			for ( const key of [ 'protect', 'rate_limit', 'disabled' ] ) {
				updated.children = propagateToDescendants(
					updated.children,
					key,
					updated.settings[ key ].value
				);
			}
		}
		if ( updated.children?.length ) {
			updated.children = rehydrateApplyToChildren( updated.children );
		}
		return updated;
	} );
}

export function normalizeTree( nodes, parentPath = '', parentSettings = null ) {
	if ( ! nodes || ! Array.isArray( nodes ) ) {
		return [];
	}

	const normalized = nodes.map( ( node ) => {
		const nodePath = node.path || `${ parentPath }/${ node.label }`;
		const nodeSettings = {
			protect: {
				value: false,
				inherited: parentSettings?.protect?.value ?? false,
				overridden: false,
			},
			disabled: {
				value: false,
				inherited: parentSettings?.disabled?.value ?? false,
				overridden: false,
			},
			rate_limit: {
				value: false,
				inherited: parentSettings?.rate_limit?.value ?? false,
				overridden: false,
			},
			rate_limit_time: {
				value: false,
				inherited: parentSettings?.rate_limit_time?.value ?? false,
				overridden: false,
			},
			applyToChildren: false,
		};

		if ( node.settings ) {
			if ( node.settings.protect !== undefined ) {
				nodeSettings.protect = {
					value: !! node.settings.protect,
					inherited: false,
					overridden: !! ( node.settings.protect_overridden ?? false ),
				};
			}
			if ( node.settings.disabled !== undefined ) {
				nodeSettings.disabled = {
					value: !! node.settings.disabled,
					inherited: false,
					overridden: !! ( node.settings.disabled_overridden ?? false ),
				};
			}
			if ( node.settings.rate_limit !== undefined ) {
				nodeSettings.rate_limit = {
					value: !! node.settings.rate_limit,
					inherited: false,
					overridden: !! ( node.settings.rate_limit_overridden ?? false ),
				};
			}
			if ( node.settings.rate_limit_time !== undefined ) {
				nodeSettings.rate_limit_time = {
					value: !! node.settings.rate_limit_time,
					inherited: false,
					overridden: false,
				};
			}
			if ( node.settings.applyToChildren !== undefined ) {
				nodeSettings.applyToChildren = node.settings.applyToChildren;
			}
		}

		const normalizedNode = {
			id: node.id ?? node.uuid ?? crypto.randomUUID(),
			label: node.label,
			path: nodePath,
			settings: nodeSettings,
			permission: node.permission,
			isMethod: node.isMethod ?? false,
			method: node.method,
			route: node.route,
			params: node.params,
			children: [],
		};

		if ( node.children && node.children.length > 0 ) {
			normalizedNode.children = normalizeTree(
				node.children,
				nodePath,
				nodeSettings
			);
		}

		return normalizedNode;
	} );

	if ( parentSettings === null ) {
		return rehydrateApplyToChildren( normalized );
	}
	return normalized;
}
