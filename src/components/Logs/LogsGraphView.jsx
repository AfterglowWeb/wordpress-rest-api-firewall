import { useMemo } from '@wordpress/element';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import LinearProgress from '@mui/material/LinearProgress';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

const LogsGraphView = ( { rows } ) => {
	const { __ } = wp.i18n || {};

	const stats = useMemo( () => {
		if ( ! rows || rows.length === 0 ) {
			return {
				totalHits: 0,
				uniqueIps: 0,
				ipCounts: [],
				typeCounts: { firewall: 0, webhook: 0, automation: 0 },
				levelCounts: { info: 0, warning: 0, error: 0 },
			};
		}

		const ipSet = new Set();
		const ipCounts = {};
		const typeCounts = { firewall: 0, webhook: 0, automation: 0 };
		const levelCounts = { info: 0, warning: 0, error: 0 };

		rows.forEach( ( row ) => {
			// Count unique IPs
			if ( row.ip ) {
				ipSet.add( row.ip );
				ipCounts[ row.ip ] = ( ipCounts[ row.ip ] || 0 ) + 1;
			}

			// Count by type
			if ( row.type && typeCounts.hasOwnProperty( row.type ) ) {
				typeCounts[ row.type ]++;
			}

			// Count by level
			if ( row.level && levelCounts.hasOwnProperty( row.level ) ) {
				levelCounts[ row.level ]++;
			}
		} );

		// Sort IPs by count descending, take top 10
		const topIps = Object.entries( ipCounts )
			.sort( ( a, b ) => b[ 1 ] - a[ 1 ] )
			.slice( 0, 10 )
			.map( ( [ ip, count ] ) => ( { ip, count } ) );

		return {
			totalHits: rows.length,
			uniqueIps: ipSet.size,
			ipCounts: topIps,
			typeCounts,
			levelCounts,
		};
	}, [ rows ] );

	const LEVEL_COLORS = {
		info: '#2196F3',
		warning: '#FF9800',
		error: '#F44336',
	};

	const TYPE_COLORS = {
		firewall: '#F44336',
		webhook: '#2196F3',
		automation: '#9C27B0',
	};

	return (
		<Stack spacing={ 3 } sx={ { p: 4 } }>
			{/* Key Metrics */}
			<Grid container spacing={ 2 }>
				<Grid item xs={ 12 } sm={ 6 } md={ 3 }>
					<Card>
						<CardContent>
							<Typography color="textSecondary" gutterBottom>
								{ __( 'Total Hits', 'rest-api-firewall' ) }
							</Typography>
							<Typography variant="h5">
								{ stats.totalHits.toLocaleString() }
							</Typography>
						</CardContent>
					</Card>
				</Grid>
				<Grid item xs={ 12 } sm={ 6 } md={ 3 }>
					<Card>
						<CardContent>
							<Typography color="textSecondary" gutterBottom>
								{ __( 'Unique IPs', 'rest-api-firewall' ) }
							</Typography>
							<Typography variant="h5">
								{ stats.uniqueIps.toLocaleString() }
							</Typography>
						</CardContent>
					</Card>
				</Grid>
				<Grid item xs={ 12 } sm={ 6 } md={ 3 }>
					<Card>
						<CardContent>
							<Typography color="textSecondary" gutterBottom>
								{ __( 'Avg Hits/IP', 'rest-api-firewall' ) }
							</Typography>
							<Typography variant="h5">
								{ stats.uniqueIps > 0
									? ( stats.totalHits / stats.uniqueIps ).toFixed( 1 )
									: '0' }
							</Typography>
						</CardContent>
					</Card>
				</Grid>
				<Grid item xs={ 12 } sm={ 6 } md={ 3 }>
					<Card>
						<CardContent>
							<Typography color="textSecondary" gutterBottom>
								{ __( 'Max/IP', 'rest-api-firewall' ) }
							</Typography>
							<Typography variant="h5">
								{ stats.ipCounts.length > 0
									? stats.ipCounts[ 0 ].count
									: '0' }
							</Typography>
						</CardContent>
					</Card>
				</Grid>
			</Grid>

			{/* Type Breakdown */}
			<Card>
				<CardContent>
					<Typography variant="h6" gutterBottom>
						{ __( 'By Type', 'rest-api-firewall' ) }
					</Typography>
					<Stack spacing={ 2 }>
						{ Object.entries( stats.typeCounts ).map(
							( [ type, count ] ) => (
								<Stack key={ type } spacing={ 0.5 }>
									<Stack
										direction="row"
										justifyContent="space-between"
										alignItems="center"
									>
										<Typography variant="body2" sx={ { textTransform: 'capitalize' } }>
											{ type }
										</Typography>
										<Typography variant="body2" color="textSecondary">
											{ count } ({ Math.round( ( count / stats.totalHits ) * 100 ) }%)
										</Typography>
									</Stack>
									<LinearProgress
										variant="determinate"
										value={
											stats.totalHits > 0
												? ( count / stats.totalHits ) * 100
												: 0
										}
										sx={ {
											height: 8,
											borderRadius: 4,
											backgroundColor: '#e0e0e0',
											'& .MuiLinearProgress-bar': {
												backgroundColor: TYPE_COLORS[ type ] || '#999',
												borderRadius: 4,
											},
										} }
									/>
								</Stack>
							)
						) }
					</Stack>
				</CardContent>
			</Card>

			{/* Level Breakdown */}
			<Card>
				<CardContent>
					<Typography variant="h6" gutterBottom>
						{ __( 'By Level', 'rest-api-firewall' ) }
					</Typography>
					<Stack spacing={ 2 }>
						{ Object.entries( stats.levelCounts ).map(
							( [ level, count ] ) => (
								<Stack key={ level } spacing={ 0.5 }>
									<Stack
										direction="row"
										justifyContent="space-between"
										alignItems="center"
									>
										<Typography variant="body2" sx={ { textTransform: 'capitalize' } }>
											{ level }
										</Typography>
										<Typography variant="body2" color="textSecondary">
											{ count } ({ Math.round( ( count / stats.totalHits ) * 100 ) }%)
										</Typography>
									</Stack>
									<LinearProgress
										variant="determinate"
										value={
											stats.totalHits > 0
												? ( count / stats.totalHits ) * 100
												: 0
										}
										sx={ {
											height: 8,
											borderRadius: 4,
											backgroundColor: '#e0e0e0',
											'& .MuiLinearProgress-bar': {
												backgroundColor: LEVEL_COLORS[ level ] || '#999',
												borderRadius: 4,
											},
										} }
									/>
								</Stack>
							)
						) }
					</Stack>
				</CardContent>
			</Card>

			{/* Top IPs */}
			{ stats.ipCounts.length > 0 && (
				<Card>
					<CardContent>
						<Typography variant="h6" gutterBottom>
							{ __( 'Top 10 IP Addresses', 'rest-api-firewall' ) }
						</Typography>
						<Stack spacing={ 2 }>
							{ stats.ipCounts.map( ( { ip, count }, idx ) => (
								<Stack key={ ip } spacing={ 0.5 }>
									<Stack
										direction="row"
										justifyContent="space-between"
										alignItems="center"
									>
										<Typography variant="body2" sx={ { fontFamily: 'monospace' } }>
											{ idx + 1 }. { ip }
										</Typography>
										<Typography variant="body2" color="textSecondary">
											{ count } hits
										</Typography>
									</Stack>
									<LinearProgress
										variant="determinate"
										value={
											stats.ipCounts[ 0 ]?.count
												? ( count / stats.ipCounts[ 0 ].count ) * 100
												: 0
										}
										sx={ {
											height: 6,
											borderRadius: 3,
											backgroundColor: '#e0e0e0',
											'& .MuiLinearProgress-bar': {
												backgroundColor: '#FF6B6B',
												borderRadius: 3,
											},
										} }
									/>
								</Stack>
							) ) }
						</Stack>
					</CardContent>
				</Card>
			) }
		</Stack>
	);
};

export default LogsGraphView;
