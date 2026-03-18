import {
	createContext,
	useContext,
	useState,
	useEffect,
	useCallback,
	useRef,
} from '@wordpress/element';
import { useApplication } from './ApplicationContext';
import { useDialog, DIALOG_TYPES } from './DialogContext';

const NavigationContext = createContext( null );

const DEFAULT_PANEL = window?.restApiFirewallPro?.isValid ? 'applications' : 'user-rate-limiting';
const LS_PANEL_KEY = 'raf_panel';

function parseHash() {
	const raw = window.location.hash.replace( /^#/, '' );
	if ( ! raw ) {
		const saved = localStorage.getItem( LS_PANEL_KEY );
		return { panel: saved || DEFAULT_PANEL, subKey: null };
	}
	const slash = raw.indexOf( '/' );
	if ( slash === -1 ) {
		return { panel: raw, subKey: null };
	}
	return {
		panel: raw.slice( 0, slash ),
		subKey: raw.slice( slash + 1 ) || null,
	};
}

function buildHash( panel, subKey ) {
	return '#' + panel + ( subKey ? '/' + subKey : '' );
}

export function NavigationProvider( { children } ) {
	const { dirtyFlag, setDirtyFlag } = useApplication();
	const { openDialog } = useDialog();
	const { __ } = wp.i18n || {};
	const [ location, setLocation ] = useState( parseHash );
	const isRevertingRef = useRef( false );

	// Ensure the URL has a hash on first load.
	useEffect( () => {
		if ( ! window.location.hash ) {
			history.replaceState(
				null,
				'',
				buildHash( location.panel, location.subKey )
			);
		}
	}, [] ); // eslint-disable-line react-hooks/exhaustive-deps

	const navigate = useCallback(
		( panel, subKey = null, replace = false ) => {
			const hash = buildHash( panel, subKey || null );
			if ( replace ) {
				history.replaceState( null, '', hash );
			} else {
				history.pushState( null, '', hash );
			}
			setLocation( { panel, subKey: subKey || null } );
			if ( ! subKey ) {
				try {
					localStorage.setItem( LS_PANEL_KEY, panel );
				} catch ( e ) {}
			}
		},
		[]
	);

	const navigateGuarded = useCallback(
		( panel, subKey = null ) => {
			if ( dirtyFlag.has ) {
				openDialog( {
					type: DIALOG_TYPES.CONFIRM,
					title: __( 'Unsaved Changes', 'rest-api-firewall' ),
					content:
						dirtyFlag.message ||
						__(
							'You have unsaved changes. Leave anyway?',
							'rest-api-firewall'
						),
					confirmLabel: __( 'Leave', 'rest-api-firewall' ),
					cancelLabel: __( 'Stay', 'rest-api-firewall' ),
					onConfirm: () => {
						setDirtyFlag( { has: false, message: '' } );
						navigate( panel, subKey );
					},
				} );
				return;
			}
			navigate( panel, subKey );
		},
		[ dirtyFlag, openDialog, navigate, setDirtyFlag, __ ]
	);

	useEffect( () => {
		const handlePopState = () => {
			if ( isRevertingRef.current ) {
				isRevertingRef.current = false;
				return;
			}
			const parsed = parseHash();
			if ( dirtyFlag.has ) {
				isRevertingRef.current = true;
				history.go( 1 );
				openDialog( {
					type: DIALOG_TYPES.CONFIRM,
					title: __( 'Unsaved Changes', 'rest-api-firewall' ),
					content:
						dirtyFlag.message ||
						__(
							'You have unsaved changes. Leave anyway?',
							'rest-api-firewall'
						),
					confirmLabel: __( 'Leave', 'rest-api-firewall' ),
					cancelLabel: __( 'Stay', 'rest-api-firewall' ),
					onConfirm: () => {
						setDirtyFlag( { has: false, message: '' } );
						navigate( parsed.panel, parsed.subKey );
					},
				} );
				return;
			}
			setLocation( parsed );
		};

		window.addEventListener( 'popstate', handlePopState );
		return () => window.removeEventListener( 'popstate', handlePopState );
	}, [ dirtyFlag, openDialog, navigate, setDirtyFlag, __ ] );

	return (
		<NavigationContext.Provider
			value={ { ...location, navigate, navigateGuarded } }
		>
			{ children }
		</NavigationContext.Provider>
	);
}

export function useNavigation() {
	const ctx = useContext( NavigationContext );
	if ( ! ctx ) {
		throw new Error( 'useNavigation must be used within NavigationProvider' );
	}
	return ctx;
}
