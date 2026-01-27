export default function formatDate( dateString ) {
	return (
		new Date( dateString ).toLocaleDateString() +
		' ' +
		new Date( dateString ).toLocaleTimeString()
	);
}
