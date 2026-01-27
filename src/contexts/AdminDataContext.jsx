import {
	createContext,
	useContext,
	useState,
	useCallback,
} from '@wordpress/element';

const AdminDataContext = createContext( null );

export const AdminDataProvider = ( {
	children,
	adminData: initialAdminData = {},
} ) => {
	const [ adminData, setAdminData ] = useState( initialAdminData );

	const replaceAdminData = useCallback( ( nextData ) => {
		setAdminData( nextData || {} );
	}, [] );

	const updateAdminData = useCallback( ( partial ) => {
		if ( ! partial || typeof partial !== 'object' ) {
			return;
		}
		setAdminData( ( prev ) => ( {
			...prev,
			...partial,
		} ) );
	}, [] );

	const value = {
		adminData,
		setAdminData: replaceAdminData,
		updateAdminData,
	};

	return (
		<AdminDataContext.Provider value={ value }>
			{ children }
		</AdminDataContext.Provider>
	);
};

export const useAdminData = () => {
	const context = useContext( AdminDataContext );
	if ( ! context ) {
		throw new Error( 'useAdminData must be used within AdminDataProvider' );
	}
	return context;
};
