import Stack from '@mui/material/Stack';
import Grid from '@mui/material/Grid';

import BulkFilters from './BulkFilters';
import FineGrainedFilters from './FineGrainedFilters';
import SiteSettings from './SiteSettingsFilters';
import SortableFilters from './SortableFilters';
import Collections from './Collections';
import Card from '@mui/material/Card';

export default function DataFilters( { form, setField, postTypes } ) {
	return (
		<Stack spacing={ 3 }>
			<Grid container spacing={ 4 } py={ 3 }>
				<Grid size={ { xs: 12, lg: 6 } } spacing={ 4 }>
					<Stack spacing={ 3 }>
						<Card
							variant="outlined"
							sx={ {
								px: { xs: 2, xl: 4 },
								py: { xs: 2, xl: 4 },
							} }
						>
							<Collections
								form={ form }
								setField={ setField }
								postTypes={ postTypes }
							/>
						</Card>
						<Card
							variant="outlined"
							sx={ {
								px: { xs: 2, xl: 4 },
								py: { xs: 2, xl: 4 },
							} }
						>
							<SortableFilters 
								form={form} 
								setField={setField} 
								postTypes={postTypes} 
							/>
						</Card>

						<Card
							variant="outlined"
							sx={ {
								px: { xs: 2, xl: 4 },
								py: { xs: 2, xl: 4 },
							} }
						>
							<BulkFilters
								form={ form }
								setField={ setField }
								postTypes={ postTypes }
							/>
						</Card>
						<Card
							variant="outlined"
							sx={ {
								px: { xs: 2, xl: 4 },
								py: { xs: 2, xl: 4 },
							} }
						>
							<SiteSettings form={ form } setField={ setField } />
						</Card>
					</Stack>
				</Grid>
				<Grid size={ { xs: 12, lg: 6 } }>
					<FineGrainedFilters
						form={ form }
						setField={ setField }
						postTypes={ postTypes }
					/>
				</Grid>
			</Grid>
		</Stack>
	);
}
